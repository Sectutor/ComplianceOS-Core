import React from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { Loader2, AlertCircle, CheckCircle, Clock, Globe, Search, Building2, ShieldAlert, Activity, FileCheck, BookOpen, ArrowRight, TrendingUp, Eye, FileText, Shield, Radar, Zap } from "lucide-react";
import { Badge } from "@complianceos/ui/ui/badge";
import { Link } from "wouter";
import { Button } from "@complianceos/ui/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { ProgressIndicator } from "@complianceos/ui/ui/ProgressIndicator";
import { StatusBadge } from "@complianceos/ui/ui/StatusBadge";
import { PageGuide } from "@/components/PageGuide";

export default function VendorDashboard() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const { data: stats, isLoading } = trpc.vendors.getStats.useQuery({ clientId });

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    const riskData = stats?.riskBreakdown ? Object.entries(stats.riskBreakdown).map(([name, value]) => ({ name, value })) : [];
    const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#94a3b8']; // Green, Amber, Red, Slate

    return (
        <div className="relative space-y-6 page-transition">
            {/* Ambient Light Mode Background Glows */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-emerald-500/10 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[100px]" />
            </div>
            <div className="relative z-10 space-y-6">

                {/* Header */}
                <div className="animate-slide-down">
                    <PageGuide
                        title="Vendor Risk Management"
                        description="Overview of vendor ecosystem and risk posture."
                        rationale="Monitor vendor compliance and security posture to mitigate supply chain risks. Your supply chain is often your weakest security link."
                        howToUse={[
                            {
                                step: "Supply Chain Intel",
                                description: "Monitor OSINT and Dark Web feeds for potential breaches in your 3rd and 4th-party ecosystem.",
                                targetId: "vendor-intel-banner"
                            },
                            {
                                step: "Follow Lifecycle",
                                description: "Follow the 5-step lifecycle: Discover, Profile, Assess, Analyze, and Monitor.",
                                targetId: "vendor-lifecycle-workflow"
                            },
                        ]}
                        integrations={[
                            { name: "Global Catalog", description: "Standard security profiles for 10,000+ vendors." },
                            { name: "Risk Register", description: "Escalate supply chain risks to the corporate level." }
                        ]}
                        scenarios={[
                            {
                                title: "Assessing a High-Risk SaaS Provider",
                                example: "You are onboarding a new HR management system that will process sensitive employee PII.",
                                auditTip: "Focus on the 'Assess' phase of the lifecycle. Use a 'Full Security Review' template and require a SOC 2 Type II report as mandatory evidence."
                            },
                            {
                                title: "Identifying 4th Party Risk",
                                example: "One of your critical vendors is hosted on a cloud provider that just announced a major vulnerability.",
                                auditTip: "Use 'Supply Chain Intel' to see which of your vendors rely on that specific cloud provider. This allows you to proactively reach out to them before a breach occurs."
                            }
                        ]}
                    />
                </div>

                {/* AI Supply Chain Intelligence Banner */}
                <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-1 rounded-2xl shadow-xl mb-6" id="vendor-intel-banner">
                    <div className="bg-slate-900/40 backdrop-blur-xl rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400">
                                <Radar className="w-6 h-6 animate-[spin_4s_linear_infinite]" />
                                <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500/20 duration-1000"></div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-white font-bold text-sm tracking-wide">AI SUPPLY CHAIN INTELLIGENCE</h3>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">MONITORING</span>
                                </div>
                                <p className="text-slate-300 text-sm mt-0.5">Scanning Dark Web & OSINT sources. <span className="text-white font-semibold flex items-center gap-1">1 potential breach</span> detected in your 4th-party ecosystem.</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-colors border border-white/10 flex items-center gap-2 whitespace-nowrap">
                            <Zap className="w-4 h-4 text-amber-400" />
                            Run Target Audit
                        </button>
                    </div>
                </div>




                {/* Vendor Program Overview Callout */}
                <Card className="relative overflow-hidden border-none shadow-premium bg-gradient-to-r from-emerald-600 to-teal-700 text-white mb-6 animate-fade-in hover-lift">
                    <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex gap-5 items-center">
                            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl shadow-inner border border-white/20 hidden sm:block">
                                <BookOpen className="w-8 h-8 text-emerald-50" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-white text-2xl tracking-tight">Vendor Risk Management Program Guide</h3>
                                <p className="text-emerald-50/90 mt-1 max-w-2xl font-medium leading-relaxed">
                                    Learn how to establish a compliant TPRM program, categorize vendors, and manage lifecycle risks effectively.
                                </p>
                            </div>
                        </div>
                        <Link href={`/clients/${clientId}/vendors/program-guide`}>
                            <Button className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold whitespace-nowrap shadow-lg h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95">
                                View Program Guide <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Workflow Introduction Section */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-2xl overflow-hidden relative mb-6 animate-fade-in delay-200" id="vendor-lifecycle-workflow">
                    <div className="absolute top-0 right-0 p-32 bg-purple-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 p-32 bg-blue-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
                    <CardHeader className="relative z-10 pb-2">
                        <CardTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
                            <Globe className="w-7 h-7 text-purple-400" />
                            Getting Started with Vendor Risks
                        </CardTitle>
                        <CardDescription className="text-slate-300 font-medium text-base">
                            Manage vendor lifecycle from discovery to termination.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-500/0 via-purple-500/50 to-emerald-500/0 -z-10"></div>

                            {[
                                {
                                    step: "1. Discover",
                                    title: "Add Vendors",
                                    desc: "Import or discover new vendors.",
                                    link: `/clients/${clientId}/vendors/discovery`,
                                    icon: Search,
                                    color: "text-blue-300",
                                    bg: "bg-blue-900/60 border-blue-500/30",
                                    shadow: "shadow-blue-900/50"
                                },
                                {
                                    step: "2. Profile",
                                    title: "Categorize",
                                    desc: "Set criticality and tiering.",
                                    link: `/clients/${clientId}/vendors/all`,
                                    icon: Building2,
                                    color: "text-amber-300",
                                    bg: "bg-amber-900/60 border-amber-500/30",
                                    shadow: "shadow-amber-900/50"
                                },
                                {
                                    step: "3. Assess",
                                    title: "Security Review",
                                    desc: "Send questionnaires (SIG/CAIQ).",
                                    link: `/clients/${clientId}/vendors/reviews`,
                                    icon: ShieldAlert,
                                    color: "text-red-300",
                                    bg: "bg-red-900/60 border-red-500/30",
                                    shadow: "shadow-red-900/50"
                                },
                                {
                                    step: "4. Analyze",
                                    title: "Risk Analysis",
                                    desc: "Review findings and gaps.",
                                    link: `/clients/${clientId}/vendors/reviews`,
                                    icon: FileCheck,
                                    color: "text-purple-300",
                                    bg: "bg-purple-900/60 border-purple-500/30",
                                    shadow: "shadow-purple-900/50"
                                },
                                {
                                    step: "5. Monitor",
                                    title: "Continuous",
                                    desc: "Track performance and renewal.",
                                    link: `/clients/${clientId}/vendors/overview`,
                                    icon: Activity,
                                    color: "text-emerald-300",
                                    bg: "bg-emerald-900/60 border-emerald-500/30",
                                    shadow: "shadow-emerald-900/50"
                                }
                            ].map((item, i) => (
                                <Link key={i} href={item.link}>
                                    <div className="group relative flex flex-col items-center text-center p-5 rounded-2xl hover:bg-white/5 transition-all duration-300 cursor-pointer h-full border border-transparent hover:border-white/10 hover:shadow-xl backdrop-blur-sm">
                                        <div className={`w-14 h-14 rounded-2xl border ${item.bg} flex items-center justify-center mb-4 shadow-lg ${item.shadow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                            <item.icon className={`w-7 h-7 ${item.color}`} />
                                        </div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#3ABEF9] mb-1.5">{item.step}</div>
                                        <div className="font-bold text-lg mb-1.5 text-white">{item.title}</div>
                                        <div className="text-sm text-slate-400 leading-snug font-medium group-hover:text-slate-300 transition-colors">{item.desc}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Key Performance Indicators */}
                <div className="grid gap-6 md:grid-cols-4" id="vendor-stats-summary">
                    <Card className="hover-lift border-none shadow-premium bg-white/60 backdrop-blur-xl group">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/20 text-white rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <CheckCircle className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Total Vendors</p>
                                    <h3 className="text-4xl font-black text-slate-900">{stats?.totalVendors || 0}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="hover-lift border-none shadow-premium bg-white/60 backdrop-blur-xl group">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/20 text-white rounded-2xl group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                                    <AlertCircle className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Critical Risk</p>
                                    <h3 className="text-4xl font-black text-slate-900">{stats?.riskBreakdown['High'] || 0}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Compliance Guide Card */}
                    <div className="md:col-span-2 p-5 rounded-3xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white shadow-premium flex flex-col justify-center cursor-pointer hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group" onClick={() => window.location.href = `/clients/${clientId}/vendors/program-guide`}>
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-lg font-black text-slate-900 tracking-tight">ISO 27001 Alignment</span>
                                    <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 pointer-events-none font-bold shadow-inner">GUIDE</Badge>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium group-hover:text-indigo-600 transition-colors">
                                    <span>Master your vendor risk program</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white shadow-md text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                <BookOpen className="w-7 h-7" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="h-[420px] border-none shadow-premium bg-white/60 backdrop-blur-xl hover-lift" id="vendor-risk-distribution">
                        <CardHeader className="pb-0 border-b border-slate-100/50">
                            <CardTitle className="text-xl font-bold tracking-tight">Distribution by Criticality</CardTitle>
                            <CardDescription className="font-medium text-slate-500">Breakdown of vendors by assigned risk level</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[340px] pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPie>
                                    <Pie
                                        data={riskData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={110}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {riskData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={
                                                entry.name === 'High' ? COLORS[2] :
                                                    entry.name === 'Medium' ? COLORS[1] :
                                                        entry.name === 'Low' ? COLORS[0] : COLORS[3]
                                            } className="drop-shadow-sm hover:opacity-80 transition-opacity cursor-pointer focus:outline-none" />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 600, fontSize: '13px' }} />
                                </RechartsPie>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="h-[420px] border-none shadow-premium bg-white/60 backdrop-blur-xl hover-lift">
                        <CardHeader className="pb-0 border-b border-slate-100/50">
                            <CardTitle className="text-xl font-bold tracking-tight">Vendor Ecosystem</CardTitle>
                            <CardDescription className="font-medium text-slate-500">Geographic distribution (Visualizer)</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[340px] pt-4 flex items-center justify-center">
                            <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-map-pattern opacity-5 group-hover:opacity-10 transition-opacity duration-1000"></div>

                                <div className="z-10 text-center flex flex-col items-center">
                                    <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                                        <Globe className="w-10 h-10 text-slate-300 group-hover:text-[#3ABEF9] transition-colors duration-500" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-700 mb-1">Global Visualization</h4>
                                    <p className="text-sm font-medium text-slate-500">Connecting interactive map modules...</p>
                                    <div className="flex gap-2 mt-4">
                                        <Badge variant="outline" className="bg-white/50 backdrop-blur-sm text-slate-600 font-bold">US</Badge>
                                        <Badge variant="outline" className="bg-white/50 backdrop-blur-sm text-slate-600 font-bold">EU</Badge>
                                        <Badge variant="outline" className="bg-white/50 backdrop-blur-sm text-slate-600 font-bold">APAC</Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
