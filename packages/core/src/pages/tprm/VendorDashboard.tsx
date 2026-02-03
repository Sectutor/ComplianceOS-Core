import React from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { Loader2, AlertCircle, CheckCircle, Clock, Globe, Search, Building2, ShieldAlert, Activity, FileCheck, BookOpen, ArrowRight, TrendingUp, Eye, FileText, Shield } from "lucide-react";
import { Badge } from "@complianceos/ui/ui/badge";
import { Link } from "wouter";
import { Button } from "@complianceos/ui/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProgressIndicator } from "@complianceos/ui/ui/ProgressIndicator";
import { StatusBadge } from "@complianceos/ui/ui/StatusBadge";

export default function VendorDashboard() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const { data: stats, isLoading } = trpc.vendors.getStats.useQuery({ clientId });

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    const riskData = stats?.riskBreakdown ? Object.entries(stats.riskBreakdown).map(([name, value]) => ({ name, value })) : [];
    const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#94a3b8']; // Green, Amber, Red, Slate

    return (
        <div className="space-y-6 page-transition">
            <Breadcrumb
                items={[
                    { label: "Vendors", href: `/clients/${id}/vendors/overview` },
                    { label: "Dashboard" },
                ]}
            />

            {/* Header */}
            <div className="animate-slide-down">
                <h1 className="text-3xl font-bold">Vendor Risk Management</h1>
                <p className="text-muted-foreground mt-1">
                    Overview of vendor ecosystem and risk posture
                </p>
            </div>




            {/* Vendor Program Overview Callout */}
            <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100 mb-6 animate-fade-in">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex gap-4 items-center">
                        <div className="p-3 bg-emerald-100 rounded-xl hidden sm:block">
                            <BookOpen className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-emerald-900 text-lg">Vendor Risk Management Program Guide</h3>
                            <p className="text-emerald-700/80 max-w-2xl">
                                Learn how to establish a compliant TPRM program, categorize vendors, and manage lifecycle risks effectively.
                            </p>
                        </div>
                    </div>
                    <Link href={`/clients/${clientId}/vendors/overview-guide`}>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold whitespace-nowrap">
                            View Program Guide <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            {/* Workflow Introduction Section */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-lg overflow-hidden relative mb-6 animate-fade-in delay-200">
                <div className="absolute top-0 right-0 p-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="w-6 h-6 text-purple-400" />
                        Getting Started with Vendor Risks
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                        Manage vendor lifecycle from discovery to termination.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                        {/* Connector Line (Desktop) */}
                        <div className="hidden md:block absolute top-6 left-10 right-10 h-0.5 bg-slate-700 -z-10"></div>

                        {[
                            {
                                step: "1. Discover",
                                title: "Add Vendors",
                                desc: "Import or discover new vendors.",
                                link: `/clients/${clientId}/vendors/discovery`,
                                icon: Search,
                                color: "text-blue-400",
                                bg: "bg-blue-900/50"
                            },
                            {
                                step: "2. Profile",
                                title: "Categorize",
                                desc: "Set criticality and tiering.",
                                link: `/clients/${clientId}/vendors/all`,
                                icon: Building2,
                                color: "text-amber-400",
                                bg: "bg-amber-900/50"
                            },
                            {
                                step: "3. Assess",
                                title: "Security Review",
                                desc: "Send questionnaires (SIG/CAIQ).",
                                link: `/clients/${clientId}/vendors/reviews`,
                                icon: ShieldAlert,
                                color: "text-red-400",
                                bg: "bg-red-900/50"
                            },
                            {
                                step: "4. Analyze",
                                title: "Risk Analysis",
                                desc: "Review findings and gaps.",
                                link: `/clients/${clientId}/vendors/reviews`,
                                icon: FileCheck,
                                color: "text-purple-400",
                                bg: "bg-purple-900/50"
                            },
                            {
                                step: "5. Monitor",
                                title: "Continuous",
                                desc: "Track performance and renewal.",
                                link: `/clients/${clientId}/vendors/overview`,
                                icon: Activity,
                                color: "text-emerald-400",
                                bg: "bg-emerald-900/50"
                            }
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

            {/* Key Performance Indicators */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Total Vendors</p>
                                <h3 className="text-2xl font-bold">{stats?.totalVendors || 0}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Critical Risk</p>
                                <h3 className="text-2xl font-bold">{stats?.riskBreakdown['High'] || 0}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Compliance Guide Card */}
                <div className="p-4 rounded-xl border border-indigo-200 bg-white shadow-sm flex flex-col justify-between cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group" onClick={() => window.location.href = `/clients/${clientId}/vendors/alignment-guide`}>
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-slate-900">ISO 27001</span>
                                <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-indigo-100 text-indigo-700 pointer-events-none">GUIDE</Badge>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-2 font-medium group-hover:text-indigo-600 transition-colors">
                                <span>View alignment</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                            <BookOpen className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-[400px]">
                    <CardHeader>
                        <CardTitle>Distribution by Criticality</CardTitle>
                        <CardDescription>Breakdown of vendors by assigned risk level</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPie>
                                <Pie
                                    data={riskData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {riskData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={
                                            entry.name === 'High' ? COLORS[2] :
                                                entry.name === 'Medium' ? COLORS[1] :
                                                    entry.name === 'Low' ? COLORS[0] : COLORS[3]
                                        } />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </RechartsPie>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="h-[400px]">
                    <CardHeader>
                        <CardTitle>Vendor Ecosystem</CardTitle>
                        <CardDescription>Geographic distribution (Mock)</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[320px] bg-slate-50 rounded-md border border-dashed">
                        <div className="text-center text-slate-400">
                            <Globe className="w-16 h-16 mx-auto mb-2 opacity-50" />
                            <p>Map visualization coming soon.</p>
                            <p className="text-xs">Locations: US, EU, APAC</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
