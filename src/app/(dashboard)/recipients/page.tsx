"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportRecipientsButton } from "@/components/recipients/import-button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EditRecipientDialog } from "@/components/recipients/edit-dialog";

export default function RecipientsPage() {
    const [recipients, setRecipients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [editingRecipient, setEditingRecipient] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const supabase = createClient();

    const fetchRecipients = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('recipients')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setRecipients(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchRecipients();
    }, []);

    // Filter Logic
    const filteredRecipients = recipients.filter(r =>
        r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.first_name + ' ' + r.last_name).toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Selection Logic
    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleAll = () => {
        if (selectedIds.size === filteredRecipients.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredRecipients.map(r => r.id)));
        }
    };

    // Bulk Delete
    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} recipients?`)) return;

        const { error } = await supabase
            .from('recipients')
            .delete()
            .in('id', Array.from(selectedIds));

        if (error) {
            toast.error("Failed to delete recipients");
        } else {
            toast.success("Recipients deleted");
            setSelectedIds(new Set());
            fetchRecipients();
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Recipients</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage your audience and contacts.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                        <Button variant="destructive" size="sm" onClick={handleDelete} className="animate-in fade-in zoom-in">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedIds.size})
                        </Button>
                    )}
                    <ImportRecipientsButton />
                    <Button asChild>
                        <Link href="/recipients/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Contact
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-medium">All Contacts ({recipients.length})</CardTitle>
                        <div className="flex items-center gap-2 w-full max-w-sm">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by email or name..."
                                    className="pl-9 h-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon" className="h-9 w-9">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]">
                                    <Checkbox
                                        checked={filteredRecipients.length > 0 && selectedIds.size === filteredRecipients.length}
                                        onCheckedChange={toggleAll}
                                    />
                                </TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Custom Fields</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredRecipients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        No recipients found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRecipients.map((recipient) => (
                                    <TableRow key={recipient.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.has(recipient.id)}
                                                onCheckedChange={() => toggleSelection(recipient.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{recipient.email}</TableCell>
                                        <TableCell>{recipient.first_name} {recipient.last_name}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap max-w-[200px]">
                                                {recipient.custom_fields && Object.keys(recipient.custom_fields).slice(0, 3).map((key: string) => (
                                                    <Badge key={key} variant="outline" className="text-[10px] bg-muted/50 font-normal">
                                                        {key}: {recipient.custom_fields[key]}
                                                    </Badge>
                                                ))}
                                                {recipient.custom_fields && Object.keys(recipient.custom_fields).length > 3 && (
                                                    <span className="text-[10px] text-muted-foreground">+{Object.keys(recipient.custom_fields).length - 3} more</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-sm">Active</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingRecipient(recipient)}
                                            >
                                                Edit
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <EditRecipientDialog
                recipient={editingRecipient}
                open={!!editingRecipient}
                onOpenChange={(open) => !open && setEditingRecipient(null)}
                onSuccess={fetchRecipients}
            />
        </div>
    );
}
