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
    Plus,
    Mail,
    LogOut,
    Contact,
    Users2,
    Shield
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
    const pathname = usePathname();
    const [isAdmin, setIsAdmin] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const checkAdminStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                setIsAdmin(profile?.role === 'admin' || profile?.role === 'superadmin');
            }
        };
        checkAdminStatus();
    }, [supabase]);

    const routes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/dashboard",
            active: pathname === "/dashboard",
        },
        {
            label: "Recipients",
            icon: Contact,
            href: "/recipients",
            active: pathname.startsWith("/recipients"),
        },
        {
            label: "Groups",
            icon: Users2,
            href: "/groups",
            active: pathname.startsWith("/groups"),
        },
        {
            label: "Campaigns",
            icon: Megaphone,
            href: "/campaigns",
            active: pathname.startsWith("/campaigns"),
        },
        {
            label: "Settings",
            icon: Settings,
            href: "/settings",
            active: pathname.startsWith("/settings"),
        },
    ];

    const isAdminDashboard = pathname.startsWith("/admin");

    return (
        <div className={cn("pb-12 h-screen border-r bg-sidebar", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <Link href="/" className="flex items-center pl-3 mb-14" onClick={onNavigate}>
                        <div className="mr-2">
                            <Image src="/logo.svg" alt="The Towncrier" width={32} height={32} className="h-8 w-8 object-contain" />
                        </div>
                        <h1 className="text-xl font-bold">The Towncrier</h1>
                    </Link>

                    {isAdmin && (
                        <div className="mb-4 p-3 bg-muted/50 rounded-lg border">
                            <p className="text-xs text-muted-foreground mb-2 font-medium">Dashboard Mode</p>
                            <Button
                                asChild
                                variant={isAdminDashboard ? "outline" : "secondary"}
                                size="sm"
                                className="w-full justify-start mb-2"
                                onClick={onNavigate}
                            >
                                <Link href="/dashboard">
                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                    Client Dashboard
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant={isAdminDashboard ? "secondary" : "outline"}
                                size="sm"
                                className="w-full justify-start"
                                onClick={onNavigate}
                            >
                                <Link href="/admin">
                                    <Shield className="mr-2 h-4 w-4" />
                                    Admin Dashboard
                                </Link>
                            </Button>
                        </div>
                    )}
                    <div className="space-y-1">
                        <Button asChild size="lg" className="w-full justify-start mb-6 font-semibold shadow-md" onClick={onNavigate}>
                            <Link href="/campaigns/new">
                                <Plus className="mr-2 h-5 w-5" />
                                New Campaign
                            </Link>
                        </Button>

                        {routes.map((route) => (
                            <Button
                                key={route.href}
                                variant={route.active ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start text-base font-medium transition-all hover:translate-x-1",
                                    route.active ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-sidebar-accent/50"
                                )}
                                asChild
                                onClick={onNavigate}
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
    const [user, setUser] = useState<{ name: string; email: string; id: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newsletterStatus, setNewsletterStatus] = useState<'subscribed' | 'unsubscribed' | 'loading'>('loading');
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (data.user) {
                setUser({
                    name: data.user.user_metadata.full_name || data.user.user_metadata.name || "User",
                    email: data.user.email || "",
                    id: data.user.id
                });

                // Fetch newsletter status
                try {
                    const response = await fetch('/api/newsletter/subscribe');
                    if (response.ok) {
                        const result = await response.json();
                        setNewsletterStatus(result.status);
                    } else {
                        setNewsletterStatus('unsubscribed');
                    }
                } catch (error) {
                    console.error("Failed to fetch newsletter status", error);
                    setNewsletterStatus('unsubscribed');
                }
            }
            setIsLoading(false);
        };
        getUser();
    }, [supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const toggleNewsletter = async () => {
        if (!user) return;

        const newStatus = newsletterStatus === 'subscribed' ? 'unsubscribed' : 'subscribed';
        const prevStatus = newsletterStatus;
        setNewsletterStatus(newStatus); // Optimistic update

        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    first_name: user.name.split(' ')[0], // Simple split for name
                    last_name: user.name.split(' ').slice(1).join(' ') || '',
                    status: newStatus
                })
            });

            if (!response.ok) {
                throw new Error("Failed to update");
            }
            toast.success(`Newsletter ${newStatus === 'subscribed' ? 'subscribed' : 'unsubscribed'} successfully`);
        } catch (error) {
            setNewsletterStatus(prevStatus); // Revert
            toast.error("Failed to update newsletter subscription");
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'DELETE') return;
        setIsDeleting(true);

        try {
            const response = await fetch('/api/user/delete', {
                method: 'DELETE'
            });

            if (response.ok) {
                toast.success("Account deleted successfully");
                router.push("/login"); // or / ?
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to delete account");
                setIsDeleting(false);
            }
        } catch (error) {
            toast.error("An error occurred while deleting the account");
            setIsDeleting(false);
        }
    };

    if (isLoading) return <div className="h-14 bg-muted/20 animate-pulse rounded-lg mx-2" />;
    if (!user) return null;

    return (
        <>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                    <div className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm cursor-pointer hover:bg-accent transition-colors">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={(user as any).user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold uppercase">
                                {user.name ? user.name[0] : 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden text-left">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </div>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Account Settings</DialogTitle>
                        <DialogDescription>
                            Manage your account preferences and subscription.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Communication</h4>
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                <div className="space-y-0.5">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        Newsletter
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Receive updates about new features and announcements.
                                    </p>
                                </div>
                                <Button
                                    variant={newsletterStatus === 'subscribed' ? "default" : "outline"}
                                    onClick={toggleNewsletter}
                                    disabled={newsletterStatus === 'loading'}
                                >
                                    {newsletterStatus === 'loading' ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : newsletterStatus === 'subscribed' ? (
                                        "Subscribed"
                                    ) : (
                                        "Subscribe"
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Account Actions</h4>
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={handleSignOut}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="w-full justify-start bg-destructive/10 text-destructive hover:bg-destructive/20 shadow-none border border-destructive/20"
                                    onClick={() => setIsDeleteAlertOpen(true)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Account
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">Delete Account</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <p>
                                This action is <span className="font-bold">irreversible</span>. This will permanently delete your account
                                and remove your data from our servers.
                            </p>
                            <p>
                                To confirm, please type <span className="font-mono font-bold text-foreground">DELETE</span> below:
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="my-2">
                        <Input
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="Type DELETE to confirm"
                            className="border-destructive/50 focus-visible:ring-destructive"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setDeleteConfirmation('');
                            setIsDeleteAlertOpen(false);
                        }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault(); // Prevent auto-closing if async
                                handleDeleteAccount();
                            }}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete Account
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
