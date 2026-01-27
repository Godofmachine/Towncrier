import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Use Admin Client to delete user from auth
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Delete user from auth.users (cascades to profiles, campaigns, etc. via FK ON DELETE CASCADE)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (deleteError) {
            throw deleteError;
        }

        // Sign out the user
        await supabase.auth.signOut();

        return NextResponse.json({ success: true, message: "Account deleted successfully" });
    } catch (error: any) {
        console.error("Delete account error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete account" },
            { status: 500 }
        );
    }
}
