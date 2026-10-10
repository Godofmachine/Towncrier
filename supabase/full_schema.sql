-- ==========================================
-- Migration: 20240125000000_initial_schema.sql
-- ==========================================
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES (Users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  plan_tier TEXT DEFAULT 'free',
  gmail_connected BOOLEAN DEFAULT false,
  gmail_email TEXT,
  daily_send_limit INT DEFAULT 500,
  emails_sent_today INT DEFAULT 0,
  emails_sent_this_month INT DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GMAIL TOKENS (Secure storage)
CREATE TABLE public.gmail_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RECIPIENTS (Contacts)
CREATE TABLE public.recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb, -- Flexible schema for extra data
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active', -- active, unsubscribed, bounced
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- BROADCAST GROUPS
CREATE TABLE public.broadcast_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  color TEXT DEFAULT '#4f46e5', -- For UI visualization
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GROUP MEMBERS (Junction)
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES public.broadcast_groups(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.recipients(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, recipient_id)
);

-- EMAIL TEMPLATES
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT,
  content TEXT, -- HTML content
  variables TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CAMPAIGNS
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  from_name TEXT,
  reply_to TEXT,
  status TEXT DEFAULT 'draft', -- draft, scheduled, sending, sent, failed
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  total_recipients INT DEFAULT 0,
  stats_sent INT DEFAULT 0,
  stats_opened INT DEFAULT 0,
  stats_clicked INT DEFAULT 0,
  stats_bounced INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CAMPAIGN RECIPIENTS (Tracking individual emails)
CREATE TABLE public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.recipients(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sent, failed, bounced
  message_id TEXT, -- Gmail Message ID
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  UNIQUE(campaign_id, recipient_id)
);

-- EMAIL EVENTS (Granular tracking log)
CREATE TABLE public.email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.recipients(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- sent, opened, clicked, bounced
  user_agent TEXT,
  ip_address TEXT,
  url TEXT, -- For clicks
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_recipients_user_email ON recipients(user_id, email);
CREATE INDEX idx_recipients_tags ON recipients USING GIN(tags);
CREATE INDEX idx_recipients_custom_fields ON recipients USING GIN(custom_fields);
CREATE INDEX idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_status ON campaign_recipients(status);

-- RLS POLICIES (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- SIMPLE POLICY: Users can only see their own data
-- (Note: In production, we'd need more granular policies, especially for shared templates)

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own recipients" ON recipients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own groups" ON broadcast_groups FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own campaigns" ON campaigns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own templates" ON email_templates FOR ALL USING (auth.uid() = user_id);

-- TRIGGER: Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();



-- ==========================================
-- Migration: 20240127_add_roles.sql
-- ==========================================
-- Add role column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin'));

-- Set initial superadmin
UPDATE public.profiles
SET role = 'superadmin'
WHERE email = 'samueladeniran016@gmail.com';

-- Update RLS Policies for Profiles

-- Allow admins and superadmins to view all profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile OR admins can view all" ON public.profiles
FOR SELECT USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- Allow superadmins to update any profile (to change roles)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile OR superadmins can update all" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);



-- ==========================================
-- Migration: 20240127_admin_view_all_data.sql
-- ==========================================
-- Add admin access to campaigns and email_events tables
-- This allows admins to see system-wide data for the admin dashboard

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "admin_view_all_campaigns" ON public.campaigns;

-- New policy: Users see own campaigns, admins see all
CREATE POLICY "Users can view own campaigns OR admins can view all" ON public.campaigns
FOR SELECT USING (
  auth.uid() = user_id OR 
  public.get_my_role() IN ('admin', 'superadmin')
);

-- Update existing ALL policy to also check for admin role
DROP POLICY IF EXISTS "Users can view own campaigns" ON public.campaigns;
CREATE POLICY "Users manage own campaigns OR admins manage all" ON public.campaigns
FOR ALL USING (
  auth.uid() = user_id OR 
  public.get_my_role() IN ('admin', 'superadmin')
);

-- Email Events - Allow admins to view all events
DROP POLICY IF EXISTS "admin_view_all_email_events" ON public.email_events;
CREATE POLICY "Admins can view all email events" ON public.email_events
FOR SELECT USING (
  public.get_my_role() IN ('admin', 'superadmin')
);

-- Campaign Recipients - Allow admins to view all
DROP POLICY IF EXISTS "admin_view_all_campaign_recipients" ON public.campaign_recipients;
CREATE POLICY "Admins can view all campaign recipients" ON public.campaign_recipients
FOR SELECT USING (
  public.get_my_role() IN ('admin', 'superadmin')
);



-- ==========================================
-- Migration: 20240127_encrypt_tokens.sql
-- ==========================================
-- SECURITY: Migrate gmail_tokens to use encrypted storage
-- This migration adds encrypted columns and provides functions for migration

-- 1. Add encrypted columns to gmail_tokens table
ALTER TABLE gmail_tokens 
ADD COLUMN IF NOT EXISTS encrypted_access_token TEXT,
ADD COLUMN IF NOT EXISTS encrypted_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT FALSE;

-- 2. Add comment explaining the columns
COMMENT ON COLUMN gmail_tokens.encrypted_access_token IS 'Encrypted OAuth access token (AES-256-GCM)';
COMMENT ON COLUMN gmail_tokens.encrypted_refresh_token IS 'Encrypted OAuth refresh token (AES-256-GCM)';
COMMENT ON COLUMN gmail_tokens.is_encrypted IS 'Flag indicating if this record uses encrypted tokens';

-- 3. Create index for faster lookups on encrypted flag
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_encrypted ON gmail_tokens(is_encrypted);

-- Note: The actual encryption/decryption happens in the application layer
-- Old tokens in 'access_token' and 'refresh_token' columns remain until migrated
-- New tokens will be stored in 'encrypted_*' columns

-- Migration strategy:
-- 1. Application will check is_encrypted flag
-- 2. If FALSE, read from old columns (backward compatible)
-- 3. If TRUE, decrypt from new columns
-- 4. On token refresh, always write to encrypted columns and set is_encrypted = TRUE
-- 5. Eventually, drop old columns when all tokens are migrated (manual step, not automated)



-- ==========================================
-- Migration: 20240127_fix_admin_rls.sql
-- ==========================================
-- Fix RLS policies for admin access
-- Simplify to avoid recursion issues

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view own campaigns OR admins can view all" ON public.campaigns;
DROP POLICY IF EXISTS "Users manage own campaigns OR admins manage all" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can view all email events" ON public.email_events;
DROP POLICY IF EXISTS "Admins can view all campaign recipients" ON public.campaign_recipients;

-- Campaigns: Users see own, admins see all (using direct subquery to avoid recursion)
CREATE POLICY "campaigns_select_policy" ON public.campaigns
FOR SELECT USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Campaigns: Users manage own, admins manage all
CREATE POLICY "campaigns_all_policy" ON public.campaigns
FOR ALL USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Email Events: Admins can view all
CREATE POLICY "email_events_admin_select" ON public.email_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Campaign Recipients: Admins can view all
CREATE POLICY "campaign_recipients_admin_select" ON public.campaign_recipients
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
  )
);



-- ==========================================
-- Migration: 20240127_fix_newsletter_rls.sql
-- ==========================================
-- FIX: Add INSERT policy for newsletter_subscribers
-- The previous migration only added SELECT and UPDATE, causing 'upsert' (insert) to fail.

CREATE POLICY "Users can insert own subscription" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Optional: Ensure Notifications also has insert if we ever need it from client (though triggers handle it usually)
-- For now, just fixing the reported error.



-- ==========================================
-- Migration: 20240127_fix_rls_recursion.sql
-- ==========================================
-- FIX: Avoid infinite recursion in RLS policies

-- 1. Create a helper function to access role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update SELECT Policy
DROP POLICY IF EXISTS "Users can view own profile OR admins can view all" ON public.profiles;
CREATE POLICY "Users can view own profile OR admins can view all" ON public.profiles
FOR SELECT USING (
  auth.uid() = id OR 
  (public.get_my_role() IN ('admin', 'superadmin'))
);

-- 3. Update UPDATE Policy
DROP POLICY IF EXISTS "Users can update own profile OR superadmins can update all" ON public.profiles;
CREATE POLICY "Users can update own profile OR superadmins can update all" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id OR 
  (public.get_my_role() = 'superadmin')
);



-- ==========================================
-- Migration: 20240127_notifications_and_newsletter.sql
-- ==========================================
-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT DEFAULT 'info', -- info, success, warning, error
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NEWSLETTER SUBSCRIBERS
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'subscribed', -- subscribed, unsubscribed
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Newsletter policies (Admin can view all, User can view own)
-- For now, simple user policy:
CREATE POLICY "Users can view own subscription" ON newsletter_subscribers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON newsletter_subscribers FOR UPDATE USING (auth.uid() = user_id);
-- (Admin policies would be handled by Service Role key usually, so explicit admin policy optional if using admin client)

-- TRIGGER: Welcome Notification
CREATE OR REPLACE FUNCTION public.handle_new_user_notification() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    new.id, 
    'success', 
    'Welcome to Towncrier!', 
    'Your account has been successfully created. Connect your Gmail to start sending.'
  );
  
  -- Auto-subscribe to newsletter? (Optional, let's do it for growth, user can opt-out)
  INSERT INTO public.newsletter_subscribers (user_id, email, status)
  VALUES (new.id, new.email, 'subscribed');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_notification
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_notification();

-- TRIGGER: Gmail Connected Notification (Admin Alert / User Success)
CREATE OR REPLACE FUNCTION public.handle_gmail_connected() 
RETURNS TRIGGER AS $$
BEGIN
  -- Notify User
  IF (old.gmail_connected = false AND new.gmail_connected = true) THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      new.id, 
      'success', 
      'Gmail Connected', 
      'You are now ready to send campaigns directly from your authorized Gmail account.'
    );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_update_notify
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_gmail_connected();



