-- Verify Admin Dashboard Stats
-- Run this in Supabase Studio SQL Editor or via CLI

-- 1. Check total campaigns
SELECT COUNT(*) as total_campaigns FROM campaigns;

-- 2. Check active campaigns
SELECT COUNT(*) as active_campaigns 
FROM campaigns 
WHERE status IN ('sending', 'scheduled');

-- 3. Check total emails sent (from campaigns table)
SELECT SUM(stats_sent) as total_emails_from_campaigns FROM campaigns;

-- 4. Check total sent events (from email_events table)
SELECT COUNT(*) as total_sent_events 
FROM email_events 
WHERE event_type = 'sent';

-- 5. List all campaigns with their stats
SELECT 
    id,
    name,
    status,
    stats_sent,
    total_recipients,
    sent_at,
    created_at
FROM campaigns
ORDER BY created_at DESC;

-- 6. Check emails sent in last 7 days (from campaigns)
SELECT 
    DATE(sent_at) as date,
    COUNT(*) as campaigns_count,
    SUM(stats_sent) as emails_sent
FROM campaigns
WHERE sent_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;
