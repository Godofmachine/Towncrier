"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Mail, Users, Send, BarChart, Shield, AlertTriangle, FileText,
    CheckCircle2, Sparkles, Pencil, UserPlus, FileUp, Lock, Zap,
    Bell, UserCog, Database, Settings, LayoutDashboard
} from "lucide-react";

export default function DocsPage() {
    return (
        <div className="space-y-8 max-w-6xl mx-auto py-12 px-6 animate-in fade-in-50 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
                    <p className="text-muted-foreground mt-2 text-lg max-w-2xl">
                        A complete guide to using The Towncrier to send personalized, AI-powered email campaigns directly from your Gmail account.
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className="px-3 py-1">
                        <Shield className="h-3 w-3 mr-1 text-green-600" /> V1.0 - Production Ready
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="getting-started" className="space-y-8">
                <div className="border-b">
                    <TabsList className="h-auto w-auto bg-transparent p-0 gap-6 flex-wrap justify-start">
                        <TabsTrigger
                            value="getting-started"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1 font-medium"
                        >
                            Getting Started
                        </TabsTrigger>
                        <TabsTrigger
                            value="recipients"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1 font-medium"
                        >
                            Recipients & Data
                        </TabsTrigger>
                        <TabsTrigger
                            value="campaigns"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1 font-medium"
                        >
                            Campaigns & AI
                        </TabsTrigger>
                        <TabsTrigger
                            value="analytics"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1 font-medium"
                        >
                            Analytics
                        </TabsTrigger>
                        <TabsTrigger
                            value="security"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1 font-medium"
                        >
                            Security & FAQ
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* GETTING STARTED */}
                <TabsContent value="getting-started" className="space-y-8 animate-in slide-in-from-bottom-2 duration-500 fade-in">
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="col-span-2">
                            <CardHeader>
                                <CardTitle>Quick Start Guide</CardTitle>
                                <CardDescription>Get up and running in less than 2 minutes.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</div>
                                        <div className="space-y-1">
                                            <h3 className="font-semibold">Connect your Gmail</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Click "Sign in with Google" to link your account. We only request the minimum permission needed to send emails on your behalf (<code className="bg-muted px-1 rounded text-xs">gmail.send</code>).
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
                                        <div className="space-y-1">
                                            <h3 className="font-semibold">Import Contacts</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Go to the <span className="font-medium text-foreground">Recipients</span> tab. You can add people manually or bulk upload a CSV file.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</div>
                                        <div className="space-y-1">
                                            <h3 className="font-semibold">Create a Campaign</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Navigate to <span className="font-medium text-foreground">Campaigns</span> and click "New Campaign". Use the AI assistant to draft your content.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card className="bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20">
                                <CardHeader>
                                    <CardTitle className="text-lg text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                        <Sparkles className="h-4 w-4" /> Why Towncrier?
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-blue-700/80 dark:text-blue-300/80 space-y-2">
                                    <p>Towncrier is a <strong>zero-code alternative</strong> to complex Google Apps Scripts.</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Higher delivery rates (uses user API)</li>
                                        <li>Enterprise-grade security</li>
                                        <li>Built-in analytics & tracking</li>
                                        <li>Modern, easy-to-use interface</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">System Status</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        All Systems Operational
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* RECIPIENTS */}
                <TabsContent value="recipients" className="space-y-8 animate-in slide-in-from-bottom-2 duration-500 fade-in">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileUp className="h-5 w-5" /> CSV Import Guide
                                </CardTitle>
                                <CardDescription>How to format your data for bulk uploads.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Your CSV file must have headers in the first row. We automatically detect standard fields and save everything else as custom data.
                                </p>
                                <div className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
                                    <div className="grid grid-cols-4 gap-4 min-w-[300px] text-muted-foreground mb-2 pb-2 border-b border-border/50">
                                        <div>email*</div>
                                        <div>first_name</div>
                                        <div>company</div>
                                        <div>city</div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 min-w-[300px]">
                                        <div>alice@ex.com</div>
                                        <div>Alice</div>
                                        <div>Acme Inc</div>
                                        <div>New York</div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 min-w-[300px]">
                                        <div>bob@ex.com</div>
                                        <div>Bob</div>
                                        <div>StartUp</div>
                                        <div>London</div>
                                    </div>
                                </div>
                                <ul className="text-sm space-y-2 text-muted-foreground mt-4">
                                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> <strong>email</strong> is the only required column.</li>
                                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> <strong>Custom Columns:</strong> Any extra columns (like 'company', 'role') are automatically saved and available as variables.</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" /> Groups & Segments
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Organize your contacts into <strong>Broadcast Groups</strong> for targeted messaging.
                                    </p>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Best Practices:</h4>
                                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                            <li>Create groups by interest (e.g., "Newsletter", "Clients").</li>
                                            <li>Use the "Add to Group" bulk action in the Recipients list.</li>
                                            <li>You can send campaigns to multiple groups at once.</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Database className="h-5 w-5" /> Data Management
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm text-muted-foreground">
                                    <p>
                                        You can edit individual contact details, including custom fields, by clicking on any recipient in the list.
                                    </p>
                                    <p>
                                        Use the search bar to find contacts by name, email, or custom field values.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* CAMPAIGNS */}
                <TabsContent value="campaigns" className="space-y-8 animate-in slide-in-from-bottom-2 duration-500 fade-in">
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Editor & Personalization</CardTitle>
                            <CardDescription>Master the art of personalized cold outreach.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">

                            {/* Personalization Section */}
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-purple-500" />
                                        Using Variables
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Use the <span className="font-semibold">{`{ }`}</span> variable button in the toolbar to insert personalization.
                                    </p>
                                    <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-200 dark:border-amber-900/20">
                                        <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                            <span>
                                                <strong>Important:</strong> You can only use variables that exist in your recipient data.
                                                If you need more variables (like <code>city</code> or <code>company</code>), you must add them as columns in your CSV
                                                or update your recipients first.
                                            </span>
                                        </p>
                                    </div>
                                    <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm leading-relaxed">
                                        <span className="text-slate-400">Subject:</span> Quick question for <span className="text-yellow-400">{`{{company}}`}</span><br /><br />
                                        Hi <span className="text-yellow-400">{`{{first_name}}`}</span>,<br /><br />
                                        I noticed that <span className="text-yellow-400">{`{{company}}`}</span> is located in <span className="text-yellow-400">{`{{city}}`}</span>. I'd love to...
                                    </div>
                                    <div className="flex gap-2 text-xs">
                                        <Badge variant="secondary">first_name</Badge>
                                        <Badge variant="secondary">last_name</Badge>
                                        <Badge variant="secondary">email</Badge>
                                        <Badge variant="outline">+ any custom field</Badge>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-purple-500" />
                                        AI Writer Assistant
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Stuck on what to write? Use the built-in AI assistant button <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"><Sparkles className="w-3 h-3 mr-1" /> Ask AI</span> in the editor toolbar.
                                    </p>
                                    <ul className="space-y-3 text-sm text-muted-foreground">
                                        <li className="flex gap-2">
                                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 h-fit">Draft Mode</Badge>
                                            <span>Generate a complete email from a simple prompt like "Cold email for web design services".</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 h-fit">Polish Mode</Badge>
                                            <span>Refine your existing text. Options include "Make it shorter", "More professional", or "Fix grammar".</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Features Grid */}
                            <div className="grid sm:grid-cols-3 gap-4 border-t pt-6">
                                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                                    <Settings className="h-5 w-5 text-gray-500" />
                                    <h4 className="font-medium">Auto-Save</h4>
                                    <p className="text-xs text-muted-foreground">Drafts serve automatically every 2 seconds. Never lose your work.</p>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                                    <Send className="h-5 w-5 text-gray-500" />
                                    <h4 className="font-medium">Test Mode</h4>
                                    <p className="text-xs text-muted-foreground">Send a test email to yourself to verify formatting before the real blast.</p>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                                    <Zap className="h-5 w-5 text-gray-500" />
                                    <h4 className="font-medium">Smart Sending</h4>
                                    <p className="text-xs text-muted-foreground">Emails are sent with a slight delay between them to prevent spam flags.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ANALYTICS */}
                <TabsContent value="analytics" className="space-y-8 animate-in slide-in-from-bottom-2 duration-500 fade-in">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Understanding Metrics</CardTitle>
                                    <CardDescription>What the numbers actually mean.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-start gap-4 p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                                        <div className="p-2 bg-green-100 text-green-700 rounded-full dark:bg-green-900/30 dark:text-green-400">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold">Open Rate</div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Percentage of recipients who opened your email. We track this using an invisible 1x1 pixel image.
                                                <br /><span className="text-xs text-muted-foreground/80 italic">Note: Some email clients (like Hey.com) block tracking pixels, so actual opens may be higher.</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                                        <div className="p-2 bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                                            <LayoutDashboard className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold">Click Rate</div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Percentage of recipients who clicked at least one link in your email. We wrap links to track this activity.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle>Dashboard Overview</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-muted-foreground">
                                    <p>
                                        Your main dashboard provides a holistic view of your performance:
                                    </p>
                                    <ul className="space-y-3">
                                        <li className="flex gap-2 items-start">
                                            <BarChart className="h-5 w-5 shrink-0" />
                                            <span><strong>7-Day Trends:</strong> Visual charts showing how your volume is changing over the last week.</span>
                                        </li>
                                        <li className="flex gap-2 items-start">
                                            <Bell className="h-5 w-5 shrink-0" />
                                            <span><strong>Real-time Activity:</strong> See a live feed of who is opening your emails right now.</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* SECURITY & FAQ */}
                <TabsContent value="security" className="space-y-8 animate-in slide-in-from-bottom-2 duration-500 fade-in">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-green-200 dark:border-green-900">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-green-600" /> Security First Architecture
                                </CardTitle>
                                <CardDescription>How we keep your data safe.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">Encrypted Tokens</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Your Gmail OAuth tokens are encrypted at rest using <strong>AES-256-GCM</strong>. Even if our database were compromised, the tokens would be unusable without the keys.
                                    </p>
                                </div>
                                <div className="space-y-2 border-t pt-2">
                                    <h4 className="font-semibold text-sm">Minimal Scope</h4>
                                    <p className="text-sm text-muted-foreground">
                                        We only ask for <code>gmail.send</code> permission. We <strong>cannot</strong> read your emails, see your contacts, or access your drive.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Frequently Asked Questions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-sm">What are the sending limits?</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Gmail limits personal accounts (@gmail.com) to 500 emails per day. Workspace accounts get 2,000/day. We enforce these limits to protect your account reputation.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">Can I export my data?</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Currently, you can export campaign reports. Full data export is coming soon.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">How do I delete my account?</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Go to Settings in the sidebar. The "Danger Zone" has a one-click delete button that purges all your data from our servers instantly.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
