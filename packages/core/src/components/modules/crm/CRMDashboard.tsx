import React from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Button } from '@complianceos/ui/ui/button';
import { ShieldCheck, ArrowRight, CheckCircle2, TrendingUp, AlertTriangle, AlertCircle, Calendar, Factory, Target, Activity, Users } from 'lucide-react';
import { Skeleton } from '@complianceos/ui/ui/skeleton';


interface CRMDashboardProps {
    clientId: number;
    onNavigate: (tab: string) => void;
}

export function CRMDashboard({ clientId, onNavigate }: CRMDashboardProps) {
    const { data: stats, isLoading } = trpc.crm.getStats.useQuery({ clientId });
    const { data: activities } = trpc.crm.getActivities.useQuery({ clientId });
    const { data: tasks } = trpc.crm.getTasks.useQuery({ clientId });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-96 md:col-span-2 rounded-xl" />
                    <Skeleton className="h-96 rounded-xl" />
                </div>
            </div>
        );
    }

    const metrics = [
        {
            label: 'Compliance Score',
            value: `${stats?.complianceScore || 0}%`,
            icon: ShieldCheck,
            color: 'text-green-600',
            bg: 'bg-green-100 dark:bg-green-900/30'
        },
        {
            label: 'Active Projects',
            value: stats?.openProjectsCount || 0,
            icon: Factory,
            color: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-900/30'
        },
        {
            label: 'Risks Mitigated',
            value: stats?.risksMitigatedCount || 0,
            icon: Target,
            color: 'text-purple-600',
            bg: 'bg-purple-100 dark:bg-purple-900/30'
        },
        {
            label: 'Recent Activities',
            value: stats?.recentActivitiesCount || 0,
            icon: Activity,
            color: 'text-amber-600',
            bg: 'bg-amber-100 dark:bg-amber-900/30'
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric, i) => (
                    <Card key={i} className="border shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium mb-1">{metric.label}</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{metric.value}</h3>
                                </div>
                                <div className={`p-2 rounded-lg ${metric.bg}`}>
                                    <metric.icon className={`w-5 h-5 ${metric.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Call to Actions / Next Steps */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-md bg-gradient-to-r from-slate-900 to-slate-800 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <TrendingUp className="w-48 h-48" />
                        </div>
                        <CardContent className="p-8 relative z-10">
                            <h3 className="text-2xl font-bold mb-2">Compliance Strategy</h3>
                            <p className="text-slate-300 mb-6 max-w-lg">
                                You have {stats?.openProjectsCount} active compliance projects.
                                Review your latest activities and ensure all controls are mitigated.
                            </p>
                            <Button onClick={() => onNavigate('pipeline')} className="bg-white text-slate-900 hover:bg-slate-100 border-none font-semibold">
                                View Projects
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-muted/30 border-dashed">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-gray-400" /> Audit Readiness
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-48 flex items-center justify-center text-muted-foreground text-xs">
                                Feature coming soon
                            </CardContent>
                        </Card>

                        <Card className="bg-muted/30 border-dashed">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-gray-400" /> Velocity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-48 flex items-center justify-center text-muted-foreground text-xs">
                                Feature coming soon
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column: Quick Links & Summary */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            <Button variant="outline" className="justify-start" onClick={() => onNavigate('pipeline')}>
                                <ShieldCheck className="w-4 h-4 mr-2" /> Start New Project
                            </Button>
                            <Button variant="outline" className="justify-start" onClick={() => onNavigate('contacts')}>
                                <Users className="w-4 h-4 mr-2" /> Add Stakeholder
                            </Button>
                            <Button variant="outline" className="justify-start" onClick={() => onNavigate('activities')}>
                                <Activity className="w-4 h-4 mr-2" /> Log Activity
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20">
                        <CardContent className="p-6">
                            <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Pro Tip</h4>
                            <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                Regular gap analysis updates can reduce audit time by 30%.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
