import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendCampaign } from "@/lib/campaigns/sender";

export async function GET(req: Request) {
    // Verify Cron Secret (Optional but recommended for Vercel Cron)
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new Response('Unauthorized', { status: 401 });
    // }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // 1. Fetch campaigns that are 'scheduled' with time <= NOW()
        const { data: campaigns } = await supabaseAdmin
            .from('campaigns')
            .select('*')
            .eq('status', 'scheduled')
            .lte('scheduled_at', new Date().toISOString());

        if (!campaigns || campaigns.length === 0) {
            return NextResponse.json({ message: "No scheduled campaigns to process" });
        }

        const results = [];

        // 2. Process each campaign
        for (const campaign of campaigns) {
            console.log(`Processing campaign ${campaign.id}...`);

            // Fetch Recipients for this campaign
            // We need to know WHO to send to.
            // Problem: The current schema stores 'campaign_recipients' only *after* update?
            // Or does the UI snapshot them?
            // Ah, looking at the UI, 'handleSend' calculates recipients dynamically.
            // For scheduled campaigns, we effectively need to store the 'target_config' (e.g. "Group X" or "All")
            // OR we need to generate the 'campaign_recipients' rows upfront with status 'pending' when scheduling.

            // LET'S ASSUME: The UI for scheduling creates the 'campaign_recipients' with status 'pending'.
            // I need to update the UI to do that.

            const { data: recipientsVars } = await supabaseAdmin
                .from('campaign_recipients')
                .select('recipient_id, recipients:recipient_id(*)')
                .eq('campaign_id', campaign.id);

            if (!recipientsVars) continue;

            // Map back to flat structure
            const recipientList = recipientsVars.map((item: any) => item.recipients);

            // Execute Send
            // Note: Attachments currently aren't stored in DB for draft campaigns in this schema (unless in content?)
            // If attachments are needed, we need a storage bucket. For now assuming text-only or standard.

            await sendCampaign({
                userId: campaign.user_id,
                campaignId: campaign.id,
                name: campaign.name,
                subject: campaign.subject,
                content: campaign.content,
                recipients: recipientList,
                attachments: [] // Attachments unimplemented for scheduled (need storage)
            });

            results.push({ id: campaign.id, sent: recipientList.length });
        }

        return NextResponse.json({ success: true, processed: results });

    } catch (err: any) {
        console.error("Cron Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
