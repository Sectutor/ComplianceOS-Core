import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { RiskRegister } from '@/components/risk/RiskRegister';
import { RiskHeatmap } from '@/components/risk/RiskHeatmap';
import { RiskAssessmentWizard } from '@/components/risk/RiskAssessmentWizard';
import { Button } from '@complianceos/ui/ui/button';
import { Shield, Plus, ChevronRight, Home, Download, ChevronLeft, Wand2, RefreshCcw, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@complianceos/ui/ui/breadcrumb";
import { usePageHelp } from '@/hooks/usePageHelp';

export default function RiskRegisterPage() {
    usePageHelp({
        pageTitle: "Risk Register",
        description: "This is the central repository for all identified risks. Use this page to add new risks, assess their inherent and residual levels, and assign owners.",
        keyTopics: ["Risk Assessment", "Inherent Risk", "Residual Risk", "Risk Treatment", "Risk Owners"],
        dataSummary: {
            context: "User is viewing the Risk Register table and heatmaps."
        }
    });
    const params = useParams<{ id: string }>();
    const [_, setLocation] = useLocation();
    const clientId = params.id ? parseInt(params.id) : 0;
    const [wizardOpen, setWizardOpen] = useState(false);
    const [editingRisk, setEditingRisk] = useState<any>(null);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [heatmapFilter, setHeatmapFilter] = useState<{ likelihood?: string; impact?: string; type?: string } | null>(null);

    const utils = trpc.useUtils();
    // Query for risk assessments
    const { data: riskAssessments } = trpc.risks.getRiskAssessments.useQuery(
        { clientId },
        { enabled: !!clientId }
    );
    const exportReportMutation = trpc.risks.exportReport.useMutation();
    const [exporting, setExporting] = useState(false);

    const aiAnalysisMutation = trpc.risks.generateAIAnalysis.useMutation({
        onSuccess: (data) => {
            setAiAnalysis(data);
            setAnalyzing(false);
            setReportModalOpen(true);
            utils.risks.getReport.invalidate({ clientId });
            toast.success("AI Analysis generated and saved to Report Area");
        },
        onError: (err) => {
            setAnalyzing(false);
            toast.error(`Analysis failed: ${err.message}`);
        }
    });

    const handleGenerateReport = async () => {
        setAnalyzing(true);
        aiAnalysisMutation.mutate({ clientId });
    };

    // Check for query params to auto-open wizard (e.g. from Asset Active Threats)
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const title = searchParams.get('title');
        const description = searchParams.get('description');
        const assetId = searchParams.get('assetId');

        if (title || description) {
            setEditingRisk({
                riskName: title || '',
                description: description || '',
                assetId: assetId ? parseInt(assetId) : undefined,
                // Add defaults to ensure wizard handles it as a new risk
                status: 'Open',
                likelihood: 1,
                impact: 1
            });
            setWizardOpen(true);

            // Optional: Clean up URL to avoid reopening on refresh
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, []);

    if (!clientId) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center text-destructive">Invalid Client ID</div>
            </DashboardLayout>
        );
    }

    const handleEditRisk = (risk: any) => {
        setEditingRisk(risk);
        setWizardOpen(true);
    };

    const handleExportRiskReport = async () => {
        try {
            setExporting(true);
            toast.info("Generating report...", { description: "This may take a few seconds." });

            const data = await exportReportMutation.mutateAsync({ clientId });

            if (!data.base64) {
                throw new Error("Received empty report from server.");
            }

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

            toast.success("Export successful", { description: `Report downloaded: ${data.filename}` });
        } catch (e: any) {
            console.error("Export failed:", e);
            if (e?.data?.code === 'PRECONDITION_FAILED') {
                setLocation(`/upgrade-required?feature=risk-reports&clientId=${clientId}`);
                return;
            }
            toast.error("Export failed", { description: e.message || "An unexpected error occurred." });
        } finally {
            setExporting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Breadcrumb Navigation */}
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={`/clients/${clientId}`}>
                                    <Home className="w-4 h-4" />
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>
                            <ChevronRight className="w-4 h-4" />
                        </BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={`/clients/${clientId}/risks`}>Risk Management</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>
                            <ChevronRight className="w-4 h-4" />
                        </BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Risk Register</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex items-center justify-between">
                    <div>
                        <div className="mb-2">
                            <Link href={`/clients/${clientId}/risks`}>
                                <Button variant="ghost" size="sm" className="pl-0 gap-1 text-muted-foreground hover:text-foreground">
                                    <ChevronLeft className="w-4 h-4" />
                                    Back to Dashboard
                                </Button>
                            </Link>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-950">Risk Register</h1>
                        <p className="text-slate-900 mt-1 font-medium">Manage and track all identified risks for this client.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="primary"
                            onClick={handleGenerateReport}
                            disabled={analyzing || !riskAssessments || riskAssessments.length === 0}
                            className="gap-2 shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 transition-all active:scale-[0.98] text-white"
                        >
                            {analyzing ? (
                                <RefreshCcw className="w-4 h-4 animate-spin text-white" />
                            ) : (
                                <Wand2 className="w-4 h-4 text-white" />
                            )}
                            {analyzing ? "AI Analyzing Risks..." : "AI Management Report"}
                        </Button>
                        <Button onClick={() => { setEditingRisk(null); setWizardOpen(true); }}>
                            <Plus className="w-4 h-4 mr-2" /> Add Risk
                        </Button>
                    </div>
                </div>

                {/* Heatmaps Row */}
                {riskAssessments && riskAssessments.length > 0 && (
                    <div className="h-64 grid grid-cols-2 gap-4 mb-8">
                        <RiskHeatmap
                            assessments={riskAssessments || []}
                            type="inherent"
                            activeFilter={heatmapFilter}
                            onFilterChange={setHeatmapFilter}
                            title="Inherent Risk"
                        />
                        <RiskHeatmap
                            assessments={riskAssessments || []}
                            type="residual"
                            activeFilter={heatmapFilter}
                            onFilterChange={setHeatmapFilter}
                            title="Residual Risk"
                        />
                    </div>
                )}

                {/* Risk Register Table */}
                <RiskRegister clientId={clientId} onEditRisk={handleEditRisk} heatmapFilter={heatmapFilter} />

                {/* Wizard Modal */}
                <RiskAssessmentWizard
                    open={wizardOpen}
                    onOpenChange={setWizardOpen}
                    clientId={clientId}
                    initialData={editingRisk}
                    onSuccess={() => {
                        setWizardOpen(false);
                        setEditingRisk(null);
                        utils.risks.getRiskAssessments.invalidate();
                        toast.success("Risk saved successfully");
                    }}
                />

                {/* AI Report Modal */}
                <EnhancedDialog
                    open={reportModalOpen}
                    onOpenChange={setReportModalOpen}
                    title="AI Risk Management Analysis"
                    description="Strategic report generated based on current Risk Register data."
                    size="3xl"
                >
                    <div className="max-h-[70vh] overflow-y-auto p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 shadow-inner">
                        <div className="prose prose-slate max-w-none prose-sm dark:prose-invert 
                            prose-headings:text-slate-900 prose-headings:font-bold prose-headings:mb-3 prose-headings:mt-6
                            prose-p:text-slate-800 prose-p:leading-relaxed prose-p:mb-4
                            prose-li:text-slate-800 prose-li:mb-1
                            prose-strong:text-slate-950 prose-strong:font-bold
                            prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg">
                            <ReactMarkdown>{aiAnalysis || ''}</ReactMarkdown>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="outline" onClick={() => setReportModalOpen(false)}>
                            Close
                        </Button>
                        <Button
                            variant="secondary"
                            className="gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                            onClick={() => {
                                setReportModalOpen(false);
                                setLocation(`/clients/${clientId}/risks/report`);
                            }}
                        >
                            <FileText className="w-4 h-4" />
                            Edit in Report Editor
                        </Button>
                        <Button
                            className="gap-2 bg-slate-900 hover:bg-slate-800"
                            onClick={() => {
                                const blob = new Blob([aiAnalysis || ''], { type: 'text/markdown' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `Risk_Management_Report_${new Date().toISOString().split('T')[0]}.md`;
                                a.click();
                                toast.success("Report downloaded as Markdown");
                            }}
                        >
                            <Download className="w-4 h-4" />
                            Download Markdown
                        </Button>
                    </div>
                </EnhancedDialog>
            </div>
        </DashboardLayout>
    );
}
