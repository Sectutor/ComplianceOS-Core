import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
    AlertTriangle,
    ChevronRight,
    FileText,
    Download,
    Zap,
    ShieldAlert,
    BarChart3,
    Clock,
    ArrowUpRight
} from "lucide-react";
import { Progress } from "@complianceos/ui/ui/progress";
import { toast } from "sonner";

export default function NonComplianceReport() {
    const params = useParams();
    const clientId = Number(params.id);

    const { data: metrics, isLoading } = trpc.federal.getNonCompliantMetrics.useQuery({ clientId });
    const exportMutation = trpc.federal.exportNist80053Package.useMutation({
        onSuccess: (data) => {
            const link = document.createElement('a');
            link.href = `data:text/csv;base64,${data.base64}`;
            link.download = data.filename;
            link.click();
            toast.success("Federal Package Exported Successfully");
        },
        onError: (err) => {
            toast.error("Export failed: " + err.message);
        }
    });

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="p-8 space-y-4 animate-pulse">
                    <div className="h-10 w-64 bg-slate-200 rounded-lg"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="h-40 bg-slate-100 rounded-2xl"></div>
                        <div className="h-40 bg-slate-100 rounded-2xl"></div>
                        <div className="h-40 bg-slate-100 rounded-2xl"></div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const summary = metrics?.summary || { nonCompliant: 0, partial: 0, compliant: 0, totalAssessments: 0 };
    const recentWeaknesses = (metrics as any)?.recentWeaknesses || [];

    const handleExport = () => {
        toast.promise(exportMutation.mutateAsync({ clientId }), {
            loading: "Generating Federal Compliance Package...",
            success: "Package Ready",
            error: "Failed to generate package"
        });
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8 max-w-7xl mx-auto">
                <Breadcrumb items={[
                    { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                    { label: "Federal Compliance", href: `/clients/${clientId}/federal` },
                    { label: "Non-Compliance & Gap Report" }
                ]} />

                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <ShieldAlert className="h-10 w-10 text-rose-500" />
                            Non-Compliance Gap Report
                        </h1>
                        <p className="text-slate-500 text-lg">Detailed analysis of identified implementation gaps and weaknesses.</p>
                    </div>
                    <Button
                        onClick={handleExport}
                        disabled={exportMutation.isLoading}
                        variant="outline"
                        className="h-12 border-slate-200 rounded-xl font-bold gap-2"
                    >
                        <Download className="h-4 w-4" />
                        {exportMutation.isLoading ? "Exporting..." : "Export Full Report"}
                    </Button>
                </div>

                {/* KPI Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Link href={`/clients/${clientId}/federal/assessment?status=Non-Compliant`}>
                        <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-rose-50 overflow-hidden group cursor-pointer hover:ring-2 hover:ring-rose-500/20 transition-all">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-rose-600 font-bold text-sm uppercase tracking-wider mb-1">Non-Compliant</p>
                                        <h2 className="text-4xl font-black text-rose-700">{summary.nonCompliant}</h2>
                                        <p className="text-rose-600/70 text-xs mt-2 font-medium">Critical implementation failures</p>
                                    </div>
                                    <div className="bg-rose-100 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                                        <AlertTriangle className="h-6 w-6 text-rose-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href={`/clients/${clientId}/federal/assessment?status=Partial`}>
                        <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-amber-50 overflow-hidden group cursor-pointer hover:ring-2 hover:ring-amber-500/20 transition-all">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-amber-600 font-bold text-sm uppercase tracking-wider mb-1">Partially Compliant</p>
                                        <h2 className="text-4xl font-black text-amber-700">{summary.partial}</h2>
                                        <p className="text-amber-600/70 text-xs mt-2 font-medium">Incomplete implementations</p>
                                    </div>
                                    <div className="bg-amber-100 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                                        <Zap className="h-6 w-6 text-amber-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-emerald-50 overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-emerald-600 font-bold text-sm uppercase tracking-wider mb-1">Compliant</p>
                                    <h2 className="text-4xl font-black text-emerald-700">{summary.compliant}</h2>
                                    <p className="text-emerald-600/70 text-xs mt-2 font-medium">Verified implementations</p>
                                </div>
                                <div className="bg-emerald-100 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                                    <BarChart3 className="h-6 w-6 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-slate-900 overflow-hidden text-white group">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">Gap Coverage</p>
                                    <h2 className="text-4xl font-black">{summary.totalAssessments > 0 ? Math.round((summary.compliant / summary.totalAssessments) * 100) : 0}%</h2>
                                    <p className="text-slate-500 text-xs mt-2 font-medium">Overall health score</p>
                                </div>
                                <div className="bg-slate-800 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                                    <ArrowUpRight className="h-6 w-6 text-slate-300" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Family Breakdown */}
                    <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                                Gap Concentration by Family
                            </CardTitle>
                            <CardDescription>Identifying which control families require the most remediation attention.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {metrics?.familySummary.length === 0 && (
                                    <div className="p-12 text-center">
                                        <p className="text-slate-400 font-medium">No gaps identified yet.</p>
                                    </div>
                                )}
                                {metrics?.familySummary.map((f: any) => (
                                    <Link key={f.family} href={`/clients/${clientId}/federal/assessment?family=${f.family}`}>
                                        <div className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer group">
                                            <div className="space-y-1 flex-1">
                                                <div className="flex justify-between mb-2">
                                                    <span className="font-black text-slate-700 group-hover:text-blue-600 transition-colors">{f.family}</span>
                                                    <span className="text-xs font-bold text-rose-600">
                                                        {f.nonCompliant} Non-Compliant • {f.partial} Partial
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={(f.nonCompliant / (f.total || 1)) * 100}
                                                    className="h-2 bg-slate-100"
                                                    indicatorClassName="bg-rose-500"
                                                />
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-slate-300 ml-6 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Hub */}
                    <div className="space-y-6">
                        <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-gradient-to-br from-indigo-600 to-blue-700 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Zap className="h-32 w-32" />
                            </div>
                            <CardContent className="p-8 relative z-10">
                                <h3 className="text-2xl font-black mb-2">Remediation Automation</h3>
                                <p className="text-indigo-100 mb-6 font-medium">Automatically convert identified gaps into Plan of Action & Milestones (POA&M) entries or internal tasks.</p>
                                <div className="flex flex-wrap gap-4">
                                    <Link href={`/clients/${clientId}/federal/poam`}>
                                        <Button className="bg-white text-indigo-700 hover:bg-slate-50 font-bold rounded-xl shadow-lg">
                                            Open POA&M Tracker
                                        </Button>
                                    </Link>
                                    <Link href={`/clients/${clientId}/tasks`}>
                                        <Button variant="ghost" className="text-white hover:bg-white/10 font-bold rounded-xl border border-white/20">
                                            Sync with Tasks
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 border border-slate-100">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-amber-500" />
                                    Recent Weaknesses
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {recentWeaknesses.length === 0 && (
                                    <p className="text-slate-400 text-sm text-center py-8 font-medium">No recent weaknesses detected.</p>
                                )}
                                {recentWeaknesses.map((weakness: any) => (
                                    <Link key={weakness.id} href={`/clients/${clientId}/federal/assessment?search=${weakness.controlId}`}>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                                            <div className="flex justify-between items-start">
                                                <Badge className={`${weakness.complianceStatus === 'Non-Compliant' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'} border-none font-bold group-hover:scale-105 transition-transform`}>
                                                    {weakness.controlId}
                                                </Badge>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    {new Date(weakness.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Implementation Gap Detected</p>
                                            <p className="text-xs text-slate-500 line-clamp-2">
                                                {weakness.comment || "No detailed implementation notes provided. Weakness requires technical verification."}
                                            </p>
                                        </div>
                                    </Link>
                                ))}

                                <Link href={`/clients/${clientId}/federal/assessment`}>
                                    <Button variant="ghost" className="w-full text-slate-500 font-bold rounded-xl h-10 group">
                                        View All Assessment Gaps
                                        <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
