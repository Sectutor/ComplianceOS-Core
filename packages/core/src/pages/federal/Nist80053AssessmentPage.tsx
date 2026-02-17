import React, { useState, useMemo } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Badge } from "@complianceos/ui/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import {
    Shield,
    Search,
    Filter,
    CheckCircle2,
    AlertCircle,
    Clock,
    ChevronRight,
    ExternalLink,
    FileText,
    Activity,
    Save,
    Info,
    ArrowLeft,
    Sparkles,
    Download,
    Loader2
} from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Breadcrumb } from "@/components/Breadcrumb";
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

export default function Nist80053AssessmentPage() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const utils = trpc.useUtils();

    // Read initial state from URL query parameters
    const queryParams = new URLSearchParams(window.location.search);
    const initialFamily = queryParams.get("family") || "all";
    const initialStatus = queryParams.get("status") || "all";
    const initialSearch = queryParams.get("search") || "";
    const packageId = queryParams.get("packageId");
    const fismaSystemId = queryParams.get("fismaSystemId");
    const rmfWorkflowId = queryParams.get("rmfWorkflowId");
    const impactLevel = queryParams.get("impact") || "";

    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [selectedFamily, setSelectedFamily] = useState<string>(initialFamily);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedControl, setSelectedControl] = useState<any>(null);

    // Filters
    const [showFilters, setShowFilters] = useState(initialStatus !== "all");
    const [complianceFilter, setComplianceFilter] = useState<string>(initialStatus);
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
        sspId: packageId ? parseInt(packageId) : undefined,
        fismaSystemId: fismaSystemId ? parseInt(fismaSystemId) : undefined,
        rmfWorkflowId: rmfWorkflowId ? parseInt(rmfWorkflowId) : undefined
    });

    const saveMutation = trpc.federal.saveNist80053Assessment.useMutation({
        onSuccess: () => {
            toast.success("Assessment saved successfully");
            refetchAssessments();
            // Invalidate metrics to update the report
            utils.federal.getNonCompliantMetrics.invalidate({ clientId });
            setIsDetailOpen(false);
        },
        onError: (err) => {
            toast.error(`Error saving assessment: ${err.message}`);
        }
    });

    const generateGuidanceMutation = trpc.federal.generateNist80053Guidance.useMutation({
        onSuccess: (data) => {
            console.log("Guidance generated successfully:", data);
            setAiGuidance(data.guidance || "No guidance returned.");
            toast.success("Guidance generated!");
        },
        onError: (err) => {
            console.error("Guidance generation failed:", err);
            toast.error(`Failed to generate guidance: ${err.message || 'Unknown error'}`);
        }
    });

    const exportMutation = trpc.federal.exportNist80053Package.useMutation({
        onSuccess: (data) => {
            const link = document.createElement('a');
            link.href = `data:text/csv;base64,${data.base64}`;
            link.download = data.filename;
            link.click();
            toast.success("Export downloaded successfully");
        }
    });

    const assessmentMap = useMemo(() => {
        const map = new Map();
        assessments?.forEach((a: any) => map.set(a.controlId, a));
        return map;
    }, [assessments]);

    const filteredControls = useMemo(() => {
        if (!controls) return [];

        // FedRAMP Baseline Filtering
        let baseControls = controls;
        if (impactLevel) {
            const baseline = impactLevel === "High" ? fedrampHighControls :
                impactLevel === "Moderate" ? fedrampModerateControls :
                    fedrampLowControls;
            const baselineIds = new Set(baseline.map(c => c.id));
            baseControls = controls.filter(c => baselineIds.has(c.controlId));
        }

        return baseControls.filter((ctrl: any) => {
            const matchesSearch = ctrl.controlId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ctrl.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFamily = selectedFamily === "all" || ctrl.controlId.startsWith(selectedFamily);

            // Compliance Filter
            let matchesCompliance = true;
            if (complianceFilter !== "all") {
                const assessment = assessmentMap.get(ctrl.controlId);
                const status = assessment?.complianceStatus || "Not Started";
                matchesCompliance = status === complianceFilter;
            }

            // Implementation Filter
            let matchesImpl = true;
            if (implFilter !== "all") {
                const assessment = assessmentMap.get(ctrl.controlId);
                const status = assessment?.implementationStatus || "Not Implemented";
                matchesImpl = status === implFilter;
            }

            return matchesSearch && matchesFamily && matchesCompliance && matchesImpl;
        });
    }, [controls, searchQuery, selectedFamily, complianceFilter, implFilter, assessmentMap, impactLevel]);

    const handleOpenDetail = (control: any) => {
        setSelectedControl(control);
        const assessment = assessmentMap.get(control.controlId);

        setImplementationStatus(assessment?.implementationStatus || "Not Implemented");
        setImplementationDescription(assessment?.implementationDescription || "");
        setTestResults(assessment?.testResults || "");
        setComplianceStatus(assessment?.complianceStatus || "Non-Compliant");

        // Load cached guidance from the control if available
        setAiGuidance(control.aiGuidance || "");

        setIsDetailOpen(true);
    };

    const handleSave = () => {
        if (!selectedControl) return;

        saveMutation.mutate({
            clientId,
            sspId: packageId ? parseInt(packageId) : undefined,
            fismaSystemId: fismaSystemId ? parseInt(fismaSystemId) : undefined,
            rmfWorkflowId: rmfWorkflowId ? parseInt(rmfWorkflowId) : undefined,
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
        if (!assessment) return <Badge variant="outline" className="bg-slate-50 text-slate-400">Not Started</Badge>;

        switch (assessment.complianceStatus) {
            case 'Compliant':
                return <Badge className="bg-emerald-500 text-white border-none">Compliant</Badge>;
            case 'Partial':
                return <Badge className="bg-amber-500 text-white border-none">Partial</Badge>;
            case 'Non-Compliant':
                return <Badge className="bg-rose-500 text-white border-none">Non-Compliant</Badge>;
            default:
                return <Badge variant="outline">{assessment.complianceStatus}</Badge>;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-20 px-6">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                        { label: "Federal Compliance", href: `/clients/${clientId}/federal` },
                        ...(packageId ? [{ label: "FedRAMP Packages", href: `/clients/${clientId}/federal/fedramp` }] : []),
                        ...(fismaSystemId ? [{ label: "FISMA Inventory", href: `/clients/${clientId}/federal/fisma` }] : []),
                        ...(rmfWorkflowId ? [{ label: "RMF Workflows", href: `/clients/${clientId}/federal/rmf` }] : []),
                        { label: impactLevel ? `${packageId ? 'FedRAMP' : 'FISMA'} ${impactLevel} Baseline` : "NIST 800-53 Rev 5 Assessment" },
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            <Shield className="w-8 h-8 text-blue-600" />
                            {impactLevel ? `${packageId ? 'FedRAMP' : 'FISMA'} ${impactLevel} Baseline` : "NIST 800-53 Rev 5"}
                        </h1>
                        <p className="text-slate-500 mt-1 uppercase text-xs font-bold tracking-widest">
                            {packageId ? "Cloud Security Authorization Package" : fismaSystemId ? "FISMA System Assessment" : rmfWorkflowId ? "RMF Security Assessment" : "Security and Privacy Control Assessment"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {packageId && (
                            <Link href={`/clients/${clientId}/federal/fedramp`}>
                                <Button variant="ghost" className="rounded-xl gap-2 text-slate-500 hover:text-slate-900">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Package
                                </Button>
                            </Link>
                        )}
                        {fismaSystemId && (
                            <Link href={`/clients/${clientId}/federal/fisma`}>
                                <Button variant="ghost" className="rounded-xl gap-2 text-slate-500 hover:text-slate-900">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Inventory
                                </Button>
                            </Link>
                        )}
                        {rmfWorkflowId && (
                            <Link href={`/clients/${clientId}/federal/rmf/${rmfWorkflowId}`}>
                                <Button variant="ghost" className="rounded-xl gap-2 text-slate-500 hover:text-slate-900">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Workflow
                                </Button>
                            </Link>
                        )}
                        <Button variant="outline" className="rounded-xl shadow-sm">
                            <Activity className="w-4 h-4 mr-2" />
                            Assessment Report
                        </Button>
                        <Button
                            onClick={() => exportMutation.mutate({ clientId, sspId: packageId ? parseInt(packageId) : undefined, fismaSystemId: fismaSystemId ? parseInt(fismaSystemId) : undefined, rmfWorkflowId: rmfWorkflowId ? parseInt(rmfWorkflowId) : undefined })}
                            disabled={exportMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                        >
                            {exportMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                            Export Package
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Sidebar Filters */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/50 backdrop-blur-sm sticky top-6">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Control Families</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[calc(100vh-250px)] px-4 pb-4">
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => setSelectedFamily("all")}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedFamily === "all"
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                                : "text-slate-600 hover:bg-slate-100"
                                                }`}
                                        >
                                            All Families
                                        </button>
                                        {CONTROL_FAMILIES.map(family => (
                                            <button
                                                key={family.id}
                                                onClick={() => setSelectedFamily(family.id)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all group ${selectedFamily === family.id
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                                    : "text-slate-600 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>{family.id} - {family.name}</span>
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

                    {/* Main Content */}
                    <div className="md:col-span-3 space-y-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        className="pl-10 bg-slate-50 border-none rounded-xl focus-visible:ring-blue-500/20 transition-all font-medium"
                                        placeholder="Search controls by ID or name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant={showFilters ? "secondary" : "ghost"}
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="rounded-xl text-slate-500"
                                >
                                    <Filter className="w-4 h-4 mr-2" />
                                    More Filters
                                </Button>
                            </div>

                            {/* Additional Filters Area */}
                            {showFilters && (
                                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-400">Compliance Status</Label>
                                        <Select value={complianceFilter} onValueChange={setComplianceFilter}>
                                            <SelectTrigger className="bg-slate-50 border-none rounded-xl">
                                                <SelectValue placeholder="Filter by status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                <SelectItem value="Compliant">Compliant</SelectItem>
                                                <SelectItem value="Partial">Partial</SelectItem>
                                                <SelectItem value="Non-Compliant">Non-Compliant</SelectItem>
                                                <SelectItem value="Not Started">Not Started</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-400">Implementation Status</Label>
                                        <Select value={implFilter} onValueChange={setImplFilter}>
                                            <SelectTrigger className="bg-slate-50 border-none rounded-xl">
                                                <SelectValue placeholder="Filter by status" />
                                            </SelectTrigger>
                                            <SelectContent>
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
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                                <p className="font-medium animate-pulse">Loading NIST 800-53 Catalog...</p>
                            </div>
                        ) : filteredControls.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                                <Shield className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-900">No controls found</h3>
                                <p className="text-slate-500">Try adjusting your search or family filter.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredControls.map((control: any) => (
                                    <div
                                        key={control.id}
                                        onClick={() => handleOpenDetail(control)}
                                        className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-100 transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />

                                        <div className="flex items-start justify-between relative z-10">
                                            <div className="space-y-1 pr-12">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-black tracking-tight text-blue-600">{control.controlId}</span>
                                                    {getStatusBadge(control.controlId)}
                                                </div>
                                                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight line-clamp-1">
                                                    {control.name}
                                                </h3>
                                                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed max-w-2xl">
                                                    {control.description}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <Button size="icon" variant="ghost" className="rounded-full bg-slate-50 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                    <ChevronRight className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Control Detail Dialog */}
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden border-none rounded-[32px] shadow-2xl h-[90vh] flex flex-col">
                        <DialogHeader className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative shrink-0">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-bold uppercase tracking-widest text-blue-100">Control Assessment</span>
                            </div>
                            <DialogTitle className="text-3xl font-black tracking-tight">
                                {selectedControl?.controlId}: {selectedControl?.name}
                            </DialogTitle>
                            <DialogDescription className="text-blue-100 text-lg mt-2 leading-relaxed pr-8 max-h-[100px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
                                {selectedControl?.description}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto bg-slate-50">
                            <div className="p-8 space-y-8">
                                {/* AI Guidance Section */}
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-indigo-500" />
                                            AI Implementation Guidance
                                        </h3>
                                        {!generateGuidanceMutation.isPending && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleGenerateGuidance}
                                                className="rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-all"
                                            >
                                                <Sparkles className="w-3 h-3 mr-2" />
                                                {aiGuidance ? "Regenerate Guidance" : "Generate Guidance"}
                                            </Button>
                                        )}
                                    </div>

                                    {generateGuidanceMutation.isError ? (
                                        <div className="text-center py-8 px-4 bg-red-50 rounded-xl border border-red-100">
                                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Shield className="w-6 h-6 text-red-500" />
                                            </div>
                                            <h4 className="text-sm font-bold text-red-700 mb-1">Guidance Generation Failed</h4>
                                            <p className="text-xs text-red-600 mb-4 px-8">
                                                {generateGuidanceMutation.error?.message || "An unexpected error occurred while contacting the AI service."}
                                            </p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleGenerateGuidance}
                                                className="border-red-200 text-red-700 hover:bg-red-100 bg-white"
                                            >
                                                Try Again
                                            </Button>
                                        </div>
                                    ) : generateGuidanceMutation.isPending ? (
                                        <div className="py-12 px-4 text-center border-2 border-dashed border-indigo-100 rounded-xl bg-indigo-50/30">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <div className="relative w-16 h-16">
                                                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                                                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                                                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-indigo-500 animate-pulse" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-sm font-semibold text-slate-900">Generating AI Guidance</h4>
                                                    <p className="text-xs text-slate-500 max-w-[250px] mx-auto">
                                                        Analyzing control requirements and best practices...
                                                    </p>
                                                </div>
                                                <div className="w-full max-w-xs h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                                                    <div className="h-full bg-indigo-500 rounded-full animate-progress-indeterminate origin-left"></div>
                                                </div>
                                            </div>
                                        </div>

                                    ) : aiGuidance ? (
                                        <div className="prose prose-sm prose-slate max-w-none bg-indigo-50/50 p-4 rounded-xl">
                                            <ReactMarkdown>{aiGuidance}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 px-4">
                                            <Sparkles className="w-12 h-12 text-indigo-100 mx-auto mb-3" />
                                            <p className="text-sm text-slate-500 italic mb-4">
                                                Click the button above to generate AI-powered implementation guidance specific to this control.
                                            </p>
                                            {!selectedControl?.description && (
                                                <div className="bg-amber-50 text-amber-800 text-xs px-3 py-2 rounded-lg inline-block border border-amber-100">
                                                    Note: Standard description is missing for this control. AI will infer context from the title.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            <Activity className="w-4 h-4" />
                                            Implementation Status
                                        </Label>
                                        <Select value={implementationStatus} onValueChange={setImplementationStatus}>
                                            <SelectTrigger className="rounded-2xl border-none shadow-sm h-12 bg-white font-medium">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-xl">
                                                <SelectItem value="Implemented">Implemented</SelectItem>
                                                <SelectItem value="Partial">Partially Implemented</SelectItem>
                                                <SelectItem value="Planned">Planned</SelectItem>
                                                <SelectItem value="Not Implemented">Not Implemented</SelectItem>
                                                <SelectItem value="N/A">Not Applicable</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Compliance Result
                                        </Label>
                                        <Select value={complianceStatus} onValueChange={setComplianceStatus}>
                                            <SelectTrigger className="rounded-2xl border-none shadow-sm h-12 bg-white font-medium">
                                                <SelectValue placeholder="Select result" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-xl">
                                                <SelectItem value="Compliant">Compliant</SelectItem>
                                                <SelectItem value="Partial">Partial</SelectItem>
                                                <SelectItem value="Non-Compliant">Non-Compliant</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Implementation Description
                                    </Label>
                                    <Textarea
                                        className="min-h-[120px] rounded-3xl border-none shadow-sm bg-white p-6 focus-visible:ring-blue-500/20 text-slate-700 leading-relaxed"
                                        placeholder="Describe how this control is implemented in the system..."
                                        value={implementationDescription}
                                        onChange={(e) => setImplementationDescription(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Activity className="w-4 h-4" />
                                        Test Results & Assessment Observations
                                    </Label>
                                    <Textarea
                                        className="min-h-[120px] rounded-3xl border-none shadow-sm bg-white p-6 focus-visible:ring-blue-500/20 text-slate-700 leading-relaxed font-mono text-sm"
                                        placeholder="Enter artifacts, test dates, and observations..."
                                        value={testResults}
                                        onChange={(e) => setTestResults(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-white border-t border-slate-100 flex items-center justify-between sm:justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" className="rounded-xl text-slate-400 hover:text-slate-600">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Related Risks
                                </Button>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="rounded-2xl px-6">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saveMutation.isPending}
                                    className="bg-blue-600 hover:bg-blue-700 rounded-2xl px-8 shadow-lg shadow-blue-200"
                                >
                                    {saveMutation.isPending ? "Saving..." : "Save Assessment"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
