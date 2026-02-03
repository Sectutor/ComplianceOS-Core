
import { useParams } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { CreateWorkItemDialog } from "@/components/governance/CreateWorkItemDialog";
import { StatsOverview } from "@/components/governance/StatsOverview";
import { WorkItemList } from "@/components/governance/WorkItemList";
import { Button } from "@complianceos/ui/ui/button";
import { Sparkles, ListTodo, AlertCircle, Clock, Activity, BookOpen, ArrowRight } from "lucide-react";
import { Badge } from "@complianceos/ui/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

import { formatDistanceToNow } from "date-fns";

export default function GovernanceWorkbench() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id, 10);
    const utils = trpc.useUtils();

    const { data: lastRun } = trpc.autopilot.getLastRun.useQuery({ clientId });
    const { data: stats, isLoading: statsLoading } = trpc.governance.getStats.useQuery({ clientId });

    const runAutopilot = trpc.autopilot.trigger.useMutation({
        onSuccess: (data) => {
            toast.success("Autopilot Analysis Complete", {
                description: `Created ${data.totalCreated} new tasks: ${data.policies} policies, ${data.risks} risks, ${data.controls} controls.`
            });
            utils.governance.list.invalidate();
            utils.governance.getStats.invalidate();
            utils.autopilot.getLastRun.invalidate();
        },
        onError: (err) => {
            toast.error("Autopilot Failed", { description: err.message });
        }
    });

    if (!clientId || isNaN(clientId)) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-muted-foreground">Please select a client to view the workbench.</p>
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Governance Workbench</h1>
                    <p className="text-muted-foreground">
                        Your centralized mission control for compliance operations, tasks, and oversight.
                    </p>
                </div>

                {/* Top Stats Cards - Compliance Dashboard Style */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
                    <div className="p-4 rounded-xl border-none shadow-lg shadow-emerald-200 dark:shadow-none bg-emerald-600 text-white flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white/80 font-medium">Health Score</p>
                            {statsLoading ? (
                                <div className="h-8 w-16 bg-white/20 animate-pulse rounded mt-1" />
                            ) : (
                                <>
                                    <div className="flex items-baseline gap-1">
                                        <p className="text-2xl font-bold mt-1 text-white">{stats?.healthScore ?? 100}</p>
                                        <span className="text-sm text-white/80">/ 100</span>
                                    </div>
                                    <p className="text-xs text-white/60 mt-1">Overall Status</p>
                                </>
                            )}
                        </div>
                        <div className="p-3 rounded-lg bg-white/20 backdrop-blur-md">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border-none shadow-lg shadow-blue-200 dark:shadow-none bg-blue-600 text-white flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white/80 font-medium">Pending Tasks</p>
                            {statsLoading ? (
                                <div className="h-8 w-16 bg-white/20 animate-pulse rounded mt-1" />
                            ) : (
                                <>
                                    <p className="text-2xl font-bold mt-1 text-white">{stats?.pending || 0}</p>
                                    <p className="text-xs text-white/60 mt-1">Tasks requiring attention</p>
                                </>
                            )}
                        </div>
                        <div className="p-3 rounded-lg bg-white/20 backdrop-blur-md">
                            <ListTodo className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border-none shadow-lg shadow-red-200 dark:shadow-none bg-red-600 text-white flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white/80 font-medium">Critical Items</p>
                            {statsLoading ? (
                                <div className="h-8 w-16 bg-white/20 animate-pulse rounded mt-1" />
                            ) : (
                                <>
                                    <p className="text-2xl font-bold mt-1 text-white">{stats?.critical || 0}</p>
                                    <p className="text-xs text-white/60 mt-1">High priority or critical</p>
                                </>
                            )}
                        </div>
                        <div className="p-3 rounded-lg bg-white/20 backdrop-blur-md">
                            <AlertCircle className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border-none shadow-lg shadow-orange-200 dark:shadow-none bg-orange-500 text-white flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white/80 font-medium">Overdue</p>
                            {statsLoading ? (
                                <div className="h-8 w-16 bg-white/20 animate-pulse rounded mt-1" />
                            ) : (
                                <>
                                    <p className="text-2xl font-bold mt-1 text-white">{stats?.overdue || 0}</p>
                                    <p className="text-xs text-white/60 mt-1">Past due date</p>
                                </>
                            )}
                        </div>
                        <div className="p-3 rounded-lg bg-white/20 backdrop-blur-md">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-indigo-200 bg-white shadow-sm flex flex-col justify-between cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group" onClick={() => window.location.href = `/clients/${clientId}/governance`}>
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold text-slate-900">Program Guide</span>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-indigo-100 text-indigo-700 pointer-events-none">NEW</Badge>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-2 font-medium group-hover:text-indigo-600 transition-colors">
                                    <span>View Framework</span>
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                <BookOpen className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {lastRun && (
                            <span className="text-xs text-muted-foreground">
                                Last check: {formatDistanceToNow(new Date(lastRun.createdAt), { addSuffix: true })}
                            </span>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => runAutopilot.mutate({ clientId })}
                            disabled={runAutopilot.isPending}
                            className="gap-2"
                        >
                            <Sparkles className="h-4 w-4 text-indigo-500" />
                            {runAutopilot.isPending ? 'Analyzing...' : 'Run Autopilot'}
                        </Button>
                    </div>
                    <CreateWorkItemDialog clientId={clientId} />
                </div>

                {/* Main Task Feed */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold tracking-tight">Governance Tasks</h2>
                    <WorkItemList clientId={clientId} />
                </section>

            </div>
        </DashboardLayout>
    );
}
