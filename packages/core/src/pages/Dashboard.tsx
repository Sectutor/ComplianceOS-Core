import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Progress } from "@complianceos/ui/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Users, Shield, FileText, CheckCircle2, ArrowRight, Plus, FolderOpen,
  TrendingUp, AlertCircle, AlertTriangle, Clock, BarChart3, PieChart, Activity, Target, Settings2, Sparkles, Building2, HardDrive,
  BrainCircuit, ChevronDown
} from "lucide-react";
import { EmptyState } from "@complianceos/ui/ui/EmptyState";
import { useLocation } from "wouter";
import { Badge } from "@complianceos/ui/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgress } from "@complianceos/ui/ui/circular-progress";
import { Skeleton } from "@complianceos/ui/ui/skeleton";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageGuide } from "@/components/PageGuide";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { AnimatedMetricCard } from "@complianceos/ui/ui/AnimatedMetricCard";
import { useClientContext } from "@/contexts/ClientContext";
import { resolveNavigationPath } from "@/lib/navigation";

// Helper to determine compliance status based on rate - Plain Language Version
function getComplianceStatus(rate: number) {
  if (rate >= 80) {
    return {
      label: 'COMPLIANT',
      pingColor: 'bg-emerald-400',
      dotColor: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      description: 'Your compliance posture is strong'
    };
  }
  if (rate >= 50) {
    return {
      label: 'NEEDS ATTENTION',
      pingColor: 'bg-amber-400',
      dotColor: 'bg-amber-500',
      textColor: 'text-amber-600',
      description: 'Some controls require immediate action'
    };
  }
  return {
    label: 'CRITICAL',
    pingColor: 'bg-rose-400',
    dotColor: 'bg-rose-500',
    textColor: 'text-rose-600',
    description: 'Urgent compliance gaps need fixing'
  };
}

// Legacy function for backward compatibility
function getComplianceStatusLegacy(rate: number) {
  if (rate >= 80) {
    return { label: 'SYSTEM OPTIMAL', pingColor: 'bg-emerald-400', dotColor: 'bg-emerald-500', textColor: 'text-emerald-500' };
  }
  if (rate >= 50) {
    return { label: 'SYSTEM ACCEPTABLE', pingColor: 'bg-amber-400', dotColor: 'bg-amber-500', textColor: 'text-amber-500' };
  }
  return { label: 'CRITICAL POSTURE', pingColor: 'bg-rose-400', dotColor: 'bg-rose-500', textColor: 'text-rose-500' };
}

