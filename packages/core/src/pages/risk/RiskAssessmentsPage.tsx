import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Plus, Search, CheckCircle2, AlertCircle, AlertTriangle, Download, ArrowLeft, Clock, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { Input } from '@complianceos/ui/ui/input';
import { Button } from '@complianceos/ui/ui/button';
import { RiskHeatmap } from '@/components/risk/RiskHeatmap';
import { Breadcrumb } from '@/components/Breadcrumb';
import { PageGuide } from '@/components/PageGuide';

export default function RiskAssessmentsPage() {
    const params = useParams();
    const [_, setLocation] = useLocation();
    const routeClientId = params.id ? Number(params.id) : null;
    const { user, client: authClient } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [heatmapFilter, setHeatmapFilter] = useState<{ impact?: string, likelihood?: string } | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ label, sortKey }: { label: string, sortKey: string }) => {
        return (
            <th
                className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none"
                onClick={() => handleSort(sortKey)}
            >
                <div className="flex items-center justify-between gap-1">
                    <span>{label}</span>
                    <div className="flex flex-col text-[8px] opacity-70 leading-none">
                        <span className={sortConfig?.key === sortKey && sortConfig.direction === 'asc' ? 'text-blue-300 opacity-100' : ''}>▲</span>
                        <span className={sortConfig?.key === sortKey && sortConfig.direction === 'desc' ? 'text-blue-300 opacity-100' : ''}>▼</span>
                    </div>
                </div>
            </th>
        );
    };

    // Determine effective client ID
    const effectiveClientId = routeClientId || authClient?.id;

    const { data: fetchedClient, isLoading: loadingClientDetails } = trpc.clients.get.useQuery(
        { id: effectiveClientId || 0 },
        { enabled: !!effectiveClientId && !authClient }
    );

    const client = authClient || fetchedClient;
    const clientId = client?.id || 0;

    const { data: assessments, isLoading: loadingAssessments, refetch } = trpc.risks.getRiskAssessments.useQuery(
        { clientId: clientId },
        { enabled: !!clientId }
    );
    const exportReportMutation = trpc.risks.exportReport.useMutation();

    const { data: processes } = trpc.businessContinuity.processes.list.useQuery(
        { clientId: clientId },
        { enabled: !!clientId }
    );

    const { data: stats, isLoading: loadingStats } = trpc.risks.getKRIStats.useQuery(
        { clientId: clientId },
        { enabled: !!clientId }
    );

    const getProcessNames = (ids: number[] | null | undefined) => {
        if (!ids || !processes) return '-';
        // Handle case where ids might be a string (from DB raw json) or array
        const idArray = Array.isArray(ids) ? ids : (typeof ids === 'string' ? JSON.parse(ids) : []);
        return idArray.map((id: number) => processes.find(p => p.id === id)?.name).filter(Boolean).join(', ') || '-';
    };

    // Helper to normalized scale inputs (handling text vs numbers if necessary)
    const normalizeScale = (val: string | number | undefined): number => {
        if (!val) return 0;

        const strVal = val.toString().toLowerCase().trim();

        // Check for numeric start first (e.g. "1 - Low")
        const num = parseInt(strVal.charAt(0));
        if (!isNaN(num) && num >= 1 && num <= 5) return num;

        // Map text descriptions to 1-5 scale
        if (strVal === '1' || strVal.includes('very low') || strVal.includes('rare') || strVal.includes('insignificant') || strVal.includes('negligible')) return 1;
        if (strVal === '2' || strVal.includes('low') || strVal.includes('unlikely') || strVal.includes('minor')) return 2;
        if (strVal === '3' || strVal.includes('medium') || strVal.includes('possible') || strVal.includes('moderate')) return 3;
        if (strVal === '5' || strVal.includes('very high') || strVal.includes('almost certain') || strVal.includes('critical') || strVal.includes('extreme') || strVal.includes('catastrophic')) return 5;
        if (strVal === '4' || strVal.includes('high') || strVal.includes('likely') || strVal.includes('major')) return 4;

        return 0;
    };

    const formatWithNumber = (val: string | undefined) => {
        if (!val || val === '-') return '-';
        const num = normalizeScale(val);
        if (num === 0) return val;
        // If already starts with number, return as is
        if (/^\d/.test(val)) return val;
        return `${num} - ${val}`;
    };

    const filteredAssessments = assessments?.filter(a => {
        const matchesSearch =
            a.assessmentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.threatDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.assessmentDate?.toString().includes(searchQuery);

        if (!matchesSearch) return false;

        if (heatmapFilter) {
            const l = normalizeScale(a.likelihood);
            const i = normalizeScale(a.impact);

            // Compare normalized values (numbers to strings)
            if (l.toString() !== heatmapFilter.likelihood || i.toString() !== heatmapFilter.impact) {
                return false;
            }
        }
        return true;
    });

    const sortedAssessments = React.useMemo(() => {
        if (!filteredAssessments) return [];
        let sortableItems = [...filteredAssessments];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aVal: any = a[sortConfig.key as keyof typeof a] ?? '';
                let bVal: any = b[sortConfig.key as keyof typeof b] ?? '';

                if (sortConfig.key === 'treatments') {
                    aVal = (a as any).treatmentCount || 0;
                    bVal = (b as any).treatmentCount || 0;
                } else if (sortConfig.key === 'inherentRisk' || sortConfig.key === 'residualRisk') {
                    const riskOrder: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
                    aVal = riskOrder[aVal] || 0;
                    bVal = riskOrder[bVal] || 0;
                } else if (sortConfig.key === 'likelihood' || sortConfig.key === 'impact') {
                    aVal = normalizeScale(aVal);
                    bVal = normalizeScale(bVal);
                } else if (typeof aVal === 'string' && typeof bVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredAssessments, sortConfig]);

    const handleCreateNew = () => {
        setLocation(`/clients/${clientId}/risks/assessments/new`);
    };

    const handleEditAssessment = (assessment: any) => {
        setLocation(`/clients/${clientId}/risks/assessments/${assessment.id}`);
    };

    const [exporting, setExporting] = useState(false);
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
            toast.error("Export failed", { description: e.message || "An unexpected error occurred." });
        } finally {
            setExporting(false);
        }
    };

    if (loadingClientDetails) return (
        <DashboardLayout>
            <div className="p-8 text-center text-muted-foreground">Loading client data...</div>
        </DashboardLayout>
    );

    if (!client) return (
        <DashboardLayout>
            <div className="p-8 text-center text-destructive">Client not found.</div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="space-y-6 w-full max-w-full p-6">
                <div className="mb-2">
                    <Breadcrumb
                        items={[
                            { label: "Clients", href: "/clients" },
                            { label: client?.name || "Client", href: `/clients/${clientId}` },
                            { label: "Risk Management", href: `/clients/${clientId}/risks` },
                            { label: "Risk Assessments", href: `/clients/${clientId}/risks/assessments` },
                        ]}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 -ml-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setLocation(`/clients/${clientId}/risks`)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Risk Dashboard
                    </Button>
                </div>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Risk Assessments</h1>
                        <p className="text-muted-foreground mt-1">Detailed risk assessments and evaluations.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handleExportRiskReport}
                            disabled={exporting || !clientId}
                            className="gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export Risk Report
                        </Button>
                        <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700 text-white" id="risk-new-assessment">
                            <Plus className="w-4 h-4 mr-2" />
                            New Assessment
                        </Button>
                        <PageGuide
                            title="Risk Assessments"
                            description="Evaluate, score, and treat organizational risks."
                            rationale="Systematic risk assessments provide the data needed to make informed security investment decisions."
                            howToUse={[
                                {
                                    step: "Identify Risks",
                                    description: "Create new assessments for specific threat scenarios to begin the management process.",
                                    targetId: "risk-new-assessment"
                                },
                                {
                                    step: "Analyze Heatmap",
                                    description: "The heatmap visualizes risks by impact and likelihood. High priority risks are in the top-right.",
                                    targetId: "risk-heatmap-container"
                                },
                                {
                                    step: "Monitor Stats",
                                    description: "Track key risk indicators like overdue reviews and mitigation efficiency in real-time.",
                                    targetId: "risk-stats-container"
                                },
                                {
                                    step: "Manage Treatments",
                                    description: "Review current assessments and ensure critical risks have active treatment plans.",
                                    targetId: "risk-assessments-table"
                                }
                            ]}
                            integrations={[
                                { name: "Controls Library", description: "Apply controls to reduce Inherent Risk to an acceptable Residual Risk level." },
                                { name: "Gap Analysis", description: "Identify missing controls directly from the assessment workflow." }
                            ]}
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Heatmap Widget */}
                    <div className="h-[380px]" id="risk-heatmap-container">
                        <RiskHeatmap
                            assessments={assessments || []}
                            activeFilter={heatmapFilter}
                            onFilterChange={setHeatmapFilter}
                        />
                    </div>

                    {/* KRI Stats Widgets */}
                    <div className="h-[380px] grid grid-cols-2 gap-4" id="risk-stats-container">
                        {/* 1. Overdue Reviews */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-slate-500">Overdue Reviews</h3>
                                    <div className="p-2 bg-red-50 rounded-lg">
                                        <Clock className="w-5 h-5 text-red-600" />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-slate-900 mt-2">
                                    {loadingStats ? '-' : stats?.overdueReviews || 0}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4 text-xs font-medium text-red-600 bg-red-50 w-fit px-2 py-1 rounded-full">
                                <span>Action Required</span>
                            </div>
                        </div>

                        {/* 2. Unmitigated Critical Risks */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-slate-500">Unmitigated Critical</h3>
                                    <div className="p-2 bg-amber-50 rounded-lg">
                                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-slate-900 mt-2">
                                    {loadingStats ? '-' : stats?.unmitigatedCriticalRisks || 0}
                                </div>
                            </div>
                            <div className={`flex items-center gap-2 mt-4 text-xs font-medium w-fit px-2 py-1 rounded-full ${Number(stats?.unmitigatedCriticalRisks || 0) > 0 ? 'text-amber-700 bg-amber-50' : 'text-green-700 bg-green-50'}`}>
                                <span>{Number(stats?.unmitigatedCriticalRisks || 0) > 0 ? 'Needs Treatment' : 'All Mitigated'}</span>
                            </div>
                        </div>

                        {/* 3. Mitigation Efficiency */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-slate-500">Mitigation Efficiency</h3>
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <TrendingDown className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-slate-900 mt-2">
                                    {loadingStats ? '-' : `${stats?.mitigationEfficiency || 0}%`}
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                Risks effectively reduced by controls
                            </p>
                        </div>

                        {/* 4. Implementation Rate */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-slate-500">Implementation Rate</h3>
                                    <div className="p-2 bg-emerald-50 rounded-lg">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-slate-900 mt-2">
                                    {loadingStats ? '-' : `${stats?.controlImplementationRate || 0}%`}
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4">
                                <div
                                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${stats?.controlImplementationRate || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search assessments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    {heatmapFilter && (
                        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                            <span>Filter: Likelihood {heatmapFilter.likelihood}, Impact {heatmapFilter.impact}</span>
                            <button onClick={() => setHeatmapFilter(null)} className="hover:text-blue-900 font-bold ml-1">×</button>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden min-h-[400px]" id="risk-assessments-table">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-[#1C4D8D]">
                                    <SortableHeader label="ID" sortKey="assessmentId" />
                                    <SortableHeader label="Title" sortKey="title" />
                                    <SortableHeader label="Threat Description" sortKey="threatDescription" />
                                    <SortableHeader label="Likelihood" sortKey="likelihood" />
                                    <SortableHeader label="Impact" sortKey="impact" />
                                    <SortableHeader label="Inherent Risk" sortKey="inherentRisk" />
                                    <SortableHeader label="Residual Risk" sortKey="residualRisk" />
                                    <SortableHeader label="Treatments" sortKey="treatments" />
                                    <SortableHeader label="Status" sortKey="status" />
                                    <SortableHeader label="Risk Owner" sortKey="riskOwner" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loadingAssessments ? (
                                    <tr><td colSpan={10} className="p-8 text-center text-gray-500 bg-white">Loading assessments...</td></tr>
                                ) : sortedAssessments?.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="p-12 text-center bg-white">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Shield className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900">No Assessments Found</h3>
                                            <p className="text-gray-500 mt-1">Start by creating a new risk assessment.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedAssessments?.map((assessment) => (
                                        <tr
                                            key={assessment.id}
                                            className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm cursor-pointer group"
                                            onDoubleClick={() => handleEditAssessment(assessment)}
                                            onClick={() => handleEditAssessment(assessment)}
                                        >
                                            <td className="px-6 py-4 text-sm font-mono text-gray-500">{assessment.assessmentId}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-black">{assessment.title || '-'}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm max-w-[250px] truncate text-gray-600" title={assessment.threatDescription || ''}>{assessment.threatDescription}</div>
                                                <div className="text-xs text-gray-400 max-w-[250px] truncate" title={assessment.vulnerabilityDescription || ''}>{assessment.vulnerabilityDescription}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{formatWithNumber(assessment.likelihood)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{formatWithNumber(assessment.impact)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${assessment.inherentRisk === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    assessment.inherentRisk === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                        'bg-green-50 text-green-700 border-green-200'
                                                    }`}>
                                                    {assessment.inherentRisk || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${assessment.residualRisk === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    assessment.residualRisk === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                        'bg-green-50 text-green-700 border-green-200'
                                                    }`}>
                                                    {assessment.residualRisk || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {(assessment as any).treatmentCount > 0 ? (
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                            {(assessment as any).treatmentCount} {(assessment as any).treatmentCount === 1 ? 'treatment' : 'treatments'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        {(assessment.priority === 'Critical' || assessment.priority === 'High') && (
                                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                                        )}
                                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                                            No treatments
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize border ${assessment.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    assessment.status === 'reviewed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        'bg-gray-50 text-gray-700 border-gray-200'
                                                    }`}>
                                                    {assessment.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 text-center">{assessment.riskOwner || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout >
    );
}
