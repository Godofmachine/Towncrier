"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Megaphone,
    Settings,
    LogOut,
    Users,
    Shield
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function AdminSidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    const routes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/admin",
            active: pathname === "/admin",
        },
        {
            label: "Users",
            icon: Users,
            href: "/admin/users",
            active: pathname.startsWith("/admin/users"),
        },
        {
            label: "Campaigns",
            icon: Megaphone,
            href: "/admin/campaigns",
            active: pathname.startsWith("/admin/campaigns"),
        },
        {
            label: "System Settings",
            icon: Settings,
            href: "/admin/settings",
            active: pathname.startsWith("/admin/settings"),
        },
    ];

    return (
        <div className={cn("pb-12 h-screen border-r bg-sidebar", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <Link href="/admin" className="flex items-center pl-3 mb-14">
                        <div className="mr-2">
                            <Image src="/logo.svg" alt="The Towncrier" width={32} height={32} className="h-8 w-8 object-contain" />
                        </div>
                        <h1 className="text-xl font-bold">The Towncrier <span className="text-xs font-normal bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1 align-middle">Admin</span></h1>
                    </Link>
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Button
                                key={route.href}
                                variant={route.active ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start text-base font-medium transition-all hover:translate-x-1",
                                    route.active ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-sidebar-accent/50"
                                )}
                                asChild
                            >
                                <Link href={route.href}>
                                    <route.icon className={cn("h-5 w-5 mr-3", route.active ? "text-primary" : "text-muted-foreground")} />
                                    {route.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 px-6">
                <UserProfile />
            </div>
        </div>
    );
}

function UserProfile() {
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (data.user) {
                setUser({
                    name: data.user.user_metadata.full_name || data.user.user_metadata.name || "Admin",
                    email: data.user.email || ""
                });
            }
        };
        getUser();
    }, [supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    if (!user) return null;

    return (
        <div className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm">
            <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center text-destructive font-bold uppercase">
                <Shield className="h-4 w-4" />
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={handleSignOut}
            >
                <LogOut className="h-4 w-4" />
            </Button>
        </div>
    );
}
