import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Coffee, Github, Linkedin } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-background border-t">
            <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-4 max-w-xs">
                        <div className="flex items-center gap-2 font-semibold text-lg">
                            <Image src="/logo.svg" alt="Towncrier" width={24} height={24} className="h-6 w-6 object-contain" />
                            Towncrier
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Send personalized bulk emails directly from your Gmail. The simple, zero-code alternative.
                        </p>
                        <div className="flex gap-4">
                            <Link href="https://x.com/Blueking_I" target="_blank" className="text-muted-foreground hover:text-foreground">
                                <span className="sr-only">X (Twitter)</span>
                                <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                                </svg>
                            </Link>
                            <Link href="https://github.com/Godofmachine" target="_blank" className="text-muted-foreground hover:text-foreground">
                                <span className="sr-only">GitHub</span>
                                <Github className="h-5 w-5" />
                            </Link>
                            <Link href="https://www.linkedin.com/in/adeniran-samuel-285baa290" target="_blank" className="text-muted-foreground hover:text-foreground">
                                <span className="sr-only">LinkedIn</span>
                                <Linkedin className="h-5 w-5" />
                            </Link>
                        </div>
                        <Button asChild className="bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black font-semibold rounded-md shadow-sm h-9 px-4">
                            <Link href="https://buymeacoffee.com/blueking" target="_blank" className="flex items-center gap-2">
                                <Coffee className="h-4 w-4" />
                                <span>Buy me a coffee</span>
                            </Link>
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-sm font-semibold leading-6 text-foreground">Platform</h3>
                            <ul role="list" className="mt-4 space-y-2">
                                <li>
                                    <Link href="/docs" className="text-sm leading-6 text-muted-foreground hover:text-primary">How it Works</Link>
                                </li>
                                <li>
                                    <Link href="/login" className="text-sm leading-6 text-muted-foreground hover:text-primary">Login</Link>
                                </li>
                                <li>
                                    <Link href="/signup" className="text-sm leading-6 text-muted-foreground hover:text-primary">Sign Up</Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold leading-6 text-foreground">Support</h3>
                            <ul role="list" className="mt-4 space-y-2">
                                <li>
                                    <Link href="/contact" className="text-sm leading-6 text-muted-foreground hover:text-primary">
                                        Contact Us
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold leading-6 text-foreground">Legal</h3>
                            <ul role="list" className="mt-4 space-y-2">
                                <li>
                                    <Link href="/privacy" className="text-sm leading-6 text-muted-foreground hover:text-primary">Privacy Policy</Link>
                                </li>
                                <li>
                                    <Link href="/terms" className="text-sm leading-6 text-muted-foreground hover:text-primary">Terms</Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-16 border-t pt-8">
                    <p className="text-xs leading-5 text-muted-foreground text-center">
                        &copy; {new Date().getFullYear()} Towncrier. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
