import { useParams, Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Skeleton } from "@complianceos/ui/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Shield, Settings, CheckSquare, BookOpen, Users, PieChart, Plus, CheckCircle2, Clock, FileText, ArrowRight, Database } from "lucide-react";
import { PostureTrendingWidget } from "@/components/dashboard/PostureTrendingWidget";
import { useMemo, useState, useEffect } from "react";
import { Badge } from "@complianceos/ui/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { ChecklistProgressWidget } from "@/components/readiness/ChecklistProgressWidget";
import { WeeklyFocusWidget } from "@/components/dashboard/WeeklyFocusWidget";
import { SubscriptionOnboardingChecklist } from "@/components/dashboard/SubscriptionOnboardingChecklist";
import { MaturityNavigator } from "@/components/dashboard/MaturityNavigator";
import { DemoImportDialog } from "@/components/admin/DemoImportDialog";

export default function ClientWorkspace() {
  const { id } = useParams<{ id: string }>();
  const clientId = parseInt(id || "0");
  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3>(1);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Fetch Data
  const { data: client, isLoading: clientLoading } = trpc.clients.get.useQuery({ id: clientId }, { enabled: clientId > 0 });
  const { data: controls, isLoading: controlsLoading } = trpc.clientControls.list.useQuery({ clientId }, { enabled: clientId > 0 });
  const { data: policies, isLoading: policiesLoading } = trpc.clientPolicies.list.useQuery({ clientId }, { enabled: clientId > 0 });
  const { data: tasks, isLoading: tasksLoading } = trpc.governance.list.useQuery({
    clientId,
    status: 'pending',
    limit: 10
  }, { enabled: clientId > 0 });
  const { data: onboardingStatus } = trpc.clients.getOnboardingStatus.useQuery({ clientId }, { enabled: clientId > 0 });
  const utils = trpc.useUtils();

  const importDemo = trpc.clients.importDemoData.useMutation({
    onSuccess: () => {
      toast.success("Demo Data Imported Successfully");
      utils.clientControls.list.invalidate();
      utils.clientPolicies.list.invalidate();
      utils.governance.list.invalidate();
      utils.clients.getOnboardingStatus.invalidate();
    },
    onError: (err) => {
      toast.error("Import Failed: " + err.message);
    }
  });

  // Compute Phase 1 Progress (Launch)
  const phase1Progress = useMemo(() => {
    if (!onboardingStatus) return 0;
    const steps = [
      onboardingStatus.hasFrameworks,
      onboardingStatus.hasUsers,
      onboardingStatus.hasControls,
      onboardingStatus.hasPolicies,
      onboardingStatus.hasEvidence
    ];
    const completed = steps.filter(Boolean).length;
    return Math.round((completed / 5) * 100);
  }, [onboardingStatus]);

  // Compute Phase 2 Progress (Optimize)
  const phase2Progress = useMemo(() => {
      if (!controls) return 0;
      const implemented = controls.filter(c => c.status === 'implemented').length;
      return Math.min(100, Math.round((implemented / (controls.length || 1)) * 100));
  }, [controls]);

  // Compute Phase 3 Progress (Scale) - Placeholder
  const phase3Progress = useMemo(() => {
      if (!policies) return 0;
      const approved = policies.filter(p => p.status === 'approved').length;
      return Math.min(100, Math.round((approved / (policies.length || 1)) * 100));
  }, [policies]);

  // Auto-set initial phase
  useEffect(() => {
      if (phase1Progress === 100 && currentPhase === 1) {
          setCurrentPhase(2);
      }
  }, [phase1Progress]);

  // Compute Stats
  const stats = useMemo(() => {
    if (!controls || !policies) return null;

    // Controls
    const totalControls = controls.length;
    const implementedControls = controls.filter(c => c.status === 'implemented').length;
    const controlsProgress = totalControls > 0 ? Math.round((implementedControls / totalControls) * 100) : 0;

    // Policies
    const totalPolicies = policies.length;
    const approvedPolicies = policies.filter(p => p.status === 'approved').length;
    const draftPolicies = policies.filter(p => p.status === 'draft').length;
    const reviewPolicies = policies.filter(p => p.status === 'review').length;

    return {
      totalControls,
      implementedControls,
      controlsProgress,
      totalPolicies,
      approvedPolicies,
      draftPolicies,
      reviewPolicies
    };
  }, [controls, policies]);

  // Sort upcoming tasks
  const upcomingTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks
      .filter((t: any) => t.status !== 'completed' && t.status !== 'entered-in-error' && t.status !== 'unknown')
      .sort((a: any, b: any) => new Date(a.dueDate || '9999-12-31').getTime() - new Date(b.dueDate || '9999-12-31').getTime())
      .slice(0, 5);
  }, [tasks]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Governance Dashboard</h1>
              <div className="text-muted-foreground flex items-center gap-2">
                Overview of
                {clientLoading ? (
                  <Skeleton className="h-5 w-32 inline-block" />
                ) : (
                  <span className="font-medium text-foreground">{client?.name}</span>
                )}
                's compliance posture and activities.
              </div>
            </div>
            {/* Import Demo Data Button - High Visibility */}
            <Button
              size="lg"
              onClick={() => setShowImportDialog(true)}
              disabled={importDemo.isPending}
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md border-0"
            >
              <Database className="h-5 w-5" />
              {importDemo.isPending ? 'Importing Data...' : 'Import Demo Data'}
            </Button>
            
            <DemoImportDialog 
              open={showImportDialog} 
              onOpenChange={setShowImportDialog}
              onImport={async () => {
                await importDemo.mutateAsync({ clientId });
              }}
            />
          </div>
        </div>

        {/* Model-Specific Spotlight Sections */}
        {client?.serviceModel === 'guided' && (
          <div className="grid gap-4 md:grid-cols-1">
            <WeeklyFocusWidget
              weeklyFocus={client.weeklyFocus || "No focus set yet for this week."}
              complianceScore={stats?.controlsProgress || 0}
            />
          </div>
        )}

        {client?.serviceModel === 'subscription' && (
          <div className="grid gap-4 md:grid-cols-1">
            <MaturityNavigator 
                currentPhase={currentPhase} 
                phase1Progress={phase1Progress}
                phase2Progress={phase2Progress}
                phase3Progress={phase3Progress}
                onPhaseClick={setCurrentPhase}
            />

            {currentPhase === 1 && (
                <SubscriptionOnboardingChecklist
                clientId={clientId}
                stats={onboardingStatus || {
                    hasFrameworks: false,
                    hasUsers: false,
                    hasControls: false,
                    hasPolicies: false,
                    hasEvidence: false
                }}
                />
            )}

            {currentPhase === 2 && (
                 <Card className="bg-gradient-to-br from-teal-600 to-teal-700 text-white border-none shadow-lg shadow-teal-900/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Shield className="w-6 h-6 text-teal-200" />
                            Phase 2: Optimize
                        </CardTitle>
                        <CardDescription className="text-teal-100">
                            Focus on identifying risks and closing compliance gaps.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Link href={`/clients/${clientId}/risk/assessments`}>
                                <div className="group flex items-center justify-between p-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all cursor-pointer">
                                    <div className="flex flex-col">
                                        <div className="font-bold text-white group-hover:text-teal-100">Run Risk Assessment</div>
                                        <div className="text-xs text-teal-200/80">Identify threats to your assets</div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-teal-200 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                            <Link href={`/clients/${clientId}/gap-analysis`}>
                                <div className="group flex items-center justify-between p-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all cursor-pointer">
                                    <div className="flex flex-col">
                                        <div className="font-bold text-white group-hover:text-teal-100">Gap Analysis</div>
                                        <div className="text-xs text-teal-200/80">Compare against frameworks</div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-teal-200 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        </div>
                    </CardContent>
                 </Card>
            )}

            {currentPhase === 3 && (
                 <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-none shadow-lg shadow-emerald-900/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Shield className="w-6 h-6 text-emerald-200" />
                            Phase 3: Scale
                        </CardTitle>
                        <CardDescription className="text-emerald-100">
                            Automate assurance and maintain continuous audit readiness.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Link href={`/clients/${clientId}/evidence`}>
                                <div className="group flex items-center justify-between p-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all cursor-pointer">
                                    <div className="flex flex-col">
                                        <div className="font-bold text-white group-hover:text-emerald-100">Automated Evidence</div>
                                        <div className="text-xs text-emerald-200/80">Connect integrations & collectors</div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-emerald-200 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                            <Link href={`/clients/${clientId}/reports`}>
                                <div className="group flex items-center justify-between p-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all cursor-pointer">
                                    <div className="flex flex-col">
                                        <div className="font-bold text-white group-hover:text-emerald-100">Audit Reports</div>
                                        <div className="text-xs text-emerald-200/80">Generate reports for stakeholders</div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-emerald-200 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        </div>
                    </CardContent>
                 </Card>
            )}
          </div>
        )}

        {/* Getting Started Section (Hidden for Managed and Subscription clients) */}
        {(!client?.serviceModel || (client?.serviceModel !== 'managed' && client?.serviceModel !== 'subscription')) && (
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-emerald-400" />
                Getting Started with Governance
              </CardTitle>
              <CardDescription className="text-slate-300 flex justify-between items-center">
                <span>Establish your compliance baseline, implement controls, and automate evidence collection.</span>
                <Link href={`/clients/${clientId}/policies?create=true`}>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm h-8"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create Policy
                  </Button>
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                {[
                  {
                    step: "1. Scope",
                    title: "Select Frameworks",
                    desc: "Choose standards (ISO, SOC2) to apply.",
                    link: `/clients/${clientId}/settings`,
                    icon: Settings,
                    color: "text-blue-400",
                    bg: "bg-blue-900/50"
                  },
                  {
                    step: "2. Define",
                    title: "Assign Controls",
                    desc: "Build your Statement of Applicability.",
                    link: `/clients/${clientId}/controls`,
                    icon: CheckSquare,
                    color: "text-amber-400",
                    bg: "bg-amber-900/50"
                  },
                  {
                    step: "3. Document",
                    title: "Draft Policies",
                    desc: "Create policies using AI templates.",
                    link: `/clients/${clientId}/policies`,
                    icon: BookOpen,
                    color: "text-purple-400",
                    bg: "bg-purple-900/50"
                  },
                  {
                    step: "4. Implement",
                    title: "Assign Tasks",
                    desc: "Delegate tasks to your team.",
                    link: `/clients/${clientId}/tasks`,
                    icon: Users,
                    color: "text-pink-400",
                    bg: "bg-pink-900/50"
                  },
                  {
                    step: "5. Verify",
                    title: "Audit & Report",
                    desc: "Monitor coverage and export reports.",
                    link: `/clients/${clientId}/reports`,
                    icon: PieChart,
                    color: "text-emerald-400",
                    bg: "bg-emerald-900/50"
                  },
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
        )}

        {/* Top Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="p-4 rounded-xl border-none shadow-lg shadow-emerald-200 dark:shadow-none bg-emerald-600 text-white flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-white/80 font-medium">Controls Implemented</p>
              {!stats ? (
                <div className="h-8 w-16 bg-white/20 animate-pulse rounded mt-1" />
              ) : (
                <>
                  <p className="text-2xl font-bold mt-1 text-white">
                    {stats.implementedControls} <span className="text-sm font-normal text-white/70">/ {stats.totalControls}</span>
                  </p>
                  <div className="mt-2 h-2 w-full bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${stats.controlsProgress}%` }}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="p-3 rounded-lg bg-white/20 backdrop-blur-md ml-3">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="p-4 rounded-xl border-none shadow-lg shadow-blue-200 dark:shadow-none bg-blue-600 text-white flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80 font-medium">Policies Approved</p>
              {!stats ? (
                <div className="h-8 w-16 bg-white/20 animate-pulse rounded mt-1" />
              ) : (
                <>
                  <p className="text-2xl font-bold mt-1 text-white">
                    {stats.approvedPolicies} <span className="text-sm font-normal text-white/70">/ {stats.totalPolicies}</span>
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    {stats.draftPolicies} drafts, {stats.reviewPolicies} in review
                  </p>
                </>
              )}
            </div>
            <div className="p-3 rounded-lg bg-white/20 backdrop-blur-md">
              <FileText className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="p-4 rounded-xl border-none shadow-lg shadow-amber-200 dark:shadow-none bg-amber-500 text-white flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80 font-medium">Open Tasks</p>
              {tasksLoading ? (
                <div className="h-8 w-16 bg-white/20 animate-pulse rounded mt-1" />
              ) : (
                <>
                  <p className="text-2xl font-bold mt-1 text-white">{tasks?.filter((t: any) => t.status !== 'completed').length || 0}</p>
                  <p className="text-xs text-white/60 mt-1">Pending actions</p>
                </>
              )}
            </div>
            <div className="p-3 rounded-lg bg-white/20 backdrop-blur-md">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="p-4 rounded-xl border-none shadow-lg shadow-purple-200 dark:shadow-none bg-purple-600 text-white flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80 font-medium">Evidence Collected</p>
              <p className="text-2xl font-bold mt-1 text-white">-</p>
              <p className="text-xs text-white/60 mt-1">Evidence tracking</p>
            </div>
            <div className="p-3 rounded-lg bg-white/20 backdrop-blur-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Readiness Checklist Widget */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-1">
            <ChecklistProgressWidget clientId={clientId} />
          </div>
          <div className="md:col-span-3">
            {/* Placeholder for future widgets or leave empty for layout balance */}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-7">
          {/* Posture Widget */}
          <div className="md:col-span-4">
            <PostureTrendingWidget clientId={clientId} />
          </div>

          {/* Upcoming Tasks Widget */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
              <CardDescription>Actions due soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasksLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))
                ) : upcomingTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                    <p>No pending tasks</p>
                    <Link href={`/clients/${clientId}/tasks`}>
                      <Button variant="link" size="sm">Create Task</Button>
                    </Link>
                  </div>
                ) : (
                  upcomingTasks.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                      <div className="space-y-1">
                        <div className="font-medium line-clamp-1">{task.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="h-5 px-1 text-[10px]">
                            {task.priority || 'Medium'}
                          </Badge>
                          {task.dueDate && (
                            <span className={new Date(task.dueDate) < new Date() ? "text-red-500" : ""}>
                              Due {format(new Date(task.dueDate), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link href={`/clients/${clientId}/tasks`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
                {!tasksLoading && upcomingTasks.length > 0 && (
                  <Link href={`/clients/${clientId}/tasks`}>
                    <Button variant="outline" className="w-full mt-2">View All Tasks</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
