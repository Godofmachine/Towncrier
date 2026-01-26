"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, Loader2, AlertCircle, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { parseCSV, ParseResult } from "@/lib/recipients/csv-parser";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AddExistingMemberDialog } from "@/components/groups/add-existing-member-dialog";
import { QuickAddRecipientDialog } from "@/components/recipients/quick-add-dialog";

export default function NewGroupPage() {
    const router = useRouter();
    const supabase = createClient();

    // Form State
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // CSV State
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [isParsing, setIsParsing] = useState(false);

    // Manual/Existing Selection State
    const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set());
    const [isAddExistingOpen, setIsAddExistingOpen] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCsvFile(file);
            setIsParsing(true);
            const result = await parseCSV(file);
            setParseResult(result);
            setIsParsing(false);
        }
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Please enter a group name");
            return;
        }

        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Authentication required");

            // 1. Create Group
            const { data: groupData, error: groupError } = await supabase
                .from('broadcast_groups')
                .insert({
                    name,
                    category: category || 'General',
                    created_at: new Date().toISOString(),
                    user_id: user.id
                })
                .select()
                .single();

            if (groupError) throw groupError;

            const groupId = groupData.id;
            let addedCount = 0;

            // 2. Collect all Recipient IDs
            const finalRecipientIds = new Set<string>(selectedRecipientIds);

            // 3. Process CSV Members if present
            if (parseResult && parseResult.contacts.length > 0) {
                // A. Upsert Recipients
                const { data: recipientsData, error: recipientsError } = await supabase
                    .from('recipients')
                    // Upsert based on email, update names/custom_fields if changed
                    .upsert(parseResult.contacts.map(c => ({
                        email: c.email,
                        first_name: c.first_name,
                        last_name: c.last_name,
                        custom_fields: c.custom_fields,
                        status: 'active',
                        updated_at: new Date().toISOString(),
                        user_id: user.id
                    })), { onConflict: 'email' })
                    .select('id, email');

                if (recipientsError) throw recipientsError;

                // B. Add to Group Members
                if (recipientsData) {
                    const memberPayload = recipientsData.map(r => ({
                        group_id: groupId,
                        recipient_id: r.id
                    }));

                    const { error: memberError } = await supabase
                        .from('group_members')
                        .upsert(memberPayload, { onConflict: 'group_id, recipient_id', ignoreDuplicates: true });

                    if (memberError) throw memberError;

                    addedCount += memberPayload.length;
                }
            }

            // 4. Link Manually Selected Recipients
            if (finalRecipientIds.size > 0) {
                const manualPayload = Array.from(finalRecipientIds).map(id => ({
                    group_id: groupId,
                    recipient_id: id
                }));

                const { error: manualError } = await supabase
                    .from('group_members')
                    .upsert(manualPayload, { onConflict: 'group_id, recipient_id', ignoreDuplicates: true });

                if (manualError) throw manualError;
                addedCount += manualPayload.length;
            }

            toast.success(`Group "${name}" created with ${addedCount} members!`);
            router.push('/groups');
        } catch (error: any) {
            console.error("Group creation failed:", error);
            toast.error(error.message || "Failed to create group");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in-50 duration-500 pb-20">
            <div className="flex items-center gap-2 mb-6">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/groups">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Link>
                </Button>
            </div>

            <div>
                <h2 className="text-3xl font-bold tracking-tight">Create New Group</h2>
                <p className="text-muted-foreground mt-1">
                    Define a new audience segment for your campaigns.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Group Details</CardTitle>
                    <CardDescription>Give your group a clear name and category.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Group Name</Label>
                        <Input
                            placeholder="e.g. Q1 Newsletter Subscribers"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Category (Optional)</Label>
                        <Input
                            placeholder="e.g. Marketing, Internal, Clients"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Add Members (Optional)</CardTitle>
                    <CardDescription>
                        Upload a CSV file or select existing contacts.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsAddExistingOpen(true)}>
                                <Users className="mr-2 h-4 w-4" /> Select Existing
                            </Button>
                            <QuickAddRecipientDialog onSuccess={(newRecipient) => {
                                setSelectedRecipientIds(prev => new Set(prev).add(newRecipient.id));
                                toast.success("Recipient added to selection");
                            }}>
                                <Button variant="outline" size="sm">
                                    <UserPlus className="mr-2 h-4 w-4" /> Create New
                                </Button>
                            </QuickAddRecipientDialog>
                        </div>

                        {selectedRecipientIds.size > 0 && (
                            <div className="bg-muted/30 p-3 rounded-md flex items-center justify-between border">
                                <span className="text-sm font-medium">{selectedRecipientIds.size} recipients selected manually</span>
                                <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive hover:text-destructive" onClick={() => setSelectedRecipientIds(new Set())}>
                                    Clear Selection
                                </Button>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {!parseResult ? (
                        <div
                            className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => document.getElementById('csv-upload')?.click()}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                                    <FileSpreadsheet className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium">Upload CSV</p>
                                    <p className="text-sm text-muted-foreground">Click to browse files</p>
                                </div>
                                <input
                                    id="csv-upload"
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-muted/20 border rounded-md">
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="font-medium text-sm">{csvFile?.name}</p>
                                        <p className="text-xs text-muted-foreground">{parseResult.contacts.length} valid contacts found</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => {
                                    setCsvFile(null);
                                    setParseResult(null);
                                }}>
                                    Remove
                                </Button>
                            </div>

                            {parseResult.errors.length > 0 && (
                                <Alert variant="default" className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Import Warnings</AlertTitle>
                                    <AlertDescription>
                                        <p>{parseResult.errors.length} issues found. These rows will be skipped.</p>
                                        <ScrollArea className="h-20 mt-2 border rounded bg-background p-2">
                                            <ul className="text-xs list-disc pl-4 space-y-1">
                                                {parseResult.errors.map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                            </ul>
                                        </ScrollArea>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    {isParsing && (
                        <div className="flex items-center justify-center py-4 text-muted-foreground">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Parsing file...
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between border-t p-6 bg-muted/10">
                    <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={isLoading || !name.trim()}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Create Group
                    </Button>
                </CardFooter>
            </Card>

            <AddExistingMemberDialog
                open={isAddExistingOpen}
                onOpenChange={setIsAddExistingOpen}
                onConfirm={(ids) => {
                    setSelectedRecipientIds(prev => {
                        const next = new Set(prev);
                        ids.forEach(id => next.add(id));
                        return next;
                    });
                }}
            />
        </div>
    );
}
