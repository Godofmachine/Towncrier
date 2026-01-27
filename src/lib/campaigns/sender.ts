import { createClient } from "@supabase/supabase-js";
import { getGmailClient, createEmailBody } from "@/lib/email/gmail-service";

// SECURITY: Content validation to prevent spam/phishing
function validateEmailContent(content: string, subject: string) {
    // Check for spam keywords
    const spamKeywords = [
        'viagra', 'cialis', 'lottery', 'winner', 'claim your prize',
        'click here now', 'limited time offer', 'act now', 'congratulations you won',
        'nigerian prince', 'inheritance', 'free money', 'weight loss miracle'
    ];

    const lowerContent = (content + ' ' + subject).toLowerCase();
    const foundSpamWords = spamKeywords.filter(kw => lowerContent.includes(kw));

    if (foundSpamWords.length >= 3) {
        throw new Error(`Content flagged as potential spam. Keywords detected: ${foundSpamWords.join(', ')}`);
    }

    // Check for excessive links (spam indicator)
    const linkCount = (content.match(/<a\s+href/gi) || []).length;
    if (linkCount > 15) {
        throw new Error(`Too many links detected (${linkCount}). Maximum 15 links allowed per email.`);
    }

    // Validate subject line length
    if (subject.length > 200) {
        throw new Error('Subject line too long (max 200 characters)');
    }

    if (subject.length < 1) {
        throw new Error('Subject line is required');
    }

    // Check for suspicious patterns (all caps subject)
    const capsRatio = (subject.match(/[A-Z]/g) || []).length / subject.length;
    if (subject.length > 10 && capsRatio > 0.7) {
        throw new Error('Subject line appears to be spam (excessive capitalization)');
    }
}

// SECURITY: Sanitize HTML content to prevent XSS
async function sanitizeHTML(html: string): Promise<string> {
    const DOMPurify = (await import('isomorphic-dompurify')).default;
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'blockquote', 'code', 'pre', 'img', 'hr', 'table', 'thead',
            'tbody', 'tr', 'td', 'th', 'div', 'span'
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'class', 'id', 'width', 'height'],
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false
    });
}

// We need a Supabase client passed in (usually the Admin client for cron, or Server client for user actions)
// Or we can just use the Admin client internally if we pass the user_id.

