"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, AlertCircle, FileSpreadsheet, CheckCircle2, Loader2, X, Download } from "lucide-react";
import { parseCSV, ParseResult, ParsedContact } from "@/lib/recipients/csv-parser";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportDialogProps {
    children?: React.ReactNode;
}

export function ImportDialog({ children }: ImportDialogProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"upload" | "review" | "importing">("upload");
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleFile = async (file: File) => {
        if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
            toast.error("Please upload a valid CSV file");
            return;
        }

        const result = await parseCSV(file);
        setParseResult(result);
        setStep("review");
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleConfirmImport = async () => {
        setStep("importing");

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast.success(`Successfully imported ${parseResult?.contacts.length} contacts`);
        setOpen(false);
        setStep("upload");
        setParseResult(null);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Import CSV
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Import Contacts</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to bulk add recipients. We'll automatically detect standard fields and create custom fields for everything else.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === "upload" && (
                        <div
                            className={`
                  border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer
                  ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50"}
               `}
                            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                            onDragOver={(e) => { e.preventDefault(); }}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById("csv-upload")?.click()}
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <FileSpreadsheet className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-medium">Click to upload or drag and drop</p>
                                    <p className="text-sm text-muted-foreground mt-1">CSV files only (max 5MB)</p>
                                </div>
                                <input
                                    id="csv-upload"
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                                />
                            </div>
                        </div>
                    )}

                    {step === "upload" && (
                        <div className="flex justify-center mt-4">
                            <Button variant="outline" size="sm" className="gap-2" onClick={(e) => {
                                e.stopPropagation();
                                const headers = "email,first_name,last_name,company,role\n";
                                const example = "john@example.com,John,Doe,Acme Inc,Manager";
                                const blob = new Blob([headers + example], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = "towncrier_template.csv";
                                a.click();
                                window.URL.revokeObjectURL(url);
                            }}>
                                <Download className="h-4 w-4" /> Download CSV Template
                            </Button>
                        </div>
                    )}

                    {step === "review" && parseResult && (
                        <div className="space-y-4 animate-in fade-in-50">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border rounded-md p-3 bg-muted/20">
                                    <div className="text-2xl font-bold text-primary">{parseResult.contacts.length}</div>
                                    <div className="text-sm text-muted-foreground">Valid Contacts</div>
                                </div>
                                <div className="border rounded-md p-3 bg-muted/20">
                                    <div className="text-2xl font-bold text-muted-foreground">{parseResult.skipped}</div>
                                    <div className="text-sm text-muted-foreground">Skipped Rows</div>
                                </div>
                            </div>

                            {/* Detected Custom Fields */}
                            {parseResult.contacts.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Detected Custom Fields</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.keys(parseResult.contacts[0].custom_fields).length > 0 ? (
                                            Object.keys(parseResult.contacts[0].custom_fields).map(field => (
                                                <Badge key={field} variant="secondary" className="px-2 py-1">
                                                    {field}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-sm text-muted-foreground italic">None detected</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Errors List */}
                            {parseResult.errors.length > 0 && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Issues Found</AlertTitle>
                                    <AlertDescription className="max-h-32 overflow-y-auto mt-2">
                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                            {parseResult.errors.map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    {step === "importing" && (
                        <div className="py-10 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground">Importing your contacts...</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step === "review" && (
                        <>
                            <Button variant="outline" onClick={() => { setStep("upload"); setParseResult(null); }}>
                                Cancel
                            </Button>
                            <Button onClick={handleConfirmImport} disabled={parseResult?.contacts.length === 0}>
                                Confirm Import
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
