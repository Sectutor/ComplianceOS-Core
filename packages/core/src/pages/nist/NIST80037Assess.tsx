import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from "wouter";
import { trpc } from '../../lib/trpc';
import NIST80037Layout from "./NIST80037Layout";
import { useNistSystemId } from "./useNistSystem";
import {
    ClipboardList,
    CheckCircle2,
    XCircle,
    AlertCircle,
    FileSearch,
    Zap,
    Plus,
    Search,
    FileText,
    ShieldCheck,
    ArrowRight,
    Save,
    History,
    FileCheck,
    Library,
    Activity,
    Users,
    Stethoscope,
    Flag,
    Trash2
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@complianceos/ui/ui/dialog";

export default function NIST80037Assess() {
    const { id } = useParams<{ id: string }>();
    const systemId = useNistSystemId();
    const clientId = parseInt(id || "0");
    const [isSaving, setIsSaving] = useState(false);
    const [, setLocation] = useLocation();
    const utils = trpc.useUtils();

    // TRPC Queries - Using any casting due to persistent stale type inference
    const fismaSystemId = systemId;
    const { data: findingsStats } = (trpc as any).findings.stats.useQuery({ clientId });
    const { data: poams } = (trpc as any).federal.listPoams.useQuery({ clientId, fismaSystemId });
    const { data: sars } = (trpc as any).federal.listSARs.useQuery({ clientId, fismaSystemId });
    const latestSAR = sars?.[0];

    const { data: sarFindings } = (trpc as any).federal.getSarFindings.useQuery(
        { clientId, sarId: latestSAR?.id },
        { enabled: !!latestSAR }
    );

    const { data: checklistData } = (trpc as any).checklist.get.useQuery({
        clientId,
        checklistId: systemId ? `nist-800-37-assess-${systemId}` : 'no-system'
    }, {
        enabled: !!systemId
    });

    // Bring in Implementation checklist to know actual system control counts
    const { data: implementData } = (trpc as any).checklist.get.useQuery({
        clientId,
        checklistId: systemId ? `nist-800-37-implement-${systemId}` : 'no-system'
    }, {
        enabled: !!systemId
    });

    const updateChecklistMutation = (trpc as any).checklist.update.useMutation();

    const [assessmentStatus, setAssessmentStatus] = useState<string>('pending');

    // Editable Plan State
    const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
    const [editTeam, setEditTeam] = useState<{ name: string, role: string }[]>([]);
    const [editScope, setEditScope] = useState<string>("");

    const [isAddFindingOpen, setIsAddFindingOpen] = useState(false);
    const [findingForm, setFindingForm] = useState({
        controlId: "",
        observation: "",
        result: "Satisfied",
        riskLevel: "Low"
    });

    const createSARMutation = (trpc as any).federal.createSAR.useMutation();
    const saveSarFindingMutation = (trpc as any).federal.saveSarFinding.useMutation();
    const createFindingMutation = (trpc as any).findings.create.useMutation();

    const checklistItems = checklistData?.items as any;
    const assessmentTeam = checklistItems?.assessmentTeam || [
        { name: latestSAR?.assessorName || "Independent Assessor", role: "Lead Auditor" },
        { name: "Network Security Eng", role: "Tech Lead" }
    ];

    const testingScope = checklistItems?.testingScope || [
        "Vulnerability Scan", "Code Review", "Policy Audit", "SOP Walkthrough", "Interview"
    ];

    // Reset local state when systemId changes
    useEffect(() => {
        setAssessmentStatus('pending');
    }, [systemId]);

    useEffect(() => {
        if (checklistData?.items) {
            const items = checklistData.items as any;
            if (items.status) setAssessmentStatus(items.status);
        }
    }, [checklistData]);

    const handleSave = async () => {
        if (!systemId) {
            toast.error("No system selected", { description: "Please select a system first." });
            return;
        }

        setIsSaving(true);
        try {
            await updateChecklistMutation.mutateAsync({
                clientId,
                checklistId: `nist-800-37-assess-${systemId}`,
                items: {
                    ...(checklistData?.items as any),
                    lastFinalized: new Date().toISOString(),
                    status: 'completed'
                }
            });
            toast.success("Assessment Data Finalized", {
                description: "Security Assessment Report and remediation plan updated.",
            });
            utils.checklist.get.invalidate();
        } catch (err) {
            toast.error("Failed to save assessment results");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePlan = async () => {
        if (!systemId) return;
        setIsSaving(true);
        try {
            await updateChecklistMutation.mutateAsync({
                clientId,
                checklistId: `nist-800-37-assess-${systemId}`,
                items: {
                    ...(checklistData?.items as any),
                    assessmentTeam: editTeam,
                    testingScope: editScope.split(',').map(s => s.trim()).filter(Boolean)
                }
            });
            setIsEditPlanOpen(false);
            utils.checklist.get.invalidate();
            toast.success("Assessment Plan Updated", {
                description: "The assessment parameters have been successfully saved."
            });
        } catch (err) {
            toast.error("Failed to update plan");
        } finally {
            setIsSaving(false);
        }
    };

    const openEditPlan = () => {
        if (!systemId) {
            toast.error("No system selected", { description: "Please select a system first to edit its assessment plan." });
            return;
        }
        setEditTeam([...assessmentTeam]);
        setEditScope(testingScope.join(", "));
        setIsEditPlanOpen(true);
    };

    const handleSaveNewFinding = async () => {
        if (!systemId) {
            toast.error("No system selected");
            return;
        }
        setIsSaving(true);
        try {
            let sarId = latestSAR?.id;
            if (!sarId) {
                const newSar = await createSARMutation.mutateAsync({
                    clientId,
                    fismaSystemId,
                    title: `SAR for System ${fismaSystemId}`,
                    framework: "NIST 800-37"
                });
                sarId = newSar.id;
            }

            await saveSarFindingMutation.mutateAsync({
                clientId,
                sarId,
                controlId: findingForm.controlId,
                observation: findingForm.observation,
                result: findingForm.result,
                riskLevel: findingForm.riskLevel,
                status: findingForm.result === "Satisfied" ? "closed" : "open"
            });

            if (findingForm.result !== 'Satisfied' && (findingForm.riskLevel === 'High' || findingForm.riskLevel === 'Moderate' || findingForm.riskLevel === 'Low')) {
                const severityMap: Record<string, string> = {
                    'High': 'high',
                    'Moderate': 'medium',
                    'Low': 'low'
                };

                await createFindingMutation.mutateAsync({
                    clientId,
                    title: `${findingForm.controlId} Assessment Failure`,
                    description: findingForm.observation,
                    severity: severityMap[findingForm.riskLevel] || 'low',
                });
            }

            toast.success("Finding Logged Successfully");
            setIsAddFindingOpen(false);
            utils.federal.getSarFindings.invalidate();
            setFindingForm({
                controlId: "",
                observation: "",
                result: "Satisfied",
                riskLevel: "Low"
            });
        } catch (e) {
            toast.error("Failed to log finding.");
        } finally {
            setIsSaving(false);
        }
    };

    // Derived stats - Dynamic based on Implement Phase mappings and SAR Findings!
    const openPoamItems = poams?.reduce((acc: number, p: any) => acc + (p.openItems || 0), 0) || 0;

    const systemControls = (implementData?.items?.controls as any[]) || [];
    const totalControls = systemControls.length > 0 ? systemControls.length : (sarFindings?.length > 0 ? sarFindings.length : 325);

    // Use actual SAR Findings to drive the Findings Summary
    const highFindings = sarFindings?.filter((f: any) => f.riskLevel?.toLowerCase() === 'high' || f.vulnerabilitySeverity?.toLowerCase() === 'high').length || 0;
    const medFindings = sarFindings?.filter((f: any) => f.riskLevel?.toLowerCase() === 'moderate' || f.vulnerabilitySeverity?.toLowerCase() === 'moderate' || f.riskLevel?.toLowerCase() === 'medium').length || 0;
    const lowFindings = sarFindings?.filter((f: any) => f.riskLevel?.toLowerCase() === 'low' || f.vulnerabilitySeverity?.toLowerCase() === 'low').length || 0;

    const progressPercent = 0; // Keeping as dummy variable to prevent typescript errors below if missed, actually we can just remove it.

    return (
        <NIST80037Layout>
            <div className="space-y-8 w-full pb-20">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                        { label: "SP 800-37 (RMF)", href: `/clients/${clientId}/nist/rmf` },
                        { label: "Step 4: Assess" }
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-amber-600 text-white font-black px-3">STEP 4</Badge>
                            <Badge variant="outline" className="border-amber-200 text-amber-700 font-bold uppercase tracking-widest text-[10px]">Assessment Phase</Badge>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
                            <ClipboardList className="w-10 h-10 text-amber-600" />
                            Control Assessment
                        </h1>
                        <p className="text-slate-500 text-lg font-medium max-w-3xl leading-relaxed">
                            Assess the controls to determine if the controls are implemented correctly, operating as intended, and producing the desired outcomes.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Link href={`/clients/${clientId}/federal/sar`}>
                            <Button variant="outline" className="rounded-2xl h-14 px-6 font-bold border-2 border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all">
                                View / Generate SAR
                            </Button>
                        </Link>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-amber-600 hover:bg-amber-700 rounded-2xl h-14 px-8 shadow-xl shadow-amber-200/50 font-black text-lg gap-2"
                        >
                            {isSaving ? "Finalizing..." : <><ShieldCheck className="w-5 h-5" /> Finalize Results</>}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Assessment Sidebar */}
                    <div className="lg:col-span-1 space-y-6">


                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white">
                            <CardHeader>
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Findings Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { label: "High Risk", count: highFindings, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50" },
                                    { label: "Moderate Risk", count: medFindings, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
                                    { label: "Low Risk", count: lowFindings, icon: AlertCircle, color: "text-blue-500", bg: "bg-blue-50" }
                                ].map((item, i) => (
                                    <div key={i} className={cn("flex items-center justify-between p-3 rounded-xl", item.bg)}>
                                        <div className="flex items-center gap-3">
                                            <item.icon className={cn("w-4 h-4", item.color)} />
                                            <span className="text-sm font-bold text-slate-600">{item.label}</span>
                                        </div>
                                        <Badge variant="secondary" className="font-black bg-white">{item.count}</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-3">
                        <Tabs defaultValue="plan" className="w-full">
                            <div className="border-b px-8 bg-slate-50/50">
                                <TabsList className="h-16 bg-transparent gap-8">
                                    <TabsTrigger value="plan" className="data-[state=active]:bg-transparent data-[state=active]:text-amber-700 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        Assessment Plan
                                    </TabsTrigger>
                                    <TabsTrigger value="results" className="data-[state=active]:bg-transparent data-[state=active]:text-amber-700 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        Verification Results
                                    </TabsTrigger>
                                    <TabsTrigger value="sar" className="data-[state=active]:bg-transparent data-[state=active]:text-amber-700 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        SAR & Remediation
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="pb-8">
                                <TabsContent value="plan" className="p-10 space-y-10 m-0">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <div className="space-y-1">
                                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Assessment Planning</h3>
                                                <p className="text-slate-500 font-medium">Select assessors and define the technical testing methodology.</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button onClick={openEditPlan} variant="outline" className="rounded-xl border-slate-200 font-bold h-11 text-slate-600">
                                                    Configure Plan
                                                </Button>
                                                <Link href={`/clients/${clientId}/federal/sar`}>
                                                    <Button className="bg-amber-600 hover:bg-amber-700 rounded-xl gap-2 font-bold h-11">
                                                        <Plus className="w-4 h-4" /> Generate Rules
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Card className="bg-slate-50 border-none rounded-[2rem] p-6 space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-black text-slate-900 flex items-center gap-2">
                                                        <Users className="w-5 h-5 text-indigo-500" />
                                                        Assessment Team
                                                    </h4>
                                                </div>
                                                <div className="space-y-3">
                                                    {assessmentTeam.length > 0 ? assessmentTeam.map((member: { name: string, role: string }, i: number) => (
                                                        <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                            <span className="text-sm font-bold text-slate-700">{member.name}</span>
                                                            <Badge variant="outline" className="text-[10px] font-black border-slate-200 bg-slate-50">{member.role}</Badge>
                                                        </div>
                                                    )) : (
                                                        <p className="text-sm text-slate-400 font-medium italic">No team members assigned.</p>
                                                    )}
                                                </div>
                                            </Card>

                                            <Card className="bg-slate-50 border-none rounded-[2rem] p-6 space-y-4">
                                                <h4 className="font-black text-slate-900 flex items-center gap-2">
                                                    <Activity className="w-5 h-5 text-emerald-500" />
                                                    Testing Scope
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {testingScope.length > 0 ? testingScope.map((t: string, i: number) => (
                                                        <Badge key={i} className="bg-white text-slate-600 border border-slate-200 font-bold px-3 py-1.5 shadow-sm">
                                                            {t}
                                                        </Badge>
                                                    )) : (
                                                        <p className="text-sm text-slate-400 font-medium italic">No testing methodology defined.</p>
                                                    )}
                                                </div>
                                            </Card>
                                        </div>

                                        <div className="p-8 bg-slate-900 rounded-[3rem] text-white space-y-6 relative overflow-hidden">
                                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                                <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center border border-white/20">
                                                    <Zap className="w-8 h-8 text-amber-400" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <h4 className="text-xl font-black tracking-tight">AI Assessment Support</h4>
                                                    <p className="text-slate-400 font-medium">Auto-generate assessment test cases based on control implementation narratives.</p>
                                                </div>
                                                <Button
                                                    onClick={() => {
                                                        toast.success("AI Assessment Initiated", { description: "Generating automated test plans based on existing documentation..." })
                                                    }}
                                                    className="bg-amber-500 hover:bg-amber-600 rounded-xl font-bold h-12 px-6 shadow-xl shadow-amber-500/20"
                                                >
                                                    Deploy AI Assessor
                                                </Button>
                                            </div>
                                            <Library className="absolute -bottom-20 -right-20 w-80 h-80 text-white/5 rotate-12" />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="results" className="p-10 space-y-8 m-0">
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Verification Activities</h3>
                                            <p className="text-sm text-slate-500 font-medium">Records and results for each control verification step.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={() => setIsAddFindingOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold h-10 px-4">
                                                <Plus className="w-4 h-4 mr-2" /> Log Finding
                                            </Button>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input placeholder="Filter controls..." className="pl-9 h-10 w-64 rounded-xl border-slate-200" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {(sarFindings && sarFindings.length > 0 ? sarFindings : []).map((ctrl: any, i: number) => (
                                            <div key={i} className="p-6 bg-white border rounded-[2.5rem] flex items-center justify-between hover:shadow-lg transition-all group">
                                                <div className="flex items-center gap-5">
                                                    <div className={cn(
                                                        "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all",
                                                        ctrl.result === 'Satisfied' || ctrl.result === 'Pass' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                                            ctrl.result === 'Other than Satisfied' || ctrl.result === 'Fail' ? "bg-rose-50 border-rose-100 text-rose-600" :
                                                                "bg-slate-50 border-slate-100 text-slate-400"
                                                    )}>
                                                        <span className="font-black text-lg tracking-tighter">{ctrl.controlId}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-black text-slate-900">{ctrl.controlId} Verification</h4>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                            {ctrl.observation || "No observation recorded."}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <Badge className={cn(
                                                        "font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest",
                                                        ctrl.result === 'Satisfied' || ctrl.result === 'Pass' ? "bg-emerald-500 text-white" :
                                                            ctrl.result === 'Other than Satisfied' || ctrl.result === 'Fail' ? "bg-rose-500 text-white" :
                                                                "bg-slate-200 text-slate-500"
                                                    )}>{ctrl.result}</Badge>
                                                    <Button
                                                        onClick={() => setLocation(`/clients/${clientId}/nist/rmf/assess/details/${ctrl.controlId}`)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-xl h-10 w-10 text-slate-300 hover:text-indigo-600"
                                                    >
                                                        <ArrowRight className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="sar" className="p-10 space-y-10 m-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="md:col-span-2 space-y-6">
                                            <div className="p-10 bg-slate-900 rounded-[3.5rem] text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
                                                <div className="relative z-10 w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center border border-white/20">
                                                    <FileCheck className="w-12 h-12 text-amber-400" />
                                                </div>
                                                <div className="relative z-10 space-y-4">
                                                    <h3 className="text-3xl font-black tracking-tighter">Security Assessment Report (SAR)</h3>
                                                    <p className="text-slate-400 font-medium max-w-xl leading-relaxed">
                                                        The official record of assessment findings, risks, and recommendations. Finalization of the SAR initiates the authorization phase.
                                                    </p>
                                                    <div className="flex gap-4 pt-2">
                                                        <Link href={`/clients/${clientId}/federal/findings`}>
                                                            <Button className="bg-white text-slate-900 hover:bg-slate-100 rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs border-none shadow-lg">
                                                                Review Findings
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            onClick={() => toast.success("Exporting SAR Document...")}
                                                            className="bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs shadow-lg"
                                                        >
                                                            Export SAR (DOCX)
                                                        </Button>
                                                    </div>
                                                </div>
                                                <FileSearch className="absolute -bottom-20 -right-20 w-80 h-80 text-white/5 rotate-12" />
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-200 space-y-4">
                                            <Label className="text-sm font-black uppercase tracking-widest text-slate-500">Remediation Status (A-3)</Label>
                                            <div className="space-y-3">
                                                <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Flag className="w-4 h-4 text-rose-500" />
                                                        <span className="text-sm font-bold">New Findings for POA&M</span>
                                                    </div>
                                                    <Badge className="bg-rose-500 text-white font-black">{openPoamItems} OPEN</Badge>
                                                </div>
                                                <Link href={`/clients/${clientId}/federal/poam`}>
                                                    <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-xl h-12 font-bold gap-2 shadow-lg shadow-slate-200/50 transition-all">
                                                        <Plus className="w-4 h-4" /> Manage POA&M Items
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-200 space-y-4">
                                            <Label className="text-sm font-black uppercase tracking-widest text-slate-500">Assessment Milestone</Label>
                                            <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-500">SAR Finalized</span>
                                                    <Badge variant="outline" className={cn("font-black border-slate-100", latestSAR?.status === 'finalized' ? "text-emerald-500" : "text-slate-400")}>
                                                        {latestSAR?.status === 'finalized' ? "COMPLETED" : "PENDING"}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-500">Assessor Signature</span>
                                                    <Badge variant="outline" className={cn("font-black border-slate-100", latestSAR?.assessorName ? "text-emerald-500" : "text-slate-400")}>
                                                        {latestSAR?.assessorName ? "COLLECTED" : "PENDING"}
                                                    </Badge>
                                                </div>
                                                <Progress value={latestSAR?.status === 'finalized' ? 100 : 0} className="h-1.5" />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>
                </div>

                {/* Edit Assessment Plan Dialog */}
                <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
                    <DialogContent className="max-w-3xl p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
                        <DialogHeader className="p-8 pb-4 bg-slate-50 border-b border-slate-100">
                            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <Users className="w-6 h-6 text-amber-600" />
                                Configure Assessment Plan
                            </DialogTitle>
                            <DialogDescription className="font-medium text-slate-500">
                                Define the assessment team and the technical verification methodologies to be used.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="p-8 space-y-8 bg-white">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Assessment Team</Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-xl border-slate-200 text-slate-600 shadow-sm"
                                        onClick={() => setEditTeam([...editTeam, { name: "", role: "Assessor" }])}
                                    >
                                        <Plus className="w-3 h-3 mr-1" /> Add Member
                                    </Button>
                                </div>
                                <div className="space-y-3 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 placeholder:text-slate-400">
                                    {editTeam.length > 0 ? editTeam.map((member, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Input
                                                className="bg-white border-slate-200 h-11 rounded-xl font-medium"
                                                placeholder="Member name..."
                                                value={member.name}
                                                onChange={(e) => {
                                                    const newTeam = [...editTeam];
                                                    newTeam[i].name = e.target.value;
                                                    setEditTeam(newTeam);
                                                }}
                                            />
                                            <Input
                                                className="bg-white border-slate-200 h-11 rounded-xl font-medium w-1/3"
                                                placeholder="Role (e.g., Lead Auditor)"
                                                value={member.role}
                                                onChange={(e) => {
                                                    const newTeam = [...editTeam];
                                                    newTeam[i].role = e.target.value;
                                                    setEditTeam(newTeam);
                                                }}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 shrink-0"
                                                onClick={() => setEditTeam(editTeam.filter((_, idx) => idx !== i))}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )) : (
                                        <p className="text-sm font-medium text-slate-500 text-center py-2">No team members added yet.</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Testing Scope & Methodology</Label>
                                <Textarea
                                    className="min-h-[100px] border-slate-200 rounded-[1.5rem] p-4 bg-slate-50 font-medium"
                                    placeholder="e.g. Vulnerability Scan, Code Review, Interview, SOP Walkthrough (comma separated)"
                                    value={editScope}
                                    onChange={(e) => setEditScope(e.target.value)}
                                />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Separate methodologies with commas
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between sm:justify-between shrink-0">
                            <Button
                                variant="ghost"
                                onClick={() => setIsEditPlanOpen(false)}
                                className="font-bold text-slate-500 hover:text-slate-900"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSavePlan}
                                disabled={isSaving}
                                className="bg-amber-600 hover:bg-amber-700 font-bold rounded-xl h-11 px-6 text-white shadow-lg shadow-amber-600/20"
                            >
                                {isSaving ? "Saving..." : "Save Assessment Plan"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Log Finding Dialog */}
                <Dialog open={isAddFindingOpen} onOpenChange={setIsAddFindingOpen}>
                    <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
                        <DialogHeader className="p-8 pb-4 bg-slate-50 border-b border-slate-100">
                            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <Plus className="w-6 h-6 text-amber-600" />
                                Log Assessment Finding
                            </DialogTitle>
                        </DialogHeader>

                        <div className="p-8 space-y-6 bg-white">
                            <div className="space-y-4">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Control ID</Label>
                                <Input
                                    className="bg-slate-50 border-slate-200 h-11 rounded-xl font-medium"
                                    placeholder="e.g., AC-2"
                                    value={findingForm.controlId}
                                    onChange={(e) => setFindingForm({ ...findingForm, controlId: e.target.value })}
                                />
                            </div>

                            <div className="space-y-4">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Result</Label>
                                <div className="flex gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setFindingForm({ ...findingForm, result: 'Satisfied' })}
                                        className={cn(
                                            "flex-1 h-12 rounded-xl font-bold border-2 transition-all",
                                            findingForm.result === 'Satisfied' ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "border-slate-200 text-slate-500 bg-white"
                                        )}
                                    >
                                        Satisfied
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setFindingForm({ ...findingForm, result: 'Other than Satisfied' })}
                                        className={cn(
                                            "flex-1 h-12 rounded-xl font-bold border-2 transition-all",
                                            findingForm.result === 'Other than Satisfied' ? "bg-rose-50 border-rose-500 text-rose-700" : "border-slate-200 text-slate-500 bg-white"
                                        )}
                                    >
                                        Other than Satisfied
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Risk Level</Label>
                                <div className="flex gap-4">
                                    {['Low', 'Moderate', 'High'].map((level) => (
                                        <Button
                                            key={level}
                                            variant="outline"
                                            onClick={() => setFindingForm({ ...findingForm, riskLevel: level })}
                                            className={cn(
                                                "flex-1 h-12 rounded-xl font-bold border-2 transition-all",
                                                findingForm.riskLevel === level
                                                    ? (level === 'High' ? "bg-rose-50 border-rose-500 text-rose-700" : level === 'Moderate' ? "bg-amber-50 border-amber-500 text-amber-700" : "bg-blue-50 border-blue-500 text-blue-700")
                                                    : "border-slate-200 text-slate-500 bg-white"
                                            )}
                                        >
                                            {level}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Observation</Label>
                                <Textarea
                                    className="min-h-[100px] border-slate-200 rounded-[1.5rem] p-4 bg-slate-50 font-medium"
                                    placeholder="Describe the assessment findings and testing details..."
                                    value={findingForm.observation}
                                    onChange={(e) => setFindingForm({ ...findingForm, observation: e.target.value })}
                                />
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                            <Button
                                variant="ghost"
                                onClick={() => setIsAddFindingOpen(false)}
                                className="font-bold text-slate-500 hover:text-slate-900"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveNewFinding}
                                disabled={isSaving || !findingForm.controlId || !findingForm.observation}
                                className="bg-amber-600 hover:bg-amber-700 font-bold rounded-xl h-11 px-6 text-white shadow-lg shadow-amber-600/20"
                            >
                                {isSaving ? "Saving..." : "Log verified finding"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </NIST80037Layout>
    );
}
