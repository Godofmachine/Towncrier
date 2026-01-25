"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Mail, Loader2, CheckCircle2, Shield } from "lucide-react";
import { toast } from "sonner";

export default function ConnectGmailPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const handleConnect = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    scopes: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly',
                    redirectTo: `${location.origin}/auth/callback?next=/dashboard`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) throw error;

        } catch (error) {
            toast.error("Failed to initiate Gmail connection");
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-2 border-primary/10 shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Connect your Gmail</CardTitle>
                    <CardDescription className="text-base">
                        Towncrier sends emails directly from your Gmail account, ensuring high deliverability and trust.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                            <div className="text-sm">
                                <span className="font-medium text-foreground">Send as YOU</span>
                                <p className="text-muted-foreground">Emails appear exactly as if you sent them manually from Gmail.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                            <div className="text-sm">
                                <span className="font-medium text-foreground">100% Free Sending</span>
                                <p className="text-muted-foreground">Uses your existing Gmail quota (500-2,000 emails/day).</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Shield className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                            <div className="text-sm">
                                <span className="font-medium text-foreground">Secure & Private</span>
                                <p className="text-muted-foreground">We never read your personal emails or store your password.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button size="lg" className="w-full" onClick={handleConnect} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                        Connect Gmail Account
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => router.push('/dashboard')}>
                        Skip for now
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
