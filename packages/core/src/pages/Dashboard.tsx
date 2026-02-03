import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Progress } from "@complianceos/ui/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Users, Shield, FileText, CheckCircle2, ArrowRight, Plus, FolderOpen,
  TrendingUp, AlertCircle, AlertTriangle, Clock, BarChart3, PieChart, Activity, Target, Settings2, Sparkles, Building2, HardDrive
} from "lucide-react";
import { EmptyState } from "@complianceos/ui/ui/EmptyState";
import { useLocation } from "wouter";
import { Skeleton } from "@complianceos/ui/ui/skeleton";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/Breadcrumb";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { AnimatedMetricCard } from "@complianceos/ui/ui/AnimatedMetricCard";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

const COLORS = {
  implemented: "#22c55e",
  inProgress: "#3b82f6",
  notStarted: "#94a3b8",
  notApplicable: "#6b7280",
  approved: "#22c55e",
  review: "#f59e0b",
  draft: "#3b82f6",
  archived: "#6b7280",
  verified: "#22c55e",
  collected: "#3b82f6",
  pending: "#f59e0b",
  expired: "#ef4444",
};

const FRAMEWORK_COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d",
  "#a05195", "#d45087", "#f95d6a", "#ff7c43", "#ffa600"
];

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [framework, setFramework] = useState<string | undefined>();
  const { data: enhancedStats, isLoading: statsLoading } = trpc.dashboard.enhanced.useQuery({ framework }, {
    enabled: !!user
  });
  const { data: clients } = trpc.clients.list.useQuery(undefined, {
    enabled: !!user
  });
  const { data: complianceScores, isLoading: scoresLoading } = trpc.dashboard.complianceScores.useQuery(undefined, {
    enabled: !!user
  });
  const { data: overdueAssessments, isLoading: overdueLoading } = trpc.vendorAnalytics.getOverdueAssessments.useQuery(undefined, {
    enabled: !!user
  });
  const { data: insightsData } = trpc.dashboard.getInsights.useQuery(undefined, {
    enabled: !!user
  });
  const insights = Array.isArray(insightsData) ? insightsData : [];

  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{ id: number; name: string; currentTarget: number } | null>(null);
  const [newTargetScore, setNewTargetScore] = useState(80);

  const utils = trpc.useUtils();
  const setTargetMutation = trpc.clients.setTargetScore.useMutation({
    onSuccess: () => {
      toast.success(`Target score updated for ${selectedClient?.name}`);
      utils.dashboard.complianceScores.invalidate();
      setTargetDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update target: ${error.message}`);
    },
  });

  const sampleMutation = trpc.clients.createSampleData.useMutation({
    onSuccess: (client) => {
      toast.success("Magic Sample Data workspace created!");
      utils.clients.list.invalidate();
      utils.dashboard.enhanced.invalidate();
      setLocation(`/clients/${client.id}`);
    },
    onError: (error) => {
      toast.error(`Sample data creation failed: ${error.message}`);
    }
  });

  const handleSetTarget = (clientId: number, clientName: string, currentTarget: number) => {
    setSelectedClient({ id: clientId, name: clientName, currentTarget });
    setNewTargetScore(currentTarget);
    setTargetDialogOpen(true);
  };

  const handleSaveTarget = () => {
    if (selectedClient) {
      setTargetMutation.mutate({ clientId: selectedClient.id, targetScore: newTargetScore });
    }
  };

  // Prepare chart data with null safety
  const status = enhancedStats?.controlsByStatus || { implemented: 0, inProgress: 0, notStarted: 0, notApplicable: 0 };
  const pStatus = enhancedStats?.policiesByStatus || { approved: 0, review: 0, draft: 0, archived: 0 };
  const eStatus = enhancedStats?.evidenceByStatus || { verified: 0, collected: 0, pending: 0, expired: 0, notApplicable: 0 };
  const frameworkByName = enhancedStats?.controlsByFramework || {};
  const overview = enhancedStats?.overview || {
    totalClients: 0,
    totalControls: 0,
    totalPolicies: 0,
    totalEvidence: 0,
    totalLLMProviders: 0,
    controlsImplemented: 0,
    controlsInProgress: 0,
    controlsNotStarted: 0,
    totalRisks: 0,
    highRisks: 0
  };
  const clientsOverview = enhancedStats?.clientsOverview || [];
  const recentActivity = enhancedStats?.recentActivity || [];

  const controlStatusData = [
    { name: "Implemented", value: Number(status.implemented), color: COLORS.implemented },
    { name: "In Progress", value: Number(status.inProgress), color: COLORS.inProgress },
    { name: "Not Started", value: Number(status.notStarted), color: COLORS.notStarted },
    { name: "N/A", value: Number(status.notApplicable), color: COLORS.notApplicable },
  ].filter(d => d.value > 0);

  const policyStatusData = [
    { name: "Approved", value: Number(pStatus.approved), color: COLORS.approved },
    { name: "In Review", value: Number(pStatus.review), color: COLORS.review },
    { name: "Draft", value: Number(pStatus.draft), color: COLORS.draft },
    { name: "Archived", value: Number(pStatus.archived), color: COLORS.archived },
  ].filter(d => d.value > 0);

  const evidenceStatusData = [
    { name: "Verified", value: Number(eStatus.verified), color: COLORS.verified },
    { name: "Collected", value: Number(eStatus.collected), color: COLORS.collected },
    { name: "Pending", value: Number(eStatus.pending), color: COLORS.pending },
    { name: "Expired", value: Number(eStatus.expired), color: COLORS.expired },
    { name: "N/A", value: Number(eStatus.notApplicable), color: COLORS.notApplicable },
  ].filter(d => d.value > 0);

  const frameworkData = Object.entries(frameworkByName).map(([name, count]) => ({
    name,
    count: count as number
  }));

  // Calculate overall compliance rate
  const totalControlsAssigned = (status.implemented || 0) +
    (status.inProgress || 0) +
    (status.notStarted || 0);
  const overallComplianceRate = totalControlsAssigned > 0 ?
    Math.round(((status.implemented || 0) / totalControlsAssigned) * 100) : 0;

  if (!statsLoading && clients && clients.length === 0) {
    return (
      <DashboardLayout>
        <OnboardingWizard />
        <div className="max-w-4xl mx-auto space-y-8 mt-12 px-4">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-2">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Set up your Compliance OS</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Follow our guided path to get audit-ready in record time. Complete these steps to activate your live compliance reports.
            </p>
          </div>

          <OnboardingChecklist stats={enhancedStats} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            <Card className="bg-white/50 border-none shadow-sm h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Auto-Policies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">Get 20+ policies tailored to your industry instantly using our AI policy engine.</p>
              </CardContent>
            </Card>
            <Card className="bg-white/50 border-none shadow-sm h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-500" />
                  Unified Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">Map one master control to multiple frameworks like ISO 27001 and SOC 2 seamlessly.</p>
              </CardContent>
            </Card>
            <Card className="bg-white/50 border-none shadow-sm h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  Live Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">Connect your cloud stack to automate evidence collection and get real-time readiness scores.</p>
              </CardContent>
            </Card>
          </div>

          <div className="pt-8 flex flex-col items-center gap-4">
            <Button
              variant="default"
              className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 font-bold shadow-lg shadow-indigo-200 animate-pulse"
              onClick={() => sampleMutation.mutate({ name: "DEMO Organization", industry: "Technology" })}
              disabled={sampleMutation.isPending}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {sampleMutation.isPending ? "Generating Magic..." : "Explore with Demo Data"}
            </Button>

            <Button variant="ghost" className="text-muted-foreground hover:text-primary" onClick={() => setLocation('/learning')}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Not ready yet? Explore the Learning Zone
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (

    <DashboardLayout>
      <OnboardingWizard />
      <div className="space-y-8 page-transition">
        <Breadcrumb
          items={[
            { label: "Dashboard" },
          ]}
        />

        {/* Welcome Section */}
        <div className="flex items-start justify-between gap-8 animate-slide-down">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of compliance status across all clients
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 bg-background border rounded-md px-3 py-1 text-sm shadow-sm transition-all hover:border-primary/50">
              <span className="text-muted-foreground font-medium">Standard:</span>
              <select
                className="bg-transparent border-none focus:ring-0 cursor-pointer pr-8 font-semibold text-primary"
                value={framework || ""}
                onChange={(e) => setFramework(e.target.value || undefined)}
              >
                <option value="">All Standards</option>
                <option value="ISO 27001">ISO 27001</option>
                <option value="SOC 2">SOC 2</option>
              </select>
            </div>
            {user?.role === 'admin' && (
              <Button onClick={() => setLocation('/clients')}>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            )}
          </div>
        </div>

        {/* Onboarding Banner (Short version for active dashboard) */}
        {!statsLoading && enhancedStats && (overview.totalPolicies === 0 || overview.totalEvidence === 0 || (user?.role === 'admin' && (overview.totalLLMProviders === 0))) && (
          <OnboardingChecklist stats={enhancedStats} role={user?.role} />
        )}

        {/* AI Insights Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="lg:col-span-4 border-none bg-gradient-to-r from-blue-600/5 to-purple-600/5 backdrop-blur-sm border border-blue-100/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-600/10">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">AI-Powered Insights</CardTitle>
                    <CardDescription>Actionable recommendations to improve your compliance posture</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  Generate New Insights
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {insights.map((insight: any) => (
                  <div key={insight.id} className="flex flex-col gap-3 p-4 rounded-xl border bg-white/50 backdrop-blur-md hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between">
                      <div className={`p-1.5 rounded-md ${insight.type === 'critical' ? 'bg-red-100 text-red-600' :
                        insight.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                          insight.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-blue-100 text-blue-600'
                        }`}>
                        {insight.type === 'critical' ? <AlertCircle className="h-4 w-4" /> :
                          insight.type === 'warning' ? <Clock className="h-4 w-4" /> :
                            insight.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> :
                              <Sparkles className="h-4 w-4" />}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${insight.type === 'critical' ? 'bg-red-50 text-red-700' :
                        insight.type === 'warning' ? 'bg-amber-50 text-amber-700' :
                          insight.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
                            'bg-blue-50 text-blue-700'
                        }`}>
                        {insight.type}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 mb-1">{insight.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{insight.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full mt-1 h-8 text-xs border border-slate-100 hover:bg-slate-50 transition-colors justify-between group-hover:border-blue-200" onClick={() => setLocation(insight.link)}>
                      {insight.action}
                      <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics - Enhanced with Animations */}
        <div className="dashboard-grid grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="hover-lift shadow-premium border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <h3 className="text-3xl font-bold mt-2 metric-value">
                      {overview?.totalClients || 0}
                    </h3>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Active workspaces</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift shadow-premium border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Master Controls</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <h3 className="text-3xl font-bold mt-2 metric-value">
                      {overview?.totalControls || 0}
                    </h3>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {frameworkByName["ISO 27001"] || 0} ISO · {frameworkByName["SOC 2"] || 0} SOC 2
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <Shield className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift shadow-premium border-l-4 border-l-amber-500">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Client Policies</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <h3 className="text-3xl font-bold mt-2 metric-value">
                      {overview?.totalPolicies || 0}
                    </h3>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {pStatus?.approved || 0} approved
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift shadow-premium border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Flagged Risks</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <h3 className="text-3xl font-bold mt-2 metric-value">
                      {overview?.highRisks || 0}
                    </h3>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">High & Critical severity</p>
                </div>
                <div className="p-3 rounded-lg bg-red-100 text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift shadow-premium border-l-4 border-l-emerald-500">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Overall Compliance</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <h3 className="text-3xl font-bold mt-2 metric-value">
                      {overallComplianceRate}%
                    </h3>
                  )}
                  <div className="mt-2">
                    <Progress
                      value={overallComplianceRate}
                      className="h-2"
                      indicatorClassName={
                        overallComplianceRate >= 100 ? "progress-success" :
                          overallComplianceRate >= 80 ? "progress-brand" :
                            overallComplianceRate >= 50 ? "progress-teal" :
                              overallComplianceRate >= 25 ? "progress-warning" :
                                "progress-error"
                      }
                    />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Trend Chart */}
        <Card className="col-span-full border-none shadow-lg shadow-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Compliance Performance Trend
            </CardTitle>
            <CardDescription>Overall compliance improvement over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {scoresLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : complianceScores && complianceScores.length > 0 ? (
              <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={complianceScores || []}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      unit="%"
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Compliance Score"
                      stroke="#3b82f6"
                      strokeWidth={4}
                      dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Line
                      type="stepAfter"
                      dataKey="target"
                      name="Target Goal"
                      stroke="#cbd5e1"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-xl mt-4 bg-slate-50/50">
                <EmptyState
                  icon={Activity}
                  title="No Trend Data"
                  description="Complete your first assessments to start seeing compliance trends."
                  className="border-none bg-transparent"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Control Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Control Status
              </CardTitle>
              <CardDescription>Implementation status across all clients</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : controlStatusData.length > 0 ? (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={controlStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        onClick={(data) => {
                          const statusMap: Record<string, string> = {
                            "Implemented": "implemented",
                            "In Progress": "in_progress",
                            "Not Started": "not_implemented",
                            "N/A": "not_applicable"
                          };
                          const status = statusMap[data.name];
                          if (status) setLocation(`/client-controls?status=${status}`);
                        }}
                        cursor="pointer"
                      >
                        {controlStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon={Shield}
                  title="No Controls Found"
                  description="Start by adding your first compliance control to track progress."
                  action={{
                    label: "Add Control",
                    onClick: () => setLocation("/client-controls")
                  }}
                  className="h-48"
                />
              )}
            </CardContent>
          </Card>

          {/* Policy Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Policy Status
              </CardTitle>
              <CardDescription>Policy approval status</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : policyStatusData.length > 0 ? (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={policyStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        onClick={(data) => {
                          const statusMap: Record<string, string> = {
                            "Approved": "approved",
                            "In Review": "review",
                            "Draft": "draft",
                            "Archived": "archived"
                          };
                          const status = statusMap[data.name];
                          if (status) setLocation(`/client-policies?status=${status}`);
                        }}
                        cursor="pointer"
                      >
                        {policyStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No Policies Found"
                  description="Generate or upload policies to manage your compliance framework."
                  action={{
                    label: "Add Policy",
                    onClick: () => setLocation("/client-policies")
                  }}
                  className="h-48"
                />
              )}
            </CardContent>
          </Card>

          {/* Evidence Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Evidence Status
              </CardTitle>
              <CardDescription>Evidence verification status</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : evidenceStatusData.length > 0 ? (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={evidenceStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        onClick={(data) => {
                          const statusMap: Record<string, string> = {
                            "Verified": "verified",
                            "Collected": "collected",
                            "Pending": "pending",
                            "Expired": "expired",
                            "N/A": "not_applicable"
                          };
                          const status = statusMap[data.name];
                          if (status) setLocation(`/evidence?status=${status}`);
                        }}
                        cursor="pointer"
                      >
                        {evidenceStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon={CheckCircle2}
                  title="No Evidence Found"
                  description="Upload evidence files to demonstrate control implementation."
                  action={{
                    label: "Add Evidence",
                    onClick: () => setLocation("/evidence")
                  }}
                  className="h-48"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Framework Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Controls by Framework
            </CardTitle>
            <CardDescription>Distribution of controls in the master library</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={frameworkData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {frameworkData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={FRAMEWORK_COLORS[index % FRAMEWORK_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>



        {/* Client Overview, Overdue Assessments, and Recent Activity */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Overdue Vendor Assessments - High Priority */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Overdue Assessments
                {overdueAssessments && overdueAssessments.length > 0 && (
                  <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{overdueAssessments.length}</span>
                )}
              </CardTitle>
              <CardDescription>Pending vendor assessments past due</CardDescription>
            </CardHeader>
            <CardContent>
              {overdueLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : overdueAssessments && overdueAssessments.length > 0 ? (
                <div className="space-y-3">
                  {overdueAssessments.slice(0, 5).map((assessment) => (
                    <div key={assessment.id} className="flex items-center justify-between p-3 rounded-lg border bg-white shadow-sm">
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="font-medium truncate text-sm">{assessment.vendorName}</p>
                        <p className="text-xs text-muted-foreground truncate">{assessment.assessmentType}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : 'Overdue'}
                        </span>
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setLocation(`/clients/${assessment.clientId}/vendors/${assessment.vendorId}?tab=assessments`)}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                  {overdueAssessments.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      + {overdueAssessments.length - 5} more overdue
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500 opacity-50" />
                  <p className="text-sm">All assessments on track</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Client Compliance Overview */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Client Compliance Overview
              </CardTitle>
              <CardDescription>Compliance progress by client</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : clientsOverview.length > 0 ? (
                <div className="space-y-4">
                  {clientsOverview.slice(0, 5).map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => setLocation(`/clients/${client.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">{client.name}</p>
                          <span className="text-sm font-semibold text-primary">
                            {client.compliancePercentage}%
                          </span>
                        </div>
                        <Progress
                          value={client.compliancePercentage}
                          className="h-2"
                          indicatorClassName={
                            client.compliancePercentage >= 100 ? "progress-success" :
                              client.compliancePercentage >= 80 ? "progress-brand" :
                                client.compliancePercentage >= 50 ? "progress-teal" :
                                  client.compliancePercentage >= 25 ? "progress-warning" :
                                    "progress-error"
                          }
                        />
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{client.controlsCount} controls</span>
                          <span>{client.policiesCount} policies</span>
                          <span>{client.evidenceCount} evidence</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                          title="View Strategic Roadmap"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/clients/${client.id}/readiness/roadmap`);
                          }}
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                  {(clientsOverview.length > 5 || (clients && clients.length > 5)) && (
                    <Button variant="ghost" className="w-full" onClick={() => setLocation('/clients')}>
                      View all clients
                    </Button>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={Building2}
                  title="No Organizations Yet"
                  description="Create your first organization workspace to start managing compliance."
                  action={user?.role === 'admin' ? {
                    label: "Create Organization",
                    onClick: () => setLocation("/clients")
                  } : undefined}
                  className="py-12"
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates across all clients</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className={`p-2 rounded-full ${activity.type === 'control' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'policy' ? 'bg-green-100 text-green-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                        {activity.type === 'control' ? <Shield className="h-3 w-3" /> :
                          activity.type === 'policy' ? <FileText className="h-3 w-3" /> :
                            <CheckCircle2 className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} updated
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(activity.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Activity}
                  title="No Recent Activity"
                  description="Latest updates will appear here once you start managing your workspace."
                  className="py-12 border-none bg-transparent"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to manage compliance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              {user?.role === 'admin' && (
                <>
                  <Button variant="outline" className="justify-start h-auto py-4" onClick={() => setLocation('/clients')}>
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span className="font-medium">Add Client</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Create new workspace</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-4" onClick={() => setLocation('/controls')}>
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">Control Library</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Manage master controls</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-4" onClick={() => setLocation('/policy-templates')}>
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">Policy Templates</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Create templates</span>
                    </div>
                  </Button>
                </>
              )}
              <Button variant="outline" className="justify-start h-auto py-4" onClick={() => setLocation('/evidence')}>
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Evidence Tracking</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Track compliance evidence</span>
                </div>
              </Button>
              {/* Strategic Roadmap Quick Link */}
              <Button variant="outline" className="justify-start h-auto py-4" onClick={() => setLocation('/clients')}>
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium">Strategic Planning</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Manage client roadmaps</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Target Score Dialog */}
      <EnhancedDialog
        open={targetDialogOpen}
        onOpenChange={setTargetDialogOpen}
        title="Set Target Compliance Score"
        description={`Set a target compliance percentage for ${selectedClient?.name}`}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setTargetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTarget} disabled={setTargetMutation.isPending}>
              {setTargetMutation.isPending ? "Saving..." : "Save Target"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="targetScore">Target Score (%)</Label>
            <Input
              id="targetScore"
              type="number"
              min={0}
              max={100}
              value={newTargetScore}
              onChange={(e) => setNewTargetScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
            />
            <p className="text-sm text-muted-foreground">
              Current score: {selectedClient?.currentTarget}%
            </p>
          </div>
          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="flex gap-2">
              {[50, 70, 80, 90, 100].map((score) => (
                <Button
                  key={score}
                  variant={newTargetScore === score ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewTargetScore(score)}
                >
                  {score}%
                </Button>
              ))}
            </div>
          </div>
        </div>
      </EnhancedDialog>
    </DashboardLayout>
  );
}
