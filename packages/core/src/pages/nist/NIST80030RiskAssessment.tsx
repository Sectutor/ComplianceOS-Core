
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    Target,
    Search,
    Filter,
    Plus,
    AlertTriangle,
    ChevronRight,
    ArrowRight,
    ShieldAlert,
    Activity,
    FileText,
    Brain,
    Sparkles,
    Loader2,
    Calendar,
    Users
} from "lucide-react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import NIST80030Layout from "./NIST80030Layout";
import { useNistSystemId } from "./useNistSystem";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@complianceos/ui/ui/dialog";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@complianceos/ui/ui/select";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import { Breadcrumb } from "@/components/Breadcrumb";

export default function NIST80030RiskAssessment() {
    const { id } = useParams<{ id: string }>();
    const systemId = useNistSystemId();
    const clientId = parseInt(id || "0");
    const utils = trpc.useUtils();

    const [searchQuery, setSearchQuery] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedRisk, setSelectedRisk] = useState<any>(null);

    // Form State (NIST 800-30 specific)
    const [title, setTitle] = useState("");
    const [threatDescription, setThreatDescription] = useState("");
    const [vulnerabilityDescription, setVulnerabilityDescription] = useState("");
    const [likelihood, setLikelihood] = useState(3);
    const [impact, setImpact] = useState(3);
    const [status, setStatus] = useState<"draft" | "approved" | "reviewed">("draft");
    const [riskOwner, setRiskOwner] = useState("");
    const [recommendedActions, setRecommendedActions] = useState("");

    // Queries
    const { data: risks, isLoading: loadingRisks } = trpc.risks.list.useQuery({
        clientId,
        search: searchQuery,
        limit: 100
    });

    const upsertMutation = trpc.risks.upsert.useMutation({
        onSuccess: () => {
            toast.success(selectedRisk ? "Risk updated" : "Risk created");
            utils.risks.list.invalidate({ clientId });
            setIsAddOpen(false);
            resetForm();
        },
        onError: (err) => {
            toast.error(`Error: ${err.message}`);
        }
    });

    const resetForm = () => {
        setSelectedRisk(null);
        setTitle("");
        setThreatDescription("");
        setVulnerabilityDescription("");
        setLikelihood(3);
        setImpact(3);
        setStatus("draft");
        setRiskOwner("");
        setRecommendedActions("");
    };

    const handleOpenEdit = (risk: any) => {
        setSelectedRisk(risk);
        setTitle(risk.title);
        setThreatDescription(risk.threatDescription || "");
        setVulnerabilityDescription(risk.vulnerabilityDescription || "");
        setLikelihood(Number(risk.likelihood));
        setImpact(Number(risk.impact));
        setStatus(risk.status);
        setRiskOwner(risk.riskOwner || "");
        setRecommendedActions(risk.recommendedActions || "");
        setIsAddOpen(true);
    };

    const handleSave = () => {
        if (!title) {
            toast.error("Please provide a risk title");
            return;
        }

        upsertMutation.mutate({
            id: selectedRisk?.id,
            clientId,
            title,
            threatDescription,
            vulnerabilityDescription,
            likelihood,
            impact,
            status,
            riskOwner,
            recommendedActions,
            method: "NIST SP 800-30"
        });
    };

    const getRiskLevelBadge = (score: number) => {
        if (score >= 15) return <Badge className="bg-rose-500 text-white font-black uppercase text-[10px] tracking-widest border-none">Very High</Badge>;
        if (score >= 10) return <Badge className="bg-orange-500 text-white font-black uppercase text-[10px] tracking-widest border-none">High</Badge>;
        if (score >= 5) return <Badge className="bg-amber-500 text-white font-black uppercase text-[10px] tracking-widest border-none">Medium</Badge>;
        return <Badge className="bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest border-none">Low</Badge>;
    };

    return (
        <NIST80030Layout>
            <div className="space-y-6">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/dashboard` },
                        { label: "NIST Hub", href: `/clients/${clientId}/nist` },
                        { label: "SP 800-30 Risk Assessment" },
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            <Target className="w-8 h-8 text-indigo-600" />
                            NIST SP 800-30 Risk Assessment
                        </h1>
                        <p className="text-slate-500 mt-1 uppercase text-xs font-bold tracking-widest flex items-center gap-2">
                            Guide for Conducting Risk Assessments
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => {
                                resetForm();
                                setIsAddOpen(true);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200/50"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Assessment
                        </Button>
                        <Button variant="outline" className="rounded-xl border-slate-200">
                            <Sparkles className="w-4 h-4 mr-2 text-indigo-500" />
                            AI Threat Discovery
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/50 backdrop-blur-sm">
                        <CardHeader className="pb-3 border-b border-slate-100/50">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Risk Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                                        Very High
                                    </span>
                                    <span className="text-sm font-black text-slate-900">
                                        {risks?.items.filter(r => r.inherentScore >= 15).length || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                                        High
                                    </span>
                                    <span className="text-sm font-black text-slate-900">
                                        {risks?.items.filter(r => r.inherentScore >= 10 && r.inherentScore < 15).length || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        Medium
                                    </span>
                                    <span className="text-sm font-black text-slate-900">
                                        {risks?.items.filter(r => r.inherentScore >= 5 && r.inherentScore < 10).length || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        Low
                                    </span>
                                    <span className="text-sm font-black text-slate-900">
                                        {risks?.items.filter(r => r.inherentScore < 5).length || 0}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-gradient-to-br from-indigo-600 to-violet-700 text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700" />
                        <CardHeader className="relative z-10">
                            <CardTitle className="text-white/60 text-xs font-black uppercase tracking-widest">Methodology Overview</CardTitle>
                            <CardDescription className="text-white/80 text-lg font-bold">
                                SP 800-30 leverages a 9-step analysis process to identify and prioritize risks to organizational operations and assets.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10 pt-0">
                            <div className="grid grid-cols-3 gap-4 mt-2">
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Threats</h4>
                                    <p className="text-xl font-bold">Step 1-2</p>
                                </div>
                                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Impact</h4>
                                    <p className="text-xl font-bold">Step 3-7</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Output</h4>
                                    <p className="text-xl font-bold">Step 8-9</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            className="pl-11 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-indigo-500/20 transition-all font-medium"
                            placeholder="Filter risk assessments by ID, title, or threat actor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {loadingRisks ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading risk register...</p>
                        </div>
                    ) : (risks?.items?.length || 0) === 0 ? (
                        <div className="text-center py-32 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                            <Target className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Register is Empty</h3>
                            <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto">
                                Start your first NIST 800-30 assessment to build your organizational risk profile.
                            </p>
                            <Button
                                onClick={() => setIsAddOpen(true)}
                                className="mt-8 bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 px-10 shadow-xl shadow-indigo-200/50 font-black"
                            >
                                <Plus className="w-5 h-5 mr-3" />
                                Initiate Assessment
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {risks?.items.map((risk: any) => (
                                <div
                                    key={risk.id}
                                    onClick={() => handleOpenEdit(risk)}
                                    className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-500" />

                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="space-y-2 pr-16 w-full">
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-black tracking-tighter text-indigo-600">{risk.assessmentId}</span>
                                                {getRiskLevelBadge(risk.inherentScore)}
                                                <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400 border-slate-200">{risk.status}</Badge>
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">
                                                {risk.title}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                        <ShieldAlert className="w-3 h-3" />
                                                        Threat Agent
                                                    </span>
                                                    <p className="text-sm font-bold text-slate-600 line-clamp-1">{risk.threatDescription || "Not defined"}</p>
                                                </div>
                                                <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Vulnerability
                                                    </span>
                                                    <p className="text-sm font-bold text-slate-600 line-clamp-1">{risk.vulnerabilityDescription || "Not defined"}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <Button size="icon" variant="ghost" className="rounded-2xl bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm h-12 w-12 shrink-0">
                                            <ChevronRight className="w-6 h-6" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="max-w-5xl p-0 overflow-hidden border-none rounded-[40px] shadow-2xl h-[92vh] flex flex-col">
                        <DialogHeader className="p-10 bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 text-white relative shrink-0">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                    <Target className="w-8 h-8 text-indigo-400" />
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400/80">Risk Assessment Wizard</span>
                                    <h4 className="text-sm font-bold text-white/60">NIST SP 800-30 METHODOLOGY</h4>
                                </div>
                            </div>
                            <DialogTitle className="text-4xl font-black tracking-tighter leading-[1.1]">
                                {selectedRisk ? "Edit Assessment" : "Initiate New Assessment"}
                            </DialogTitle>
                            <DialogDescription className="text-indigo-100/60 text-lg mt-4 leading-relaxed">
                                Identify threats, vulnerabilities, and determine organizational impact following standard NIST guidelines.
                            </DialogDescription>
                        </DialogHeader>

                        <ScrollArea className="flex-1 bg-slate-50">
                            <div className="p-10 space-y-12">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black">1</div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Risk Identification</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Risk Title</Label>
                                        <Input
                                            className="h-16 px-6 rounded-3xl border-none shadow-sm bg-white font-bold text-lg text-slate-700 focus-visible:ring-indigo-500/10 transition-all"
                                            placeholder="e.g., Unauthorized Access to Financial SQL Database"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                                                <ShieldAlert className="w-3 h-3" />
                                                Threat Source & Event
                                            </Label>
                                            <Textarea
                                                className="min-h-[120px] rounded-[2rem] border-none shadow-sm bg-white p-6 focus-visible:ring-indigo-500/10 text-slate-700 leading-relaxed font-medium"
                                                placeholder="Who or what can cause damage? (e.g., Insider threat, script kiddie, natural disaster)..."
                                                value={threatDescription}
                                                onChange={(e) => setThreatDescription(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                                                <AlertTriangle className="w-3 h-3" />
                                                Vulnerability / Condition
                                            </Label>
                                            <Textarea
                                                className="min-h-[120px] rounded-[2rem] border-none shadow-sm bg-white p-6 focus-visible:ring-indigo-500/10 text-slate-700 leading-relaxed font-medium"
                                                placeholder="Flaw or weakness in system security? (e.g., Unpatched OS, lack of MFA)..."
                                                value={vulnerabilityDescription}
                                                onChange={(e) => setVulnerabilityDescription(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-6 border-t border-slate-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black">2</div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Impact & Likelihood</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Adversarial Likelihood</Label>
                                                <Badge variant="outline" className="text-indigo-600 font-black">{likelihood}/5</Badge>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                step="1"
                                                value={likelihood}
                                                onChange={(e) => setLikelihood(parseInt(e.target.value))}
                                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                            <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                <span>Rare</span>
                                                <span>Almost Certain</span>
                                            </div>
                                        </div>
                                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Magnitude of Impact</Label>
                                                <Badge variant="outline" className="text-rose-600 font-black">{impact}/5</Badge>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                step="1"
                                                value={impact}
                                                onChange={(e) => setImpact(parseInt(e.target.value))}
                                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
                                            />
                                            <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                <span>Negligible</span>
                                                <span>Catastrophic</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-xl shadow-indigo-900/20">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                                                <Activity className="w-8 h-8 text-indigo-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-2xl font-black">Inherent Risk Score: {likelihood * impact}</h4>
                                                <p className="text-indigo-300/80 font-bold text-sm uppercase tracking-widest">Calculated NIST Risk Level</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {getRiskLevelBadge(likelihood * impact)}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-6 border-t border-slate-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black">3</div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Ownership & Action</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                                                <Users className="w-3 h-3" />
                                                Risk Owner
                                            </Label>
                                            <Input
                                                className="h-16 px-6 rounded-3xl border-none shadow-sm bg-white font-bold text-slate-700"
                                                placeholder="Department Lead or System Owner"
                                                value={riskOwner}
                                                onChange={(e) => setRiskOwner(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                Assessment Status
                                            </Label>
                                            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                                <SelectTrigger className="h-16 px-6 rounded-3xl border-none shadow-sm bg-white font-bold text-slate-700">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-3xl border-none shadow-2xl">
                                                    <SelectItem value="draft">Draft - Initial Evaluation</SelectItem>
                                                    <SelectItem value="approved">Approved - Risk Accepted/Mitigated</SelectItem>
                                                    <SelectItem value="reviewed">Reviewed - Periodic Monitoring</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                                            <FileText className="w-3 h-3" />
                                            Recommended Risk Treatment / Actions
                                        </Label>
                                        <Textarea
                                            className="min-h-[150px] rounded-[2.5rem] border-none shadow-sm bg-white p-8 focus-visible:ring-indigo-500/10 text-slate-700 leading-relaxed font-medium"
                                            placeholder="Steps to remediate, mitigate, or transfer this risk..."
                                            value={recommendedActions}
                                            onChange={(e) => setRecommendedActions(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        <DialogFooter className="p-8 bg-white border-t border-slate-100 flex items-center justify-between sm:justify-between shrink-0">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    resetForm();
                                    setIsAddOpen(false);
                                }}
                                className="rounded-2xl text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest"
                            >
                                Cancel Assessment
                            </Button>
                            <div className="flex gap-4">
                                <Button
                                    onClick={handleSave}
                                    disabled={upsertMutation.isPending}
                                    className="bg-indigo-600 hover:bg-indigo-700 rounded-[1.5rem] px-12 h-14 shadow-xl shadow-indigo-500/20 font-black text-lg"
                                >
                                    {upsertMutation.isPending ? "Evaluating..." : (selectedRisk ? "Commit Changes" : "Finalize Assessment")}
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </NIST80030Layout>
    );
}

// Wrap in layout
function NIST80030RiskAssessmentWrapper({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
