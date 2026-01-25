"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Mail, Megaphone, ArrowUpRight, Plus, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
    const [stats, setStats] = useState({
        recipients: 0,
        groups: 0,
        campaigns: 0,
        emailsSentToday: 0
    });
    const [gmailConnected, setGmailConnected] = useState(false);
    const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Counts
            const recipientsCount = await supabase.from('recipients').select('*', { count: 'exact', head: true });
            const groupsCount = await supabase.from('broadcast_groups').select('*', { count: 'exact', head: true });
            const campaignsCount = await supabase.from('campaigns').select('*', { count: 'exact', head: true });

            // 2. Profile (Quota & Connection)
            const { data: profile } = await supabase.from('profiles').select('emails_sent_today, gmail_connected').eq('id', user.id).single();

            // 3. Recent Campaigns
            const { data: recent } = await supabase
                .from('campaigns')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                recipients: recipientsCount.count || 0,
                groups: groupsCount.count || 0,
                campaigns: campaignsCount.count || 0,
                emailsSentToday: profile?.emails_sent_today || 0
            });
            setGmailConnected(!!profile?.gmail_connected);

            if (recent) setRecentCampaigns(recent);
            setIsLoading(false);
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Welcome back! Here&apos;s an overview of your outreach.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button asChild>
                        <Link href="/campaigns/new">
                            <Plus className="mr-2 h-4 w-4" /> New Campaign
                        </Link>
                    </Button>
                </div>
            </div>

            {!gmailConnected && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 rounded-lg p-4 flex items-center justify-between shadow-sm ">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-amber-900 dark:text-amber-200">Gmail Not Connected</h3>
                            <p className="text-sm text-amber-700 dark:text-amber-400">You must connect your Gmail account to send campaigns.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline" className="bg-transparent border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50">
                            <Link href="/docs">
                                Learn More
                            </Link>
                        </Button>
                        <Button asChild variant="default" className="bg-amber-600 hover:bg-amber-700 text-white">
                            <Link href="/settings">
                                Connect Now
                            </Link>
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.recipients}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all groups
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Emails Sent Today</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.emailsSentToday}</div>
                        <p className="text-xs text-muted-foreground">
                            / 500 Daily Limit
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.groups}</div>
                        <p className="text-xs text-muted-foreground">
                            Broadcast segments
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                        <Megaphone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.campaigns}</div>
                        <p className="text-xs text-muted-foreground">
                            Lifetime sent/drafts
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Campaigns</CardTitle>
                        <CardDescription>
                            Your latest email activity.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentCampaigns.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">No campaigns yet. Start your first one!</p>
                            ) : (
                                recentCampaigns.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{c.name}</p>
                                            <p className="text-xs text-muted-foreground">{c.status} • {new Date(c.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href="/campaigns">View <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Get things done faster.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button asChild variant="outline" className="w-full justify-start">
                            <Link href="/recipients/new">
                                <Plus className="mr-2 h-4 w-4" /> Add Recipient
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full justify-start">
                            <Link href="/groups/new">
                                <Users className="mr-2 h-4 w-4" /> Create Group
                            </Link>
                        </Button>
                        <Button asChild variant="ghost" className="w-full justify-start text-muted-foreground">
                            <Link href="/settings">
                                Manage Settings & Quota
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
