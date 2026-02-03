import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@complianceos/ui/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@complianceos/ui/ui/dropdown-menu";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
    useSidebar,
    SidebarInset,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@complianceos/ui/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
    Shield, LogOut, PanelLeft, Users, FileText, CreditCard, Variable,
    CloudCog, Bug, Settings, History, LayoutDashboard, Building2, Contact2
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from '../DashboardLayoutSkeleton';
import { Button } from "@complianceos/ui/ui/button";

const adminMenuItems = [
    { icon: Building2, label: "Organizations", path: "/admin/organizations" },
    { icon: Users, label: "User Management", path: "/admin/user-management" },
    { icon: FileText, label: "Invitations", path: "/admin/invitations" },
    { icon: History, label: "Audit Logs", path: "/admin/audit" },
    { icon: Variable, label: "LLM Settings", path: "/admin/llm" },
    // { icon: CloudCog, label: "Cloud Integrations", path: "/admin/cloud" },
    { icon: Bug, label: "Issue Trackers", path: "/admin/issue-tracker" },
    { icon: CreditCard, label: "Billing", path: "/admin/billing" },
    { icon: Users, label: "Waitlist", path: "/sales/waitlist" },
    { icon: Contact2, label: "Global CRM", path: "/admin/crm" },
];

const SIDEBAR_WIDTH_KEY = "admin-sidebar-width";
const DEFAULT_WIDTH = 250;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
        return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
    });
    const { loading, user } = useAuth();

    useEffect(() => {
        localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
    }, [sidebarWidth]);

    if (loading) {
        return <DashboardLayoutSkeleton />
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
                    <Shield className="h-16 w-16 text-primary" />
                    <h1 className="text-2xl font-semibold tracking-tight text-center">
                        Sign in to Compliance OS
                    </h1>
                    <Button onClick={() => window.location.href = getLoginUrl()}>
                        Sign in
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <SidebarProvider
            defaultOpen={true}
            style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
        >
            <AdminLayoutContent setSidebarWidth={setSidebarWidth}>
                {children}
            </AdminLayoutContent>
        </SidebarProvider>
    );
}

function AdminLayoutContent({
    children,
    setSidebarWidth,
}: {
    children: React.ReactNode;
    setSidebarWidth: (width: number) => void;
}) {
    const { user, signOut } = useAuth();
    const [location, setLocation] = useLocation();
    const { state, toggleSidebar } = useSidebar();
    const isCollapsed = state === "collapsed";
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();

    useEffect(() => {
        if (isCollapsed) setIsResizing(false);
    }, [isCollapsed]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
            const newWidth = e.clientX - sidebarLeft;
            if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
                setSidebarWidth(newWidth);
            }
        };
        const handleMouseUp = () => setIsResizing(false);
        if (isResizing) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        }
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
    }, [isResizing, setSidebarWidth]);

    return (
        <>
            <div className="relative" ref={sidebarRef}>
                <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
                    <SidebarHeader className="h-16 justify-center">
                        <div className="flex items-center gap-3 px-2 transition-all w-full">
                            <button
                                onClick={toggleSidebar}
                                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors"
                            >
                                <PanelLeft className="h-4 w-4 text-muted-foreground" />
                            </button>
                            {!isCollapsed && (
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-semibold tracking-tight truncate">Admin Console</span>
                                </div>
                            )}
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel>Platform</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton onClick={() => setLocation('/dashboard')} tooltip="Back to App">
                                            <LayoutDashboard className="h-4 w-4" />
                                            <span>Back to Dashboard</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <SidebarGroup>
                            <SidebarGroupLabel>Configuration</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {adminMenuItems.map((item) => (
                                        <SidebarMenuItem key={item.path}>
                                            <SidebarMenuButton
                                                isActive={location === item.path}
                                                onClick={() => setLocation(item.path)}
                                                tooltip={item.label}
                                            >
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.label}</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter className="p-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center">
                                    <Avatar className="h-9 w-9 border shrink-0">
                                        <AvatarFallback className="text-xs font-medium">
                                            {user?.email?.charAt(0).toUpperCase() || "A"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                                        <p className="text-sm font-medium truncate leading-none">
                                            {user?.email || "Admin"}
                                        </p>
                                    </div>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={async () => {
                                    await signOut();
                                    window.location.href = getLoginUrl();
                                }} className="text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sign out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarFooter>
                </Sidebar>
                <div
                    className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
                    onMouseDown={() => {
                        if (isCollapsed) return;
                        setIsResizing(true);
                    }}
                    style={{ zIndex: 50 }}
                />
            </div>

            <SidebarInset>
                <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
                    {isMobile && <SidebarTrigger />}
                    <div className="font-semibold">Administration</div>
                </header>
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </SidebarInset>
        </>
    );
}
