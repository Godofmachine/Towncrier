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

        // 2. Get User Profile for "From" address
        const { data: profile } = await supabase
            .from('profiles')
            .select('gmail_email, full_name, company_name')
            .eq('id', user.id)
            .single();

        if (!profile?.gmail_email) {
            return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
        }

        const from = `"${profile.full_name || 'The Towncrier User'}" <${profile.gmail_email}>`;
        let sentCount = 0;

        // 3. Send Loop (Naive implementation for MVP - sequential)
        // In production, use a queue (BullMQ/Inngest)
        for (const recipient of recipients) {
            // Simple personalization placeholder replacement
            const personalizedContent = content
                .replace(/{{first_name}}/g, recipient.first_name || '')
                .replace(/{{last_name}}/g, recipient.last_name || '')
                .replace(/{{email}}/g, recipient.email || '')
                .replace(/{{company}}/g, recipient.custom_fields?.company || '');

            const rawMessage = createEmailBody(
                recipient.email,
                from,
                subject,
                personalizedContent,
                attachments // Pass attachments
            );

            await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: rawMessage
                }
            });
            sentCount++;
        }

        // 4. Log Campaign
        const { error: dbError } = await supabase.from('campaigns').insert({
            user_id: user.id,
            name: name,
            subject: subject,
            content: content,
            status: 'sent',
            total_recipients: recipients.length,
            stats_sent: sentCount,
            sent_at: new Date().toISOString()
        });

        if (dbError) console.error("Failed to log campaign:", dbError);

        return NextResponse.json({ success: true, sent: sentCount });

    } catch (error: any) {
        console.error("Send Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
