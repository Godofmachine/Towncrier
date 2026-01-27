import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const body = await req.json();

        // Default values
        let userId = user?.id || null;
        let email = user?.email; // Default to auth email if available
        let status = body.status || 'subscribed';
        let firstName = body.first_name;
        let lastName = body.last_name;

        // If public (no user), we require email, first_name, last_name
        if (!userId) {
            if (!body.email || !body.first_name || !body.last_name) {
                return NextResponse.json({ error: "Email, First Name, and Last Name are required" }, { status: 400 });
            }
            email = body.email;
        }

        if (!['subscribed', 'unsubscribed'].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // Prepare payload
        const payload: any = {
            email: email,
            status: status,
            updated_at: new Date().toISOString(),
            first_name: firstName,
            last_name: lastName
        };

        // If we have a user_id, include it to link the account
        if (userId) {
            payload.user_id = userId;
        }

        // Upsert subscriber
        // We need to handle potential conflicts. 
        // If user is logged in, we upsert by user_id? Or by email?
        // The new schema has unique constraints on EMAIL.
        // So we should probably upsert by email.

        const { error } = await supabase
            .from('newsletter_subscribers')
            .upsert(payload, { onConflict: 'email' });

        if (error) throw error;

        return NextResponse.json({ success: true, status });
    } catch (error: any) {
        console.error("Newsletter API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    // Check current status
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // If not logged in, we can't easily check status without an email provided in query param
        // For security, maybe we only allow checking status for LOGGED IN users.
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data, error } = await supabase
            .from('newsletter_subscribers')
            .select('status')
            .eq('user_id', user.id)
            .single();

        return NextResponse.json({ status: data?.status || 'unsubscribed' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
