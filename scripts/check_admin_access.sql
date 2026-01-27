-- Quick diagnostic to check what admins can see
-- Run this as your admin user in Supabase SQL Editor

-- Check current user role
SELECT id, email, role FROM profiles WHERE id = auth.uid();

-- Check if get_my_role function works
SELECT public.get_my_role() as my_role;

-- Count campaigns visible to current user
SELECT COUNT(*) as campaigns_i_can_see FROM campaigns;

-- Count email_events visible to current user  
SELECT COUNT(*) as events_i_can_see FROM email_events;

-- Total campaigns in database (bypassing RLS with admin privileges if available)
SELECT 
    (SELECT COUNT(*) FROM campaigns) as total_campaigns,
    (SELECT COUNT(*) FROM campaigns WHERE status IN ('sending', 'scheduled')) as active_campaigns,
    (SELECT SUM(COALESCE(stats_sent, 0)) FROM campaigns) as total_emails_from_campaigns,
    (SELECT COUNT(*) FROM email_events WHERE event_type = 'sent') as total_sent_events;
