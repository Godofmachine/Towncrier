"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Mail, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function AdminNewsletterPage() {
    const router = useRouter();
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchSubscribers = async () => {
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

            const { data, error } = await supabase
                .from('newsletter_subscribers')
                .select('*')
                .order('subscribed_at', { ascending: false });

            if (error) {
                toast.error("Failed to load subscribers");
            } else {
                setSubscribers(data || []);
            }
            setIsLoading(false);
        };
        fetchSubscribers();
    }, [supabase]);

    const activeCount = subscribers.filter(s => s.status === 'subscribed').length;

    const copyEmails = () => {
        const emails = subscribers
            .filter(s => s.status === 'subscribed')
            .map(s => s.email)
            .join(', ');
        navigator.clipboard.writeText(emails);
        toast.success("Copied active subscriber emails to clipboard");
    };

    const downloadCSV = () => {
        const headers = "Email,Status,Date\n";
        const rows = subscribers.map(s => `${s.email},${s.status},${s.subscribed_at}`).join("\n");
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("CSV Downloaded");
    };

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Newsletter</h1>
                    <p className="text-muted-foreground">Manage subscribers and broadcasts.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={downloadCSV}>
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Button onClick={copyEmails}>
                        <Copy className="mr-2 h-4 w-4" /> Copy Emails
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{subscribers.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
                        <Badge variant="secondary" className="bg-red-100 text-red-800">Inactive</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{subscribers.length - activeCount}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Subscribers List</CardTitle>
                    <CardDescription>Recent subscriptions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date Subscribed</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subscribers.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">{sub.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={sub.status === 'subscribed' ? 'default' : 'secondary'} className={sub.status === 'subscribed' ? "bg-green-600" : ""}>
                                            {sub.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {format(new Date(sub.subscribed_at), "MMM d, yyyy")}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {subscribers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                        No subscribers yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
