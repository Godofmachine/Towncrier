"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MapPin, Phone, Send, Loader2, CheckCircle2, Github, Twitter, Linkedin, Coffee } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ContactPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const form = e.currentTarget;
        const name = (form.elements.namedItem('name') as HTMLInputElement)?.value;
        const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
        const subject = (form.elements.namedItem('subject') as HTMLInputElement)?.value;
        const message = (form.elements.namedItem('message') as HTMLTextAreaElement)?.value;

        // Debug log to check if values are captured
        console.log("Form Values:", { name, email, subject, message });

        const body = {
            access_key: "ad1363bd-b83b-4595-b733-c0ceb046086b",
            from_website: "towncrier",
            name,
            email,
            subject,
            message
        };

        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (result.success) {
                setIsSent(true);
                toast.success("Message sent successfully!");
                form.reset();
            } else {
                toast.error(result.message || "Failed to send message");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
            console.error("Form error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500 max-w-5xl mx-auto pb-20">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Contact Us</h2>
                <p className="text-muted-foreground mt-2 text-lg">
                    Have questions or feedback? We'd love to hear from you.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Send a Message</CardTitle>
                        <CardDescription>
                            Fill out the form below and we'll get back to you as soon as possible.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isSent ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                                <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold">Message Sent!</h3>
                                <p className="text-muted-foreground">
                                    Thank you for reaching out. We usually respond within 24 hours.
                                </p>
                                <Button onClick={() => setIsSent(false)} variant="outline">
                                    Send Another Message
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" placeholder="Your name" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="you@example.com" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input id="subject" placeholder="How can we help?" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea id="message" placeholder="Type your message here..." className="min-h-[120px]" required />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" /> Send Message
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-full text-primary">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium">Email</p>
                                    <p className="text-sm text-muted-foreground">samueladeniran016@gmail.com</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-full text-primary">
                                    <Phone className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium">Phone</p>
                                    <p className="text-sm text-muted-foreground">+234 901 745 9581</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <p className="font-medium mb-3">Connect with us</p>
                                <div className="flex gap-4">
                                    <Link href="https://x.com/Blueking_I" target="_blank" className="p-2 bg-muted rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                                        <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 p-0.5">
                                            <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                                        </svg>
                                        <span className="sr-only">Twitter</span>
                                    </Link>
                                    <Link href="https://github.com/Godofmachine" target="_blank" className="p-2 bg-muted rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                                        <Github className="h-5 w-5" />
                                        <span className="sr-only">GitHub</span>
                                    </Link>
                                    <Link href="https://www.linkedin.com/in/adeniran-samuel-285baa290" target="_blank" className="p-2 bg-muted rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                                        <Linkedin className="h-5 w-5" />
                                        <span className="sr-only">LinkedIn</span>
                                    </Link>
                                    <Link href="https://buymeacoffee.com/blueking" target="_blank" className="p-2 bg-muted rounded-full hover:bg-primary/10 text-[#FFDD00] hover:text-[#FFDD00/10] transition-colors">
                                        <Coffee className="h-5 w-5" />
                                        <span className="sr-only">Buy me a coffee</span>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-950 text-slate-50 border-none">
                        <CardHeader>
                            <CardTitle className="text-white">Need support?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-300 text-sm mb-4">
                                Our support team is available Monday through Friday, 9am to 5pm PST.
                            </p>
                            <p className="text-slate-300 text-sm">
                                Check our <a href="/docs" className="underline text-white hover:text-primary">documentation</a> for quick answers to common questions.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
