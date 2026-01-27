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
