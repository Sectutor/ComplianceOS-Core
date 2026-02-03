import React from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Activity, Shield, FileText, AlertTriangle, TrendingUp, CheckCircle, ArrowRight, Play, Database, BookOpen, Layers, FlaskConical, Clock } from "lucide-react";
import { Link } from "wouter";

import DashboardLayout from "@/components/DashboardLayout";
import { RiskHeatMap } from "@/components/RiskHeatMap";

export default function BusinessContinuityDashboard() {
    const params = useParams();
    const clientId = parseInt(params.id || "0");

    const { data: metrics, isLoading } = trpc.businessContinuity.getDashboardMetrics.useQuery({ clientId });
    const { data: processes } = trpc.businessContinuity.processes.list.useQuery({ clientId });
    const { data: recentExercises } = trpc.businessContinuity.exercises.listAll.useQuery({ clientId });

    const heatMapData = React.useMemo(() => {
        if (!processes) return [];
        return processes.map(p => ({
            id: p.id,
            label: p.name,
            criticality: p.criticalityTier || "Tier 4",
            riskScore: (p.id * 7) % 25 // Placeholder
        }));
    }, [processes]);

    // Calculate RTO coverage stats
    const rtoStats = React.useMemo(() => {
        if (!processes) return { withRto: 0, total: 0, coverage: 0 };
        const withRto = processes.filter(p => p.rto).length;
        const total = processes.length;
        return { withRto, total, coverage: total > 0 ? Math.round((withRto / total) * 100) : 0 };
    }, [processes]);

    // Calculate RPO coverage stats
    const rpoStats = React.useMemo(() => {
        if (!processes) return { withRpo: 0, total: 0, coverage: 0 };
        const withRpo = processes.filter(p => p.rpo).length;
        const total = processes.length;
        return { withRpo, total, coverage: total > 0 ? Math.round((withRpo / total) * 100) : 0 };
    }, [processes]);

    // Calculate MTPD coverage stats
    const mtpdStats = React.useMemo(() => {
        if (!processes) return { withMtpd: 0, total: 0, coverage: 0 };
        const withMtpd = processes.filter(p => p.mtpd).length;
        const total = processes.length;
        return { withMtpd, total, coverage: total > 0 ? Math.round((withMtpd / total) * 100) : 0 };
    }, [processes]);


    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Business Continuity</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your organization's resilience, recovery strategies, and continuity plans.
                        </p>
                    </div>
                </div>

                {/* Program Overview Callout */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 mb-6">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex gap-4 items-center">
                            <div className="p-3 bg-blue-100 rounded-xl hidden sm:block">
                                <BookOpen className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-blue-900 text-lg">Business Continuity Program Guide</h3>
                                <p className="text-blue-700/80 max-w-2xl">
                                    Understand the ISO 22301 lifecycle, from BIA to recovery planning and exercising.
                                </p>
                            </div>
                        </div>
                        <Link href={`/clients/${clientId}/business-continuity/overview`}>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold whitespace-nowrap">
                                View Program Guide <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Workflow Introduction Section */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-6 h-6 text-blue-400" />
                            Getting Started with Business Continuity
                        </CardTitle>
                        <CardDescription className="text-slate-300">
                            Follow this 5-step workflow to build a comprehensive and compliant recovery plan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-6 left-10 right-10 h-0.5 bg-slate-700 -z-10"></div>

                            {[
                                {
                                    step: "Step 0",
                                    title: "Governance & Scope",
                                    desc: "Charter, Team, and Policy.",
                                    link: `/clients/${clientId}/business-continuity/governance`,
                                    icon: BookOpen,
                                    color: "text-emerald-400",
                                    bg: "bg-emerald-900/50",
                                    isComplete: true
                                },
                                {
                                    step: "1. Start",
                                    title: "Define Processes",
                                    desc: "Register critical business functions.",
                                    link: `/clients/${clientId}/business-continuity/processes`,
                                    icon: Database,
                                    color: "text-blue-400",
                                    bg: "bg-blue-900/50",
                                    isComplete: (processes?.length || 0) > 0
                                },
                                {
                                    step: "2. Assess",
                                    title: "Create BIA",
                                    desc: "Analyze impact and set RTO/RPOs.",
                                    link: `/clients/${clientId}/business-continuity/bia`,
                                    icon: Activity,
                                    color: "text-amber-400",
                                    bg: "bg-amber-900/50",
                                    isComplete: (metrics?.totalBIAs || 0) > 0
                                },
                                {
                                    step: "3. Plan",
                                    title: "Strategies & Scenarios",
                                    desc: "Define mitigation and recovery strategies.",
                                    link: `/clients/${clientId}/business-continuity/scenarios`,
                                    icon: AlertTriangle,
                                    color: "text-purple-400",
                                    bg: "bg-purple-900/50",
                                    isComplete: (metrics?.totalStrategies || 0) > 0
                                },
                                {
                                    step: "4. Build",
                                    title: "Build Plan",
                                    desc: "Compile BIAs and strategies into a plan.",
                                    link: `/clients/${clientId}/business-continuity/plans/new`,
                                    icon: Layers,
                                    color: "text-pink-400",
                                    bg: "bg-pink-900/50",
                                    isComplete: (metrics?.totalPlans || 0) > 0
                                },
                                {
                                    step: "5. Finish",
                                    title: "Generate & Save",
                                    desc: "Finalize, review, and approve the BCP.",
                                    link: `/clients/${clientId}/business-continuity/plans`,
                                    icon: CheckCircle,
                                    color: "text-green-400",
                                    bg: "bg-green-900/50",
                                    isComplete: (metrics?.approvedPlans || 0) > 0
                                },
                            ].map((item, i) => (
                                <Link key={i} href={item.link}>
                                    <div className={`group relative flex flex-col items-center text-center p-4 rounded-xl transition-all cursor-pointer h-full border ${item.isComplete ? 'bg-white/5 border-emerald-500/30' : 'hover:bg-white/10 border-transparent hover:border-white/10'}`}>
                                        <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform relative`}>
                                            <item.icon className={`w-6 h-6 ${item.color}`} />
                                            {item.isComplete && (
                                                <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-slate-900">
                                                    <CheckCircle className="w-3 h-3" />
                                                </div>
                                            )}
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

                {/* Metrics Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Readiness Score (Replacing Plans card) */}
                    <Card className="card-enhanced border-l-4 border-l-blue-600 bg-blue-50/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-900">Program Readiness</CardTitle>
                            <Shield className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-700">{metrics?.readinessScore || 0}%</div>
                            <p className="text-xs text-blue-600 mt-1">Based on Approved Plans Coverage</p>
                        </CardContent>
                    </Card>

                    {/* New Training Card */}
                    <Card className="card-enhanced border-l-4 border-l-emerald-600 bg-emerald-50/50 cursor-pointer hover:bg-emerald-100/50 transition-colors" onClick={() => window.location.href = `/clients/${clientId}/business-continuity/training`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-900">Staff Training</CardTitle>
                            <BookOpen className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-emerald-700">Track</div>
                            <p className="text-xs text-emerald-600 mt-1">Records & Certifications</p>
                        </CardContent>
                    </Card>

                    {/* Exercises Card - Enhanced with real data */}
                    <Card className="card-enhanced border-l-4 border-l-purple-600 bg-purple-50/50 cursor-pointer hover:bg-purple-100/50 transition-colors" onClick={() => window.location.href = `/clients/${clientId}/business-continuity/exercises`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-purple-900">Plan Exercises</CardTitle>
                            <FlaskConical className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-purple-700">{metrics?.totalExercises || 0}</div>
                            <p className="text-xs text-purple-600 mt-1">
                                {metrics?.completedExercises || 0} Completed
                                {recentExercises?.[0]?.startDate && (
                                    <span className="ml-2">• Last: {new Date(recentExercises[0].startDate).toLocaleDateString()}</span>
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    {/* RTO Coverage Card */}
                    <Card className="card-enhanced border-l-4 border-l-orange-500 bg-orange-50/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-orange-900">RTO Coverage</CardTitle>
                            <TrendingUp className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-orange-700">{rtoStats.coverage}%</div>
                            <p className="text-xs text-orange-600 mt-1">{rtoStats.withRto} / {rtoStats.total} Processes with RTO</p>
                        </CardContent>
                    </Card>

                    {/* RPO Coverage Card */}
                    <Card className="card-enhanced border-l-4 border-l-pink-500 bg-pink-50/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-pink-900">RPO Coverage</CardTitle>
                            <Clock className="h-4 w-4 text-pink-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-pink-700">{rpoStats.coverage}%</div>
                            <p className="text-xs text-pink-600 mt-1">{rpoStats.withRpo} / {rpoStats.total} Processes with RPO</p>
                        </CardContent>
                    </Card>

                    {/* MTPD Coverage Card - NEW */}
                    <Card className="card-enhanced border-l-4 border-l-red-500 bg-red-50/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-red-900">MTPD Coverage</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-red-700">{mtpdStats.coverage}%</div>
                            <p className="text-xs text-red-600 mt-1">{mtpdStats.withMtpd} / {mtpdStats.total} Processes with MTPD</p>
                        </CardContent>
                    </Card>

                    <Card className="card-enhanced">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">BIA Governance</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics?.completedBIAs || 0} / {metrics?.totalBIAs || 0}</div>
                            <p className="text-xs text-muted-foreground">Completed vs Total BIAs</p>
                        </CardContent>
                    </Card>

                    <Card className="card-enhanced">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Plan Validation</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics?.approvedPlans || 0}</div>
                            <p className="text-xs text-muted-foreground">Approved Plans ({metrics?.testedPlans || 0} Tested)</p>
                        </CardContent>
                    </Card>

                    <Card className="card-enhanced border-l-4 border-l-indigo-600 bg-indigo-50/50 cursor-pointer hover:bg-indigo-100/50 transition-colors group" onClick={() => window.location.href = `/clients/${clientId}/business-continuity/iso22301`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-sm font-medium text-indigo-900">ISO 22301 Standards</CardTitle>
                                <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-indigo-200 text-indigo-800 hover:bg-indigo-300 pointer-events-none">
                                    GUIDE
                                </Badge>
                            </div>
                            <BookOpen className="h-4 w-4 text-indigo-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-indigo-700">100%</div>
                            <div className="flex items-center gap-1 text-xs text-indigo-600 mt-1">
                                <span>View alignment explainer</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="col-span-1">
                        <RiskHeatMap
                            data={heatMapData}
                            description="Visual distribution of process criticality vs. risk exposure."
                        />
                    </div>

                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Common tasks to get started</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <Link href={`/clients/${clientId}/business-continuity/wizard`}>
                                <Button variant="outline" className="w-full justify-start h-auto py-4 px-4 hover:bg-green-50 hover:border-green-200">
                                    <TrendingUp className="mr-4 h-6 w-6 text-green-500" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-semibold">Start New Cycle</span>
                                        <span className="text-xs text-muted-foreground">Initialize a guided BCP project flow</span>
                                    </div>
                                </Button>
                            </Link>
                            <Link href={`/clients/${clientId}/business-continuity/bia`}>
                                <Button variant="outline" className="w-full justify-start h-auto py-4 px-4 hover:bg-blue-50 hover:border-blue-200">
                                    <Activity className="mr-4 h-6 w-6 text-blue-500" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-semibold">Conduct BIA</span>
                                        <span className="text-xs text-muted-foreground">Identify critical activities and impact</span>
                                    </div>
                                </Button>
                            </Link>
                            <Link href={`/clients/${clientId}/business-continuity/scenarios`}>
                                <Button variant="outline" className="w-full justify-start h-auto py-4 px-4 hover:bg-orange-50 hover:border-orange-200">
                                    <AlertTriangle className="mr-4 h-6 w-6 text-orange-500" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-semibold">Define Scenarios</span>
                                        <span className="text-xs text-muted-foreground">Plan for potential disruptions</span>
                                    </div>
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout >
    );
}
