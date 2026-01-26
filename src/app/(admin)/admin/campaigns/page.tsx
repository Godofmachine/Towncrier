"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminCampaignsPage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchCampaigns = async () => {
            setIsLoading(true);
            const { data } = await supabase
                .from('campaigns')
                .select('*, profiles(full_name, email)') // Fetch creator info too if relation exists
                .order('created_at', { ascending: false });

            if (data) setCampaigns(data);
            setIsLoading(false);
        };

        fetchCampaigns();
    }, [supabase]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Campaigns</h2>
                <p className="text-muted-foreground">
                    Monitor all email campaigns sent through the platform.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Global Campaign Log</CardTitle>
                    <CardDescription>
                        Real-time status of all user campaigns.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Campaign Name</TableHead>
                                <TableHead>Creator</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Stats (S/O/C)</TableHead>
                                <TableHead className="text-right">Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {campaigns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No campaigns found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                campaigns.map((campaign) => (
                                    <TableRow key={campaign.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                {campaign.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {campaign.profiles?.email || 'Unknown'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                campaign.status === 'sent' ? 'default' :
                                                    campaign.status === 'sending' ? 'secondary' : 'outline'
                                            } className={
                                                campaign.status === 'sent' ? 'bg-green-600 hover:bg-green-600' :
                                                    campaign.status === 'sending' ? 'bg-blue-100 text-blue-700' : ''
                                            }>
                                                {campaign.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm font-mono">
                                            {campaign.stats_sent || 0} / {campaign.stats_opened || 0} / {campaign.stats_clicked || 0}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-sm">
                                            {campaign.created_at ? formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true }) : 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
