
import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from "wouter";
import NIST80030Layout from "./NIST80030Layout";
import { trpc } from "../../lib/trpc";
import { useNistSystemId } from "./useNistSystem";
import {
    BarChart3,
    Scale,
    Zap,
    AlertTriangle,
    Target,
    Shield,
    Eye,
    Activity,
    Building2,
    Users,
    Globe,
    TrendingUp,
    Save,
    ArrowRight,
    FileText,
    Lock,
    EarOff,
    RotateCcw,
    Database,
    Network,
    HardDrive,
    Landmark,
    Plus,
    Pencil,
    Trash2,
    X
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@complianceos/ui/ui/dialog";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAGNITUDE_LEVELS = ["Critical", "High", "Moderate", "Low", "Very Low"] as const;
const CIA_TYPES = ["Confidentiality", "Integrity", "Availability"] as const;
const FACTOR_TYPES = ["Amplifier", "Dampener"] as const;
const IMPACT_DOMAINS = ["Business Operations", "Corporate Assets", "Personnel Safety", "National Interests", "Public Safety", "Reputation"] as const;

const domainIcons: Record<string, any> = {
    "Business Operations": Building2,
    "Corporate Assets": HardDrive,
    "Personnel Safety": Users,
    "National Interests": Globe,
    "Public Safety": Shield,
    "Reputation": Eye,
};

const magnitudeColors: Record<string, { text: string; bg: string }> = {
    "Critical": { text: "text-rose-500", bg: "bg-rose-50" },
    "High": { text: "text-amber-500", bg: "bg-amber-50" },
    "Moderate": { text: "text-indigo-500", bg: "bg-indigo-50" },
    "Low": { text: "text-emerald-500", bg: "bg-emerald-50" },
    "Very Low": { text: "text-slate-400", bg: "bg-slate-50" },
};

export default function NIST80030ImpactAnalysis() {
    const { id } = useParams<{ id: string }>();
    const systemId = useNistSystemId();
    const clientId = parseInt(id || "0");
    const fismaSystemId = systemId;
    const utils = trpc.useUtils();

    // Queries
    const { data: impactAssessments = [], isLoading } = trpc.nist80030.listImpactAssessments.useQuery({ clientId, fismaSystemId });

    // Mutations
    const saveMutation = trpc.nist80030.saveImpactAssessment.useMutation({
        onSuccess: () => {
            utils.nist80030.listImpactAssessments.invalidate({ clientId, fismaSystemId });
            setDialogOpen(false);
            toast.success("Impact assessment saved");
        },
        onError: (err: any) => toast.error(`Failed to save: ${err.message}`)
    });

    const deleteMutation = trpc.nist80030.deleteImpactAssessment.useMutation({
        onSuccess: () => {
            utils.nist80030.listImpactAssessments.invalidate({ clientId });
            toast.success("Impact assessment deleted");
        }
    });

    // Separate domain-level impact assessments vs. contributing factors
    const domainAssessments = useMemo(() =>
        impactAssessments.filter((a: any) => !a.factorName),
        [impactAssessments]);

    // Reset state when systemId changes
    useEffect(() => {
        setDialogOpen(false);
        setEditing(null);
        setDomainForm({
            domain: "Business Operations",
            ciaType: "",
            magnitude: "Moderate",
            magnitudeScore: 50,
            description: "",
            rationale: "",
            estimatedDailyImpact: 0,
            revenueLossPct: 0,
            legalFinesPct: 0,
            brandEquityPct: 0,
        });
        setFactorForm({
            domain: "General",
            factorName: "",
            factorLevel: "High",
            factorType: "Amplifier",
            factorDescription: "",
            magnitude: "High",
            magnitudeScore: 0,
        });
        utils.nist80030.listImpactAssessments.invalidate({ clientId, fismaSystemId });
    }, [systemId, clientId, fismaSystemId, utils]);

    const contributingFactors = useMemo(() =>
        impactAssessments.filter((a: any) => !!a.factorName),
        [impactAssessments]);

    // Compute CIA summary from assessments
    const ciaSummary = useMemo(() => {
        const summary: Record<string, { score: number; count: number }> = {
            Confidentiality: { score: 0, count: 0 },
            Integrity: { score: 0, count: 0 },
            Availability: { score: 0, count: 0 },
        };
        impactAssessments.forEach((a: any) => {
            if (a.ciaType && summary[a.ciaType]) {
                summary[a.ciaType].score += (a.magnitudeScore || 0);
                summary[a.ciaType].count += 1;
            }
        });
        return Object.entries(summary).map(([label, data]) => ({
            label,
            val: data.count > 0 ? Math.round(data.score / data.count) : 0,
            color: label === 'Confidentiality' ? 'bg-indigo-500' : label === 'Integrity' ? 'bg-emerald-500' : 'bg-amber-500',
            icon: label === 'Confidentiality' ? Lock : label === 'Integrity' ? Shield : Activity
        }));
    }, [impactAssessments]);

    // Economic impact totals
    const economicImpact = useMemo(() => {
        const total = domainAssessments.reduce((acc: number, a: any) => acc + (a.estimatedDailyImpact || 0), 0);
        const revLoss = domainAssessments.length > 0 ?
            Math.round(domainAssessments.reduce((acc: number, a: any) => acc + (a.revenueLossPct || 0), 0) / domainAssessments.length) : 0;
        const legal = domainAssessments.length > 0 ?
            Math.round(domainAssessments.reduce((acc: number, a: any) => acc + (a.legalFinesPct || 0), 0) / domainAssessments.length) : 0;
        const brand = domainAssessments.length > 0 ?
            Math.round(domainAssessments.reduce((acc: number, a: any) => acc + (a.brandEquityPct || 0), 0) / domainAssessments.length) : 0;
        return { total, revLoss, legal, brand };
    }, [domainAssessments]);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'domain' | 'factor'>('domain');
    const [editing, setEditing] = useState<any>(null);

    // Domain form state
    const [domainForm, setDomainForm] = useState({
        domain: "Business Operations",
        ciaType: "" as string,
        magnitude: "Moderate",
        magnitudeScore: 50,
        description: "",
        rationale: "",
        estimatedDailyImpact: 0,
        revenueLossPct: 0,
        legalFinesPct: 0,
        brandEquityPct: 0,
    });

    // Factor form state
    const [factorForm, setFactorForm] = useState({
        domain: "General",
        factorName: "",
        factorLevel: "High",
        factorType: "Amplifier" as string,
        factorDescription: "",
        magnitude: "High",
        magnitudeScore: 0,
    });

    // Open new domain assessment
    const openNewDomain = () => {
        setEditing(null);
        setDialogMode('domain');
        setDomainForm({ domain: "Business Operations", ciaType: "", magnitude: "Moderate", magnitudeScore: 50, description: "", rationale: "", estimatedDailyImpact: 0, revenueLossPct: 0, legalFinesPct: 0, brandEquityPct: 0 });
        setDialogOpen(true);
    };

    const openEditDomain = (item: any) => {
        setEditing(item);
        setDialogMode('domain');
        setDomainForm({
            domain: item.domain || "Business Operations",
            ciaType: item.ciaType || "",
            magnitude: item.magnitude || "Moderate",
            magnitudeScore: item.magnitudeScore || 50,
            description: item.description || "",
            rationale: item.rationale || "",
            estimatedDailyImpact: item.estimatedDailyImpact || 0,
            revenueLossPct: item.revenueLossPct || 0,
            legalFinesPct: item.legalFinesPct || 0,
            brandEquityPct: item.brandEquityPct || 0,
        });
        setDialogOpen(true);
    };

    const openNewFactor = () => {
        setEditing(null);
        setDialogMode('factor');
        setFactorForm({ domain: "General", factorName: "", factorLevel: "High", factorType: "Amplifier", factorDescription: "", magnitude: "High", magnitudeScore: 0 });
        setDialogOpen(true);
    };

    const openEditFactor = (item: any) => {
        setEditing(item);
        setDialogMode('factor');
        setFactorForm({
            domain: item.domain || "General",
            factorName: item.factorName || "",
            factorLevel: item.factorLevel || "High",
            factorType: item.factorType || "Amplifier",
            factorDescription: item.factorDescription || "",
            magnitude: item.magnitude || "High",
            magnitudeScore: item.magnitudeScore || 0,
        });
        setDialogOpen(true);
    };

    const handleSave = () => {
        if (dialogMode === 'domain') {
            if (!domainForm.domain) { toast.error("Domain is required"); return; }
            saveMutation.mutate({
                clientId,
                id: editing?.id,
                ...domainForm,
                ciaType: domainForm.ciaType || undefined,
            });
        } else {
            if (!factorForm.factorName.trim()) { toast.error("Factor name is required"); return; }
            saveMutation.mutate({
                clientId,
                id: editing?.id,
                domain: factorForm.domain,
                magnitude: factorForm.magnitude,
                magnitudeScore: factorForm.magnitudeScore,
                factorName: factorForm.factorName,
                factorLevel: factorForm.factorLevel,
                factorType: factorForm.factorType,
                factorDescription: factorForm.factorDescription,
            });
        }
    };

    return (
        <NIST80030Layout>
            <div className="space-y-8 w-full px-4 sm:px-6 lg:px-8 pb-20">
                {/* Sticky Header */}
                <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 border-b border-slate-100">
                    <Breadcrumb
                        items={[
                            { label: "Dashboard", href: `/dashboard` },
                            { label: "NIST Hub", href: `/clients/${clientId}/nist` },
                            { label: "SP 800-30", href: `/clients/${clientId}/nist/800-30` },
                            { label: "Impact Analysis" },
                        ]}
                    />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-600 text-white font-black px-3 tracking-widest uppercase text-[10px]">Step 3</Badge>
                            <Badge variant="outline" className="border-indigo-200 text-indigo-700 font-bold uppercase tracking-widest text-[10px]">Harm Determination</Badge>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
                            <BarChart3 className="w-10 h-10 text-indigo-600" />
                            Impact Analysis
                        </h1>
                        <p className="text-slate-500 text-lg font-medium max-w-3xl leading-relaxed">
                            Determine the magnitude of harm that could result from the unauthorized disclosure, modification, or destruction of information.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={openNewFactor} variant="outline" className="rounded-2xl h-14 px-6 font-bold border-2 border-slate-100 hover:bg-slate-50 text-slate-600 gap-2">
                            <Plus className="w-4 h-4" /> Add Factor
                        </Button>
                        <Button onClick={openNewDomain} className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 px-8 shadow-xl shadow-indigo-200/50 font-black text-lg gap-2">
                            <Plus className="w-5 h-5" /> Add Assessment
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 2xl:grid-cols-5 gap-8">
                    {/* CIA Sidebar */}
                    <div className="lg:col-span-1 2xl:col-span-1 space-y-6 lg:sticky lg:top-24 lg:self-start">
                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Impact Summary (CIA)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-4">
                                {ciaSummary.map((cat, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <cat.icon className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-black text-slate-700">{cat.label}</span>
                                            </div>
                                            <Badge variant="secondary" className="font-black text-[10px]">
                                                {cat.val > 80 ? "Critical" : cat.val > 60 ? "High" : cat.val > 40 ? "Moderate" : cat.val > 0 ? "Low" : "N/A"}
                                            </Badge>
                                        </div>
                                        <Progress value={cat.val} className="h-1.5 bg-slate-100" indicatorClassName={cat.color} />
                                    </div>
                                ))}
                                <div className="pt-6 border-t">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Assessed Domains</p>
                                    <div className="flex flex-wrap gap-2">
                                        {domainAssessments.length > 0 ? (
                                            [...new Set(domainAssessments.map((a: any) => a.domain))].map((domain: any) => (
                                                <Badge key={domain} className="bg-slate-900 text-white rounded-lg text-[10px]">{domain}</Badge>
                                            ))
                                        ) : (
                                            <p className="text-xs text-slate-400">No domains assessed yet</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-indigo-900 text-white overflow-hidden relative">
                            <CardHeader>
                                <CardTitle className="text-indigo-400 text-xs font-black uppercase tracking-widest">Economic Harm Predictor</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 relative z-10">
                                <div className="text-center py-4">
                                    <p className="text-4xl font-black tracking-tighter">
                                        ${economicImpact.total > 0 ? (economicImpact.total / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
                                    </p>
                                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em] mt-1">Est. Daily Impact</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-indigo-300">Revenue Loss</span>
                                        <span className="font-bold">{economicImpact.revLoss}%</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-indigo-300">Legal/Fines</span>
                                        <span className="font-bold">{economicImpact.legal}%</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-indigo-300">Brand Equity</span>
                                        <span className="font-bold">{economicImpact.brand}%</span>
                                    </div>
                                </div>
                            </CardContent>
                            <Zap className="absolute -bottom-10 -left-10 w-48 h-48 text-white/5 -rotate-12" />
                        </Card>
                    </div>

                    <Card className="lg:col-span-3 2xl:col-span-4 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[2.5rem] overflow-hidden">
                        <Tabs defaultValue="magnitude" className="w-full">
                            <div className="border-b px-8 bg-slate-50/50">
                                <TabsList className="h-16 bg-transparent gap-8">
                                    <TabsTrigger value="magnitude" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-100 data-[state=active]:text-indigo-700 rounded-t-lg font-bold text-xs uppercase tracking-widest px-6 py-3 transition-all -mb-[2px]">
                                        Magnitude of Harm ({domainAssessments.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="factors" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-100 data-[state=active]:text-indigo-700 rounded-t-lg font-bold text-xs uppercase tracking-widest px-6 py-3 transition-all -mb-[2px]">
                                        Impact Factors ({contributingFactors.length})
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="magnitude" className="p-10 space-y-12 m-0">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Impact Determination (T-3)</h3>
                                        <p className="text-sm text-slate-500 font-medium">Assessing the overall magnitude of harm across multiple domains.</p>
                                    </div>
                                    <Button onClick={openNewDomain} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold h-10 px-4 gap-2">
                                        <Plus className="w-4 h-4" /> Add Assessment
                                    </Button>
                                </div>

                                {isLoading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-50 rounded-[3rem] animate-pulse" />)}
                                    </div>
                                ) : domainAssessments.length === 0 ? (
                                    <div className="text-center py-16 text-slate-400">
                                        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                                        <p className="font-bold text-lg">No impact assessments yet</p>
                                        <p className="text-sm mt-1">Create your first domain impact assessment</p>
                                        <Button onClick={openNewDomain} className="mt-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold gap-2">
                                            <Plus className="w-4 h-4" /> Add Assessment
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {domainAssessments.map((item: any) => {
                                            const Icon = domainIcons[item.domain] || Building2;
                                            const colors = magnitudeColors[item.magnitude] || magnitudeColors["Moderate"];
                                            return (
                                                <div key={item.id} className="p-8 bg-white border border-slate-100 rounded-[3rem] space-y-6 hover:shadow-xl transition-all group relative overflow-hidden">
                                                    <div className="flex items-center justify-between relative z-10">
                                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", colors.bg, colors.text)}>
                                                            <Icon className="w-7 h-7" />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className={cn("font-black px-4 py-1", colors.text)}>
                                                                {item.magnitude}
                                                            </Badge>
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-indigo-600" onClick={() => openEditDomain(item)}>
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-600" onClick={() => deleteMutation.mutate({ clientId, id: item.id })}>
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="relative z-10">
                                                        <h4 className="text-xl font-black text-slate-900 tracking-tight">{item.domain}</h4>
                                                        {item.ciaType && <Badge variant="secondary" className="mt-1 text-[9px]">{item.ciaType}</Badge>}
                                                        <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">{item.description || 'No description provided.'}</p>
                                                    </div>
                                                    {item.rationale && (
                                                        <div className="pt-4 relative z-10">
                                                            <Button variant="ghost" className="p-0 h-auto font-black text-[10px] uppercase tracking-widest text-indigo-600 hover:bg-transparent" onClick={() => openEditDomain(item)}>
                                                                Edit Rationale <ArrowRight className="w-3 h-3 ml-1" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                    <Icon className="absolute -bottom-10 -right-10 w-40 h-40 text-slate-900/5 rotate-12" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="p-10 bg-indigo-50 border border-indigo-100 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-10">
                                    <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-200 shrink-0">
                                        <Scale className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-2xl font-black text-indigo-950 italic">Harm Weighting Algorithm</h4>
                                        <p className="text-indigo-700 text-sm font-medium leading-relaxed max-w-xl">
                                            Our AI weighted impact model aggregates these {domainAssessments.length} assessments into a single residual impact value, adjusted for current control coverage and threat relevance.
                                        </p>
                                        <Button className="bg-indigo-950 text-white rounded-xl px-6 h-10 text-xs font-black uppercase tracking-widest">
                                            Adjust Weights
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="factors" className="p-10 space-y-8 m-0">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Contributing Factors</h3>
                                        <p className="text-sm text-slate-500 font-medium">Environmental and technical factors that amplify or diminish impact.</p>
                                    </div>
                                    <Button onClick={openNewFactor} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold h-10 px-4 gap-2">
                                        <Plus className="w-4 h-4" /> Add Factor
                                    </Button>
                                </div>

                                {isLoading ? (
                                    <div className="space-y-6">
                                        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-3xl animate-pulse" />)}
                                    </div>
                                ) : contributingFactors.length === 0 ? (
                                    <div className="text-center py-16 text-slate-400">
                                        <Scale className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                                        <p className="font-bold text-lg">No contributing factors yet</p>
                                        <p className="text-sm mt-1">Add amplifiers or dampeners that affect impact</p>
                                        <Button onClick={openNewFactor} className="mt-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold gap-2">
                                            <Plus className="w-4 h-4" /> Add Factor
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {contributingFactors.map((f: any) => (
                                            <div key={f.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between group hover:shadow-lg transition-all">
                                                <div className="flex items-center gap-6">
                                                    <div className={cn(
                                                        "w-3 h-3 rounded-full",
                                                        f.factorType === 'Amplifier' ? "bg-rose-500" : "bg-emerald-500"
                                                    )} />
                                                    <div>
                                                        <h4 className="text-lg font-black text-slate-900 leading-tight">{f.factorName}</h4>
                                                        <p className="text-xs text-slate-500 mt-1">{f.factorDescription || 'No description'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <Badge className={cn(
                                                            "font-black text-[10px] px-3 py-1",
                                                            f.factorType === 'Amplifier' ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                                                        )}>{f.factorLevel}</Badge>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{f.factorType}</p>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-indigo-600" onClick={() => openEditFactor(f)}>
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-600" onClick={() => deleteMutation.mutate({ clientId, id: f.id })}>
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Card className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                                            <RotateCcw className="w-8 h-8 text-indigo-400" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-xl font-black uppercase tracking-tight">Synchronize with Risk Register</h4>
                                            <p className="text-indigo-200 text-sm font-medium">Push these impact determinations to the centralized organization risk repository.</p>
                                        </div>
                                        <Button className="ml-auto bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-xl h-12 px-8">
                                            Sync Now
                                        </Button>
                                    </div>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </div>
            </div>

            {/* Domain / Factor Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-black">
                            {editing ? 'Edit' : 'New'} {dialogMode === 'domain' ? 'Impact Assessment' : 'Contributing Factor'}
                        </DialogTitle>
                    </DialogHeader>

                    {dialogMode === 'domain' ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="font-bold">Impact Domain *</Label>
                                <Select value={domainForm.domain} onValueChange={(v) => setDomainForm(f => ({ ...f, domain: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {IMPACT_DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">CIA Type (optional)</Label>
                                <Select value={domainForm.ciaType || "__none__"} onValueChange={(v) => setDomainForm(f => ({ ...f, ciaType: v === "__none__" ? "" : v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">None</SelectItem>
                                        {CIA_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-bold">Magnitude</Label>
                                    <Select value={domainForm.magnitude} onValueChange={(v) => setDomainForm(f => ({ ...f, magnitude: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {MAGNITUDE_LEVELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold">Score (0-100)</Label>
                                    <Input type="number" min={0} max={100} value={domainForm.magnitudeScore} onChange={(e) => setDomainForm(f => ({ ...f, magnitudeScore: parseInt(e.target.value) || 0 }))} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Description</Label>
                                <Textarea value={domainForm.description} onChange={(e) => setDomainForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the potential impact..." rows={3} />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Rationale</Label>
                                <Textarea value={domainForm.rationale} onChange={(e) => setDomainForm(f => ({ ...f, rationale: e.target.value }))} placeholder="Explain the rationale for this assessment..." rows={2} />
                            </div>
                            <div className="border-t pt-4 space-y-4">
                                <Label className="font-bold text-sm text-slate-500 uppercase tracking-wider">Economic Impact</Label>
                                <div className="space-y-2">
                                    <Label className="font-bold">Est. Daily Impact ($)</Label>
                                    <Input type="number" min={0} value={domainForm.estimatedDailyImpact / 100} onChange={(e) => setDomainForm(f => ({ ...f, estimatedDailyImpact: Math.round(parseFloat(e.target.value) * 100) || 0 }))} />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-bold text-xs">Revenue Loss %</Label>
                                        <Input type="number" min={0} max={100} value={domainForm.revenueLossPct} onChange={(e) => setDomainForm(f => ({ ...f, revenueLossPct: parseInt(e.target.value) || 0 }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-xs">Legal/Fines %</Label>
                                        <Input type="number" min={0} max={100} value={domainForm.legalFinesPct} onChange={(e) => setDomainForm(f => ({ ...f, legalFinesPct: parseInt(e.target.value) || 0 }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-xs">Brand Equity %</Label>
                                        <Input type="number" min={0} max={100} value={domainForm.brandEquityPct} onChange={(e) => setDomainForm(f => ({ ...f, brandEquityPct: parseInt(e.target.value) || 0 }))} />
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl h-12 font-bold">
                                {saveMutation.isPending ? "Saving..." : (editing ? "Update Assessment" : "Create Assessment")}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="font-bold">Factor Name *</Label>
                                <Input value={factorForm.factorName} onChange={(e) => setFactorForm(f => ({ ...f, factorName: e.target.value }))} placeholder="e.g., Data Volume, Public Visibility" />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Description</Label>
                                <Textarea value={factorForm.factorDescription} onChange={(e) => setFactorForm(f => ({ ...f, factorDescription: e.target.value }))} placeholder="Describe how this factor affects impact..." rows={3} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-bold">Factor Level</Label>
                                    <Select value={factorForm.factorLevel} onValueChange={(v) => setFactorForm(f => ({ ...f, factorLevel: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {["Extremely High", "Very High", "High", "Moderate", "Low"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold">Type</Label>
                                    <Select value={factorForm.factorType} onValueChange={(v) => setFactorForm(f => ({ ...f, factorType: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {FACTOR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Domain</Label>
                                <Input value={factorForm.domain} onChange={(e) => setFactorForm(f => ({ ...f, domain: e.target.value }))} placeholder="e.g., General, Network Security" />
                            </div>
                            <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl h-12 font-bold">
                                {saveMutation.isPending ? "Saving..." : (editing ? "Update Factor" : "Create Factor")}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </NIST80030Layout>
    );
}
