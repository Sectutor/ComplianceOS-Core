
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Loader2, CheckCircle2, Circle, AlertCircle, Ban } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface FrameworkDashboardProps {
    frameworkId: number;
}

const COLORS = {
    implemented: "#22c55e",   // green-500
    in_progress: "#3b82f6",   // blue-500
    not_implemented: "#ef4444", // red-500
    not_applicable: "#94a3b8"  // slate-400
};

export function FrameworkDashboard({ frameworkId }: FrameworkDashboardProps) {
    const { data: stats, isLoading } = trpc.frameworkImports.getDashboardStats.useQuery({ frameworkId });

    if (isLoading) {
        return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    if (!stats) return null;

    const chartData = [
        { name: "Implemented", value: stats.implemented, color: COLORS.implemented },
        { name: "In Progress", value: stats.inProgress, color: COLORS.in_progress },
        { name: "Not Implemented", value: stats.notImplemented, color: COLORS.not_implemented },
        { name: "Not Applicable", value: stats.notApplicable, color: COLORS.not_applicable }
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.score}%</div>
                        <p className="text-xs text-muted-foreground">Based on implemented controls</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Implemented</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.implemented}</div>
                        <p className="text-xs text-muted-foreground">Controls fully active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <Circle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.inProgress}</div>
                        <p className="text-xs text-muted-foreground">Work has started</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gaps</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.notImplemented}</div>
                        <p className="text-xs text-muted-foreground">Require attention</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Visual Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Implementation Status</CardTitle>
                        <CardDescription>Breakdown of controls by current status</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Readiness Assessment / Info */}
                <Card className="col-span-1 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-primary">Readiness Assessment</CardTitle>
                        <CardDescription>AI-generated insights on your readiness</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 bg-green-100 p-2 rounded-full"><CheckCircle2 className="h-4 w-4 text-green-700" /></div>
                                <div>
                                    <h4 className="font-semibold text-sm">Strong Start</h4>
                                    <p className="text-sm text-muted-foreground">You have imported {stats.total} controls. This provides a solid baseline for gap analysis.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 bg-blue-100 p-2 rounded-full"><Circle className="h-4 w-4 text-blue-700" /></div>
                                <div>
                                    <h4 className="font-semibold text-sm">Next Steps</h4>
                                    <p className="text-sm text-muted-foreground">Begin by mapping these controls to your existing policies to automatically update their status.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
