import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { MobileNav } from "@/components/admin/mobile-nav";
import Image from "next/image";
import { DashboardFooter } from "@/components/dashboard/footer";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80]">
                <AdminSidebar />
            </div>
            <main className="md:pl-72 h-full bg-muted/20 min-h-screen flex flex-col">
                <div className="md:hidden h-16 flex items-center px-4 border-b bg-background sticky top-0 z-50">
                    <MobileNav />
                    <Image src="/logo.svg" alt="The Towncrier" width={32} height={32} className="h-8 w-8 object-contain ml-4 mr-2" />
                    <span className="font-bold">The Towncrier Admin</span>
                </div>
                <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto space-y-8 w-full">
                    {children}
                </div>
                <DashboardFooter />
            </main>
        </div>
    );
}
