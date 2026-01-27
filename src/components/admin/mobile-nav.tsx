"use client";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState } from "react";

export function MobileNav() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
                <VisuallyHidden>
                    <SheetTitle>Admin Navigation Menu</SheetTitle>
                </VisuallyHidden>
                <AdminSidebar className="border-none h-full" onNavigate={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    );
}
