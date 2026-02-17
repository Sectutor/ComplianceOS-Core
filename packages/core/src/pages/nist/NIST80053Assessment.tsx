import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    Shield,
    Search,
    Filter,
    CheckCircle2,
    ChevronRight,
    FileText,
    Activity,
    Download,
    Loader2,
    Sparkles,
    ExternalLink
} from "lucide-react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Breadcrumb } from "@/components/Breadcrumb";
import NIST80053Layout from "./NIST80053Layout";
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
import {
    fedrampLowControls,
    fedrampModerateControls,
    fedrampHighControls
} from "@/data/frameworks/fedramp";

const CONTROL_FAMILIES = [
    { id: 'AC', name: 'Access Control' },
    { id: 'AT', name: 'Awareness and Training' },
    { id: 'AU', name: 'Audit and Accountability' },
    { id: 'CA', name: 'Assessment, Authorization, and Monitoring' },
    { id: 'CM', name: 'Configuration Management' },
    { id: 'CP', name: 'Contingency Planning' },
    { id: 'IA', name: 'Identification and Authentication' },
    { id: 'IR', name: 'Incident Response' },
    { id: 'MA', name: 'Maintenance' },
    { id: 'MP', name: 'Media Protection' },
    { id: 'PE', name: 'Physical and Environmental Protection' },
    { id: 'PL', name: 'Planning' },
    { id: 'PS', name: 'Personnel Security' },
    { id: 'RA', name: 'Risk Assessment' },
    { id: 'SA', name: 'System and Services Acquisition' },
    { id: 'SC', name: 'System and Communications Protection' },
    { id: 'SI', name: 'System and Information Integrity' },
    { id: 'SR', name: 'Supply Chain Risk Management' },
    { id: 'PM', name: 'Program Management' },
    { id: 'PT', name: 'Personally Identifiable Information Processing and Transparency' },
];

