"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface QuickAddRecipientProps {
    onSuccess: (newRecipient: any) => void;
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function QuickAddRecipientDialog({ onSuccess, children, open, onOpenChange }: QuickAddRecipientProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const handleOpenChange = (val: boolean) => {
        if (isControlled && onOpenChange) onOpenChange(val);
        else setInternalOpen(val);
    };

    const [formData, setFormData] = useState({
        email: "",
        first_name: "",
        last_name: "",
    });
    const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([
        { key: "company", value: "" } // Default empty company field as hint
    ]);

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Transform array back to object for JSONB
            const customFieldObject = customFields.reduce((acc, curr) => {
                if (curr.key.trim()) {
                    acc[curr.key.trim()] = curr.value;
                }
                return acc;
            }, {} as Record<string, string>);

            const { data, error } = await supabase
                .from("recipients")
                .insert({
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    user_id: user.id,
                    tags: ["manual_add"],
                    custom_fields: customFieldObject
                })
                .select()
                .single();

            if (error) throw error;

            toast.success("Recipient added successfully");
            onSuccess(data);
            handleOpenChange(false);
            setFormData({ email: "", first_name: "", last_name: "" });
            setCustomFields([{ key: "company", value: "" }]); // Reset
        } catch (error: any) {
            toast.error(error.message || "Failed to add recipient");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" size="sm" className="h-8">
                        <Plus className="mr-2 h-3 w-3" /> Add New
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Recipient</DialogTitle>
                    <DialogDescription>
                        Quickly add a contact to your list for this campaign.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="firstName" className="text-right">
                            First Name
                        </Label>
                        <Input
                            id="firstName"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lastName" className="text-right">
                            Last Name
                        </Label>
                        <Input
                            id="lastName"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            className="col-span-3"
                        />
                    </div>

                    <div className="space-y-3 pt-2 border-t">
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

                        {customFields.map((field, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2">
                                <Input
                                    placeholder="Key (e.g. company)"
                                    className="col-span-5 h-8 text-xs"
                                    value={field.key}
                                    onChange={(e) => {
                                        const newFields = [...customFields];
                                        newFields[idx].key = e.target.value;
                                        setCustomFields(newFields);
                                    }}
                                />
                                <Input
                                    placeholder="Value"
                                    className="col-span-6 h-8 text-xs"
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
                                    <Plus className="h-4 w-4 rotate-45" />
                                </Button>
                            </div>
                        ))}
                        {customFields.length === 0 && (
                            <p className="text-[10px] text-muted-foreground text-center py-2 italic">
                                No custom variables. Click "Add Variable" to add data like Company, Role, etc.
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Contact
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
