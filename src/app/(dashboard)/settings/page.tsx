"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Mail, Shield, AlertTriangle, CheckCircle2, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function SettingsContent() {
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [gmailConnected, setGmailConnected] = useState(false);

    // Newsletter State
    const [newsletterStatus, setNewsletterStatus] = useState<'subscribed' | 'unsubscribed'>('unsubscribed');
    const [isNewsletterLoading, setIsNewsletterLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    useEffect(() => {
        // Check for URL params (success/error from callbacks)
        if (searchParams.get('success') === 'gmail_connected') {
            toast.success("Gmail connected successfully!");
            // Clear params
            router.replace('/settings');
        }

        const fetchProfile = async () => {
            try {
                setIsLoading(true);
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push('/login');
                    return;
                }

                // Fetch detailed profile from DB
                const { data: dbProfile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                // Self-Heal: Check if usage needs backfilling from untracked campaigns
                const todayStr = new Date().toISOString().split('T')[0];
                const { data: todayCampaigns } = await supabase
                    .from('campaigns')
                    .select('stats_sent, sent_at')
                    .gte('sent_at', `${todayStr}T00:00:00.000Z`)
                    .lte('sent_at', `${todayStr}T23:59:59.999Z`);

                const calculatedUsage = todayCampaigns?.reduce((sum, c) => sum + (c.stats_sent || 0), 0) || 0;
                let usageToDisplay = dbProfile?.emails_sent_today || 0;

                // If DB has 0 or less than calculated, and reset date is correct, we update it.
                // Or if DB reset date is old, we reset/update to calculated.
                if (dbProfile && (dbProfile.last_reset_date !== todayStr || usageToDisplay < calculatedUsage)) {
                    // Update DB with correct value
                    await supabase.from('profiles').update({
                        emails_sent_today: calculatedUsage,
                        last_reset_date: todayStr
                    }).eq('id', user.id);

                    usageToDisplay = calculatedUsage;

                    // Optimistically update the object we just fetched
                    dbProfile.emails_sent_today = calculatedUsage;
                    dbProfile.last_reset_date = todayStr;
                }

                setProfile({
                    ...dbProfile,
                    email: user.email,
                    name: user.user_metadata.full_name || user.user_metadata.name || "User"
                });

                setGmailConnected(!!dbProfile?.gmail_connected);

                // Fetch Newsletter Status
                try {
                    const res = await fetch('/api/newsletter/subscribe');
                    if (res.ok) {
                        const data = await res.json();
                        setNewsletterStatus(data.status);
                    }
                } catch (e) { console.error("Newsletter fetch error", e); }

            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [supabase, router, searchParams]);

    const toggleNewsletter = async () => {
        setIsNewsletterLoading(true);
        const newStatus = newsletterStatus === 'subscribed' ? 'unsubscribed' : 'subscribed';
        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                body: JSON.stringify({ status: newStatus }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error("Failed to update");
            setNewsletterStatus(newStatus);
            toast.success(newStatus === 'subscribed' ? "Subscribed to newsletter" : "Unsubscribed from newsletter");
        } catch (e) {
            toast.error("Failed to update subscription");
        } finally {
            setIsNewsletterLoading(false);
        }
    };

    const handleConnect = () => {
        // Redirect to API route
        router.push('/api/gmail/connect');
    };

    const handleDisconnect = async () => {
        // Call API to remove tokens
        // For MVP, simplistic update
        // In real app, call DELETE /api/gmail/token
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ gmail_connected: false, gmail_email: null })
                .eq('id', profile.id);

            if (error) throw error;

            setGmailConnected(false);
            toast.success("Gmail disconnected");
        } catch (e) {
            toast.error("Failed to disconnect");
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const res = await fetch('/api/user/delete', {
                method: 'DELETE'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete account');
            }

            toast.success("Account deleted successfully");
            // Redirect to home after short delay
            setTimeout(() => {
                router.push('/');
            }, 1500);
        } catch (e: any) {
            toast.error(e.message || "Failed to delete account");
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const dailySent = profile?.emails_sent_today || 0;
    const dailyLimit = profile?.daily_send_limit || 500;

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500 max-w-4xl">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground mt-1">
                    Manage your account and email connection.
                </p>
            </div>

            {/* Gmail Connection Card */}
            <Card className="border-l-4 border-l-primary shadow-sm">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                        <div className="space-y-1">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Gmail Connection
                            </CardTitle>
                            <CardDescription>
                                Connect your Gmail account to send campaigns directly from your address.
                            </CardDescription>
                        </div>
                        {gmailConnected ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1 w-fit">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Connected
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 px-3 py-1 w-fit">
                                Not Connected
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {gmailConnected ? (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-muted/40 p-4 rounded-lg">
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                                        {(profile.gmail_email || profile.email)[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 sm:flex-none min-w-0">
                                        <p className="font-medium truncate">{profile.gmail_email || profile.email}</p>
                                        <p className="text-xs text-muted-foreground">Connected</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-destructive hover:text-destructive w-full sm:w-auto ml-auto">
                                    <LogOut className="mr-2 h-4 w-4" /> Disconnect
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Daily Sending Limit</span>
                                    <span className="font-medium">{dailySent} / {dailyLimit} emails</span>
                                </div>
                                <Progress value={(dailySent / dailyLimit) * 100} className="h-2" />
                                <p className="text-xs text-muted-foreground">
                                    Resets in 24 hours. Upgrade to Google Workspace for 2,000/day limit.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-200 dark:border-amber-900/20 text-sm space-y-3">
                            <h4 className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" /> Connection Required
                            </h4>
                            <p className="text-amber-700 dark:text-amber-400 font-medium">
                                You must connect a Gmail account to use Towncrier.
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-400 ml-1">
                                <li>Towncrier sends emails exclusively through your Gmail.</li>
                                <li>We do not use incomplete generic servers.</li>
                                <li>100% Free sending using your existing quota.</li>
                            </ul>
                            <div className="flex flex-col sm:flex-row gap-2 mt-2">
                                <Button asChild variant="outline" className="w-full sm:flex-1 bg-transparent border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50">
                                    <Link href="/docs">
                                        Learn More
                                    </Link>
                                </Button>
                                <Button onClick={handleConnect} className="w-full sm:flex-1" variant="default">
                                    Connect Gmail Account
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>Update your personal information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input defaultValue={profile?.name || ""} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input defaultValue={profile?.email || ""} disabled />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col-reverse sm:flex-row justify-between border-t pt-6 gap-3 sm:gap-0">
                        <Button variant="outline" asChild className="w-full sm:w-auto">
                            <Link href="/reset-password">Change Password</Link>
                        </Button>
                        <Button className="w-full sm:w-auto">Save Changes</Button>
                    </CardFooter>
                </Card>

                <div className="space-y-6">
                    {/* Newsletter Preferences */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Newsletter
                            </CardTitle>
                            <CardDescription>Stay updated with feature releases and tips.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="space-y-0.5">
                                    <h4 className="font-medium text-sm">Product Updates</h4>
                                    <p className="text-xs text-muted-foreground">Receive improved workflows and tips.</p>
                                </div>
                                {newsletterStatus === 'subscribed' ? (
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">Subscribed</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-muted-foreground">Unsubscribed</Badge>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="border-t pt-6">
                            <Button
                                variant={newsletterStatus === 'subscribed' ? "outline" : "default"}
                                className="w-full"
                                onClick={toggleNewsletter}
                                disabled={isNewsletterLoading}
                            >
                                {isNewsletterLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {newsletterStatus === 'subscribed' ? "Unsubscribe" : "Subscribe to Newsletter"}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Plan/Billing - Placeholder */}
                    <Card className="opacity-70 pointer-events-none grayscale">
                        <CardHeader>
                            <CardTitle className="flex justify-between">
                                Subscription
                                <Badge variant="secondary">Coming Soon</Badge>
                            </CardTitle>
                            <CardDescription>Manage your The Towncrier Pro plan.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted h-32 rounded-lg flex items-center justify-center">
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription>Irreversible and destructive actions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">Delete Account</h4>
                            <p className="text-xs text-muted-foreground">Permanently delete your account and all data. This cannot be undone.</p>
                        </div>
                        <Button
                            variant="destructive"
                            className="w-full sm:w-auto"
                            onClick={() => {
                                if (confirm("Are you absolutely sure? This will permanently delete your account and all campaigns, contacts, and data. This action cannot be undone.")) {
                                    handleDeleteAccount();
                                }
                            }}
                        >
                            Delete Account
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
            <SettingsContent />
        </Suspense>
    );
}
