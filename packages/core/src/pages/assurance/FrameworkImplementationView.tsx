
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    Shield, BookOpen, CheckCircle2, ListChecks, ArrowRight, Info, ExternalLink, Activity, Clock, AlertCircle, Sparkles, X, Loader2,
    Database, ShieldAlert, AlertTriangle, Lock, Target, Zap, Activity as ActivityIcon, Share2, Users, Layers, ClipboardList, Search, FileText, Settings, Layout, Key, UserCheck, Globe, HardDrive, Smartphone, Cloud, ShieldCheck, Eye
} from "lucide-react";
import { useParams, useLocation } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { TECHNICAL_STANDARD_CONTENT } from "./StandardPractices";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@complianceos/ui/ui/dialog";
import { Label } from "@complianceos/ui/ui/label";
import ReactMarkdown from 'react-markdown';
import { PageGuide } from "@/components/PageGuide";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, any> = {
    // ISO 27001
    "ISO-MS": ClipboardList,
    "ISO-A.5": Users,
    "ISO-A.6": UserCheck,
    "ISO-A.7": Shield,
    "ISO-A.8": Settings,
    "A.5": Users,
    "A.8": HardDrive,

    // NIST/General
    "GV": Shield,
    "ID": Target,
    "PR": Lock,
    "DE": Eye,
    "RS": Zap,
    "RC": ActivityIcon,

    // SCVS
    "SCVS-V1": Layers,
    "SCVS-V2": Share2,

    // ASVS
    "ASVS-V1": Layout,
    "ASVS-V2": Key,
    "ASVS-V3": ShieldCheck,
    "ASVS-V4": Lock,

    // MASVS
    "MASVS-V1": Smartphone,
    "MASVS-V2": Database,

    // OPENSSF
    "OPENSSF-OSPS": Globe,

    // CCM
    "CCM-V1": Cloud,
};

const categoryColors: Record<string, string> = {
    // ISO 27001
    "ISO-MS": "#3ABEF9",
    "ISO-A.5": "#A78BFA",
    "ISO-A.8": "#60A5FA",
    "A.5": "#A78BFA",
    "A.8": "#60A5FA",

    // NIST
    "GV": "#3ABEF9",
    "ID": "#60A5FA",
    "PR": "#A78BFA",
    "DE": "#FBBF24",
    "RS": "#F87171",
    "RC": "#34D399",

    // SCVS
    "SCVS-V1": "#3ABEF9",
    "SCVS-V2": "#FBBF24",

    // ASVS
    "ASVS-V1": "#3ABEF9",
    "ASVS-V2": "#60A5FA",
    "ASVS-V3": "#A78BFA",
    "ASVS-V4": "#FBBF24",

    // MASVS
    "MASVS-V1": "#FB7185",
    "MASVS-V2": "#3ABEF9",

    // OPENSSF
    "OPENSSF-OSPS": "#2DD4BF",

    // CCM
    "CCM-V1": "#818CF8",
};

const getCategoryMeta = (cat: string, frameworkId?: string) => {
    const normalizedFID = frameworkId?.toUpperCase() || "";

    // Try to find a code like A.5 or V1
    const isoMatch = cat.match(/A\.\d+/);
    const vMatch = cat.match(/V\d+/);

    const key = isoMatch ? isoMatch[0] : (vMatch ? `${normalizedFID}-${vMatch[0]}` : cat);

    return {
        color: categoryColors[key] || categoryColors[cat] || "#0f172a",
        icon: categoryIcons[key] || categoryIcons[cat] || Shield
    };
};

