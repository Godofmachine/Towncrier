"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Users2, MoreHorizontal, Mail, Loader2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GroupsPage() {
    const [groups, setGroups] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchGroups = async () => {
            setIsLoading(true);
            // Assuming 'broadcast_groups' table exists as per schema
            const { data } = await supabase
                .from('broadcast_groups')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) setGroups(data);
            setIsLoading(false);
        };
        fetchGroups();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Broadcast Groups</h2>
                    <p className="text-muted-foreground mt-1">
                        Segment your audience for targeted campaigns.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/groups/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Group
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-20 flex justify-center text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <>
                        {groups.map((group) => (
                            <Card key={group.id} className="hover:border-primary/50 transition-colors group relative">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className={`h-2 w-12 rounded-full bg-blue-500 mb-3 opacity-80`} />
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>Edit Group</DropdownMenuItem>
                                                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardTitle className="text-xl">{group.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-2 mb-4">
                                        <Badge variant="secondary">{group.category || "General"}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Users2 className="h-4 w-4" />
                                        <span className="font-medium text-foreground">{group.member_count || 0}</span> members
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-2">
                                    <Button variant="outline" className="w-full" size="sm">
                                        <Mail className="mr-2 h-3 w-3" />
                                        Send Campaign
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}

                        {/* Create New Card Placeholder */}
                        <Link href="/groups/new" className="h-full">
                            <div className="h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-muted-foreground hover:bg-muted/30 transition-colors cursor-pointer min-h-[220px]">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                    <Plus className="h-6 w-6" />
                                </div>
                                <p className="font-medium">Create New Group</p>
                            </div>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