// Status indicator component with clear, readable logic
function StatusIndicator({ rate }: { rate: number }) {
  const status = getComplianceStatus(rate);

  return (
    <>
      <span className="flex h-2 w-2 relative">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.pingColor}`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${status.dotColor}`}></span>
      </span>
      <span className={`text-xs font-bold tracking-wider ${status.textColor}`}>
        {status.label}
      </span>
      <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
        {status.description}
      </span>
    </>
  );
}
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
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"
];

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [framework, setFramework] = useState<string | undefined>();
  const [clientId, setClientId] = useState<string | undefined>();
  const [hasSeenOnboardingThisSession, setHasSeenOnboardingThisSession] = useState(false);
  const [viewMode, setViewMode] = useState<'executive' | 'full'>('executive');
  const utils = trpc.useUtils();
  const { selectedClientId } = useClientContext();
  const effectiveClientId = clientId || (selectedClientId ? String(selectedClientId) : undefined);

  // Check for onboarding completion parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('onboarding') === 'complete') {
      // Force refresh data when returning from onboarding
      utils.clients.list.invalidate();
      utils.dashboard.enhanced.invalidate();
      // Clean up URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('onboarding');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [utils]);

  const { data: enhancedStats, isLoading: statsLoading } = trpc.dashboard.enhanced.useQuery({ framework, clientId }, {
    enabled: !!user
  });
  const { data: clients, isLoading: clientsLoading } = trpc.clients.list.useQuery(undefined, {
    enabled: !!user
  });
  const { data: complianceScores, isLoading: scoresLoading } = trpc.dashboard.complianceScores.useQuery(undefined, {
    enabled: !!user
  });
  const { data: overdueAssessments, isLoading: overdueLoading } = trpc.vendorAnalytics.getOverdueAssessments.useQuery(undefined, {
    enabled: !!user
  });
  const { data: insightsData } = trpc.dashboard.getInsights.useQuery({ clientId }, {
    enabled: !!user
  });
  const insights = Array.isArray(insightsData) ? insightsData : [];

  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{ id: number; name: string; currentTarget: number } | null>(null);
  const [newTargetScore, setNewTargetScore] = useState(80);

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
    highRisks: 0,
    maxClients: 2,
    ownedClientsCount: 0
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

  // Show onboarding only if: no clients, not loading, and hasn't been shown this session
  const shouldShowOnboarding = !statsLoading && !clientsLoading && clients && clients.length === 0 && !hasSeenOnboardingThisSession;

  // Show loading state when transitioning from onboarding to dashboard
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Mark that we've seen onboarding this session when conditions are met
  useEffect(() => {
    if (shouldShowOnboarding) {
      setHasSeenOnboardingThisSession(true);
    }
  }, [shouldShowOnboarding]);

  // Handle transition state when clients are being loaded after onboarding
  useEffect(() => {
    if (hasSeenOnboardingThisSession && clientsLoading) {
      setIsTransitioning(true);
    } else if (isTransitioning && !clientsLoading) {
      setIsTransitioning(false);
    }
  }, [hasSeenOnboardingThisSession, clientsLoading, isTransitioning]);

  if (shouldShowOnboarding || isTransitioning) {
    return (
      <DashboardLayout>
        {shouldShowOnboarding && <OnboardingWizard />}
        {isTransitioning && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading your workspace...</p>
            </div>
          </div>
        )}
        {shouldShowOnboarding && (
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
              <Card className="bg-slate-100 border-none shadow-sm h-full">
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
              <Card className="bg-slate-100 border-none shadow-sm h-full">
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
              <Card className="bg-slate-100 border-none shadow-sm h-full">
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
        )}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative min-h-[calc(100vh-3.5rem)] -mx-4 -my-8 px-4 py-8 md:-mx-20 md:-mt-8 md:pl-20 md:pr-28 bg-slate-50/50 text-slate-900 overflow-hidden page-transition">
        {/* Ambient Light Mode Background Glows */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute top-[20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-purple-500/10 blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"></div>
        </div>
        <div className="relative z-10 space-y-8">
          <div className="flex items-center justify-between">
            <Breadcrumb
              items={[
                { label: "Dashboard" },
              ]}
            />
            <PageGuide
              title="Command Center"
              description="Your strategic hub for organizational compliance and risk posture."
              rationale="The dashboard aggregates data across all contexts to give you high-level visibility into compliance trends and critical gaps."
              howToUse={[
                { step: "Analyze Posture", description: "View the 'Live Posture Score' for real-time compliance readiness.", targetId: "dash-posture-score" },
                { step: "Track Benchmarks", description: "Monitor compliance trends over time against target goals.", targetId: "dash-compliance-trend" },
                { step: "Critical Actions", description: "Address 'AI Posture Insights' and 'Overdue Assessments' immediately.", targetId: "dash-critical-actions" },
                { step: "Switch Context", description: "Filter view by specific organization nodes (clients) or frameworks.", targetId: "dash-filters-bar" }
              ]}
              scenarios={[
                {
                  title: "Weekly Executive Briefing",
                  example: "The CEO asks for a compliance summary before a board meeting. You need to show that the organizational risk is within tolerance.",
                  auditTip: "Focus on the 'Executive View' and 'Live Posture Score'. Auditors appreciate seeing that senior leadership actively monitors these metrics as part of Governance."
                },
                {
                  title: "Investigating Posture Drift",
                  example: "You notice the compliance score dropped by 5% overnight. You need to identify if this is a data error or a security regression.",
                  auditTip: "Check 'AI Posture Insights'. A drop often signifies expired evidence or new assets coming into scope that haven't been implemented yet."
                }
              ]}
              integrations={[
                { name: "Risk Management", description: "High-risk items are automatically escalated to the dashboard." },
                { name: "Compliance Modules", description: "Data from ISO, SOC 2, and NIST feeds directly into your score." }
              ]}
            />
          </div>


          {/* Animated Welcome & AI Command Center */}
          <div className="flex flex-col lg:flex-row gap-8 items-start justify-between relative z-10 w-full pt-4">
            <div className="flex-1 w-full space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tight">
                  Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Commander'}.
                </h1>
                <p className="text-slate-600 font-medium mt-2 text-lg">
                  Your compliance posture is active and scanning. Here is your daily briefing.
                </p>
              </motion.div>

              {/* AI Action Briefing */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white/60 backdrop-blur-xl border border-slate-200 shadow-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden group"
                id="dash-critical-actions"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent group-hover:from-blue-500/20 transition-all duration-700 pointer-events-none" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">AI Posture Insights</h3>
                  </div>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">Scanning Live</Badge>
                </div>

                <div className="space-y-4 relative z-10 mt-6">
                  {insights.length > 0 ? insights.slice(0, 3).map((insight: any) => (
                    <div key={insight.id} className="flex gap-4 p-4 rounded-2xl bg-slate-100 border border-white/60 hover:bg-white/10 hover:border-white/20 transition-all group/item">
                      <div className="mt-0.5">
                        {insight.type === 'critical' ? <AlertCircle className="h-5 w-5 text-red-400" /> :
                          insight.type === 'warning' ? <Clock className="h-5 w-5 text-amber-400" /> :
                            insight.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-blue-400" /> :
                              <Sparkles className="h-5 w-5 text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-slate-900 font-bold text-sm truncate">{insight.title}</h4>
                        <p className="text-slate-500 text-xs mt-1 leading-relaxed truncate">{insight.description}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase tracking-wider font-bold text-slate-900/70 hover:text-slate-900 bg-slate-100 hover:bg-white/20 ml-2" onClick={() => setLocation(resolveNavigationPath(insight.link, effectiveClientId ? parseInt(effectiveClientId) : null))}>
                        {insight.action} <ArrowRight className="h-3 w-3 ml-2 opacity-50 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                      </Button>
                    </div>
                  )) : (
                    <div className="text-center py-6 text-slate-500">
                      <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-3 opacity-50" />
                      <p>No critical actions required today. You are fully aligned.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="w-full lg:w-96 shrink-0"
              id="dash-posture-score"
            >
              {/* Real-time Posture Score */}
              <div className="bg-white/60 backdrop-blur-xl border border-slate-200 shadow-sm rounded-3xl p-8 relative overflow-hidden group shadow-2xl h-full flex flex-col items-center justify-center text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-duration-500 pointer-events-none" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none" />

                <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest mb-6 relative z-10">Live Posture Score</h3>

                <div className="relative z-10">
                  <CircularProgress
                    value={overallComplianceRate}
                    size={220}
                    strokeWidth={16}
                    showValue={true}
                    color={overallComplianceRate >= 80 ? '#10b981' : overallComplianceRate >= 50 ? '#f59e0b' : '#ef4444'}
                  />
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <StatusIndicator rate={overallComplianceRate} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filters & Actions Header */}
          <div className="flex items-center flex-wrap justify-between mt-8 relative z-10 pb-4 border-b border-slate-200" id="dash-filters-bar">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-4 md:mb-0">Command Interface</h2>
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('executive')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'executive'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4" />
                    Executive
                  </span>
                </button>
                <button
                  onClick={() => setViewMode('full')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'full'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Settings2 className="w-4 h-4" />
                    Full
                  </span>
                </button>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              {/* Light Client Selector */}
              {clients && clients.length > 0 && (
                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md border border-slate-200 rounded-xl px-4 py-2 shadow-sm transition-all hover:bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500/50 group">
                  <span className="text-slate-500 font-semibold text-xs tracking-wider uppercase">Context:</span>
                  <select
                    className="bg-transparent border-none focus:ring-0 cursor-pointer pr-8 font-bold text-slate-900 focus:text-blue-600 max-w-[150px] truncate outline-none appearance-none transition-colors"
                    value={clientId || ""}
                    onChange={(e) => setClientId(e.target.value || undefined)}
                  >
                    <option value="" className="bg-white">Global Fleet</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id} className="bg-white text-slate-900">
                        {client.name}
                      </option>
                    ))}
                  </select>
                  <div className="ml-[-1.5rem] pointer-events-none text-slate-500 group-hover:text-slate-900 transition-colors">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* Light Standard Selector */}
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md border border-slate-200 rounded-xl px-4 py-2 shadow-sm transition-all hover:bg-slate-50 focus-within:ring-2 focus-within:ring-purple-500/50 group">
                <span className="text-slate-500 font-semibold text-xs tracking-wider uppercase">Protocol:</span>
                <select
                  className="bg-transparent border-none focus:ring-0 cursor-pointer pr-8 font-bold text-slate-900 focus:text-purple-600 outline-none appearance-none transition-colors"
                  value={framework || ""}
                  onChange={(e) => setFramework(e.target.value || undefined)}
                >
                  <option value="" className="bg-white">All Protocols</option>
                  <option value="ISO 27001" className="bg-white text-slate-900">ISO 27001</option>
                  <option value="SOC 2" className="bg-white text-slate-900">SOC 2</option>
                </select>
                <div className="ml-[-1.5rem] pointer-events-none text-slate-500 group-hover:text-slate-900 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'owner') && (
                <Button onClick={() => setLocation('/clients')} className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl h-10 px-5 rounded-xl font-bold transition-all hover:scale-105 active:scale-95">
                  <Plus className="mr-2 h-4 w-4" />
                  Deploy Node
                </Button>
              )}
            </div>
          </div>

          {/* Onboarding Banner (Short version for active dashboard) */}

          {!statsLoading && enhancedStats && (overview.totalPolicies === 0 || overview.totalEvidence === 0 || ((user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'owner') && (overview.totalLLMProviders === 0))) && (
            <OnboardingChecklist stats={enhancedStats} role={user?.role} />
          )}

          {/* Metrics & Command View Content */}
          <AnimatePresence mode="wait">
            {viewMode === 'executive' ? (
              <motion.div
                key="executive-mode"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Executive Metrics Row */}
                <div className="grid gap-6 md:grid-cols-3">
                  <AnimatedMetricCard
                    title="Overall Compliance"
                    value={`${overallComplianceRate}%`}
                    icon={<Shield className="w-5 h-5" />}
                    trend="up"
                    trendLabel="12%"
                    variant="success"
                  />
                  <AnimatedMetricCard
                    title="Risk Profile"
                    value={overview?.highRisks || 0}
                    icon={<AlertTriangle className="w-5 h-5" />}
                    variant="error"
                  />
                  <AnimatedMetricCard
                    title="Portfolio Reach"
                    value={overview?.totalClients || 0}
                    icon={<Users className="w-5 h-5" />}
                    variant="info"
                  />
                </div>

                {/* Compliance Trend Chart */}
                <Card className="col-span-full bg-white/60 backdrop-blur-xl relative overflow-hidden rounded-3xl border-slate-200" id="dash-compliance-trend">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-50 pointer-events-none" />
                  <CardHeader className="pb-4 relative z-10 border-b border-slate-200">
                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      Compliance Performance Trend
                    </CardTitle>
                    <CardDescription className="font-medium text-slate-500">Overall compliance improvement over the last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 relative z-10">
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
                              stroke="#64748b"
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
                              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
                              stroke="#94a3b8"
                              strokeDasharray="5 5"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-xl mt-4 bg-slate-100">
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

                {/* Sub-metrics Row */}
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {/* Overdue Vendor Assessments - High Priority */}
                  <Card className="bg-white/60 backdrop-blur-xl relative overflow-hidden group/overdue rounded-3xl border-slate-200">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 to-rose-500" />
                    <CardHeader className="pb-4 relative z-10 border-b border-slate-200">
                      <CardTitle className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-red-500/10 text-red-600">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                        Overdue Assessments
                        {overdueAssessments && overdueAssessments.length > 0 && (
                          <span className="bg-red-500 text-white shadow-sm shadow-red-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full">{overdueAssessments.length}</span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 relative z-10">
                      {overdueLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-16 w-full" />
                        </div>
                      ) : overdueAssessments && overdueAssessments.length > 0 ? (
                        <div className="space-y-3">
                          {overdueAssessments.slice(0, 3).map((assessment) => (
                            <div key={assessment.id} className="flex items-center justify-between p-3 rounded-lg border bg-white/80 border border-slate-200 shadow-lg">
                              <div className="flex-1 min-w-0 mr-4">
                                <p className="font-medium truncate text-sm">{assessment.vendorName}</p>
                                <p className="text-xs text-muted-foreground truncate">{assessment.assessmentType}</p>
                              </div>
                              <div className="text-right flex flex-col items-end gap-1">
                                <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  {assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : 'Overdue'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500 opacity-50" />
                          <p className="text-sm">All assessments on track</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Client Compliance Overview */}
                  <Card className="bg-white/60 backdrop-blur-xl relative overflow-hidden group/clients rounded-3xl border-slate-200">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                    <CardHeader className="pb-4 relative z-10 border-b border-slate-200">
                      <CardTitle className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                          <Users className="h-5 w-5" />
                        </div>
                        Context Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 relative z-10">
                      {statsLoading ? (
                        <Skeleton className="h-32 w-full" />
                      ) : clientsOverview.length > 0 ? (
                        <div className="space-y-4">
                          {clientsOverview.slice(0, 2).map((client) => (
                            <div key={client.id} className="space-y-2">
                              <div className="flex items-center justify-between text-sm font-bold">
                                <span>{client.name}</span>
                                <span>{client.compliancePercentage}%</span>
                              </div>
                              <Progress value={client.compliancePercentage} className="h-2" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-6">No active contexts monitored</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Activity Mini */}
                  <Card className="bg-white/60 backdrop-blur-xl relative overflow-hidden group/activity rounded-3xl border-slate-200">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
                    <CardHeader className="pb-4 relative z-10 border-b border-slate-200">
                      <CardTitle className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                          <Activity className="h-5 w-5" />
                        </div>
                        Recent Signals
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 relative z-10">
                      <div className="space-y-3">
                        {recentActivity.length > 0 ? recentActivity.slice(0, 3).map((activity, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                            <span className="truncate">{activity.name}</span>
                          </div>
                        )) : (
                          <p className="text-sm text-muted-foreground text-center py-6">No recent signals detected</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="full-mode"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Full Metrics Row */}
                <div className="dashboard-grid grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <Card className="bg-white/60 backdrop-blur-xl relative overflow-hidden group/metric rounded-3xl hover:-translate-y-1 transition-all duration-300 shadow-sm border-slate-200">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                    <CardContent className="pt-6 relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest leading-loose">Total Clients</p>
                          {statsLoading ? (
                            <Skeleton className="h-8 w-16 mt-2" />
                          ) : (
                            <h3 className="text-4xl font-black mt-1 text-slate-900 tracking-tighter">
                              {overview?.totalClients || 0}
                            </h3>
                          )}
                        </div>
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                          <Users className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/60 backdrop-blur-xl relative overflow-hidden group/metric rounded-3xl hover:-translate-y-1 transition-all duration-300 shadow-sm border-slate-200">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 to-fuchsia-500" />
                    <CardContent className="pt-6 relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest leading-loose">Master Controls</p>
                          {statsLoading ? (
                            <Skeleton className="h-8 w-16 mt-2" />
                          ) : (
                            <h3 className="text-4xl font-black mt-1 text-slate-900 tracking-tighter">
                              {overview?.totalControls || 0}
                            </h3>
                          )}
                        </div>
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white">
                          <Shield className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/60 backdrop-blur-xl relative overflow-hidden group/metric rounded-3xl hover:-translate-y-1 transition-all duration-300 shadow-sm border-slate-200">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                    <CardContent className="pt-6 relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest leading-loose">Policy Templates</p>
                          {statsLoading ? (
                            <Skeleton className="h-8 w-16 mt-2" />
                          ) : (
                            <h3 className="text-4xl font-black mt-1 text-slate-900 tracking-tighter">
                              {overview?.totalPolicies || 0}
                            </h3>
                          )}
                        </div>
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                          <FileText className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/60 backdrop-blur-xl relative overflow-hidden group/metric rounded-3xl hover:-translate-y-1 transition-all duration-300 shadow-sm border-slate-200">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 to-rose-600" />
                    <CardContent className="pt-6 relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest leading-loose">Flagged Risks</p>
                          {statsLoading ? (
                            <Skeleton className="h-8 w-16 mt-2" />
                          ) : (
                            <h3 className="text-4xl font-black mt-1 text-slate-900 tracking-tighter">
                              {overview?.highRisks || 0}
                            </h3>
                          )}
                        </div>
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/60 backdrop-blur-xl relative overflow-hidden group/metric rounded-3xl hover:-translate-y-1 transition-all duration-300 shadow-sm border-slate-200">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                    <CardContent className="pt-6 relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest leading-loose">Compliance</p>
                          {statsLoading ? (
                            <Skeleton className="h-8 w-16 mt-2" />
                          ) : (
                            <h3 className="text-4xl font-black mt-1 text-slate-900 tracking-tighter">
                              {overallComplianceRate}%
                            </h3>
                          )}
                        </div>
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row */}
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Control Status Chart */}
                  <Card className="bg-white/60 backdrop-blur-xl relative overflow-hidden rounded-3xl border-slate-200">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-50 pointer-events-none" />
                    <CardHeader className="pb-4 relative z-10 border-b border-slate-200">
                      <CardTitle className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                          <PieChart className="h-5 w-5" />
                        </div>
                        Control Status
                      </CardTitle>
                      <CardDescription className="font-medium text-slate-500">Implementation status across all clients</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 relative z-10">
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
                          className="h-48"
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Policy Status Chart */}
                  <Card className="bg-white/60 backdrop-blur-xl relative overflow-hidden rounded-3xl border-slate-200">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-fuchsia-500/5 opacity-50 pointer-events-none" />
                    <CardHeader className="pb-4 relative z-10 border-b border-slate-200">
                      <CardTitle className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        Policy Status
                      </CardTitle>
                      <CardDescription className="font-medium text-slate-500">Policy approval status</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 relative z-10">
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
                          className="h-48"
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Evidence Status Chart */}
                  <Card className="bg-white/60 backdrop-blur-xl relative overflow-hidden rounded-3xl border-slate-200">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-50 pointer-events-none" />
                    <CardHeader className="pb-4 relative z-10 border-b border-slate-200">
                      <CardTitle className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-blue-600/10 text-emerald-600">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        Evidence Status
                      </CardTitle>
                      <CardDescription className="font-medium text-slate-500">Evidence verification status</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 relative z-10">
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
                          className="h-48"
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Blocks */}
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="bg-white/60 backdrop-blur-xl relative overflow-hidden rounded-3xl border-slate-200">
                    <CardHeader className="pb-4 border-b border-slate-200">
                      <CardTitle className="text-lg font-bold">Client Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {clientsOverview.length > 0 ? (
                        <div className="space-y-4">
                          {clientsOverview.slice(0, 3).map(client => (
                            <div key={client.id} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{client.name}</span>
                                <span className="font-bold">{client.compliancePercentage}%</span>
                              </div>
                              <Progress value={client.compliancePercentage} className="h-1.5" />
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-center py-4 text-slate-500 text-sm">No organizations</p>}
                    </CardContent>
                  </Card>

                  <Card className="bg-white/60 backdrop-blur-xl relative overflow-hidden rounded-3xl border-slate-200">
                    <CardHeader className="pb-4 border-b border-slate-200">
                      <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {recentActivity.length > 0 ? (
                        <div className="space-y-3">
                          {recentActivity.slice(0, 3).map((activity, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <span className="truncate">{activity.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-center py-4 text-slate-500 text-sm">No activity</p>}
                    </CardContent>
                  </Card>

                  <Card className="bg-white/60 backdrop-blur-xl relative overflow-hidden rounded-3xl border-slate-200">
                    <CardHeader className="pb-4 border-b border-slate-200">
                      <CardTitle className="text-lg font-bold">Controls by Framework</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {frameworkData.length > 0 ? (
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={frameworkData} layout="vertical">
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" width={80} fontSize={10} />
                              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : <p className="text-center py-4 text-slate-500 text-sm">No frameworks</p>}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Actions */}
          <Card className="bg-white/60 backdrop-blur-xl rounded-3xl overflow-hidden relative group/qa border-slate-200">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-50 pointer-events-none group-hover/qa:opacity-100 transition-opacity duration-500" />
            <CardHeader className="pb-4 relative z-10 border-b border-slate-200">
              <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Quick Actions</CardTitle>
              <CardDescription className="text-slate-500 font-medium">Common tasks to manage compliance</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 relative z-10">
              <div className="grid gap-4 md:grid-cols-4">
                {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'owner') && (
                  <>
                    <Button variant="outline" className="justify-start h-auto py-5 px-5 rounded-2xl border-white hover:border-[#0284c7]/30 bg-slate-100 backdrop-blur-sm hover:bg-white/80 shadow-sm hover:shadow-md transition-all duration-300 group focus-visible:ring-2 focus-visible:ring-[#0284c7]/20" onClick={() => setLocation('/clients')}>
                      <div className="flex flex-col items-start gap-1.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-[#0284c7]/10 text-[#0284c7] group-hover:scale-110 transition-transform">
                            <Plus className="h-4 w-4" />
                          </div>
                          <span className="font-extrabold text-slate-900 group-hover:text-[#0284c7] transition-colors">Add Client</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 leading-relaxed uppercase tracking-wider">Create new workspace</span>
                      </div>
                    </Button>
                    <Button variant="outline" className="justify-start h-auto py-5 px-5 rounded-2xl border-white hover:border-[#0284c7]/30 bg-slate-100 backdrop-blur-sm hover:bg-white/80 shadow-sm hover:shadow-md transition-all duration-300 group focus-visible:ring-2 focus-visible:ring-[#0284c7]/20" onClick={() => setLocation('/controls')}>
                      <div className="flex flex-col items-start gap-1.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-[#0284c7]/10 text-[#0284c7] group-hover:scale-110 transition-transform">
                            <Shield className="h-4 w-4" />
                          </div>
                          <span className="font-extrabold text-slate-900 group-hover:text-[#0284c7] transition-colors">Control Library</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 leading-relaxed uppercase tracking-wider">Manage master controls</span>
                      </div>
                    </Button>
                    <Button variant="outline" className="justify-start h-auto py-5 px-5 rounded-2xl border-white hover:border-[#0284c7]/30 bg-slate-100 backdrop-blur-sm hover:bg-white/80 shadow-sm hover:shadow-md transition-all duration-300 group focus-visible:ring-2 focus-visible:ring-[#0284c7]/20" onClick={() => setLocation('/policy-templates')}>
                      <div className="flex flex-col items-start gap-1.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-[#0284c7]/10 text-[#0284c7] group-hover:scale-110 transition-transform">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="font-extrabold text-slate-900 group-hover:text-[#0284c7] transition-colors">Policy Templates</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 leading-relaxed uppercase tracking-wider">Create templates</span>
                      </div>
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  className="justify-start h-auto py-5 px-5 rounded-2xl border-white hover:border-emerald-300 bg-slate-100 backdrop-blur-sm hover:bg-white/80 shadow-sm hover:shadow-md transition-all duration-300 group focus-visible:ring-2 focus-visible:ring-emerald-500/20"
                  onClick={() => setLocation(resolveNavigationPath('/evidence', effectiveClientId))}
                >
                  <div className="flex flex-col items-start gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-600/10 text-emerald-600 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">Evidence Tracking</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 leading-relaxed uppercase tracking-wider">Track compliance evidence</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

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
                  Current target: {selectedClient?.currentTarget}%
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
        </div>
      </div>
    </DashboardLayout>
  );
}

