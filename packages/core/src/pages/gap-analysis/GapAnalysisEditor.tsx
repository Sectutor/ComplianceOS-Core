
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Loader2, ArrowLeft, Download, Sparkles, Mail, FileText, History, CheckCircle } from "lucide-react"; // Kept Sparkles for button icon

import { toast } from "sonner";
import { Progress } from "@complianceos/ui/ui/progress";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { EmailQuestionsDialog } from "@/components/gap-analysis/EmailQuestionsDialog";
import { QuestionnaireHistoryDialog } from "@/components/gap-analysis/QuestionnaireHistoryDialog";
import { ReportSettingsDialog } from "@/components/gap-analysis/ReportSettingsDialog";
import { GapAnalysisControlCard } from "@/components/gap-analysis/GapAnalysisControlCard";
import { GapAnalysisFilters } from "@/components/gap-analysis/GapAnalysisFilters";
import { GapRadarChart } from "@/components/gap-analysis/GapRadarChart";

export default function GapAnalysisEditor() {
    const params = useParams();
    const [_, setLocation] = useLocation();
    const clientId = Number(params.id);
    const assessmentId = Number(params.assessmentId);

    // Fetch Assessment & Responses
    const { data: assessmentData, isLoading: loadingAssessment, refetch: refetchAssessment } = trpc.gapAnalysis.get.useQuery({ id: assessmentId });

    // Fetch Master Controls
    const { data: controls, isLoading: loadingControls } = trpc.controls.list.useQuery({});

    const updateResponseMutation = trpc.gapAnalysis.updateResponse.useMutation();
    const completeMutation = trpc.gapAnalysis.complete.useMutation();

    const [filterDomain, setFilterDomain] = useState<string>("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedControlIds, setSelectedControlIds] = useState<number[]>([]);
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [reportSettingsOpen, setReportSettingsOpen] = useState(false);


    // Safe unwrapper for SuperJSON mismatch
    const safeUnwrap = (data: any) => {
        if (data && typeof data === 'object' && 'json' in data && (Array.isArray(data.json) || typeof data.json === 'object')) {
            return data.json;
        }
        return data;
    };

    const unwrappedAssessmentData = safeUnwrap(assessmentData);
    const assessment = unwrappedAssessmentData?.assessment;
    const responses = unwrappedAssessmentData?.responses || [];
    // Safe filter
    const rawControls = controls;
    const unwrappedControls = safeUnwrap(rawControls);
    const safeControls = Array.isArray(unwrappedControls) ? unwrappedControls : [];

    // Helper to get response for a control
    const getResponse = (controlId: string) => responses.find(r => r.controlId === controlId);

    // 1. First, filter by Framework
    const controlsByFramework = safeControls.filter(c => {
        // Strict matching for known standard families to prevent overlap
        if (assessment?.framework && c.framework) {
            const aFw = assessment.framework.toLowerCase();
            const cFw = c.framework.toLowerCase();

            // NIST CSF Matching
            if (aFw.includes('nist csf') || aFw.includes('cybersecurity framework')) {
                if (!cFw.includes('nist csf') && !cFw.includes('cybersecurity framework')) {
                    return false;
                }
            }
            // NIST 800-53 / 800-171 Matching (ensure they don't match CSF)
            else if (aFw.includes('800-53') || aFw.includes('800-171')) {
                if (cFw.includes('nist csf')) return false;
                if (!cFw.includes(aFw) && !aFw.includes(cFw)) return false;
            }
            // ISO 27001 Matching
            else if (aFw.includes('iso') && aFw.includes('27001')) {
                if (!cFw.includes('iso') || !cFw.includes('27001')) return false;
            }
            // Default loose match for others
            else if (!cFw.includes(aFw) && !aFw.includes(cFw)) {
                return false;
            }
        }
        return true;
    });

    // 2. Get unique domains and sort them (Specific to the filtered framework)
    const domains = Array.from(new Set(controlsByFramework.map(c => c.category).filter(Boolean))).sort();

    // 3. Apply UI Filters (Domain & Search)
    const filteredControls = controlsByFramework.filter(c => {
        // Domain Filter
        if (filterDomain !== "All" && c.category !== filterDomain) return false;

        // Search Filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            return (c.controlId && c.controlId.toLowerCase().includes(search)) ||
                c.name.toLowerCase().includes(search) ||
                c.description?.toLowerCase().includes(search);
        }
        return true;
    }) || [];

    // Reset filter if the selected domain is no longer valid for the current set
    useEffect(() => {
        if (filterDomain !== "All" && !domains.includes(filterDomain)) {
            setFilterDomain("All");
        }
    }, [domains.join(','), filterDomain]); // Join to avoid deep array dependency issues

    // Progress stats
    const totalControls = filteredControls.length;
    const answeredControls = filteredControls.filter(c => {
        const r = getResponse(c.controlId);
        return r?.currentStatus;
    }).length;
    const progress = totalControls > 0 ? (answeredControls / totalControls) * 100 : 0;

    const handleUpdate = async (controlId: string, field: string, value: string) => {
        try {
            await updateResponseMutation.mutateAsync({
                assessmentId,
                controlId,
                [field]: value
            });
            refetchAssessment();
        } catch (error) {
            toast.error("Failed to save changes");
        }
    };

    const handleComplete = async () => {
        try {
            await completeMutation.mutateAsync({ id: assessmentId });
            toast.success("Assessment completed!");
            refetchAssessment();
        } catch (error) {
            toast.error("Failed to complete assessment");
        }
    };

    const createRiskMutation = trpc.risks.createRiskAssessment.useMutation();
    const createActionMutation = trpc.actions.create.useMutation();
    const generateReportMutation = trpc.gapAnalysis.exportReport.useMutation();
    const [downloading, setDownloading] = useState(false);
    const [prioritizing, setPrioritizing] = useState(false);
    const calculatePrioritiesMutation = trpc.gapAnalysis.calculatePriorities.useMutation();

    const handlePrioritize = async () => {
        try {
            setPrioritizing(true);
            await calculatePrioritiesMutation.mutateAsync({ assessmentId });
            toast.success("Gaps prioritized! Refresh to see scores.");
            // Refetch data
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error("Failed to calculate priorities");
        } finally {
            setPrioritizing(false);
        }
    };

    const handleExport = async () => {
        try {
            setDownloading(true);
            const rawData = await generateReportMutation.mutateAsync({ assessmentId });
            const data = safeUnwrap(rawData);

            // Convert base64 to blob and download
            const byteCharacters = atob(data.base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });

            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = data.filename;
            link.click();

            toast.success("Report downloaded successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate report");
        } finally {
            setDownloading(false);
        }
    };

    const handleRaiseRisk = async (control: any, response: any) => {
        try {
            await createRiskMutation.mutateAsync({
                clientId,
                assessmentId: `RISK-${control.controlId}-${Date.now()}`, // Auto-generate an ID
                title: `Gap: ${control.controlId} - ${control.name}`,
                gapResponseId: response?.id,
                // Pre-fill context
                vulnerabilityDescription: "Control Not Implemented",
                threatDescription: "Potential exploitation due to missing control",
                impact: 3, // Default (Medium)
                likelihood: 3, // Default (Possible)
                status: "draft",
                affectedAssets: [], // User needs to fill
                existingControls: "None",
            });
            toast.success("Risk raised successfully. View in Risk Register.");
        } catch (error) {
            console.error(error);
            toast.error("Failed to raise risk");
        }
    };

    const handleCreateAction = async (control: any, response: any) => {
        try {
            await createActionMutation.mutateAsync({
                clientId,
                title: `Remediate: ${control.controlId} - ${control.name}`,
                description: `Gap identified during ${assessment?.name || 'Gap Analysis'}. Current status: ${response?.currentStatus || 'Not Implemented'}.`,
                priority: response?.currentStatus === 'not_implemented' ? 'high' : 'medium',
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            });
            toast.success("Task created in Action Center.");
        } catch (error) {
            console.error(error);
            toast.error("Failed to create task");
        }
    };

    if (loadingAssessment || loadingControls) {
        return (
            <DashboardLayout>
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!assessment) return <DashboardLayout><div>Assessment not found</div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="p-8 space-y-6 max-w-7xl mx-auto">

                {/* Header Section */}
                <div className="space-y-4 mb-8">
                    <Button
                        variant="ghost"
                        className="w-fit pl-0 text-slate-500 hover:text-slate-900 transition-colors"
                        onClick={() => setLocation(`/clients/${clientId}/gap-analysis`)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Gap Assessments
                    </Button>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* 1. Radar Chart showing gaps by domain */}
                        <GapRadarChart
                            controls={filteredControls}
                            responses={responses}
                            framework={assessment.framework || ''}
                        />

                        {/* 2. Export Button Card */}
                        <Card className="lg:col-span-2 border-slate-200 shadow-sm bg-gradient-to-b from-teal-50/50 to-white flex flex-col p-4">
                            <Button
                                variant="outline"
                                onClick={handleExport}
                                disabled={downloading}
                                className="flex-1 flex flex-col items-center justify-center gap-4 bg-white border-teal-200 text-teal-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all shadow-sm group py-8"
                            >
                                <div className="p-4 rounded-full bg-teal-50 group-hover:bg-white/20 transition-colors">
                                    {downloading ? (
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                    ) : (
                                        <Download className="w-8 h-8" />
                                    )}
                                </div>
                                <span className="font-black uppercase text-xs tracking-widest px-2 text-center">Export Report</span>
                            </Button>
                        </Card>

                        {/* 3. Report Configuration & Action Center */}
                        <Card className="lg:col-span-5 border-slate-200 shadow-sm p-6 flex flex-col justify-between bg-slate-50/20">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setReportSettingsOpen(true)}
                                        className="flex-1 h-12 bg-white border-slate-200 shadow-sm hover:shadow-md transition-all font-bold text-slate-700 gap-2"
                                    >
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        Report Configuration
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => setEmailDialogOpen(true)}
                                        disabled={selectedControlIds.length === 0}
                                        className="flex-1 h-12 bg-blue-50/50 border-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white transition-all font-bold gap-2"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Email Questions
                                        {selectedControlIds.length > 0 && (
                                            <Badge className="ml-1 bg-blue-600 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                                                {selectedControlIds.length}
                                            </Badge>
                                        )}
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setHistoryDialogOpen(true)}
                                        className="h-12 w-12 border border-slate-200 bg-white"
                                    >
                                        <History className="w-4 h-4 text-slate-500" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        onClick={handlePrioritize}
                                        disabled={prioritizing}
                                        className="h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-none font-bold shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        {prioritizing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                        AI Prioritize
                                    </Button>

                                    {assessment.status !== 'completed' && (
                                        <Button
                                            onClick={handleComplete}
                                            disabled={progress < 100}
                                            className="h-12 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-none font-bold shadow-lg shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Complete
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-white border border-slate-100 rounded-xl">
                                <h3 className="text-lg font-bold text-slate-900 truncate">{assessment.name}</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">Focus on high-impact gaps to improve compliance posture.</p>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Filters */}
                <GapAnalysisFilters
                    filterDomain={filterDomain}
                    setFilterDomain={setFilterDomain}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    domains={domains as string[]}
                    totalCount={filteredControls.length}
                />

                {/* Control List */}
                <div className="space-y-4">
                    {filteredControls.map(control => {
                        const response = getResponse(control.controlId);

                        return (
                            <GapAnalysisControlCard
                                key={control.id}
                                control={control}
                                response={response}
                                selected={selectedControlIds.includes(control.id)}
                                onSelect={(checked) => {
                                    setSelectedControlIds(prev =>
                                        checked
                                            ? [...prev, control.id]
                                            : prev.filter(id => id !== control.id)
                                    );
                                }}
                                onUpdate={(field, value) => handleUpdate(control.controlId, field, value)}
                                onRaiseRisk={() => handleRaiseRisk(control, response)}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Email Questions Dialog */}
            <EmailQuestionsDialog
                open={emailDialogOpen}
                onOpenChange={setEmailDialogOpen}
                assessmentId={assessmentId}
                selectedControlIds={selectedControlIds}
                controls={filteredControls?.map(c => ({ id: c.id, controlId: c.controlId, name: c.name })) || []}
            />

            {/* Report Settings Dialog */}
            <ReportSettingsDialog
                open={reportSettingsOpen}
                onOpenChange={setReportSettingsOpen}
                assessmentId={assessmentId}
                initialData={{
                    executiveSummary: assessment?.executiveSummary,
                    introduction: assessment?.introduction,
                    keyRecommendations: assessment?.keyRecommendations as string[] | undefined
                }}
                onSave={refetchAssessment}
            />

            {/* History Dialog */}
            <QuestionnaireHistoryDialog
                open={historyDialogOpen}
                onOpenChange={setHistoryDialogOpen}
                assessmentId={assessmentId}
            />
        </DashboardLayout>
    );
}

function StatusBadge({ status }: { status: string | null }) {
    if (!status) return null;
    const variants: Record<string, any> = {
        'draft': 'default',
        'in_progress': 'info',
        'completed': 'success',
    };
    const labels: Record<string, string> = {
        'draft': 'Draft',
        'in_progress': 'In Progress',
        'completed': 'Completed',
    };
    return (
        <Badge
            variant={variants[status] || 'default'}
            className="font-semibold shadow-sm px-3 uppercase text-[10px]"
        >
            {labels[status] || status.replace('_', ' ')}
        </Badge>
    );
}
