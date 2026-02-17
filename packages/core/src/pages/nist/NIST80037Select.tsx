
import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useParams, Link } from "wouter";
import NIST80037Layout from "./NIST80037Layout";
import { useNistSystemId } from "./useNistSystem";
import {
    ShieldCheck,
    Filter,
    Settings2,
    ListChecks,
    Zap,
    CheckCircle2,
    Plus,
    Search,
    Target,
    FileText,
    Dna,
    Save,
    ArrowRight,
    Lock,
    Eye,
    ShieldAlert,
    ScrollText,
    Hammer,
    Network
} from "lucide-react";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Badge } from "@complianceos/ui/ui/badge";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Progress } from "@complianceos/ui/ui/progress";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NIST80037Select() {
    const { id } = useParams<{ id: string }>();
    const systemId = useNistSystemId();
    const clientId = parseInt(id || "0");
    const [isSaving, setIsSaving] = useState(false);
    const [showAllControls, setShowAllControls] = useState(false);
    const [baselineLevel, setBaselineLevel] = useState("Moderate");
    const [diagnosticsEnabled, setDiagnosticsEnabled] = useState(true);
    const [assessmentFrequency, setAssessmentFrequency] = useState("QUARTERLY");
    const [controls, setControls] = useState([
        { id: "AC-2", title: "Account Management", family: "Access Control", tailoring: "Inherited (Common)", type: "Technical" },
        { id: "AU-6", title: "Audit Record Review, Analysis, and Reporting", family: "Audit and Accountability", tailoring: "Tailored (Modified)", type: "Operational" },
        { id: "PE-2", title: "Physical Access Authorizations", family: "Physical and Environmental", tailoring: "Not Applicable", type: "Management" },
        { id: "SA-10", title: "Developer Configuration Management", family: "System and Services Acquisition", tailoring: "Selected", type: "Technical" }
    ]);
    const [monitoringPlan, setMonitoringPlan] = useState("");

    // Reset local state when systemId changes
    useEffect(() => {
        setBaselineLevel("Moderate");
        setDiagnosticsEnabled(true);
        setAssessmentFrequency("QUARTERLY");
        setControls([
            { id: "AC-2", title: "Account Management", family: "Access Control", tailoring: "Inherited (Common)", type: "Technical" },
            { id: "AU-6", title: "Audit Record Review, Analysis, and Reporting", family: "Audit and Accountability", tailoring: "Tailored (Modified)", type: "Operational" },
            { id: "PE-2", title: "Physical Access Authorizations", family: "Physical and Environmental", tailoring: "Not Applicable", type: "Management" },
            { id: "SA-10", title: "Developer Configuration Management", family: "System and Services Acquisition", tailoring: "Selected", type: "Technical" }
        ]);
        setMonitoringPlan("");
        setHighWaterMark("MODERATE");
    }, [systemId]);

    const checklistQuery = trpc.checklist.get.useQuery({ 
        clientId, 
        checklistId: systemId ? `nist-800-37-select-${systemId}` : 'no-system' 
    }, {
        enabled: !!systemId
    });
    
    const categorizationQuery = trpc.checklist.get.useQuery({ 
        clientId, 
        checklistId: systemId ? `nist-800-37-categorize-${systemId}` : 'no-system' 
    }, {
        enabled: !!systemId
    });

    const [highWaterMark, setHighWaterMark] = useState("MODERATE");

    useEffect(() => {
        if (categorizationQuery.data?.items) {
            const items = categorizationQuery.data.items as any;
            if (items.c2_objectives) {
                const levels = Object.values(items.c2_objectives).map((o: any) => o.level);
                let calculatedHwm = "LOW";
                if (levels.includes("High")) calculatedHwm = "HIGH";
                else if (levels.includes("Moderate")) calculatedHwm = "MODERATE";

                setHighWaterMark(calculatedHwm);
                // If we don't have a saved baseline yet, default it to the HWM
                if (!checklistQuery.data?.items) {
                    setBaselineLevel(calculatedHwm.charAt(0) + calculatedHwm.slice(1).toLowerCase());
                }
            }
        }
    }, [categorizationQuery.data, systemId, checklistQuery.data]);

    const isAligned = highWaterMark === baselineLevel.toUpperCase();
    const confidenceScore = isAligned ? 94 : 65;
    const tailoredCount = controls.filter(c => c.tailoring !== "Inherited (Common)").length;
    const inheritedCount = controls.filter(c => c.tailoring === "Inherited (Common)").length;

    // Detailed Tailoring Stats
    const scopingCount = controls.filter(c => c.tailoring === "Not Applicable" || c.tailoring === "Tailored (Modified)").length;
    const compensatingCount = controls.filter(c => c.id.startsWith("New-")).length; // Mock: new controls = compensating for this demo
    const parameterCount = controls.filter(c => c.tailoring === "Selected").length; // Mock: selected = parameter updates

    const baselineTotals: Record<string, number> = {
        "Low": 125,
        "Moderate": 325,
        "High": 542
    };
    const currentBaselineTotal = baselineTotals[baselineLevel] || 325;

    const updateChecklistMutation = trpc.checklist.update.useMutation({
        onSuccess: () => {
            toast.success("Control Selection Saved", { description: "Initial baseline and tailoring actions updated." });
            setIsSaving(false);
            checklistQuery.refetch();
        },
        onError: () => {
            setIsSaving(false);
            toast.error("Failed to save selection");
        }
    });

    useEffect(() => {
        if (checklistQuery.data?.items) {
            const items = checklistQuery.data.items as any;
            if (items.baseline) setBaselineLevel(items.baseline);
            if (items.controls) setControls(items.controls);
            if (items.monitoring) setMonitoringPlan(items.monitoring);
            if (items.diagnosticsEnabled !== undefined) setDiagnosticsEnabled(items.diagnosticsEnabled);
            if (items.assessmentFrequency) setAssessmentFrequency(items.assessmentFrequency);
        }
    }, [checklistQuery.data, systemId]);

    const handleSave = () => {
        setIsSaving(true);
        updateChecklistMutation.mutate({
            clientId,
            checklistId: `nist-800-37-select-${systemId}`,
            items: {
                baseline: baselineLevel,
                controls,
                monitoring: monitoringPlan,
                diagnosticsEnabled,
                assessmentFrequency
            }
        });
    };

    const handleExportSSP = () => {
        const content = `# System Security Plan (SSP) Draft\n\nBaseline: ${baselineLevel}\n\n## Controls\n${controls.map(c => `- ${c.id}: ${c.title} (${c.tailoring})`).join('\n')}\n\n## Monitoring\n${monitoringPlan}`;
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SSP_Draft_Client_${clientId}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("SSP Draft Exported");
    };

    const handleAiTailoring = () => {
        toast.success("AI Tailoring applied to 3 controls");
        setControls(prev => [
            ...prev,
            { id: "SC-7", title: "Boundary Protection", family: "System and Communications Protection", tailoring: "Tailored (Modified)", type: "Technical" }
        ]);
    };

    const handleAddControl = () => {
        setControls(prev => [...prev, { id: "New-1", title: "New Control", family: "System-Specific", tailoring: "Selected", type: "Operational" }]);
        toast.success("New control added");
    };

    const handleToggleTailoring = (index: number) => {
        const statuses = ["Inherited (Common)", "Tailored (Modified)", "Not Applicable", "Selected"];
        setControls(prev => prev.map((c, i) => {
            if (i === index) {
                const currentIdx = statuses.indexOf(c.tailoring);
                return { ...c, tailoring: statuses[(currentIdx + 1) % statuses.length] };
            }
            return c;
        }));
    };

    return (
        <NIST80037Layout>
            <div className="space-y-8 max-w-5xl pb-20">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/dashboard` },
                        { label: "NIST Hub", href: `/clients/${clientId}/nist` },
                        { label: "SP 800-37 (RMF)", href: `/clients/${clientId}/nist/rmf` },
                        { label: "Step 2: Select" },
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-600 text-white font-black px-3">STEP 2</Badge>
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700 font-bold uppercase tracking-widest text-[10px]">Selection & Tailoring</Badge>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
                            <ShieldCheck className="w-10 h-10 text-emerald-600" />
                            Control Selection
                        </h1>
                        <p className="text-slate-500 text-lg font-medium max-w-3xl leading-relaxed">
                            Select an initial set of controls for the system and tailor the controls as needed to reduce risk to an acceptable level.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={handleExportSSP} className="rounded-2xl h-14 px-6 font-bold border-2 border-slate-100 hover:bg-slate-50 text-slate-600">
                            Export SSP Draft
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl h-14 px-8 shadow-xl shadow-emerald-200/50 font-black text-lg gap-2"
                        >
                            {isSaving ? "Saving..." : <><Save className="w-5 h-5" /> Finalize Selection</>}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Control Summary Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-emerald-900 text-white overflow-hidden relative">
                            <CardHeader className="pb-2 relative z-10">
                                <CardTitle className="text-emerald-400 text-xs font-black uppercase tracking-widest">Baseline Posture</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 relative z-10">
                                <div className="text-center py-4 bg-white/10 rounded-[2rem] border border-white/10">
                                    <h2 className="text-4xl font-black text-white tracking-tighter">{baselineLevel.toUpperCase()}</h2>
                                    <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mt-1">FIPS-199 Baseline</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs font-bold text-emerald-200 uppercase tracking-wider">
                                        <span>Total Baseline Controls</span>
                                        <span>{currentBaselineTotal}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold text-emerald-200 uppercase tracking-wider">
                                        <span>Selected for System</span>
                                        <span>{controls.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold text-emerald-200 uppercase tracking-wider">
                                        <span>Inherited (Common)</span>
                                        <span>{inheritedCount}</span>
                                    </div>
                                    <Progress value={(inheritedCount / Math.max(controls.length, 1)) * 100} className="h-2 bg-emerald-800" indicatorClassName="bg-white" />
                                </div>
                            </CardContent>
                            <ShieldCheck className="absolute -bottom-10 -left-10 w-48 h-48 text-white/5 -rotate-12" />
                        </Card>

                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white">
                            <CardHeader>
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Tailoring Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { label: "Scoping Actions", count: scopingCount, icon: Filter, color: "text-blue-500" },
                                    { label: "Compensating Controls", count: compensatingCount, icon: ShieldAlert, color: "text-amber-500" },
                                    { label: "Parameter Updates", count: parameterCount, icon: Settings2, color: "text-emerald-500" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <item.icon className={cn("w-4 h-4", item.color)} />
                                            <span className="text-sm font-bold text-slate-600">{item.label}</span>
                                        </div>
                                        <Badge variant="secondary" className="font-black">{item.count}</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="lg:col-span-3 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[2.5rem] overflow-hidden">
                        <Tabs defaultValue="baseline" className="w-full">
                            <div className="border-b px-8 bg-slate-50/50">
                                <TabsList className="h-16 bg-transparent gap-8">
                                    <TabsTrigger value="baseline" className="data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        Baseline Selection
                                    </TabsTrigger>
                                    <TabsTrigger value="list" className="data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        Control Tailoring
                                    </TabsTrigger>
                                    <TabsTrigger value="monitoring" className="data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        Monitoring Strategy
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="h-[900px]">
                                <TabsContent value="baseline" className="p-10 space-y-10 m-0">
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Select Security Baseline (SL-1)</h3>
                                            <p className="text-slate-500 font-medium">Choose the starting set of controls based on your categorization results.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {[
                                                { level: "Low", description: "Limited impact system. Standard baseline controls.", count: 125, color: "indigo" },
                                                { level: "Moderate", description: "Serious adverse effect system. Comprehensive set.", count: 325, color: "emerald" },
                                                { level: "High", description: "Severe adverse effect system. Maximal protection.", count: "500+", color: "rose" }
                                            ].map((lvl, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => setBaselineLevel(lvl.level)}
                                                    className={cn(
                                                        "p-8 rounded-[3rem] border transition-all cursor-pointer relative group select-none",
                                                        baselineLevel === lvl.level ? `bg-${lvl.color}-50 border-${lvl.color}-200 shadow-xl shadow-${lvl.color}-500/10` : "bg-white border-slate-100 hover:border-slate-200"
                                                    )}>
                                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", baselineLevel === lvl.level ? `bg-${lvl.color}-500 text-white` : "bg-slate-100 text-slate-400 group-hover:bg-slate-200")}>
                                                        <ShieldCheck className="w-6 h-6" />
                                                    </div>
                                                    <h4 className="text-xl font-black text-slate-900 mb-2">{lvl.level} Impact</h4>
                                                    <p className="text-sm text-slate-500 font-medium mb-6">{lvl.description}</p>
                                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">{lvl.count} Controls</span>
                                                        {baselineLevel === lvl.level && <CheckCircle2 className={`w-5 h-5 text-${lvl.color}-500`} />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-8 bg-slate-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                                            <div className="relative z-10 space-y-4 text-center md:text-left">
                                                <h4 className="text-xl font-black tracking-tight">AI Assessment: Baseline Alignment</h4>
                                                <p className="text-slate-400 font-medium max-w-lg leading-relaxed">
                                                    {isAligned
                                                        ? `Our AI analysis confirms that your Categorization High-Water Mark (${highWaterMark}) matches the selected baseline. ${tailoredCount} tailoring actions identified.`
                                                        : `Warning: Your selected baseline (${baselineLevel.toUpperCase()}) does not match your Categorization High-Water Mark (${highWaterMark}). Consider adjusting to align with FIPS-199.`}
                                                </p>
                                                <Button onClick={handleAiTailoring} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold gap-2">
                                                    <Zap className="w-4 h-4" /> Apply AI Tailoring Advice
                                                </Button>
                                            </div>
                                            <div className="relative z-10 grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-white/5 rounded-2xl text-center border border-white/5">
                                                    <p className="text-4xl font-black">{confidenceScore}%</p>
                                                    <p className="text-[10px] uppercase font-black tracking-widest text-emerald-400">Confidence</p>
                                                </div>
                                                <div className="p-4 bg-white/5 rounded-2xl text-center border border-white/5">
                                                    <p className="text-4xl font-black">{inheritedCount}</p>
                                                    <p className="text-[10px] uppercase font-black tracking-widest text-indigo-400">Inherited</p>
                                                </div>
                                            </div>
                                            <Dna className="absolute -bottom-20 -right-20 w-80 h-80 text-white/5 rotate-12" />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="list" className="p-10 space-y-8 m-0">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Control Scoping & Tailoring (SL-2)</h3>
                                            <p className="text-sm text-slate-500 font-medium max-w-2xl">
                                                Review the security controls in your selected baseline. Use this section to <strong>tailor</strong> controls (mark as N/A, modify, or add system-specific controls).
                                                <br />
                                                <span className="text-xs text-slate-400 italic">Currently showing {showAllControls ? "all baseline controls" : "only tailored/modified controls"}.</span>
                                            </p>
                                        </div>
                                        <div className="flex bg-slate-100 p-1 rounded-xl">
                                            <button
                                                onClick={() => setShowAllControls(false)}
                                                className={cn("px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all", !showAllControls ? "bg-white shadow text-slate-900" : "text-slate-400 hover:text-slate-600")}
                                            >
                                                Tailored Only
                                            </button>
                                            <button
                                                onClick={() => setShowAllControls(true)}
                                                className={cn("px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all", showAllControls ? "bg-white shadow text-slate-900" : "text-slate-400 hover:text-slate-600")}
                                            >
                                                All Controls
                                            </button>
                                        </div>
                                        <Link href={`/clients/${clientId}/federal/ssp`}>
                                            <Button variant="outline" className="rounded-xl h-10 px-4 font-bold text-xs uppercase tracking-widest gap-2 bg-white">
                                                <FileText className="w-4 h-4 text-indigo-600" /> Manage in SSP Editor
                                            </Button>
                                        </Link>
                                    </div>

                                    <div className="space-y-6">
                                        {(showAllControls ? [...controls,
                                        // Mock generic baseline controls when "All" is viewed
                                        { id: "AC-1", title: "Policy and Procedures", family: "Access Control", tailoring: "Inherited (Common)", type: "Management" },
                                        { id: "AC-3", title: "Access Enforcement", family: "Access Control", tailoring: "Inherited (Common)", type: "Technical" },
                                        { id: "AC-4", title: "Information Flow Enforcement", family: "Access Control", tailoring: "Inherited (Common)", type: "Technical" },
                                        { id: "AT-1", title: "Policy and Procedures", family: "Awareness and Training", tailoring: "Inherited (Common)", type: "Management" },
                                        { id: "AT-2", title: "Security Awareness Training", family: "Awareness and Training", tailoring: "Inherited (Common)", type: "Operational" },
                                        ] : controls).map((control, i) => (
                                            <div key={i} className="p-6 bg-white border rounded-[2.5rem] hover:shadow-lg transition-all group">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                            <span className="font-black text-xl tracking-tighter">{control.id}</span>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-lg font-black text-slate-900">{control.title}</h4>
                                                                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-slate-400">{control.family}</Badge>
                                                            </div>
                                                            <div className="flex items-center gap-4 mt-1">
                                                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                                    <Target className="w-3 h-3" /> {control.type}
                                                                </span>
                                                                <span className={cn(
                                                                    "text-xs font-black uppercase tracking-widest flex items-center gap-1",
                                                                    control.tailoring === 'Inherited (Common)' ? "text-indigo-500" :
                                                                        control.tailoring === 'Tailored (Modified)' ? "text-emerald-500" :
                                                                            control.tailoring === 'Not Applicable' ? "text-rose-400" : "text-slate-400"
                                                                )}>
                                                                    <Settings2 className="w-3 h-3" /> {control.tailoring}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleToggleTailoring(i)}
                                                            className="rounded-xl h-10 px-4 font-bold text-xs uppercase tracking-widest gap-2"
                                                        >
                                                            <Settings2 className="w-4 h-4" /> Tailor
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-slate-300 hover:text-indigo-600">
                                                            <ArrowRight className="w-5 h-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        onClick={handleAddControl}
                                        className="w-full bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-200 text-slate-500 rounded-[2rem] h-20 text-lg font-black gap-3 mt-4"
                                    >
                                        <Plus className="w-6 h-6" /> Add System-Specific Control
                                    </Button>
                                </TabsContent>

                                <TabsContent value="monitoring" className="p-10 space-y-8 m-0">
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="p-8 bg-indigo-50 rounded-[3rem] border border-indigo-100 space-y-4">
                                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                                                    <Eye className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-2xl font-black text-indigo-900 tracking-tight">Continuous Monitoring Strategy (SL-4)</h3>
                                                <p className="text-indigo-700 font-medium leading-relaxed font-serif">
                                                    Define the frequency and method for monitoring selected controls throughout the system lifecycle.
                                                </p>
                                            </div>

                                            <div className="space-y-4 flex flex-col justify-center">
                                                <div
                                                    onClick={() => setDiagnosticsEnabled(!diagnosticsEnabled)}
                                                    className={cn(
                                                        "flex items-center justify-between p-4 bg-white border rounded-2xl cursor-pointer hover:bg-slate-50 transition-all select-none",
                                                        diagnosticsEnabled ? "border-emerald-200 shadow-md shadow-emerald-100" : "border-slate-200"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3 font-bold text-slate-700">
                                                        <ScrollText className={cn("w-5 h-5", diagnosticsEnabled ? "text-emerald-500" : "text-slate-400")} />
                                                        Continuous Diagnostics
                                                    </div>
                                                    <Badge className={cn("font-black", diagnosticsEnabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                                                        {diagnosticsEnabled ? "ACTIVE" : "INACTIVE"}
                                                    </Badge>
                                                </div>
                                                <div
                                                    onClick={() => {
                                                        const freqs = ["MONTHLY", "QUARTERLY", "ANNUALLY"];
                                                        const idx = freqs.indexOf(assessmentFrequency);
                                                        setAssessmentFrequency(freqs[(idx + 1) % freqs.length]);
                                                    }}
                                                    className="flex items-center justify-between p-4 bg-white border rounded-2xl cursor-pointer hover:bg-slate-50 transition-all select-none"
                                                >
                                                    <div className="flex items-center gap-3 font-bold text-slate-700">
                                                        <Network className="w-5 h-5 text-indigo-500" /> Periodic Assessment
                                                    </div>
                                                    <Badge variant="outline" className="text-slate-600 border-indigo-200 font-black bg-indigo-50">{assessmentFrequency}</Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-200 space-y-6">
                                            <Label className="text-sm font-black uppercase tracking-widest text-slate-500">Monitoring Plan Details</Label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <div className="p-4 bg-white rounded-2xl border border-slate-100">
                                                        <p className="text-xs font-black uppercase text-slate-400 mb-2">Automated Triggers</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Badge className="bg-indigo-100 text-indigo-700 font-bold">Config Drift</Badge>
                                                            <Badge className="bg-indigo-100 text-indigo-700 font-bold">New Auth</Badge>
                                                            <Badge className="bg-indigo-100 text-indigo-700 font-bold">API Failure</Badge>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-white rounded-2xl border border-slate-100">
                                                        <p className="text-xs font-black uppercase text-slate-400 mb-2">Compliance Reporters</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Badge className="bg-slate-100 text-slate-600 font-bold">AWS Security Hub</Badge>
                                                            <Badge className="bg-slate-100 text-slate-600 font-bold">Palo Alto XDR</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <Textarea
                                                        placeholder="Describe the frequency and method of assessment for each control set..."
                                                        className="h-full rounded-[2rem] bg-white border-slate-200"
                                                        value={monitoringPlan}
                                                        onChange={(e) => setMonitoringPlan(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>
                    </Card>
                </div>
            </div>
        </NIST80037Layout>
    );
}

