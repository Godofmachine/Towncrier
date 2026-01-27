"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Mail, Megaphone, ArrowUpRight, Plus, Loader2, AlertTriangle, MousePointerClick, FileWarning, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
    const [stats, setStats] = useState({
        recipients: 0,
        groups: 0,
        campaigns: 0,
        emailsSentToday: 0,
        totalSent: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0
    });
    const [gmailConnected, setGmailConnected] = useState(false);
    const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Redirect if not authenticated to prevent infinite load
                // In client component we can use window or router, but here fetching inside effect:
                window.location.href = '/login';
                return;
            }

            // 1. Basic Counts
            const recipientsCount = await supabase.from('recipients').select('*', { count: 'exact', head: true });
            const groupsCount = await supabase.from('broadcast_groups').select('*', { count: 'exact', head: true });
            const campaignsCount = await supabase.from('campaigns').select('*', { count: 'exact', head: true });

            // 2. Profile (Quota & Connection)
            const { data: profile } = await supabase.from('profiles').select('emails_sent_today, gmail_connected').eq('id', user.id).single();

            // 3. Analytic Stats
            const { data: campaigns } = await supabase
                .from('campaigns')
                .select('stats_sent, stats_opened, stats_clicked, stats_bounced');

            let totalSent = 0, openRate = 0, clickRate = 0, bounceRate = 0;

            if (campaigns && campaigns.length > 0) {
                totalSent = campaigns.reduce((acc, curr) => acc + (curr.stats_sent || 0), 0);
                const totalOpened = campaigns.reduce((acc, curr) => acc + (curr.stats_opened || 0), 0);
                const totalClicked = campaigns.reduce((acc, curr) => acc + (curr.stats_clicked || 0), 0);
                const totalBounced = campaigns.reduce((acc, curr) => acc + (curr.stats_bounced || 0), 0);

                openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
                clickRate = totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0;
                bounceRate = totalSent > 0 ? Math.round((totalBounced / totalSent) * 100) : 0;
            }

            // 4. Chart Data (Mock/Real Hybrid)
            const today = new Date();
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = subDays(today, 6 - i);
                return format(d, 'MMM dd');
            });

            const { data: events } = await supabase
                .from('email_events')
                .select('created_at, event_type')
                .gte('created_at', subDays(today, 7).toISOString());

            const dailyData = last7Days.map(day => {
                const dayEvents = events?.filter(e => format(new Date(e.created_at), 'MMM dd') === day) || [];
                return {
                    name: day,
                    sent: dayEvents.filter(e => e.event_type === 'sent').length,
                    opened: dayEvents.filter(e => e.event_type === 'opened').length,
                    clicked: dayEvents.filter(e => e.event_type === 'clicked').length
                };
            });
            setChartData(dailyData);

            // 5. Recent Activity
            const { data: activity } = await supabase
                .from('email_events')
                .select('*, recipients(email, first_name, last_name), campaigns(name)')
                .order('created_at', { ascending: false })
                .limit(5); // Limit to 5 for dashboard

            if (activity) setRecentActivity(activity);

            setStats({
                recipients: recipientsCount.count || 0,
                groups: groupsCount.count || 0,
                campaigns: campaignsCount.count || 0,
                emailsSentToday: profile?.emails_sent_today || 0,
                totalSent,
                openRate,
                clickRate,
                bounceRate
            });
            setGmailConnected(!!profile?.gmail_connected);

            setIsLoading(false);
        };

        fetchData();
    }, [supabase]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Your central command center.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href="/recipients/new">
                            <Plus className="mr-2 h-4 w-4" /> Add Recipient
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/campaigns/new">
                            <Plus className="mr-2 h-4 w-4" /> New Campaign
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Status Alert */}
            {!gmailConnected && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-amber-900 dark:text-amber-200">Gmail Not Connected</h3>
                            <p className="text-sm text-amber-700 dark:text-amber-400">Connect your account to start sending campaigns.</p>
                        </div>
                    </div>
                    <Button asChild variant="default" className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto">
                        <Link href="/settings">Connect Now</Link>
                    </Button>
                </div>
            )}

            {/* Main Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSent}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.emailsSentToday} sent today
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.openRate}%</div>
                        <p className="text-xs text-muted-foreground">Average engagement</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.clickRate}%</div>
                        <p className="text-xs text-muted-foreground">Conversion health</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Audience Size</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.recipients}</div>
                        <p className="text-xs text-muted-foreground">
                            Across {stats.groups} groups
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts & Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Engagement Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Engagement Trends</CardTitle>
                        <CardDescription>
                            Email activity over the last 7 days.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[300px] w-full">
                            {chartData.every(d => d.sent === 0) ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-md m-4">
                                    <p>No activity yet</p>
                                    <p className="text-xs">Send a campaign to see data here</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                                        />
                                        <Area type="monotone" dataKey="sent" stroke="#8884d8" fillOpacity={1} fill="url(#colorSent)" name="Emails Sent" />
                                        <Area type="monotone" dataKey="opened" stroke="#82ca9d" fillOpacity={1} fill="url(#colorOpened)" name="Opened" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Activity Feed */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Live Activity</CardTitle>
                        <CardDescription>
                            Latest real-time interactions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {recentActivity.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-10">No recent activity.</p>
                            ) : (
                                recentActivity.map((event) => (
                                    <div key={event.id} className="flex items-start space-x-4">
                                        <div className={`mt-1 h-2 w-2 rounded-full ring-2 ring-offset-2 ${event.event_type === 'opened' ? 'bg-green-500 ring-green-100' :
                                            event.event_type === 'clicked' ? 'bg-blue-500 ring-blue-100' :
                                                event.event_type === 'bounced' ? 'bg-red-500 ring-red-100' :
                                                    'bg-gray-400 ring-gray-100'
                                            }`} />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {event.recipients?.email || "Unknown"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {event.event_type === 'sent' && "Received"}
                                                {event.event_type === 'opened' && "Opened"}
                                                {event.event_type === 'clicked' && "Clicked"}
                                                {event.event_type === 'bounced' && "Bounced"}
                                                {" "}
                                                <span className="font-medium text-foreground">
                                                    {event.campaigns?.name}
                                                </span>
                                            </p>
                                            <p className="text-[10px] text-muted-foreground pt-1">
                                                {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
