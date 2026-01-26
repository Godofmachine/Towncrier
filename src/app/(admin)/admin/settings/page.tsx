"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
                <p className="text-muted-foreground">
                    Configure platform-wide settings and defaults.
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>General Configuration</CardTitle>
                        <CardDescription>
                            Basic platform information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="site-name">Site Name</Label>
                            <Input id="site-name" defaultValue="The Towncrier" disabled />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="admin-email">Admin Contact Email</Label>
                            <Input id="admin-email" defaultValue="admin@towncrier.com" />
                        </div>
                        <Button>Save Changes</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Email Limits</CardTitle>
                        <CardDescription>
                            Global sending limits and quotas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="daily-limit">Default Daily Limit</Label>
                            <Input id="daily-limit" type="number" defaultValue="500" />
                            <p className="text-sm text-muted-foreground">The default number of emails a new user can send per day.</p>
                        </div>
                        <Button variant="outline">Update Limits</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
