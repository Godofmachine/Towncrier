import {
    LayoutDashboard,
    Mail,
    Users,
    Settings,
    Plus,
    Search,
    MoreHorizontal,
    TrendingUp,
    Send
} from "lucide-react";
import Image from "next/image";

export function DashboardPreview() {
    return (
        <div className="w-full aspect-video bg-background rounded-lg overflow-hidden flex text-left text-sm border shadow-sm relative group">
            {/* Sidebar Mockup */}
            <div className="w-48 lg:w-56 border-r bg-muted/30 p-3 hidden md:flex flex-col gap-4 pt-4">
                <div className="flex items-center gap-2 px-2 font-semibold text-primary mb-2">
                    <div className="mr-2">
                        <Image src="/Towncrier-logo.svg" alt="Towncrier" width={24} height={24} className="h-6 w-6 object-contain" />
                    </div>
                    Towncrier
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-md font-medium">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:bg-muted/50 rounded-md">
                        <Mail className="w-4 h-4" />
                        Campaigns
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:bg-muted/50 rounded-md">
                        <Users className="w-4 h-4" />
                        Recipients
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:bg-muted/50 rounded-md">
                        <Settings className="w-4 h-4" />
                        Settings
                    </div>
                </div>

                <div className="mt-auto px-3 py-2">
                    <div className="flex items-center gap-2 p-2 rounded-md border bg-background/50">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500" />
                        <div className="flex-1 overflow-hidden">
                            <div className="h-3 w-20 bg-muted-foreground/20 rounded mb-1" />
                            <div className="h-2 w-12 bg-muted-foreground/10 rounded" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Mockup */}
            <div className="flex-1 flex flex-col bg-background/50">
                {/* Header Mockup */}
                <div className="h-14 border-b px-6 flex items-center justify-between bg-background/80 backdrop-blur-sm">
                    <h2 className="font-semibold text-lg">Dashboard</h2>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                            <Search className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="h-8 px-3 rounded-md bg-primary text-primary-foreground flex items-center gap-1.5 text-xs font-medium shadow-sm shadow-primary/20">
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">New Campaign</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6 overflow-hidden">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "Total Sent", val: "2,543", trend: "+12%", icon: Send, color: "text-blue-500" },
                            { label: "Open Rate", val: "48.2%", trend: "+5%", icon: Mail, color: "text-purple-500" },
                            { label: "Click Rate", val: "12.5%", trend: "+2%", icon: TrendingUp, color: "text-green-500" },
                        ].map((stat, i) => (
                            <div key={i} className="p-4 rounded-xl border bg-card shadow-sm space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-700" style={{ animationDelay: `${i * 150}ms` }}>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-xs">{stat.label}</span>
                                    <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                                </div>
                                <div className="text-lg font-bold flex items-center gap-2">
                                    {stat.val}
                                    {i === 0 && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
                                </div>
                                <div className="text-[10px] text-green-600 font-medium bg-green-50 dark:bg-green-900/20 w-fit px-1.5 py-0.5 rounded-full">
                                    {stat.trend} from last month
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recent Campaigns List */}
                    <div className="rounded-xl border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                        <div className="p-4 border-b flex items-center justify-between bg-muted/5">
                            <h3 className="font-medium">Recent Campaigns</h3>
                            <button className="text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="divide-y text-sm">
                            {[
                                { name: "Quarterly Newsletter", date: "Just now", status: "Sending", count: "450/1200" },
                                { name: "Product Launch Announcement", date: "2 days ago", status: "Sent", count: "2,340" },
                                { name: "Beta Users Follow-up", date: "5 days ago", status: "Draft", count: "-" },
                            ].map((row, i) => (
                                <div key={i} className="p-3 px-4 flex items-center gap-4 hover:bg-muted/5 transition-colors">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{row.name}</div>
                                        <div className="text-xs text-muted-foreground">{row.date}</div>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <div className={`text-xs px-2 py-0.5 rounded-full w-fit ml-auto flex items-center gap-1.5 ${row.status === 'Sending' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                            row.status === 'Sent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                            }`}>
                                            {row.status === 'Sending' && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />}
                                            {row.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {/* Animated New Row Simulation */}
                            <div className="p-3 px-4 flex items-center gap-4 bg-primary/5 animate-in slide-in-from-left duration-700 delay-1000 opacity-0 fill-mode-forwards" style={{ animationFillMode: 'forwards' }}>
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <Settings className="w-4 h-4 animate-spin-slow" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate text-primary">Automated System Check</div>
                                    <div className="text-xs text-muted-foreground">Running verification...</div>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <div className="text-xs px-2 py-0.5 rounded-full w-fit ml-auto bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                                        Running
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay Gradient for polish */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
        </div>
    );
}
