import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ClipboardList,
    ShieldCheck,
    AlertTriangle,
    FileText,
    Activity,
    Users,
    Key,
    Database,
    Home,
    ChevronRight
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@complianceos/ui/ui/breadcrumb";

interface ISOLayoutProps {
    clientId: number;
    children: React.ReactNode;
    fullWidth?: boolean;
}

export function ISOLayout({ clientId, children, fullWidth = false }: ISOLayoutProps) {
    const [location] = useLocation();

    const navItems = [
        {
            label: "Dashboard",
            href: `/clients/${clientId}/iso27001`,
            icon: LayoutDashboard,
        },
        {
            label: "SoA",
            href: `/clients/${clientId}/iso27001/soa`,
            icon: ClipboardList,
        },
        {
            label: "Risk Register",
            href: `/clients/${clientId}/iso27001/risks`,
            icon: ShieldCheck,
        },
        {
            label: "Assets",
            href: `/clients/${clientId}/iso27001/assets`,
            icon: Database,
        },
        {
            label: "Documents",
            href: `/clients/${clientId}/iso27001/documents`,
            icon: FileText,
        },
        {
            label: "Governance",
            href: `/clients/${clientId}/iso27001/governance`,
            icon: Users,
        },
        {
            label: "Mgmt Review",
            href: `/clients/${clientId}/iso27001/management-review`,
            icon: ClipboardList,
        }
    ];

    const { data: client } = trpc.clients.get.useQuery({ id: clientId }, { enabled: clientId > 0 });

    const isActive = (href: string) => {
        if (location === href) return true;
        if (href !== `/clients/${clientId}/iso27001` && location.startsWith(href)) return true;
        return false;
    };

    const activeItem = navItems.find(item => isActive(item.href));

    const breadcrumbItems = [
        { label: "Dashboard", href: "/dashboard", icon: Home },
        { label: "Clients", href: "/clients" },
        { label: client?.name || "Client", href: `/clients/${clientId}` },
        { label: "ISO 27001", href: `/clients/${clientId}/iso27001` }
    ];

    if (activeItem && activeItem.label !== "Dashboard") {
        breadcrumbItems.push({ label: activeItem.label, href: activeItem.href });
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col min-h-screen bg-slate-50/50">
                <div className="bg-white border-b border-slate-200 pl-4 pr-4 py-3 md:pl-20 md:pr-8 sticky top-0 z-30 shadow-sm space-y-3">
                    {/* Breadcrumb Section */}
                    <Breadcrumb className="mb-0">
                        <BreadcrumbList>
                            {breadcrumbItems.map((item, idx) => {
                                const isLast = idx === breadcrumbItems.length - 1;
                                return (
                                    <React.Fragment key={idx}>
                                        <BreadcrumbItem>
                                            {isLast ? (
                                                <BreadcrumbPage className="font-bold text-[#1C4D8D]">
                                                    {item.label}
                                                </BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink asChild>
                                                    <Link href={item.href || "#"} className="flex items-center gap-1.5 hover:text-[#3ABEF9] transition-colors">
                                                        {item.icon && <item.icon className="h-3.5 w-3.5" />}
                                                        {item.label}
                                                    </Link>
                                                </BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                        {!isLast && (
                                            <BreadcrumbSeparator>
                                                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                                            </BreadcrumbSeparator>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </BreadcrumbList>
                    </Breadcrumb>

                    <nav className="flex space-x-2 overflow-x-auto no-scrollbar py-1" aria-label="ISO 27001 Navigation">
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center whitespace-nowrap px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer shadow-sm border",
                                        active
                                            ? "bg-[#3ABEF9] text-white border-[#3ABEF9]"
                                            : "bg-[#1C4D8D] text-white border-[#1C4D8D] hover:bg-[#3ABEF9] hover:border-[#3ABEF9]"
                                    )}
                                >
                                    <item.icon className="mr-2.5 h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className={cn(
                    "flex-1 w-full py-8",
                    fullWidth ? "px-0 md:pl-20" : "pl-4 pr-4 md:pl-20 md:pr-8"
                )}>
                    {children}
                </div>
            </div>
        </DashboardLayout>
    );
}
