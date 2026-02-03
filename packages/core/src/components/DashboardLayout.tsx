import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@complianceos/ui/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@complianceos/ui/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@complianceos/ui/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@complianceos/ui/ui/collapsible";
import { Badge } from "@complianceos/ui/ui/badge";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, LogOut, PanelLeft, Users, User, Shield, FileText, Calendar,
  Link, ClipboardCheck, FileBarChart, Bell, Settings, BookOpen, ChevronRight,
  ChevronDown, Scale, Lock, History, AlertTriangle, Activity, Database, Bug,
  ClipboardList, Megaphone, Building2, ListTodo, MessageSquare, Star, LayoutGrid, Inbox, Sparkles, Briefcase, Rocket, ShieldAlert, Globe, ShieldCheck, Zap, Target, Search, Code, Radar, Brain, Compass, Flag
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation, Redirect } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { GlobalSearch } from "./GlobalSearch";
import { useClientContext } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import { CopilotButton } from "@complianceos/premium/components/advisor/CopilotButton";
import { CopilotPanel } from "@complianceos/premium/components/advisor/CopilotPanel";

import { CopilotHelpTrigger } from "@complianceos/premium/components/advisor/CopilotHelpTrigger";
import { TourProvider } from "./TourProvider";

// ... (existing imports)

const globalMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Rocket, label: "Client Onboarding", path: "/onboarding" }, // New
  { icon: Users, label: "Clients", path: "/clients" },
  { icon: Shield, label: "Global Control Library", path: "/controls" },
  { icon: FileText, label: "Policy Templates", path: "/policy-templates" },
  { icon: Scale, label: "Compliance Obligations", path: "/compliance-obligations" },
  { icon: Target, label: "Strategic Roadmaps", path: "/roadmap" },
  { icon: Calendar, label: "Implementation Plans", path: "/implementation" },
];

const learningZoneMenuItem = {
  icon: BookOpen, label: "Learning Zone", path: "/learning", submenu: [
    { label: "ISO 27001", path: "/learning/iso-27001" },
    { label: "SOC 2", path: "/learning/soc-2" },
    { label: "GDPR", path: "/learning/gdpr" },
    { label: "HIPAA", path: "/learning/hipaa" },
    { label: "CMMC", path: "/learning/cmmc" },
  ]
};

const adminMenuItems = [
  { label: "User Management", path: "/admin/user-management" },
  { label: "User Invitations", path: "/admin/invitations" },
  { label: "Audit Logs", path: "/admin/audit" },
  { label: "LLM Settings", path: "/admin/llm" },
  // { label: "Integrations Marketplace", path: "/admin/integrations" },
  { label: "Issue Trackers", path: "/admin/issue-tracker" },
  { label: "Billing", path: "/admin/billing" },
  { label: "Waitlist Management", path: "/sales/waitlist" },
];

const adminMenuItem = {
  icon: Lock, label: "Admin Console", path: "/admin", submenu: adminMenuItems
};

