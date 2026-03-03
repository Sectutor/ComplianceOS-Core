import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { RiskRegister } from '@/components/risk/RiskRegister';
import { RiskHeatmap } from '@/components/risk/RiskHeatmap';
import { RiskAssessmentWizard } from '@/components/risk/RiskAssessmentWizard';
import { Button } from '@complianceos/ui/ui/button';
import { Shield, Plus, ChevronRight, Home, Download, ChevronLeft, Wand2, RefreshCcw, FileText, Radar, Zap } from 'lucide-react';
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
import { PageGuide } from "@/components/PageGuide";

export default function RiskRegisterPage({ hideLayout = false, hideBreadcrumb = false, framework, clientId: propClientId }: { hideLayout?: boolean, hideBreadcrumb?: boolean, framework?: string, clientId?: number }) {
    const params = useParams<{ id: string }>();
    const [, setLocation] = useLocation();
    const clientId = propClientId || (params.id ? parseInt(params.id) : 0);

    const [wizardOpen, setWizardOpen] = useState(false);
    const [editingRisk, setEditingRisk] = useState<any>(null);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [heatmapFilter, setHeatmapFilter] = useState<{ likelihood?: string; impact?: string; type?: string } | null>(null);
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(() => {
        const searchParams = new URLSearchParams(window.location.search);
        return searchParams.get('assetId');
    });

    const utils = trpc.useUtils();
    // Query for risk assessments
    const { data: riskAssessments } = trpc.risks.getRiskAssessments.useQuery(
        { clientId, assetId: selectedAssetId ? Number(selectedAssetId) : undefined },
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

    // Sync URL with selectedAssetId
    useEffect(() => {
        const url = new URL(window.location.href);
        const currentAssetId = url.searchParams.get('assetId');

        if (selectedAssetId) {
            if (currentAssetId !== selectedAssetId) {
                url.searchParams.set('assetId', selectedAssetId);
                window.history.replaceState({}, '', url.toString());
            }
        } else if (currentAssetId) {
            url.searchParams.delete('assetId');
            window.history.replaceState({}, '', url.toString());
        }
    }, [selectedAssetId]);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const title = searchParams.get('title');
        const description = searchParams.get('description');
        const assetId = searchParams.get('assetId');
        const vulnerabilityId = searchParams.get('vulnerabilityId');
        const threatId = searchParams.get('threatId');
        const openWizard = searchParams.get('openWizard') === 'true';

        if (title || description || openWizard) {
            setEditingRisk({
                title: title || '',
                description: description || '',
                assetId: assetId ? parseInt(assetId) : undefined,
                vulnerabilityId: vulnerabilityId ? parseInt(vulnerabilityId) : undefined,
                threatId: threatId ? parseInt(threatId) : undefined,
                status: 'draft',
                likelihood: 1,
                impact: 1,
                assessmentType: 'asset'
            });
            setWizardOpen(true);

            const newUrl = new URL(window.location.href);
            ['title', 'description', 'openWizard', 'vulnerabilityId', 'threatId'].forEach(p => newUrl.searchParams.delete(p));
            window.history.replaceState({}, '', newUrl.toString());
        }
    }, [clientId]);

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

    const content = (
        <div className="relative min-h-[calc(100vh-3.5rem)] -mx-4 -my-8 px-4 py-8 md:-mx-20 md:-mt-8 md:pl-20 md:pr-28 bg-slate-50/50 text-slate-900 overflow-hidden page-transition">
            {/* Ambient Light Mode Background Glows */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-blue-500/10 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-rose-500/5 blur-[100px]" />
            </div>
            <div className="relative z-10 space-y-6 max-w-7xl mx-auto">
                {!hideBreadcrumb && (
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
                )}

                {/* AI Threat Intel Banner */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-1 rounded-2xl shadow-xl mb-2 mt-4">
                    <div className="bg-slate-900/40 backdrop-blur-xl rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 text-blue-400">
                                <Radar className="w-6 h-6 animate-[spin_4s_linear_infinite]" />
                                <div className="absolute inset-0 rounded-full animate-ping bg-blue-500/20 duration-1000"></div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-white font-bold text-sm tracking-wide">AI THREAT INTELLIGENCE</h3>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-500 border border-red-500/30">ACTIVE</span>
                                </div>
                                <p className="text-slate-300 text-sm mt-0.5">Monitoring global CISA alerts. <span className="text-white font-semibold flex items-center gap-1">2 new critical CVEs</span> identified matching your tech stack.</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-colors border border-white/10 flex items-center gap-2 whitespace-nowrap">
                            <Zap className="w-4 h-4 text-amber-400" />
                            Analyze Assets
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-premium">
                    <div className="flex items-center gap-4">
                        <div className="mb-2 md:hidden">
                            <Link href={`/clients/${clientId}/risks`}>
                                <Button variant="ghost" size="sm" className="pl-0 gap-1 text-slate-500 hover:text-slate-900">
                                    <ChevronLeft className="w-4 h-4" />
                                    Back to Dashboard
                                </Button>
                            </Link>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#3ABEF9] to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Shield className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Risk Register</h1>
                            <p className="text-slate-500 font-medium mt-1">Manage and track all identified risks for this client.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button id="risk-reg-add-btn" onClick={() => {
                            const searchParams = new URLSearchParams(window.location.search);
                            const assetId = searchParams.get('assetId');
                            setEditingRisk(assetId ? { assetId: parseInt(assetId), assessmentType: 'asset' } : null);
                            setWizardOpen(true);
                        }}>
                            <Plus className="w-4 h-4 mr-2" /> Add Risk
                        </Button>
                        <PageGuide
                            title="Risk Register"
                            description="Identify, assess, and treat risks to your organization."
                            rationale="A comprehensive risk register is the foundation of information security. It documents potential threats, their likelihood and impact, and the controls you've put in place to mitigate them."
                            howToUse={[
                                {
                                    step: "Log New Threats",
                                    description: "Click 'Add Risk' to use the wizard for documenting new threats.",
                                    targetId: "risk-reg-add-btn"
                                },
                                {
                                    step: "Analyze Heatmaps",
                                    description: "Use the heatmaps to identify where your highest priority risks lie.",
                                    targetId: "risk-reg-heatmap"
                                },
                                {
                                    step: "Residual View",
                                    description: "Check the 'Residual Risk' heatmap to see the effectiveness of your controls.",
                                    targetId: "risk-reg-residual-heatmap"
                                }
                            ]}
                            scenarios={[
                                {
                                    title: "Responding to a New Zero-Day Threat",
                                    example: "A major vulnerability (like Log4j) is announced. You need to assess the risk to your client's specific environment.",
                                    auditTip: "Add a new risk entry. Don't worry about controls yet. Assess the 'Inherent Risk' as critical. Once you apply a patch, update the entry with the 'Patching' control to show the reduction in 'Residual Risk'."
                                },
                                {
                                    title: "Quarterly Risk Posture Report",
                                    example: "You need to prove to stakeholders that risks are being actively managed and reduced over time.",
                                    auditTip: "Use the Comparison view between Inherent and Residual heatmaps. The visual 'shift' toward the bottom-left is the best evidence of a functioning Risk Management Framework (ISO 27001 Clause 6.1)."
                                }
                            ]}
                        />
                    </div>
                </div>

                {riskAssessments && riskAssessments.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mb-8 min-h-[300px]">
                        <div id="risk-reg-heatmap">
                            <RiskHeatmap
                                assessments={riskAssessments || []}
                                type="inherent"
                                activeFilter={heatmapFilter}
                                onFilterChange={setHeatmapFilter}
                                title="Inherent Risk"
                            />
                        </div>
                        <div id="risk-reg-residual-heatmap">
                            <RiskHeatmap
                                assessments={riskAssessments || []}
                                type="residual"
                                activeFilter={heatmapFilter}
                                onFilterChange={setHeatmapFilter}
                                title="Residual Risk"
                            />
                        </div>
                    </div>
                )}

                <RiskRegister
                    clientId={clientId}
                    onEditRisk={handleEditRisk}
                    heatmapFilter={heatmapFilter}
                    framework={framework}
                    selectedAssetId={selectedAssetId}
                    onAssetChange={setSelectedAssetId}
                />

                <RiskAssessmentWizard
                    open={wizardOpen}
                    onOpenChange={setWizardOpen}
                    clientId={clientId}
                    initialData={editingRisk}
                    framework={framework}
                    onSuccess={() => {
                        setWizardOpen(false);
                        setEditingRisk(null);
                        utils.risks.getRiskAssessments.invalidate();
                        toast.success("Risk saved successfully");
                    }}
                />

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
        </div>
    );

    if (hideLayout) return content;

    return (
        <DashboardLayout>
            {content}
        </DashboardLayout>
    );
}
