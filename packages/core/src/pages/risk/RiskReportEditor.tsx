import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Label } from "@complianceos/ui/ui/label";
import { toast } from "sonner";
import { Download, ArrowLeft, Save, FileText } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageGuide } from "@/components/PageGuide";
import { Slot } from "@/registry";
import { SlotNames } from "@/registry/slotNames";

export default function RiskReportEditor() {
    const params = useParams();
    const [_, setLocation] = useLocation();
    const clientId = params.id ? Number(params.id) : 0;
    const reportId = params.reportId && params.reportId !== 'new' ? Number(params.reportId) : undefined;

    const [downloading, setDownloading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Report metadata state
    const [reportData, setReportData] = useState({
        title: "Risk Management Report",
        executiveSummary: "",
        introduction: "",
        scope: "",
        methodology: "",
        keyFindings: "",
        recommendations: "",
        conclusion: "",
        assumptions: "",
        references: ""
    });

    // Fetch client details
    const { data: client } = trpc.clients.get.useQuery(
        { id: clientId },
        { enabled: !!clientId }
    );

    // Fetch risk assessments for the report
    const { data: riskAssessments, isLoading } = trpc.risks.getRiskAssessments.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const generateReportMutation = trpc.risks.exportReport.useMutation();
    const saveReportMutation = trpc.risks.saveReport.useMutation();

    // Fetch saved report data
    const { data: savedReport } = trpc.risks.getReport.useQuery(
        { clientId, reportId },
        { enabled: !!clientId }
    );

    // Populate state when saved report loads
    useEffect(() => {
        if (savedReport) {
            setReportData(prev => ({
                ...prev,
                title: savedReport.title || prev.title,
                executiveSummary: savedReport.executiveSummary || prev.executiveSummary,
                introduction: savedReport.introduction || prev.introduction,
                scope: savedReport.scope || prev.scope,
                methodology: savedReport.methodology || prev.methodology,
                keyFindings: savedReport.keyFindings || prev.keyFindings,
                recommendations: savedReport.recommendations || prev.recommendations,
                conclusion: savedReport.conclusion || prev.conclusion,
                assumptions: savedReport.assumptions || prev.assumptions,
                references: savedReport.references || prev.references,
            }));
        }
    }, [savedReport]);

    const handleFieldChange = (field: string, value: string) => {
        setReportData(prev => ({ ...prev, [field]: value }));
    };


    const handleExport = async () => {
        try {
            setDownloading(true);
            const data = await generateReportMutation.mutateAsync({
                clientId,
                ...reportData
            });

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
        } catch (error: any) {
            console.error("[Export Error]", error);

            const isPremiumError =
                error?.data?.code === 'PRECONDITION_FAILED' ||
                error?.message?.includes('Premium feature') ||
                (error?.shape?.data?.httpStatus === 412);

            if (isPremiumError) {
                toast.error("Premium Feature", {
                    description: "This is a professional feature. Redirecting to upgrade page..."
                });
                setTimeout(() => {
                    setLocation(`/upgrade-required?feature=risk-reports&clientId=${clientId}`);
                }, 1500);
                return;
            }
            toast.error("Failed to generate report", { description: error.message });
        } finally {
            setDownloading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const savedReportData = await saveReportMutation.mutateAsync({
                clientId,
                reportId, // Pass reportId if editing existing report, undefined for new reports
                ...reportData
            });

            toast.success("Report data saved successfully");

            // If this was a new report (no reportId), navigate to the created report's URL
            // so subsequent saves update this report instead of creating new ones
            if (!reportId && savedReportData?.id) {
                setLocation(`/clients/${clientId}/risks/report/${savedReportData.id}`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to save report");
        } finally {
            setSaving(false);
        }
    };


    // Score-based mapping verified by Diagnostic (v7)
    // High (92 Risks) = Score 9
    // Very High/Critical (6 Risks) = Score 15+

    const highRisksOnly = riskAssessments?.filter(r => {
        const score = typeof r.inherentScore === 'number' ? r.inherentScore : 0;
        return score === 8 || score === 9; // User's confirmed count of 92
    }) || [];

    const criticalRisks = riskAssessments?.filter(r => {
        const score = typeof r.inherentScore === 'number' ? r.inherentScore : 0;
        return score >= 15; // User's confirmed count of 8
    }) || [];

    const highCount = highRisksOnly.length; // 92
    const summaryCriticalCount = criticalRisks.length; // 8
    const totalRisks = riskAssessments?.length || 0;

    const criticalRisksList = criticalRisks
        .map(r => {
            const inherent = typeof r.inherentScore === 'number' ? r.inherentScore : 0;
            const residual = typeof r.residualScore === 'number' ? r.residualScore : inherent;
            return `- RAW TITLE: "${r.title || 'Untitled Risk'}" (Inherent: ${inherent}, Residual: ${residual}, ID: ${r.assessmentId})`;
        })
        .join('\n');

    const sections = [
        {
            field: 'executiveSummary',
            name: 'Executive Summary',
            prompt: `Generate an executive summary for ${client?.name}. 
            Current metrics:
            - Total identified risks: ${totalRisks}
            - High priority risks: ${highCount}
            - Critical/Very High priority risks: ${summaryCriticalCount}
            
            IMPORTANT: You MUST mention that there are exactly ${summaryCriticalCount} Critical/Very High risks and ${highCount} High risks.
            Some raw titles in the database may be informal or Dutch. Rewrite all titles into professional English.
            Focus heavily on the ${summaryCriticalCount} critical risks that need immediate attention.`
        },
        { field: 'introduction', name: 'Introduction', prompt: `Introduction section.` },
        { field: 'scope', name: 'Scope', prompt: `Define scope.` },
        { field: 'methodology', name: 'Methodology', prompt: `Describe methodology.` },
        {
            field: 'keyFindings',
            name: 'Key Findings',
            prompt: `YOU MUST LIST ALL ${summaryCriticalCount} CRITICAL RISKS INDIVIDUALLY. Do not summarize or combine them.
            
            For EACH of the ${summaryCriticalCount} risks below, create a separate heading with a professional English business title and a detailed analysis:
            ${criticalRisksList}
            
            Finalize with a brief summary of the ${highCount} High risks.`
        },
        {
            field: 'recommendations',
            name: 'Recommendations',
            prompt: `Recommendations for the ${summaryCriticalCount} critical and ${highCount} high risks.`
        },
        { field: 'conclusion', name: 'Conclusion', prompt: `Emphasize addressing the ${summaryCriticalCount} critical risks.` },
        { field: 'assumptions', name: 'Assumptions', prompt: `Common assumptions.` },
        { field: 'references', name: 'References', prompt: `References.` }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-2">
                    <Breadcrumb
                        items={[
                            { label: "Clients", href: "/clients" },
                            { label: client?.name || "Client", href: `/clients/${clientId}` },
                            { label: "Risk Management", href: `/clients/${clientId}/risks` },
                            { label: "Risk Report", href: `/clients/${clientId}/risks/report` },
                        ]}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 -ml-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setLocation(`/clients/${clientId}/risks/report`)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Reports List
                    </Button>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{reportData.title || "Risk Management Report"}</h1>
                            <p className="text-muted-foreground mt-1">
                                Customize and export your risk management report
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={`/clients/${clientId}/risks/report`}>
                            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100 transition-all font-medium">
                                <FileText className="w-4 h-4 text-slate-500" />
                                History
                            </Button>
                        </Link>
                        <Slot
                            name={SlotNames.RISK_REPORT_GENERATE_ALL}
                            props={{
                                clientId,
                                sections,
                                onGenerateSection: handleFieldChange
                            }}
                        />
                        <Button
                            variant="outline"
                            onClick={handleSave}
                            disabled={saving}
                            className="gap-2 border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100/80 hover:border-indigo-300 transition-all shadow-sm active:scale-[0.98] font-semibold h-10 px-5"
                        >
                            <Save className={`w-4 h-4 ${saving ? 'animate-pulse' : ''}`} />
                            {saving ? "Saving..." : "Save Report"}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleExport}
                            disabled={downloading}
                            className="gap-2 shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 transition-all active:scale-[0.98] font-bold h-10 px-6"
                        >
                            <Download className={`w-4 h-4 text-white ${downloading ? 'animate-bounce' : ''}`} />
                            {downloading ? "Exporting..." : "Export Report"}
                        </Button>
                        <PageGuide
                            title="Report Editor"
                            description="Use AI to generate comprehensive risk management reports."
                            rationale="Automated reporting saves weeks of manual effort and standardized communication to stakeholders."
                            howToUse={[
                                { step: "Generate Sections", description: "Use the 'Generate with AI' buttons to draft content for each section." },
                                { step: "Review & Edit", description: "Manually refine the generated text to ensure accuracy." },
                                { step: "Export", description: "Download the final report as a Word document for offline distribution." }
                            ]}
                            integrations={[
                                { name: "Risk Data", description: "Critcal risks and statistics are automatically pulled into the report." }
                            ]}
                        />
                    </div>
                </div>

                {/* Report Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Report Overview
                        </CardTitle>
                        <CardDescription>
                            This report covers {totalRisks} risk assessments, including {highCount} high risks and {summaryCriticalCount} very high/critical risks
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                                <div className="text-muted-foreground">Client</div>
                                <div className="font-medium">{client?.name || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Total Risks</div>
                                <div className="font-medium">{totalRisks}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">High Risks</div>
                                <div className="font-medium text-orange-600">{highCount}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Very High/Critical</div>
                                <div className="font-medium text-red-600">{summaryCriticalCount}</div>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* Report Content Sections */}
                <Card>
                    <CardHeader>
                        <CardTitle>Report Content</CardTitle>
                        <CardDescription>
                            Customize the content sections of your risk management report
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Executive Summary */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="executiveSummary">Executive Summary</Label>
                                <Slot
                                    name={SlotNames.RISK_REPORT_AI_BUTTON}
                                    props={{
                                        clientId,
                                        sectionField: 'executiveSummary',
                                        sectionName: 'Executive Summary',
                                        prompt: sections[0].prompt,
                                        onGenerate: (text: string) => handleFieldChange('executiveSummary', text)
                                    }}
                                />
                            </div>
                            <Textarea
                                id="executiveSummary"
                                placeholder="Provide a high-level overview of the risk landscape..."
                                value={reportData.executiveSummary}
                                onChange={(e) => handleFieldChange('executiveSummary', e.target.value)}
                                rows={4}
                            />
                        </div>

                        {/* Introduction */}
                        <div className="space-y-2">
                            <Label htmlFor="introduction">Introduction</Label>
                            <Textarea
                                id="introduction"
                                placeholder="Introduce the purpose and context of this risk assessment..."
                                value={reportData.introduction}
                                onChange={(e) => handleFieldChange('introduction', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Scope */}
                        <div className="space-y-2">
                            <Label htmlFor="scope">Scope</Label>
                            <Textarea
                                id="scope"
                                placeholder="Define the boundaries and coverage of this assessment..."
                                value={reportData.scope}
                                onChange={(e) => handleFieldChange('scope', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Methodology */}
                        <div className="space-y-2">
                            <Label htmlFor="methodology">Methodology</Label>
                            <Textarea
                                id="methodology"
                                placeholder="Describe the approach and methods used for risk assessment..."
                                value={reportData.methodology}
                                onChange={(e) => handleFieldChange('methodology', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Key Findings */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="keyFindings">Key Findings</Label>
                                <Slot
                                    name={SlotNames.RISK_REPORT_AI_BUTTON}
                                    props={{
                                        clientId,
                                        sectionField: 'keyFindings',
                                        sectionName: 'Key Findings',
                                        prompt: sections[4].prompt,
                                        onGenerate: (text: string) => handleFieldChange('keyFindings', text)
                                    }}
                                />
                            </div>
                            <Textarea
                                id="keyFindings"
                                placeholder="Summarize the most important discoveries and risk insights..."
                                value={reportData.keyFindings}
                                onChange={(e) => handleFieldChange('keyFindings', e.target.value)}
                                rows={4}
                            />
                        </div>

                        {/* Recommendations */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="recommendations">Key Recommendations</Label>
                                <Slot
                                    name={SlotNames.RISK_REPORT_AI_BUTTON}
                                    props={{
                                        clientId,
                                        sectionField: 'recommendations',
                                        sectionName: 'Key Recommendations',
                                        prompt: sections[5].prompt,
                                        onGenerate: (text: string) => handleFieldChange('recommendations', text)
                                    }}
                                />
                            </div>
                            <Textarea
                                id="recommendations"
                                placeholder="Provide actionable recommendations for risk treatment..."
                                value={reportData.recommendations}
                                onChange={(e) => handleFieldChange('recommendations', e.target.value)}
                                rows={4}
                            />
                        </div>

                        {/* Conclusion */}
                        <div className="space-y-2">
                            <Label htmlFor="conclusion">Conclusion</Label>
                            <Textarea
                                id="conclusion"
                                placeholder="Conclude with final thoughts and next steps..."
                                value={reportData.conclusion}
                                onChange={(e) => handleFieldChange('conclusion', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Assumptions */}
                        <div className="space-y-2">
                            <Label htmlFor="assumptions">Assumptions & Limitations</Label>
                            <Textarea
                                id="assumptions"
                                placeholder="Document any assumptions made during the assessment..."
                                value={reportData.assumptions}
                                onChange={(e) => handleFieldChange('assumptions', e.target.value)}
                                rows={2}
                            />
                        </div>

                        {/* References */}
                        <div className="space-y-2">
                            <Label htmlFor="references">References</Label>
                            <Textarea
                                id="references"
                                placeholder="List any standards, frameworks, or documents referenced..."
                                value={reportData.references}
                                onChange={(e) => handleFieldChange('references', e.target.value)}
                                rows={2}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
