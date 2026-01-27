"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Mail, Megaphone, Activity, CheckCircle2, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, subDays, formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCampaigns: 0,
        activeCampaigns: 0,
        emailsSentTotal: 0,
        systemHealth: "Unknown"
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [recentSystemEvents, setRecentSystemEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            // SECURITY: Verify admin access
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
                router.push('/dashboard');
                return;
            }

            // 1. Fetch Users Count (Profiles)
            const { count: usersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // 2. Fetch Campaigns Stats (AGGREGATED - No sensitive content)
            const { count: totalCampaignsCount } = await supabase
                .from('campaigns')
                .select('*', { count: 'exact', head: true });

            const { count: activeCampaignsCount } = await supabase
                .from('campaigns')
                .select('*', { count: 'exact', head: true })
                .in('status', ['sending', 'scheduled']);

            // Get total emails from campaigns stats_sent (aggregated sum)
            const { data: campaignStats } = await supabase
                .from('campaigns')
                .select('stats_sent');

            const campaignStatsTotal = campaignStats?.reduce((acc, curr) => acc + (curr.stats_sent || 0), 0) || 0;

            // Count total sent events (no user data)
            const { count: sentEventsCount } = await supabase
                .from('email_events')
                .select('*', { count: 'exact', head: true })
                .eq('event_type', 'sent');

            const totalEmailsSent = Math.max(campaignStatsTotal, sentEventsCount || 0);

            console.log('Admin Dashboard Stats (Privacy-Safe):', {
                totalUsers: usersCount,
                totalCampaigns: totalCampaignsCount,
                activeCampaigns: activeCampaignsCount,
                emailsSent: totalEmailsSent
            });

            // 3. Chart Data (Last 7 Days System-wide)
            const today = new Date();
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = subDays(today, 6 - i);
                return format(d, 'MMM dd');
            });

            // Fetch recent campaigns to backfill 'Sent' counts where events might be missing
            const { data: recentCampaignsData } = await supabase
                .from('campaigns')
                .select('stats_sent, sent_at')
                .gte('sent_at', subDays(today, 7).toISOString());

            const { data: events } = await supabase
                .from('email_events')
                .select('created_at, event_type')
                .gte('created_at', subDays(today, 7).toISOString());

            const dailyData = last7Days.map(day => {
                const dayEvents = events?.filter(e => format(new Date(e.created_at), 'MMM dd') === day) || [];

                // Calculate sent from campaigns on this day
                const dayCampaigns = recentCampaignsData?.filter(c => c.sent_at && format(new Date(c.sent_at), 'MMM dd') === day) || [];
                const campaignsSentCount = dayCampaigns.reduce((sum, c) => sum + (c.stats_sent || 0), 0);
                const eventsSentCount = dayEvents.filter(e => e.event_type === 'sent').length;

                // Admin cares about total volume
                return {
                    name: day,
                    activity: dayEvents.length, // Activity generally implies interaction (opens/clicks) + sends. 
                    // If we have "phantom" sends from campaigns, we should probably add them to activity score?
                    // For now, let's keep activity as "Events logged" but fix 'sent'.
                    // Actually, if we correct 'sent', we should probably bump activity too if it's lagging.
                    sent: Math.max(campaignsSentCount, eventsSentCount)
                };
            });
            setChartData(dailyData);

            // 4. Recent Activity Summary (Privacy-Safe - No campaign names or user data)
            const { count: recentSentCount } = await supabase
                .from('email_events')
                .select('*', { count: 'exact', head: true })
                .eq('event_type', 'sent')
                .gte('created_at', subDays(today, 1).toISOString());

            const { count: recentOpenCount } = await supabase
                .from('email_events')
                .select('*', { count: 'exact', head: true })
                .eq('event_type', 'opened')
                .gte('created_at', subDays(today, 1).toISOString());

            const { count: recentClickCount } = await supabase
                .from('email_events')
                .select('*', { count: 'exact', head: true })
                .eq('event_type', 'clicked')
                .gte('created_at', subDays(today, 1).toISOString());

            // Set anonymized recent activity (last 24h)
            const anonymizedActivity = [
                { id: '1', event: 'Emails Sent', count: recentSentCount || 0, time: 'Last 24h', type: 'success' },
                { id: '2', event: 'Emails Opened', count: recentOpenCount || 0, time: 'Last 24h', type: 'success' },
                { id: '3', event: 'Links Clicked', count: recentClickCount || 0, time: 'Last 24h', type: 'success' },
            ];
            setRecentSystemEvents(anonymizedActivity);

            setStats({
                totalUsers: usersCount || 0,
                totalCampaigns: totalCampaignsCount,
                activeCampaigns: activeCampaignsCount,
                emailsSentTotal: totalEmailsSent,
                systemHealth: "Operational"
            });
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
                    <h2 className="text-3xl font-bold tracking-tight">Admin Overview</h2>
                    <p className="text-muted-foreground">
                        System-wide monitoring and management.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/" target="_blank">
                        <Button>
                            View Site
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Status</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
                            Good <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.systemHealth}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Registered accounts
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
                        <Megaphone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.activeCampaigns} active
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Emails Sent</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.emailsSentTotal > 1000000 ? (stats.emailsSentTotal / 1000000).toFixed(2) + 'M' : stats.emailsSentTotal.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Lifetime volume
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts & Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* System Activity Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Platform Activity</CardTitle>
                        <CardDescription>
                            Email volume over the last 7 days.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                                    />
                                    <Area type="monotone" dataKey="sent" stroke="#8884d8" fillOpacity={1} fill="url(#colorActivity)" name="Emails Sent" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* System Activity Summary */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Platform Activity (Last 24h)</CardTitle>
                        <CardDescription>
                            Aggregated email activity statistics - privacy protected.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {recentSystemEvents.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-10">No recent activity.</p>
                            ) : (
                                recentSystemEvents.map((activity) => (
                                    <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-start space-x-4">
                                            <div className={`mt-1 h-2 w-2 rounded-full ring-2 ring-offset-2 ${activity.type === 'success' ? 'bg-green-500 ring-green-100' :
                                                activity.type === 'warning' ? 'bg-amber-500 ring-amber-100' :
                                                    'bg-blue-500 ring-blue-100'
                                                }`} />
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {activity.event}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground pt-1">
                                                    {activity.time}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-primary">
                                            {(activity as any).count || 0}
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
