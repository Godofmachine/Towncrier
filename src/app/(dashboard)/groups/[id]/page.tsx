"use client";

import { useState, useEffect, useCallback, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, MoreHorizontal, Plus, Search, Trash2, Upload, UserPlus, Users, FileSpreadsheet, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { AddExistingMemberDialog } from "@/components/groups/add-existing-member-dialog";
import { ImportDialog } from "@/components/recipients/import-dialog";
import { QuickAddRecipientDialog } from "@/components/recipients/quick-add-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function GroupDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: groupId } = use(params);
    const router = useRouter();
    const supabase = createClient();

    const [group, setGroup] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Dialog States
    const [isAddExistingOpen, setIsAddExistingOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);
    const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

    // Fetch Data
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        // 1. Fetch Group Details
        const { data: groupData, error: groupError } = await supabase
            .from('broadcast_groups')
            .select('*')
            .eq('id', groupId)
            .single();

        if (groupError) {
            toast.error("Group not found");
            router.push('/groups');
            return;
        }
        setGroup(groupData);

        // 2. Fetch Members
        const { data: memberData, error: memberError } = await supabase
            .from('group_members')
            .select('recipient_id, recipients:recipient_id(*)')
            .eq('group_id', groupId);

        if (memberError) {
            console.error("Error fetching members:", memberError);
            console.error("Error details:", JSON.stringify(memberError, null, 2));
            setIsLoading(false);
            return;
        }

        // Flatten the structure
        const flatMembers = memberData
            ?.map((item: any) => item.recipients)
            .filter((r: any) => r) || [];

        setMembers(flatMembers);
        setIsLoading(false);
    }, [groupId, router, supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleAll = () => {
        if (selectedIds.size === filteredMembers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredMembers.map(m => m.id)));
        }
    };

    const handleRemoveMember = async () => {
        if (!removingMemberId) return;
        setIsRemoving(true);

        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('recipient_id', removingMemberId);

        if (error) {
            toast.error("Failed to remove member");
        } else {
            toast.success("Member removed");
            setMembers(prev => prev.filter(m => m.id !== removingMemberId));
        }
        setIsRemoving(false);
        setRemovingMemberId(null);
    };

    const handleBulkRemove = async () => {
        setIsRemoving(true);

        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .in('recipient_id', Array.from(selectedIds));

        if (error) {
            toast.error("Failed to remove members");
        } else {
            toast.success(`Removed ${selectedIds.size} member(s)`);
            setMembers(prev => prev.filter(m => !selectedIds.has(m.id)));
            setSelectedIds(new Set());
        }
        setIsRemoving(false);
        setIsBulkConfirmOpen(false);
    };

    const handleCreateContactSuccess = async (newContact: any) => {
        // Link new contact to group
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Authentication required");
            return;
        }

        const { error } = await supabase
            .from('group_members')
            .insert({
                group_id: groupId,
                recipient_id: newContact.id
            });

        if (error) {
            toast.error("Contact created but failed to look to group");
        } else {
            toast.success("Contact added to group");
            fetchData(); // Refresh list
        }
    };

    const filteredMembers = members.filter(m =>
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.first_name + ' ' + m.last_name).toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!group && isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Button variant="ghost" size="sm" className="w-fit -ml-2" asChild>
                    <Link href="/groups">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Groups
                    </Link>
                </Button>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{group?.name}</h2>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <Badge variant="secondary">{group?.category || "General"}</Badge>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1"><Users className="h-4 w-4" /> with {members.length} members</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedIds.size > 0 && (
                            <Button variant="destructive" size="sm" onClick={() => setIsBulkConfirmOpen(true)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Remove ({selectedIds.size})
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <Link href={`/campaigns/new?groupId=${groupId}`}>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Campaign
                            </Link>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" /> Add Members
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => setIsAddExistingOpen(true)}>
                                    <UserPlus className="mr-2 h-4 w-4" /> Existing Contact
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsImportOpen(true)}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Import CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsQuickAddOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" /> Create New
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-medium">Group Members</CardTitle>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search members..."
                                className="pl-9 h-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]">
                                    <Checkbox
                                        checked={filteredMembers.length > 0 && selectedIds.size === filteredMembers.length}
                                        onCheckedChange={toggleAll}
                                    />
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Custom Fields</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredMembers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        No members in this group.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMembers.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.has(member.id)}
                                                onCheckedChange={() => toggleSelection(member.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{member.first_name} {member.last_name}</TableCell>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap max-w-[200px]">
                                                {member.custom_fields && Object.keys(member.custom_fields).slice(0, 3).map((key: string) => (
                                                    <Badge key={key} variant="outline" className="text-[10px] bg-muted/50 font-normal">
                                                        {key}: {member.custom_fields[key]}
                                                    </Badge>
                                                ))}
                                                {member.custom_fields && Object.keys(member.custom_fields).length > 3 && (
                                                    <span className="text-[10px] text-muted-foreground">+{Object.keys(member.custom_fields).length - 3} more</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => setRemovingMemberId(member.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AddExistingMemberDialog
                groupId={groupId}
                open={isAddExistingOpen}
                onOpenChange={setIsAddExistingOpen}
                onSuccess={fetchData}
            />

            <ConfirmDialog
                open={!!removingMemberId}
                onOpenChange={(open) => !open && setRemovingMemberId(null)}
                title="Remove Member?"
                description="Are you sure you want to remove this person from the group? This will not delete the contact from your database."
                onConfirm={handleRemoveMember}
                isLoading={isRemoving}
                variant="destructive"
                confirmText="Remove"
            />

            <ConfirmDialog
                open={isBulkConfirmOpen}
                onOpenChange={setIsBulkConfirmOpen}
                title="Remove Members?"
                description={`Are you sure you want to remove ${selectedIds.size} member(s) from this group? This will not delete the contacts from your database.`}
                onConfirm={handleBulkRemove}
                isLoading={isRemoving}
                variant="destructive"
                confirmText="Remove"
            />

            <ImportDialog
                groupId={groupId}
                onSuccess={fetchData}
                open={isImportOpen}
                onOpenChange={setIsImportOpen}
            />

            <QuickAddRecipientDialog
                onSuccess={handleCreateContactSuccess}
                open={isQuickAddOpen}
                onOpenChange={setIsQuickAddOpen}
            />
        </div>
    );
}
