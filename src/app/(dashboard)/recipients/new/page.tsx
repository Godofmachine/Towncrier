"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipientForm } from "@/components/recipients/recipient-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function NewRecipientPage() {
    const router = useRouter();

    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateContact = async (data: any) => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("You must be logged in");
                return;
            }

            const { error } = await supabase
                .from('recipients')
                .insert({
                    ...data,
                    user_id: user.id,
                    status: 'active'
                });

            if (error) throw error;

            toast.success("Contact added successfully");
            router.push("/recipients");
            router.refresh();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to create contact");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto animate-in slide-in-from-bottom-5 duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/recipients">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Add New Contact</h2>
                    <p className="text-muted-foreground">
                        Manually add a recipient to your audience.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Contact Details</CardTitle>
                    <CardDescription>
                        Add personal information and custom fields for this contact.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RecipientForm onSubmit={handleCreateContact} isLoading={isLoading} />
                </CardContent>
            </Card>
        </div>
    );
}
