
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { useParams, useLocation } from "wouter";
import { Button } from "@complianceos/ui/ui/button";
import {
    Shield, Brain, Lock, ChevronLeft, ChevronRight,
    AlertTriangle, CheckCircle2, Clock,
    ArrowUpRight, BarChart3, Target,
    FileText, Plus
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageGuide } from "@/components/PageGuide";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import {
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Cell
} from "recharts";
import { Progress } from "@complianceos/ui/ui/progress";
import { AddRiskAssessmentDialog } from "@/components/risk/AddRiskAssessmentDialog";

export const ProjectDetail = () => {
    const { selectedClientId } = useClientContext();
    const params = useParams();
    const [, setLocation] = useLocation();
    const projectId = parseInt(params.projectId!);
    const clientId = params.clientId ? parseInt(params.clientId) : selectedClientId;

    const [selectedRisk, setSelectedRisk] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    const { data: project, isLoading: projectLoading } = trpc.projects.get.useQuery(
        { id: projectId, clientId: clientId! },
        { enabled: !!projectId && !!clientId }
    );

    const { data: posture, isLoading: postureLoading, refetch: refetchPosture } = trpc.projects.getProjectSecurityPosture.useQuery(
        { projectId, clientId: clientId! },
        { enabled: !!projectId && !!clientId }
    );

    const { data: risks, refetch: refetchRisks } = trpc.risks.list.useQuery(
        { clientId: clientId!, projectId, limit: 100 },
        { enabled: !!projectId && !!clientId }
    );

    const { data: threatModels } = trpc.threatModels.list.useQuery(
        { clientId: clientId!, projectId, relaxedProjectSearch: true },
        { enabled: !!projectId && !!clientId }
    );

    const linddunModel = threatModels?.find(m => m.methodology === 'LINDDUN');

    if (projectLoading || postureLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!project) return <div>Project not found</div>;

    const radarData = posture?.csfStats || [];
    const owaspStats = posture?.owaspStats || [];
    const aiRmfStats = posture?.aiRmfStats || [];
    const overallPosture = posture?.overallPosture || 0;

    const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

    return (
        <DashboardLayout>
            <div className="space-y-6 page-transition">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Projects", href: `/clients/${clientId}/projects` },
                        { label: project.name },
                    ]}
                />

                <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLocation(`/clients/${clientId}/projects`)}
                            className="bg-white border rounded-xl"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <div className="flex items-center space-x-3">
                                <h1 className="text-3xl font-extrabold text-slate-900">{project.name}</h1>
                                <Badge variant="outline" className="capitalize">{project.projectType}</Badge>
                            </div>
                            <p className="text-slate-500 mt-1">{project.description}</p>
                        </div>
                    </div>

                    <div className="flex space-x-3 items-center">
                        <PageGuide
                            title="IT Project Overview"
                            description="Security posture and risk analysis for infrastructure projects."
                            rationale="Provides visibility into the security health of IT initiatives."
                            howToUse={[
                                { step: "Security Analysis", description: "View NIST CSF maturity scores." },
                                { step: "Privacy & Data", description: "Track LINDDUN privacy threats." },
                                { step: "Risk Register", description: "Manage project-specific risks." }
                            ]}
                        />
                        <Button variant="outline" className="rounded-xl">
                            <FileText className="mr-2 h-4 w-4" /> Export Report
                        </Button>
                        <Button className="rounded-xl shadow-lg shadow-blue-100 bg-blue-600 hover:bg-blue-700">
                            Perform Assessment
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-slate-100/50 p-1 rounded-xl glass-effect border border-slate-200">
                        <TabsTrigger value="overview" className="rounded-lg px-6">Overview</TabsTrigger>
                        <TabsTrigger value="security" className="rounded-lg px-6">Security Analysis</TabsTrigger>
                        <TabsTrigger value="privacy" className="rounded-lg px-6">Privacy & Data</TabsTrigger>
                        <TabsTrigger value="risks" className="rounded-lg px-6">Risk Register</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {/* KPI Cards */}
                            <Card className="border-none shadow-sm bg-gradient-to-br from-red-50 to-white overflow-hidden">
                                <CardHeader className="pb-1 p-4">
                                    <CardTitle className="text-xs font-bold text-red-600 uppercase tracking-wider">Critical Risks</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="flex items-center justify-between">
                                        <div className="text-3xl font-black text-red-700">{posture?.riskStats.high || 0}</div>
                                        <AlertTriangle className="h-8 w-8 text-red-200" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-white overflow-hidden">
                                <CardHeader className="pb-1 p-4">
                                    <CardTitle className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Controls</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="flex items-center justify-between">
                                        {/* Show Total Controls (Compliance + Mitigations) instead of just implemented to reflect planning phase */}
                                        <div className="text-3xl font-black text-emerald-700">
                                            {(posture?.complianceStats?.total || 0) + (posture?.treatmentStats?.total || 0)}
                                        </div>
                                        <CheckCircle2 className="h-8 w-8 text-emerald-200" />
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-medium mt-1">
                                        {posture?.complianceStats.implemented + posture?.treatmentStats.implemented} Implemented
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-white overflow-hidden">
                                <CardHeader className="pb-1 p-4">
                                    <CardTitle className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Mitigation</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="flex items-center justify-between">
                                        {/* If 0% completion but we have planned mitigations, show the count to indicate progress */}
                                        <div className="text-3xl font-black text-indigo-700">
                                            {(posture?.treatmentStats?.averageCompletion === 0 && posture?.treatmentStats?.total > 0)
                                                ? posture.treatmentStats.total
                                                : `${posture?.treatmentStats?.averageCompletion || 0}%`}
                                        </div>
                                        <Target className="h-8 w-8 text-indigo-200" />
                                    </div>
                                    <div className="text-[10px] text-indigo-600 font-medium mt-1">
                                        {(posture?.treatmentStats?.averageCompletion === 0 && posture?.treatmentStats?.total > 0)
                                            ? "Planned Strategies"
                                            : "Completion Rate"}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-white overflow-hidden">
                                <CardHeader className="pb-1 p-4">
                                    <CardTitle className="text-xs font-bold text-amber-600 uppercase tracking-wider">Models</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="flex items-center justify-between">
                                        <div className="text-3xl font-black text-amber-700">{posture?.threatModelCount || 0}</div>
                                        <Shield className="h-8 w-8 text-amber-200" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden">
                                <CardHeader className="pb-1 p-4">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-100">Overall Score</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="flex items-center justify-between">
                                        <div className="text-3xl font-black">{overallPosture}%</div>
                                        <BarChart3 className="h-8 w-8 text-blue-400" />
                                    </div>
                                    <Progress value={overallPosture} className="h-1 mt-2 bg-blue-400/30" />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 shadow-sm border-slate-200">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-bold">Residual Risk Profile</CardTitle>
                                        <CardDescription>Consolidated security and privacy posture.</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-100">{posture?.residualStats?.critical || 0} Critical</Badge>
                                        <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-100">{posture?.residualStats?.high || 0} High</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                                            <Radar name="Level" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                                            <Tooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                <Card className="shadow-sm border-slate-200">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-bold flex items-center">
                                            <Lock className="mr-2 h-4 w-4 text-emerald-500" /> Privacy Health
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">LINDDUN Analysis</span>
                                            <Badge className={linddunModel ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"}>
                                                {linddunModel ? "Complete" : "Pending"}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Privacy Risks</span>
                                            <span className="font-bold">{posture?.riskStats?.privacyRisks || 0}</span>
                                        </div>
                                        <Button variant="outline" className="w-full text-xs h-9" onClick={() => setActiveTab('privacy')}>
                                            View Privacy Details
                                        </Button>
                                    </CardContent>
                                </Card>

                                {project.projectType === 'ai' && (
                                    <Card className="shadow-sm border-slate-200 bg-indigo-50/30">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-bold flex items-center">
                                                <Brain className="mr-2 h-4 w-4 text-indigo-500" /> AI RMF 1.0 Status
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-xs text-slate-500 mb-3 tracking-tight">AI risk management frameworks applied to this project scope.</p>
                                            <Progress value={75} className="h-1 bg-indigo-100" />
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>

                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg font-bold">Recent Risks</CardTitle>
                                <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => setActiveTab('risks')}>
                                    View Full Register <ArrowUpRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {risks?.items?.slice(0, 3).map((risk) => (
                                        <div
                                            key={risk.id}
                                            className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group"
                                            onClick={() => { setSelectedRisk(risk); setIsEditOpen(true); }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${risk.inherentRisk === 'Critical' ? 'bg-red-500' : risk.inherentRisk === 'High' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                                                <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{risk.title}</span>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 shadow-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle>NIST CSF Maturity Breakdown</CardTitle>
                                    <CardDescription>Function-level maturity scores derived from identified risks and controls.</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                            <Radar name="Security" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                                            <Tooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle>OWASP Attack Surface</CardTitle>
                                    <CardDescription>Risk concentration in common application attack vectors.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    {owaspStats.map((item) => (
                                        <div key={item.name} className="space-y-2">
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span>{item.name}</span>
                                                <span className="text-slate-400">{item.score}% Risk</span>
                                            </div>
                                            <Progress value={item.score} className="h-1.5" />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="privacy" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="shadow-sm border-slate-200 bg-emerald-50/20">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center">
                                        <Lock className="mr-2 h-5 w-5 text-emerald-500" /> LINDDUN Framework Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-white border border-emerald-100">
                                            <div className="text-xs text-slate-500 font-medium mb-1 uppercase">Models Active</div>
                                            <div className="text-2xl font-bold text-emerald-700">{threatModels?.filter(m => m.methodology === 'LINDDUN').length || 0}</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white border border-emerald-100">
                                            <div className="text-xs text-slate-500 font-medium mb-1 uppercase">Privacy Risks</div>
                                            <div className="text-2xl font-bold text-emerald-700">{posture?.riskStats?.privacyRisks || 0}</div>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                                        onClick={() => setLocation(`/clients/${clientId}/dev/projects/${projectId}/threat-model/${linddunModel?.id || 'new'}?methodology=LINDDUN&source=general`)}
                                    >
                                        {linddunModel ? "Open Privacy Threat Model" : "Start LINDDUN Analysis"}
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="lg:col-span-2 shadow-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle>Identified Privacy Threats</CardTitle>
                                    <CardDescription>Data protection risks affecting personal information and subject rights.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {risks?.items?.filter(r => r.privacyImpact).length === 0 ? (
                                            <div className="text-center py-12 text-slate-400 text-sm italic border-2 border-dashed rounded-xl">No privacy-specific risks identified.</div>
                                        ) : (
                                            risks?.items?.filter(r => r.privacyImpact).map((risk) => (
                                                <div
                                                    key={risk.id}
                                                    className="p-4 rounded-xl border border-emerald-50 bg-emerald-50/10 hover:bg-emerald-50/30 transition-all cursor-pointer flex justify-between items-center group"
                                                    onClick={() => { setSelectedRisk(risk); setIsEditOpen(true); }}
                                                >
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 mb-1">{risk.title}</h4>
                                                        <div className="flex gap-2 items-center">
                                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] h-4">Privacy</Badge>
                                                            <span className="text-[10px] text-slate-400 font-medium">Risk: {risk.inherentRisk}</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-emerald-300 group-hover:translate-x-1 transition-all" />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="risks" className="space-y-6">
                        <Card className="shadow-sm border-slate-200 min-h-[500px]">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <CardTitle className="text-xl font-bold">Project Risk Register</CardTitle>
                                    <CardDescription>Click any risk to update its assessment, treatments, or status.</CardDescription>
                                </div>
                                <Button className="shadow-md bg-blue-600 hover:bg-blue-700 rounded-xl" onClick={() => { setSelectedRisk(null); setIsEditOpen(true); }}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Risk Entry
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {risks?.items?.length === 0 ? (
                                        <div className="text-center py-20 text-slate-400 italic">No risks have been documented for this project yet.</div>
                                    ) : (
                                        risks?.items?.map((risk) => (
                                            <div
                                                key={risk.id}
                                                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                                                onClick={() => { setSelectedRisk(risk); setIsEditOpen(true); }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-3 h-3 rounded-full shrink-0 ${risk.inherentRisk === 'Critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                        risk.inherentRisk === 'High' ? 'bg-orange-500' :
                                                            risk.inherentRisk === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                                        }`} />
                                                    <div>
                                                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{risk.title}</div>
                                                        <div className="flex gap-3 mt-1">
                                                            <span className="text-xs text-slate-400 font-medium flex items-center">
                                                                <Clock className="w-3 h-3 mr-1" /> {risk.status}
                                                            </span>
                                                            {risk.privacyImpact && (
                                                                <span className="text-xs text-emerald-600 font-bold flex items-center bg-emerald-50 px-1.5 rounded">
                                                                    <Lock className="w-2.5 h-2.5 mr-1" /> Privacy
                                                                </span>
                                                            )}
                                                            {risk.owaspCategory && (
                                                                <span className="text-xs text-orange-600 font-medium px-1.5 rounded bg-orange-50 border border-orange-100">
                                                                    {risk.owaspCategory}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right hidden sm:block">
                                                        <div className="text-xs font-bold text-slate-900">Score: {risk.inherentScore || 0}</div>
                                                        <div className="text-[10px] text-slate-400 uppercase tracking-tighter">Residual: {risk.residualScore || 0}</div>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <AddRiskAssessmentDialog
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    clientId={clientId!}
                    initialData={selectedRisk}
                    onSuccess={() => {
                        refetchRisks();
                        refetchPosture();
                    }}
                />
            </div>
        </DashboardLayout>
    );
};
