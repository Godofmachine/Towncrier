"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";

interface AddExistingMemberDialogProps {
    groupId?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    onConfirm?: (selectedIds: string[]) => void;
}

export function AddExistingMemberDialog({ groupId, open, onOpenChange, onSuccess, onConfirm }: AddExistingMemberDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [contacts, setContacts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const supabase = createClient();

    useEffect(() => {
        if (open) {
            const fetchContacts = async () => {
                setIsLoading(true);
                // Fetch all active recipients
                // Ideally we'd filter out those already in the group, but for now we'll fetch all 
                // and rely on upsert ignoreDuplicates or let user see they are adding.
                // A better UX would be to fetch group members IDs first and exclude them.

                const { data: members } = await supabase.from('group_members').select('recipient_id').eq('group_id', groupId);
                const memberIds = new Set(members?.map((m: any) => m.recipient_id) || []);

                const { data } = await supabase.from('recipients').select('*').eq('status', 'active').order('email');

                if (data) {
                    // Filter out existing members from the list options
                    setContacts(data.filter(c => !memberIds.has(c.id)));
                }
                setIsLoading(false);
                setSelectedIds(new Set());
            };
            fetchContacts();
        }
    }, [open, groupId, supabase]);

    const filteredContacts = contacts.filter(c =>
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.first_name + ' ' + c.last_name).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleSave = async () => {
        if (selectedIds.size === 0) return;
        setIsSaving(true);

        try {
            if (onConfirm) {
                // Selection Mode
                onConfirm(Array.from(selectedIds));
                onOpenChange(false);
            } else if (groupId) {
                // Direct Save Mode
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Authentication required");

                const payload = Array.from(selectedIds).map(recipientId => ({
                    group_id: groupId,
                    recipient_id: recipientId
                }));

                const { error } = await supabase
                    .from('group_members')
                    .upsert(payload, { onConflict: 'group_id, recipient_id', ignoreDuplicates: true });

                if (error) throw error;

                toast.success(`Added ${selectedIds.size} members`);
                onSuccess?.();
                onOpenChange(false);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to add members");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Existing Contacts</DialogTitle>
                    <DialogDescription>
                        Select contacts to add to this group.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <ScrollArea className="h-[300px] border rounded-md p-2">
                        {isLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                        ) : filteredContacts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                {searchQuery ? "No matching contacts found" : "No available contacts to add"}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredContacts.map(contact => (
                                    <div
                                        key={contact.id}
                                        className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
                                        onClick={() => toggleSelection(contact.id)}
                                    >
                                        <Checkbox
                                            checked={selectedIds.has(contact.id)}
                                            onCheckedChange={() => toggleSelection(contact.id)}
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{contact.first_name} {contact.last_name}</div>
                                            <div className="text-xs text-muted-foreground">{contact.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                    <div className="text-xs text-muted-foreground text-right">
                        Selected: {selectedIds.size}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={selectedIds.size === 0 || isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {onConfirm ? "Add Selected" : "Add to Group"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
