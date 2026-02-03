import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Database,
    FileText,
    Scale,
    Globe,
    AlertTriangle,
    ShieldCheck
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface PrivacyLayoutProps {
    clientId: number;
    children: React.ReactNode;
}

export function PrivacyLayout({ clientId, children }: PrivacyLayoutProps) {
    const [location] = useLocation();

    // We could fetch privacy stats here for badges if needed
    // const { data: stats } = trpc.privacy.getPrivacyStats.useQuery({ clientId });

    const navItems = [
        {
            label: "Overview",
            href: `/clients/${clientId}/privacy/overview`,
            icon: ShieldCheck,
            badge: null
        },
        {
            label: "Dashboard",
            href: `/clients/${clientId}/privacy`,
            icon: LayoutDashboard,
            badge: null
        },
        {
            label: "ROPA",
            href: `/clients/${clientId}/privacy/ropa`,
            icon: FileText,
            badge: null
        },
        {
            label: "Data Inventory",
            href: `/clients/${clientId}/privacy/inventory`,
            icon: Database,
            badge: null
        },
        {
            label: "DPIA",
            href: `/clients/${clientId}/privacy/dpia`,
            icon: Scale,
            badge: null
        },
        {
            label: "Transfers",
            href: `/clients/${clientId}/privacy/transfers`,
            icon: Globe,
            badge: null
        },
        {
            label: "Documents",
            href: `/clients/${clientId}/privacy/documents`,
            icon: FileText,
            badge: null
        },
        {
            label: "Breaches",
            href: `/clients/${clientId}/privacy/breaches`,
            icon: AlertTriangle,
            badge: null
        }
    ];

    const isActive = (href: string) => {
        if (href.endsWith('/privacy') && location === href) return true;
        if (!href.endsWith('/privacy') && location.startsWith(href)) return true;
        return false;
    };

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
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-slate-500 hover:border-slate-300"
                                )}
                            >
                                <item.icon className={cn(
                                    "mr-2 h-4 w-4",
                                    isActive(item.href) ? "text-blue-600" : "text-slate-400 group-hover:text-slate-500"
                                )} />
                                {item.label}
                                {!!item.badge && (
                                    <span className={cn(
                                        "ml-2 rounded-full py-0.5 px-2 text-xs font-medium",
                                        isActive(item.href) ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
                                    )}>
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </DashboardLayout>
    );
}
