import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

export async function getGmailClient(userId: string) {
    // Initialize Supabase Admin client for secure token access
    // Move inside function to avoid build-time env verification failures
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch encrypted tokens from DB
    const { data: tokenData, error } = await supabaseAdmin
        .from("gmail_tokens")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (error || !tokenData) {
        throw new Error("Gmail not connected");
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`
    );

    // 2. Set credentials
    oauth2Client.setCredentials({
        access_token: tokenData.access_token, // In prod, decrypt this
        refresh_token: tokenData.refresh_token, // In prod, decrypt this
        expiry_date: new Date(tokenData.token_expiry).getTime(),
    });

    // 3. Handle Token Refresh if needed
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            await supabaseAdmin.from("gmail_tokens").update({
                access_token: tokens.access_token,
                token_expiry: new Date(tokens.expiry_date || Date.now() + 3600000).toISOString(),
                updated_at: new Date().toISOString()
            }).eq("user_id", userId);
        }
    });

    return google.gmail({ version: "v1", auth: oauth2Client });
}

interface Attachment {
    filename: string;
    content: string; // Base64 string
    contentType: string;
}

export function createEmailBody(to: string, from: string, subject: string, htmlBody: string, attachments: Attachment[] = []) {
    const boundary = "foo_bar_baz"; // In prod, generate a random boundary
    const parts = [];

    // Headers
    parts.push(`From: ${from}`);
    parts.push(`To: ${to}`);
    parts.push(`Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`);
    parts.push("MIME-Version: 1.0");

    if (attachments.length > 0) {
        parts.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
        parts.push("");

        // HTML Part
        parts.push(`--${boundary}`);
        parts.push("Content-Type: text/html; charset=utf-8");
        parts.push("Content-Transfer-Encoding: quoted-printable");
        parts.push("");
        parts.push(htmlBody);

        // Attachments
        for (const attach of attachments) {
            parts.push("");
            parts.push(`--${boundary}`);
            parts.push(`Content-Type: ${attach.contentType}; name="${attach.filename}"`);
            parts.push(`Content-Disposition: attachment; filename="${attach.filename}"`);
            parts.push("Content-Transfer-Encoding: base64");
            parts.push("");
            parts.push(attach.content); // Assumed duplicate base64 stripping handled by caller or simple pass-through
        }

        parts.push("");
        parts.push(`--${boundary}--`);
    } else {
        parts.push("Content-Type: text/html; charset=utf-8");
        parts.push("");
        parts.push(htmlBody);
    }

    const message = parts.join("\n");

    // URL-safe Base64 encode
    return Buffer.from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}
