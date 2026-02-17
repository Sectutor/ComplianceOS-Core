
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
            <div className="flex flex-col min-h-screen">
                <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b md:pl-20 px-4 py-4">
                    <nav className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const active = location === tab.path;
                            return (
                                <Link
                                    key={tab.path}
                                    href={tab.path}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-300 font-bold text-sm shadow-sm",
                                        active
                                            ? "bg-[#3ABEF9] text-white scale-105 shadow-sky-100"
                                            : "bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] hover:scale-105"
                                    )}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex-1 w-full pl-4 pr-4 py-8 md:pl-20 md:pr-8 bg-slate-50/10">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-full">
                        {children}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
