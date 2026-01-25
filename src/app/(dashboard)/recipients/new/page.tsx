"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipientForm } from "@/components/recipients/recipient-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function NewRecipientPage() {
    const router = useRouter();

    const handleCreateContact = async (data: any) => {
        // Placeholder - will connect to Supabase
        console.log("Creating contact:", data);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast.success("Contact added successfully");
        router.push("/recipients");
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
                    <RecipientForm onSubmit={handleCreateContact} />
                </CardContent>
            </Card>
        </div>
    );
}
