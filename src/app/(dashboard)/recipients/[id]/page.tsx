"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipientForm } from "@/components/recipients/recipient-form";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function EditRecipientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: recipientId } = use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [contact, setContact] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchContact = async () => {
            const { data, error } = await supabase
                .from('recipients')
                .select('*')
                .eq('id', recipientId)
                .single();

            if (error) {
                toast.error("Failed to load contact");
                router.push('/recipients');
                return;
            }

            setContact(data);
            setIsLoading(false);
        };

        fetchContact();
    }, [recipientId, router, supabase]);

    const handleUpdate = async (data: any) => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('recipients')
                .update({
                    email: data.email,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    custom_fields: data.custom_fields,
                    tags: data.tags
                })
                .eq('id', recipientId);

            if (error) throw error;

            toast.success("Contact updated successfully");
            router.refresh(); // Refresh current route data

            // Optional: Close tab if opened from validation error? 
            // Better to let user navigate back manually.
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto animate-in slide-in-from-bottom-5 duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Edit Contact</h2>
                    <p className="text-muted-foreground">
                        Update recipient details and custom variables.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Contact Details</CardTitle>
                    <CardDescription>
                        Modify personal information and add custom fields for personalization variables.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RecipientForm
                        defaultValues={contact}
                        onSubmit={handleUpdate}
                        isLoading={isSaving}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