const FrameworkImplementationView: React.FC = () => {
    const { id: clientId, frameworkId } = useParams<{ id: string, frameworkId: string }>();
    const [, setLocation] = useLocation();
    const [selectedPractice, setSelectedPractice] = useState<string | null>(null);

    // AI Guidance State
    const [guidanceControl, setGuidanceControl] = useState<any | null>(null);
    const [guidanceContent, setGuidanceContent] = useState<string>("");

    const getGuidanceMutation = trpc.advisor.getImplementationGuidance.useMutation({
        onSuccess: (data: any) => {
            setGuidanceContent(data.guidance);
        },
        onError: (err: any) => {
            toast.error("Failed to generate guidance");
            console.error(err);
        }
    });

    const handleOpenGuidance = (control: any) => {
        setGuidanceControl(control);
        setGuidanceContent(""); // Clear previous
        getGuidanceMutation.mutate({
            clientId: Number(clientId),
            controlId: control.controlId,
            controlTitle: control.name,
            controlDescription: control.description
        });
    };

    // 1. Fetch live work data for this framework
    const { data: workData, isLoading, refetch } = trpc.frameworks.getWorkProcessData.useQuery({
        clientId: Number(clientId),
        frameworkId: frameworkId || ""
    });

    const updateStatus = trpc.clientControls.update.useMutation({
        onSuccess: () => {
            toast.success("Control status updated");
            refetch();
        }
    });

    // 2. Group controls by category
    const groupedControls = React.useMemo(() => {
        if (!workData || !Array.isArray(workData)) return {};
        return workData.reduce((acc: any, curr: any) => {
            const cat = curr?.category || "General";
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(curr);
            return acc;
        }, {});
    }, [workData]);

    const categories = Object.keys(groupedControls);
    const activeCategory = selectedPractice || (categories.length > 0 ? categories[0] : null);
    const activeControls = activeCategory ? (groupedControls[activeCategory] || []) : [];

    // 3. Find Strategic Overlay from StandardPractices.ts
    const getStrategicOverlay = (category: string | undefined) => {
        if (!category) return null;
        const normalizedFID = frameworkId?.toUpperCase() || "";
        const overlays = TECHNICAL_STANDARD_CONTENT[normalizedFID] || [];

        // 1. Try V-pattern (legacy/NIST)
        const match = category.match(/V(\d+):/);
        if (match) {
            const version = match[1];
            const vMatch = overlays.find(o => o.id.includes(`-V${version}`));
            if (vMatch) return vMatch;
        }

        // 2. Try Name Match (ISO and new frameworks)
        // Check if category name is contained within or contains the overlay name
        const nameMatch = overlays.find(o =>
            category.toLowerCase().includes(o.name.toLowerCase().split('(')[0].trim()) ||
            o.name.toLowerCase().includes(category.toLowerCase())
        );

        return nameMatch || null;
    };


    const overlay = getStrategicOverlay(activeCategory ?? undefined);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="p-8 flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <Activity className="w-12 h-12 text-[#0284c7] animate-pulse" />
                        <p className="text-slate-400 font-bold animate-pulse">Loading Implementation Data...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <Breadcrumb
                    items={[
                        { label: "Assurance", href: `/clients/${clientId}/assurance` },
                        { label: frameworkId?.toUpperCase() || "Standard" }
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white/40 shadow-premium overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full -mr-40 -mt-40 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />
                    <div className="space-y-4 relative z-10 w-full">
                        <div className="flex items-center gap-5">
                            <div
                                className="p-4 rounded-2xl shadow-lg transition-transform duration-300"
                                style={{ backgroundColor: getCategoryMeta(activeCategory || "", frameworkId).color }}
                            >
                                <Shield className="w-9 h-9 text-black" />
                            </div>
                            <div>
                                <Label className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#0284c7]/80 mb-1.5 block leading-none">Implementation Phase</Label>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                                    {frameworkId?.toUpperCase()} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0284c7] to-blue-500">Work Process</span>
                                </h1>
                                <p className="text-slate-500 font-bold text-lg max-w-xl">
                                    Dynamic Technical Implementation & Verification
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="relative z-10 p-2">
                        <PageGuide
                            title="Framework Implementation"
                            description="Interactive guide to implementing technical controls."
                            rationale="Bridge the gap between requirements and technical reality with step-by-step verification."
                            howToUse={[
                                {
                                    step: "Select Domain",
                                    description: "Choose a category from the sidebar to focus your efforts.",
                                    targetId: "impl-category-sidebar"
                                },
                                {
                                    step: "AI Guidance",
                                    description: "Click 'AI Implementation Guide' for tailored technical advice tailored to your stack.",
                                    targetId: "impl-ai-button"
                                },
                                {
                                    step: "Verify & Update",
                                    description: "Check status in Audit Hub and update the state here.",
                                    targetId: "impl-controls-list"
                                }
                            ]}
                            integrations={[
                                { name: "Audit Hub", description: "Direct link to evidence collection." },
                                { name: "Advisor", description: "Real-time AI consultation." }
                            ]}
                        />
                    </div>
                </div>

                {!isLoading && categories.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <AlertCircle className="w-12 h-12 text-amber-500" />
                        <div>
                            <h4 className="text-xl font-bold text-slate-700">Framework Not Configured</h4>
                            <p className="text-slate-500 max-w-md mx-auto mt-2">
                                We couldn't find any controls for this framework. It may not be imported or configured for this client yet.
                            </p>
                        </div>
                    </div>
                )}

                {categories.length > 0 && (
                    <div className="grid lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-4" id="impl-category-sidebar">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2 drop-shadow-sm">Domains & Categories</h3>
                            <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                                <div className="space-y-3">
                                    {categories.map((cat) => {
                                        const meta = getCategoryMeta(cat, frameworkId);
                                        const isActive = activeCategory === cat;
                                        const Icon = meta.icon;

                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedPractice(cat)}
                                                className={cn(
                                                    "w-full text-left p-5 rounded-2xl transition-all duration-300 border-2 shadow-sm group relative overflow-hidden",
                                                    isActive
                                                        ? "shadow-xl shadow-blue-500/10 scale-[1.02] border-transparent"
                                                        : "bg-white/80 backdrop-blur-sm border-white/60 text-slate-700 hover:border-blue-300 hover:shadow-md hover:bg-white"
                                                )}
                                                style={isActive ? {
                                                    backgroundColor: meta.color,
                                                    color: "black"
                                                } : {}}
                                            >
                                                {isActive && (
                                                    <div className="absolute inset-0 bg-white/10 w-full h-full animate-shimmer" style={{ backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", transform: "skewX(-20deg)" }} />
                                                )}
                                                <div className="flex justify-between items-start gap-4 relative z-10">
                                                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border shrink-0",
                                                            isActive
                                                                ? "bg-black/10 border-black/20 text-black shadow-inner"
                                                                : "bg-slate-50 border-slate-100 text-slate-400 group-hover:border-blue-200 group-hover:text-blue-500"
                                                        )}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="space-y-1 overflow-hidden">
                                                            <h4 className={cn(
                                                                "font-black leading-tight line-clamp-2",
                                                                isActive ? 'text-black' : 'text-slate-800'
                                                            )}>{cat}</h4>
                                                            <div className="flex items-center gap-2">
                                                                <Badge className={cn(
                                                                    "text-[10px] py-0.5 px-2.5 font-bold shadow-sm border-none",
                                                                    isActive ? "bg-black/10 text-black backdrop-blur-md" : "bg-slate-100 text-slate-600"
                                                                )}>
                                                                    {groupedControls[cat].length} Controls
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ArrowRight className={cn(
                                                        "w-5 h-5 shrink-0 mt-2.5 transition-transform duration-300",
                                                        isActive ? "translate-x-1 text-black" : "group-hover:translate-x-1 opacity-40 group-hover:text-blue-500 group-hover:opacity-100"
                                                    )} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Content Area */}
                        <div className="lg:col-span-8">
                            {activeCategory ? (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    {/* Strategic Overlay (if exists) */}
                                    {overlay && (
                                        <Card className="border border-white/40 shadow-premium rounded-3xl overflow-hidden bg-white/60 backdrop-blur-xl relative group">
                                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity duration-500" />
                                            <CardHeader className="p-8 pb-4 relative z-10">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Badge className="bg-gradient-to-r from-[#0284c7] to-blue-500 text-white border-none font-bold px-3 py-1 uppercase tracking-wider text-[10px] shadow-sm">
                                                        Strategic Guidance
                                                    </Badge>
                                                </div>
                                                <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">{overlay.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-8 pt-0 space-y-6 relative z-10">
                                                <div className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/20 flex gap-5 items-start backdrop-blur-sm shadow-inner group-hover:bg-emerald-500/15 transition-colors">
                                                    <Activity className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
                                                    <div>
                                                        <h4 className="font-black text-emerald-900 mb-1 tracking-tight">Business Impact</h4>
                                                        <p className="text-emerald-800/90 font-medium leading-relaxed italic text-sm">
                                                            "{overlay.impact}"
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div className="space-y-4 bg-white/50 p-5 rounded-2xl border border-white focus-within:ring-2 focus-within:ring-[#0284c7]/20 transition-all hover:bg-white/80">
                                                        <h5 className="text-[11px] font-black text-[#0284c7] uppercase tracking-widest flex items-center gap-2">
                                                            <BookOpen className="w-4 h-4" /> Implementation Focus
                                                        </h5>
                                                        <ul className="space-y-2.5">
                                                            {overlay.guidance.map((g, i) => (
                                                                <li key={i} className="text-sm text-slate-600 font-medium flex gap-2">
                                                                    <span className="text-[#0284c7]">•</span> {g}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <h5 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                            <ListChecks className="w-4 h-4" /> Roadmap
                                                        </h5>
                                                        <ul className="space-y-2">
                                                            {overlay.nextSteps.map((s, i) => (
                                                                <li key={i} className="text-sm text-slate-600 font-medium flex gap-2">
                                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {s}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Live Controls List */}
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black text-slate-900 px-2 flex items-center justify-between tracking-tight">
                                            Requirement Verification
                                            <span className="text-xs font-bold text-white bg-slate-800 px-3 py-1 rounded-full">{activeControls.length} Found</span>
                                        </h3>

                                        {activeControls.map((control: any) => (
                                            <Card key={control.id} className="border-white/40 shadow-premium hover:shadow-xl transition-all duration-300 rounded-3xl bg-white/60 backdrop-blur-xl group hover:-translate-y-1">
                                                <CardContent className="p-6">
                                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                                        <div className="space-y-3 flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <Badge className="bg-slate-100 text-slate-600 font-mono text-[10px] rounded-md shadow-sm border border-slate-200">
                                                                    {control.controlId}
                                                                </Badge>
                                                                <h4 className="font-extrabold text-slate-900 group-hover:text-[#0284c7] transition-colors">{control.name}</h4>
                                                            </div>
                                                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                                                {control.description}
                                                            </p>

                                                            <div className="flex items-center gap-4 pt-4">
                                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                                                    <Clock className="w-4 h-4" />
                                                                    Status:
                                                                    <Badge className={`ml-1 text-[10px] shadow-sm font-bold border-none ${control.status === 'implemented' ? 'bg-emerald-500 text-white' :
                                                                        control.status === 'in_progress' ? 'bg-amber-400 text-white' :
                                                                            'bg-slate-200 text-slate-600'
                                                                        }`} variant="outline">
                                                                        {control.status?.replace('_', ' ').toUpperCase()}
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                                                    <AlertCircle className="w-4 h-4" />
                                                                    Evidence:
                                                                    <span className={(control.evidenceCount || 0) > 0 ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md" : "text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md"}>
                                                                        {control.evidenceCount || 0} Linked
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-3 min-w-[200px]">
                                                            <Select
                                                                value={control.status}
                                                                onValueChange={(val) => updateStatus.mutate({
                                                                    id: control.id,
                                                                    clientId: Number(clientId),
                                                                    status: val as any
                                                                })}
                                                            >
                                                                <SelectTrigger className="w-full rounded-2xl font-bold text-xs h-11 bg-white hover:bg-slate-50 border-slate-200 shadow-sm focus:ring-[#0284c7]/20 transition-all">
                                                                    <SelectValue placeholder="Update Status" />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-2xl border-slate-200 shadow-xl">
                                                                    <SelectItem value="not_implemented" className="font-medium">Not Implemented</SelectItem>
                                                                    <SelectItem value="in_progress" className="font-medium">In Progress</SelectItem>
                                                                    <SelectItem value="implemented" className="font-medium">Implemented</SelectItem>
                                                                    <SelectItem value="not_applicable" className="font-medium">Not Applicable</SelectItem>
                                                                </SelectContent>
                                                            </Select>

                                                            <Button
                                                                variant="outline"
                                                                className="w-full rounded-2xl border-slate-200 text-[#0284c7] font-bold text-[11px] uppercase tracking-wider h-11 hover:bg-[#0284c7]/5 hover:border-[#0284c7]/30 shadow-sm transition-all"
                                                                onClick={() => setLocation(`/clients/${clientId}/audit-hub?search=${control.controlId}`)}
                                                            >
                                                                Verify in Audit Hub
                                                                <ExternalLink className="w-3.5 h-3.5 ml-2" />
                                                            </Button>

                                                            <Button
                                                                variant="ghost"
                                                                className={`w-full rounded-2xl font-bold text-[11px] uppercase tracking-wider h-11 border transition-all duration-300 shadow-sm
                                                                ${getGuidanceMutation.isLoading && guidanceControl?.id === control.id
                                                                        ? "bg-purple-100/50 text-purple-600 border-purple-200 cursor-wait"
                                                                        : "bg-gradient-to-r hover:from-purple-50 hover:to-fuchsia-50 text-purple-600 border-purple-100 hover:border-purple-300"
                                                                    }`}
                                                                onClick={() => handleOpenGuidance(control)}
                                                                disabled={getGuidanceMutation.isLoading}
                                                            >
                                                                {getGuidanceMutation.isLoading && guidanceControl?.id === control.id ? (
                                                                    <>
                                                                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                                                        Generating...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Sparkles className="w-3.5 h-3.5 mr-2 text-purple-500" />
                                                                        AI Guidance
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                    <Info className="w-12 h-12 text-slate-300" />
                                    <div>
                                        <h4 className="text-xl font-bold text-slate-400">Select a category to begin</h4>
                                        <p className="text-slate-400">Select a technical domain from the sidebar to start implementation.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* AI Guidance Dialog */}
                <Dialog open={!!guidanceControl} onOpenChange={(open) => !open && setGuidanceControl(null)}>
                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white/95 backdrop-blur-3xl border-white/50 shadow-2xl rounded-3xl p-8">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3 text-2xl font-black">
                                <div className="p-3 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl shadow-lg shadow-purple-500/20">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                Implementation Guide
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium text-base ml-1">
                                AI-generated guidance tailored to your organization's context.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-6 space-y-6">
                            <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl border border-slate-200/60 shadow-inner">
                                <h4 className="font-extrabold text-slate-900 mb-2 truncate text-lg pr-4">{guidanceControl?.name}</h4>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">{guidanceControl?.description}</p>
                            </div>

                            {getGuidanceMutation.isLoading ? (
                                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-full blur-xl bg-purple-500/20 animate-pulse"></div>
                                        <Loader2 className="w-12 h-12 text-purple-600 animate-spin relative z-10" />
                                    </div>
                                    <p className="text-purple-600 font-bold animate-pulse">Synthesizing Contextual Guidance...</p>
                                </div>
                            ) : (
                                <div className="prose prose-sm md:prose-base prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-a:text-purple-600 prose-strong:text-slate-800 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <ReactMarkdown>{guidanceContent}</ReactMarkdown>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="mt-8 border-t border-slate-100 pt-6">
                            <Button
                                variant="outline"
                                onClick={() => setGuidanceControl(null)}
                                className="rounded-xl font-bold h-11 px-8 hover:bg-slate-50 hover:text-slate-900 transition-colors border-slate-200"
                            >
                                Close Guide
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default FrameworkImplementationView;
