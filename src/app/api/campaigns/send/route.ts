import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGmailClient, createEmailBody } from "@/lib/email/gmail-service";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { recipients, subject, content, attachments, name } = body;

        // 1. Get Gmail Client
        const gmail = await getGmailClient(user.id);

        // 2. Get User Profile for "From" address & Quota
        const { data: profile } = await supabase
            .from('profiles')
            .select('gmail_email, full_name, company_name, emails_sent_today, daily_send_limit, last_reset_date')
            .eq('id', user.id)
            .single();

        if (!profile?.gmail_email) {
            return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
        }

        // Check & Reset Daily Limit
        const todayStr = new Date().toISOString().split('T')[0];
        let currentUsage = profile.emails_sent_today || 0;

        if (profile.last_reset_date !== todayStr) {
            currentUsage = 0;
            // We'll update the reset date in the DB at the end of the transaction
        }

        const limit = profile.daily_send_limit || 500;
        if (currentUsage + recipients.length > limit) {
            return NextResponse.json({
                error: `Daily limit exceeded. You have ${limit - currentUsage} emails left today.`
            }, { status: 403 });
        }

        const from = `"${profile.full_name || 'The Towncrier User'}" <${profile.gmail_email}>`;

        // 3. Create Campaign Record FIRST (to get ID for events)
        const { data: campaign, error: camError } = await supabase.from('campaigns').insert({
            user_id: user.id,
            name: name,
            subject: subject,
            content: content,
            status: 'sending',
            total_recipients: recipients.length,
            stats_sent: 0,
            sent_at: new Date().toISOString()
        }).select().single();

        if (camError || !campaign) {
            throw new Error("Failed to create campaign record: " + (camError?.message || "Unknown error"));
        }

        let sentCount = 0;

        // 4. Send Loop
        for (const recipient of recipients) {
            try {
                // A. Create Campaign Recipient Record
                const { data: cr, error: crError } = await supabase.from('campaign_recipients').insert({
                    campaign_id: campaign.id,
                    recipient_id: recipient.id,
                    status: 'pending' // Will update to sent after success
                }).select().single();

                if (crError) console.error("Failed to create CR:", crError);

                // B. Prepare Content
                const personalizedContent = content
                    .replace(/{{first_name}}/g, recipient.first_name || '')
                    .replace(/{{last_name}}/g, recipient.last_name || '')
                    .replace(/{{email}}/g, recipient.email || '')
                    .replace(/{{company}}/g, recipient.custom_fields?.company || '');

                const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/track/open/${cr.id}" alt="" width="1" height="1" style="display:none;" />`;
                const finalContent = personalizedContent + trackingPixel;

                const rawMessage = createEmailBody(
                    recipient.email,
                    from,
                    subject,
                    finalContent,
                    attachments
                );

                // C. Send via Gmail
                await gmail.users.messages.send({
                    userId: 'me',
                    requestBody: {
                        raw: rawMessage
                    }
                });

                // D. Update Status & Log Event
                sentCount++;

                // Update CR status
                if (cr) {
                    await supabase.from('campaign_recipients').update({
                        status: 'sent',
                        sent_at: new Date().toISOString()
                    }).eq('id', cr.id);
                }

                // Log 'sent' event (Crucial for Dashboard Analytics)
                await supabase.from('email_events').insert({
                    campaign_id: campaign.id,
                    recipient_id: recipient.id,
                    event_type: 'sent',
                    created_at: new Date().toISOString()
                });

            } catch (sendError) {
                console.error(`Failed to send to ${recipient.email}:`, sendError);
                // We continue to next recipient
            }
        }

        // 5. Update Campaign Stats & Profile Quota
        await Promise.all([
            supabase.from('campaigns').update({
                status: 'sent',
                stats_sent: sentCount
            }).eq('id', campaign.id),

            supabase.from('profiles').update({
                emails_sent_today: currentUsage + sentCount,
                last_reset_date: todayStr
            }).eq('id', user.id)
        ]);

        return NextResponse.json({ success: true, sent: sentCount });

    } catch (error: any) {
        console.error("Send Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
