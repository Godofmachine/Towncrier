import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // If logged in, we use their user_id. If public (future), we need generic handler. 
        // For now, let's assume it's for the User Settings toggle, so we require Auth.
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { status } = body; // 'subscribed' | 'unsubscribed'

        if (!['subscribed', 'unsubscribed'].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // Upsert subscriber
        const { error } = await supabase
            .from('newsletter_subscribers')
            .upsert({
                user_id: user.id,
                email: user.email,
                status: status,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) throw error;

        return NextResponse.json({ success: true, status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    // Check current status
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data, error } = await supabase
            .from('newsletter_subscribers')
            .select('status')
            .eq('user_id', user.id)
            .single();

        // If no record, default to 'unsubscribed' (or 'subscribed' if we want auto-opt-in logic, but best to respect explicit choice)
        // Wait, the migration auto-subscribes new users. So if missing, likely old user.
        return NextResponse.json({ status: data?.status || 'unsubscribed' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
