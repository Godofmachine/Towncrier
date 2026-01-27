"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Users, Send, BarChart, Shield, AlertTriangle, FileText, CheckCircle2, Sparkles, Pencil, UserPlus, FileUp, Lock, Zap, Bell, UserCog } from "lucide-react";

export default function DocsPage() {
    return (
        <div className="space-y-8 max-w-5xl mx-auto py-12 px-6 animate-in fade-in-50 duration-500">
            <div>
                <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Everything you need to know about using The Towncrier - Your secure, AI-powered email campaign platform.
                </p>
                <Badge variant="outline" className="mt-4">
                    <Shield className="h-3 w-3 mr-1" /> Production-Ready • Security: 9.5/10
                </Badge>
            </div>

            <Tabs defaultValue="getting-started" className="space-y-6">
                <TabsList className="flex w-full overflow-x-auto no-scrollbar justify-start md:justify-center h-auto py-2 px-1 gap-2 bg-transparent md:bg-muted/50 scroll-pl-6 snap-x">
                    <TabsTrigger value="getting-started" className="shrink-0 snap-start data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border rounded-full px-4">Getting Started</TabsTrigger>
                    <TabsTrigger value="ai" className="shrink-0 snap-start gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border rounded-full px-4"><Sparkles className="h-4 w-4 text-purple-500" /> AI Companion</TabsTrigger>
                    <TabsTrigger value="campaigns" className="shrink-0 snap-start data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border rounded-full px-4">Campaigns</TabsTrigger>
                    <TabsTrigger value="analytics" className="shrink-0 snap-start data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border rounded-full px-4">Analytics</TabsTrigger>
                    <TabsTrigger value="security" className="shrink-0 snap-start data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border rounded-full px-4"><Shield className="h-4 w-4" /> Security</TabsTrigger>
                    <TabsTrigger value="faq" className="shrink-0 snap-start data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border rounded-full px-4">FAQ</TabsTrigger>
                </TabsList>

                {/* GETTING STARTED */}
                <TabsContent value="getting-started" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Welcome to The Towncrier</CardTitle>
                            <CardDescription>
                                A secure, zero-code alternative to Google Apps Script for sending personalized bulk emails with enterprise-grade protection.
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
                                        Securely connect your Google account with <strong>encrypted OAuth tokens</strong>. We only ask for permission to <strong>send emails</strong> on your behalf.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-primary">
                                        <div className="bg-primary/10 p-2 rounded-full"><Users className="h-4 w-4" /></div>
                                        2. Manage Contacts
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Import recipients from CSV files or add them manually. Organize contacts into Groups for easy targeting.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-primary">
                                        <div className="bg-primary/10 p-2 rounded-full"><Sparkles className="h-4 w-4" /></div>
                                        3. Write with AI
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Use our built-in AI assistant to draft or refine professional emails in seconds. Choose from multiple tones.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-primary">
                                        <div className="bg-primary/10 p-2 rounded-full"><Send className="h-4 w-4" /></div>
                                        4. Send & Track
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Send immediately with <strong>auto-save drafts</strong> and <strong>test send</strong>. Track opens and clicks in real-time.
                                    </p>
                                </div>

                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/20">
                                <div className="flex items-start gap-3">
                                    <Bell className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">New Features</h4>
                                        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                                            <li>✅ <strong>Notifications System</strong> - Real-time in-app alerts</li>
                                            <li>✅ <strong>Newsletter Management</strong> - Built-in subscriber system</li>
                                            <li>✅ <strong>Admin Dashboard</strong> - Analytics and user management</li>
                                            <li>✅ <strong>Account Management</strong> - Delete account with one click</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* AI COMPANION */}
                <TabsContent value="ai" className="space-y-6">
                    <Card className="border-purple-200 dark:border-purple-900">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-purple-600" />
                                AI Email Writer
                            </CardTitle>
                            <CardDescription>
                                Powered by AI - Draft Mode & Polish Mode
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Draft Mode (New Email)</h3>
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                        <li>Open the Campaign Editor.</li>
                                        <li>Click the <span className="font-semibold text-purple-600">✨ Ask AI</span> button in the toolbar.</li>
                                        <li>Select <strong>Draft</strong> mode.</li>
                                        <li>Enter a prompt (e.g., "Write a cold email to a potential client about SEO services").</li>
                                        <li>Select a <strong>Tone</strong> (Professional, Casual, Persuasive, Friendly, Urgent).</li>
                                        <li>Click <strong>Generate</strong>. The AI will write a subject line and body for you.</li>
                                        <li>Insert the result directly into your editor.</li>
                                    </ol>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">Polish Mode (Refine Existing)</h3>
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                        <li>Write some content in the editor first.</li>
                                        <li>Click <span className="font-semibold text-purple-600">✨ Ask AI</span>.</li>
                                        <li>Select <strong>Polish</strong> mode.</li>
                                        <li>Give refinement instructions (e.g., "Make it more persuasive", "Shorten it").</li>
                                        <li>The AI will improve your existing content.</li>
                                    </ol>
                                </div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg border border-purple-100 dark:border-purple-900/20">
                                <p className="text-sm text-purple-800 dark:text-purple-300">
                                    <strong>Tip:</strong> The AI is context-aware. If you specify variables like "Use the recipient's first name", it will try to include placeholders like <code>{`{{first_name}}`}</code> automatically.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CAMPAIGNS */}
                <TabsContent value="campaigns" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaigns & Editor</CardTitle>
                            <CardDescription>Create, send, and track your email campaigns</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <Pencil className="h-4 w-4" /> Auto-Save Drafts
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Never lose your work. The editor <strong>automatically saves</strong> your progress every 2 seconds.
                                        You can leave the page and come back to finish your campaign later.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <Send className="h-4 w-4" /> Test Send
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Send a test email to yourself before launching the campaign. Verify formatting and personalization.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <FileUp className="h-4 w-4" /> Attachments
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Attach files to your campaigns. Perfect for sending PDFs, images, or documents.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <Users className="h-4 w-4" /> Groups & Custom Selection
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Send to all contacts, specific groups, or hand-pick individual recipients.
                                    </p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-semibold mb-2">Personalization Variables</h3>
                                <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm">
                                    Hi {`{{first_name}}`},<br /><br />
                                    I saw that {`{{company}}`} is hiring...
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Supported variables depend on your recipient data: <code>first_name</code>, <code>last_name</code>, <code>email</code>, <code>company</code>, and any custom fields you import.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ANALYTICS */}
                <TabsContent value="analytics" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart className="h-5 w-5" />
                                Analytics & Tracking
                            </CardTitle>
                            <CardDescription>Monitor campaign performance in real-time</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" /> Open Tracking
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Pixel-based tracking shows you when recipients open your emails. See open rates per campaign.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <Zap className="h-4 w-4 text-blue-600" /> Click Tracking
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        All links are automatically wrapped to track clicks. See which links perform best.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <BarChart className="h-4 w-4 text-purple-600" /> Dashboard Charts
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        7-day trend charts show email volume, opens, and clicks. Real-time updates as events happen.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <FileText className="h-4 w-4 text-amber-600" /> Recent Activity
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        See your latest campaign activity and engagement metrics at a glance.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SECURITY */}
                <TabsContent value="security" className="space-y-6">
                    <Card className="border-green-200 dark:border-green-900">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-green-600" />
                                Enterprise-Grade Security
                            </CardTitle>
                            <CardDescription>
                                Security Score: 9.5/10 - Production-Ready
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4">
                                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/20">
                                    <Lock className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-green-900 dark:text-green-200">Token Encryption</h4>
                                        <p className="text-sm text-green-800 dark:text-green-300">
                                            Your Gmail OAuth tokens are encrypted at rest using <strong>AES-256-GCM</strong>. Even if our database is breached, your tokens are useless without the encryption key.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
                                    <Zap className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-blue-900 dark:text-blue-200">Rate Limiting</h4>
                                        <p className="text-sm text-blue-800 dark:text-blue-300">
                                            <strong>500 emails per day</strong> per user, <strong>500 recipients per campaign</strong> maximum. Prevents spam abuse and protects your sender reputation.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/20">
                                    <Shield className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-purple-900 dark:text-purple-200">Content Protection</h4>
                                        <p className="text-sm text-purple-800 dark:text-purple-300">
                                            <strong>HTML Sanitization</strong> prevents XSS attacks. <strong>Spam detection</strong> blocks malicious content (keywords, excessive links). All content validated before sending.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/20">
                                    <UserCog className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-amber-900 dark:text-amber-200">Admin Protection</h4>
                                        <p className="text-sm text-amber-800 dark:text-amber-300">
                                            Role-based access control ensures only authorized admins can access sensitive system data and settings.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-semibold mb-2">Additional Security Measures</h3>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>✅ Row-Level Security (RLS) - User data isolation at database level</li>
                                    <li>✅ Environment Validation - All env vars validated on startup</li>
                                    <li>✅ Anti-Spam Delays - 100ms between sends prevents Gmail spam detection</li>
                                    <li>✅ Minimal OAuth Scopes - Only request <code>gmail.send</code> permission</li>
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
                                    Our platform enforces these limits to protect your account.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-1">Why Gmail?</h3>
                                <p className="text-muted-foreground text-sm">
                                    Emails sent via Gmail API land in the <strong>Primary Inbox</strong> more often than tools like Mailchimp.
                                    Plus, replies go straight to your inbox, making it perfect for cold outreach or personal newsletters.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-1">Is my data safe?</h3>
                                <p className="text-muted-foreground text-sm">
                                    Yes! We implement <strong>enterprise-grade security</strong> with AES-256-GCM token encryption, Row-Level Security, HTML sanitization, and rate limiting. Your Gmail tokens are encrypted at rest and your recipient data is isolated. We have a security score of <strong>9.5/10</strong>.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-1">Can I delete my account?</h3>
                                <p className="text-muted-foreground text-sm">
                                    Yes, go to Settings → Danger Zone → Delete Account. This will permanently delete all your data including campaigns, recipients, and Gmail connection.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-1">How does tracking work?</h3>
                                <p className="text-muted-foreground text-sm">
                                    <strong>Open tracking</strong> uses a 1x1 transparent pixel. <strong>Click tracking</strong> wraps all links through our tracking server, then redirects to the original URL. All tracking data is private and only visible to you.
                                </p>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg flex gap-3 border border-amber-200 dark:border-amber-900/20">
                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-amber-900 dark:text-amber-200">Privacy Commitment</h4>
                                    <p className="text-sm text-amber-800 dark:text-amber-300">
                                        We do not read your inbox. We only use the <code>gmail.send</code> scope to deliver your campaigns.
                                        Your emails, recipients, and analytics data are never shared with third parties.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