const clientSpecificMenuItems = [
  { icon: Shield, label: "Controls", path: "/client-controls" },
  { icon: FileText, label: "Policies", path: "/client-policies" },
  { icon: BookOpen, label: "Knowledge Base", path: "/knowledge-base" },
  { icon: Sparkles, label: "AI Questionnaires", path: "/questionnaires", isPremium: true },
  { icon: Link, label: "Mappings", path: "/mappings" },

  { icon: ClipboardCheck, label: "Evidence", path: "/evidence" },
  { icon: AlertTriangle, label: "Risk Management", path: "/risks" },
  { icon: Code, label: "Threat Modeling", path: "/dev/projects", isPremium: true },
  { icon: Activity, label: "Gap Analysis", path: "/gap-analysis" },
  { icon: Compass, label: "Compliance Journey", path: "/journey" }, // New
  { icon: Flag, label: "Discovery Wizard", path: "/readiness/wizard" }, // New
  { icon: Brain, label: "AI Governance", path: "/ai-governance", isPremium: true },

  {
    icon: Building2, label: "Federal Hub", path: "/federal", submenu: [
      { label: "FIPS 199 Categorization", path: "/federal/fips-199" },
      { label: "SSP (NIST 800-171)", path: "/federal/ssp-171" },
      { label: "SSP (NIST 800-172)", path: "/federal/ssp-172" },
      { label: "SAR Report", path: "/federal/sar" },
      { label: "POA&M (NIST 171)", path: "/federal/poam" },
    ]
  },
  { icon: Users, label: "People", path: "/people" },
  { icon: FileBarChart, label: "RACI Matrix", path: "/raci-matrix" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: FileBarChart, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: ListTodo, label: "Tasks", path: "/tasks" },
  { icon: MessageSquare, label: "Communication", path: "/communication" },
  { icon: History, label: "Activity Log", path: "/activity" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

// Helper to resolve the actual navigation path based on client context
function resolveNavigationPath(itemPath: string, clientId: number | null): string {
  if (!clientId) return itemPath;

  // Split path and query
  const [purePath, query] = itemPath.split('?');
  const queryStr = query ? `?${query}` : '';

  // Handle tab-based client dashboard redirects
  if (purePath === "/governance") return `/clients/${clientId}/governance${queryStr}`;
  if (purePath === "/governance/workbench") return `/clients/${clientId}/governance/workbench${queryStr}`;
  if (purePath === "/compliance") return `/clients/${clientId}/compliance${queryStr}`;
  if (purePath === "/client-dashboard") return `/clients/${clientId}?tab=dashboard${query ? '&' + query : ''}`;
  if (purePath === "/client-controls") return `/clients/${clientId}/controls${queryStr}`;
  if (purePath === "/client-policies") return `/clients/${clientId}/policies${queryStr}`;
  if (purePath === "/audit-readiness") return `/clients/${clientId}/audit-readiness${queryStr}`;
  // if (purePath === "/crm") return `/clients/${clientId}?tab=crm${query ? '&' + query : ''}`;
  if (purePath === "/readiness/wizard") return `/clients/${clientId}/readiness/wizard${queryStr}`;
  if (purePath === "/intake") return `/clients/${clientId}/intake${queryStr}`;
  if (purePath === "/board-summary") return `/clients/${clientId}/board-summary${queryStr}`;
  if (purePath === "/communication") return `/clients/${clientId}/communication${queryStr}`;
  if (purePath === "/ai-governance") return `/clients/${clientId}/ai-governance${queryStr}`;
  if (purePath === "/activity") return `/clients/${clientId}/activity${queryStr}`;
  if (purePath === "/readiness/roadmap") return `/clients/${clientId}/roadmap/dashboard${queryStr}`;
  if (purePath === "/roadmap") return `/clients/${clientId}/roadmap/dashboard${queryStr}`;
  if (purePath === "/implementation") return `/clients/${clientId}/implementation${queryStr}`;
  if (purePath === "/evidence") return `/clients/${clientId}/evidence${queryStr}`;
  if (purePath === "/journey") return `/clients/${clientId}/journey${queryStr}`; // New
  if (purePath === "/onboarding") return `/onboarding${queryStr}`; // Global, but good to handle explicitly if needed
  if (purePath === "/gap-analysis") return `/clients/${clientId}/gap-analysis${queryStr}`;
  if (purePath === "/audit-hub") return `/clients/${clientId}/audit-hub${queryStr}`;
  if (purePath === "/reports") return `/clients/${clientId}/reports${queryStr}`;
  if (purePath === "/trust-center") return `/trust-center/${clientId}${queryStr}`;

  // Handle client-specific sub-routes
  const isClientSubRoute = clientSpecificMenuItems.some(cItem => cItem.path === purePath) ||
    purePath.startsWith('/risks') ||
    purePath.startsWith('/vendors') ||
    purePath.startsWith('/business-continuity') ||
    purePath.startsWith('/federal') ||
    purePath.startsWith('/privacy') ||
    purePath.startsWith('/workflows') ||
    purePath.startsWith('/cyber') ||
    purePath.startsWith('/ai-governance') ||
    purePath.startsWith('/roadmap') ||
    purePath.startsWith('/readiness') ||
    purePath.startsWith('/compliance-journey') ||
    purePath.startsWith('/implementation');



  if (isClientSubRoute) {
    return `/clients/${clientId}${purePath}${queryStr}`;
  }

  return itemPath;
}

// Helper to check if a navigation path is active given the current location
function isPathActive(navPath: string, currentPath: string, currentSearch: string): boolean {
  try {
    const baseUrl = 'http://localhost';
    const navUrl = new URL(navPath, baseUrl);
    const currUrl = new URL(currentPath + currentSearch, baseUrl);

    // Exact match for the whole thing including search
    if (navUrl.pathname === currUrl.pathname && navUrl.search === currUrl.search) return true;

    const navTab = navUrl.searchParams.get('tab');
    const currTab = currUrl.searchParams.get('tab');

    // Handle client workspace tabbed routes (/clients/:id?tab=...)
    const navIsClientBase = navUrl.pathname.match(/^\/clients\/\d+$/);
    const currIsClientBase = currUrl.pathname.match(/^\/clients\/\d+$/);

    if (navIsClientBase && currIsClientBase) {
      if (navTab) {
        return navTab === currTab;
      }
      if (currTab) return false;
      return true;
    }

    // Special case for the "Clients" list link (/clients)
    if (navUrl.pathname === '/clients') {
      return currUrl.pathname === '/clients';
    }

    // If nav is a client base but current is a sub-page (like /people)
    if (navIsClientBase && currUrl.pathname.startsWith(navUrl.pathname) && currUrl.pathname !== navUrl.pathname) {
      return false;
    }

    // Prefix match for other sections (e.g. /risks)
    if (navUrl.pathname !== '/' && navUrl.pathname !== '/dashboard' && currUrl.pathname.startsWith(navUrl.pathname)) {
      const nextChar = currUrl.pathname.charAt(navUrl.pathname.length);
      if (!nextChar || nextChar === '/') return true;
    }

    return false;
  } catch (e) {
    return currentPath + currentSearch === navPath;
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user, signOut } = useAuth();
  const { selectedClientId } = useClientContext();

  // Redirect Auditors to their clean room
  if (user?.user_metadata?.role === 'auditor' && selectedClientId) {
    return <Redirect to={`/clients/${selectedClientId}/audit-hub`} />;
  }

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <Shield className="h-16 w-16 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to GRCompliance
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Sign in to manage your compliance controls and policies.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      defaultOpen={true}
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <TourProvider>
        <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
          {children}
        </DashboardLayoutContent>
      </TourProvider>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, signOut } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [menuSearch, setMenuSearch] = useState("");

  // Extract client ID from URL if present
  const clientIdMatch = location.match(/\/clients\/(\d+)/);
  const activeClientId = clientIdMatch ? parseInt(clientIdMatch[1], 10) : null;

  // Use persistent client context
  const { selectedClientId } = useClientContext();

  // Use selectedClientId from context if available, otherwise fall back to URL
  const persistentClientId = selectedClientId || activeClientId;

  const { data: clientInfo, error: clientError } = trpc.clients.get.useQuery(
    { id: persistentClientId as number },
    {
      enabled: !!persistentClientId,
      retry: false
    }
  );

  useEffect(() => {
    if (clientError && clientError.data?.code === 'FORBIDDEN') {
      // Clear invalid client ID and reload to recover
      console.warn("Access denied for client ID", persistentClientId, "Clearing context.");
      localStorage.removeItem('selectedClientId');
      window.location.reload();
    }
  }, [clientError, persistentClientId]);

  // Sync planTier to ClientContext so pages can use it
  const { setPlanTier } = useClientContext();
  useEffect(() => {
    if (clientInfo) {
      // Avoid infinite loops by checking equality if possible, though React state setter handles primitives well
      setPlanTier(clientInfo.planTier);
    }
  }, [clientInfo, setPlanTier]);

  const brandStyles: CSSProperties = {
    "--sidebar-background": clientInfo?.brandPrimaryColor || "#0f172a",
    "--sidebar-foreground": "#ffffff",
    "--sidebar-primary": clientInfo?.brandSecondaryColor || "#0ea5e9",
    "--sidebar-primary-foreground": "#ffffff",
    "--sidebar-accent": "rgba(255, 255, 255, 0.1)",
    "--sidebar-accent-foreground": "#ffffff",
    "--sidebar-border": "rgba(255, 255, 255, 0.1)",
    "--sidebar-ring": clientInfo?.brandSecondaryColor || "#0ea5e9",
  } as CSSProperties;

  const highlightMatch = (text: string, search: string) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={i} className="bg-blue-500/30 text-white rounded-sm px-0.5 border-b border-blue-400">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const { data: dbUser, isLoading: isUserLoading, refetch: refetchUser } = trpc.users.me.useQuery(undefined, {
    enabled: !!user,
    retry: 3,
    retryDelay: (attempt) => Math.min(attempt * 1000, 5000)
  });

  // Redirect to payment completion if user has a paid tier but no active subscription
  const syncSubscription = trpc.billing.syncSubscriptionStatus.useMutation();

  // Redirect to payment completion if user has a paid tier but no active subscription
  useEffect(() => {
    // Check for payment_success param
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_success') === 'true') {
      const graceExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes grace
      try {
        localStorage.setItem('payment_grace_period', graceExpiry.toString());
        // Optional: Clean up URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('payment_success');
        window.history.replaceState({}, '', newUrl.toString());
      } catch (e) { /* ignore storage errors */ }
    }

    // Check validity of grace period
    let inGracePeriod = false;
    try {
      const storedGrace = localStorage.getItem('payment_grace_period');
      if (storedGrace && parseInt(storedGrace) > Date.now()) {
        inGracePeriod = true;
      } else {
        localStorage.removeItem('payment_grace_period');
      }
    } catch (e) { /* ignore */ }

    const checkAndRedirect = async () => {
      // Robust check to stop loops if we are already on the page
      if (
        location.includes('/complete-subscription') ||
        window.location.pathname.includes('/complete-subscription')
      ) return;

      // Defensive: dbUser must exist and have required fields
      if (isUserLoading) return;

      if (!dbUser) {
        // If we have a Supabase user but no DB user, and not loading, we might involve a sync
        console.warn('[Subscription] No dbUser found after loading. User object:', user?.id);
        // Force a refetch after a short delay if this happens - could be a sync race
        setTimeout(() => refetchUser(), 2000);
        return;
      }

      // Grace period check
      if (inGracePeriod) return;

      // Handle missing or null planTier - default to 'free' for safety
      const planTier = dbUser.planTier || 'free';
      if (planTier === 'free' || planTier === 'enterprise') return;

      // Handle missing or null subscriptionStatus - treat null/undefined as active for development
      const subscriptionStatus = dbUser.subscriptionStatus;
      if (!subscriptionStatus || subscriptionStatus === 'none' || subscriptionStatus === 'past_due') {
        // For development, if no subscription status, sync with Stripe
        console.log('[Subscription] No subscription status, attempting sync...');
      } else if (['active', 'trialing'].includes(subscriptionStatus)) {
        return; // Already active
      }

      // Check if we already attempted to sync this session to avoid loops/delays
      const hasSynced = sessionStorage.getItem('has_synced_subscription');
      if (hasSynced) {
        console.log("Subscription sync already attempted this session.");
        // Only redirect if NOT already there (double check) and if status is clearly invalid
        if (!window.location.pathname.includes('/complete-subscription') &&
          subscriptionStatus &&
          !['active', 'trialing'].includes(subscriptionStatus)) {
          window.location.href = '/complete-subscription';
        }
        return;
      }

      // At this point, local status might be invalid. Try to self-heal.
      console.log("Subscription status potentially invalid ('" + subscriptionStatus + "'). Attempting to sync with Stripe...");

      try {
        // Mark as synced so we don't spam the server
        sessionStorage.setItem('has_synced_subscription', 'true');

        const result = await syncSubscription.mutateAsync();
        console.log("Sync result:", result);
        if (['active', 'trialing'].includes(result.status || '')) {
          console.log("Sync successful, subscription is active. Refreshing page...");
          window.location.reload();
          return;
        }
      } catch (err) {
        console.error("Failed to sync subscription:", err);
      }

      // If we are here and status is clearly invalid, redirect
      if (subscriptionStatus && !['active', 'trialing'].includes(subscriptionStatus)) {
        console.warn("Redirecting to complete-subscription due to invalid status:", subscriptionStatus);
        if (!window.location.pathname.includes('/complete-subscription')) {
          window.location.href = '/complete-subscription';
        }
      }
    };

    checkAndRedirect();
  }, [dbUser, location]);

  // Group Definition
  const groups = [
    {
      label: "Platform & Overview",
      items: [
        { icon: Rocket, label: "Start Here", path: "/start-here" },
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
        { icon: Users, label: "Clients", path: "/clients" },
      ]
    },
    {
      label: "Libraries & Knowledge",
      items: [
        { icon: Shield, label: "Global Control Library", path: "/controls" },
        { icon: Scale, label: "Compliance Obligations", path: `/clients/${persistentClientId}/compliance-obligations` },
        { icon: LayoutGrid, label: "Frameworks Library", path: "/frameworks" },
        learningZoneMenuItem
      ]
    }
  ];

  if (persistentClientId) {
    // Add Workflows to Platform & Overview group
    const platformGroup = groups.find(g => g.label === "Platform & Overview");
    if (platformGroup) {
      platformGroup.items.push({ icon: Zap, label: "Workflows", path: "/workflows" });
    }

    groups.push(
      {
        label: "Compliance Journey",
        items: [
          { icon: Compass, label: "Overview", path: `/clients/${persistentClientId}/compliance-journey` },
          {
            icon: Star,
            label: "Discovery & Scoping",
            path: `/clients/${persistentClientId}/readiness/wizard`,
            submenu: [
              { label: "ISO 27001", path: `/clients/${persistentClientId}/readiness/wizard/ISO27001` },
              { label: "SOC 2", path: `/clients/${persistentClientId}/readiness/wizard/SOC2` },
              { label: "NIST CSF", path: `/clients/${persistentClientId}/readiness/wizard/NISTCSF` },
              { label: "HIPAA", path: `/clients/${persistentClientId}/readiness/wizard/HIPAA` },
              { label: "GDPR", path: `/clients/${persistentClientId}/readiness/wizard/GDPR` },
            ]
          },
          { icon: ClipboardCheck, label: "Evidence Collection", path: "/evidence" },
          { icon: Briefcase, label: "Audit Preparation", path: "/audit-hub" },
        ]
      }
    );

    groups.push(
      {
        label: "Governance",
        items: [
          { icon: LayoutDashboard, label: "Dashboard", path: "/governance", isPremium: true } as any,
          { icon: Shield, label: "Controls", path: "/client-controls" },
          { icon: ListTodo, label: "Workbench", path: "/governance/workbench", isPremium: true } as any,
          {
            icon: Target,
            label: "Strategic Roadmaps",
            path: "/roadmap",
            submenu: [
              { label: "Roadmap Dashboard", path: "/roadmap/dashboard" },
              { label: "Implementation Plans", path: "/implementation/dashboard" },
              { label: "Roadmap Templates", path: "/roadmap/templates" },
              { label: "Reports", path: "/reports" }
            ]
          },
          {
            icon: FileText,
            label: "Policies",
            path: "/client-policies",
            submenu: [
              { label: "View All Policies", path: "/client-policies" },
              { label: "Policy Templates", path: "/policy-templates" },
            ]
          },
          { icon: Users, label: "People & Org", path: "/people" },
          { icon: FileBarChart, label: "RACI Matrix", path: "/raci-matrix" },
          { icon: Settings, label: "Settings", path: "/settings" },
        ]
      },
      {
        label: "Risk Management",
        items: [
          { icon: LayoutDashboard, label: "Dashboard", path: "/risks" },
          { icon: ListTodo, label: "Risk Register", path: "/risks/register" },
          { icon: FileText, label: "Risk Reports", path: "/risks/report" },
          { icon: LayoutGrid, label: "Risk Framework", path: "/risks/framework" },
          { icon: Database, label: "Assets", path: "/risks/assets" },
          { icon: AlertTriangle, label: "Threats", path: "/risks/threats" },
          { icon: Bug, label: "Vulnerabilities", path: "/risks/vulnerabilities" },
          { icon: ClipboardCheck, label: "Assessments", path: "/risks/assessments" },
          { icon: Activity, label: "Gap Analysis", path: "/gap-analysis" },
          { icon: Compass, label: "Guided Assessment", path: "/risks/guided" },
          { icon: ShieldCheck, label: "Treatment Plan", path: "/risks/treatment-plan" },
          { icon: BookOpen, label: "Alignment Guide", path: "/risks/alignment-guide" },
          // Premium: Adversary Intelligence (conditionally added below)
        ]
      }
    );

    // Premium Feature: Adversary Intelligence - Add to Risk Management group
    const isPremiumClient = (clientInfo?.planTier === 'pro' || clientInfo?.planTier === 'enterprise') && import.meta.env.VITE_ENABLE_PREMIUM !== 'false';
    if (isPremiumClient) {
      const riskManagementGroup = groups.find(g => g.label === 'Risk Management');
      if (riskManagementGroup) {
        riskManagementGroup.items.push(
          { icon: Radar, label: "Adversary Intelligence", path: "/risks/adversary-intel", isPremium: true } as any
        );
      }
    }

    // Premium Feature: Vendor Management
    // Show when a client is selected (premium check happens at route level)
    const enabledInBuild = import.meta.env.VITE_ENABLE_PREMIUM !== 'false';
    const isPremium = (clientInfo?.planTier === 'pro' || clientInfo?.planTier === 'enterprise') && enabledInBuild;



    groups.push({
      label: "AI & App Security",
      items: [
        { icon: Brain, label: "AI Governance", path: "/ai-governance", isPremium: true },
        { icon: Code, label: "Threat Modeling", path: "/dev/projects", isPremium: true },
      ]
    });


    // Always show Vendor Management when a client is selected
    if (persistentClientId) {
      groups.push({
        label: "Vendor Management",
        items: [
          { icon: LayoutDashboard, label: "Dashboard", path: "/vendors/overview" },
          { icon: Building2, label: "All Vendors", path: "/vendors/all" },
          { icon: ShieldCheck, label: "Assessments", path: "/vendors/reviews" },
          { icon: Search, label: "Discovery", path: "/vendors/discovery" },
          { icon: FileText, label: "Contract Templates", path: "/vendors/contracts" },
        ]
      });
    }

    groups.push(
      {
        label: "Control Frameworks",
        items: [
          { icon: LayoutDashboard, label: "Dashboard", path: "/compliance" },

          { icon: BookOpen, label: "Knowledge Base", path: "/knowledge-base" },
          { icon: Sparkles, label: "AI Questionnaires", path: "/questionnaires", isPremium: true },
          { icon: Link, label: "Mappings", path: "/mappings" },

        ]
      },
      {
        label: "Federal Compliance",
        items: [
          { icon: Building2, label: "Overview", path: "/federal" },
          { icon: Lock, label: "FIPS 199 Categorization", path: "/federal/fips-199" },
          { icon: FileText, label: "SSP (NIST 800-171)", path: "/federal/ssp-171" },
          { icon: Shield, label: "SSP (NIST 800-172)", path: "/federal/ssp-172" },
          { icon: ClipboardList, label: "SAR Report", path: "/federal/sar" },
          { icon: Zap, label: "POA&M (NIST 171)", path: "/federal/poam" },
        ]
      },
      {
        label: "Business Continuity",
        items: [
          { icon: Activity, label: "Overview", path: "/business-continuity" },
          { icon: Database, label: "Business Processes", path: "/business-continuity/processes" },
          { icon: FileText, label: "Impact Analysis", path: "/business-continuity/bia" },
          { icon: Shield, label: "Strategies", path: "/business-continuity/strategies" },
          { icon: ClipboardList, label: "Plans", path: "/business-continuity/plans" },
          { icon: AlertTriangle, label: "Scenarios", path: "/business-continuity/scenarios" },
          { icon: Users, label: "Call Tree", path: "/business-continuity/call-tree" },
          { icon: ListTodo, label: "Tasks", path: "/business-continuity/tasks" },
        ]
      },
      {
        label: "Privacy",
        items: [
          { icon: Lock, label: "Overview", path: "/privacy" },
          { icon: Database, label: "Data Inventory", path: "/privacy/inventory" },
          { icon: FileText, label: "ROPA", path: "/privacy/ropa" },
          { icon: ShieldAlert, label: "Data Breaches", path: "/privacy/breaches" },
          { icon: ClipboardCheck, label: "DPI Assessment", path: "/privacy/dpia" },
          { icon: Globe, label: "International Transfers", path: "/privacy/transfers" },
          { icon: Users, label: "DSAR Manager", path: "/privacy/dsar" },
          { icon: FileText, label: "DPA Templates", path: "/vendors/dpa-templates" },
        ]
      },
      {
        label: "Cyber Resilience",
        items: [
          { icon: ShieldCheck, label: "Overview", path: "/cyber" },
          { icon: ListTodo, label: "NIS2 Assessment", path: "/cyber/assessment" },
          { icon: Activity, label: "Incidents", path: "/cyber/incidents" },
          { icon: FileText, label: "Documents", path: "/cyber/documents" },
        ]
      },
      {
        label: "Assurance",
        items: [
          ...(clientInfo?.serviceModel === 'managed' && enabledInBuild ? [{ icon: Inbox, label: "Evidence Intake Box", path: "/intake" }] : []),
          { icon: LayoutDashboard, label: "Board Summary", path: "/board-summary" },
          { icon: FileBarChart, label: "Reports", path: "/reports" },

        ]
      },
      {
        label: "Management",
        items: [
          { icon: Calendar, label: "Calendar", path: "/calendar" },
          { icon: ListTodo, label: "Tasks", path: "/tasks" },
          { icon: MessageSquare, label: "Communication", path: "/communication" },
        ]
      },
      {
        label: "Marketing",
        items: [
          { icon: Megaphone, label: "CRM Dashboard", path: "/sales", isPremium: true } as any,
        ]
      }
    );
  }

  // Robust role check: use DB user if available, otherwise fall back to auth metadata
  const userRole = dbUser?.role || user?.user_metadata?.role || user?.app_metadata?.role;
  const isAdminOrOwner = userRole === 'admin' || userRole === 'owner';

  if (isAdminOrOwner) {
    groups.push({
      label: "Administration",
      items: [
        adminMenuItem,
        { icon: Sparkles, label: "Advisor Workbench", path: "/advisor/workbench", isPremium: true } as any,
        { icon: History, label: "Activity Log", path: "/activity" },
      ]
    });
  }

  const filteredGroups = groups.map(group => {
    // If no search, return group as is
    if (!menuSearch) return group;

    // Filter items
    const filteredItems = group.items.map((item: any) => {
      // Check main item
      const matchMain = item.label.toLowerCase().includes(menuSearch.toLowerCase());

      // Check submenu
      const filteredSubmenu = item.submenu?.filter((sub: any) =>
        sub.label.toLowerCase().includes(menuSearch.toLowerCase())
      );

      if (matchMain) return item;
      if (filteredSubmenu && filteredSubmenu.length > 0) {
        return { ...item, submenu: filteredSubmenu };
      }
      return null;
    }).filter(Boolean);

    if (filteredItems.length > 0) {
      return { ...group, items: filteredItems };
    }
    return null;
  }).filter(Boolean);

  const currentSearch = typeof window !== 'undefined' ? window.location.search : '';

  // Flatten to find best match active item (handling 1 level of nesting)
  // Note: we need to handle the structure of groups -> items -> potentially submenu
  const allItems = groups.flatMap(group =>
    group.items.flatMap((item: any) =>
      item.submenu ? [item, ...item.submenu] : [item]
    )
  );

  const matchedItems = allItems.filter(item => {
    const navPath = resolveNavigationPath(item.path, persistentClientId);
    return isPathActive(navPath, location, currentSearch);
  });

  // Sort by specificity (path length), descending to find the "Best Match"
  matchedItems.sort((a, b) => {
    const pathA = resolveNavigationPath(a.path, persistentClientId);
    const pathB = resolveNavigationPath(b.path, persistentClientId);

    // If lengths are equal (e.g. parent link vs submenu link with same path),
    // Prefer the Leaf node (one without submenu) if possible, or maintain order.
    if (pathB.length === pathA.length) {
      if (!a.submenu && b.submenu) return -1; // a wins
      if (a.submenu && !b.submenu) return 1; // b wins
    }
    return pathB.length - pathA.length;
  });

  const bestMatchItem = matchedItems[0];
  const activeMenuItem = bestMatchItem;

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);


  return (
    <SidebarProvider style={brandStyles}>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          {/* Legacy Header Removed to match design */}


          <SidebarContent className="gap-2">
            {/* Client Context Indicator with Switcher */}
            {/* Client Context Indicator with Switcher */}
            {/* Client Context Indicator with Switcher */}
            {persistentClientId && (
              isCollapsed ? (
                <div className="flex flex-col items-center gap-2 py-6 border-b border-white/5 bg-[var(--sidebar-background)]">
                  <div
                    className="h-8 w-8 rounded-md bg-white/10 text-white flex items-center justify-center font-bold text-xs"
                    title={clientInfo?.portalTitle || clientInfo?.name || `Client #${persistentClientId}`}
                  >
                    {(clientInfo?.portalTitle || clientInfo?.name || "C")?.substring(0, 2).toUpperCase()}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLocation('/clients')}
                    className="h-8 w-8 text-slate-400 hover:text-white"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="px-5 py-6 border-b border-white/10 bg-[var(--sidebar-background)]">
                  <p className="text-[10px] font-bold text-[var(--sidebar-primary)] uppercase tracking-[0.15em] mb-2 opacity-80">Client Context</p>
                  <div className="flex flex-col gap-4">
                    <p className="text-xl font-bold text-white truncate leading-none">{clientInfo?.portalTitle || clientInfo?.name || `Client #${persistentClientId}`}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation('/clients')}
                      className="w-full h-9 text-xs bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white transition-all justify-start px-3 font-medium rounded-md"
                    >
                      <LayoutGrid className="w-4 h-4 mr-3 opacity-60" />
                      Switch Organization
                    </Button>
                  </div>
                </div>
              )
            )}



            {/* Search Bar */}
            {!isCollapsed && (
              <div className="px-3 py-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search menu..."
                    className="pl-8 h-9 text-xs bg-sidebar-accent/5"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                  />
                </div>
              </div>
            )}

            {filteredGroups.map((group, groupIndex) => (
              <CollapsibleGroup
                key={group.label || groupIndex}
                group={group}
                location={location}
                setLocation={setLocation}
                persistentClientId={persistentClientId}
                isCollapsed={isCollapsed}
                bestMatchItem={bestMatchItem}
                forceOpen={menuSearch.length > 0} // Expand groups when searching
                menuSearch={menuSearch}
                highlightMatch={highlightMatch}
              />
            ))}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  data-tour="user-menu"
                >
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "-"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.user_metadata?.full_name || user?.email || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setLocation('/profile')}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    // Use window.location.href to ensure a full refresh/clear of state
                    window.location.href = getLoginUrl();
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        <div className="flex border-b h-14 items-center justify-between bg-white/80 px-4 md:px-6 backdrop-blur-md sticky top-0 z-40 shadow-[0_1px_2px_rgba(0,0,0,0,03)]">
          <div className="flex items-center gap-3">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg bg-background shadow-sm border" />}
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 bg-primary rounded-full hidden md:block" />
              <span className="tracking-tight text-slate-900 font-bold text-sm md:text-base">
                {activeMenuItem?.label ?? "Dashboard"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GlobalSearch />
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />
            <CopilotHelpTrigger />
            <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
          </div>
        </div>
        <div className="flex-1 p-4 md:p-6">{children}</div>

        {/* AI Copilot Button - Global Access */}
        <CopilotButton clientId={persistentClientId || undefined} />
        <CopilotPanel />
      </SidebarInset>
    </SidebarProvider>
  );
}