-- ==========================================
-- Migration: 20240128_public_newsletter.sql
-- ==========================================
-- Migration: Allow public newsletter subscriptions
-- Description: Updates newsletter_subscribers to allow nullable user_id and adds name fields.

-- 1. Make user_id nullable
ALTER TABLE public.newsletter_subscribers 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add first_name and last_name
ALTER TABLE public.newsletter_subscribers 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- 3. Add unique constraint on email (since user_id is no longer the sole unique identifier or required)
ALTER TABLE public.newsletter_subscribers 
ADD CONSTRAINT newsletter_subscribers_email_key UNIQUE (email);

-- 4. Update RLS policies
-- Allow anyone to insert (upsert)
CREATE POLICY "Public can subscribe" ON public.newsletter_subscribers
FOR INSERT 
WITH CHECK (true);

-- Allow public to update their own subscription IF they match the email (this is tricky without auth, usually we only allow insert/upsert)
-- For now, let's just allow INSERT. If they try to subscribe again with same email, the upsert logic in API will handle it via service role or we rely on the UNIQUE constraint and let the API handle the update via admin/service role client if needed, OR we trust the policy.
-- Actually, for public forms, usually we just INSERT. If conflict, we might need a way to update. 
-- But standard Supabase Client from anon key can only INSERT if policy allows.
-- If we want "Upsert", we need UPDATE permissions too? Or is INSERT enough for "ON CONFLICT DO UPDATE"?
-- It usually requires UPDATE permission if the row exists.
-- But we can't really secure "UPDATE" by email for anonymous users easily (anyone could overwrite anyone's sub status by guessing email).
-- SO: Secure approach: Public only INSERTS. If exists, API handles it (maybe via Service Role to update if valid).
-- Or, we just say "Already subscribed".
-- Let's stick to simple INSERT policy for anon.
-- The API route uses `createClient` from `@/lib/supabase/server`. If that uses cookie auth, it's user scope. If it's anon, it's anon scope.

-- Let's ensure the API uses Service Role if operating on behalf of a public user to ENSURE we can upsert without exposing RLS security holes? 
-- OR, just allow insert for now.

-- NOTE: existing policies rely on `auth.uid() = user_id`.
-- We need a policy for anonymous insertion.



