import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("u");
    const id = searchParams.get("id"); // campaign_recipient_id

    if (!url) {
        return new NextResponse("Missing URL", { status: 400 });
    }

    // Attempt to log, but don't block the user if it fails
    // (In serverless, we must await, but wrap in try-catch to ensure redirect always happens)
    if (id) {
        try {
            // Fetch mapping
            const { data: cr } = await supabaseAdmin
                .from("campaign_recipients")
                .select("campaign_id, recipient_id, clicked_at")
                .eq("id", id)
                .single();

            if (cr) {
                // Log Event
                await supabaseAdmin.from("email_events").insert({
                    campaign_id: cr.campaign_id,
                    recipient_id: cr.recipient_id,
                    event_type: "clicked",
                    url: url,
                    user_agent: req.headers.get("user-agent") || "unknown",
                    ip_address: "0.0.0.0"
                });

                // Update Status (if not already clicked)
                // We always update clicked_at to the LATEST click
                await supabaseAdmin
                    .from("campaign_recipients")
                    .update({
                        clicked_at: new Date().toISOString(),
                        status: 'clicked' // If it was 'sent' or 'opened', now it's 'clicked' (highest engagement)
                    })
                    .eq("id", id);

                // Increment Campaign Stats if FIRST click
                if (!cr.clicked_at) {
                    // Increment stat manually (since we don't know if RPC exists yet, stick to safe SQL or manual update)
                    // Ideally we used an RPC increment function, but for now we'll do:
                    // We skip strictly safe increment for speed here, or we can use:
                    /*
                       create or replace function increment_stat(row_id uuid, col_name text)
                       returns void as $$
                       begin
                           execute format('update campaigns set %I = %I + 1 where id = %L', col_name, col_name, row_id);
                       end;
                       $$ language plpgsql security definer;
                    */
                    // Since I can't confirm RPC exists, I'll silently skip atomic increment for safety 
                    // and rely on a periodic recalc or just do a naive read-write (risk of race condition but okay for MVP).
                    const { data: c } = await supabaseAdmin.from("campaigns").select("stats_clicked").eq("id", cr.campaign_id).single();
                    if (c) {
                        await supabaseAdmin.from("campaigns").update({ stats_clicked: (c.stats_clicked || 0) + 1 }).eq("id", cr.campaign_id);
                    }
                }
            }
        } catch (error) {
            console.error("Click Tracking Error:", error);
        }
    }

    // 307 Temporary Redirect (keeps method, though GET->GET is fine)
    // 302 Found is also fine.
    return NextResponse.redirect(url);
}