function CollapsibleGroup({
  group,
  location,
  setLocation,
  persistentClientId,
  isCollapsed,
  bestMatchItem,
  forceOpen,
  menuSearch,
  highlightMatch
}: {
  group: any,
  location: string,
  setLocation: any,
  persistentClientId: number | null,
  isCollapsed: boolean,
  bestMatchItem: any,
  forceOpen: boolean,
  menuSearch: string,
  highlightMatch: any
}) {
  const [isOpen, setIsOpen] = useState(forceOpen);

  useEffect(() => {
    if (forceOpen) setIsOpen(true);
  }, [forceOpen]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/collapsible">
      <SidebarGroup className="py-1">
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="flex w-full items-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors px-4 py-2 mt-4">
            {highlightMatch(group.label, menuSearch)}
            <ChevronRight className="ml-auto h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-90 opacity-40" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent className="mt-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item: any) => {
                const navigationPath = resolveNavigationPath(item.path, persistentClientId);
                const isActive = item === bestMatchItem;

                return (
                  <SidebarMenuItem key={item.path}>
                    {!item.submenu ? (
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setLocation(navigationPath)}
                        tooltip={item.label}
                        className={`h-11 px-3 transition-all font-medium rounded-lg mb-1 mx-2 w-[calc(100%-16px)] ${isActive
                          ? "bg-[var(--sidebar-primary)] text-white hover:bg-[var(--sidebar-primary)] hover:text-white shadow-[0_4px_12px_rgba(0,163,255,0.3)]"
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                          }`}
                      >
                        <item.icon
                          className={`h-4.5 w-4.5 min-w-[1.125rem] ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`}
                        />
                        <span className="ml-2 uppercase text-[11px] tracking-wide flex-1">{highlightMatch(item.label, menuSearch)}</span>
                        {item.isPremium && (
                          <Badge className="ml-auto bg-indigo-500/20 text-indigo-400 border-none px-1.5 py-0 text-[8px] font-bold uppercase tracking-tight">
                            Pro
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    ) : (
                      <CollapsibleMenuItem
                        item={item}
                        location={location}
                        setLocation={setLocation}
                        isCollapsed={isCollapsed}
                        currentSearch={menuSearch}
                        cid={persistentClientId}
                        bestMatchItem={bestMatchItem}
                        highlightMatch={highlightMatch}
                      />
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

function CollapsibleMenuItem({
  item,
  location,
  setLocation,
  isCollapsed,
  currentSearch,
  cid,
  bestMatchItem,
  highlightMatch
}: {
  item: any,
  location: string,
  setLocation: any,
  isCollapsed: boolean,
  currentSearch: string,
  cid: number | null,
  bestMatchItem: any,
  highlightMatch: any
}) {
  const resolvedPath = resolveNavigationPath(item.path, cid);
  const isVisuallyActive = item === bestMatchItem;
  const isChildActive = item.submenu?.some((sub: any) => {
    const subPath = resolveNavigationPath(sub.path, cid);
    return isPathActive(subPath, location, currentSearch);
  });
  const shouldBeOpen = isPathActive(resolvedPath, location, currentSearch) || isChildActive;
  const [isOpen, setIsOpen] = useState(shouldBeOpen);

  useEffect(() => {
    if (shouldBeOpen) setIsOpen(true);
  }, [shouldBeOpen]);

  return (
    <div className="space-y-1">
      <SidebarMenuButton
        onClick={() => setIsOpen(!isOpen)}
        tooltip={item.label}
        isActive={isVisuallyActive}
        className={`h-11 px-3 transition-all font-medium rounded-lg mb-1 mx-2 w-[calc(100%-16px)] ${isVisuallyActive
          ? "bg-[var(--sidebar-primary)] text-white shadow-[0_4px_12px_rgba(0,163,255,0.3)]"
          : "text-slate-300 hover:text-white hover:bg-white/5"
          }`}
      >
        <div className="flex items-center gap-2">
          <item.icon className={`h-4.5 w-4.5 min-w-[1.125rem] ${isVisuallyActive ? "text-white" : "text-slate-400"}`} />
          <span className="ml-2">{highlightMatch(item.label, currentSearch)}</span>
        </div>
        {!isCollapsed && (
          <div className="ml-auto opacity-60">
            {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </div>
        )}
      </SidebarMenuButton>

      {isOpen && !isCollapsed && (
        <div className="pl-4 space-y-1 mt-1 border-l ml-4">
          {item.submenu.map((subItem: any) => {
            const resolvedSubPath = resolveNavigationPath(subItem.path, cid);
            const isSubActive = subItem === bestMatchItem;

            return (
              <SidebarMenuButton
                key={subItem.path}
                isActive={isSubActive}
                onClick={() => setLocation(resolvedSubPath)}
                className={`h-9 px-3 transition-all font-medium rounded-lg mx-2 mb-0.5 w-[calc(100%-16px)] ${isSubActive
                  ? "bg-[var(--sidebar-primary)] text-white hover:bg-[var(--sidebar-primary)] hover:text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                <span className="ml-1">{highlightMatch(subItem.label, currentSearch)}</span>
              </SidebarMenuButton>
            );
          })}
        </div>
      )}
    </div>
  );
}
