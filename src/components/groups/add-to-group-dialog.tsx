"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Users, Plus, X } from "lucide-react";

interface AddToGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedIds: string[];
    onSuccess?: () => void;
}

export function AddToGroupDialog({ open, onOpenChange, selectedIds, onSuccess }: AddToGroupDialogProps) {
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // New Group State
    const [isCreating, setIsCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");

    const supabase = createClient();

    useEffect(() => {
        if (open) {
            const fetchGroups = async () => {
                setIsLoading(true);
                const { data } = await supabase.from('broadcast_groups').select('id, name').order('name');
                if (data) setGroups(data);
                setIsLoading(false);
            };
            fetchGroups();
            // Reset states
            setIsCreating(false);
            setNewGroupName("");
            setSelectedGroupId("");
        }
    }, [open, supabase]);

    const handleSave = async () => {
        if (!isCreating && !selectedGroupId) return;
        if (isCreating && !newGroupName.trim()) return;

        setIsSaving(true);

        try {
            let targetGroupId = selectedGroupId;

            if (isCreating) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Authentication required");

                // Create new group
                const { data: newGroup, error: createError } = await supabase
                    .from('broadcast_groups')
                    .insert({
                        name: newGroupName.trim(),
                        user_id: user.id,
                        description: `Created while adding ${selectedIds.length} recipients`
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                targetGroupId = newGroup.id;
            }

            // Prepare payload
            const payload = selectedIds.map(id => ({
                group_id: targetGroupId,
                recipient_id: id
            }));

            // Upsert to avoid duplicates (assuming unique constraint on group_id + recipient_id)
            const { error } = await supabase
                .from('group_members')
                .upsert(payload, { onConflict: 'group_id, recipient_id', ignoreDuplicates: true });

            if (error) throw error;

            toast.success(isCreating
                ? `Created group "${newGroupName}" and added recipients`
                : `Added ${selectedIds.length} recipients to group`
            );
            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to add to group");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add to Broadcast Group</DialogTitle>
                    <DialogDescription>
                        Add {selectedIds.length} selected recipient{selectedIds.length !== 1 ? 's' : ''} to a group.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {isCreating ? "New Group Name" : "Select Group"}
                            </label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs text-primary hover:bg-transparent"
                                onClick={() => {
                                    setIsCreating(!isCreating);
                                    if (!isCreating) setSelectedGroupId("");
                                    else setNewGroupName("");
                                }}
                            >
                                {isCreating ? (
                                    <span className="flex items-center"><X className="mr-1 h-3 w-3" /> Cancel</span>
                                ) : (
                                    <span className="flex items-center"><Plus className="mr-1 h-3 w-3" /> Create new group</span>
                                )}
                            </Button>
                        </div>

                        {isCreating ? (
                            <Input
                                placeholder="E.g. Newsletter Subscribers"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                autoFocus
                            />
                        ) : (
                            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a group..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {isLoading ? (
                                        <div className="flex justify-center p-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                                    ) : groups.length === 0 ? (
                                        <div className="p-2 text-sm text-center text-muted-foreground">No groups found</div>
                                    ) : (
                                        groups.map(g => (
                                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={(!isCreating && !selectedGroupId) || (isCreating && !newGroupName.trim()) || isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isCreating ? "Create & Add" : "Add to Group"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
