import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, ChevronRight, Globe, Search, ShieldAlert, Users, Target, Layers, ScrollText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@complianceos/ui/ui/breadcrumb";

interface TPRMLayoutProps {
    clientId: number;
    children: React.ReactNode;
}

export function TPRMLayout({ clientId, children }: TPRMLayoutProps) {
    const [location] = useLocation();
    const params = useParams<{ vendorId: string }>();
    const vendorId = params.vendorId ? parseInt(params.vendorId) : null;

    const { data: stats } = trpc.vendors.getStats.useQuery({ clientId }, { enabled: !!clientId && !isNaN(clientId) });
    const { data: client } = trpc.clients.get.useQuery({ id: clientId }, { enabled: !!clientId });
    const { data: vendor } = trpc.vendors.get.useQuery({ id: vendorId! }, { enabled: !!vendorId && !isNaN(vendorId) });

    const navItems = [
        {
            label: "Overview",
            href: `/clients/${clientId}/vendors/overview`,
            icon: Globe,
            badge: null
        },
        {
            label: "Discovery",
            href: `/clients/${clientId}/vendors/discovery`,
            icon: Search,
            badge: stats?.needsReview || 0
        },

        {
            label: "All vendors",
            href: `/clients/${clientId}/vendors/all`,
            icon: Users,
            badge: stats?.totalVendors || 0
        },
        {
            label: "Subprocessors",
            href: `/clients/${clientId}/evaluations/subprocessors`,
            icon: Layers,
            badge: null
        },
        {
            label: "Assessment Templates",
            href: `/clients/${clientId}/vendors/templates`,
            icon: Target,
            badge: null
        },
        {
            label: "DPA Templates",
            href: `/clients/${clientId}/vendors/dpa-templates`,
            icon: ScrollText,
            badge: null
        },
        {
            label: "Vendor Catalog",
            href: `/clients/${clientId}/vendors/catalog`,
            icon: Globe,
            badge: null
        },
        {
            label: "Assessment Projects",
            href: `/clients/${clientId}/vendors/reviews`,
            icon: ShieldAlert,
            badge: stats?.inProgress || 0
        }
    ];

    const isActive = (href: string) => location.includes(href);
    const breadcrumbItems = [
        { label: "Dashboard", href: "/dashboard", icon: Home },
        { label: "Clients", href: "/clients" },
        { label: client?.name || "Client", href: `/clients/${clientId}` },
        { label: "Vendors", href: `/clients/${clientId}/vendors/overview` }
    ];

    if (vendor) {
        breadcrumbItems.push({ label: vendor.name, href: `/clients/${clientId}/vendors/${vendorId}` });
    } else {
        const activeItem = navItems.find(item => isActive(item.href) && item.label !== "Overview");
        if (activeItem) {
            breadcrumbItems.push({ label: activeItem.label, href: activeItem.href });
        }
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col min-h-screen bg-slate-50/50">
                <div className="bg-white border-b border-slate-200 pl-4 pr-4 py-3 md:pl-20 md:pr-8 sticky top-0 z-30 shadow-sm space-y-3">
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

                    <nav className="flex space-x-2 overflow-x-auto no-scrollbar py-1" aria-label="TPRM Navigation">
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
                                    {!!item.badge && (
                                        <span className={cn(
                                            "ml-2.5 rounded-full py-0.5 px-2 text-[10px] font-bold border backdrop-blur-md",
                                            active
                                                ? "bg-white/20 text-white border-white/30"
                                                : "bg-[#3ABEF9]/20 text-white border-[#3ABEF9]/30"
                                        )}>
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex-1 w-full pl-4 pr-4 py-8 md:pl-20 md:pr-8">
                    {children}
                </div>
            </div>
        </DashboardLayout>
    );
}
