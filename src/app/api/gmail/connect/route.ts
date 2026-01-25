import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`
    );

    const scopes = [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/userinfo.email"
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: "offline", // Essential for getting refresh_token
        scope: scopes,
        prompt: "consent", // Force consent to ensure refresh_token is returned
    });

    return NextResponse.redirect(url);
}
