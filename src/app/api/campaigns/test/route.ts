import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendCampaign } from "@/lib/campaigns/sender";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { subject, content, fromName, attachments } = body;

        if (!subject || !content) {
            return NextResponse.json(
                { error: "Subject and content are required" },
                { status: 400 }
            );
        }

        // Fetch user profile to get their name/email
        const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, gmail_email")
            .eq("id", user.id)
            .single();

        if (!profile?.gmail_email) {
            return NextResponse.json(
                { error: "Gmail not connected. Please connect it in settings." },
                { status: 400 }
            );
        }

        // Construct a single-recipient list (the user themselves)
        const testRecipient = {
            email: profile.gmail_email,
            first_name: profile.full_name?.split(" ")[0] || "Test",
            last_name: profile.full_name?.split(" ")[1] || "User",
        };

        // Send using the shared logic
        const sentCount = await sendCampaign({
            userId: user.id,
            name: `[TEST] ${subject}`,
            subject: `[TEST] ${subject}`,
            content,
            recipients: [testRecipient],
            attachments: attachments || []
        });

        if (sentCount === 0) {
            throw new Error("Failed to send test email via Gmail API");
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Test send error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to send test email" },
            { status: 500 }
        );
    }
}