export async function sendCampaign({
    userId,
    campaignId, // Optional, if existing
    name,
    subject,
    content,
    recipients,
    attachments
}: {
    userId: string;
    campaignId?: string;
    name: string;
    subject: string;
    content: string;
    recipients: any[];
    attachments: any[];
}) {
    // 1. Initialize Supabase Admin for data fetching (tokens etc)
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Get Gmail Client
    const gmail = await getGmailClient(userId);

    // ... imports ...

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 3. SECURITY: Enforce per-campaign recipient limit
    const MAX_RECIPIENTS_PER_CAMPAIGN = 500;
    if (recipients.length > MAX_RECIPIENTS_PER_CAMPAIGN) {
        throw new Error(`Campaign exceeds maximum recipients limit (${MAX_RECIPIENTS_PER_CAMPAIGN}). Please split into multiple campaigns.`);
    }

    // 4. Get User Profile for "From" address and rate limit check
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('gmail_email, full_name, company_name, emails_sent_today, daily_send_limit, last_reset_date')
        .eq('id', userId)
        .single();

    if (!profile?.gmail_email) {
        throw new Error("Gmail not connected");
    }

    // 5. SECURITY: Check and enforce daily send limit
    const today = new Date().toISOString().split('T')[0];
    const dailyLimit = profile.daily_send_limit || 500;
    let currentUsage = profile.emails_sent_today || 0;

    // Reset counter if it's a new day
    if (profile.last_reset_date !== today) {
        currentUsage = 0;
        await supabaseAdmin.from('profiles').update({
            emails_sent_today: 0,
            last_reset_date: today
        }).eq('id', userId);
    }

    // Check if this campaign would exceed the limit
    if (currentUsage + recipients.length > dailyLimit) {
        throw new Error(
            `Daily send limit would be exceeded. Current: ${currentUsage}, Limit: ${dailyLimit}, Attempting: ${recipients.length}. ` +
            `Available today: ${dailyLimit - currentUsage} emails.`
        );
    }

    // 6. SECURITY: Sanitize HTML content to prevent XSS
    const sanitizedContent = await sanitizeHTML(content);

    // 7. SECURITY: Content validation (after sanitization)
    validateEmailContent(sanitizedContent, subject);

    const from = `"${profile.full_name || 'The Towncrier User'}" <${profile.gmail_email}>`;

    // 4. Ensure Campaign Record Exists (DB First)
    let activeCampaignId = campaignId;
    const campaignPayload = {
        user_id: userId,
        name: name,
        subject: subject,
        content: sanitizedContent, // SECURITY: Use sanitized content
        status: 'sending', // Temporary status
        total_recipients: recipients.length,
        sent_at: new Date().toISOString()
    };

    if (activeCampaignId) {
        // Update existing
        await supabaseAdmin.from('campaigns').update(campaignPayload).eq('id', activeCampaignId);
    } else {
        // Create new
        const { data: newCamp, error } = await supabaseAdmin.from('campaigns').insert(campaignPayload).select().single();
        if (error) throw error;
        activeCampaignId = newCamp.id;
    }

    let sentCount = 0;

    // 5. Pre-register Recipients to get Tracking IDs
    // We do this individually or in batch? Batch is better for DB, but we need the IDs back mapped to recipients.
    // Let's do a loop for now, optimizing later if <1000 users. Or insert all, then fetch back.
    // For safety and easy mapping, loop insert is easiest for MVP despite N+1.
    // Actually, we can just insert and get the ID back immediately.

    for (const recipient of recipients) {
        // A. Create/Get Recipient Log
        // Check if exists (e.g. retry)
        let trackingId = "";

        // This query might be slow in loop, optimization: Batch insert all first, then process.
        // But let's stick to safe logic:
        const { data: recLog, error: logError } = await supabaseAdmin
            .from('campaign_recipients')
            .upsert({
                campaign_id: activeCampaignId,
                recipient_id: recipient.id || recipient.recipient_id, // Handle different objects if needed. Ideally recipient has .id
                status: 'pending'
            }, { onConflict: 'campaign_id, recipient_id' })
            .select('id')
            .single();

        if (recLog) trackingId = recLog.id;

        // B. Personalize Content
        const replaceVariables = (text: string) => {
            let res = text
                .replace(/{{first_name}}/g, recipient.first_name || '')
                .replace(/{{last_name}}/g, recipient.last_name || '')
                .replace(/{{email}}/g, recipient.email || '');

            if (recipient.custom_fields) {
                Object.entries(recipient.custom_fields).forEach(([key, value]) => {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    res = res.replace(regex, value as string);
                });
            }
            return res;
        };

        let personalizedContent = replaceVariables(sanitizedContent); // SECURITY: Use sanitized content
        const personalizedSubject = replaceVariables(subject);

        // C. Inject Tracking (Pixel & Links)
        if (trackingId) {
            // 1. Pixel
            const pixelHtml = `<img src="${APP_URL}/api/track/open/${trackingId}" alt="" width="1" height="1" style="display:none;" />`;
            // Append before </body> or at end
            if (personalizedContent.includes("</body>")) {
                personalizedContent = personalizedContent.replace("</body>", `${pixelHtml}</body>`);
            } else {
                personalizedContent += pixelHtml;
            }

            // 2. Click Tracking (Regex Replace Hrefs)
            // Matches href="http..." using capture group
            personalizedContent = personalizedContent.replace(/href=["'](http[^"']+)["']/g, (match, url) => {
                // Encode URL
                const trackUrl = `${APP_URL}/api/track/click?u=${encodeURIComponent(url)}&id=${trackingId}`;
                return `href="${trackUrl}"`;
            });
        }

        const rawMessage = createEmailBody(
            recipient.email,
            from,
            personalizedSubject,
            personalizedContent, // Now with tracking!
            attachments
        );

        try {
            const res = await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: rawMessage
                }
            });

            // Success
            sentCount++;

            if (trackingId) {
                await supabaseAdmin.from('campaign_recipients').update({
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                    message_id: res.data.id
                }).eq('id', trackingId);
            }

            // SECURITY: Add delay between sends to avoid Gmail spam detection
            // 100ms delay = max 10 emails/second, well under Gmail's limits
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (e: any) {
            console.error(`Failed to send to ${recipient.email}`, e);
            if (trackingId) {
                await supabaseAdmin.from('campaign_recipients').update({
                    status: 'failed',
                    error_message: e.message
                }).eq('id', trackingId);
            }
        }
    }

    // 6. Update Final Campaign Status and Usage Counter
    await supabaseAdmin.from('campaigns').update({
        status: 'sent',
        stats_sent: sentCount
    }).eq('id', activeCampaignId);

    // SECURITY: Update daily usage counter
    await supabaseAdmin.from('profiles').update({
        emails_sent_today: currentUsage + sentCount
    }).eq('id', userId);

    return sentCount;
}
