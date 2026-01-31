"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Loader2, Copy, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const supabase = createClient();

    const fetchCampaigns = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('campaigns')
            .select('*')
            .neq('status', 'archived') // Exclude soft-deleted
            .order('created_at', { ascending: false });

        if (data) setCampaigns(data);
        setIsLoading(false);
        setSelectedIds(new Set()); // Reset selection
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleSelectAll = (checked: boolean, tab: string) => {
        if (checked) {
            // Only select items visible in the current tab
            const visibleCampaigns = campaigns.filter(c => tab === 'all' || c.status === tab);
            setSelectedIds(new Set(visibleCampaigns.map(c => c.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSet = new Set(selectedIds);
        if (checked) newSet.add(id);
        else newSet.delete(id);
        setSelectedIds(newSet);
    };

    const handleBulkDelete = async () => {
        setIsDeleting(true);
        try {
            // Soft delete: set status to 'archived'
            const { error } = await supabase
                .from('campaigns')
                .update({ status: 'archived' })
                .in('id', Array.from(selectedIds));

            if (error) throw error;

            toast.success(`Deleted ${selectedIds.size} campaign(s)`);
            fetchCampaigns();
            setShowDeleteConfirm(false);
        } catch (error: any) {
            toast.error("Failed to delete campaigns");
        } finally {
            setIsDeleting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'sent': return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">Sent</Badge>;
            case 'scheduled': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">Scheduled</Badge>;
            default: return <Badge variant="outline">Draft</Badge>;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Campaigns</h2>
                    <p className="text-muted-foreground mt-1">
                        Create, schedule, and track your email blasts.
                    </p>
                </div>
                <div className="flex gap-2">
                    {selectedIds.size > 0 && (
                        <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedIds.size})
                        </Button>
                    )}
                    <Button asChild>
                        <Link href="/campaigns/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Campaign
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="mb-4 flex w-full overflow-x-auto no-scrollbar justify-start h-auto py-2 gap-2 bg-muted/50 scroll-pl-6 snap-x">
                            <TabsTrigger value="all" className="shrink-0 snap-start">All Campaigns</TabsTrigger>
                            <TabsTrigger value="sent" className="shrink-0 snap-start">Sent</TabsTrigger>
                            <TabsTrigger value="draft" className="shrink-0 snap-start">Drafts</TabsTrigger>
                            <TabsTrigger value="scheduled" className="shrink-0 snap-start">Scheduled</TabsTrigger>
                        </TabsList>

                        {["all", "sent", "draft", "scheduled"].map((tab) => {
                            const filteredCampaigns = campaigns.filter(c => tab === 'all' || c.status === tab);
                            const isAllSelected = filteredCampaigns.length > 0 && filteredCampaigns.every(c => selectedIds.has(c.id));

                            return (
                                <TabsContent key={tab} value={tab}>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">
                                                    <Checkbox
                                                        checked={filteredCampaigns.length > 0 && isAllSelected}
                                                        onCheckedChange={(checked) => handleSelectAll(!!checked, tab)}
                                                    />
                                                </TableHead>
                                                <TableHead>Campaign Name</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Recipients</TableHead>
                                                <TableHead>Open Rate</TableHead>
                                                <TableHead className="text-right">Date</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-24 text-center">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                                    </TableCell>
                                                </TableRow>
                                            ) : filteredCampaigns.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                                        No {tab === 'all' ? '' : tab} campaigns found.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredCampaigns.map((c) => (
                                                    <TableRow key={c.id}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedIds.has(c.id)}
                                                                onCheckedChange={(checked) => handleSelectOne(c.id, !!checked)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="font-medium">{c.name}</div>
                                                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{c.subject || '(No subject)'}</div>
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(c.status)}</TableCell>
                                                        <TableCell>{c.total_recipients || c.recipients_count || '-'}</TableCell>
                                                        <TableCell>{c.open_rate ? `${c.open_rate}%` : '-'}</TableCell>
                                                        <TableCell className="text-right text-muted-foreground text-sm">
                                                            {new Date(c.created_at).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    {c.status === 'draft' ? (
                                                                        <DropdownMenuItem asChild>
                                                                            <Link href={`/campaigns/new?draft_id=${c.id}`}>
                                                                                <Pencil className="mr-2 h-4 w-4" /> Edit Draft
                                                                            </Link>
                                                                        </DropdownMenuItem>
                                                                    ) : (
                                                                        <DropdownMenuItem>View Details</DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuItem asChild>
                                                                        <Link href={`/campaigns/new?source_campaign_id=${c.id}`}>
                                                                            <Copy className="mr-2 h-4 w-4" /> Reuse / Duplicate
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="text-destructive"
                                                                        onClick={() => {
                                                                            setSelectedIds(new Set([c.id]));
                                                                            setShowDeleteConfirm(true);
                                                                        }}
                                                                    >
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TabsContent>
                            );
                        })}
                    </Tabs>
                </CardContent>
            </Card>

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title={`Delete ${selectedIds.size} Campaign(s)?`}
                description="These campaigns will be moved to archive and removed from this list. Analytics data will be preserved."
                confirmText="Delete"
                variant="destructive"
                isLoading={isDeleting}
                onConfirm={handleBulkDelete}
            />
        </div>
    );
}
