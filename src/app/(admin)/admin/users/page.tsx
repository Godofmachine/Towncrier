"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ShieldAlert } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Get current user's profile to check their role
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                setCurrentUser({ ...user, role: profile?.role });
            }

            if (data) setUsers(data);
            setIsLoading(false);
        };

        fetchUsers();
    }, [supabase]);

    const handleRoleChange = async (userId: string, newRole: string) => {
        // Optimistic update
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));

        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) {
            toast.error("Failed to update role");
            // Revert on error
            const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
            setUsers(users.map(u => u.id === userId ? { ...u, role: data?.role || 'user' } : u));
        } else {
            toast.success("User role updated");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const canManageRoles = currentUser?.role === 'superadmin';

    return (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                <p className="text-muted-foreground">
                    Manage registered users and their accounts.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>
                        A list of all users registered on the platform.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Gmail Status</TableHead>
                                <TableHead className="text-right">Joined</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={user.avatar_url} />
                                                    <AvatarFallback>{user.full_name ? user.full_name[0] : 'U'}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="flex items-center gap-1.5">
                                                        {user.full_name || 'Unnamed User'}
                                                        {user.role === 'superadmin' && <ShieldAlert className="h-3 w-3 text-amber-500" />}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground font-normal">{user.email || 'No email (Auth managed)'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {canManageRoles && user.email !== 'samueladeniran016@gmail.com' ? (
                                                <Select
                                                    value={user.role || 'user'}
                                                    onValueChange={(val) => handleRoleChange(user.id, val)}
                                                >
                                                    <SelectTrigger className="h-8 w-28">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="user">User</SelectItem>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                        <SelectItem value="superadmin">Superadmin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Badge variant="outline" className={`
                                                    ${user.role === 'superadmin' ? 'border-amber-500 text-amber-600 bg-amber-50' :
                                                        user.role === 'admin' ? 'border-purple-500 text-purple-600 bg-purple-50' :
                                                            'text-muted-foreground'}
                                                `}>
                                                    {user.role || 'user'}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.gmail_connected ? (
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">Connected</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">Not Connected</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-sm">
                                            {user.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) : 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
