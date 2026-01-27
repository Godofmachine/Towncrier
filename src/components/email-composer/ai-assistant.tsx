"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2, Wand2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

// ... props interface update
interface AiAssistantProps {
    onInsert: (content: string) => void;
    onSubjectGenerate?: (subject: string) => void;
    fromName?: string;
    currentEditorContent?: string;
    availableVariables?: string[]; // New Prop
}

export function AiAssistant({ onInsert, onSubjectGenerate, fromName, currentEditorContent = "", availableVariables = [] }: AiAssistantProps) {
    const [mode, setMode] = useState<'draft' | 'refine'>('draft'); // Mode Toggle
    const [prompt, setPrompt] = useState("");
    const [tone, setTone] = useState<'formal' | 'friendly' | 'persuasive' | 'neutral'>("neutral");
    const [isLoading, setIsLoading] = useState(false);

    // History State
    const [history, setHistory] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);

    // Refinement Instruction (Used for both Polish Mode and History Refinement)
    const [refinementInstruction, setRefinementInstruction] = useState("");

    const currentHistoryContent = currentIndex >= 0 ? history[currentIndex] : "";

    const handleGenerate = async (type: 'subject' | 'body', isRefinement = false) => {
        // Determine context
        // If Mode is 'refine', we use currentEditorContent as the "previousContent" to refine.
        // If isRefinement is true (refining a history item), we use currentHistoryContent.

        let contextContent = undefined;
        if (isRefinement) {
            contextContent = currentHistoryContent;
        } else if (mode === 'refine') {
            contextContent = currentEditorContent;
        }

        const inputPrompt = (mode === 'draft' && !isRefinement) ? prompt : "";
        const instruction = (mode === 'refine' || isRefinement) ? refinementInstruction : "";

        if (mode === 'draft' && !isRefinement && !prompt.trim()) {
            toast.error("Please enter a prompt");
            return;
        }
        if ((mode === 'refine' || isRefinement) && !instruction.trim()) {
            toast.error("Please enter instructions");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: inputPrompt,
                    tone,
                    type,
                    fromName,
                    instruction,
                    previousContent: contextContent,
                    availableVariables // Pass variables context
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Generation failed");

            if (type === 'subject' && onSubjectGenerate && mode === 'draft') {
                onSubjectGenerate(data.content);
                toast.success("Subject line generated!");
            } else {
                // Update History
                const newHistory = [...history, data.content];
                setHistory(newHistory);
                setCurrentIndex(newHistory.length - 1);

                if (isRefinement || mode === 'refine') setRefinementInstruction("");

                // If we just polished existing content, maybe we want to auto-switch view to result
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInsert = () => {
        onInsert(currentHistoryContent);
        toast.success(mode === 'refine' ? "Content replaced" : "Content inserted");
    };

    const navigateHistory = (direction: 'prev' | 'next') => {
        if (direction === 'prev') setCurrentIndex(Math.max(0, currentIndex - 1));
        if (direction === 'next') setCurrentIndex(Math.min(history.length - 1, currentIndex + 1));
    };

    return (
        <div className="h-full flex flex-col border-l bg-muted/10 w-full md:w-80">
            <div className="p-4 border-b bg-background/50 backdrop-blur">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-semibold flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            AI Assistant
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Powered by Groq</p>
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex bg-muted rounded-lg p-1">
                    <button
                        className={cn("flex-1 text-xs py-1.5 px-2 rounded-md transition-all font-medium", mode === 'draft' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                        onClick={() => setMode('draft')}
                    >
                        Draft New
                    </button>
                    <button
                        className={cn("flex-1 text-xs py-1.5 px-2 rounded-md transition-all font-medium", mode === 'refine' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                        onClick={() => setMode('refine')}
                    >
                        Polish Selection
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {availableVariables.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-2 rounded text-xs border border-blue-100 dark:border-blue-900/20">
                        <span className="font-semibold text-blue-700 dark:text-blue-300 block mb-1">Available to AI:</span>
                        <div className="flex flex-wrap gap-1 text-blue-600 dark:text-blue-400">
                            {availableVariables.map(v => (
                                <span key={v} className="bg-background px-1.5 rounded border border-blue-200 dark:border-blue-800">
                                    {`{{${v}}`}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {mode === 'draft' ? (
                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                        <label className="text-sm font-medium">I want to write about...</label>
                        <Textarea
                            placeholder="e.g. A follow-up email..."
                            className="h-24 resize-none"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>
                ) : (
                    <div className="space-y-2 animate-in fade-in slide-in-from-right-2">
                        <label className="text-sm font-medium">Instructions</label>
                        <Textarea
                            placeholder="e.g. Make it more professional, fix grammar, shorter..."
                            className="h-24 resize-none"
                            value={refinementInstruction}
                            onChange={(e) => setRefinementInstruction(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground">
                            {currentEditorContent ? "Refining current editor content." : "Warning: Editor is empty."}
                        </p>
                    </div>
                )}

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
                    {mode === 'draft' && (
                        <Button variant="outline" size="sm" onClick={() => handleGenerate('subject')} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subject Line"}
                        </Button>
                    )}
                    <Button
                        size="sm"
                        onClick={() => handleGenerate('body')}
                        disabled={isLoading}
                        className={cn("bg-purple-600 hover:bg-purple-700 text-white", mode === 'draft' ? "" : "col-span-2")}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Wand2 className="mr-2 h-4 w-4" /> {mode === 'draft' ? "Generate Draft" : "Polish Content"}</>}
                    </Button>
                </div>

                {/* History & Preview Area */}
                {history.length > 0 && (
                    <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Result ({currentIndex + 1}/{history.length})</label>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => navigateHistory('prev')}
                                    disabled={currentIndex <= 0}
                                >
                                    <ChevronLeft className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => navigateHistory('next')}
                                    disabled={currentIndex >= history.length - 1}
                                >
                                    <ChevronRight className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 text-xs ml-1" onClick={() => { setHistory([]); setCurrentIndex(-1); }}>Clear</Button>
                            </div>
                        </div>

                        <Card className="bg-background relative group">
                            <CardContent className="p-3 text-sm prose max-w-none dark:prose-invert max-h-[300px] overflow-y-auto">
                                <div dangerouslySetInnerHTML={{ __html: currentHistoryContent }} />
                            </CardContent>
                        </Card>

                        {/* Refine Result Input (Only show if we are NOT already in refinement mode main input, to avoid confusion? 
                            Actually, allow refining the result further is good.) */}
                        <div className="flex gap-2">
                            <Textarea
                                placeholder="Refine this specific result further..."
                                className="h-[38px] min-h-[38px] resize-none py-2 text-xs"
                                value={mode === 'refine' ? "" : refinementInstruction}
                                onChange={(e) => mode !== 'refine' && setRefinementInstruction(e.target.value)}
                                disabled={mode === 'refine'} // Disable this mini-input if main input is the refinement one? 
                            // Actually, better UX: reuse the main input for 'Polish' mode. 
                            // But for 'Draft' mode, we need this mini-input.
                            // Let's keep it simple: formatting allows refining the *Result*.
                            />
                            <Button
                                size="icon"
                                onClick={() => handleGenerate('body', true)}
                                disabled={isLoading || (mode !== 'refine' && !refinementInstruction.trim())} // Logic gets complex.
                                // Simplified: If in Refine Mode, 'Generate' button does the work. This mini-bar is for iterative improvements on HISTORY items.
                                title="Refine This Result"
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            </Button>
                        </div>

                        <Button className="w-full" onClick={handleInsert}>
                            {mode === 'refine' ? "Replace Selection" : "Insert Content"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
