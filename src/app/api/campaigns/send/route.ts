import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendCampaign } from "@/lib/campaigns/sender";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { recipients, subject, content, attachments, name } = body;

        // Use the shared sendCampaign logic (handles RLS via admin client, sanitization, logging, etc.)
        const sentCount = await sendCampaign({
            userId: user.id,
            name,
            subject,
            content,
            recipients,
            attachments
        });

        return NextResponse.json({ success: true, sent: sentCount });

    } catch (error: any) {
        console.error("Send Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
