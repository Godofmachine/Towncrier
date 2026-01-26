import React from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Check if user is already authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Redirect to dashboard if already logged in
    if (user) {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Side - Hero/Branding */}
            <div className="hidden lg:flex flex-col justify-between bg-primary/5 p-10 border-r border-border relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800/50 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                        <div className="mr-2">
                            <Image src="/logo.svg" alt="Towncrier" width={32} height={32} className="h-8 w-8 object-contain" />
                        </div>
                        <span>Towncrier</span>
                    </Link>
                </div>

                <div className="relative z-10 space-y-4 max-w-lg">
                    <blockquote className="text-2xl font-medium leading-relaxed">
                        &ldquo;Towncrier has completely transformed how we handle our newsletters. It's like having a marketing team in my pocket.&rdquo;
                    </blockquote>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <div>
                            <div className="font-semibold">Sofia Davis</div>
                            <div className="text-sm text-muted-foreground">Founder, Startup.io</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-sm space-y-6">
                    <div className="lg:hidden mb-8">
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                            <div className="mr-2">
                                <Image src="/logo.svg" alt="Towncrier" width={32} height={32} className="h-8 w-8 object-contain" />
                            </div>
                            <span>Towncrier</span>
                        </Link>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
