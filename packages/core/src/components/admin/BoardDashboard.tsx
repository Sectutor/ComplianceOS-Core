import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { 
    ResponsiveContainer, Radar, RadarChart, PolarGrid, 
    PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, 
    XAxis, YAxis, Tooltip, Cell 
} from 'recharts';
import { 
    Shield, TrendingUp, AlertTriangle, 
    CheckCircle2, FileText, LayoutDashboard,
    ArrowUpRight, Target
} from 'lucide-react';
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";

interface BoardDashboardProps {
    data: {
        readinessPercent: number;
        riskScore: number;
        complianceVelocity: number;
        missingEvidenceCount: number;
        criticalGaps: number;
        frameworkPostures: Array<{ name: string; score: number }>;
    };
    clientName: string;
}

export default function BoardDashboard({ data, clientName }: BoardDashboardProps) {
    const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b'];

    return (
        <div className="space-y-8 p-6 bg-slate-50/30 rounded-xl border border-slate-200">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <LayoutDashboard className="h-8 w-8 text-indigo-600" />
                        Executive Compliance Brief
                    </h2>
                    <p className="text-slate-500 font-medium">Reporting for: <span className="text-indigo-600 font-bold">{clientName}</span></p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white hover:bg-slate-50 border-slate-200">
                        <FileText className="mr-2 h-4 w-4" /> Download Report
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                        Share with Board <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Overall Readiness" 
                    value={`${data.readinessPercent}%`} 
                    icon={<Shield className="h-5 w-5" />} 
                    color="indigo"
                    trend="+5% from last month"
                />
                <MetricCard 
                    title="Residual Risk" 
                    value={data.riskScore} 
                    icon={<AlertTriangle className="h-5 w-5" />} 
                    color="amber"
                    trend="Stable"
                />
                <MetricCard 
                    title="Compliance Velocity" 
                    value={`${data.complianceVelocity}x`} 
                    icon={<TrendingUp className="h-5 w-5" />} 
                    color="emerald"
                    trend="Increasing"
                />
                <MetricCard 
                    title="Critical Gaps" 
                    value={data.criticalGaps} 
                    icon={<Target className="h-5 w-5" />} 
                    color="rose"
                    trend="-2 from last week"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Radar Chart: Multi-Framework Posture */}
                <Card className="shadow-sm border-slate-200 bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg">Governance Posture</CardTitle>
                        <CardDescription>Multi-framework compliance coverage comparison</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.frameworkPostures}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Compliance Score"
                                    dataKey="score"
                                    stroke="#4f46e5"
                                    fill="#4f46e5"
                                    fillOpacity={0.6}
                                />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Bar Chart: Framework Readiness */}
                <Card className="shadow-sm border-slate-200 bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg">Readiness Details</CardTitle>
                        <CardDescription>Individual framework implementation progress</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.frameworkPostures} layout="vertical" margin={{ left: 40, right: 30 }}>
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                                    {data.frameworkPostures.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Call to Action Bar */}
            <Card className="bg-indigo-900 border-indigo-800 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Shield className="h-64 w-64 rotate-12" />
                </div>
                <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Audit-Ready in 14 Days</h3>
                        <p className="text-indigo-200 max-w-md">Your system is 78% of the way to SOC2 Type II certification. Complete the remaining critical gaps to schedule your audit.</p>
                    </div>
                    <Button variant="secondary" className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold px-8">
                        View Remediation Plan
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

function MetricCard({ title, value, icon, color, trend }: any) {
    const colorClasses: any = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100",
    };

    return (
        <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</CardTitle>
                <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
                <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    {trend.includes('+') || trend.includes('-') ? (
                        <TrendingUp className={`h-3 w-3 ${trend.includes('+') ? 'text-emerald-500' : 'text-rose-500'}`} />
                    ) : null}
                    {trend}
                </p>
            </CardContent>
        </Card>
    );
}
