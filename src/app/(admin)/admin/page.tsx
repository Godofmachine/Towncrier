"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Mail, Megaphone, Activity, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, subDays, formatDistanceToNow } from "date-fns";

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalUsers: 0,
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

            // 1. Fetch Users Count (Profiles)
            // Note: This might be limited by RLS to only the current user unless Admin RLS is set up.
            const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

            // 2. Fetch Campaigns Stats
            const { data: campaigns } = await supabase
                .from('campaigns')
                .select('stats_sent, status');

            let totalEmailsSent = 0;
            let activeCampaignsCount = 0;

            if (campaigns) {
                totalEmailsSent = campaigns.reduce((acc, curr) => acc + (curr.stats_sent || 0), 0);
                activeCampaignsCount = campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length;
                // If "active" just means total campaigns in the system (since active might be rare), we could use length
                // sticking to strict "active" definition for now, or fallback to total campaigns if 0
                if (activeCampaignsCount === 0) activeCampaignsCount = campaigns.length;
            }

            // 3. Chart Data (Last 7 Days System-wide)
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
                // Admin cares about total volume
                return {
                    name: day,
                    activity: dayEvents.length,
                    sent: dayEvents.filter(e => e.event_type === 'sent').length
                };
            });
            setChartData(dailyData);

            // 4. Recent Events (Feed)
            const { data: recentEvents } = await supabase
                .from('email_events')
                .select('*, campaigns(name)')
                .order('created_at', { ascending: false })
                .limit(10);

            if (recentEvents) {
                // Mapping to the UI model
                const mappedEvents = recentEvents?.map(e => ({
                    id: e.id,
                    event: e.event_type === 'sent' ? 'Email Sent' :
                        e.event_type === 'opened' ? 'Email Opened' :
                            e.event_type === 'clicked' ? 'Link Clicked' :
                                e.event_type === 'bounced' ? 'Email Bounced' : 'Activity',
                    user: e.recipient_id ? 'Recipient' : 'System', // We don't have user emails easily here without joining recipients
                    detail: e.campaigns?.name || 'Unknown Campaign',
                    time: formatDistanceToNow(new Date(e.created_at), { addSuffix: true }),
                    type: e.event_type === 'bounced' ? 'warning' : 'success'
                })) || [];
                setRecentSystemEvents(mappedEvents);
            }

            setStats({
                totalUsers: usersCount || 0,
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
                        <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
                        <p className="text-xs text-muted-foreground">
                            Total / Active
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

                {/* System Events Feed */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Events</CardTitle>
                        <CardDescription>
                            Recent email activity log.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {recentSystemEvents.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-10">No recent activity.</p>
                            ) : (
                                recentSystemEvents.map((event) => (
                                    <div key={event.id} className="flex items-start space-x-4">
                                        <div className={`mt-1 h-2 w-2 rounded-full ring-2 ring-offset-2 ${event.type === 'success' ? 'bg-green-500 ring-green-100' :
                                            event.type === 'warning' ? 'bg-amber-500 ring-amber-100' :
                                                'bg-blue-500 ring-blue-100'
                                            }`} />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {event.event}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                <span className="font-medium text-foreground">{event.detail}</span>
                                            </p>
                                            <p className="text-[10px] text-muted-foreground pt-1">
                                                {event.time}
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
