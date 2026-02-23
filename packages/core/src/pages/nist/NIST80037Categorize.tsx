import React, { useState, useEffect } from 'react';
import { useParams, Link } from "wouter";
import { trpc } from '@/lib/trpc';
import NIST80037Layout from "./NIST80037Layout";
import { useNistSystemId } from "./useNistSystem";
import {
    Settings,
    Database,
    Shield,
    Zap,
    BarChart3,
    CheckCircle2,
    Plus,
    Search,
    AlertTriangle,
    FileText,
    LayoutGrid,
    Save,
    Globe,
    ShieldCheck,
    ArrowRight,
    Lock,
    Eye,

    ShieldAlert,
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
import { EnhancedDialog } from '@complianceos/ui/ui/enhanced-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NIST_CATALOG = [
    { code: "D.1.1", name: "Personally Identifiable Information (PII)", cat: "Privacy", impact: "High" },
    { code: "C.2.4", name: "Financial Management", cat: "Business Services", impact: "Moderate" },
    { code: "C.3.5", name: "Health Information (PHI)", cat: "Health", impact: "High" },
    { code: "A.1.1", name: "System Authentication Data", cat: "Security", impact: "High" },
    { code: "D.2.1", name: "Proprietary Business Info", cat: "Business", impact: "Moderate" },
    { code: "C.1.2", name: "Public Website Content", cat: "Public Relations", impact: "Low" },
    { code: "K.1.1", name: "Controlled Technical Information", cat: "Defense", impact: "Moderate" },
    { code: "L.1.1", name: "Law Enforcement Data", cat: "Legal", impact: "High" }
];

