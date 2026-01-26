"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";

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
        }
    }, [open, supabase]);

    const handleSave = async () => {
        if (!selectedGroupId) return;
        setIsSaving(true);

        try {
            // Prepare payload
            const payload = selectedIds.map(id => ({
                group_id: selectedGroupId,
                recipient_id: id
            }));

            // Upsert to avoid duplicates (assuming unique constraint on group_id + recipient_id)
            const { error } = await supabase
                .from('group_members')
                .upsert(payload, { onConflict: 'group_id, recipient_id', ignoreDuplicates: true });

            if (error) throw error;

            toast.success(`Added ${selectedIds.length} recipients to group`);
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
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Select Group
                        </label>
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
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!selectedGroupId || isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add to Group
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
