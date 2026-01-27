import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=gmail_auth_failed`);
    }

    if (!code) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_code`);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`
        );

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user's Gmail address
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const gmailAddress = userInfo.data.email;


        // Initialize admin client for bypassing RLS
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // SECURITY: Encrypt tokens before storing
        const { encryptToken } = await import('@/lib/crypto/encryption');

        const encryptedAccessToken = encryptToken(tokens.access_token!);
        const encryptedRefreshToken = tokens.refresh_token ? encryptToken(tokens.refresh_token) : null;

        // Store Encrypted Tokens
        const { error: dbError } = await supabaseAdmin
            .from('gmail_tokens')
            .upsert({
                user_id: user.id,
                // Keep old columns for backward compatibility during migration
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                // New encrypted columns
                encrypted_access_token: encryptedAccessToken,
                encrypted_refresh_token: encryptedRefreshToken,
                is_encrypted: true,
                token_expiry: new Date(tokens.expiry_date || Date.now() + 3600000).toISOString(),
                scope: tokens.scope
            }, { onConflict: 'user_id' });

        if (dbError) throw dbError;

        // Update Profile status
        await supabase
            .from('profiles')
            .update({
                gmail_connected: true,
                gmail_email: gmailAddress
            })
            .eq('id', user.id);

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=gmail_connected`);

    } catch (err: any) {
        console.error("Gmail callback error DETAIL:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
        const errorMessage = err?.message || "Unknown error";
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=server_error&details=${encodeURIComponent(errorMessage)}`);
    }
}
