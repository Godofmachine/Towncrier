"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Users, Send, BarChart, Shield, AlertTriangle, FileText, CheckCircle2, Sparkles, Pencil, UserPlus, FileUp } from "lucide-react";

export default function DocsPage() {
    return (
        <div className="space-y-8 max-w-5xl mx-auto py-12 px-6 animate-in fade-in-50 duration-500">
            <div>
                <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Everything you need to know about using The Towncrier.
                </p>
            </div>

            <Tabs defaultValue="getting-started" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:w-auto h-auto">
                    <TabsTrigger value="getting-started" className="py-2">Getting Started</TabsTrigger>
                    <TabsTrigger value="ai" className="py-2 gap-2"><Sparkles className="h-4 w-4 text-purple-500" /> AI Companion</TabsTrigger>
                    <TabsTrigger value="groups" className="py-2">Groups</TabsTrigger>
                    <TabsTrigger value="campaigns" className="py-2">Campaigns</TabsTrigger>
                    <TabsTrigger value="faq" className="py-2">FAQ</TabsTrigger>
                </TabsList>

                {/* GETTING STARTED */}
                <TabsContent value="getting-started" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Welcome to The Towncrier</CardTitle>
                            <CardDescription>
                                A zero-code alternative to Google Apps Script for sending personalized bulk emails.
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
                                        Securely connect your Google account. We only ask for permission to <strong>send emails</strong> on your behalf.
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
                                        Use our built-in Llama 3 AI assistant to draft professional, casual, or persuasive emails in seconds.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-primary">
                                        <div className="bg-primary/10 p-2 rounded-full"><Send className="h-4 w-4" /></div>
                                        4. Send & Track
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Send immediately or save as a draft. Emails come directly from <strong>your</strong> address.
                                    </p>
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
                                Powered by Groq & Llama 3 (8B/70B)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold">How to use:</h3>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                    <li>Open the Campaign Editor.</li>
                                    <li>Click the <span className="font-semibold text-purple-600">✨ Ask AI</span> button in the toolbar.</li>
                                    <li>Enter a prompt (e.g., "Write a cold email to a potential client about SEO services").</li>
                                    <li>Select a <strong>Tone</strong> (Professional, Casual, Persuasive, Friendly, Urgent).</li>
                                    <li>Click <strong>Generate</strong>. The AI will write a subject line and body for you.</li>
                                    <li>Insert the result directly into your editor and tweak as needed.</li>
                                </ol>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg border border-purple-100 dark:border-purple-900/20">
                                <p className="text-sm text-purple-800 dark:text-purple-300">
                                    <strong>Tip:</strong> The AI is context-aware. If you specify variables like "Use the recipient's first name", it will try to include placeholders like <code>{`{{first_name}}`}</code> automatically.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* GROUPS */}
                <TabsContent value="groups" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Groups & Recipients</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-medium">
                                        <FileUp className="h-4 w-4 text-muted-foreground" /> CSV Import
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Bulk create groups</strong> by uploading a CSV file. The file should have headers like `email`, `first_name`, `company`.
                                        We automatically map these fields for you.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-medium">
                                        <UserPlus className="h-4 w-4 text-muted-foreground" /> Quick Add
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Add individual recipients to an existing group without re-uploading a file.
                                        Perfect for last-minute additions.
                                    </p>
                                </div>
                            </div>
                            <div className="border-t pt-4 mt-2">
                                <h3 className="font-semibold mb-2">Management</h3>
                                <p className="text-sm text-muted-foreground">
                                    Go to the <strong>Recipients</strong> page to see everyone you've ever imported.
                                    You can select multiple people and "Add to Group" or "Delete" in bulk.
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
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 font-semibold">
                                    <Pencil className="h-4 w-4" /> Auto-Save Drafts
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Never lose your work. The editor <strong>automatically saves</strong> your progress as you type.
                                    You can leave the page and come back to finish your campaign later.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 font-semibold">
                                    Personalization Variables
                                </div>
                                <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm">
                                    Hi {`{{first_name}}`},<br /><br />
                                    I saw that {`{{company}}`} is hiring...
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Supported variables depend on your recipient data: <code>first_name</code>, <code>last_name</code>, <code>email</code>, <code>company</code>, etc.
                                </p>
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
                                <h3 className="font-semibold mb-1">Why Gmail?</h3>
                                <p className="text-muted-foreground text-sm">
                                    Emails sent via Gmail API land in the <strong>Primary Inbox</strong> more often than tools like Mailchimp.
                                    Plus, replies go straight to your inbox, making it perfect for cold outreach or personal newsletters.
                                </p>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg flex gap-3 border border-amber-200 dark:border-amber-900/20">
                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-amber-900 dark:text-amber-200">Security Note</h4>
                                    <p className="text-sm text-amber-800 dark:text-amber-300">
                                        We do not read your inbox. We only use the `gmail.send` scope to deliver your campaigns.
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
