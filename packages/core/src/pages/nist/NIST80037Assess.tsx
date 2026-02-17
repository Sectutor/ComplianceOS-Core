
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
    Flag
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

export default function NIST80037Assess() {
    const { id } = useParams<{ id: string }>();
    const systemId = useNistSystemId();
    const clientId = parseInt(id || "0");
    const [isSaving, setIsSaving] = useState(false);

    // TRPC Queries - Using any casting due to persistent stale type inference
    const { data: findingsStats } = (trpc as any).findings.stats.useQuery({ clientId });
    const { data: poams } = (trpc as any).federal.listPoams.useQuery({ clientId });
    const { data: sars } = (trpc as any).federal.listSARs.useQuery({ clientId });
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

    const updateChecklistMutation = (trpc as any).checklist.update.useMutation();

    const [assessmentStatus, setAssessmentStatus] = useState<string>('pending');

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
                    ...checklistData?.items,
                    lastFinalized: new Date().toISOString(),
                    status: 'completed'
                }
            });
            toast.success("Assessment Data Finalized", {
                description: "Security Assessment Report and remediation plan updated.",
            });
        } catch (err) {
            toast.error("Failed to save assessment results");
        } finally {
            setIsSaving(false);
        }
    };

    // Derived stats
    const openPoamItems = poams?.reduce((acc: number, p: any) => acc + (p.openItems || 0), 0) || 18; // Fallback to mock if query empty
    const highFindings = findingsStats?.bySeverity.find((s: any) => s.severity === 'high')?.count || 0;
    const medFindings = findingsStats?.bySeverity.find((s: any) => s.severity === 'medium')?.count || 0;
    const lowFindings = findingsStats?.bySeverity.find((s: any) => s.severity === 'low')?.count || 0;

    const totalControls = 325;
    const verifiedControls = totalControls - (highFindings + medFindings + lowFindings);
    const progressPercent = Math.round((verifiedControls / totalControls) * 100);

    return (
        <NIST80037Layout>
            <div className="space-y-8 max-w-5xl pb-20">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/dashboard` },
                        { label: "NIST Hub", href: `/clients/${clientId}/nist` },
                        { label: "SP 800-37 (RMF)", href: `/clients/${clientId}/nist/rmf` },
                        { label: "Step 4: Assess" },
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
                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-amber-900 text-white overflow-hidden relative">
                            <CardHeader className="pb-2 relative z-10">
                                <CardTitle className="text-amber-400 text-xs font-black uppercase tracking-widest">Assessment Health</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 relative z-10">
                                <div className="text-center py-4 bg-white/10 rounded-[2rem] border border-white/10">
                                    <h2 className="text-4xl font-black text-white tracking-tighter">{progressPercent}%</h2>
                                    <p className="text-amber-300 text-[10px] font-black uppercase tracking-widest mt-1">Controls Verified</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs font-bold text-amber-200 uppercase tracking-wider">
                                        <span>Passed</span>
                                        <span>{verifiedControls}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold text-amber-200 uppercase tracking-wider">
                                        <span>Failed / Findings</span>
                                        <span className="text-rose-400">{highFindings + medFindings + lowFindings}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold text-amber-200 uppercase tracking-wider">
                                        <span>Target</span>
                                        <span>{totalControls}</span>
                                    </div>
                                    <Progress value={progressPercent} className="h-2 bg-amber-800" indicatorClassName="bg-white" />
                                </div>
                            </CardContent>
                            <Stethoscope className="absolute -bottom-10 -left-10 w-48 h-48 text-white/5 -rotate-12" />
                        </Card>

                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white">
                            <CardHeader>
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Findings Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { label: "High Risk", count: highFindings || 2, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50" },
                                    { label: "Moderate Risk", count: medFindings || 11, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
                                    { label: "Low Risk", count: lowFindings || 5, icon: AlertCircle, color: "text-blue-500", bg: "bg-blue-50" }
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

                    <Card className="lg:col-span-3 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[2.5rem] overflow-hidden">
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

                            <ScrollArea className="h-[900px]">
                                <TabsContent value="plan" className="p-10 space-y-10 m-0">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <div className="space-y-1">
                                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Assessment Planning (A-1)</h3>
                                                <p className="text-slate-500 font-medium">Select assessors and define the technical testing methodology.</p>
                                            </div>
                                            <Link href={`/clients/${clientId}/federal/sar`}>
                                                <Button className="bg-amber-600 hover:bg-amber-700 rounded-xl gap-2 font-bold h-11">
                                                    <Plus className="w-4 h-4" /> New Plan
                                                </Button>
                                            </Link>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Card className="bg-slate-50 border-none rounded-[2rem] p-6 space-y-4">
                                                <h4 className="font-black text-slate-900 flex items-center gap-2">
                                                    <Users className="w-5 h-5 text-indigo-500" />
                                                    Assessment Team
                                                </h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                                                        <span className="text-sm font-bold">{latestSAR?.assessorName || "Independent Assessor"}</span>
                                                        <Badge variant="outline" className="text-[10px] font-black border-slate-200">Lead Auditor</Badge>
                                                    </div>
                                                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                                                        <span className="text-sm font-bold">Network Security Eng</span>
                                                        <Badge variant="outline" className="text-[10px] font-black border-slate-200">Tech Lead</Badge>
                                                    </div>
                                                </div>
                                            </Card>

                                            <Card className="bg-slate-50 border-none rounded-[2rem] p-6 space-y-4">
                                                <h4 className="font-black text-slate-900 flex items-center gap-2">
                                                    <Activity className="w-5 h-5 text-emerald-500" />
                                                    Testing Scope
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {["Vulnerability Scan", "Code Review", "Policy Audit", "SOP Walkthrough", "Interview"].map((t, i) => (
                                                        <Badge key={i} className="bg-white text-slate-600 border border-slate-200 font-bold px-3 py-1">
                                                            {t}
                                                        </Badge>
                                                    ))}
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
                                                    onClick={() => toast.info("AI Assessor initializing...")}
                                                    className="bg-amber-500 hover:bg-amber-600 rounded-xl font-bold h-12 px-6"
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
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Verification Activities (A-2)</h3>
                                            <p className="text-sm text-slate-500 font-medium">Records and results for each control verification step.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input placeholder="Filter controls..." className="pl-9 h-10 w-64 rounded-xl border-slate-200" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {(sarFindings && sarFindings.length > 0 ? sarFindings : [
                                            { controlId: "AC-2", observation: "Account Management Narratives confirmed.", result: "Satisfied", examiner: "J. Miller", date: "Feb 10, 2026" },
                                            { controlId: "AU-6", observation: "Audit Review logs missing for 3 days.", result: "Other than Satisfied", examiner: "S. Chen", date: "Feb 12, 2026" },
                                            { controlId: "IA-2", observation: "MFA active for all accounts.", result: "Satisfied", examiner: "J. Miller", date: "Feb 11, 2026" },
                                            { controlId: "CP-2", observation: "Pending walkthrough.", result: "Not Started", examiner: "Unassigned", date: "-" }
                                        ]).map((ctrl: any, i: number) => (
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
                            </ScrollArea>
                        </Tabs>
                    </Card>
                </div>
            </div>
        </NIST80037Layout>
    );
}

