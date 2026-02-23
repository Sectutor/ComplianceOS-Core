import React, { PropsWithChildren, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Link, useLocation, useParams } from "wouter";
import { cn } from "@/lib/utils";
import { useClientContext } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import {
    ShieldCheck,
    BarChart3,
    FileText,
    Target,
    ListTodo,
    Activity,
    LayoutDashboard,
    LayoutGrid,
    Lock,
    Settings,
    ClipboardList,
    Eye,
    Zap,
    ChevronRight,
    Search,
    Play
} from "lucide-react";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import { Plus, Server } from "lucide-react";
import { useNistSystemId } from "./useNistSystem";

type NISTStandard = 'csf' | 'rmf' | '800-30' | '800-53' | 'hub';

interface NISTEcosystemLayoutProps extends PropsWithChildren {
    standard: NISTStandard;
    fullWidth?: boolean;
    activeTab?: string;
}

export default function NISTEcosystemLayout({
    children,
    standard,
    fullWidth = false,
}: NISTEcosystemLayoutProps) {
    const [location, setLocation] = useLocation();
    const { selectedClientId } = useClientContext();
    const { id } = useParams<{ id: string }>();
    const clientId = selectedClientId || parseInt(id || "0");

    // Top-level actionable centers in the ecosystem
    const ecosystemStandards = [
        { id: 'hub', name: "Ecosystem Hub", path: `/clients/${clientId}/nist`, icon: LayoutGrid, color: "text-slate-600" },
        { id: 'csf', name: "Command Center", path: `/clients/${clientId}/nist/dashboard`, icon: ShieldCheck, color: "text-blue-600" },
        { id: 'rmf', name: "Systems & Scoping", path: `/clients/${clientId}/nist/rmf`, icon: Activity, color: "text-emerald-600" },
        { id: '800-30', name: "Risk Assessment", path: `/clients/${clientId}/nist/800-30`, icon: Target, color: "text-amber-600" },
        { id: '800-53', name: "Control Center", path: `/clients/${clientId}/nist/800-53`, icon: Lock, color: "text-indigo-600" },
    ];

    const systemId = useNistSystemId();

    const { data: systems, isLoading } = trpc.federal.listFismaSystems.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const handleSystemChange = (id: string) => {
        const params = new URLSearchParams(window.location.search);
        params.set('systemId', id);
        setLocation(`${window.location.pathname}?${params.toString()}`);
        // Manually dispatch popstate so useNistSystemId realizes the search changed
        window.dispatchEvent(new Event('popstate'));
    };

    // Standard-specific tabs
    const subTabs = useMemo(() => {
        const query = systemId ? `?systemId=${systemId}` : "";
        switch (standard) {
            case 'csf':
                return [
                    { name: "Dashboard", path: `/clients/${clientId}/nist/dashboard${query}`, icon: LayoutDashboard },
                    { name: "Assessment", path: `/clients/${clientId}/nist/assessment${query}`, icon: ClipboardList },
                    { name: "Profiles", path: `/clients/${clientId}/nist/profiles${query}`, icon: Target },
                    { name: "POAM", path: `/clients/${clientId}/nist/poam${query}`, icon: ListTodo },
                    { name: "Documents", path: `/clients/${clientId}/nist/documents${query}`, icon: FileText },
                ];
            case 'rmf':
                return [
                    { name: "System Posture", path: `/clients/${clientId}/nist/rmf${query}`, icon: LayoutDashboard },
                    { name: "Compliance Journey", path: `/clients/${clientId}/nist/rmf/prepare${query}`, icon: Play },
                    { name: "Evidence & Artifacts", path: `/clients/${clientId}/nist/rmf/artifacts${query}`, icon: FileText },
                ];
            case '800-30':
                return [
                    { name: "Risk Assessment", path: `/clients/${clientId}/nist/800-30${query}`, icon: Target },
                    { name: "Threat Modeling", path: `/clients/${clientId}/nist/800-30/threats${query}`, icon: ShieldCheck },
                    { name: "Impact Analysis", path: `/clients/${clientId}/nist/800-30/impact${query}`, icon: BarChart3 },
                ];
            case '800-53':
                return [
                    { name: "Control Catalog", path: `/clients/${clientId}/nist/800-53${query}`, icon: Lock },
                    { name: "Baselines", path: `/clients/${clientId}/nist/800-53/baselines${query}`, icon: LayoutGrid },
                    { name: "Inheritance", path: `/clients/${clientId}/nist/800-53/inheritance${query}`, icon: Settings },
                    { name: "Assessments", path: `/clients/${clientId}/nist/800-53/assessments${query}`, icon: ClipboardList },
                    { name: "Monitoring", path: `/clients/${clientId}/nist/800-53/monitoring${query}`, icon: Activity },
                ];
        }
    }, [standard, clientId, systemId]);

    const fetchedSystems = systems || [];
    const currentSystem = systemId ? fetchedSystems.find((s: any) => s.id.toString() === systemId) || fetchedSystems[0] : fetchedSystems[0];

    const activeStandard = ecosystemStandards.find(s => s.id === standard);

    return (
        <DashboardLayout>
            <div className="-mt-8 -mb-8 -mx-4 md:-ml-20 md:-mr-8 flex flex-col min-h-screen">


                {/* System Selection Context Bar (Specifically for RMF/800-30) */}
                {(standard === 'rmf' || standard === '800-30') && (
                    <div className="bg-slate-50 border-b border-slate-200 px-4 md:px-8 py-4">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                    <Server className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1">Active RMF System Context</p>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900">{currentSystem?.name || 'No System Selected'}</span>
                                        {currentSystem?.fips199Overall && (
                                            <Badge variant="outline" className={cn(
                                                "text-[9px] uppercase font-black tracking-widest px-2 py-0 h-4",
                                                currentSystem.fips199Overall === "High" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                                    currentSystem.fips199Overall === "Moderate" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                        "bg-indigo-50 text-indigo-700 border-indigo-200"
                                            )}>
                                                FISMA {currentSystem.fips199Overall}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <p className="text-[10px] font-bold text-slate-400 hidden xl:block text-right max-w-[150px] uppercase tracking-tighter">
                                    Global System Focus
                                </p>
                                <Select value={systemId?.toString() || undefined} onValueChange={handleSystemChange}>
                                    <SelectTrigger className="w-full md:w-[240px] h-10 bg-white border-slate-200 font-bold text-sm">
                                        <SelectValue placeholder="Select System..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {isLoading ? (
                                            <SelectItem value="loading" disabled>Loading systems...</SelectItem>
                                        ) : fetchedSystems.length === 0 ? (
                                            <SelectItem value="none" disabled>No systems registered</SelectItem>
                                        ) : (
                                            fetchedSystems.map((s: any) => (
                                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <Link href={`/clients/${clientId}/nist/rmf/systems`}>
                                    <Button size="icon" className="h-10 w-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200" title="Register New System">
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                <div key={systemId} className={cn("flex-1", fullWidth ? "py-4" : "pl-4 pr-4 md:pl-20 md:pr-8 py-8")}>
                    {children}
                </div>
            </div>
        </DashboardLayout>
    );
}

