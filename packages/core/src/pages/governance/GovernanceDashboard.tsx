
import React, { useMemo } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { PageGuide } from '@/components/PageGuide';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    Shield,
    FileText,
    Zap,
    ListTodo,
    Target,
    BookOpen,
    ArrowRight,
    CheckCircle,
    TrendingUp,
    Activity,
    AlertTriangle,
    Layers,
    Users
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    AreaChart,
    Area
} from "recharts";

export default function GovernanceDashboard() {
    const params = useParams();
    const clientId = parseInt(params.id || "0");

    // Fetch Data
    const { data: govStats } = trpc.governance.getStats.useQuery({ clientId });
    const { data: readinessData } = trpc.compliance.getReadinessData.useQuery({ clientId });
    const { data: riskStats } = trpc.risks.getKRIStats.useQuery({ clientId });
    const { data: activityTrend, isLoading: isLoadingTrend } = trpc.governance.getActivityTrend.useQuery({ clientId }, {
        enabled: !!clientId
    });

    // Calculate Percentages
    const policyPercentage = readinessData?.coverage?.policyStats?.total
        ? Math.round((readinessData.coverage.policyStats.approved / readinessData.coverage.policyStats.total) * 100)
        : 0;

    const controlPercentage = readinessData?.coverage?.controlStats?.total
        ? Math.round((readinessData.coverage.controlStats.implemented / readinessData.coverage.controlStats.total) * 100)
        : 0;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                            Governance Dashboard
                            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none px-3 py-1 text-[10px] font-bold tracking-widest shadow-lg shadow-indigo-200 uppercase">
                                Premium
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Establish robust governance, manage policies, and orchestrate compliance workflows.
                        </p>
                    </div>
                    <PageGuide
                        title="Governance Dashboard"
                        description="Establish robust governance, manage policies, and orchestrate compliance workflows."
                        rationale="A strong governance framework ensures that security activities are aligned with business goals and compliance requirements."
                        howToUse={[
                            { step: "Monitor Health", description: "Track your overall Governance Health Score and key compliance metrics." },
                            { step: "Review Controls", description: "Check the 'Control Readiness' card to see implementation progress." },
                            { step: "Manage Tasks", description: "Use 'Quick Actions' to draft policies or manage tasks." }
                        ]}
                        integrations={[
                            { name: "Policies", description: "Draft and approve policies." },
                            { name: "Controls", description: "Map and implement controls." },
                            { name: "Risk Register", description: "Assess and mitigate risks." }
                        ]}
                    />
                </div>

                {/* Program Overview Callout */}
                <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100 mb-6">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex gap-4 items-center">
                            <div className="p-3 bg-indigo-100 rounded-xl hidden sm:block">
                                <BookOpen className="w-8 h-8 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-indigo-900 text-lg">Governance Program Guide</h3>
                                <p className="text-indigo-700/80 max-w-2xl">
                                    Learn how to build a strategic GRC program, from defining roles (RACI) to automating controls.
                                </p>
                            </div>
                        </div>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold whitespace-nowrap">
                            View Guide <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Workflow Introduction Section */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-6 h-6 text-indigo-400" />
                            Getting Started with Governance
                        </CardTitle>
                        <CardDescription className="text-slate-300">
                            Follow this linear workflow to establish your compliance baseline.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-6 left-10 right-10 h-0.5 bg-slate-700 -z-10"></div>

                            {[
                                {
                                    step: "1. Roles",
                                    title: "Define RACI",
                                    desc: "Assign accountability.",
                                    link: `/clients/${clientId}/raci-matrix`,
                                    icon: Users,
                                    color: "text-blue-400",
                                    bg: "bg-blue-900/50",
                                    isComplete: false // Logic TBD
                                },
                                {
                                    step: "2. Controls",
                                    title: "Implement",
                                    desc: "Deploy security controls.",
                                    link: `/clients/${clientId}/controls`,
                                    icon: Shield,
                                    color: "text-emerald-400",
                                    bg: "bg-emerald-900/50",
                                    isComplete: (readinessData?.controlStats?.implemented || 0) > 0
                                },
                                {
                                    step: "3. Risks",
                                    title: "Assess Risk",
                                    desc: "Identify & mitigate risks.",
                                    link: `/clients/${clientId}/risk-register`,
                                    icon: AlertTriangle,
                                    color: "text-orange-400",
                                    bg: "bg-orange-900/50",
                                    isComplete: (riskStats?.unmitigatedCriticalRisks || 0) === 0 // Logic: no critical unmitigated risks
                                },
                                {
                                    step: "4. Policies",
                                    title: "Codify",
                                    desc: "Draft and approve policies.",
                                    link: `/clients/${clientId}/policies`,
                                    icon: FileText,
                                    color: "text-amber-400",
                                    bg: "bg-amber-900/50",
                                    isComplete: (readinessData?.policyStats?.approved || 0) > 0
                                },
                                {
                                    step: "5. Automate",
                                    title: "Workflows",
                                    desc: "Automate evidence.",
                                    link: `/clients/${clientId}/workflows`,
                                    icon: Zap,
                                    color: "text-purple-400",
                                    bg: "bg-purple-900/50",
                                    isComplete: false
                                },
                                {
                                    step: "6. Plan",
                                    title: "Roadmap",
                                    desc: "Strategic plans.",
                                    link: `/clients/${clientId}/roadmap/dashboard`,
                                    icon: Target,
                                    color: "text-pink-400",
                                    bg: "bg-pink-900/50",
                                    isComplete: false
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
                                        <div className="font-semibold mb-1 text-white text-sm">{item.title}</div>
                                        <div className="text-xs text-slate-400 leading-snug">{item.desc}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Metrics Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Governance Health Score */}
                    <Card className="card-enhanced border-l-4 border-l-indigo-600 bg-indigo-50/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-indigo-900">Governance Health</CardTitle>
                            <Activity className="h-4 w-4 text-indigo-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-indigo-700">{govStats?.healthScore || 0}%</div>
                            <p className="text-xs text-indigo-600 mt-1">Overall System Health</p>
                        </CardContent>
                    </Card>

                    {/* Policy Status */}
                    <Card className="card-enhanced border-l-4 border-l-amber-500 bg-amber-50/50 cursor-pointer hover:bg-amber-100/50 transition-colors" onClick={() => window.location.href = `/clients/${clientId}/policies`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-amber-900">Policy Coverage</CardTitle>
                            <FileText className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-amber-700">{policyPercentage}%</div>
                            <p className="text-xs text-amber-600 mt-1">
                                {readinessData?.policyStats?.approved || 0} / {readinessData?.policyStats?.total || 0} Approved
                            </p>
                        </CardContent>
                    </Card>

                    {/* Control Readiness */}
                    <Card className="card-enhanced border-l-4 border-l-emerald-600 bg-emerald-50/50 cursor-pointer hover:bg-emerald-100/50 transition-colors" onClick={() => window.location.href = `/clients/${clientId}/controls`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-900">Control Readiness</CardTitle>
                            <Shield className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-emerald-700">{controlPercentage}%</div>
                            <p className="text-xs text-emerald-600 mt-1">
                                {readinessData?.controlStats?.implemented || 0} / {readinessData?.controlStats?.total || 0} Implemented
                            </p>
                        </CardContent>
                    </Card>

                    {/* Risk Profile Card (NEW) */}
                    <Card className="card-enhanced border-l-4 border-l-orange-500 bg-orange-50/50 cursor-pointer hover:bg-orange-100/50 transition-colors" onClick={() => window.location.href = `/clients/${clientId}/risk-register`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-orange-900">Risk Profile</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-orange-700">{riskStats?.unmitigatedCriticalRisks || 0}</div>
                            <p className="text-xs text-orange-600 mt-1">
                                Critical Unmitigated Risks
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Governance Activity Chart */}
                    <Card className="col-span-1 shadow-md border-none ring-1 ring-slate-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-indigo-500" />
                                Governance Activity
                            </CardTitle>
                            <CardDescription>Created vs Completed tasks (Last 30 days)</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] mt-4">
                            {!activityTrend || activityTrend.length === 0 || isLoadingTrend ? (
                                <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                    <Activity className="w-10 h-10 text-slate-300 mb-2 animate-pulse" />
                                    <p className="text-sm text-slate-400">Loading activity data...</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={activityTrend}>
                                        <defs>
                                            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="displayDate"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                            interval={6}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                        <Area
                                            type="monotone"
                                            dataKey="created"
                                            name="Created"
                                            stroke="#4f46e5"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorCreated)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="completed"
                                            name="Completed"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorCompleted)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Common governance tasks</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <Link href={`/clients/${clientId}/policies/new`}>
                                <Button variant="outline" className="w-full justify-start h-auto py-4 px-4 hover:bg-amber-50 hover:border-amber-200">
                                    <FileText className="mr-4 h-6 w-6 text-amber-500" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-semibold">Draft New Policy</span>
                                        <span className="text-xs text-muted-foreground">Create a policy using AI templates</span>
                                    </div>
                                </Button>
                            </Link>
                            <Link href={`/clients/${clientId}/controls`}>
                                <Button variant="outline" className="w-full justify-start h-auto py-4 px-4 hover:bg-emerald-50 hover:border-emerald-200">
                                    <Shield className="mr-4 h-6 w-6 text-emerald-500" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-semibold">Map Controls</span>
                                        <span className="text-xs text-muted-foreground">Link controls to frameworks</span>
                                    </div>
                                </Button>
                            </Link>
                            <Link href={`/clients/${clientId}/risk-register`}>
                                <Button variant="outline" className="w-full justify-start h-auto py-4 px-4 hover:bg-orange-50 hover:border-orange-200">
                                    <AlertTriangle className="mr-4 h-6 w-6 text-orange-500" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-semibold">Risk Register</span>
                                        <span className="text-xs text-muted-foreground">Manage and mitigate organizational risks</span>
                                    </div>
                                </Button>
                            </Link>
                            <Link href={`/clients/${clientId}/governance/workbench`}>
                                <Button variant="outline" className="w-full justify-start h-auto py-4 px-4 hover:bg-red-50 hover:border-red-200">
                                    <ListTodo className="mr-4 h-6 w-6 text-red-500" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-semibold">Manage Tasks</span>
                                        <span className="text-xs text-muted-foreground">Review pending governance items</span>
                                    </div>
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
