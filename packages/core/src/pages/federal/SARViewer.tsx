import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation, useParams } from "wouter";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import {
    ArrowLeft, FileText, Download, Plus, Loader2,
    HelpCircle, Shield, AlertTriangle, CheckCircle2,
    Calendar, User, ClipboardCheck, Info, Save, Settings2,
    BarChart3, LayoutDashboard, Search
} from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Badge } from "@complianceos/ui/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@complianceos/ui/ui/dialog";

export default function SARViewer() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [_location, setLocation] = useLocation();
    const [createOpen, setCreateOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [newSarTitle, setNewSarTitle] = useState("");
    const [selectedSarId, setSelectedSarId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const utils = trpc.useUtils();
    const { data: sars, isLoading: loadingList } = trpc.federal.listSARs.useQuery({ clientId });
    const { data: ssps } = trpc.federal.listSSPs.useQuery({ clientId });
    const { data: selectedSar, isLoading: loadingDetail } = trpc.federal.getSAR.useQuery(
        { clientId, id: selectedSarId as number },
        { enabled: selectedSarId !== null }
    );

    const createMutation = trpc.federal.createSAR.useMutation({
        onSuccess: (data) => {
            toast.success("SAR created successfully");
            setCreateOpen(false);
            setNewSarTitle("");
            utils.federal.listSARs.invalidate({ clientId });
            setSelectedSarId(data.id);
        },
        onError: (err) => {
            toast.error("Failed to create SAR", { description: err.message });
        }
    });

    const updateSarMutation = trpc.federal.updateSAR.useMutation({
        onSuccess: () => {
            toast.success("SAR updated successfully");
            utils.federal.getSAR.invalidate({ clientId, id: selectedSarId as number });
            utils.federal.listSARs.invalidate({ clientId });
            setIsSaving(false);
        },
        onError: (err) => {
            toast.error("Failed to update SAR", { description: err.message });
            setIsSaving(false);
        }
    });

    const handleCreate = () => {
        if (!newSarTitle) return;
        createMutation.mutate({
            clientId,
            title: newSarTitle,
            assessorName: "Internal Assessor"
        });
    };

    const handleUpdateField = (field: string, value: any) => {
        if (!selectedSarId) return;
        setIsSaving(true);
        updateSarMutation.mutate({
            clientId,
            id: selectedSarId,
            [field]: value
        });
    };

    if (selectedSarId && selectedSar) {
        return (
            <DashboardLayout>
                <div className="space-y-6 pb-20 px-6">
                    <Breadcrumb
                        items={[
                            { label: "Federal", href: `/clients/${clientId}/federal` },
                            { label: "SAR List", onClick: () => setSelectedSarId(null) },
                            { label: selectedSar.title },
                        ]}
                    />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedSarId(null)}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{selectedSar.title}</h1>
                                    <Badge className={selectedSar.status === 'final' ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                                        {selectedSar.status?.toUpperCase() || 'DRAFT'}
                                    </Badge>
                                </div>
                                <p className="text-slate-500 mt-1">Assessed by: {selectedSar.assessorName || 'Not Assigned'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsGuideOpen(true)}>
                                <HelpCircle className="h-4 w-4 mr-2" />
                                Guide
                            </Button>
                            <Button variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                            <Button
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleUpdateField('status', selectedSar.status === 'draft' ? 'final' : 'draft')}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ClipboardCheck className="h-4 w-4 mr-2" />}
                                {selectedSar.status === 'draft' ? 'Finalize Report' : 'Revert to Draft'}
                            </Button>
                        </div>
                    </div>

                    <Tabs defaultValue="overview" className="space-y-6">
                        <TabsList className="bg-slate-100 p-1 rounded-xl">
                            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <LayoutDashboard className="h-4 w-4 mr-2" />
                                Overview
                            </TabsTrigger>
                            <TabsTrigger value="findings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Search className="h-4 w-4 mr-2" />
                                Findings
                            </TabsTrigger>
                            <TabsTrigger value="risk" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Risk Assessment
                            </TabsTrigger>
                            <TabsTrigger value="details" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Settings2 className="h-4 w-4 mr-2" />
                                System Details
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6 outline-none">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="md:col-span-2 border-slate-200 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-slate-900">Executive Summary</CardTitle>
                                        <CardDescription>High-level summary of assessment results for organizational leadership.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Textarea
                                            placeholder="Enter executive summary..."
                                            className="min-h-[200px] border-slate-200 focus:ring-blue-500"
                                            value={selectedSar.executiveSummary || ''}
                                            onBlur={(e) => handleUpdateField('executiveSummary', e.target.value)}
                                        />
                                    </CardContent>
                                    <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex justify-between py-3">
                                        <span className="text-xs text-slate-500">Auto-saves on blur</span>
                                        {isSaving && <Loader2 className="h-3 w-3 animate-spin text-blue-600" />}
                                    </CardFooter>
                                </Card>

                                <div className="space-y-6">
                                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                                        <div className="h-2 bg-blue-600" />
                                        <CardHeader>
                                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Assessment Info</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-50 p-2 rounded-lg">
                                                    <Calendar className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">Completion Date</p>
                                                    <p className="text-sm font-medium text-slate-900">
                                                        {selectedSar.assessmentCompletionDate ? new Date(selectedSar.assessmentCompletionDate).toLocaleDateString() : 'Not Set'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="bg-purple-50 p-2 rounded-lg">
                                                    <User className="h-4 w-4 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">Assessor</p>
                                                    <p className="text-sm font-medium text-slate-900">{selectedSar.assessorName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="bg-green-50 p-2 rounded-lg">
                                                    <Shield className="h-4 w-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">Impact Level</p>
                                                    <Badge variant="outline" className="text-xs">{selectedSar.impact?.toUpperCase() || 'MODERATE'}</Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-slate-200 shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-sm font-bold text-slate-900">Findings Chart</CardTitle>
                                        </CardHeader>
                                        <CardContent className="h-40 flex items-center justify-center bg-slate-50 rounded-lg mx-6 mb-6">
                                            <div className="text-center">
                                                <BarChart3 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                                                <p className="text-xs text-slate-500 uppercase font-black">Findings Visualization</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="findings" className="outline-none">
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-bold text-slate-900">Summary of Findings</CardTitle>
                                            <CardDescription>Detailed list of security controls found to be non-compliant.</CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" className="border-slate-300">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Manual Finding
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <Textarea
                                            placeholder="Provide a summary of all findings identified during the assessment..."
                                            className="min-h-[300px] border-slate-200 focus:ring-blue-500"
                                            value={selectedSar.summaryOfFindings || ''}
                                            onBlur={(e) => handleUpdateField('summaryOfFindings', e.target.value)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="risk" className="outline-none">
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold text-slate-900">Risk Executive Summary</CardTitle>
                                    <CardDescription>Summary of risks identified and recommended treatments.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        placeholder="Enter risk summary and professional opinion on system risk posture..."
                                        className="min-h-[300px] border-slate-200 focus:ring-blue-500"
                                        value={selectedSar.riskExecutiveSummary || ''}
                                        onBlur={(e) => handleUpdateField('riskExecutiveSummary', e.target.value)}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="details" className="outline-none">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-slate-900">System Identification</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Linked System Security Plan (SSP)</Label>
                                            <select
                                                className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                                value={selectedSar.sspId || ''}
                                                onChange={(e) => handleUpdateField('sspId', e.target.value ? parseInt(e.target.value) : null)}
                                            >
                                                <option value="">Select an SSP...</option>
                                                {ssps?.map((ssp: any) => (
                                                    <option key={ssp.id} value={ssp.id}>{ssp.title} ({ssp.framework})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>System Name</Label>
                                                <Input value={selectedSar.systemAcronym || ''} onBlur={(e) => handleUpdateField('systemAcronym', e.target.value)} placeholder="Acronym" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>System Type</Label>
                                                <Input value={selectedSar.systemType || ''} onBlur={(e) => handleUpdateField('systemType', e.target.value)} placeholder="e.g. Cloud/GSS" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Agency/Owner</Label>
                                            <Input value={selectedSar.agency || ''} onBlur={(e) => handleUpdateField('agency', e.target.value)} placeholder="Hosting Agency" />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-slate-900">Categorization Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase">Conf.</Label>
                                                <Input value={selectedSar.confidentiality || ''} onBlur={(e) => handleUpdateField('confidentiality', e.target.value)} className="h-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase">Integrity</Label>
                                                <Input value={selectedSar.integrity || ''} onBlur={(e) => handleUpdateField('integrity', e.target.value)} className="h-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase">Availability</Label>
                                                <Input value={selectedSar.availability || ''} onBlur={(e) => handleUpdateField('availability', e.target.value)} className="h-8" />
                                            </div>
                                        </div>
                                        <div className="space-y-1 pt-2">
                                            <Label>Package Type</Label>
                                            <Input value={selectedSar.packageType || ''} onBlur={(e) => handleUpdateField('packageType', e.target.value)} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* SAR Guide Dialog */}
                <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-blue-600" />
                                Security Assessment Report (SAR) Guide
                            </DialogTitle>
                            <DialogDescription>
                                Finalizing Step 4 (Assess) and preparing for Step 5 (Authorize) of the NIST RMF.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                <h4 className="font-bold text-blue-900 flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    The Purpose of the SAR
                                </h4>
                                <p className="text-sm text-blue-800 mt-1 leading-relaxed">
                                    The SAR documents the independent assessor's findings. It provides the **Authorizing Official (AO)**
                                    with the information needed to make a risk-based decision about whether to grant an
                                    **Authority to Operate (ATO)**.
                                </p>
                            </div>

                            <section className="space-y-2">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                    <ClipboardCheck className="h-4 w-4 text-slate-500" />
                                    1. Findings Summary
                                </h4>
                                <p className="text-sm text-slate-600">
                                    The core of the SAR is the list of non-compliant controls. Use this section to document exactly
                                    which security requirements were not met and the evidence observed during testing.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-slate-500" />
                                    2. Risk Assessment
                                </h4>
                                <p className="text-sm text-slate-600">
                                    Translate technical findings into business risk. Each finding should contribute to a
                                    **Residual Risk** calculation that the AO will eventually accept.
                                </p>
                            </section>

                            <section className="space-y-2 border-t pt-4 mt-4">
                                <h4 className="font-bold text-slate-900">Report Metadata</h4>
                                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                    <li><strong>Draft:</strong> Use this while performing the assessment.</li>
                                    <li><strong>Final:</strong> Lock the report once the independent review is complete.</li>
                                    <li><strong>Export:</strong> Generate a PDF for the official authorization package.</li>
                                </ul>
                            </section>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setIsGuideOpen(false)}>Got it</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-20 px-6">
                <Breadcrumb
                    items={[
                        { label: "Federal", href: `/clients/${clientId}/federal` },
                        { label: "Security Assessment Reports" },
                    ]}
                />

                <div className="flex items-center justify-between">
                    <div>
                        <Button variant="ghost" className="mb-2 pl-0 hover:pl-2 transition-all" onClick={() => setLocation(`/clients/${clientId}/federal`)}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                        </Button>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Security Assessment Reports (SAR)</h1>
                        <p className="text-slate-500 mt-1">Manage and review your security assessment findings for authorization.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsGuideOpen(true)}>
                            <HelpCircle className="h-4 w-4 mr-2" />
                            Guide
                        </Button>
                        <Button onClick={() => setCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> New Assessment
                        </Button>
                    </div>
                </div>

                {loadingList ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : (sars && sars.length > 0) ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pt-4">
                        {sars.map((sar: any) => (
                            <Card
                                key={sar.id}
                                className="group cursor-pointer hover:border-blue-300 hover:shadow-lg transition-all border-slate-200"
                                onClick={() => setSelectedSarId(sar.id)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
                                            <FileText className="h-5 w-5 text-slate-500 group-hover:text-blue-600" />
                                        </div>
                                        <Badge className={sar.status === 'final' ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                                            {sar.status?.toUpperCase() || 'DRAFT'}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg font-bold text-slate-900 mt-4">{sar.title}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(sar.createdAt).toLocaleDateString()}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500 font-medium">Assessor:</span>
                                            <span className="text-slate-900 font-semibold">{sar.assessorName || 'None'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500 font-medium">Findings:</span>
                                            <span className="text-slate-900 font-semibold">--</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0 pb-6">
                                    <Button variant="outline" size="sm" className="w-full border-slate-200 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                        View Assessment Details
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="mt-8 border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50">
                            <CardTitle className="text-lg font-bold text-slate-900">Assessment Summary</CardTitle>
                            <CardDescription>Overall compliance posture based on latest assessment.</CardDescription>
                        </CardHeader>
                        <CardContent className="py-12">
                            <div className="max-w-md mx-auto text-center">
                                <div className="bg-slate-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                                    <Search className="h-10 w-10 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">No Assessment Data Found</h3>
                                <p className="text-slate-500 mt-2 mb-8 leading-relaxed">
                                    Security Assessment Reports (SAR) are generated after technical testing.
                                    Create a report to document your findings.
                                </p>
                                <Button onClick={() => setCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 h-11 px-8">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Generate First Report
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <EnhancedDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    title="Create New SAR"
                    description="Start a new Security Assessment Report based on recent testing."
                    primaryAction={{
                        label: "Create Report",
                        onClick: handleCreate,
                        disabled: !newSarTitle || createMutation.isPending,
                        loading: createMutation.isPending
                    }}
                >
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="sar-title" className="font-bold">Report Title</Label>
                            <Input
                                id="sar-title"
                                value={newSarTitle}
                                onChange={(e) => setNewSarTitle(e.target.value)}
                                placeholder="e.g. FY26 Q1 FedRAMP Assessment"
                                className="border-slate-200 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </EnhancedDialog>

                {/* SAR Guide Dialog for List View */}
                <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-blue-600" />
                                Security Assessment Report (SAR) Guide
                            </DialogTitle>
                            <DialogDescription>
                                Phase 4 of the NIST Risk Management Framework (Assess).
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                <h4 className="font-bold text-blue-900 flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Phase Context: Assess
                                </h4>
                                <p className="text-sm text-blue-800 mt-1 leading-relaxed">
                                    The assessment phase involves verifying that security controls are implemented
                                    correctly and operating as intended. The **SAR** is the primary artifact produced
                                    during this step.
                                </p>
                            </div>

                            <section className="space-y-2">
                                <h4 className="font-bold text-slate-900">Key Components of a SAR</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="p-3 bg-white border border-slate-200 rounded-lg">
                                        <p className="font-bold text-xs uppercase text-slate-500">System Information</p>
                                        <p className="text-sm text-slate-600 mt-1">Acronym, type, version, and organizational ownership details.</p>
                                    </div>
                                    <div className="p-3 bg-white border border-slate-200 rounded-lg">
                                        <p className="font-bold text-xs uppercase text-slate-500">Findings Summary</p>
                                        <p className="text-sm text-slate-600 mt-1">Critical, High, Moderate, and Low findings across all controls.</p>
                                    </div>
                                    <div className="p-3 bg-white border border-slate-200 rounded-lg">
                                        <p className="font-bold text-xs uppercase text-slate-500">Risk Policy</p>
                                        <p className="text-sm text-slate-600 mt-1">Executive summary of the residual risk level.</p>
                                    </div>
                                    <div className="p-3 bg-white border border-slate-200 rounded-lg">
                                        <p className="font-bold text-xs uppercase text-slate-500">Assessor Details</p>
                                        <p className="text-sm text-slate-600 mt-1">Information about the independent party who performed the test.</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setIsGuideOpen(false)}>Got it</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
