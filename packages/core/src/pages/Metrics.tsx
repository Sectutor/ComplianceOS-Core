
import React, { useState } from 'react';
import { useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useClientContext } from '@/contexts/ClientContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@complianceos/ui/ui/card';
import { Progress } from '@complianceos/ui/ui/progress';
import { Badge } from '@complianceos/ui/ui/badge';
import {
    Loader2, ShieldAlert, CheckCircle, TrendingUp, BarChart3, Activity,
    Users, Server, FileCheck, Truck, Zap, AlertTriangle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

import DashboardLayout from '@/components/DashboardLayout';

export default function MetricsPage() {
    const { id } = useParams();
    const { selectedClientId } = useClientContext();
    const clientId = id ? parseInt(id) : selectedClientId;

    const { data: dashboard, isLoading, error } = trpc.metrics.getDashboard.useQuery(
        { clientId: clientId! },
        { enabled: !!clientId }
    );

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !dashboard) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center text-red-500">
                    Failed to load metrics dashboard.
                </div>
            </DashboardLayout>
        );
    }

    const {
        strategic = { riskAppetiteConsumption: 0, criticalRisksUnmitigated: 0, riskVelocity: 0, topRiskCategories: [] },
        cyber = { mttr: 0, vulnDensity: 0, openVulns: 0, assetCriticalityCoverage: 0 },
        culture = { policyAckRate: 0, trainingCompletionRate: 0, humanErrorCount: 0 },
        supplyChain = { avgCriticalVendorRisk: 0, criticalVendors: 0, vendorAssessmentCoverage: 0 },
        compliance = { controlEffectiveness: 0, totalControls: 0, implementedControls: 0 },
        resilience = { biaCompletionRate: 0, activeProjects: 0 }
    } = (dashboard as any) || {};

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Executive Metrics</h1>
                        <p className="text-slate-500 mt-2">
                            Comprehensive view of Risk, Security, and Compliance Performance.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                        <Activity className="h-4 w-4 text-green-500" />
                        <span>Live Data</span>
                    </div>
                </div>

                {/* EXECUTIVE SUMMARY ROW */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Risk Appetite"
                        value={`${strategic.riskAppetiteConsumption}%`}
                        icon={BarChart3}
                        color="text-blue-600"
                        subtext="Capacity Used"
                        trend={strategic.riskAppetiteConsumption > 80 ? "Critical Level" : "Healthy"}
                    />
                    <MetricCard
                        title="Critical Exposure"
                        value={strategic.criticalRisksUnmitigated}
                        icon={ShieldAlert}
                        color="text-red-600"
                        subtext="Unmitigated Risks"
                    />
                    <MetricCard
                        title="Control Health"
                        value={`${compliance.controlEffectiveness}%`}
                        icon={CheckCircle}
                        color="text-green-600"
                        subtext="Effectiveness Rate"
                    />
                    <MetricCard
                        title="Vendor Risk"
                        value={supplyChain.avgCriticalVendorRisk}
                        icon={Truck}
                        color="text-orange-600"
                        subtext="Avg Critical Score"
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* COLUMN 1: STRATEGY & RISK */}
                    <div className="space-y-6">
                        <DomainCard title="Strategic Risk" icon={Activity} color="text-blue-600">
                            <div className="space-y-6">
                                <MetricRow label="Risk Velocity (30d)" value={strategic.riskVelocity > 0 ? `+${strategic.riskVelocity}` : strategic.riskVelocity} subtext="Net new risks" />
                                <div className="space-y-2">
                                    <span className="text-sm font-medium text-slate-700">Top Risk Categories</span>
                                    <div className="h-32">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={strategic.topRiskCategories} layout="vertical" margin={{ left: 40, right: 10 }}>
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                                                <RechartsTooltip />
                                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </DomainCard>

                        <DomainCard title="Cyber Resilience" icon={Server} color="text-indigo-600">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <MiniStat label="MTTR" value={`${cyber.mttr}d`} subtext="Avg Remediation" />
                                <MiniStat label="Vuln Density" value={cyber.vulnDensity} subtext="Per Asset" />
                            </div>
                            <div className="space-y-3">
                                <MetricRow label="Open Vulnerabilities" value={cyber.openVulns} />
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Asset Criticality Coverage</span>
                                        <span className="font-medium">{cyber.assetCriticalityCoverage}%</span>
                                    </div>
                                    <Progress value={cyber.assetCriticalityCoverage} className="h-1.5" />
                                </div>
                            </div>
                        </DomainCard>
                    </div>

                    {/* COLUMN 2: PEOPLE & SUPPLY CHAIN */}
                    <div className="space-y-6">
                        <DomainCard title="Culture & Governance" icon={Users} color="text-pink-600">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-100">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-pink-600" />
                                        <span className="text-sm font-medium text-pink-900">Human Error Incidents</span>
                                    </div>
                                    <span className="text-xl font-bold text-pink-700">{culture.humanErrorCount}</span>
                                </div>
                                <div className="space-y-4">
                                    <CircularMetric label="Policy Ack Rate" value={culture.policyAckRate} color="#db2777" />
                                    <CircularMetric label="Training Completion" value={culture.trainingCompletionRate} color="#db2777" />
                                </div>
                            </div>
                        </DomainCard>

                        <DomainCard title="Supply Chain" icon={Truck} color="text-orange-600">
                            <div className="space-y-4">
                                <MetricRow label="Critical Vendors" value={supplyChain.criticalVendors} />
                                <MetricRow label="Avg Risk Score" value={supplyChain.avgCriticalVendorRisk} />
                                <div className="space-y-1 pt-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Assessment Coverage</span>
                                        <span className="font-medium">{supplyChain.vendorAssessmentCoverage}%</span>
                                    </div>
                                    <Progress value={supplyChain.vendorAssessmentCoverage} className="h-1.5 bg-orange-100" indicatorClassName="bg-orange-500" />
                                </div>
                            </div>
                        </DomainCard>
                    </div>

                    {/* COLUMN 3: COMPLIANCE & BCP */}
                    <div className="space-y-6">
                        <DomainCard title="Compliance & Audit" icon={FileCheck} color="text-green-600">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 bg-slate-50 rounded border text-center">
                                        <div className="text-2xl font-bold text-slate-900">{compliance.totalControls}</div>
                                        <div className="text-xs text-slate-500">Total Controls</div>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded border border-green-100 text-center">
                                        <div className="text-2xl font-bold text-green-700">{compliance.implementedControls}</div>
                                        <div className="text-xs text-green-600">Implemented</div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Control Effectiveness</span>
                                        <span className="font-medium">{compliance.controlEffectiveness}%</span>
                                    </div>
                                    <Progress value={compliance.controlEffectiveness} className="h-1.5 bg-green-100" indicatorClassName="bg-green-600" />
                                </div>
                            </div>
                        </DomainCard>

                        <DomainCard title="Business Continuity" icon={Zap} color="text-yellow-600">
                            <div className="space-y-4">
                                <MetricRow label="Active Projects" value={resilience.activeProjects} />
                                <div className="space-y-1 pt-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">BIA Completion Rate</span>
                                        <span className="font-medium">{resilience.biaCompletionRate}%</span>
                                    </div>
                                    <Progress value={resilience.biaCompletionRate} className="h-1.5 bg-yellow-100" indicatorClassName="bg-yellow-600" />
                                </div>
                            </div>
                        </DomainCard>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function MetricCard({ title, value, icon: Icon, color, subtext, trend }: any) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">{title}</p>
                        <div className="flex items-baseline gap-2 mt-2">
                            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                        </div>
                    </div>
                    <div className={`h-12 w-12 rounded-full ${color.replace('text-', 'bg-').replace('600', '100')} flex items-center justify-center ${color}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
                {(subtext || trend) && (
                    <div className="mt-4 flex items-center text-xs">
                        {trend && <span className={`font-medium mr-2 ${trend.includes('Critical') ? 'text-red-600' : 'text-green-600'}`}>{trend}</span>}
                        {subtext && <span className="text-slate-400">{subtext}</span>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function DomainCard({ title, icon: Icon, color, children }: any) {
    return (
        <Card className="h-full">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${color}`} />
                    <CardTitle className="text-base font-semibold text-slate-800">{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                {children}
            </CardContent>
        </Card>
    );
}

function MetricRow({ label, value, subtext }: any) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <span className="text-sm text-slate-600">{label}</span>
                {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
            </div>
            <span className="font-semibold text-slate-900">{value}</span>
        </div>
    );
}

function MiniStat({ label, value, subtext }: any) {
    return (
        <div className="p-3 rounded-lg border bg-slate-50 text-center">
            <div className="text-lg font-bold text-slate-900">{value}</div>
            <div className="text-xs font-medium text-slate-600">{label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{subtext}</div>
        </div>
    );
}

function CircularMetric({ label, value, color }: any) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-slate-600">{label}</span>
                <span className="font-bold text-slate-900">{value}%</span>
            </div>
            <Progress value={value} className="h-2" indicatorClassName={`bg-[${color}]`} style={{ '--progress-background': color } as any} />
        </div>
    );
}
