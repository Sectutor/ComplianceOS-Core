import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@complianceos/ui";
import { trpc } from '@/lib/trpc';
import {
    FileText,
    Download,
    Calendar,
    FileBarChart,
    Plus,
    FileCheck,
    ShieldCheck,
    ChevronRight,
    Search,
    Filter,
    Sparkles,
    Shield,
    Activity,
    AlertTriangle,
    BookOpen,
    Layout,
    Check,
    Trash2
} from "lucide-react";
import {
    Button,
    Badge,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Input,
    Label

} from "@complianceos/ui";
import { toast } from 'sonner';

interface ReportsDashboardProps {
    clientId: number;
}

const REPORT_SECTIONS = [
    { id: 'executive_summary', label: 'Executive Summary', desc: 'AI-driven high-level business posture overview', icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'gap_analysis', label: 'Gap Analysis & Maturity', desc: 'Detailed breakdown of compliance readiness score', icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'risks', label: 'Risk Portfolio', desc: 'Strategic risks and mitigation status', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'controls', label: 'Control Verification', desc: 'Evidence-backed status for all active controls', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'bcp', label: 'Business Continuity (BCP)', desc: 'Resilience projects and recovery strategies', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'bia', label: 'Business Impact (BIA)', desc: 'Analysis of critical processes and RTOs', icon: FileText, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { id: 'assets', label: 'Asset Inventory', desc: 'Hardware, software, and information assets', icon: Layout, color: 'text-slate-600', bg: 'bg-slate-50' },
    { id: 'vendors', label: 'Vendor Risk', desc: 'Third-party assessments and supply chain security', icon: ShieldCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'incidents', label: 'Incident History', desc: 'Log of security events and response efficacy', icon: Activity, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'vulnerabilities', label: 'Vulnerability Scan', desc: 'Technical debt and patch management status', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'audit', label: 'Audit Findings', desc: 'Internal and external audit observation results', icon: BookOpen, color: 'text-zinc-600', bg: 'bg-zinc-50' },
    { id: 'strategic_vision', label: 'Strategic Vision', desc: 'Future roadmap and compliance trajectory', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'implementation_plan', label: 'Implementation Plan', desc: 'Step-by-step guidance for control rollout', icon: Layout, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'kpis_metrics', label: 'KPIs & Metrics', desc: 'Key performance indicators for governance', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'governance', label: 'Governance', desc: 'Management oversight and policy framework', icon: Shield, color: 'text-slate-600', bg: 'bg-slate-50' },
];

export const ReportsDashboard = ({ clientId }: ReportsDashboardProps) => {
    const [isGeneratorOpen, setIsGeneratorOpen] = React.useState(false);
    const [reportTitle, setReportTitle] = React.useState(`Compliance intelligence Report - ${new Date().toLocaleDateString()}`);
    const [selectedSections, setSelectedSections] = React.useState<string[]>(['executive_summary']);
    const [reportFormat, setReportFormat] = React.useState<'pdf' | 'docx'>('pdf');
    const [reportToDelete, setReportToDelete] = React.useState<number | null>(null);

    const { data: reports, isLoading, refetch } = trpc.reports.getReportHistory.useQuery({
        clientId,
        limit: 20
    });

    const generateReportMutation = trpc.reports.generateReport.useMutation({
        onSuccess: (data) => {
            toast.success("Report generated successfully!");
            const blob = new Blob([Uint8Array.from(atob(data.pdfBase64), c => c.charCodeAt(0))], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.filename;
            a.click();
            refetch();
        },
        onError: (err) => {
            toast.error("Failed to generate report: " + err.message);
        }
    });

    const deleteReportMutation = trpc.reports.deleteReport.useMutation({
        onSuccess: () => {
            toast.success("Report deleted successfully");
            refetch();
        },
        onError: (err) => {
            toast.error("Failed to delete report: " + err.message);
        }
    });

    const handleDeleteReport = (reportId: number) => {
        setReportToDelete(reportId);
    };

    const confirmDelete = () => {
        if (reportToDelete) {
            deleteReportMutation.mutate({ reportId: reportToDelete, clientId });
            setReportToDelete(null);
        }
    };

    const proGenerateMutation = trpc.reports.generateProfessionalReport.useMutation({
        onSuccess: (data) => {
            toast.success("Professional report generated!");

            // Final Robust Base64 to Blob conversion
            try {
                const byteCharacters = atob(data.pdfBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], {
                    type: (data as any).contentType || 'application/pdf'
                });

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = data.filename;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);
            } catch (err) {
                console.error("Blob creation failed:", err);
                toast.error("Failed to process download stream.");
            }

            setIsGeneratorOpen(false);
            refetch();
        },
        onError: (err) => {
            toast.error("Generation failed: " + err.message);
        }
    });

    const handleGenerateReport = () => {
        toast.promise(generateReportMutation.mutateAsync({ clientId }), {
            loading: 'Generating compliance intelligence report...',
            success: 'Report generated!',
            error: 'Failed to generate report'
        });
    };

    const handleProGenerate = () => {
        if (selectedSections.length === 0) {
            toast.error("Please select at least one section");
            return;
        }
        toast.promise(proGenerateMutation.mutateAsync({
            clientId,
            title: reportTitle,
            format: reportFormat,
            includedSections: selectedSections as any,
            dataSources: {
                gapAnalysis: selectedSections.includes('gap_analysis'),
                riskAssessment: selectedSections.includes('risks'),
                controls: selectedSections.includes('controls'),
                policies: true
            }
        }), {
            loading: 'Assembling professional intelligence report...',
            success: 'Report ready for download!',
            error: 'Failed to assemble report'
        });
    };

    const toggleSection = (id: string) => {
        setSelectedSections(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleGapAnalysis = () => {
        toast.promise(proGenerateMutation.mutateAsync({
            clientId,
            title: `Technical Gap Analysis - ${new Date().toLocaleDateString()}`,
            format: 'pdf',
            includedSections: ['gap_analysis', 'controls', 'vulnerabilities', 'assets'],
            dataSources: {
                gapAnalysis: true,
                riskAssessment: false,
                controls: true,
                policies: false
            }
        }), {
            loading: 'Generating technical gap analysis...',
            success: 'Gap Analysis ready!',
            error: 'Failed to generate Gap Analysis'
        });
    };

    const handleBoardSummary = () => {
        toast.promise(proGenerateMutation.mutateAsync({
            clientId,
            title: `Board Executive Summary - ${new Date().toLocaleDateString()}`,
            format: 'pdf',
            includedSections: ['executive_summary', 'risks', 'kpis_metrics', 'strategic_vision'],
            dataSources: {
                gapAnalysis: false,
                riskAssessment: true,
                controls: false,
                policies: false
            }
        }), {
            loading: 'Generating executive summary...',
            success: 'Executive Summary ready!',
            error: 'Failed to generate Executive Summary'
        });
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Quick Actions / Workshop Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { title: "Custom Professional Report", desc: "Build a bespoke intelligence report", icon: Layout, action: () => setIsGeneratorOpen(true), primary: true },
                    { title: "Gap Analysis PDF", desc: "Detailed technical posture survey", icon: FileText, action: handleGapAnalysis },
                    { title: "Board Executive Summary", desc: "Clean, chart-heavy PDF brief", icon: FileBarChart, action: handleBoardSummary },
                ].map((workshop, i) => (
                    <div
                        key={i}
                        onClick={workshop.action}
                        className={`flex flex-col items-start p-5 bg-white border ${workshop.primary ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200'} rounded-xl hover:border-indigo-500 hover:shadow-md transition-all group text-left cursor-pointer`}
                    >
                        <div className={`p-2 ${workshop.primary ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600'} rounded-lg group-hover:scale-110 transition-transform mb-4`}>
                            <workshop.icon className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">{workshop.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{workshop.desc}</p>
                        <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                            {workshop.primary ? 'Configure Workshop' : 'Generate Now'} <Plus className="w-3 h-3" />
                        </div>
                    </div>
                ))}
            </div>

            {/* History Table-like view */}
            <Card className="border-none shadow-md overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-slate-400" />
                            Report History
                        </CardTitle>
                        <CardDescription>Records of all previously generated compliance intelligence</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search history..."
                                className="pl-9 pr-4 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-48"
                            />
                        </div>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            Loading library...
                        </div>
                    ) : !reports || reports.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center gap-4">
                            <div className="p-4 bg-slate-50 rounded-full">
                                <FileText className="w-12 h-12 text-slate-200" />
                            </div>
                            <div>
                                <h3 className="text-slate-900 font-semibold">No reports generated yet</h3>
                                <p className="text-slate-500 text-sm mt-1">Generate your first board summary or technical gap analysis above.</p>
                            </div>
                            <Button onClick={() => setIsGeneratorOpen(true)} variant="outline" className="mt-2">
                                <Plus className="w-4 h-4 mr-2" />
                                Start Workshop
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {reports.map((report: any) => (
                                <div
                                    key={report.id}
                                    className="flex items-center justify-between p-5 hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                    onClick={() => toast.info("Viewing report details")}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-sm transition-all border border-transparent group-hover:border-indigo-100">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{report.title}</h4>
                                            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold">
                                                    {report.version || 'v1.0'}
                                                </Badge>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(report.generatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Download className="w-3.5 h-3.5" />
                                                    PDF Export
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" className="hidden group-hover:flex">
                                            Download
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 hidden group-hover:flex"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteReport(report.id);
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Report Generator Dialog */}
            <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
                <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    <div className="bg-indigo-600 p-8 text-white">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                    <Layout className="w-6 h-6" />
                                </div>
                                <Badge className="bg-white/20 text-white border-none text-[10px] font-bold tracking-widest uppercase">
                                    Intelligence Workshop
                                </Badge>
                            </div>
                            <DialogTitle className="text-2xl font-bold">Report Assembly Workshop</DialogTitle>
                            <DialogDescription className="text-white/70 text-sm">
                                Compose a professional-grade intelligence report by selecting components from your compliance data lake.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-8 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Report Identity</Label>
                            <Input
                                value={reportTitle}
                                onChange={(e) => setReportTitle(e.target.value)}
                                className="h-9 border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 text-sm"
                                placeholder="e.g. FY2026 Q1 Compliance Posture"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Intelligence Components</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px] text-indigo-600 font-bold hover:bg-indigo-50 hover:text-indigo-700"
                                    onClick={() => {
                                        if (selectedSections.length === REPORT_SECTIONS.length) {
                                            setSelectedSections([]);
                                        } else {
                                            setSelectedSections(REPORT_SECTIONS.map(s => s.id));
                                        }
                                    }}
                                >
                                    {selectedSections.length === REPORT_SECTIONS.length ? 'Deselect All' : 'Select All'}
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {REPORT_SECTIONS.map((section) => (
                                    <label
                                        key={section.id}
                                        onClick={() => toggleSection(section.id)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center group relative cursor-pointer outline-none focus-within:ring-2 focus-within:ring-indigo-500/20 ${selectedSections.includes(section.id)
                                            ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/10'
                                            : 'border-slate-100 bg-white hover:border-slate-300'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedSections.includes(section.id)}
                                            onChange={() => { }}
                                            className="sr-only"
                                        />
                                        <div className={`p-1.5 rounded-lg ${section.bg} ${section.color} group-hover:scale-110 transition-transform`}>
                                            <section.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-800 text-[10px] leading-tight">{section.label}</h5>
                                        </div>
                                        <div className="absolute top-2 right-2">
                                            <div className={`h-4 w-4 rounded-[4px] border flex items-center justify-center transition-colors ${selectedSections.includes(section.id)
                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                : 'border-slate-300 bg-white'
                                                }`}>
                                                {selectedSections.includes(section.id) && <Check className="w-3 h-3 stroke-[3]" />}
                                            </div>
                                        </div>
                                    </label>
                                ))}

                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Output Format</Label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setReportFormat('pdf')}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${reportFormat === 'pdf' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold ring-2 ring-indigo-500/10' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'}`}
                                >
                                    <FileText className="w-4 h-4" /> PDF Office Document
                                </button>
                                <button
                                    onClick={() => setReportFormat('docx')}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${reportFormat === 'docx' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold ring-2 ring-indigo-500/10' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'}`}
                                >
                                    <Download className="w-4 h-4" /> Word Edit Mode
                                </button>
                            </div>
                        </div>

                        <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            <p className="text-[10px] text-indigo-700 font-medium leading-tight">
                                AI-driven insights are cross-referenced with active evidence vaults for programmatic verification.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50 border-t flex items-center justify-between">
                        <p className="text-[10px] text-slate-400 font-medium">
                            Estimated assembly time: <span className="text-indigo-600 font-bold">~12 seconds</span>
                        </p>
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" onClick={() => setIsGeneratorOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleProGenerate}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 font-bold shadow-lg shadow-indigo-600/20"
                                disabled={proGenerateMutation.isLoading}
                            >
                                {proGenerateMutation.isLoading ? 'Assembling...' : 'Generate Intelligence'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
                <DialogContent className="sm:max-w-md bg-white border-0 shadow-xl rounded-2xl overflow-hidden">
                    <div className="bg-red-50 p-6 border-b border-red-100">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-600 font-bold text-lg">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                Delete Intelligence Report
                            </DialogTitle>
                            <DialogDescription className="pt-2 text-red-700/80 font-medium">
                                Are you sure you want to delete this report? This action cannot be undone and will permanently remove the file and record.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-6 bg-white">
                        <div className="flex items-center p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-600 mb-2">
                            <Trash2 className="w-4 h-4 mr-2 text-slate-400" />
                            File deletion will be permanent.
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setReportToDelete(null)} disabled={deleteReportMutation.isLoading}>Cancel, keep report</Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleteReportMutation.isLoading}
                            className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                        >
                            {deleteReportMutation.isLoading ? 'Deleting...' : 'Delete Permanently'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
