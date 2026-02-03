
import { PropsWithChildren } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ShieldCheck, Activity, BarChart3, FileText, Lock, AlertTriangle } from "lucide-react";
import { useClientContext } from "@/contexts/ClientContext";

export default function CyberLayout({ children }: PropsWithChildren) {
    const [location] = useLocation();
    const { selectedClientId } = useClientContext();

    const tabs = [
        { name: "Overview", path: `/clients/${selectedClientId}/cyber`, icon: BarChart3 },
        { name: "NIS2 Assessment", path: `/clients/${selectedClientId}/cyber/assessment`, icon: ShieldCheck },
        { name: "Risk Management", path: `/clients/${selectedClientId}/risks/dashboard`, icon: AlertTriangle },
        { name: "Business Continuity", path: `/clients/${selectedClientId}/business-continuity`, icon: Activity },
        { name: "Supply Chain", path: `/clients/${selectedClientId}/vendors/overview`, icon: Lock },
        { name: "Incident Reporting", path: `/clients/${selectedClientId}/cyber/incidents`, icon: Activity }, // Keep local for now
        { name: "Documentation", path: `/clients/${selectedClientId}/cyber/documents`, icon: FileText },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="border-b">
                    <div className="flex h-16 items-center px-4 md:px-8">
                        <nav className="flex items-center space-x-4 lg:space-x-6">
                            {tabs.map((tab) => (
                                <Link key={tab.path} href={tab.path} className={cn(
                                    "flex items-center text-sm font-medium transition-colors hover:text-primary",
                                    location === tab.path
                                        ? "text-primary border-b-2 border-primary pb-5 mt-5"
                                        : "text-muted-foreground pb-5 mt-5 border-b-2 border-transparent"
                                )}>
                                    <tab.icon className="mr-2 h-4 w-4" />
                                    {tab.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
                <div className="px-4 md:px-8 pb-8">
                    {children}
                </div>
            </div>
        </DashboardLayout>
    );
}
