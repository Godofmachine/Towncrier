"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface AiAssistantProps {
    onInsert: (content: string) => void;
    onSubjectGenerate?: (subject: string) => void;
    fromName?: string;
}

export function AiAssistant({ onInsert, onSubjectGenerate, fromName }: AiAssistantProps) {
    const [prompt, setPrompt] = useState("");
    const [tone, setTone] = useState<'formal' | 'friendly' | 'persuasive' | 'neutral'>("neutral");
    const [isLoading, setIsLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState("");

    const handleGenerate = async (type: 'subject' | 'body') => {
        if (!prompt.trim()) {
            toast.error("Please enter a prompt first");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    tone,
                    type,
                    fromName
                })
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.needsSetup) {
                    toast.error("AI service not configured on server.");
                    return;
                }
                throw new Error(data.error || "Generation failed");
            }

            if (type === 'subject' && onSubjectGenerate) {
                onSubjectGenerate(data.content);
                toast.success("Subject line generated!");
            } else {
                setGeneratedContent(data.content);
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInsert = () => {
        onInsert(generatedContent);
        setGeneratedContent("");
        toast.success("Content inserted");
    };

    return (
        <div className="h-full flex flex-col border-l bg-muted/10 w-full md:w-80">
            <div className="p-4 border-b bg-background/50 backdrop-blur flex justify-between items-center">
                <div>
                    <h3 className="font-semibold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        AI Assistant
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Powered by Groq</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">I want to write about...</label>
                    <Textarea
                        placeholder="e.g. A follow-up email to a potential client about our new pricing..."
                        className="h-24 resize-none"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Tone</label>
                    <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="neutral">Neutral & Professional</SelectItem>
                            <SelectItem value="formal">Formal & Corporate</SelectItem>
                            <SelectItem value="friendly">Friendly & Casual</SelectItem>
                            <SelectItem value="persuasive">Persuasive & Salesy</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleGenerate('subject')} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subject Line"}
                    </Button>
                    <Button size="sm" onClick={() => handleGenerate('body')} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700 text-white">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Wand2 className="mr-2 h-4 w-4" /> Draft Body</>}
                    </Button>
                </div>

                {generatedContent && (
                    <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Preview</label>
                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setGeneratedContent("")}>Clear</Button>
                        </div>
                        <Card className="bg-background">
                            <CardContent className="p-3 text-sm prose max-w-none dark:prose-invert">
                                <div dangerouslySetInnerHTML={{ __html: generatedContent }} />
                            </CardContent>
                        </Card>
                        <Button className="w-full" onClick={handleInsert}>
                            Insert Content
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
