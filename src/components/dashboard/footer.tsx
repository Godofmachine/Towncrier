import Link from "next/link";
import { Github, Twitter, Linkedin, Mail, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t bg-background/50 backdrop-blur-sm mt-auto">
            <div className="mx-auto max-w-7xl px-6 py-8 md:flex md:items-center md:justify-between lg:px-8">
                <div className="flex justify-center items-center space-x-6 md:order-2">
                    <Link href="https://x.com/Blueking_I" target="_blank" className="text-muted-foreground hover:text-foreground">
                        <span className="sr-only">X (Twitter)</span>
                        <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
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
                    <Button asChild className="bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black font-semibold rounded-md shadow-sm h-9 px-4">
                        <Link href="https://buymeacoffee.com/blueking" target="_blank" className="flex items-center gap-2">
                            <Coffee className="h-4 w-4" />
                            <span>Buy me a coffee</span>
                        </Link>
                    </Button>
                </div>
                <div className="mt-8 md:order-1 md:mt-0">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center md:text-left">
                        <p className="text-xs leading-5 text-muted-foreground">
                            &copy; {currentYear} Towncrier. Built by <Link href="https://blueking.vercel.app" target="_blank" className="underline underline-offset-2 font-medium text-foreground hover:text-primary">Blueking</Link>.
                        </p>
                        <nav className="flex gap-4 text-xs text-muted-foreground">
                            <Link href="/" className="hover:underline hover:text-foreground">
                                Home
                            </Link>
                            <Link href="/terms" className="hover:underline hover:text-foreground">
                                Terms
                            </Link>
                            <Link href="/privacy" className="hover:underline hover:text-foreground">
                                Privacy
                            </Link>
                            <Link href="/docs" className="hover:underline hover:text-foreground">
                                Docs
                            </Link>
                            <Link href="/contact" className="hover:underline hover:text-foreground">
                                Contact
                            </Link>
                        </nav>
                    </div>
                </div>
            </div>
        </footer>
    );
}
