"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/notifications");
            const data = await res.json();
            if (Array.isArray(data)) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchNotifications();

        // Realtime Subscription (Optional but nice)
        const channel = supabase
            .channel('notifications-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications'
                },
                (payload) => {
                    // Optimistic update
                    setNotifications(prev => [payload.new, ...prev]);
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const markAsRead = async (id?: string) => {
        try {
            // Optimistic Update
            if (id) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
                await fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ id }) });
            } else {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
                await fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ markAll: true }) });
            }
        } catch (e) {
            console.error("Failed to mark read", e);
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={(val) => {
            setIsOpen(val);
            if (val) fetchNotifications(); // Refresh on open
        }}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 border border-white dark:border-zinc-950 animate-in zoom-in" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="xs" className="h-6 text-xs text-muted-foreground" onClick={(e) => {
                            e.preventDefault();
                            markAsRead();
                        }}>
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {isLoading && notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                            Loading...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            No notifications yet.
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map(n => (
                                <DropdownMenuItem key={n.id} className={cn("flex flex-col items-start gap-1 p-3 cursor-pointer", !n.is_read && "bg-muted/50")} onClick={() => markAsRead(n.id)}>
                                    <div className="flex justify-between w-full">
                                        <span className={cn("font-medium text-sm", !n.is_read && "text-primary")}>
                                            {n.title}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground w-full line-clamp-2">
                                        {n.message}
                                    </p>
                                    {!n.is_read && (
                                        <span className="absolute right-2 top-0 bottom-0 my-auto flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                        </span>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
