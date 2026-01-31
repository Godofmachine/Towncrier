"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Filter, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface VariablesTabProps {
    recipients: any[];
    onUpdate: () => void;
}

export function VariablesTab({ recipients, onUpdate }: VariablesTabProps) {
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
    const [filteredRecipients, setFilteredRecipients] = useState<any[]>(recipients);
    const [columns, setColumns] = useState<string[]>([]);
    const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);

    // New Column State
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
    const [newColumnName, setNewColumnName] = useState("");

    // Column Management State
    const [columnToRename, setColumnToRename] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
    const [isGlobalLoading, setIsGlobalLoading] = useState(false);

    const supabase = createClient();

    // Fetch groups
    useEffect(() => {
        const fetchGroups = async () => {
            setIsLoadingGroups(true);
            const { data } = await supabase.from('broadcast_groups').select('id, name').order('name');
            if (data) setGroups(data);
            setIsLoadingGroups(false);
        };
        fetchGroups();
    }, [supabase]);

    // Calculate columns based on all recipients' custom fields
    useEffect(() => {
        const uniqueKeys = new Set<string>();
        recipients.forEach(r => {
            if (r.custom_fields) {
                Object.keys(r.custom_fields).forEach(k => uniqueKeys.add(k));
            }
        });
        setColumns(Array.from(uniqueKeys).sort());
    }, [recipients]);

    // Filter recipients by group
    useEffect(() => {
        const filterByGroup = async () => {
            if (selectedGroupId === "all") {
                setFilteredRecipients(recipients);
                return;
            }

            // Fetch group members
            const { data: members } = await supabase
                .from('group_members')
                .select('recipient_id')
                .eq('group_id', selectedGroupId);

            if (members) {
                const memberIds = new Set(members.map(m => m.recipient_id));
                setFilteredRecipients(recipients.filter(r => memberIds.has(r.id)));
            }
        };

        filterByGroup();
    }, [selectedGroupId, recipients, supabase]);

    const handleCellSave = async (id: string, field: string, value: string) => {
        const recipient = recipients.find(r => r.id === id);
        if (!recipient) return;

        const updatedFields = { ...(recipient.custom_fields || {}), [field]: value };

        // Remove empty keys
        if (!value.trim()) {
            delete updatedFields[field];
        }

        const { error } = await supabase
            .from('recipients')
            .update({ custom_fields: updatedFields })
            .eq('id', id);

        if (error) {
            toast.error("Failed to update variable");
        } else {
            // Optimistic update or refetch
            onUpdate();
        }
        setEditingCell(null);
    };

    const handleAddColumn = () => {
        if (!newColumnName.trim()) return;
        if (columns.includes(newColumnName.trim())) {
            toast.error("Column already exists");
            return;
        }
        setColumns(prev => [...prev, newColumnName.trim()].sort());
        setNewColumnName("");
        setIsAddColumnOpen(false);
        toast.success(`Column "${newColumnName}" added. You can now start adding values.`);
    };

    const handleRenameColumn = async () => {
        if (!columnToRename || !renameValue.trim() || columnToRename === renameValue.trim()) {
            setColumnToRename(null);
            return;
        }
        const newName = renameValue.trim();

        if (columns.includes(newName)) {
            toast.error("Column name already exists");
            return;
        }

        setIsGlobalLoading(true);

        // Prepare bulk update: rename key in custom_fields for all recipients
        const updates = recipients
            .filter(r => r.custom_fields && r.custom_fields[columnToRename] !== undefined)
            .map(r => {
                const newFields = { ...r.custom_fields };
                newFields[newName] = newFields[columnToRename];
                delete newFields[columnToRename];
                return {
                    id: r.id,
                    email: r.email,
                    first_name: r.first_name,
                    last_name: r.last_name,
                    custom_fields: newFields
                };
            });

        if (updates.length > 0) {
            const { error } = await supabase.from('recipients').upsert(updates);
            if (error) {
                console.error(error);
                toast.error("Failed to rename variable");
                setIsGlobalLoading(false);
                return;
            } else {
                toast.success("Variable renamed");
                // Optimistically update local state
                setColumns(prev => prev.map(c => c === columnToRename ? newName : c).sort());
                await onUpdate();
            }
        } else {
            // Update columns even if no data
            setColumns(prev => prev.map(c => c === columnToRename ? newName : c).sort());
            toast.success("Variable renamed (no data to migrate)");
        }

        setIsGlobalLoading(false);
        setColumnToRename(null);
        setRenameValue("");
    };

    const handleDeleteColumn = async () => {
        if (!columnToDelete) return;

        setIsGlobalLoading(true);

        const updates = recipients
            .filter(r => r.custom_fields && r.custom_fields[columnToDelete] !== undefined)
            .map(r => {
                const newFields = { ...r.custom_fields };
                delete newFields[columnToDelete];
                return {
                    id: r.id,
                    email: r.email,
                    first_name: r.first_name,
                    last_name: r.last_name,
                    custom_fields: newFields
                };
            });

        if (updates.length > 0) {
            const { error } = await supabase.from('recipients').upsert(updates);
            if (error) {
                console.error(error);
                toast.error("Failed to delete variable");
                setIsGlobalLoading(false);
                return;
            } else {
                // Optimistically remove from local state
                setColumns(prev => prev.filter(c => c !== columnToDelete));
                toast.success("Variable deleted");
                await onUpdate();
            }
        } else {
            // Remove from columns even if no data
            setColumns(prev => prev.filter(c => c !== columnToDelete));
            toast.success("Variable deleted");
        }

        setIsGlobalLoading(false);
        setColumnToDelete(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    {isGlobalLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by Group" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Recipients</SelectItem>
                            {groups.map(g => (
                                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" /> Add Variable
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Variable Column</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="colName">Variable Name</Label>
                            <Input
                                id="colName"
                                value={newColumnName}
                                onChange={(e) => setNewColumnName(e.target.value)}
                                placeholder="E.g. City, Age, Subscription Tier"
                                className="mt-2"
                            />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddColumn}>Add Column</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Email</TableHead>
                            <TableHead className="w-[150px]">Name</TableHead>
                            {columns.map(col => (
                                <TableHead key={col} className="min-w-[150px] font-semibold text-primary/80 group">
                                    <div className="flex items-center justify-between">
                                        <span>{col}</span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="h-3 w-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => { setColumnToRename(col); setRenameValue(col); }}>
                                                    <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setColumnToDelete(col)}>
                                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRecipients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2 + columns.length} className="h-24 text-center text-muted-foreground">
                                    No recipients found in this filter.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRecipients.map(r => (
                                <TableRow key={r.id}>
                                    <TableCell className="font-medium text-muted-foreground">{r.email}</TableCell>
                                    <TableCell className="text-muted-foreground">{r.first_name} {r.last_name}</TableCell>
                                    {columns.map(col => {
                                        const isEditing = editingCell?.id === r.id && editingCell?.field === col;
                                        const value = r.custom_fields?.[col] || "";

                                        return (
                                            <TableCell
                                                key={`${r.id}-${col}`}
                                                className="p-0 relative group h-12"
                                                onClick={() => !isEditing && setEditingCell({ id: r.id, field: col })}
                                            >
                                                {isEditing ? (
                                                    <Input
                                                        autoFocus
                                                        defaultValue={value}
                                                        className="h-full w-full border-2 border-primary rounded-none shadow-none focus-visible:ring-0 px-2 bg-background"
                                                        onBlur={(e) => handleCellSave(r.id, col, e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleCellSave(r.id, col, (e.target as HTMLInputElement).value);
                                                            }
                                                            if (e.key === 'Escape') {
                                                                setEditingCell(null);
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full px-4 flex items-center cursor-pointer min-h-[40px] hover:bg-muted/50 transition-colors">
                                                        {value || <span className="text-muted-foreground/20 text-xs">—</span>}
                                                    </div>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Rename Dialog */}
            <Dialog open={!!columnToRename} onOpenChange={(open) => !open && setColumnToRename(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Variable: {columnToRename}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>New Name</Label>
                        <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            placeholder="New variable name"
                            autoFocus
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setColumnToRename(null)}>Cancel</Button>
                        <Button onClick={handleRenameColumn} disabled={isGlobalLoading}>Rename</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!columnToDelete}
                onOpenChange={(open) => !open && setColumnToDelete(null)}
                title={`Delete variable "${columnToDelete}"?`}
                description="This will remove this variable and its data from ALL contacts. This action cannot be undone."
                onConfirm={handleDeleteColumn}
                isLoading={isGlobalLoading}
                variant="destructive"
                confirmText="Delete Variable"
            />
        </div>
    );
}
