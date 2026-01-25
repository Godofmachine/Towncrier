"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface EditRecipientProps {
    recipient: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditRecipientDialog({ recipient, open, onOpenChange, onSuccess }: EditRecipientProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        first_name: "",
        last_name: "",
    });
    const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);

    const supabase = createClient();

    useEffect(() => {
        if (recipient) {
            setFormData({
                email: recipient.email || "",
                first_name: recipient.first_name || "",
                last_name: recipient.last_name || ""
            });

            // Parse JSONB custom fields to array
            const fields = Object.entries(recipient.custom_fields || {}).map(([key, value]) => ({
                key,
                value: String(value)
            }));
            setCustomFields(fields);
        }
    }, [recipient]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipient) return;
        setIsLoading(true);

        try {
            // Transform array back to object
            const customFieldObject = customFields.reduce((acc, curr) => {
                if (curr.key.trim()) {
                    acc[curr.key.trim()] = curr.value;
                }
                return acc;
            }, {} as Record<string, string>);

            const { error } = await supabase
                .from("recipients")
                .update({
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    custom_fields: customFieldObject,
                    updated_at: new Date().toISOString()
                })
                .eq('id', recipient.id);

            if (error) throw error;

            toast.success("Recipient updated");
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to update");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Recipient</DialogTitle>
                    <DialogDescription>
                        Modify contact details and custom variables.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-email" className="text-right">Email</Label>
                        <Input
                            id="edit-email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-firstName" className="text-right">First Name</Label>
                        <Input
                            id="edit-firstName"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-lastName" className="text-right">Last Name</Label>
                        <Input
                            id="edit-lastName"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            className="col-span-3"
                        />
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-muted-foreground">CUSTOM VARIABLES</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                className="h-6 text-xs"
                                onClick={() => setCustomFields([...customFields, { key: "", value: "" }])}
                            >
                                <Plus className="mr-1 h-3 w-3" /> Add Variable
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            {customFields.map((field, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2">
                                    <Input
                                        placeholder="Key"
                                        className="col-span-4 h-8 text-xs"
                                        value={field.key}
                                        onChange={(e) => {
                                            const newFields = [...customFields];
                                            newFields[idx].key = e.target.value;
                                            setCustomFields(newFields);
                                        }}
                                    />
                                    <Input
                                        placeholder="Value"
                                        className="col-span-7 h-8 text-xs"
                                        value={field.value}
                                        onChange={(e) => {
                                            const newFields = [...customFields];
                                            newFields[idx].value = e.target.value;
                                            setCustomFields(newFields);
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="col-span-1 h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {customFields.length === 0 && (
                                <p className="text-[10px] text-muted-foreground text-center py-2 italic">
                                    No custom variables set.
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
