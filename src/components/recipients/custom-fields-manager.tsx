"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CustomFieldsManagerProps {
    fields: Record<string, string>;
    onChange: (fields: Record<string, string>) => void;
    className?: string;
}

export function CustomFieldsManager({ fields = {}, onChange, className }: CustomFieldsManagerProps) {
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const handleAddField = () => {
        if (!newKey.trim()) return;

        // Normalize key: lowercase, replace spaces with underscores
        const normalizedKey = newKey.toLowerCase().replace(/\s+/g, "_");

        const updatedFields = {
            ...fields,
            [normalizedKey]: newValue
        };

        onChange(updatedFields);
        setNewKey("");
        setNewValue("");
        setIsAdding(false);
    };

    const handleRemoveField = (keyToRemove: string) => {
        const { [keyToRemove]: _, ...rest } = fields;
        onChange(rest);
    };

    return (
        <div className={className}>
            <div className="space-y-3">
                {Object.entries(fields).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 group">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                            <div className="bg-muted px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                                <Tag className="h-3 w-3 text-muted-foreground" />
                                {key}
                            </div>
                            <Input
                                value={value}
                                onChange={(e) => onChange({ ...fields, [key]: e.target.value })}
                                className="h-9"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveField(key)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}

                {Object.keys(fields).length === 0 && !isAdding && (
                    <div className="text-sm text-muted-foreground italic text-center py-2">
                        No custom fields added yet.
                    </div>
                )}

                {isAdding ? (
                    <div className="border border-dashed rounded-lg p-3 space-y-3 bg-muted/30 animate-in fade-in-50">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label htmlFor="field-key" className="text-xs">Field Name</Label>
                                <Input
                                    id="field-key"
                                    placeholder="e.g. company"
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                    className="h-8"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="field-value" className="text-xs">Value</Label>
                                <Input
                                    id="field-value"
                                    placeholder="e.g. Acme Inc"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    className="h-8"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddField();
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                            <Button type="button" size="sm" onClick={handleAddField} disabled={!newKey.trim()}>Add Field</Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed"
                        onClick={() => setIsAdding(true)}
                    >
                        <Plus className="mr-2 h-3 w-3" />
                        Add Custom Field
                    </Button>
                )}
            </div>
        </div>
    );
}
