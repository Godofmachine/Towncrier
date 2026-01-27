import { createClient } from "@supabase/supabase-js";
import { getGmailClient, createEmailBody } from "@/lib/email/gmail-service";

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

    // 3. Get User Profile for "From" address
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('gmail_email, full_name, company_name')
        .eq('id', userId)
        .single();

    if (!profile?.gmail_email) {
        throw new Error("Gmail not connected");
    }

    const from = `"${profile.full_name || 'The Towncrier User'}" <${profile.gmail_email}>`;
    let sentCount = 0;

    // 4. Send Loop
    // In production, use a queue (BullMQ/Inngest)
    for (const recipient of recipients) {
        // Simple personalization
        let personalizedContent = content
            .replace(/{{first_name}}/g, recipient.first_name || '')
            .replace(/{{last_name}}/g, recipient.last_name || '')
            .replace(/{{email}}/g, recipient.email || '');

        // Custom fields
        if (recipient.custom_fields) {
            Object.entries(recipient.custom_fields).forEach(([key, value]) => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                personalizedContent = personalizedContent.replace(regex, value as string);
            });
        }

        const rawMessage = createEmailBody(
            recipient.email,
            from,
            subject,
            personalizedContent,
            attachments
        );

        try {
            await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: rawMessage
                }
            });
            sentCount++;
        } catch (e) {
            console.error(`Failed to send to ${recipient.email}`, e);
            // Continue to next recipient
        }
    }

    // 5. Update/Insert Campaign Log
    const payload = {
        user_id: userId,
        name: name,
        subject: subject,
        content: content,
        status: 'sent',
        total_recipients: recipients.length,
        stats_sent: sentCount,
        sent_at: new Date().toISOString()
    };

    if (campaignId) {
        // Update existing campaign (was scheduled)
        await supabaseAdmin.from('campaigns').update(payload).eq('id', campaignId);
    } else {
        // Insert new (immediate send)
        await supabaseAdmin.from('campaigns').insert(payload);
    }

    return sentCount;
}
