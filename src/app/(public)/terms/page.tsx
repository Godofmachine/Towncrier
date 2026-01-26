"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function TermsPage() {
    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500 max-w-4xl mx-auto py-12 px-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
                <p className="text-muted-foreground mt-2">
                    Last updated: January 25, 2024
                </p>
            </div>

            <Card>
                <CardContent className="p-8 prose dark:prose-invert max-w-none">
                    <h3>1. Acceptance of Terms</h3>
                    <p>
                        By accessing and using The Towncrier ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, simply do not use the Service.
                    </p>

                    <h3>2. Description of Service</h3>
                    <p>
                        The Towncrier provides a newsletter and email campaign management tool that integrates with your personal Gmail account to send emails.
                    </p>

                    <h3>3. User Responsibilities</h3>
                    <p>
                        You are responsible for all activity that occurs under your account. You agree to:
                    </p>
                    <ul>
                        <li>Comply with all applicable laws and regulations regarding email marketing (CAN-SPAM, GDPR, etc.).</li>
                        <li>Not use the Service to send spam or unsolicited bulk email.</li>
                        <li>Not use the Service to send content that is illegal, harmful, or offensive.</li>
                        <li>Maintain the security of your account credentials.</li>
                    </ul>

                    <h3>4. Google API Services User Data Policy</h3>
                    <p>
                        The Towncrier's use and transfer to any other app of information received from Google APIs will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
                    </p>

                    <h3>5. Limitation of Liability</h3>
                    <p>
                        To the maximum extent permitted by law, The Towncrier shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.
                    </p>

                    <h3>6. Termination</h3>
                    <p>
                        We reserve the right to terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                    </p>

                    <h3>7. Changes to Terms</h3>
                    <p>
                        We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new Terms of Service on this page.
                    </p>

                    <h3>8. Contact Us</h3>
                    <p>
                        If you have any questions about these Terms, please contact us at <a href="/contact" className="text-primary hover:underline">support@towncrier.app</a>.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
