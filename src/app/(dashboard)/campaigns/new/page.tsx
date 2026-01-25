"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichEditor } from "@/components/email-composer/rich-editor";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle2, ChevronRight, ChevronLeft, Save, Clock, Send, Users, Search, Plus, Upload, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ImportDialog } from "@/components/recipients/import-dialog";
import { QuickAddRecipientDialog } from "@/components/recipients/quick-add-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";

export default function NewCampaignPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [date, setDate] = useState<Date>();
    const supabase = createClient();

    // Form State
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [recipientType, setRecipientType] = useState("all");

    // Specific Recipients Selection State
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [contacts, setContacts] = useState<any[]>([]);
    // Attachments State
    const [attachments, setAttachments] = useState<{ filename: string; content: string; contentType: string; size: number }[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [isContactsLoading, setIsContactsLoading] = useState(false);
    const [missingVariables, setMissingVariables] = useState<{ contactId: string; missing: string[] }[]>([]);
    const [previewContactId, setPreviewContactId] = useState<string>("");

    // Groups State
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>("");

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

    const steps = [
        { number: 1, title: "Details" },
        { number: 2, title: "Recipients" },
        { number: 3, title: "Content" },
        { number: 4, title: "Review" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500 pb-20">
            {/* Headers and Steps preserved above... */}

            {/* ... */}

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
                                        <Label>Email Subject</Label>
                                        <Input placeholder="Enter subject line..." value={subject} onChange={e => setSubject(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>From Name</Label>
                                        <Input placeholder="Your Name or Company" defaultValue="John Doe" />
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Recipients */}
                            {step === 2 && (
                                <div className="space-y-6 max-w-2xl mx-auto py-6 animate-in slide-in-from-right-10 fade-in duration-300">
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
                                                    <div className="flex justify-between items-center bg-muted/40 p-3 rounded-lg border">
                                                        <div className="text-sm font-medium">
                                                            Selected: {selectedRecipients.length} recipients
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <ImportDialog>
                                                                <Button variant="outline" size="sm" className="h-8">
                                                                    <Upload className="mr-2 h-3 w-3" /> Import CSV
                                                                </Button>
                                                            </ImportDialog>
                                                            <QuickAddRecipientDialog
                                                                onSuccess={(newContact) => {
                                                                    setContacts(prev => [newContact, ...prev]);
                                                                    // Default select the new one?
                                                                    // toggleRecipient(newContact.id);
                                                                }}
                                                            />
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
                                <div className="h-full animate-in slide-in-from-right-10 fade-in duration-300 relative">
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
                                        <h3 className="font-semibold text-lg border-b pb-2">Campaign Summary</h3>
                                        <div className="grid grid-cols-2 gap-4">
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
                                                    <SelectTrigger className="w-[200px] h-8 text-xs">
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
                                        <div className="border rounded-md p-6 bg-white dark:bg-zinc-900 min-h-[200px] prose dark:prose-invert max-w-none shadow-sm">
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

                        <div className="p-6 border-t flex justify-between bg-muted/10">
                            <Button
                                variant="ghost"
                                onClick={() => setStep(s => Math.max(1, s - 1))}
                                disabled={step === 1 || isSending}
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" /> Back
                            </Button>

                            {step < 4 ? (
                                <Button onClick={() => setStep(s => Math.min(4, s + 1))}>
                                    Next Step <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" disabled={isSending}>
                                                <Clock className="mr-2 h-4 w-4" /> Schedule
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                initialFocus
                                            />
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
        </div>
    );
}
