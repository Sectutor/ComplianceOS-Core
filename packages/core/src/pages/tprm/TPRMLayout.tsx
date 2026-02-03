import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Globe, Search, ShieldAlert, Users, Target, Layers, ScrollText } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface TPRMLayoutProps {
    clientId: number;
    children: React.ReactNode;
}

export function TPRMLayout({ clientId, children }: TPRMLayoutProps) {
    const [location] = useLocation();
    const { data: stats } = trpc.vendors.getStats.useQuery({ clientId }, { enabled: !!clientId && !isNaN(clientId) });

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
            label: "Security reviews",
            href: `/clients/${clientId}/vendors/reviews`,
            icon: ShieldAlert,
            badge: stats?.inProgress || 0 // Or "Overdue" count? Screenshot says 100 which matches "Security reviews" count potentially. Let's use inProgress for now or total active reviews.
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
            icon: Globe, // Or another icon like Book, Database
            badge: null
        }
    ];

    const isActive = (href: string) => location.includes(href);

    return (
        <DashboardLayout>
            <div className="flex flex-col min-h-screen">
                <div className="border-b bg-white px-6">
                    <nav className="flex space-x-6 overflow-x-auto" aria-label="Tabs">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors hover:text-slate-700",
                                    isActive(item.href)
                                        ? "border-purple-600 text-purple-600"
                                        : "border-transparent text-slate-500 hover:border-slate-300"
                                )}
                            >
                                <item.icon className={cn(
                                    "mr-2 h-4 w-4",
                                    isActive(item.href) ? "text-purple-600" : "text-slate-400 group-hover:text-slate-500"
                                )} />
                                {item.label}
                                {!!item.badge && (
                                    <span className={cn(
                                        "ml-2 rounded-full py-0.5 px-2 text-xs font-medium",
                                        isActive(item.href) ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-600"
                                    )}>
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex-1 bg-slate-50/50">
                    {children}
                </div>
            </div>
        </DashboardLayout>
    );
}
