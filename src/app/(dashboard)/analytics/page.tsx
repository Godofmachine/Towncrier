"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { createClient } from "@/lib/supabase/client";
import { Loader2, Mail, MousePointerClick, UserPlus, FileWarning, Eye } from "lucide-react";
import { format, subDays } from "date-fns";

export default function AnalyticsPage() {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSent: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setIsLoading(true);

            // 1. Fetch Aggregated Campaign Stats
            const { data: campaigns } = await supabase
                .from('campaigns')
                .select('stats_sent, stats_opened, stats_clicked, stats_bounced')
                .neq('status', 'draft');

            if (campaigns && campaigns.length > 0) {
                const totalSent = campaigns.reduce((acc, curr) => acc + (curr.stats_sent || 0), 0);
                const totalOpened = campaigns.reduce((acc, curr) => acc + (curr.stats_opened || 0), 0);
                const totalClicked = campaigns.reduce((acc, curr) => acc + (curr.stats_clicked || 0), 0);
                const totalBounced = campaigns.reduce((acc, curr) => acc + (curr.stats_bounced || 0), 0);

                setStats({
                    totalSent,
                    openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
                    clickRate: totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0, // Click-to-open rate
                    bounceRate: totalSent > 0 ? Math.round((totalBounced / totalSent) * 100) : 0,
                });
            }

            // 2. Fetch Chart Data (Mocking daily trend if no real time-series data exists yet)
            // In a real app, you'd aggregate `email_events` by day. 
            // Here we'll generate the last 7 days of "activity" based on real events if available, or empty structure.
            const today = new Date();
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = subDays(today, 6 - i);
                return format(d, 'MMM dd');
            });

            // Mock shape for visualization plan compliance (Recharts requires data array)
            // We will attempt to count real events if possible, but fallback to 0s
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


            // 3. Recent Activity Feed
            const { data: activity } = await supabase
                .from('email_events')
                .select('*, recipients(email, first_name, last_name), campaigns(name)')
                .order('created_at', { ascending: false })
                .limit(10);

            if (activity) setRecentActivity(activity);

            setIsLoading(false);
        };

        fetchAnalytics();
    }, [supabase]);

    return (
        <div className="space-y-8 animate-in fade-in-50">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
                <p className="text-muted-foreground mt-1">
                    Overview of your campaign performance.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Emails Sent</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">All time volume</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.openRate}%</div>
                        <p className="text-xs text-muted-foreground">Average performance</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.clickRate}%</div>
                        <p className="text-xs text-muted-foreground">Click-to-open ratio</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                        <FileWarning className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.bounceRate}%</div>
                        <p className="text-xs text-muted-foreground">Delivery health</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                {/* Main Chart */}
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Engagement Trends</CardTitle>
                        <CardDescription>Daily activity for the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[300px] w-full">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : chartData.every(d => d.sent === 0) ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-md m-4">
                                    <p>No activity data available yet</p>
                                    <p className="text-xs">Send a campaign to see trends</p>
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

                {/* Recent Activity */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest interactions from your audience</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {isLoading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : recentActivity.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-10">No recent activity found.</p>
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
                                                {event.recipients?.email || "Unknown Recipient"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {event.event_type === 'sent' && "Received email"}
                                                {event.event_type === 'opened' && "Opened email"}
                                                {event.event_type === 'clicked' && "Clicked a link in"}
                                                {event.event_type === 'bounced' && "Bounced from"}
                                                {" "}
                                                <span className="font-medium text-foreground">
                                                    {event.campaigns?.name || "Campaign"}
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

// Helper needed since we don't import it in this file
import { formatDistanceToNow } from "date-fns";
