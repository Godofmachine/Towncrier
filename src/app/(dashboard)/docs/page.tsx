"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Users, Send, BarChart, Shield, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

export default function DocsPage() {
    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20 animate-in fade-in-50 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Documentation</h2>
                <p className="text-muted-foreground mt-2 text-lg">
                    Everything you need to know about using Towncrier.
                </p>
            </div>

            <Tabs defaultValue="getting-started" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto">
                    <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
                    <TabsTrigger value="gmail">Gmail Integration</TabsTrigger>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                    <TabsTrigger value="faq">FAQ & Limits</TabsTrigger>
                </TabsList>

                {/* GETTING STARTED */}
                <TabsContent value="getting-started" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Welcome to Towncrier</CardTitle>
                            <CardDescription>
                                Towncrier is a personal newsletter tool that sends emails directly from your Gmail account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-primary">
                                        <div className="bg-primary/10 p-2 rounded-full"><Mail className="h-4 w-4" /></div>
                                        1. Connect Gmail
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        The first step is mandatory. You must connect your Google account so we can send emails on your behalf.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-primary">
                                        <div className="bg-primary/10 p-2 rounded-full"><Users className="h-4 w-4" /></div>
                                        2. Add Recipients
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Import contacts via CSV or add them manually. Organize them into Groups for targeted sending.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-primary">
                                        <div className="bg-primary/10 p-2 rounded-full"><FileText className="h-4 w-4" /></div>
                                        3. Create Campaign
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Write your email using our rich text editor. Use variables like <code>{`{{first_name}}`}</code> for personalization.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-primary">
                                        <div className="bg-primary/10 p-2 rounded-full"><Send className="h-4 w-4" /></div>
                                        4. Send & Track
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Send immediately. We track opens and clicks automatically (coming soon).
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* GMAIL INTEGRATION */}
                <TabsContent value="gmail" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-blue-600" />
                                Why Gmail?
                            </CardTitle>
                            <CardDescription>
                                Understanding how our engine works safely and securely.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p>
                                Unlike Mailchimp or ConvertKit, which send emails from their own servers (e.g., <code>bounce-mc.us4_123@mailchimp.com</code>),
                                Towncrier sends emails <strong>directly through your personal Gmail API</strong>.
                            </p>
                            <div className="bg-muted p-4 rounded-lg space-y-2">
                                <h4 className="font-semibold">Benefits:</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    <li><strong>Higher Deliverability:</strong> Emails look like personal messages, not marketing blasts.</li>
                                    <li><strong>Direct Replies:</strong> When someone replies, it goes straight to your Gmail inbox.</li>
                                    <li><strong>Free:</strong> You use your existing Google quota (500-2,000 emails/day).</li>
                                </ul>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg flex gap-3 border border-amber-200 dark:border-amber-900/20">
                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-amber-900 dark:text-amber-200">Security & Privacy</h4>
                                    <p className="text-sm text-amber-800 dark:text-amber-300">
                                        We only request permission to <strong>send emails</strong> on your behalf.
                                        We do not read your inbox, delete emails, or access your Drive files.
                                        Your access tokens are encrypted in our database.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CAMPAIGNS */}
                <TabsContent value="campaigns" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Creating Effective Campaigns</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">1. Personalization</h3>
                                <p className="text-muted-foreground">
                                    You can dynamically insert recipient data using "Handlebars" syntax.
                                </p>
                                <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm">
                                    Hi {`{{first_name}}`},<br /><br />
                                    I noticed you work at {`{{company}}`}. I'd love to...
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Supported variables: <code>first_name</code>, <code>last_name</code>, <code>email</code>, <code>company</code>.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">2. Formatting</h3>
                                <p className="text-muted-foreground">
                                    Our rich text editor supports:
                                </p>
                                <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                                    <li>Headings (H1, H2, H3)</li>
                                    <li>Bold, Italic, Underline, Strikethrough</li>
                                    <li>Bulleted and Numbered Lists</li>
                                    <li>Blockquotes</li>
                                    <li>Links and Images</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* FAQ */}
                <TabsContent value="faq" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Frequently Asked Questions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-semibold mb-1">What is the daily sending limit?</h3>
                                <p className="text-muted-foreground text-sm">
                                    Personal Gmail accounts (@gmail.com) are limited to <strong>500 emails per rolling 24-hour period</strong>.
                                    Google Workspace accounts (pro/business) are limited to <strong>2,000 emails per day</strong>.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">What happens if I hit the limit?</h3>
                                <p className="text-muted-foreground text-sm">
                                    Google will block further emails from being sent until the 24-hour window resets.
                                    Towncrier will show an error if we try to send beyond this limit.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Can I use a custom domain?</h3>
                                <p className="text-muted-foreground text-sm">
                                    Yes! If you have a Google Workspace account set up with your custom domain (e.g., <code>you@yourcompany.com</code>),
                                    simply log in with that account. Emails will come from your custom domain.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
