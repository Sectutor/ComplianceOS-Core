import React, { PropsWithChildren, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Link, useLocation, useParams } from "wouter";
import { cn } from "@/lib/utils";
import { useClientContext } from "@/contexts/ClientContext";
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
import { RMF_SYSTEMS } from "./nistConstants";
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

    // Top-level standards in the ecosystem
    const ecosystemStandards = [
        { id: 'hub', name: "Ecosystem Hub", path: `/clients/${clientId}/nist`, icon: LayoutGrid, color: "text-slate-600" },
        { id: 'csf', name: "CSF 2.0", path: `/clients/${clientId}/nist/dashboard`, icon: ShieldCheck, color: "text-blue-600" },
        { id: 'rmf', name: "RMF (800-37)", path: `/clients/${clientId}/nist/rmf`, icon: Activity, color: "text-emerald-600" },
        { id: '800-30', name: "Risk (800-30)", path: `/clients/${clientId}/nist/800-30`, icon: Target, color: "text-amber-600" },
        { id: '800-53', name: "Controls (800-53)", path: `/clients/${clientId}/nist/800-53`, icon: Lock, color: "text-indigo-600" },
    ];

    const systemId = useNistSystemId();

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
                    { name: "Dashboard", path: `/clients/${clientId}/nist/rmf${query}`, icon: LayoutDashboard },
                    { name: "0. Prepare", path: `/clients/${clientId}/nist/rmf/prepare${query}`, icon: Play },
                    { name: "1. Categorize", path: `/clients/${clientId}/nist/rmf/categorize${query}`, icon: Settings },
                    { name: "2. Select", path: `/clients/${clientId}/nist/rmf/select${query}`, icon: ShieldCheck },
                    { name: "3. Implement", path: `/clients/${clientId}/nist/rmf/implement${query}`, icon: Lock },
                    { name: "4. Assess", path: `/clients/${clientId}/nist/rmf/assess${query}`, icon: ClipboardList },
                    { name: "5. Authorize", path: `/clients/${clientId}/nist/rmf/authorize${query}`, icon: FileText },
                    { name: "6. Monitor", path: `/clients/${clientId}/nist/rmf/monitor${query}`, icon: Eye },
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
            default:
                return [];
        }
    }, [standard, clientId, systemId]);


    const currentSystem = systemId ? RMF_SYSTEMS.find(s => s.id === systemId) || RMF_SYSTEMS[0] : RMF_SYSTEMS[0];

    const activeStandard = ecosystemStandards.find(s => s.id === standard);

    return (
        <DashboardLayout>
            <div className={cn("flex flex-col min-h-screen", fullWidth && "-m-6")}>
                {/* Secondary Ecosystem Navigation */}
                <div className="border-b bg-slate-50/80 backdrop-blur-md sticky top-0 z-20 px-4 md:px-8">
                    <div className="flex h-14 items-center gap-6 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2 border-r pr-6 mr-2">
                            <div className="bg-primary/10 p-1.5 rounded-lg">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-sm font-black tracking-tighter uppercase whitespace-nowrap">NIST Ecosystem</span>
                        </div>
                        <nav className="flex items-center space-x-1">
                            {ecosystemStandards.map((item) => {
                                const isActive = standard === item.id;
                                return (
                                    <Link key={item.id} href={item.path}>
                                        <span className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                                            isActive
                                                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                                        )}>
                                            <item.icon className={cn("w-3.5 h-3.5", isActive ? item.color : "text-slate-400")} />
                                            {item.name}
                                            {isActive && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1 animate-pulse" />
                                            )}
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="ml-auto flex items-center gap-3">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[9px] uppercase tracking-widest px-3">
                                <Zap className="w-2.5 h-2.5 mr-1.5 fill-emerald-700" />
                                Connected Mode
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Standard-Specific Tab Navigation */}
                {subTabs.length > 0 && (
                    <div className="border-b bg-background sticky top-14 z-10 px-4 md:px-8">
                        <div className="flex h-14 items-center">
                            <nav className="flex items-center space-x-6 lg:space-x-8 overflow-x-auto no-scrollbar">
                                {subTabs.map((tab) => {
                                    // Robust check for active tab including systemId
                                    const tabUrl = new URL(tab.path, window.location.origin);
                                    const isPathMatch = location === tabUrl.pathname || (tabUrl.pathname !== `/clients/${clientId}/nist` && location.startsWith(tabUrl.pathname));
                                    const isSystemMatch = tabUrl.searchParams.get('systemId') === systemId;
                                    const isActive = isPathMatch;

                                    return (
                                        <Link key={tab.path} href={tab.path}>
                                            <span className={cn(
                                                "flex items-center text-xs font-bold transition-colors hover:text-primary whitespace-nowrap py-5 border-b-2 cursor-pointer uppercase tracking-wider",
                                                isActive
                                                    ? "text-primary border-primary"
                                                    : "text-slate-400 border-transparent hover:border-slate-200"
                                            )}>
                                                <tab.icon className="mr-2 h-4 w-4" />
                                                {tab.name}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            {standard !== 'hub' && (
                                <div className="ml-auto flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Standard Context:</span>
                                    <Badge className={cn("font-black uppercase text-[10px] tracking-widest",
                                        standard === 'csf' ? "bg-blue-600" :
                                            standard === 'rmf' ? "bg-emerald-600" :
                                                standard === '800-30' ? "bg-amber-600" :
                                                    "bg-indigo-600"
                                    )}>
                                        {activeStandard?.name}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* System Selection Context Bar (Specifically for RMF/800-30) */}
                {(standard === 'rmf' || standard === '800-30') && (
                    <div className="bg-slate-50 border-b border-slate-200 px-4 md:px-8 py-4">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                    <Server className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1">Active RMF System Context</p>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900">{currentSystem.name}</span>
                                        <Badge variant="outline" className={cn(
                                            "text-[9px] uppercase font-black tracking-widest px-2 py-0 h-4",
                                            currentSystem.impact === "High" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                                currentSystem.impact === "Moderate" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                    "bg-indigo-50 text-indigo-700 border-indigo-200"
                                        )}>
                                            FISMA {currentSystem.impact}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <p className="text-[10px] font-bold text-slate-400 hidden xl:block text-right max-w-[150px] uppercase tracking-tighter">
                                    Global System Focus
                                </p>
                                <Select value={systemId} onValueChange={handleSystemChange}>
                                    <SelectTrigger className="w-full md:w-[240px] h-10 bg-white border-slate-200 font-bold text-sm">
                                        <SelectValue placeholder="Select System..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {RMF_SYSTEMS.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
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

                <div key={systemId} className="flex-1 pl-4 pr-4 md:pl-20 md:pr-8 py-8">
                    {fullWidth ? <div className="-m-8">{children}</div> : children}
                </div>
            </div>
        </DashboardLayout>
    );
}