export default function NIST80037Categorize() {
    const { id } = useParams<{ id: string }>();
    const systemId = useNistSystemId();
    const clientId = parseInt(id || "0");
    const [isSaving, setIsSaving] = useState(false);

    const trpcContext = trpc.useContext();
    const { data: categorizationData, isLoading } = trpc.federal.getFipsCategorization.useQuery({
        clientId: clientId,
        fismaSystemId: systemId ? systemId : undefined
    }, {
        enabled: !!systemId
    });

    const { data: rmfWorkflow } = trpc.federal.getRmfWorkflow.useQuery({
        clientId: clientId,
        fismaSystemId: systemId ? systemId : undefined
    }, {
        enabled: !!systemId
    });

    const updateCategorizationMutation = trpc.federal.saveFipsCategorization.useMutation({
        onSuccess: () => {
            trpcContext.federal.getFipsCategorization.invalidate();
            toast.success("Categorization Data Saved", { description: "Security categorization and high-water mark updated." });
            setIsSaving(false);
        },
        onError: () => {
            setIsSaving(false);
            toast.error("Error saving data");
        }
    });

    const updateRmfStepMutation = trpc.federal.updateRmfStep.useMutation({
        onSuccess: () => {
            trpcContext.federal.getRmfWorkflow.invalidate();
        }
    });

    const ensureRmfWorkflowMutation = trpc.federal.ensureRmfWorkflow.useMutation({
        onSuccess: (workflow) => {
            updateRmfStepMutation.mutate({
                clientId,
                id: workflow.id,
                step: 2,
                status: 'completed'
            });
            updateRmfStepMutation.mutate({
                clientId,
                id: workflow.id,
                step: 3,
                status: 'in_progress'
            });
        }
    });

    const [objectives, setObjectives] = useState<{
        confidentiality: { level: string, rationale: string },
        integrity: { level: string, rationale: string },
        availability: { level: string, rationale: string }
    }>({
        confidentiality: { level: 'Low', rationale: '' },
        integrity: { level: 'Low', rationale: '' },
        availability: { level: 'Low', rationale: '' }
    });

    // Default info types specific to client
    const [infoTypes, setInfoTypes] = useState<any[]>([
        { type: "Personally Identifiable Information (PII)", cat: "Privacy", impact: "High", icon: "Database" },
        { type: "Financial Data", cat: "Business", impact: "Moderate", icon: "BarChart3" }
    ]);
    const [categorizationMethod, setCategorizationMethod] = useState("");
    const [isAddInfoTypeOpen, setIsAddInfoTypeOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [newItem, setNewItem] = useState({ type: "", cat: "Business", impact: "Low" });

    // Reset local state when systemId changes
    useEffect(() => {
        setObjectives({
            confidentiality: { level: 'Low', rationale: '' },
            integrity: { level: 'Low', rationale: '' },
            availability: { level: 'Low', rationale: '' }
        });
        setInfoTypes([
            { type: "Personally Identifiable Information (PII)", cat: "Privacy", impact: "High", icon: "Database" },
            { type: "Financial Data", cat: "Business", impact: "Moderate", icon: "BarChart3" }
        ]);
        setCategorizationMethod("");
    }, [systemId]);

    useEffect(() => {
        if (categorizationData) {
            setObjectives({
                confidentiality: {
                    level: categorizationData.confidentialityImpact ? categorizationData.confidentialityImpact.charAt(0).toUpperCase() + categorizationData.confidentialityImpact.slice(1).toLowerCase() : 'Low',
                    rationale: categorizationData.confidentialityRationale || ''
                },
                integrity: {
                    level: categorizationData.integrityImpact ? categorizationData.integrityImpact.charAt(0).toUpperCase() + categorizationData.integrityImpact.slice(1).toLowerCase() : 'Low',
                    rationale: categorizationData.integrityRationale || ''
                },
                availability: {
                    level: categorizationData.availabilityImpact ? categorizationData.availabilityImpact.charAt(0).toUpperCase() + categorizationData.availabilityImpact.slice(1).toLowerCase() : 'Low',
                    rationale: categorizationData.availabilityRationale || ''
                }
            });
            if (categorizationData.informationTypes) {
                setInfoTypes(categorizationData.informationTypes as any);
            }
            if (categorizationData.metadata) {
                setCategorizationMethod((categorizationData.metadata as any).method || "");
            }
        }
    }, [categorizationData]);

    const calculateHighWaterMark = () => {
        const levels = ['Low', 'Moderate', 'High'];
        const scores: Record<string, number> = { 'Low': 0, 'Moderate': 1, 'High': 2 };

        let maxScore = 0;
        Object.values(objectives).forEach((obj: any) => {
            const score = scores[obj.level] || 0;
            if (score > maxScore) maxScore = score;
        });

        return levels[maxScore];
    };

    const handleSave = () => {
        if (!systemId) {
            toast.error("No system selected", { description: "Please select a system first." });
            return;
        }

        setIsSaving(true);
        updateCategorizationMutation.mutate({
            clientId,
            fismaSystemId: systemId,
            informationTypes: infoTypes,
            confidentialityImpact: objectives.confidentiality.level.toLowerCase(),
            integrityImpact: objectives.integrity.level.toLowerCase(),
            availabilityImpact: objectives.availability.level.toLowerCase(),
            confidentialityRationale: objectives.confidentiality.rationale,
            integrityRationale: objectives.integrity.rationale,
            availabilityRationale: objectives.availability.rationale,
            highWaterMark: calculateHighWaterMark().toLowerCase(),
            metadata: {
                method: categorizationMethod
            }
        });

        if (rmfWorkflow) {
            updateRmfStepMutation.mutate({
                clientId,
                id: rmfWorkflow.id,
                step: 2,
                status: 'completed'
            });
            updateRmfStepMutation.mutate({
                clientId,
                id: rmfWorkflow.id,
                step: 3,
                status: 'in_progress'
            });
        } else {
            ensureRmfWorkflowMutation.mutate({
                clientId,
                fismaSystemId: systemId,
                systemName: "NIST System " + systemId
            });
        }
    };



    const handleApprove = () => {
        toast.success("Categorization Approved", {
            description: "The System Owner has approved the security categorization."
        });
        // In a real app, this would update an 'approved' status in the backend
    };

    const impactLevels = [
        { level: "Low", color: "bg-emerald-50 text-emerald-700 border-emerald-100", score: 1 },
        { level: "Moderate", color: "bg-amber-50 text-amber-700 border-amber-100", score: 2 },
        { level: "High", color: "bg-rose-50 text-rose-700 border-rose-100", score: 3 }
    ];

    const iconMap: Record<string, any> = {
        Database, FileText, Globe, BarChart3, Shield
    };

    const handleAddInfoType = () => {
        setNewItem({ type: "", cat: "Business", impact: "Low" });
        setIsAddInfoTypeOpen(true);
    };

    const handleConfirmAdd = () => {
        if (!newItem.type) return;
        setInfoTypes([...infoTypes, { ...newItem, icon: "FileText" }]);
        setIsAddInfoTypeOpen(false);
        toast.success("Information Type Added");
    };

    const handleDeleteInfoType = (index: number) => {
        const newTypes = [...infoTypes];
        newTypes.splice(index, 1);
        setInfoTypes(newTypes);
    };

    return (
        <NIST80037Layout>
            <div className="space-y-8 w-full pb-20">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                        { label: "SP 800-37 (RMF)", href: `/clients/${clientId}/nist/rmf` },
                        { label: "Step 1: Categorize" }
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-600 text-white font-black px-3">STEP 1</Badge>
                            <Badge variant="outline" className="border-indigo-200 text-indigo-700 font-bold uppercase tracking-widest text-[10px]">Categorization Phase</Badge>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
                            <Settings className="w-10 h-10 text-indigo-600" />
                            System Categorization
                        </h1>
                        <p className="text-slate-500 text-lg font-medium max-w-3xl font-serif leading-relaxed italic">
                            Categorize the system and the information processed, stored, and transmitted based on an analysis of the impact of loss.
                        </p>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 px-8 shadow-xl shadow-indigo-200/50 font-black text-lg gap-2"
                    >
                        {isSaving ? "Saving..." : <><Save className="w-5 h-5" /> Update FIPS-199</>}
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Status & Summary Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/50 backdrop-blur-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Security Objective</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-6">
                                    {(['confidentiality', 'integrity', 'availability'] as const).map(key => {
                                        const level = objectives[key].level;
                                        const score = level === 'High' ? 100 : level === 'Moderate' ? 66 : 33;
                                        const color = level === 'High' ? 'bg-rose-500' : level === 'Moderate' ? 'bg-amber-500' : 'bg-emerald-500';

                                        return (
                                            <div key={key}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-bold text-slate-600 capitalize">{key}</span>
                                                    <Badge className={`${color} text-white border-none font-black`}>{level.toUpperCase()}</Badge>
                                                </div>
                                                <Progress value={score} className="h-1.5 bg-slate-100" indicatorClassName={color} />
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">High-Water Mark</p>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center gap-3">
                                        <ShieldAlert className="w-6 h-6 text-slate-600" />
                                        <span className="text-2xl font-black text-slate-700 tracking-tighter">{calculateHighWaterMark().toUpperCase()} / FIPS 199</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-slate-900 text-white">
                            <CardHeader>
                                <CardTitle className="text-indigo-400 text-xs font-black uppercase tracking-widest">NIST 800-60 Alignment</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                    Information types are automatically mapped to NIST 800-60 Rev 1 guidelines for categorization.
                                </p>
                                <Button
                                    className="w-full bg-white text-slate-900 hover:bg-slate-200 rounded-xl h-10 text-xs font-bold uppercase tracking-widest"
                                    onClick={() => setIsAddInfoTypeOpen(true)}
                                >
                                    Browse NIST Catalog
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-3">
                        <Tabs defaultValue="inventory" className="w-full">
                            <div className="border-b px-8 bg-slate-50/50">
                                <TabsList className="h-16 bg-transparent gap-8">
                                    <TabsTrigger value="inventory" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-100 rounded-t-lg font-bold text-xs uppercase tracking-widest px-6 py-3 transition-all -mb-[2px]">
                                        Information Inventory
                                    </TabsTrigger>
                                    <TabsTrigger value="analysis" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-100 rounded-t-lg font-bold text-xs uppercase tracking-widest px-6 py-3 transition-all -mb-[2px]">
                                        Impact Analysis
                                    </TabsTrigger>
                                    <TabsTrigger value="fips" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-100 rounded-t-lg font-bold text-xs uppercase tracking-widest px-6 py-3 transition-all -mb-[2px]">
                                        FIPS-199 Determination
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="pb-8">
                                <TabsContent value="inventory" className="p-10 space-y-8 m-0">
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Information Types (C-1)</h3>
                                            <p className="text-sm text-slate-500 font-medium">Identify the types of information processed by the system.</p>
                                        </div>
                                        <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2 h-10" onClick={handleAddInfoType}>
                                            <Plus className="w-4 h-4" /> Add Info Type
                                        </Button>
                                    </div>

                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <Input
                                            placeholder="Search NIST 800-60 Service Types..."
                                            className="pl-12 h-14 rounded-2xl border-slate-200 focus:ring-indigo-500 font-bold"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {infoTypes.filter(item =>
                                            item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            item.cat.toLowerCase().includes(searchQuery.toLowerCase())
                                        ).map((item, i) => {
                                            const Icon = iconMap[item.icon] || FileText;
                                            return (
                                                <div key={i} className="p-6 bg-white border rounded-[2rem] flex items-center justify-between hover:shadow-md transition-all group">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                            <Icon className="w-7 h-7" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    className="text-lg font-black text-slate-900 border-none h-auto p-0 focus-visible:ring-0 w-64 shadow-none bg-transparent"
                                                                    value={item.type}
                                                                    onChange={(e) => {
                                                                        const newTypes = [...infoTypes];
                                                                        newTypes[i].type = e.target.value;
                                                                        setInfoTypes(newTypes);
                                                                    }}
                                                                />
                                                                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.cat}</Badge>
                                                            </div>
                                                            <p className="text-xs font-semibold text-slate-500 mt-0.5">NIST SP 800-60 Rev 1 Descriptor: {item.cat === 'Privacy' ? 'D.1.1' : 'C.2.4'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <Badge className={cn(
                                                            "font-black px-3 cursor-pointer select-none",
                                                            item.impact === 'High' ? "bg-rose-100 text-rose-700" :
                                                                item.impact === 'Moderate' ? "bg-amber-100 text-amber-700" :
                                                                    "bg-emerald-100 text-emerald-700"
                                                        )}
                                                            onClick={() => {
                                                                const newTypes = [...infoTypes];
                                                                const levels = ['Low', 'Moderate', 'High'];
                                                                const currentIdx = levels.indexOf(item.impact);
                                                                newTypes[i].impact = levels[(currentIdx + 1) % 3];
                                                                setInfoTypes(newTypes);
                                                            }}
                                                        >{item.impact}</Badge>
                                                        <Button variant="ghost" size="icon" className="text-slate-300 hover:text-rose-500" onClick={() => handleDeleteInfoType(i)}>
                                                            <Trash2 className="w-5 h-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TabsContent>

                                <TabsContent value="analysis" className="p-10 space-y-8 m-0">
                                    <div className="space-y-8">
                                        <div className="p-8 bg-indigo-50 rounded-[3rem] border border-indigo-100 space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                                                    <Shield className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tight text-indigo-900">Impact Category Analysis (C-2)</h3>
                                            </div>
                                            <p className="text-indigo-700 font-medium leading-relaxed">
                                                For each security objective, describe the potential impact on organizational operations, assets, or individuals.
                                            </p>
                                        </div>

                                        <div className="space-y-10">
                                            {[
                                                { key: 'confidentiality', label: "Confidentiality", icon: Lock, description: "Unauthorized disclosure of information could have a limited, serious, or severe adverse effect." },
                                                { key: 'integrity', label: "Integrity", icon: ShieldCheck, description: "Unauthorized modification or destruction of information could have a limited, serious, or severe adverse effect." },
                                                { key: 'availability', label: "Availability", icon: Eye, description: "Disruption of access to or use of information could have a limited, serious, or severe adverse effect." }
                                            ].map((obj, i) => {
                                                const currentLevel = objectives[obj.key as keyof typeof objectives].level;
                                                return (
                                                    <div key={i} className="space-y-6 p-8 bg-white border rounded-[3rem] shadow-sm relative overflow-hidden group">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rotate-45 translate-x-16 -translate-y-16 group-hover:bg-indigo-50 transition-colors" />
                                                        <div className="flex items-center justify-between relative z-10">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                                                                    <obj.icon className="w-5 h-5" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-wide">{obj.label}</h4>
                                                                    <p className="text-xs text-slate-400 font-medium max-w-sm">{obj.description}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {impactLevels.map((l) => (
                                                                    <Button
                                                                        key={l.level}
                                                                        variant="outline"
                                                                        onClick={() => setObjectives(prev => ({
                                                                            ...prev,
                                                                            [obj.key]: { ...prev[obj.key as keyof typeof objectives], level: l.level }
                                                                        }))}
                                                                        className={cn(
                                                                            "h-10 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                                                                            currentLevel === l.level ? l.color + " ring-2 ring-offset-2 ring-indigo-500 border-transparent" : "border-slate-100 text-slate-400 hover:text-slate-900"
                                                                        )}
                                                                    >
                                                                        {l.level}
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Impact Rationale</Label>
                                                            <Textarea
                                                                value={objectives[obj.key as keyof typeof objectives].rationale}
                                                                onChange={(e) => setObjectives(prev => ({
                                                                    ...prev,
                                                                    [obj.key]: { ...prev[obj.key as keyof typeof objectives], rationale: e.target.value }
                                                                }))}
                                                                placeholder={`Describe why ${obj.label} impact is ${currentLevel}...`}
                                                                className="rounded-2xl border-slate-100 min-h-[100px] focus:ring-indigo-500"
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="fips" className="p-10 space-y-10 m-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="md:col-span-2 space-y-6">
                                            <div className="p-10 bg-slate-900 rounded-[3.5rem] text-white relative overflow-hidden flex flex-col items-center text-center space-y-6">
                                                <div className="relative z-10">
                                                    <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-2xl mb-6 mx-auto ${calculateHighWaterMark() === 'High' ? 'bg-rose-500 shadow-rose-500/50' : calculateHighWaterMark() === 'Moderate' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-emerald-500 shadow-emerald-500/50'}`}>
                                                        <ShieldAlert className="w-10 h-10" />
                                                    </div>
                                                    <h3 className="text-4xl font-black tracking-tighter mb-2">High-Water Mark: {calculateHighWaterMark().toUpperCase()}</h3>
                                                    <p className="text-slate-400 font-medium max-w-lg mx-auto">
                                                        The overall categorization is based on the highest impact level across the three security objectives.
                                                    </p>
                                                </div>
                                                <div className="flex gap-4 relative z-10 pt-4">
                                                    <Button
                                                        onClick={handleApprove}
                                                        className="bg-indigo-600 text-white hover:bg-indigo-700 border-none rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        Approve Categorization
                                                    </Button>
                                                    <Link href={`/clients/${clientId}/federal/ssp`}>
                                                        <Button
                                                            variant="outline"
                                                            className="bg-white/10 text-white hover:bg-white/20 border-white/20 rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs"
                                                        >
                                                            <FileText className="w-4 h-4 mr-2" />
                                                            View in SSP Editor
                                                        </Button>
                                                    </Link>
                                                </div>
                                                <LayoutGrid className="absolute -bottom-20 -right-20 w-80 h-80 text-white/5 rotate-12" />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-sm font-black uppercase tracking-widest text-slate-500">Categorization Method (C-3)</Label>
                                            <Textarea
                                                value={categorizationMethod}
                                                onChange={(e) => setCategorizationMethod(e.target.value)}
                                                placeholder="Describe the method used..."
                                                className="rounded-2xl border-slate-200 min-h-[100px]"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-sm font-black uppercase tracking-widest text-slate-500">Reviewers & Approvers</Label>
                                            <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-emerald-100 text-emerald-500">
                                                            <CheckCircle2 className="w-6 h-6" />
                                                        </div>
                                                        <span className="font-bold text-slate-900">CISO Approved</span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">Feb 12, 2026</span>
                                                </div>
                                                <div className="flex items-center justify-between opacity-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-300">
                                                            <CheckCircle2 className="w-6 h-6" />
                                                        </div>
                                                        <span className="font-bold text-slate-600">Authorizing Official</span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">Awaiting...</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>
                </div>
            </div>
            <EnhancedDialog
                open={isAddInfoTypeOpen}
                onOpenChange={setIsAddInfoTypeOpen}
                title="Add Information Type"
                description="Select from the NIST 800-60 Revision 1 Catalog or define a custom information type."
                size="lg"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsAddInfoTypeOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmAdd} className="bg-indigo-600 hover:bg-indigo-700">Add Information Type</Button>
                    </>
                }
            >
                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <Label>NIST 800-60 Catalog Quick Select</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {NIST_CATALOG.map((cat, i) => (
                                <div
                                    key={i}
                                    className="p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between group"
                                    onClick={() => setNewItem({ type: cat.name, cat: cat.cat, impact: cat.impact })}
                                >
                                    <div className="space-y-1">
                                        <div className="font-bold text-sm text-slate-700">{cat.name}</div>
                                        <div className="text-[10px] uppercase font-black text-slate-400">{cat.code} • {cat.cat}</div>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "opacity-0 group-hover:opacity-100 transition-opacity",
                                        cat.impact === 'High' ? 'text-rose-600 border-rose-200' : 'text-slate-600'
                                    )}>{cat.impact}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or Manual Entry</span></div></div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Information Type Name</Label>
                            <Input value={newItem.type} onChange={(e) => setNewItem({ ...newItem, type: e.target.value })} placeholder="e.g. Employee Records" />
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={newItem.cat} onValueChange={(v) => setNewItem({ ...newItem, cat: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Business">Business</SelectItem>
                                    <SelectItem value="Privacy">Privacy</SelectItem>
                                    <SelectItem value="Health">Health</SelectItem>
                                    <SelectItem value="Security">Security</SelectItem>
                                    <SelectItem value="Defense">Defense</SelectItem>
                                    <SelectItem value="Legal">Legal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </EnhancedDialog>
        </NIST80037Layout>
    );
}

