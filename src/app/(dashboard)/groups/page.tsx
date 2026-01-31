"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Users2, MoreHorizontal, Mail, Loader2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EditGroupDialog } from "@/components/groups/edit-group-dialog";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function GroupsPage() {
    const router = useRouter(); // Import at top level if not present, though this is a full snippet replacement it might be missing imports if not careful. Assuming Component is valid.
    /* Wait, I cannot see the imports in the ReplacementContent context easily without context lines. 
       Use imports from existing file. Check previous view_file. */
    const [groups, setGroups] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingGroup, setEditingGroup] = useState<any | null>(null);
    const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const supabase = createClient();

    const fetchGroups = async () => {
        setIsLoading(true);
        // Assuming 'broadcast_groups' table exists as per schema
        const { data } = await supabase
            .from('broadcast_groups')
            .select('*, group_members(count)'); // Get count of members
        // Order logic
        // .order('created_at', { ascending: false }); 
        // We need to re-sort manually if Supabase doesn't support easy ordering on basic cols with deep select without weird syntax.
        // But simple order normally works on the main table.

        if (data) {
            // Map count properly
            const formatted = data.map((g: any) => ({
                ...g,
                member_count: g.group_members ? g.group_members[0]?.count : 0
            })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setGroups(formatted);
        }
        setIsLoading(false);
    };

    const deleteGroup = async () => {
        if (!deletingGroupId) return;
        setIsDeleting(true);

        const { error } = await supabase
            .from('broadcast_groups')
            .delete()
            .eq('id', deletingGroupId);

        if (error) {
            toast.error("Failed to delete group");
        } else {
            toast.success("Group deleted");
            fetchGroups();
        }
        setIsDeleting(false);
        setDeletingGroupId(null);
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Broadcast Groups</h2>
                    <p className="text-muted-foreground mt-1">
                        Segment your audience for targeted campaigns.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/groups/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Group
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-20 flex justify-center text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <>
                        {groups.map((group) => (
                            <Card
                                key={group.id}
                                className="hover:border-primary/50 transition-colors group relative cursor-pointer"
                                onClick={() => router.push(`/groups/${group.id}`)}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className={`h-2 w-12 rounded-full bg-blue-500 mb-3 opacity-80`} />
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/groups/${group.id}`} className="cursor-pointer">
                                                            Manage Members
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setEditingGroup(group)}>
                                                        Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => setDeletingGroupId(group.id)}>
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                    <div className="hover:underline"> {/* Link logic handled by Card onClick, but keeping visual style */}
                                        <CardTitle className="text-xl">{group.name}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-2 mb-4">
                                        <Badge variant="secondary">{group.category || "General"}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Users2 className="h-4 w-4" />
                                        <span className="font-medium text-foreground">{group.member_count || 0}</span> members
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-2">
                                    <div onClick={(e) => e.stopPropagation()} className="w-full">
                                        <Button variant="outline" className="w-full" size="sm" asChild>
                                            <Link href={`/campaigns/new?groupId=${group.id}`}>
                                                <Mail className="mr-2 h-3 w-3" />
                                                Send Campaign
                                            </Link>
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}

                        {/* Create New Card Placeholder */}
                        <Link href="/groups/new" className="h-full">
                            <div className="h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-muted-foreground hover:bg-muted/30 transition-colors cursor-pointer min-h-[220px]">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                    <Plus className="h-6 w-6" />
                                </div>
                                <p className="font-medium">Create New Group</p>
                            </div>
                        </Link>
                    </>
                )}
            </div>

            <EditGroupDialog
                group={editingGroup}
                open={!!editingGroup}
                onOpenChange={(open) => !open && setEditingGroup(null)}
                onSuccess={fetchGroups}
            />

            <ConfirmDialog
                open={!!deletingGroupId}
                onOpenChange={(open) => !open && setDeletingGroupId(null)}
                title="Delete Group?"
                description="This will permanently delete the group and its associations. Contacts will remain."
                onConfirm={deleteGroup}
                isLoading={isDeleting}
                variant="destructive"
                confirmText="Delete Group"
            />
        </div>
    );
}
