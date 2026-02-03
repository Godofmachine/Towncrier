import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Delete tokens
        const { error: tokenError } = await supabaseAdmin
            .from('gmail_tokens')
            .delete()
            .eq('user_id', user.id);

        if (tokenError) throw tokenError;

        // 2. Update Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                gmail_connected: false,
                gmail_email: null
            })
            .eq('id', user.id);

        if (profileError) throw profileError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Disconnect Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