export default function NIST80053Assessment() {
    const { id, packageId } = useParams<{ id: string; packageId?: string }>();
    const systemId = useNistSystemId();
    const clientId = parseInt(id || "0");
    const sspId = packageId ? parseInt(packageId) : undefined;
    const fismaSystemId = systemId && !isNaN(parseInt(systemId)) ? parseInt(systemId) : undefined;
    const utils = trpc.useUtils();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFamily, setSelectedFamily] = useState<string>("all");
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedControl, setSelectedControl] = useState<any>(null);

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [complianceFilter, setComplianceFilter] = useState<string>("all");
    const [implFilter, setImplFilter] = useState<string>("all");

    // Form State
    const [implementationStatus, setImplementationStatus] = useState("Not Implemented");
    const [implementationDescription, setImplementationDescription] = useState("");
    const [testResults, setTestResults] = useState("");
    const [complianceStatus, setComplianceStatus] = useState("Non-Compliant");

    // AI State
    const [aiGuidance, setAiGuidance] = useState("");

    // Queries
    const { data: controls, isLoading: loadingControls } = trpc.controls.list.useQuery({
        framework: "NIST SP 800-53 Rev 5"
    });

    const { data: assessments, refetch: refetchAssessments } = trpc.federal.getNist80053Assessments.useQuery({
        clientId,
        sspId,
        fismaSystemId
    });

    const saveMutation = trpc.federal.saveNist80053Assessment.useMutation({
        onSuccess: () => {
            toast.success("Assessment saved successfully");
            refetchAssessments();
            utils.federal.getNonCompliantMetrics.invalidate({ clientId });
            setIsDetailOpen(false);
        },
        onError: (err) => {
            toast.error(`Error saving assessment: ${err.message}`);
        }
    });

    const generateGuidanceMutation = trpc.federal.generateNist80053Guidance.useMutation({
        onSuccess: (data) => {
            setAiGuidance(data.guidance || "No guidance returned.");
            toast.success("Guidance generated!");
        }
    });

    const assessmentMap = useMemo(() => {
        const map = new Map();
        assessments?.forEach((a: any) => map.set(a.controlId, a));
        return map;
    }, [assessments]);

    const filteredControls = useMemo(() => {
        if (!controls) return [];

        return controls.filter((ctrl: any) => {
            const matchesSearch = ctrl.controlId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ctrl.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFamily = selectedFamily === "all" || ctrl.controlId.startsWith(selectedFamily);

            let matchesCompliance = true;
            if (complianceFilter !== "all") {
                const assessment = assessmentMap.get(ctrl.controlId);
                const status = assessment?.complianceStatus || "Not Started";
                matchesCompliance = status === complianceFilter;
            }

            let matchesImpl = true;
            if (implFilter !== "all") {
                const assessment = assessmentMap.get(ctrl.controlId);
                const status = assessment?.implementationStatus || "Not Implemented";
                matchesImpl = status === implFilter;
            }

            return matchesSearch && matchesFamily && matchesCompliance && matchesImpl;
        });
    }, [controls, searchQuery, selectedFamily, complianceFilter, implFilter, assessmentMap]);

    const handleOpenDetail = (control: any) => {
        setSelectedControl(control);
        const assessment = assessmentMap.get(control.controlId);

        setImplementationStatus(assessment?.implementationStatus || "Not Implemented");
        setImplementationDescription(assessment?.implementationDescription || "");
        setTestResults(assessment?.testResults || "");
        setComplianceStatus(assessment?.complianceStatus || "Non-Compliant");
        setAiGuidance(control.aiGuidance || "");

        setIsDetailOpen(true);
    };

    const handleSave = () => {
        if (!selectedControl) return;

        saveMutation.mutate({
            clientId,
            sspId,
            fismaSystemId,
            controlId: selectedControl.controlId,
            implementationStatus,
            implementationDescription,
            testResults,
            complianceStatus
        });
    };

    const handleGenerateGuidance = () => {
        if (!selectedControl) return;
        generateGuidanceMutation.mutate({
            clientId,
            controlId: selectedControl.controlId,
            controlTitle: selectedControl.name,
            controlDescription: selectedControl.description,
            bypassCache: !!aiGuidance
        });
    };

    const getStatusBadge = (controlId: string) => {
        const assessment = assessmentMap.get(controlId);
        if (!assessment) return <Badge variant="outline" className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold">Not Started</Badge>;

        switch (assessment.complianceStatus) {
            case 'Compliant':
                return <Badge className="bg-emerald-500 text-white border-none text-[10px] uppercase font-bold">Compliant</Badge>;
            case 'Partial':
                return <Badge className="bg-amber-500 text-white border-none text-[10px] uppercase font-bold">Partial</Badge>;
            case 'Non-Compliant':
                return <Badge className="bg-rose-500 text-white border-none text-[10px] uppercase font-bold">Non-Compliant</Badge>;
            default:
                return <Badge variant="outline" className="text-[10px] uppercase font-bold">{assessment.complianceStatus}</Badge>;
        }
    };

    return (
        <NIST80053Layout>
            <div className="space-y-6">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/dashboard` },
                        { label: "NIST Hub", href: `/clients/${clientId}/nist` },
                        { label: "SP 800-53 Control Catalog" },
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            <Shield className="w-8 h-8 text-blue-600" />
                            NIST SP 800-53 Rev 5 Catalog
                        </h1>
                        <p className="text-slate-500 mt-1 uppercase text-xs font-bold tracking-widest flex items-center gap-2">
                            Security and Privacy Controls for Information Systems and Organizations
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="rounded-xl shadow-sm border-slate-200">
                            <Download className="w-4 h-4 mr-2 text-slate-400" />
                            Download Catalog
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Audit Intelligence
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1 space-y-6">
                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/50 backdrop-blur-sm sticky top-24">
                            <CardHeader className="pb-3 border-b border-slate-100">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Control Families</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[calc(100vh-320px)] px-4 pb-4 pt-4">
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => setSelectedFamily("all")}
                                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedFamily === "all"
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200/50"
                                                : "text-slate-600 hover:bg-slate-100"
                                                }`}
                                        >
                                            All Families
                                        </button>
                                        {CONTROL_FAMILIES.map(family => (
                                            <button
                                                key={family.id}
                                                onClick={() => setSelectedFamily(family.id)}
                                                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${selectedFamily === family.id
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200/50"
                                                    : "text-slate-600 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="truncate">{family.id} - {family.name}</span>
                                                    {selectedFamily !== family.id && (
                                                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-3 space-y-6">
                        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        className="pl-11 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-blue-500/20 transition-all font-medium"
                                        placeholder="Quick search by ID or title..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant={showFilters ? "secondary" : "ghost"}
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="rounded-2xl h-12 px-6 text-slate-500 hover:bg-slate-100"
                                >
                                    <Filter className="w-4 h-4 mr-2" />
                                    Filters
                                </Button>
                            </div>

                            {showFilters && (
                                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Compliance</Label>
                                        <Select value={complianceFilter} onValueChange={setComplianceFilter}>
                                            <SelectTrigger className="bg-slate-50 border-none rounded-2xl h-11">
                                                <SelectValue placeholder="All Results" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                <SelectItem value="all">All Results</SelectItem>
                                                <SelectItem value="Compliant">Compliant</SelectItem>
                                                <SelectItem value="Partial">Partial</SelectItem>
                                                <SelectItem value="Non-Compliant">Non-Compliant</SelectItem>
                                                <SelectItem value="Not Started">Not Started</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Implementation</Label>
                                        <Select value={implFilter} onValueChange={setImplFilter}>
                                            <SelectTrigger className="bg-slate-50 border-none rounded-2xl h-11">
                                                <SelectValue placeholder="All Statuses" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                <SelectItem value="Implemented">Implemented</SelectItem>
                                                <SelectItem value="Partial">Partially Implemented</SelectItem>
                                                <SelectItem value="Planned">Planned</SelectItem>
                                                <SelectItem value="Not Implemented">Not Implemented</SelectItem>
                                                <SelectItem value="N/A">Not Applicable</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {loadingControls ? (
                            <div className="flex flex-col items-center justify-center py-32">
                                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Catalog loading...</p>
                            </div>
                        ) : filteredControls.length === 0 ? (
                            <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                                <Shield className="w-20 h-20 text-slate-50 mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Zero Matches</h3>
                                <p className="text-slate-500 mt-2 font-medium">We couldn't find any controls matching these parameters.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredControls.map((control: any) => (
                                    <div
                                        key={control.id}
                                        onClick={() => handleOpenDetail(control)}
                                        className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-100 transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-500" />

                                        <div className="flex items-start justify-between relative z-10">
                                            <div className="space-y-2 pr-16">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-black tracking-tighter text-blue-600">{control.controlId}</span>
                                                    {getStatusBadge(control.controlId)}
                                                </div>
                                                <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">
                                                    {control.name}
                                                </h3>
                                                <p className="text-slate-500 leading-relaxed text-sm line-clamp-2 max-w-3xl">
                                                    {control.description}
                                                </p>
                                            </div>
                                            <Button size="icon" variant="ghost" className="rounded-2xl bg-slate-50 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm h-12 w-12 shrink-0">
                                                <ChevronRight className="w-6 h-6" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-w-5xl p-0 overflow-hidden border-none rounded-[40px] shadow-2xl h-[92vh] flex flex-col">
                        <DialogHeader className="p-10 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 text-white relative shrink-0">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                    <Shield className="w-8 h-8 text-blue-400" />
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/80">Control Identification</span>
                                    <h4 className="text-sm font-bold text-white/60">NIST SP 800-53 REV 5</h4>
                                </div>
                            </div>
                            <DialogTitle className="text-4xl font-black tracking-tighter leading-[1.1]">
                                {selectedControl?.controlId}: <span className="text-blue-400">{selectedControl?.name}</span>
                            </DialogTitle>
                            <DialogDescription className="text-blue-100/60 text-lg mt-4 leading-relaxed line-clamp-3">
                                {selectedControl?.description}
                            </DialogDescription>
                        </DialogHeader>

                        <ScrollArea className="flex-1 bg-slate-50">
                            <div className="p-10 space-y-10">
                                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group/ai">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full -mr-32 -mt-32 group-hover/ai:bg-indigo-500/10 transition-colors" />

                                    <div className="flex items-center justify-between mb-6 relative">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                                                <Sparkles className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight">AI Implementation Wizard</h3>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Powered by Compliance Intelligence</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={handleGenerateGuidance}
                                            disabled={generateGuidanceMutation.isPending}
                                            className="rounded-2xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 h-10 px-6 font-bold text-xs uppercase"
                                        >
                                            {generateGuidanceMutation.isPending ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2" />}
                                            {aiGuidance ? "Update Guidance" : "Analyze Control"}
                                        </Button>
                                    </div>

                                    {aiGuidance ? (
                                        <div className="prose prose-sm prose-slate max-w-none bg-indigo-50/20 p-8 rounded-[2rem] border border-indigo-100/50 relative">
                                            <ReactMarkdown>{aiGuidance}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                                            <Sparkles className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                                            <p className="text-slate-400 font-medium max-w-sm mx-auto">
                                                Generate specialized AI guidance to understand how to implement and test this control effectively.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Implementation Status</Label>
                                        <Select value={implementationStatus} onValueChange={setImplementationStatus}>
                                            <SelectTrigger className="rounded-3xl border-none shadow-sm h-16 bg-white px-6 font-bold text-slate-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-3xl border-none shadow-2xl">
                                                <SelectItem value="Implemented">Implemented</SelectItem>
                                                <SelectItem value="Partial">Partially Implemented</SelectItem>
                                                <SelectItem value="Planned">Planned</SelectItem>
                                                <SelectItem value="Not Implemented">Not Implemented</SelectItem>
                                                <SelectItem value="N/A">Not Applicable</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Compliance Result</Label>
                                        <Select value={complianceStatus} onValueChange={setComplianceStatus}>
                                            <SelectTrigger className="rounded-3xl border-none shadow-sm h-16 bg-white px-6 font-bold text-slate-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-3xl border-none shadow-2xl">
                                                <SelectItem value="Compliant">Compliant</SelectItem>
                                                <SelectItem value="Partial">Partial</SelectItem>
                                                <SelectItem value="Non-Compliant">Non-Compliant</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                                        <FileText className="w-3 h-3" />
                                        Implementation Statement
                                    </Label>
                                    <Textarea
                                        className="min-h-[180px] rounded-[2.5rem] border-none shadow-sm bg-white p-8 focus-visible:ring-blue-500/10 text-slate-700 leading-relaxed font-medium"
                                        placeholder="Detailed explanation of how this security requirement is being met..."
                                        value={implementationDescription}
                                        onChange={(e) => setImplementationDescription(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                                        <Activity className="w-3 h-3" />
                                        Assessment Observations
                                    </Label>
                                    <Textarea
                                        className="min-h-[180px] rounded-[2.5rem] border-none shadow-sm bg-white p-8 focus-visible:ring-blue-500/10 text-slate-700 leading-relaxed font-mono text-sm"
                                        placeholder="Internal audit notes, evidence links, and testing artifacts..."
                                        value={testResults}
                                        onChange={(e) => setTestResults(e.target.value)}
                                    />
                                </div>
                            </div>
                        </ScrollArea>

                        <DialogFooter className="p-8 bg-white border-t border-slate-100 flex items-center justify-between sm:justify-between shrink-0">
                            <Button variant="ghost" className="rounded-2xl text-slate-400 hover:text-blue-600 font-bold text-xs uppercase tracking-widest">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Risk Links
                            </Button>
                            <div className="flex gap-4">
                                <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="rounded-[1.5rem] px-8 border-slate-200 font-bold">
                                    Close
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saveMutation.isPending}
                                    className="bg-blue-600 hover:bg-blue-700 rounded-[1.5rem] px-10 shadow-xl shadow-blue-500/20 font-black"
                                >
                                    {saveMutation.isPending ? "Saving..." : "Commit Changes"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </NIST80053Layout>
    );
}
