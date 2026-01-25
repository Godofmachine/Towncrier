"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { CustomFieldsManager } from "@/components/recipients/custom-fields-manager";

const recipientSchema = z.object({
    email: z.string().email("Invalid email address"),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    // We'll handle custom fields and tags separately in form state before submission
});

type RecipientFormValues = z.infer<typeof recipientSchema>;

interface RecipientFormProps {
    defaultValues?: Partial<RecipientFormValues> & {
        custom_fields?: Record<string, string>,
        tags?: string[]
    };
    onSubmit: (data: RecipientFormValues & { custom_fields: Record<string, string>, tags: string[] }) => Promise<void>;
    isLoading?: boolean;
}

export function RecipientForm({ defaultValues, onSubmit, isLoading }: RecipientFormProps) {
    const [customFields, setCustomFields] = useState<Record<string, string>>(defaultValues?.custom_fields || {});
    const [tags, setTags] = useState<string[]>(defaultValues?.tags || []);
    const [tagInput, setTagInput] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RecipientFormValues>({
        resolver: zodResolver(recipientSchema),
        defaultValues: {
            email: defaultValues?.email || "",
            first_name: defaultValues?.first_name || "",
            last_name: defaultValues?.last_name || "",
        },
    });

    const handleFormSubmit = async (data: RecipientFormValues) => {
        await onSubmit({
            ...data,
            custom_fields: customFields,
            tags: tags
        });
    };

    const addTag = () => {
        const trimmed = tagInput.trim();
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTag();
        }
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Core Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Basic Info</h3>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                        <Input id="email" placeholder="john@example.com" {...register("email")} />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First Name</Label>
                            <Input id="first_name" placeholder="John" {...register("first_name")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input id="last_name" placeholder="Doe" {...register("last_name")} />
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map(tag => (
                                <span key={tag} className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm flex items-center gap-1">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                                        &times;
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                placeholder="Add tag (e.g. VIP, Q1-Lead)"
                                className="flex-1"
                            />
                            <Button type="button" variant="secondary" onClick={addTag}>Add</Button>
                        </div>
                    </div>
                </div>

                {/* Custom Fields */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Custom Fields</h3>
                    <p className="text-sm text-muted-foreground">
                        Add extra data for personalization (e.g. Company, Role). These can be used as <code>{`{{variables}}`}</code> in your emails.
                    </p>

                    <CustomFieldsManager
                        fields={customFields}
                        onChange={setCustomFields}
                        className="border rounded-lg p-4 bg-muted/10"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Contact
                </Button>
            </div>
        </form>
    );
}
