import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, Shield, Zap, Sparkles } from "lucide-react";
import { DashboardPreview } from "@/components/home/dashboard-preview";
import Link from "next/link";
import { NewsletterForm } from "@/components/home/newsletter-form";

export default function Home() {
    return (
        <>
            {/* Hero Section */}
            <section className="py-12 md:py-32 px-6 text-center space-y-8 max-w-5xl mx-auto">
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <Sparkles className="mr-2 h-3 w-3" />
                    The Zero-Code Alternative to Apps Script
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    Send Personalized Bulk Emails <br className="hidden md:block" />
                    <span className="text-primary">Directly From Gmail</span>
                </h1>

                <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    Stop wrestling with spreadsheets and scripts. Use our beautiful dashboard to send personalized mass emails that land in the primary inbox. 100% Free.
                </p>

                <div className="flex flex-col items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                        <Link href="/signup">
                            <Button size="lg" className="h-12 px-8 text-base w-full sm:w-auto">
                                Start Sending for Free <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <NewsletterForm />
                    </div>
                    <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4">
                        How it Works
                    </Link>
                </div>

                <div className="pt-8 md:pt-16 animate-in fade-in zoom-in duration-1000 delay-500">
                    <div className="rounded-xl border bg-card shadow-2xl overflow-hidden max-w-4xl mx-auto p-2">
                        <DashboardPreview />
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-muted/30 border-t">
                <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-12">
                    <div className="space-y-4">
                        <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Mail className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-semibold">Sent from YOUR Gmail</h3>
                        <p className="text-muted-foreground">Emails come directly from your address, ensuring high open rates and trust. No "via generic-service.com".</p>
                    </div>
                    <div className="space-y-4">
                        <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Zap className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-semibold">Zero Coding Required</h3>
                        <p className="text-muted-foreground">Forget Apps Script errors. Use our visual editor, smart CSV importer, and unlimited custom fields.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <Shield className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-semibold">Secure & Private</h3>
                        <p className="text-muted-foreground">We never read your emails. Your data is encrypted, and you can revoke access at any time.</p>
                    </div>
                </div>
            </section>
        </>
    );
}
