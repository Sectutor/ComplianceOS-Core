import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@complianceos/ui";
import { trpc } from '@/lib/trpc';
import {
    CheckCircle2,
    AlertCircle,
    Clock,
    TrendingUp,
    Shield,
    Activity,
    Target,
    Zap,
    Brain,
    ArrowUpRight
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Cell,
    PieChart,
    Pie
} from 'recharts';

interface ExecutiveDashboardProps {
    clientId: number;
    onViewFullAnalysis?: () => void;
}

export const ExecutiveDashboard = ({ clientId, onViewFullAnalysis }: ExecutiveDashboardProps) => {
    const { data: dashboard, isLoading } = trpc.metrics.getDashboard.useQuery({ clientId });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-slate-100 rounded-xl" />
                ))}
            </div>
        );
    }

    const { strategic, cyber, culture, supplyChain, compliance, resilience } = (dashboard as any) || {};

    // Data for Domain Maturity Radar
    const radarData = [
        { subject: 'Strategic', A: strategic?.riskAppetiteConsumption ? 100 - strategic.riskAppetiteConsumption : 0, fullMark: 100 },
        { subject: 'Cyber', A: cyber?.assetCriticalityCoverage || 0, fullMark: 100 },
        { subject: 'Culture', A: culture?.policyAckRate || 0, fullMark: 100 },
        { subject: 'Supply Chain', A: 100 - (supplyChain?.avgCriticalVendorRisk || 0), fullMark: 100 },
        { subject: 'Compliance', A: compliance?.controlEffectiveness || 0, fullMark: 100 },
        { subject: 'Resilience', A: resilience?.biaCompletionRate || 0, fullMark: 100 },
    ];

    const stats = [
        {
            label: "Compliance Posture",
            value: `${compliance?.controlEffectiveness || 0}%`,
            description: "Implemented & Passing Controls",
            icon: Shield,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            trend: "+2.4% from last month"
        },
        {
            label: "Critical Risks",
            value: strategic?.criticalRisksUnmitigated || 0,
            description: "High inherent risk, no treatment",
            icon: AlertCircle,
            color: "text-rose-600",
            bg: "bg-rose-50",
            trend: "Action required"
        },
        {
            label: "Open Vulnerabilities",
            value: cyber?.openVulns || 0,
            description: "Detected in active assets",
            icon: Zap,
            color: "text-amber-600",
            bg: "bg-amber-50",
            trend: "-12% improvement"
        }
    ];

    return (
        <div className="space-y-8">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <Card key={idx} className="border-none shadow-md bg-white overflow-hidden group hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                                    Live <Activity className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-sm font-medium text-slate-500">{stat.label}</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
                                    <span className="text-xs font-semibold text-emerald-600 flex items-center">
                                        <ArrowUpRight className="w-3 h-3" />
                                        {stat.trend.includes('%') ? stat.trend.split(' ')[0] : ''}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{stat.description}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Maturity Radar */}
                <Card className="lg:col-span-3 border-none shadow-md bg-white overflow-hidden">
                    <CardHeader className="border-b border-slate-50 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Target className="w-5 h-5 text-indigo-500" />
                            Domain Maturity Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis
                                        dataKey="subject"
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                                    />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Maturity"
                                        dataKey="A"
                                        stroke="#6366f1"
                                        fill="#6366f1"
                                        fillOpacity={0.5}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* AI Summary Sidebar */}
                <Card className="lg:col-span-2 border-none bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Brain className="w-5 h-5 text-indigo-200" />
                            AI Posture Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                            <h4 className="font-bold text-sm mb-1 text-indigo-100 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Current Summary
                            </h4>
                            <p className="text-sm leading-relaxed text-indigo-50">
                                Your overall compliance posture is <b>{compliance?.controlEffectiveness || 0}%</b>.
                                Risk appetite consumption is currently within within set thresholds, but critical vendor risks require attention.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-200">Key Recommendations</h4>
                            {[
                                { text: "Perform BIA for 3 critical business processes.", icon: CheckCircle2 },
                                { text: "Remediate high-velocity vulnerabilities in Finance assets.", icon: Zap },
                                { text: "Complete ISO 27001 readiness assessment.", icon: Target }
                            ].map((rec, i) => (
                                <div key={i} className="flex gap-3 items-start group">
                                    <div className="mt-1 p-1 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                                        <rec.icon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-sm text-indigo-50">{rec.text}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 mt-auto">
                            <button
                                onClick={onViewFullAnalysis}
                                className="w-full py-3 bg-white text-indigo-700 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                            >
                                <TrendingUp className="w-4 h-4" />
                                View Full Analysis
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
