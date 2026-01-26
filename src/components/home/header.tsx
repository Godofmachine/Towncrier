import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Header() {
    return (
        <header className="px-6 h-16 flex items-center justify-between border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                <div className="mr-2">
                    <Image src="/logo.svg" alt="Towncrier" width={32} height={32} className="h-8 w-8 object-contain" />
                </div>
                <span>Towncrier</span>
            </Link>
            <nav className="flex gap-4">
                <Link href="/docs">
                    <Button variant="ghost">How it Works</Button>
                </Link>
                <Link href="/login">
                    <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/signup">
                    <Button>Get Started</Button>
                </Link>
            </nav>
        </header>
    );
}
