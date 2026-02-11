
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Shield, BookOpen, CheckCircle2, ListChecks, ArrowRight, Info, ExternalLink, Activity, Clock, AlertCircle, Sparkles, X, Loader2 } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { TECHNICAL_STANDARD_CONTENT } from "./StandardPractices";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@complianceos/ui/ui/dialog";
import ReactMarkdown from 'react-markdown';
import { PageGuide } from "@/components/PageGuide";

const FrameworkImplementationView: React.FC = () => {
    const { id: clientId, frameworkId } = useParams<{ id: string, frameworkId: string }>();
    const [, setLocation] = useLocation();
    const [selectedPractice, setSelectedPractice] = useState<string | null>(null);

    // AI Guidance State
    const [guidanceControl, setGuidanceControl] = useState<any | null>(null);
    const [guidanceContent, setGuidanceContent] = useState<string>("");

    const getGuidanceMutation = trpc.advisor.getImplementationGuidance.useMutation({
        onSuccess: (data) => {
            setGuidanceContent(data.guidance);
        },
        onError: (err) => {
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
        const overlays = TECHNICAL_STANDARD_CONTENT[frameworkId?.toUpperCase() || ""] || [];
        const match = category.match(/V(\d+):/);
        if (match) {
            const version = match[1];
            return overlays.find(o => o.id.includes(`-V${version}`));
        }
        return null;
    };

    const overlay = getStrategicOverlay(activeCategory);

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
            <div className="p-8 space-y-8 max-w-7xl mx-auto">
                <Breadcrumb
                    items={[
                        { label: "Assurance", href: `/clients/${clientId}/assurance` },
                        { label: frameworkId?.toUpperCase() || "Standard" }
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#0284c7]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-[#0284c7] to-[#0369a1] rounded-2xl shadow-lg shadow-[#0284c7]/20">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                                    {frameworkId?.toUpperCase()} <span className="text-[#0284c7]">Work Process</span>
                                </h1>
                                <p className="text-slate-500 font-medium text-lg">
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
                                { step: "Select Domain", description: "Choose a category from the sidebar to focus your efforts." },
                                { step: "Review Control", description: "Read the requirements and description." },
                                { step: "AI Guidance", description: "Click 'AI Implementation Guide' for tailored advice." },
                                { step: "Verify & Update", description: "Check status in Audit Hub and update the state here." }
                            ]}
                            integrations={[
                                { name: "Audit Hub", description: "Direct link to evidence collection." },
                                { name: "Advisor", description: "Real-time AI consultation." }
                            ]}
                        />
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Sidebar: Categories */}
                    <div className="lg:col-span-4 space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Domains & Categories</h3>
                        <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                            <div className="space-y-3">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedPractice(cat)}
                                        className={`w-full text-left p-5 rounded-2xl transition-all duration-300 border shadow-sm group ${activeCategory === cat
                                            ? "bg-[#0284c7] border-[#0284c7] text-white shadow-lg shadow-[#0284c7]/20 translate-x-1"
                                            : "bg-white border-slate-100 text-slate-600 hover:border-[#0284c7]/30 hover:shadow-md"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-1">
                                                <h4 className="font-bold leading-tight line-clamp-2">{cat}</h4>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={`text-[10px] py-0 px-2 ${activeCategory === cat ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                                                        {groupedControls[cat].length} Controls
                                                    </Badge>
                                                </div>
                                            </div>
                                            <ArrowRight className={`w-5 h-5 shrink-0 mt-1 transition-transform ${activeCategory === cat ? "translate-x-1" : "group-hover:translate-x-1 opacity-20"}`} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-8">
                        {activeCategory ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                {/* Strategic Overlay (if exists) */}
                                {overlay && (
                                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-gradient-to-br from-white to-slate-50">
                                        <CardHeader className="p-8 pb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="outline" className="bg-white text-[#0284c7] border-[#0284c7]/20 font-bold px-3 py-1">
                                                    Strategic Guidance
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-2xl font-black text-slate-900">{overlay.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-8 pt-0 space-y-6">
                                            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex gap-5 items-start">
                                                <Activity className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
                                                <div>
                                                    <h4 className="font-bold text-emerald-900 mb-1">Business Impact</h4>
                                                    <p className="text-emerald-800/80 font-medium leading-relaxed italic">
                                                        "{overlay.impact}"
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <h5 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4" /> Implementation Focus
                                                    </h5>
                                                    <ul className="space-y-2">
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
                                    <h3 className="text-xl font-black text-slate-900 px-2 flex items-center justify-between">
                                        Requirement Verification
                                        <span className="text-sm font-bold text-slate-400">{activeControls.length} Found</span>
                                    </h3>

                                    {activeControls.map((control: any) => (
                                        <Card key={control.id} className="border-slate-100 shadow-sm hover:shadow-md transition-all rounded-2xl">
                                            <CardContent className="p-6">
                                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                                    <div className="space-y-3 flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <Badge className="bg-slate-100 text-slate-600 font-mono text-[10px] rounded-md">
                                                                {control.controlId}
                                                            </Badge>
                                                            <h4 className="font-bold text-slate-900">{control.name}</h4>
                                                        </div>
                                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                                            {control.description}
                                                        </p>

                                                        <div className="flex items-center gap-4 pt-2">
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                Status:
                                                                <Badge className={`ml-1 text-[10px] ${control.status === 'implemented' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                                    control.status === 'in_progress' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                                        'bg-slate-50 text-slate-400'
                                                                    }`} variant="outline">
                                                                    {control.status?.replace('_', ' ').toUpperCase()}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                                                <AlertCircle className="w-3.5 h-3.5" />
                                                                Evidence:
                                                                <span className={(control.evidenceCount || 0) > 0 ? "text-emerald-600" : "text-amber-500"}>
                                                                    {control.evidenceCount || 0} Linked
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                                        <Select
                                                            value={control.status}
                                                            onValueChange={(val) => updateStatus.mutate({
                                                                id: control.id,
                                                                clientId: Number(clientId),
                                                                status: val as any
                                                            })}
                                                        >
                                                            <SelectTrigger className="w-full rounded-xl font-bold text-xs h-10">
                                                                <SelectValue placeholder="Update Status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="not_implemented">Not Implemented</SelectItem>
                                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                                <SelectItem value="implemented">Implemented</SelectItem>
                                                                <SelectItem value="not_applicable">Not Applicable</SelectItem>
                                                            </SelectContent>
                                                        </Select>

                                                        <Button
                                                            variant="outline"
                                                            className="w-full rounded-xl border-slate-200 text-[#0284c7] font-bold text-xs h-10 hover:bg-[#0284c7]/5"
                                                            onClick={() => setLocation(`/clients/${clientId}/audit-hub?search=${control.controlId}`)}
                                                        >
                                                            Verify in Audit Hub
                                                            <ExternalLink className="w-3.5 h-3.5 ml-2" />
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            className={`w-full rounded-xl font-bold text-xs h-10 border border-purple-100 transition-all duration-300
                                                                ${getGuidanceMutation.isLoading && guidanceControl?.id === control.id
                                                                    ? "bg-purple-50 text-purple-400 cursor-wait"
                                                                    : "text-purple-600 hover:bg-purple-50"
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
                                                                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                                                                    AI Implementation Guide
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

                {/* AI Guidance Dialog */}
                <Dialog open={!!guidanceControl} onOpenChange={(open) => !open && setGuidanceControl(null)}>
                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Sparkles className="w-5 h-5 text-purple-600" />
                                </div>
                                Implementation Guide
                            </DialogTitle>
                            <DialogDescription>
                                AI-generated guidance tailored to your organization's context.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h4 className="font-bold text-slate-900 mb-1">{guidanceControl?.name}</h4>
                                <p className="text-sm text-slate-500">{guidanceControl?.description}</p>
                            </div>

                            {getGuidanceMutation.isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                                </div>
                            ) : (
                                <div className="prose prose-sm prose-slate max-w-none">
                                    <ReactMarkdown>{guidanceContent}</ReactMarkdown>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setGuidanceControl(null)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default FrameworkImplementationView;
