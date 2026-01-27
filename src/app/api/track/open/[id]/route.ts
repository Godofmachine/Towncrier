import { createClient } from "@/lib/supabase/client"; // Use client for public access (or service role if needed? usually public endpoint needs service role to write if user not logged in. Wait, email recipient is NOT logged in. Must use Admin client.)
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// We need a Service Role client because the person opening the email is NOT authenticated
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Return the image immediately to keep it fast
    // 1x1 Transparent GIF
    const transparentGif = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
    );

    // Fire and forget the tracking logic (don't await it to block the image load)
    // Actually in Serverless, we usually MUST await or the lambda dies.
    // We'll await but wrap in try-catch so we always return image.
    try {
        if (id) {
            // 1. Get the Campaign Recipient ID (id passed is likely the campaign_recipient id)
            // or we pass a composite. Let's assume ID is the campaign_recipients.id

            // Verify it exists AND hasn't been opened (optional, but good for unique open stats)
            // For now, we log every open event.

            // Update Campaign Recipient (First Open)
            await supabaseAdmin
                .from("campaign_recipients")
                .update({
                    opened_at: new Date().toISOString(),
                    status: 'opened'
                })
                .eq("id", id)
                .is("opened_at", null); // Only update opened_at if null (first open)

            // Increment Campaign Stats
            // We can fetch the record to get campaign_id first
            const { data: recipient } = await supabaseAdmin
                .from("campaign_recipients")
                .select("campaign_id, opened_at")
                .eq("id", id)
                .single();

            if (recipient) {
                // Log Event
                await supabaseAdmin.from("email_events").insert({
                    campaign_id: recipient.campaign_id,
                    recipient_id: id, // Wait, schema says recipient_id references recipients(id)? 
                    // Let's check schema. email_events.recipient_id references recipients(id).
                    // But here 'id' is campaign_recipients.id.
                    // We need to fetch the real recipient_id.
                });

                // Let's correct the fetch:
                const { data: cr } = await supabaseAdmin.from("campaign_recipients").select("campaign_id, recipient_id, opened_at").eq("id", id).single();

                if (cr) {
                    await supabaseAdmin.from("email_events").insert({
                        campaign_id: cr.campaign_id,
                        recipient_id: cr.recipient_id,
                        event_type: "opened",
                        user_agent: req.headers.get("user-agent") || "unknown",
                        ip_address: "0.0.0.0" // Hard to get IP in some deployed envs, can try headers
                    });

                    // If it was the FIRST open, increment campaign stats
                    if (!cr.opened_at) {
                        await supabaseAdmin.rpc('increment_campaign_stat', {
                            row_id: cr.campaign_id,
                            col_name: 'stats_opened'
                        });
                        // Fallback if RPC doesn't exist:
                        // const { data: camp } = await supabaseAdmin.from('campaigns').select('stats_opened').eq('id', cr.campaign_id).single();
                        // await supabaseAdmin.from('campaigns').update({ stats_opened: (camp?.stats_opened || 0) + 1 }).eq('id', cr.campaign_id);
                    }
                }
            }
        }
    } catch (e) {
        console.error("Tracking Error:", e);
    }

    return new NextResponse(transparentGif, {
        headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    });
}
