import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * SECURITY: Verify user has admin or superadmin role
 * Use this in admin pages/APIs to prevent unauthorized access
 */
export async function verifyAdminAccess(): Promise<{
    user: any;
    role: 'admin' | 'superadmin';
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch user role from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const role = profile?.role;

    if (role !== 'admin' && role !== 'superadmin') {
        redirect('/dashboard'); // Redirect non-admins to regular dashboard
    }

    return { user, role };
}

/**
 * Check if user is admin without redirecting (for conditional UI)
 */
export async function isAdmin(): Promise<boolean> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return false;

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        return profile?.role === 'admin' || profile?.role === 'superadmin';
    } catch {
        return false;
    }
}
