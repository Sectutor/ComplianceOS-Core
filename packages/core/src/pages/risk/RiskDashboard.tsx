import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, AlertTriangle, CheckCircle, Database, ChevronDown, ChevronUp, Sparkles, Server, Flame, Activity, Stethoscope, BarChart3, ArrowRight, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { Link } from "wouter";
import DashboardLayout from '@/components/DashboardLayout';
import { RiskRegister } from '@/components/risk/RiskRegister';
import { RiskHeatmap } from '@/components/risk/RiskHeatmap';
import { RiskReductionROI } from '@/components/risk/RiskCharts';
// import { GapAnalysis } from '@/components/risk/GapAnalysis';
import { KRITrendCards } from '@/components/risk/KRITrendCards';
import { Button } from '@complianceos/ui/ui/button';

export default function RiskDashboard() {
    const params = useParams();
    const [_, setLocation] = useLocation();
    const routeClientId = params.id ? Number(params.id) : null;
    const { user, client: authClient } = useAuth();
    const [showVisualizations, setShowVisualizations] = useState(true);
    const [showRegister, setShowRegister] = useState(true);
    const [showGapAnalysis, setShowGapAnalysis] = useState(true);
    const [heatmapFilter, setHeatmapFilter] = useState<{ likelihood?: string; impact?: string; type?: string } | null>(null);

    const utils = trpc.useUtils();

    // Determine effective client ID
    const effectiveClientId = routeClientId || authClient?.id;

    // Fetch client details if needed
    const { data: fetchedClient, isLoading: loadingClientDetails } = trpc.clients.get.useQuery(
        { id: effectiveClientId || 0 },
        { enabled: !!effectiveClientId && !authClient }
    );

    const client = authClient || fetchedClient;
    const clientId = client?.id || 0;

    const { data: assets, isLoading: loadingAssets } = trpc.risks.getAssets.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const { data: riskAssessments, isLoading: loadingAssessments } = trpc.risks.getRiskAssessments.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const handleEditRisk = (riskId: number) => {
        setLocation(`/clients/${clientId}/risks/assessments/${riskId}`);
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

    // Calculate stats from risk assessments
    const highRisks = riskAssessments?.filter(r => r.inherentRisk === 'High' || r.inherentRisk === 'Very High').length || 0;
    const treatedRisks = riskAssessments?.filter(r => (r as any).treatmentCount > 0).length || 0;
    const criticalAssets = assets?.filter(a => (a.valuationC || 0) >= 4 || (a.valuationI || 0) >= 4 || (a.valuationA || 0) >= 4).length || 0;

    const stats = [
        { label: 'Total Risks', value: riskAssessments?.length || 0, icon: Shield, bgColor: 'bg-blue-600', iconColor: 'text-white', containerClass: 'text-white shadow-lg shadow-blue-200 dark:shadow-none' },
        { label: 'High/Critical Risks', value: highRisks, icon: AlertTriangle, bgColor: 'bg-red-600', iconColor: 'text-white', containerClass: 'text-white shadow-lg shadow-red-200 dark:shadow-none' },
        { label: 'With Treatments', value: treatedRisks, icon: CheckCircle, bgColor: 'bg-emerald-600', iconColor: 'text-white', containerClass: 'text-white shadow-lg shadow-emerald-200 dark:shadow-none' },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6 w-full max-w-full px-6">
                {/* ... existing headers ... */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Risk Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Overview of your risk posture and asset coverage.</p>
                    </div>
                </div>

                {/* Risk Management Overview Callout */}
                <Card className="bg-gradient-to-r from-slate-900 to-orange-900 text-white border-0 shadow-2xl overflow-hidden group cursor-pointer" onClick={() => setLocation(`/clients/${clientId}/risks/overview`)}>
                    <CardContent className="p-0 relative">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-orange-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                            <div className="space-y-2">
                                <div className="inline-flex items-center space-x-2 bg-white/10 px-2 py-0.5 rounded-full border border-white/20 text-[10px] font-bold uppercase tracking-wider text-orange-200">
                                    <Sparkles className="w-3 h-3" />
                                    <span>Knowledge Hub</span>
                                </div>
                                <h2 className="text-2xl font-bold">Risk Management Framework Overview</h2>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    Understand the integrated workflow between Assets, Threats, Assessments, and Treatment Plans. Learn ISO 27005 methodology.
                                </p>
                            </div>
                            <Button className="bg-white text-slate-900 hover:bg-orange-50 font-bold px-6 py-6 h-auto rounded-xl shadow-lg group-hover:translate-x-1 transition-transform">
                                Explore Framework Guide
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Workflow Introduction Section (collapsed for brevity) */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-lg overflow-hidden relative mb-6">
                    {/* ... content ... */}
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-6 h-6 text-red-400" />
                            Getting Started with Risk Management
                        </CardTitle>
                        <CardDescription className="text-slate-300">
                            Follow this workflow to identify, assess, and treat information security risks.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* ... */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                            {/* ... */}
                            <div className="hidden md:block absolute top-6 left-10 right-10 h-0.5 bg-slate-700 -z-10"></div>
                            {[
                                {
                                    step: "1. Start",
                                    title: "Define Assets",
                                    desc: "Register critical information assets.",
                                    link: `/clients/${clientId}/risks/assets`,
                                    icon: Server,
                                    color: "text-blue-400",
                                    bg: "bg-blue-900/50"
                                },
                                // ... mapped items ...
                                {
                                    step: "2. Library",
                                    title: "Threats & Vulns",
                                    desc: "Manage your threat library.",
                                    link: `/clients/${clientId}/risks/threats`,
                                    icon: Flame,
                                    color: "text-orange-400",
                                    bg: "bg-orange-900/50"
                                },
                                {
                                    step: "3. Assess",
                                    title: "Risk Assessment",
                                    desc: "Analyze risks and impact.",
                                    link: `/clients/${clientId}/risks/assessments`,
                                    icon: Activity,
                                    color: "text-red-400",
                                    bg: "bg-red-900/50"
                                },
                                {
                                    step: "4. Treat",
                                    title: "Treatment Plan",
                                    desc: "Define controls and mitigation.",
                                    link: `/clients/${clientId}/risks/treatment-plan`,
                                    icon: Stethoscope,
                                    color: "text-green-400",
                                    bg: "bg-green-900/50"
                                },
                                {
                                    step: "5. Monitor",
                                    title: "Review & Report",
                                    desc: "Track ROI and risk reduction.",
                                    link: `/clients/${clientId}/risks/report`,
                                    icon: BarChart3,
                                    color: "text-purple-400",
                                    bg: "bg-purple-900/50"
                                },
                            ].map((item, i) => (
                                <Link key={i} href={item.link}>
                                    <div className="group relative flex flex-col items-center text-center p-4 rounded-xl hover:bg-white/10 transition-colors cursor-pointer h-full border border-transparent hover:border-white/10">
                                        <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                                            <item.icon className={`w-6 h-6 ${item.color}`} />
                                        </div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{item.step}</div>
                                        <div className="font-semibold mb-1 text-white">{item.title}</div>
                                        <div className="text-xs text-slate-400 leading-snug">{item.desc}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className={`p-4 rounded-xl border-none shadow-sm flex items-center justify-between ${stat.bgColor} ${stat.containerClass}`}>
                            <div>
                                <p className="text-sm text-white/80 font-medium">{stat.label}</p>
                                <p className="text-2xl font-bold mt-1 text-white">{stat.value}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-white/20 backdrop-blur-md">
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    ))}

                    {/* Compliance Guide Card */}
                    <div className="p-4 rounded-xl border border-amber-200 bg-white shadow-sm flex flex-col justify-between cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group" onClick={() => window.location.href = `/clients/${clientId}/risks/alignment-guide`}>
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold text-slate-900">ISO 27005</span>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-amber-100 text-amber-700 pointer-events-none">GUIDE</Badge>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-2 font-medium group-hover:text-amber-600 transition-colors">
                                    <span>View alignment</span>
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                                <BookOpen className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>


                {/* Quick Action: Start Guided Assessment */}
                <div className="flex justify-end">
                    <Link href={`/clients/${clientId}/risks/guided`}>
                        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                            <Sparkles className="w-4 h-4 mr-2" /> Start Guided Assessment
                        </Button>
                    </Link>
                </div>

                {/* Overdue & Upcoming Action Lanes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <OverdueItemsLane clientId={clientId} />
                    <UpcomingItemsLane clientId={clientId} />
                </div>

                {/* KRI Trend Cards */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Key Risk Indicators</h2>
                    <KRITrendCards clientId={clientId} />
                </div>

                {/* Gap Analysis Section */}
                <Card className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white border-none shadow-lg mb-6">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-300" />
                                <h3 className="text-xl font-bold">Gap Analysis</h3>
                            </div>
                            <p className="text-blue-100 max-w-2xl">
                                Conduct comprehensive gap assessments against major security frameworks like ISO 27001, SOC 2, HIPAA, and NIST. Identify missing controls and track remediation.
                            </p>
                        </div>
                        <Button 
                            onClick={() => setLocation(`/clients/${clientId}/gap-analysis`)}
                            className="bg-white text-blue-900 hover:bg-blue-50"
                        >
                            Open Gap Analysis
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Visualizations Section */}
                <div className="space-y-4">
                    <button
                        onClick={() => setShowVisualizations(!showVisualizations)}
                        className="flex items-center gap-2 text-lg font-semibold hover:text-primary transition-colors"
                    >
                        {showVisualizations ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        Risk Analytics & Visualizations
                    </button>

                    {showVisualizations && (
                        <div className="space-y-6">
                            {/* ROI Dashboard */}
                            {riskAssessments && riskAssessments.length > 0 && (
                                <RiskReductionROI risks={riskAssessments} />
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardContent className="pt-6">
                                        <RiskHeatmap
                                            assessments={riskAssessments || []}
                                            type="inherent"
                                            title="Inherent Risk Heatmap"
                                            activeFilter={heatmapFilter}
                                            onFilterChange={setHeatmapFilter}
                                        />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <RiskHeatmap
                                            assessments={riskAssessments || []}
                                            type="residual"
                                            title="Residual Risk Heatmap"
                                            activeFilter={heatmapFilter}
                                            onFilterChange={setHeatmapFilter}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Comparison Chart - Removed per user request */}
                        </div>
                    )}
                </div>

                {/* Risk Register Link */}
                <div className="mt-6">
                    <Button
                        variant="outline"
                        onClick={() => setLocation(`/clients/${clientId}/risks/register`)}
                        className="w-full justify-between"
                    >
                        <span className="font-medium">View Full Risk Register</span>
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}

// Action Lane Components
function OverdueItemsLane({ clientId }: { clientId: number }) {
    const { data: items = [], isLoading } = trpc.risks.getOverdueItems.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    return (
        <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Overdue Actions
                    {items.length > 0 && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{items.length}</span>}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
                ) : items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No overdue items 🎉</p>
                ) : (
                    <ul className="space-y-2">
                        {items.slice(0, 5).map((item: any) => (
                            <li key={`${item.type}-${item.id}`} className="text-sm flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                <span className="truncate">{item.title}</span>
                                <span className="text-xs text-red-600 whitespace-nowrap ml-2">{item.daysOverdue}d overdue</span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

function UpcomingItemsLane({ clientId }: { clientId: number }) {
    const { data: items = [], isLoading } = trpc.risks.getUpcomingDeadlines.useQuery(
        { clientId, days: 14 },
        { enabled: !!clientId }
    );

    return (
        <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-4 h-4 text-yellow-500" /> Upcoming Deadlines
                    {items.length > 0 && <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">{items.length}</span>}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
                ) : items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No upcoming deadlines</p>
                ) : (
                    <ul className="space-y-2">
                        {items.slice(0, 5).map((item: any) => (
                            <li key={`${item.type}-${item.id}`} className="text-sm flex justify-between items-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                                <span className="truncate">{item.title}</span>
                                <span className="text-xs text-yellow-600 whitespace-nowrap ml-2">in {item.daysUntilDue}d</span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}


