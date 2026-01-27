"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichEditor } from "@/components/email-composer/rich-editor";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle2, ChevronRight, ChevronLeft, Save, Clock, Send, Users, Search, Plus, Upload, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "use-debounce";
import { ImportDialog } from "@/components/recipients/import-dialog";
import { QuickAddRecipientDialog } from "@/components/recipients/quick-add-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";

function CampaignEditor() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sourceCampaignId = searchParams.get('source_campaign_id');
    const draftId = searchParams.get('draft_id');

    // State
    const [step, setStep] = useState(1);
    const [date, setDate] = useState<Date>();
    const [campaignId, setCampaignId] = useState<string | null>(draftId);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

    const supabase = createClient();

    // Form State
    const [name, setName] = useState("");
    const [fromName, setFromName] = useState("John Doe");
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [recipientType, setRecipientType] = useState("all");

    // Specific Recipients Selection State
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [contacts, setContacts] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    // Attachments State
    const [attachments, setAttachments] = useState<{ filename: string; content: string; contentType: string; size: number }[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [isTestSending, setIsTestSending] = useState(false);

    const handleTestSend = async () => {
        setIsTestSending(true);
        try {
            const res = await fetch("/api/campaigns/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject,
                    content,
                    fromName,
                    attachments: attachments.map(a => ({
                        name: a.filename,
                        // We assume attachments in state have base64 content if added via the UI helper
                        // If not, real implementation needs to ensure base64 is present
                        base64: a.content || "",
                        type: a.contentType
                    }))
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send test");

            toast.success("Test email sent to your inbox!");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsTestSending(false);
        }
    };
    const [isContactsLoading, setIsContactsLoading] = useState(false);
    const [missingVariables, setMissingVariables] = useState<{ contactId: string; missing: string[] }[]>([]);
    const [previewContactId, setPreviewContactId] = useState<string>("");


    // Auto-Save Logic
    const debouncedSave = useDebouncedCallback(async () => {
        if (!name && !subject && !content) return; // Don't save empty drafts

        setSaveStatus('saving');
        try {
            const payload = {
                name: name || "Untitled Draft",
                subject,
                content,
                from_name: fromName,
                status: 'draft',
                // other fields if needed
            };

            if (campaignId) {
                // Update existing
                const { error } = await supabase
                    .from('campaigns')
                    .update(payload)
                    .eq('id', campaignId);

                if (error) throw error;
            } else {
                // Create new
                // We need userID. Client supabase handles auth automatically for RLS? 
                // Alternatively, call an API route. 
                // Let's use direct Supabase client which has user context if logged in.
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('campaigns')
                    .insert({ ...payload, user_id: user.id })
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    setCampaignId(data.id);
                    // Update URL without reload
                    window.history.replaceState(null, '', `?draft_id=${data.id}`);
                }
            }
            setSaveStatus('saved');
        } catch (error) {
            console.error("Auto-save failed:", error);
            setSaveStatus('unsaved');
        }
    }, 1000);

    // Trigger auto-save on core field changes
    useEffect(() => {
        if (name || subject || content) {
            setSaveStatus('unsaved');
            debouncedSave();
        }
    }, [name, subject, content, fromName, debouncedSave]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>("");

    // Auto-Save Logic (1.5s debounce)
    const autoSave = useDebouncedCallback(async () => {
        if (!name && !subject && !content) return; // Don't save completely empty drafts initially

        setSaveStatus('saving');

        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) return;

            const payload = {
                name: name || 'Untitled Campaign',
                subject,
                content,
                status: 'draft',
                user_id: user.id
            };

            let data, error;

            if (campaignId) {
                // Update existing
                const res = await supabase.from('campaigns').update(payload).eq('id', campaignId).select().single();
                data = res.data;
                error = res.error;
            } else {
                // Instert new
                const res = await supabase.from('campaigns').insert(payload).select().single();
                data = res.data;
                error = res.error;
                if (data) setCampaignId(data.id);
            }

            if (error) throw error;
            setSaveStatus('saved');
        } catch (err) {
            console.error("Auto-save failed:", err);
            setSaveStatus('unsaved');
        }
    }, 1500);

    // Trigger auto-save on change
    useEffect(() => {
        if (name || subject || content) {
            setSaveStatus('unsaved');
            autoSave();
        }
    }, [name, subject, content, autoSave]);


    // Load Draft OR Source Campaign
    useEffect(() => {
        const fetchInitialData = async () => {
            const idToFetch = draftId || sourceCampaignId;
            if (!idToFetch) return;

            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('id', idToFetch)
                .single();

            if (data) {
                if (draftId) {
                    // Editing duplicate/draft
                    setName(data.name);
                } else {
                    // Copying
                    setName(`${data.name} (Copy)`);
                }
                setSubject(data.subject || '');
                setContent(data.content || '');
                toast.info(draftId ? "Draft loaded" : "Content loaded from previous campaign");
            }
        };
        fetchInitialData();
    }, [draftId, sourceCampaignId, supabase]);



    // Fetch contacts when "Specific" is selected
    useEffect(() => {
        if (recipientType === 'specific' && contacts.length === 0) {
            setIsContactsLoading(true);
            supabase
                .from('recipients')
                .select('*')
                .order('email', { ascending: true })
                .then(({ data }) => {
                    if (data) setContacts(data);
                    setIsContactsLoading(false);
                });
        }
    }, [recipientType, contacts.length, supabase]);

    // Fetch groups
    useEffect(() => {
        const fetchGroups = async () => {
            const { data } = await supabase.from('broadcast_groups').select('*').order('name');
            if (data) setGroups(data);
        };
        fetchGroups();
    }, [supabase]);

    const toggleRecipient = (id: string) => {
        setSelectedRecipients(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // 25MB Limit Check
            const currentTotal = attachments.reduce((acc, curr) => acc + curr.size, 0);
            if (currentTotal + file.size > 25 * 1024 * 1024) {
                toast.error("Total attachment size cannot exceed 25MB");
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                setAttachments([...attachments, {
                    filename: file.name,
                    content: base64String,
                    contentType: file.type,
                    size: file.size
                }]);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const validateVariables = (recipients: any[], emailContent: string, emailSubject: string) => {
        // Extract all variables from content and subject with pattern {{variable}}
        const varPattern = /{{([^}]+)}}/g;
        const usedVariables = new Set<string>();

        // Helper to add matches to set
        const addMatches = (text: string) => {
            let match;
            while ((match = varPattern.exec(text)) !== null) {
                usedVariables.add(match[1]);
            }
        };

        addMatches(emailContent);
        addMatches(emailSubject);

        const missing = [];

        for (const recipient of recipients) {
            const recipientMissing = [];
            for (const variable of Array.from(usedVariables)) {
                // Check standard fields
                if (['first_name', 'last_name', 'email'].includes(variable)) {
                    if (!recipient[variable]) recipientMissing.push(variable);
                }
                // Check custom fields
                else {
                    if (!recipient.custom_fields || !recipient.custom_fields[variable]) {
                        recipientMissing.push(variable);
                    }
                }
            }

            if (recipientMissing.length > 0) {
                missing.push({
                    contactId: recipient.id,
                    name: `${recipient.first_name || ''} ${recipient.last_name || recipient.email}`,
                    missing: recipientMissing
                });
            }
        }

        return missing;
    };

    const handleSend = async () => {
        setIsSending(true);
        setMissingVariables([]);

        try {
            // Determine recipients list based on selection
            let finalRecipients = [];

            if (recipientType === 'specific') {
                // Use selected contacts from state
                finalRecipients = contacts.filter(c => selectedRecipients.includes(c.id));
            } else if (recipientType === 'all') {
                // Fetch all active
                const { data } = await supabase.from('recipients').select('*').eq('status', 'active');
                finalRecipients = data || [];
            } else {
                // Group logic
                if (!selectedGroupId) {
                    toast.error("Please select a group");
                    setIsSending(false);
                    return;
                }

                // Fetch group members via junction table
                const { data: memberData, error } = await supabase
                    .from('group_members')
                    .select('recipient_id, recipients:recipient_id(*)')
                    .eq('group_id', selectedGroupId);

                if (error) throw error;

                // Flatten the result structure
                finalRecipients = memberData
                    .map((item: any) => item.recipients)
                    .filter((r: any) => r && r.status === 'active');
            }

            if (finalRecipients.length === 0) {
                toast.error("No recipients selected");
                setIsSending(false);
                return;
            }

            // Validate Variables
            const validationErrors = validateVariables(finalRecipients, content, subject);
            if (validationErrors.length > 0) {
                setMissingVariables(validationErrors);
                toast.error(`Missing data for ${validationErrors.length} recipients. Please review.`);
                setIsSending(false);
                return;
            }

            const res = await fetch('/api/campaigns/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    subject,
                    content,
                    recipients: finalRecipients,
                    attachments: attachments.map(a => ({
                        filename: a.filename,
                        content: a.content,
                        contentType: a.contentType
                    }))
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to send");

            toast.success(`Campaign sent to ${data.sent} recipients!`);
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSending(false);
        }
    };

    const handleSchedule = async () => {
        if (!date) return;
        setIsSending(true);

        try {
            // 1. Resolve Recipients (Copy-paste logic from handleSend - should have refactored but safe for now)
            let finalRecipients = [];
            if (recipientType === 'specific') {
                finalRecipients = contacts.filter(c => selectedRecipients.includes(c.id));
            } else if (recipientType === 'all') {
                const { data } = await supabase.from('recipients').select('*').eq('status', 'active');
                finalRecipients = data || [];
            } else {
                if (!selectedGroupId) {
                    toast.error("Please select a group");
                    setIsSending(false);
                    return;
                }
                const { data: memberData } = await supabase
                    .from('group_members')
                    .select('recipient_id, recipients:recipient_id(*)')
                    .eq('group_id', selectedGroupId);
                finalRecipients = memberData?.map((item: any) => item.recipients).filter((r: any) => r && r.status === 'active') || [];
            }

            if (finalRecipients.length === 0) {
                toast.error("No recipients selected");
                setIsSending(false);
                return;
            }

            // 2. Upsert Campaign first (ensure ID exists)
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) return;

            const payload = {
                user_id: user.id,
                name: name || 'Untitled Campaign',
                subject,
                content,
                status: 'scheduled',
                scheduled_at: date.toISOString(),
                total_recipients: finalRecipients.length
            };

            let targetId = campaignId;

            if (!targetId) {
                const { data, error } = await supabase.from('campaigns').insert(payload).select().single();
                if (error) throw error;
                targetId = data.id;
                setCampaignId(targetId);
            } else {
                await supabase.from('campaigns').update(payload).eq('id', targetId);
            }

            // 3. Snapshot Recipients (Important for Cron)
            // Delete old potential pending ones to avoid dupes if re-scheduling
            await supabase.from('campaign_recipients').delete().eq('campaign_id', targetId);

            const recipientRows = finalRecipients.map(r => ({
                campaign_id: targetId,
                recipient_id: r.id,
                status: 'pending'
            }));

            const { error: rError } = await supabase.from('campaign_recipients').insert(recipientRows);
            if (rError) throw rError;

            toast.success(`Campaign scheduled for ${date.toLocaleString()}!`);
            router.push('/dashboard');

        } catch (error: any) {
            console.error(error);
            toast.error("Failed to schedule: " + error.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-bold tracking-tight">New Campaign</h2>
                    <div className="flex items-center gap-2 h-5">
                        <p className="text-muted-foreground text-sm">Create and schedule your email blast.</p>
                        <span className="text-muted-foreground/30">|</span>
                        <div className="text-sm font-medium">
                            {saveStatus === 'saving' && <span className="flex items-center gap-1 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Saving...</span>}
                            {saveStatus === 'saved' && <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Draft Saved</span>}
                            {saveStatus === 'unsaved' && <span className="text-amber-600 dark:text-amber-400">Unsaved changes...</span>}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/campaigns">Cancel</Link>
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12">
                    <Card className="min-h-[500px] flex flex-col">
                        <CardContent className="p-6 flex-1">

                            {/* STEP 1: Details */}
                            {step === 1 && (
                                <div className="space-y-6 max-w-md mx-auto py-10  animate-in slide-in-from-right-10 fade-in duration-300">
                                    <div className="space-y-2">
                                        <Label>Campaign Name</Label>
                                        <Input placeholder="e.g. January Newsletter" value={name} onChange={e => setName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>From Name</Label>
                                        <Input placeholder="Your Name or Company" value={fromName} onChange={e => setFromName(e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Recipients */}
                            {step === 2 && (
                                <div className="space-y-6 max-w-2xl mx-auto py-2 md:py-6 animate-in slide-in-from-right-10 fade-in duration-300">
                                    <div className="space-y-4">
                                        <Label className="text-base">Who are you sending to?</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Option 1: All */}
                                            <div
                                                className={cn("border rounded-lg p-4 cursor-pointer hover:border-primary transition-all flex flex-col items-center text-center gap-2", recipientType === 'all' && "border-primary bg-primary/5")}
                                                onClick={() => setRecipientType('all')}
                                            >
                                                <Users className="h-8 w-8 text-muted-foreground" />
                                                <div>
                                                    <div className="font-semibold">All Contacts</div>
                                                    <div className="text-xs text-muted-foreground">All recipients</div>
                                                </div>
                                            </div>

                                            {/* Option 2: Group */}
                                            <div
                                                className={cn("border rounded-lg p-4 cursor-pointer hover:border-primary transition-all flex flex-col items-center text-center gap-2", recipientType === 'group' && "border-primary bg-primary/5")}
                                                onClick={() => setRecipientType('group')}
                                            >
                                                <Users className="h-8 w-8 text-muted-foreground" />
                                                <div>
                                                    <div className="font-semibold">Broadcast Group</div>
                                                    <div className="text-xs text-muted-foreground">Select Segment</div>
                                                </div>
                                            </div>

                                            {/* Option 3: Specific */}
                                            <div
                                                className={cn("border rounded-lg p-4 cursor-pointer hover:border-primary transition-all flex flex-col items-center text-center gap-2", recipientType === 'specific' && "border-primary bg-primary/5")}
                                                onClick={() => setRecipientType('specific')}
                                            >
                                                <Users className="h-8 w-8 text-muted-foreground" />
                                                <div>
                                                    <div className="font-semibold">Specific People</div>
                                                    <div className="text-xs text-muted-foreground">Select Manually</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Conditional Content based on selection */}
                                        <div className="pt-4 border-t mt-4">
                                            {recipientType === 'group' && (
                                                <div className="max-w-md mx-auto animate-in fade-in slide-in-from-top-2">
                                                    <Label>Select Group</Label>
                                                    <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                                                        <SelectTrigger className="mt-2">
                                                            <SelectValue placeholder="Select a group..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {groups.length === 0 ? (
                                                                <div className="p-2 text-sm text-muted-foreground text-center">No groups found</div>
                                                            ) : (
                                                                groups.map(g => (
                                                                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                                                ))
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            {recipientType === 'specific' && (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/40 p-3 rounded-lg border gap-3 sm:gap-0">
                                                        <div className="text-sm font-medium w-full sm:w-auto">
                                                            Selected: {selectedRecipients.length} recipients
                                                        </div>
                                                        <div className="flex gap-2 w-full sm:w-auto">
                                                            <ImportDialog>
                                                                <Button variant="outline" size="sm" className="h-8 flex-1 sm:flex-none">
                                                                    <Upload className="mr-2 h-3 w-3" /> Import CSV
                                                                </Button>
                                                            </ImportDialog>
                                                            <div className="flex-1 sm:flex-none">
                                                                <QuickAddRecipientDialog
                                                                    onSuccess={(newContact) => {
                                                                        setContacts(prev => [newContact, ...prev]);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="relative">
                                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            placeholder="Search contacts..."
                                                            className="pl-9"
                                                            value={searchQuery}
                                                            onChange={e => setSearchQuery(e.target.value)}
                                                        />
                                                    </div>

                                                    <ScrollArea className="h-[300px] border rounded-md">
                                                        <div className="p-4 space-y-2">
                                                            {/* Note: In a real app we'd filter 'contacts' array */}
                                                            {contacts
                                                                .filter(c =>
                                                                    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                                    (c.first_name && c.first_name.toLowerCase().includes(searchQuery.toLowerCase()))
                                                                )
                                                                .map(contact => (
                                                                    <div key={contact.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                                                                        <Checkbox
                                                                            id={`contact-${contact.id}`}
                                                                            checked={selectedRecipients.includes(contact.id)}
                                                                            onCheckedChange={() => {
                                                                                setSelectedRecipients(prev =>
                                                                                    prev.includes(contact.id) ? prev.filter(x => x !== contact.id) : [...prev, contact.id]
                                                                                );
                                                                            }}
                                                                        />
                                                                        <label
                                                                            htmlFor={`contact-${contact.id}`}
                                                                            className="flex-1 cursor-pointer flex justify-between items-center"
                                                                        >
                                                                            <div>
                                                                                <div className="font-medium text-sm">{contact.first_name} {contact.last_name}</div>
                                                                                <div className="text-xs text-muted-foreground">{contact.email}</div>
                                                                            </div>
                                                                            {selectedRecipients.includes(contact.id) && (
                                                                                <Badge variant="secondary" className="h-5 text-[10px]">Selected</Badge>
                                                                            )}
                                                                        </label>
                                                                    </div>
                                                                ))}
                                                            {contacts.length === 0 && (
                                                                <div className="text-center py-8 text-muted-foreground text-sm">
                                                                    No specific contacts loaded yet. Select "Specific" again or refresh.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </ScrollArea>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Content */}
                            {step === 3 && (
                                <div className="h-full animate-in slide-in-from-right-10 fade-in duration-300 relative py-2 md:py-0">
                                    <div className="flex justify-between items-center mb-2">
                                        <Label className="block">Email Content</Label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                id="attachment-upload"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                            {/* Hidden input for image uploads if we decide to fallback to upload instead of URL */}
                                            {/* Toolbar now handles the interactions */}
                                        </div>
                                    </div>

                                    <div className="mb-4 space-y-2">
                                        <Label>Subject Line</Label>
                                        <Input
                                            placeholder="Enter subject line..."
                                            value={subject}
                                            onChange={e => setSubject(e.target.value)}
                                            className="font-medium"
                                        />
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4 flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                                        <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <p>
                                            <strong>AI Assistance:</strong> Use the AI tool to draft content.
                                            Please <span className="underline font-semibold">verify and edit</span> all AI-generated text before sending, specifically checking for correct dates and details.
                                        </p>
                                    </div>

                                    {attachments.length > 0 && (
                                        <div className="flex gap-2 flex-wrap mb-3 p-2 bg-muted/30 rounded-md">
                                            {attachments.map((file, idx) => (
                                                <Badge key={idx} variant="secondary" className="flex items-center gap-1 pl-2 pr-1 py-1">
                                                    <span className="truncate max-w-[150px]">{file.filename}</span>
                                                    <span className="text-[10px] text-muted-foreground ml-1">({Math.round(file.size / 1024)}KB)</span>
                                                    <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 hover:bg-destructive/10 hover:text-destructive rounded-full" onClick={() => removeAttachment(idx)}>
                                                        <span className="sr-only">Remove</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                    </Button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    <RichEditor
                                        content={content}
                                        onChange={setContent}
                                        onSubjectGenerate={setSubject}
                                        onAttach={() => document.getElementById('attachment-upload')?.click()}
                                        fromName={fromName}
                                        variables={(() => {
                                            // 1. Standard variables
                                            const baseVars = [
                                                { key: 'first_name', label: 'First Name' },
                                                { key: 'last_name', label: 'Last Name' },
                                                { key: 'email', label: 'Email Address' }
                                            ];

                                            // 2. Extract custom fields if we have specific contacts selected
                                            let customVars: any[] = [];
                                            if (recipientType === 'specific' && contacts.length > 0) {
                                                // Get all unique custom field keys from selected contacts
                                                // or just all loaded contacts if none selected yet (though selected is preferred context)
                                                // Let's use all loaded contacts to show what's *possible*
                                                const allKeys = new Set<string>();
                                                contacts.forEach(c => {
                                                    if (c.custom_fields) {
                                                        Object.keys(c.custom_fields).forEach(k => allKeys.add(k));
                                                    }
                                                });

                                                customVars = Array.from(allKeys).map(key => ({
                                                    key,
                                                    label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Title Case
                                                    isCustom: true
                                                }));
                                            }

                                            // 3. Extract any variables *already used* in the content (so "Add new variable" ones persist in dropdown)
                                            const contentPattern = /{{([^}]+)}}/g;
                                            const contentVars = new Set<string>();
                                            let match;
                                            while ((match = contentPattern.exec(content)) !== null) {
                                                contentVars.add(match[1]);
                                            }

                                            // Add used content variables if not already present
                                            const usedVarsArray = Array.from(contentVars).map(key => ({
                                                key,
                                                label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                                isCustom: true
                                            }));

                                            // Merge unique by key
                                            const allVars = [...baseVars, ...customVars, ...usedVarsArray];
                                            const uniqueVars = Array.from(new Map(allVars.map(item => [item.key, item])).values());

                                            return uniqueVars;
                                        })()}
                                    />
                                </div>
                            )}

                            {/* STEP 4: Review */}
                            {step === 4 && (
                                <div className="space-y-6 max-w-2xl mx-auto py-6 animate-in slide-in-from-right-10 fade-in duration-300">
                                    <div className="bg-muted/30 p-6 rounded-lg space-y-4 border">
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <h3 className="font-semibold text-lg">Campaign Summary</h3>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleTestSend}
                                                disabled={isTestSending}
                                            >
                                                {isTestSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                                Send Test to Me
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Summary Details */}
                                            <div>
                                                <Label className="text-muted-foreground">Name</Label>
                                                <p className="font-medium">{name || "Untitled Campaign"}</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Recipients</Label>
                                                <p className="font-medium">
                                                    {recipientType === 'all' && "All Active Contacts"}
                                                    {recipientType === 'group' && (groups.find(g => g.id === selectedGroupId)?.name || "Selected Group")}
                                                    {recipientType === 'specific' && `${selectedRecipients.length} Specific Recipients`}
                                                </p>
                                            </div>
                                            <div className="col-span-2">
                                                <Label className="text-muted-foreground">Subject</Label>
                                                <p className="font-medium">{subject || "(No subject)"}</p>
                                            </div>
                                            {attachments.length > 0 && (
                                                <div className="col-span-2">
                                                    <Label className="text-muted-foreground">Attachments</Label>
                                                    <div className="flex gap-2 mt-1">
                                                        {attachments.map((a, i) => (
                                                            <Badge key={i} variant="outline">{a.filename}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Preview & Warnings ... */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold">Preview</h3>
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs">Preview as:</Label>
                                                <Select value={previewContactId} onValueChange={setPreviewContactId}>
                                                    <SelectTrigger className="w-[140px] sm:w-[200px] h-8 text-xs">
                                                        <SelectValue placeholder="Select contact to preview..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="raw_template">Raw Template (No Data)</SelectItem>
                                                        {(() => {
                                                            // Determine valid list for preview
                                                            let previewList = [];
                                                            if (recipientType === 'specific') {
                                                                previewList = contacts.filter(c => selectedRecipients.includes(c.id));
                                                            } else {
                                                                previewList = contacts; // Fallback to all loaded contacts
                                                            }

                                                            return previewList.slice(0, 10).map(c => (
                                                                <SelectItem key={c.id} value={c.id}>
                                                                    {c.first_name} {c.last_name || c.email}
                                                                </SelectItem>
                                                            ));
                                                        })()}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="border rounded-md p-4 sm:p-6 bg-white dark:bg-zinc-900 min-h-[200px] prose dark:prose-invert max-w-none shadow-sm overflow-x-auto">
                                            <div dangerouslySetInnerHTML={{
                                                __html: (() => {
                                                    if (!previewContactId || previewContactId === 'raw_template') return content;

                                                    const contact = contacts.find(c => c.id === previewContactId);
                                                    if (!contact) return content;

                                                    let previewHtml = content;
                                                    // Replace standard
                                                    previewHtml = previewHtml.replace(/{{first_name}}/g, contact.first_name || '');
                                                    previewHtml = previewHtml.replace(/{{last_name}}/g, contact.last_name || '');
                                                    previewHtml = previewHtml.replace(/{{email}}/g, contact.email || '');

                                                    // Replace custom
                                                    if (contact.custom_fields) {
                                                        Object.entries(contact.custom_fields).forEach(([key, value]) => {
                                                            const regex = new RegExp(`{{${key}}}`, 'g');
                                                            previewHtml = previewHtml.replace(regex, value as string);
                                                        });
                                                    }

                                                    // Highlight missing remaining variables
                                                    previewHtml = previewHtml.replace(/{{([^}]+)}}/g, '<span class="bg-red-100 text-red-600 px-1 rounded border border-red-200">{{$1}}</span>');

                                                    return previewHtml;
                                                })()
                                            }} />
                                        </div>
                                    </div>

                                    {missingVariables.length > 0 && (
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 space-y-3">
                                            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold">
                                                <AlertTriangle className="h-5 w-5" />
                                                <span>Missing Variable Data</span>
                                            </div>
                                            <p className="text-sm text-red-600 dark:text-red-300">
                                                The following recipients are missing data for variables used in your email.
                                                You must update their profiles or remove the variables to proceed.
                                            </p>

                                            <ScrollArea className="h-[200px] bg-background rounded border">
                                                <div className="p-2 space-y-2">
                                                    {missingVariables.map((item: any) => (
                                                        <div key={item.contactId} className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm">
                                                            <div>
                                                                <span className="font-medium">{item.name}</span>
                                                                <span className="text-xs text-muted-foreground block">Missing: {item.missing.join(', ')}</span>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => window.open(`/recipients/${item.contactId}`, '_blank')}
                                                            >
                                                                Edit
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>

                                            <div className="text-xs text-muted-foreground pt-2">
                                                Tip: Opens in new tab. Refresh this page after updating references (or go back a step and forward again).
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                                        <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                                        <div>
                                            <p className="font-semibold text-yellow-800 dark:text-yellow-400">Ready to send?</p>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-500">
                                                This will consume quota.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>

                        <div className="p-4 sm:p-6 border-t flex flex-wrap gap-4 justify-between bg-muted/10">
                            <Button
                                variant="ghost"
                                onClick={() => setStep(s => Math.max(1, s - 1))}
                                disabled={step === 1 || isSending}
                                className="order-1"
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" /> Back
                            </Button>

                            {step < 4 ? (
                                <Button onClick={() => setStep(s => Math.min(4, s + 1))} className="order-2">
                                    Next Step <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <div className="flex gap-2 order-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" disabled={isSending}>
                                                <Clock className="mr-2 h-4 w-4" /> Schedule
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-4 flex flex-col gap-4">
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">Pick a date</h4>
                                                <p className="text-sm text-muted-foreground">Schedule your campaign for later.</p>
                                            </div>
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                initialFocus
                                                disabled={(date) => date < new Date()}
                                            />
                                            <Button disabled={!date || isSending} onClick={handleSchedule} className="w-full">
                                                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                Confirm Schedule
                                            </Button>
                                        </PopoverContent>
                                    </Popover>
                                    <Button onClick={handleSend} className="bg-green-600 hover:bg-green-700" disabled={isSending}>
                                        {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                        {isSending ? "Sending..." : "Send Now"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div >
    );
}

export default function NewCampaignPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <CampaignEditor />
        </Suspense>
    );
}
