"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPage() {
    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500 max-w-4xl mx-auto py-12 px-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
                <p className="text-muted-foreground mt-2">
                    Last updated: January 25, 2024
                </p>
            </div>

            <Card>
                <CardContent className="p-8 prose dark:prose-invert max-w-none">
                    <h3>1. Introduction</h3>
                    <p>
                        At Towncrier, we take your privacy seriously. This Privacy Policy describes how we collect, use, and protect your information when you use our Service.
                    </p>

                    <h3>2. Information We Collect</h3>
                    <p>
                        We collect the following types of information:
                    </p>
                    <ul>
                        <li><strong>Account Information:</strong> Name, email address, and profile picture provided by Google authentication.</li>
                        <li><strong>Usage Data:</strong> Information about how you use the Service, such as campaigns created and emails sent.</li>
                        <li><strong>Recipient Data:</strong> Email addresses and names of recipients you upload to the Service. We process this data only to provide the Service to you.</li>
                    </ul>

                    <h3>3. How We Use Your Information</h3>
                    <p>
                        We use your information to:
                    </p>
                    <ul>
                        <li>Provide, maintain, and improve the Service.</li>
                        <li>Process and send your email campaigns via the Gmail API.</li>
                        <li>Communicate with you about the Service, including updates and support.</li>
                    </ul>

                    <h3>4. Google User Data</h3>
                    <p>
                        Towncrier requests access to your Gmail account solely to send emails on your behalf.
                    </p>
                    <ul>
                        <li>We <strong>do not</strong> read your personal emails (scopes are restricted to sending only).</li>
                        <li>We <strong>do not</strong> share your Google user data with third parties, except as necessary to provide the Service or comply with the law.</li>
                        <li>We <strong>do not</strong> use your Google user data for advertising purposes.</li>
                    </ul>

                    <h3>5. Data Security</h3>
                    <p>
                        We implement appropriate security measures to protect your personal information. Your Gmail access tokens are encrypted at rest in our database.
                    </p>

                    <h3>6. Data Retention</h3>
                    <p>
                        We retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. You can request deletion of your data at any time.
                    </p>

                    <h3>7. Contact Us</h3>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at <a href="/contact" className="text-primary hover:underline">support@towncrier.app</a>.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
