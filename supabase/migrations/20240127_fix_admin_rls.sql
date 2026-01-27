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
