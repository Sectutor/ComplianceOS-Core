// Refresh
import { Toaster } from "@complianceos/ui/ui/sonner";

import { BrandingProvider } from "./config/branding";
import { TooltipProvider } from "@complianceos/ui/ui/tooltip";
import GDPRBanner from "@/components/GDPRBanner";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect, useLocation, useParams } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ClientContextProvider, useClientContext } from "./contexts/ClientContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AdvisorProvider } from "./contexts/AdvisorContext";
import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/layouts/AdminLayout";

import { lazy, Suspense, useEffect } from "react";
import { trpc } from "@/lib/trpc";

// Lazy Imports
const Home = lazy(() => import("./pages/Home"));
const WaitlistPage = lazy(() => import("./pages/WaitlistPage"));
const ManagedServicesPage = lazy(() => import("./pages/ManagedServicesPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/Clients"));
const Controls = lazy(() => import("./pages/Controls"));
const MetricsPage = lazy(() => import("./pages/Metrics"));
const PolicyTemplates = lazy(() => import("./pages/PolicyTemplates"));
const PolicyEditor = lazy(() => import("./pages/PolicyEditor"));
const Mappings = lazy(() => import("./pages/Mappings"));
const Evidence = lazy(() => import("./pages/Evidence"));
const EvidenceIntakeBox = lazy(() => import("@/pages/EvidenceIntakeBox"));
const AdvisorWorkbench = lazy(() => import("@/pages/AdvisorWorkbench"));
const ClientWorkspace = lazy(() => import("@/pages/ClientWorkspace"));
const Reports = lazy(() => import("./pages/Reports"));
const ReportEditor = lazy(() => import("./pages/reports/ReportEditor"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Notifications = lazy(() => import("./pages/Notifications"));
const ClientOnboarding = lazy(() => import("./pages/ClientOnboarding"));
const PeoplePage = lazy(() => import("./pages/People").then(module => ({ default: module.PeoplePage })));
const RACIMatrix = lazy(() => import("./pages/RACIMatrix"));
const EmployeeDetails = lazy(() => import("./pages/EmployeeDetails"));
const UnassignedItems = lazy(() => import("./pages/UnassignedItems"));
const LLMSettings = lazy(() => import("./pages/admin/LLMSettings"));
const Profile = lazy(() => import("./pages/Profile"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const OrganizationManagement = lazy(() => import("./pages/admin/OrganizationManagement"));
const UserInvitations = lazy(() => import("./pages/admin/UserInvitations"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
// Premium components moved to @complianceos/premium
// const CloudIntegrations = lazy(() => import("./pages/admin/CloudIntegrations"));
const IssueTrackerSettings = lazy(() => import("./pages/admin/IssueTrackerSettings"));
const AddonManager = lazy(() => import("./pages/admin/AddonManager"));
const AdminBilling = lazy(() => import("./pages/admin/AdminBilling"));
const ClientSettings = lazy(() => import("./pages/ClientSettings"));
const OnboardingSettings = lazy(() => import("./pages/settings/OnboardingSettings"));
const SecuritySettings = lazy(() => import("./pages/settings/SecuritySettings"));
const PersonnelComplianceHub = lazy(() => import("./pages/PersonnelComplianceHub"));
const ClientActivity = lazy(() => import("./pages/ClientActivity"));

const ClientPoliciesPage = lazy(() => import("./pages/ClientPoliciesPage"));
const ManagementSignOffPage = lazy(() => import("./pages/ManagementSignOffPage"));
const NIS2EntityClassificationWizard = lazy(() => import("./pages/NIS2EntityClassificationWizard"));
const ClientControlsPage = lazy(() => import("./pages/ClientControlsPage"));
const AuditorChecklistPage = lazy(() => import("./pages/auditors/AuditorChecklistPage"));
const ClientEmail = lazy(() => import("./pages/ClientEmail").then(module => ({ default: module.ClientEmail })));
const ClientTasksPage = lazy(() => import("./pages/ClientTasksPage"));
const AuditReadinessPage = lazy(() => import("./pages/compliance/AuditReadinessPage"));
const ClientCompliancePage = lazy(() => import("./pages/ClientCompliancePage"));


const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const SignUpPage = lazy(() => import("./pages/auth/SignUpPage"));
const CompleteSubscription = lazy(() => import("./pages/auth/CompleteSubscription"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const UpdatePassword = lazy(() => import("./pages/auth/UpdatePassword"));
const RedeemLink = lazy(() => import("./pages/auth/RedeemLink"));
const AcceptInvite = lazy(() => import("./pages/auth/AcceptInvite"));
const UpgradeRequired = lazy(() => import("./pages/UpgradeRequired"));

const LearningPage = lazy(() => import("./pages/LearningPage"));
const ISO27001ReadinessChecklist = lazy(() => import("./pages/learning/ISO27001ReadinessChecklist"));
const RegulationsDashboard = lazy(() => import("./pages/RegulationsDashboard"));
const RegulationDetail = lazy(() => import("./pages/RegulationDetail"));
const FrameworksDashboard = lazy(() => import("./pages/FrameworksDashboard"));

const RiskDashboard = lazy(() => import("./pages/risk/RiskDashboard"));
const RiskOverview = lazy(() => import("./pages/risk/RiskOverview"));
const FederalOverview = lazy(() => import("./pages/federal/FederalOverview"));
const VendorOverview = lazy(() => import("./pages/tprm/VendorOverview"));
const BusinessContinuityOverview = lazy(() => import("./pages/business-continuity/BusinessContinuityOverview"));
const CyberOverview = lazy(() => import("./pages/cyber/CyberOverview"));
const GovernanceDashboard = lazy(() => import("./pages/governance/GovernanceDashboard"));
const ComplianceOverview = lazy(() => import("./pages/compliance/ComplianceOverview"));
const AssuranceOverview = lazy(() => import("./pages/assurance/AssuranceOverview"));
const SAMMView = lazy(() => import("@/pages/assurance/SAMMView"));
const SAMMV2View = lazy(() => import("@/pages/assurance/SAMMV2View"));
const ASVSView = lazy(() => import("@/pages/assurance/ASVSView"));
const EssentialEightView = lazy(() => import("@/pages/assurance/EssentialEightView"));
const FrameworkImplementationView = lazy(() => import("@/pages/assurance/FrameworkImplementationView"));

// New Roadmap & Implementation pages
const RoadmapDashboard = lazy(() => import("@/components/roadmap/RoadmapDashboard"));
const FrameworkMarketplacePage = lazy(() => import("./pages/FrameworkMarketplacePage"));
const FrameworkStudio = lazy(() => import("./pages/studio/FrameworkStudio"));
const RoadmapCreatePage = lazy(() => import("@/components/roadmap/RoadmapCreatePage"));
const RoadmapTemplates = lazy(() => import("@/components/roadmap/RoadmapTemplates"));
const StrategicReportsPage = lazy(() => import("./pages/roadmap/StrategicReportsPage"));
const StrategicReportEditor = lazy(() => import("./pages/roadmap/StrategicReportEditor"));
const RoadmapEditPage = lazy(() => import("./pages/readiness/RoadmapEditPageFixed"));

const ImplementationDashboard = lazy(() => import("./components/implementation/ImplementationDashboard"));
const ImplementationCreate = lazy(() => import("./components/implementation/ImplementationCreate"));
// const ImplementationKanban = lazy(() => import("./components/implementation/ImplementationKanban"));
const ImplementationKanbanPage = lazy(() => import("./components/implementation/ImplementationKanbanPage"));
const MultiFrameworkPlanView = lazy(() => import("@/components/implementation/MultiFrameworkPlanView"));
const ImplementationResources = lazy(() => import("./components/implementation/ImplementationResources"));
const TemplateManager = lazy(() => import("./components/implementation/TemplateManager"));
const RiskRegisterPage = lazy(() => import("./pages/risk/RiskRegisterPage"));
const CriticalRisksPage = lazy(() => import("./pages/risk/CriticalRisksPage"));
const RiskAssetsPage = lazy(() => import("./pages/risk/RiskAssetsPage"));
const RiskThreatsPage = lazy(() => import("./pages/risk/RiskThreatsPage"));
const RiskVulnerabilitiesPage = lazy(() => import("./pages/risk/RiskVulnerabilitiesPage"));
const RiskAssessmentsPage = lazy(() => import("./pages/risk/RiskAssessmentsPage"));
const RiskAssessmentEditor = lazy(() => import("./pages/risk/RiskAssessmentEditor"));
const RiskVulnerabilityEditor = lazy(() => import("./pages/risk/RiskVulnerabilityEditor"));
const RiskAssetEditor = lazy(() => import("./pages/risk/RiskAssetEditor"));
const RiskThreatEditor = lazy(() => import("./pages/risk/RiskThreatEditor"));
const RiskFramework = lazy(() => import("./pages/risk/RiskFramework"));
const GuidedRiskValidation = lazy(() => import("./pages/risk/GuidedRiskValidation"));

const RiskReportEditor = lazy(() => import("./pages/risk/RiskReportEditor"));
const RiskReportList = lazy(() => import("./pages/risk/RiskReportList"));
const RiskTreatmentPlanPage = lazy(() => import("./pages/risk/RiskTreatmentPlanPage"));
const RiskAlignmentPage = lazy(() => import("./pages/risk/RiskAlignmentPage"));
const AdversaryIntelPage = lazy(() => import("./pages/risk/AdversaryIntelPage"));
const VulnerabilityWorkbench = lazy(() => import("./pages/risk/VulnerabilityWorkbench"));

const TPRMLayout = lazy(() => import("./pages/tprm/TPRMLayout").then(module => ({ default: module.TPRMLayout })));
const VendorList = lazy(() => import("./pages/tprm/VendorList"));
const VendorDetails = lazy(() => import("./pages/tprm/VendorDetails"));
const VendorDashboard = lazy(() => import("./pages/tprm/VendorDashboard"));
const OverdueAssessmentsPage = lazy(() => import("./pages/tprm/OverdueAssessmentsPage"));
const VendorAlignmentPage = lazy(() => import("./pages/tprm/VendorAlignmentPage"));
const GapAnalysisList = lazy(() => import("./pages/gap-analysis/GapAnalysisList"));
const NewGapAnalysis = lazy(() => import("./pages/gap-analysis/NewGapAnalysis"));
const GapAnalysisEditor = lazy(() => import("./pages/gap-analysis/GapAnalysisEditor"));
const GapQuestionnaireResponse = lazy(() => import("./pages/gap-analysis/GapQuestionnaireResponse"));
const FrameworkDetails = lazy(() => import("./pages/FrameworkDetails"));
const SecurityReviews = lazy(() => import("./pages/tprm/SecurityReviews"));
const GlobalVendorCatalog = lazy(() => import("./pages/tprm/GlobalVendorCatalog"));
const WorkflowsHub = lazy(() => import("./pages/workflows/WorkflowsHub"));
const WorkflowPlayer = lazy(() => import("./pages/workflows/WorkflowPlayer"));
const AssessmentTemplates = lazy(() => import("./pages/tprm/AssessmentTemplates"));

const OnboardVendor = lazy(() => import("./pages/tprm/OnboardVendor"));
const DPAManager = lazy(() => import("./pages/tprm/DPAManager"));
const TemplateEditor = lazy(() => import("./pages/tprm/TemplateEditor"));
const SubprocessorRegister = lazy(() => import("./pages/tprm/SubprocessorRegister"));
const DPAEditor = lazy(() => import("./pages/tprm/DPAEditor"));
const VendorContractTemplates = lazy(() => import("./pages/tprm/VendorContractTemplates"));

const BusinessContinuityDashboard = lazy(() => import("./pages/business-continuity/BusinessContinuityDashboard"));

const GdprAssessmentPage = lazy(() => import("./pages/privacy/assessments/GdprAssessmentPage"));
const CcpaAssessmentPage = lazy(() => import("./pages/privacy/assessments/CcpaAssessmentPage"));
const ROPADashboard = lazy(() => import("./pages/privacy/ROPADashboard"));
const PrivacyDocsDashboard = lazy(() => import("./pages/privacy/PrivacyDocsDashboard"));
const DataBreachRegister = lazy(() => import("./pages/privacy/DataBreachRegister"));
const BusinessImpactAnalysisPage = lazy(() => import("./pages/business-continuity/BusinessImpactAnalysisPage"));
const BusinessContinuityStrategiesPage = lazy(() => import("./pages/business-continuity/BusinessContinuityStrategiesPage"));
const BusinessContinuityPlansPage = lazy(() => import("./pages/business-continuity/BusinessContinuityPlansPage"));
const BCPProjectWizard = lazy(() => import("./pages/business-continuity/BCPProjectWizard"));
const ProcessRegistry = lazy(() => import("./pages/business-continuity/ProcessRegistry"));
const DisruptiveScenariosPage = lazy(() => import("./pages/business-continuity/DisruptiveScenariosPage"));
const DisruptiveScenarioEditor = lazy(() => import("./pages/business-continuity/DisruptiveScenarioEditor"));
const BusinessImpactAnalysisEditor = lazy(() => import("./pages/business-continuity/BusinessImpactAnalysisEditor"));
const RecoveryPlanBuilder = lazy(() => import("./pages/business-continuity/RecoveryPlanBuilder"));
const CallTreeManager = lazy(() => import("./pages/business-continuity/CallTreeManager"));
const ProcessBuilder = lazy(() => import("./pages/business-continuity/ProcessBuilder"));

const TasksDashboard = lazy(() => import("./pages/business-continuity/TasksDashboard"));
const BCPlanManager = lazy(() => import("./pages/business-continuity/BCPlanManager"));
const BCGovernancePage = lazy(() => import("./pages/business-continuity/BCGovernancePage"));
const BCExercisesPage = lazy(() => import("./pages/business-continuity/BCExercisesPage"));
const BCTrainingPage = lazy(() => import("./pages/business-continuity/BCTrainingPage"));
const ISO22301CompliancePage = lazy(() => import("./pages/business-continuity/ISO22301CompliancePage"));

const TotalBcpWizard = lazy(() => import("./pages/business-continuity/TotalBcpWizard"));

const ReadinessWizardPage = lazy(() => import("./pages/readiness/ReadinessWizardPage"));
const RoadmapPage = lazy(() => import("./pages/readiness/RoadmapPage"));
const RoadmapDetailsPage = lazy(() => import("./pages/readiness/RoadmapDetailsPage"));
const AuditReadinessAlignmentPage = lazy(() => import("./pages/readiness/AuditReadinessAlignmentPage"));
const ComplianceJourneyDashboard = lazy(() => import("./pages/ComplianceJourneyDashboard"));
const GovernanceWorkbench = lazy(() => import("./pages/governance/GovernanceWorkbench"));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const GovernanceAlignmentPage = lazy(() => import("./pages/governance/GovernanceAlignmentPage"));

const DevProjectsList = lazy(() => import("./pages/dev/DevProjectsList").then(module => ({ default: module.DevProjectsList })));
const ProjectDetail = lazy(() => import("./pages/dev/ProjectDetail").then(module => ({ default: module.ProjectDetail })));
const ThreatModelWizard = lazy(() => import("@/components/threat-modeling/ThreatModelWizard").then(module => ({ default: module.ThreatModelWizard })));

// Federal Compliance
const FederalHub = lazy(() => import("./pages/federal/FederalHub"));
const FederalComplianceDashboard = lazy(() => import("./pages/federal/FederalComplianceDashboard"));
const FipsCategorizationPage = lazy(() => import("./pages/federal/FipsCategorizationPage"));
const SSPEditor = lazy(() => import("./pages/federal/SSPEditor"));
const POAMTracker = lazy(() => import("./pages/federal/POAMTracker"));
const SARViewer = lazy(() => import("./pages/federal/SARViewer"));
const FederalAlignmentPage = lazy(() => import("./pages/federal/FederalAlignmentPage"));
const SalesDashboard = lazy(() => import("./pages/sales/SalesDashboard"));
const WaitlistManagement = lazy(() => import("./pages/sales/WaitlistManagement"));
const BoardSummaryPage = lazy(() => import("./pages/BoardSummaryPage"));
const GlobalCRM = lazy(() => import("./pages/admin/GlobalCRM"));
const ContactDetail = lazy(() => import("./pages/admin/crm/ContactDetail"));
const TrustCenter = lazy(() => import("./pages/TrustCenter"));
const AuditHub = lazy(() => import("./pages/AuditHub"));

const PrivacyDashboard = lazy(() => import("./pages/privacy/PrivacyDashboard"));
const DataInventory = lazy(() => import("./pages/privacy/DataInventory"));
const ROPA = lazy(() => import("./pages/privacy/ROPA"));
const DSARManager = lazy(() => import("./pages/privacy/DSARManager"));
const DsarDetail = lazy(() => import("./pages/privacy/DsarDetail"));
const DPIAManager = lazy(() => import("./pages/privacy/DPIAManager"));
const DPIAQuestionnaire = lazy(() => import("./pages/privacy/DPIAQuestionnaire"));
const TransferDashboard = lazy(() => import("./pages/privacy/TransferDashboard"));
const TIAWorkspace = lazy(() => import("./pages/privacy/TIAWorkspace"));
const PrivacyOverview = lazy(() => import("./pages/privacy/PrivacyOverview"));
const PrivacyLayout = lazy(() => import("./pages/privacy/PrivacyLayout").then(module => ({ default: module.PrivacyLayout })));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const QuestionnaireWorkspace = lazy(() => import("./pages/QuestionnaireWorkspace"));
const QuestionnairesDashboard = lazy(() => import("./pages/QuestionnairesDashboard"));

const CyberDashboard = lazy(() => import("./pages/cyber/CyberDashboard"));
const CyberAssessment = lazy(() => import("./pages/cyber/CyberAssessment"));
const CyberIncidentsPage = lazy(() => import("./pages/cyber/CyberIncidentsPage"));
const CyberIncidentReporting = lazy(() => import("./pages/cyber/CyberIncidentReporting"));
const CyberDocumentation = lazy(() => import("./pages/cyber/CyberDocumentation"));
const CyberIncidentDetail = lazy(() => import("./pages/cyber/CyberIncidentDetail"));


const AIGovernance = lazy(() => import("./pages/ai-governance/AIGovernance"));


const StartHere = lazy(() => import("./pages/StartHere"));
const EmployeeOnboarding = lazy(() => import("./pages/EmployeeOnboarding"));
const TrainingManagement = lazy(() => import("./pages/TrainingManagement"));

const UIPatternShowcase = lazy(() => import("./pages/UIPatternShowcase"));
const ConsolidatedRequestPortal = lazy(() => import("./pages/portal/ConsolidatedRequestPortal"));
const VendorAssessmentPortal = lazy(() => import("./pages/portal/VendorAssessmentPortal"));

// const Integrations = lazy(() => import("./pages/admin/Integrations"));
const OAuthCallback = lazy(() => import("./pages/oauth/Callback"));

const SecurityProjectsDashboard = lazy(() => import("./pages/projects/ProjectsDashboard").then(m => ({ default: m.ProjectsDashboard })));
const SecurityProjectDetail = lazy(() => import("./pages/projects/ProjectDetail").then(m => ({ default: m.ProjectDetail })));


// Unified Client Guard - Handles both Premium and Management checks
// This ensures that client data is fetched ONCE and shared across all guards
function UnifiedClientGuard({
  children,
  requirePremium = false,
  requireManagement = false
}: {
  children: React.ReactNode,
  requirePremium?: boolean,
  requireManagement?: boolean
}) {
  const { selectedClientId, setPlanTier, setUserRole, userRole: contextRole } = useClientContext();
  const [location] = useLocation();

  // Extract client ID from URL as fallback
  const urlClientMatch = location.match(/\/clients\/(\d+)/);
  const urlClientId = urlClientMatch ? parseInt(urlClientMatch[1], 10) : null;
  const effectiveClientId = selectedClientId || urlClientId;

  const { data: userMe, isLoading: userLoading } = trpc.users.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false
  });

  const { data: client, isLoading: clientLoading, error } = trpc.clients.get.useQuery(
    { id: effectiveClientId as number },
    {
      enabled: !!effectiveClientId,
      retry: false,
      staleTime: 1000 * 60 * 5,
      onSuccess: (data) => {
        if (data?.planTier) setPlanTier(data.planTier);
        if (data?.userRole) setUserRole(data.userRole);
      }
    }
  );

  useEffect(() => {
    if (userMe?.planTier && !client) setPlanTier(userMe.planTier);
  }, [userMe, setPlanTier, client]);

  if (error?.data?.code === 'PRECONDITION_FAILED') {
    return <Redirect to="/upgrade-required" />;
  }

  if (error?.data?.code === 'FORBIDDEN' || error?.data?.code === 'NOT_FOUND') {
    return <Redirect to="/clients" />;
  }

  if (userLoading || (!!effectiveClientId && clientLoading)) return <PageLoader />;

  const tier = client?.planTier || userMe?.planTier;
  const clientRole = client?.userRole || contextRole;
  const globalRole = userMe?.role;
  const isGlobalAdmin = globalRole === 'admin' || globalRole === 'owner' || globalRole === 'super_admin';

  // 1. Premium Check (if required)
  if (error) {
    console.error('[DEBUG UnifiedClientGuard] TRPC error:', error);
  }

  if (requirePremium) {
    const enabledInBuild = import.meta.env.VITE_ENABLE_PREMIUM !== 'false';
    const isPremium = tier === 'pro' || tier === 'enterprise' ||
      isGlobalAdmin ||
      clientRole === 'owner' || clientRole === 'admin';

    console.log('[DEBUG UnifiedClientGuard]', {
      requirePremium,
      enabledInBuild,
      isGlobalAdmin,
      isPremium,
      tier,
      clientRole,
      effectiveClientId,
      globalRole
    });

    if (!enabledInBuild && !isGlobalAdmin) {
      console.log('[DEBUG UnifiedClientGuard] Redirecting: !enabledInBuild && !isGlobalAdmin');
      return <Redirect to="/upgrade-required" />;
    }
    if (!isPremium) {
      console.log('[DEBUG UnifiedClientGuard] Redirecting: !isPremium');
      return <Redirect to="/upgrade-required" />;
    }
  }

  // 2. Management Check (if required)
  if (requireManagement) {
    const isAuthorized = isGlobalAdmin ||
      clientRole === 'owner' || clientRole === 'admin';

    if (!isAuthorized) return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}

// Legacy wrappers for backward compatibility (optional but kept for internal reuse)
function PremiumGuard({ children }: { children: React.ReactNode }) {
  return <UnifiedClientGuard requirePremium={true}>{children}</UnifiedClientGuard>;
}

function ManagementGuard({ children }: { children: React.ReactNode }) {
  return <UnifiedClientGuard requireManagement={true}>{children}</UnifiedClientGuard>;
}

// Wrapper for protected routes
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any> } & any) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    console.log("ProtectedRoute: No session, redirecting to login");
    return <Redirect to="/login" />;
  }

  console.log("ProtectedRoute: Session valid, rendering component");

  return <Component {...rest} />;
}

function ClientControlsAlias() {
  const { selectedClientId } = useClientContext();
  if (selectedClientId) return <Redirect to={`/clients/${selectedClientId}/controls`} />;
  return <Redirect to="/clients" />;
}

function ClientPoliciesAlias() {
  const { selectedClientId } = useClientContext();
  const currentSearch = window.location.search;
  if (selectedClientId) return <Redirect to={`/clients/${selectedClientId}/policies${currentSearch}`} />;
  return <Redirect to="/clients" />;
}

function RiskManagementAlias() {
  const { selectedClientId } = useClientContext();
  if (selectedClientId) return <Redirect to={`/clients/${selectedClientId}/risks`} />;
  return <Redirect to="/clients" />;
}

function RiskRegisterAlias() {
  const { selectedClientId } = useClientContext();
  const search = window.location.search;
  if (selectedClientId) return <Redirect to={`/clients/${selectedClientId}/risks/register${search}`} />;
  return <Redirect to="/clients" />;
}

function CriticalRisksAlias() {
  const { selectedClientId } = useClientContext();
  if (selectedClientId) return <Redirect to={`/clients/${selectedClientId}/risks/critical`} />;
  return <Redirect to="/clients" />;
}

function OverdueAssessmentsAlias() {
  const { selectedClientId } = useClientContext();
  if (selectedClientId) return <Redirect to={`/clients/${selectedClientId}/vendors/assessments/overdue`} />;
  return <Redirect to="/clients" />;
}

function EvidenceAlias() {
  const { selectedClientId } = useClientContext();
  const search = window.location.search;
  if (selectedClientId) return <Redirect to={`/clients/${selectedClientId}/evidence${search}`} />;
  return <Redirect to="/clients" />;
}

function GapAnalysisAlias() {
  const { selectedClientId } = useClientContext();
  if (selectedClientId) return <Redirect to={`/clients/${selectedClientId}/gap-analysis`} />;
  return <Redirect to="/clients" />;
}

function ComplianceDashboardAlias() {
  const { selectedClientId } = useClientContext();
  if (selectedClientId) return <Redirect to={`/clients/${selectedClientId}/compliance`} />;
  return <Redirect to="/clients" />;
}

function SAMMAlias() {
  const { selectedClientId } = useClientContext();
  if (selectedClientId) return <Redirect to={`/clients/${selectedClientId}/samm`} />;
  return <Redirect to="/clients" />;
}

function DevProjectsAlias() {
  const { selectedClientId } = useClientContext();
  if (selectedClientId) return <Redirect to={`/clients/${selectedClientId}/dev/projects`} />;
  return <Redirect to="/clients" />;
}

function ProjectsAlias() {
  const { selectedClientId } = useClientContext();
  if (selectedClientId) return <Redirect to={`/clients/${selectedClientId}/projects`} />;
  return <Redirect to="/clients" />;
}




function BusinessContinuityAlias() {
  const { selectedClientId } = useClientContext();
  const [location, setLocation] = useLocation();
  const params = useParams(); // Should capture :rest*

  if (selectedClientId) {
    // location includes the full path, e.g. /business-continuity/bia
    // We can just construct the new path.
    // But wait, if matches /business-continuity/:rest*, params.rest is 'bia' (maybe 'bia/')

    const rest = params.rest || '';
    // Clean leading slash if present in rest or needs adding
    const suffix = rest.startsWith('/') ? rest : `/${rest}`;

    // Handle case where rest is empty or undefined
    const finalSuffix = (rest === undefined || rest === '') ? '' : suffix;

    if (finalSuffix === '/overview') {
      // Handle specific case to avoid redirection loops or issues if needed, strictly mapping
      return <Redirect to={`/clients/${selectedClientId}/business-continuity/overview`} />;
    }

    return <Redirect to={`/clients/${selectedClientId}/business-continuity${finalSuffix}`} />;
  }
  return <Redirect to="/clients" />;
}


function CyberAlias() {
  const { selectedClientId } = useClientContext();
  const [location] = useLocation();

  if (selectedClientId) {
    // Extract the part after /cyber
    const cyberPath = location.replace(/^\/cyber/, '');
    return <Redirect to={`/clients/${selectedClientId}/cyber${cyberPath}`} />;
  }
  return <Redirect to="/clients" />;
}

function VendorsAlias() {
  const { selectedClientId } = useClientContext();
  const search = window.location.search;
  if (selectedClientId) return <Redirect to={`/clients/${selectedClientId}/vendors/overview${search}`} />;
  return <Redirect to="/clients" />;
}


function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}



function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public Routes */}
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignUpPage} />
        <Route path="/auth/redeem-link" component={RedeemLink} />
        <Route path="/auth/accept-invite" component={AcceptInvite} />

        {/* Privacy Assessments */}
        <Route path="/clients/:id/privacy/assessment/gdpr">
          {(_params) => <ProtectedRoute component={GdprAssessmentPage} />}
        </Route>
        <Route path="/clients/:id/privacy/assessment/ccpa">
          {(_params) => <ProtectedRoute component={CcpaAssessmentPage} />}
        </Route>
        <Route path="/complete-subscription">
          <ProtectedRoute component={CompleteSubscription} />
        </Route>
        <Route path="/upgrade-required">
          <ProtectedRoute component={UpgradeRequired} />
        </Route>
        <Route path="/auth/callback/jira">
          <ProtectedRoute component={OAuthCallback} />
        </Route>
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/update-password" component={UpdatePassword} />
        <Route path="/landing" component={Home} />
        <Route path="/managed-services" component={ManagedServicesPage} />
        <Route path="/waitlist" component={WaitlistPage} />
        <Route path="/respond-gap/:token" component={GapQuestionnaireResponse} />
        {/* Public Questionnaire Route */}
        <Route path="/questionnaire/:token" component={GapQuestionnaireResponse} />



        {/* Vendor Portals */}
        <Route path="/portal/request/:token" component={ConsolidatedRequestPortal} />
        <Route path="/portal/assessment/:token" component={VendorAssessmentPortal} />

        {/* Home/Landing Page - Public (shows landing for unauthenticated, dashboard links for authenticated) */}
        <Route path="/" component={Home} />
        <Route path="/dashboard">
          <ProtectedRoute component={Dashboard} />
        </Route>
        <Route path="/sales">
          {(_params) => <UnifiedClientGuard requirePremium><ProtectedRoute component={SalesDashboard} /></UnifiedClientGuard>}
        </Route>
        <Route path="/sales/waitlist">
          {(_params) => <UnifiedClientGuard requirePremium><ProtectedRoute component={WaitlistManagement} /></UnifiedClientGuard>}
        </Route>

        <Route path="/clients">
          <ProtectedRoute component={Clients} />
        </Route>
        <Route path="/clients/new">
          <ProtectedRoute component={ClientOnboarding} />
        </Route>
        <Route path="/clients/:id/governance/overview">
          {(_params) => <UnifiedClientGuard requirePremium><ProtectedRoute component={GovernanceDashboard} /></UnifiedClientGuard>}
        </Route>
        <Route path="/clients/:id/governance/workbench">
          {(_params) => <UnifiedClientGuard requirePremium><ProtectedRoute component={GovernanceWorkbench} /></UnifiedClientGuard>}
        </Route>
        <Route path="/clients/:id/governance/alignment-guide">
          <ProtectedRoute component={GovernanceAlignmentPage} />
        </Route>
        <Route path="/clients/:id/governance">
          {(_params) => <UnifiedClientGuard requirePremium><ProtectedRoute component={GovernanceDashboard} /></UnifiedClientGuard>}
        </Route>
        <Route path="/clients/:clientId/training/management">
          {(_params) => <UnifiedClientGuard requirePremium><ProtectedRoute component={TrainingManagement} /></UnifiedClientGuard>}
        </Route>
        <Route path="/clients/:id/personnel-compliance">
          {(_params) => <UnifiedClientGuard requirePremium requireManagement><ProtectedRoute component={PersonnelComplianceHub} /></UnifiedClientGuard>}
        </Route>
        <Route path="/clients/:id/compliance/overview">
          <ProtectedRoute component={ComplianceOverview} />
        </Route>
        <Route path="/clients/:id/compliance">
          <ProtectedRoute component={ClientCompliancePage} />
        </Route>
        <Route path="/clients/:id/knowledge-base">
          <ProtectedRoute component={KnowledgeBase} />
        </Route>
        <Route path="/clients/:id/questionnaires">
          {(_params) => <UnifiedClientGuard requirePremium><ProtectedRoute component={QuestionnairesDashboard} /></UnifiedClientGuard>}
        </Route>
        <Route path="/clients/:id/questionnaire-workspace">
          {(_params) => <UnifiedClientGuard requirePremium><ProtectedRoute component={QuestionnaireWorkspace} /></UnifiedClientGuard>}
        </Route>
        <Route path="/clients/:id/questionnaires/:qId">
          {(_params) => <UnifiedClientGuard requirePremium><ProtectedRoute component={QuestionnaireWorkspace} /></UnifiedClientGuard>}
        </Route>

        <Route path="/clients/:id/controls">
          {(_params) => <ProtectedRoute component={ClientControlsPage} />}
        </Route>
        <Route path="/clients/:id/metrics">
          {(_params) => <ProtectedRoute component={MetricsPage} />}
        </Route>
        <Route path="/clients/:id/marketplace">
          {(_params) => <ProtectedRoute component={FrameworkMarketplacePage} />}
        </Route>
        <Route path="/frameworks/studio">
          <ProtectedRoute component={FrameworkStudio} />
        </Route>
        <Route path="/clients/:id/policies">
          {(_params) => <ProtectedRoute component={ClientPoliciesPage} />}
        </Route>


        <Route path="/clients/:id/policies/:policyId">
          {(params) => <ProtectedRoute component={PolicyEditor} {...params} />}
        </Route>
        <Route path="/clients/:id/mappings">
          {(_params) => <ProtectedRoute component={Mappings} />}
        </Route>
        <Route path="/clients/:id/evidence/overview">
          {(_params) => <ProtectedRoute component={AssuranceOverview} />}
        </Route>
        <Route path="/clients/:id/samm">
          {(_params) => <ProtectedRoute component={SAMMV2View} />}
        </Route>
        <Route path="/clients/:id/essential-eight">
          {(_params) => <ProtectedRoute component={EssentialEightView} />}
        </Route>
        <Route path="/clients/:id/asvs">
          {(_params) => <ProtectedRoute component={ASVSView} />}
        </Route>
        <Route path="/clients/:id/assurance/:frameworkId">
          {(_params) => <ProtectedRoute component={FrameworkImplementationView} />}
        </Route>
        <Route path="/clients/:id/evidence">
          {(_params) => <ProtectedRoute component={Evidence} />}
        </Route>
        <Route path="/clients/:id/people">
          {(_params) => <ProtectedRoute component={PeoplePage} />}
        </Route>
        <Route path="/clients/:id/raci-matrix">
          {(_params) => <ProtectedRoute component={RACIMatrix} />}
        </Route>
        <Route path="/clients/:id/raci-matrix/unassigned">
          {(_params) => <ProtectedRoute component={UnassignedItems} />}
        </Route>
        <Route path="/clients/:id/calendar">
          {(_params) => <ProtectedRoute component={Calendar} />}
        </Route>

        <Route path="/implementation/resources">
          {(_params) => <ProtectedRoute component={ImplementationResources} />}
        </Route>
        {/* Management Sign-off and Readiness Tools */}
        <Route path="/clients/:id/management/sign-off">
          {(_params) => <ProtectedRoute component={ManagementSignOffPage} />}
        </Route>
        <Route path="/clients/:id/compliance-journey">
          {(_params) => <ProtectedRoute component={ComplianceJourneyDashboard} />}
        </Route>
        <Route path="/clients/:id/readiness/wizard/:standardId?">
          {(_params) => <ProtectedRoute component={ReadinessWizardPage} />}
        </Route>
        <Route path="/clients/:id/roadmap/dashboard">
          {(_params) => <ProtectedRoute component={RoadmapDashboard} />}
        </Route>
        <Route path="/clients/:id/roadmap/overview">
          {(_params) => <Redirect to={`/clients/${_params.id}/roadmap`} />}
        </Route>
        <Route path="/clients/:id/roadmap/create">
          {(_params) => <ProtectedRoute component={RoadmapCreatePage} />}
        </Route>
        <Route path="/clients/:id/roadmap/templates">
          {(_params) => <ProtectedRoute component={RoadmapTemplates} />}
        </Route>
        <Route path="/clients/:id/roadmap/reports">
          {(_params) => <Redirect to={`/clients/${_params.id}/reports`} />}
        </Route>
        <Route path="/clients/:id/roadmap/:roadmapId">
          {(_params) => <ProtectedRoute component={RoadmapDetailsPage} />}
        </Route>
        <Route path="/clients/:id/roadmap/:roadmapId/edit">
          {(_params) => <ProtectedRoute component={RoadmapEditPage} />}
        </Route>

        {/* Dev Projects routes */}
        <Route path="/projects">
          <ProjectsAlias />
        </Route>
        <Route path="/dev/projects">
          <DevProjectsAlias />
        </Route>
        <Route path="/clients/:clientId/dev/projects/:projectId/threat-model/:modelId">
          {(_params) => <UnifiedClientGuard requirePremium><ProtectedRoute component={ThreatModelWizard} /></UnifiedClientGuard>}
        </Route>
        <Route path="/clients/:clientId/dev/projects/:projectId">
          {(_params) => <ProtectedRoute component={ProjectDetail} />}
        </Route>
        <Route path="/clients/:clientId/dev/projects">
          {(_params) => <UnifiedClientGuard requirePremium><ProtectedRoute component={DevProjectsList} /></UnifiedClientGuard>}
        </Route>

        {/* General Security Projects routes */}
        <Route path="/clients/:id/projects">
          {(_params) => <ProtectedRoute component={SecurityProjectsDashboard} />}
        </Route>
        <Route path="/clients/:clientId/projects/:projectId">
          {(_params) => <ProtectedRoute component={SecurityProjectDetail} />}
        </Route>


        <Route path="/clients/:id/implementation">
          {(_params) => <ProtectedRoute component={ImplementationDashboard} />}
        </Route>
        <Route path="/clients/:id/implementation/dashboard">
          {(_params) => <ProtectedRoute component={ImplementationDashboard} />}
        </Route>
        <Route path="/clients/:id/implementation/create">
          {(_params) => <ProtectedRoute component={ImplementationCreate} />}
        </Route>
        <Route path="/clients/:id/implementation/plan/:planId">
          {(_params) => (
            <ProtectedRoute
              component={() => (
                <MultiFrameworkPlanView
                  planId={parseInt(_params.planId)}
                  clientId={parseInt(_params.id)}
                />
              )}
            />
          )}
        </Route>
        <Route path="/clients/:id/implementation/kanban/:planId">
          <ProtectedRoute component={ImplementationKanbanPage} />
        </Route>
        <Route path="/clients/:id/implementation/resources">
          {(_params) => <ProtectedRoute component={ImplementationResources} />}
        </Route>
        <Route path="/clients/:id/implementation/templates">
          {(_params) => <ProtectedRoute component={TemplateManager} />}
        </Route>

        {/* NIS2 Compliance Tools */}
        <Route path="/clients/:id/nis2/entity-classification">
          {(_params) => <ProtectedRoute component={NIS2EntityClassificationWizard} />}
        </Route>

        {/* Workflow Hub & Player */}
        <Route path="/clients/:id/workflows">
          {(_params) => <ProtectedRoute component={WorkflowsHub} />}
        </Route>
        <Route path="/clients/:id/workflows/:workflowId">
          {(_params) => <ProtectedRoute component={WorkflowPlayer} />}
        </Route>

        <Route path="/clients/:id/notifications">
          {(_params) => <ProtectedRoute component={Notifications} />}
        </Route>
        <Route path="/clients/:id/reports/:reportId">
          {(_params) => <ProtectedRoute component={ReportEditor} />}
        </Route>
        <Route path="/clients/:id/reports">
          {(_params) => <ProtectedRoute component={Reports} />}
        </Route>
        <Route path="/clients/:id/audit-hub">
          {(_params) => <UnifiedClientGuard requirePremium><ProtectedRoute component={AuditHub} /></UnifiedClientGuard>}
        </Route>
        <Route path="/clients/:id/employees/:employeeId">
          {(_params) => <ProtectedRoute component={EmployeeDetails} />}
        </Route>
        <Route path="/clients/:id/settings">
          {(_params) => <ProtectedRoute component={ClientSettings} />}
        </Route>
        <Route path="/clients/:id/activity">
          {(_params) => <ProtectedRoute component={ClientActivity} />}
        </Route>
        <Route path="/clients/:id/communication">
          {(_params) => <ProtectedRoute component={ClientEmail} />}
        </Route>
        <Route path="/clients/:id/tasks">
          {(_params) => <ProtectedRoute component={ClientTasksPage} />}
        </Route>
        <Route path="/clients/:id/audit-readiness">
          {(_params) => <ProtectedRoute component={AuditReadinessPage} />}
        </Route>
        <Route path="/clients/:id/auditor-portal">
          {(_params) => <ProtectedRoute component={AuditorChecklistPage} />}
        </Route>
        <Route path="/clients/:id/audit-readiness/alignment-guide">
          {(_params) => <ProtectedRoute component={AuditReadinessAlignmentPage} />}
        </Route>
        <Route path="/audit-readiness">
          <Redirect to="/dashboard" />
        </Route>
        {/* Redirect direct /communication access to dashboard since it requires client context */}
        <Route path="/communication">
          <Redirect to="/dashboard" />
        </Route>
        <Route path="/risk-register">
          <RiskRegisterAlias />
        </Route>
        <Route path="/risk-register/critical">
          <CriticalRisksAlias />
        </Route>
        <Route path="/evidence">
          <EvidenceAlias />
        </Route>
        <Route path="/clients/:id/risks/critical">
          {(_params) => <ProtectedRoute component={CriticalRisksPage} />}
        </Route>
        <Route path="/clients/:id/risks/register">
          {(_params) => <ProtectedRoute component={RiskRegisterPage} />}
        </Route>
        <Route path="/clients/:id/risks/framework">
          {(_params) => <ProtectedRoute component={RiskFramework} />}
        </Route>
        <Route path="/clients/:id/risks/assets">
          {(_params) => <ProtectedRoute component={RiskAssetsPage} />}
        </Route>
        <Route path="/clients/:id/risks/dashboard">
          {(_params) => <ProtectedRoute component={RiskDashboard} />}
        </Route>
        <Route path="/clients/:id/risks/report">
          {(_params) => <ProtectedRoute component={RiskReportList} />}
        </Route>
        <Route path="/clients/:id/risks/report/:reportId">
          {(_params) => <ProtectedRoute component={RiskReportEditor} />}
        </Route>
        <Route path="/clients/:id/risks/treatment-plan">
          {(_params) => <ProtectedRoute component={RiskTreatmentPlanPage} />}
        </Route>
        <Route path="/clients/:id/risks/overview">
          {(_params) => <ProtectedRoute component={RiskOverview} />}
        </Route>
        <Route path="/clients/:id/risks">
          {(_params) => <ProtectedRoute component={RiskDashboard} />}
        </Route>
        <Route path="/clients/:id/risks/adversary-intel">
          {(_params) => <PremiumGuard><ProtectedRoute component={AdversaryIntelPage} /></PremiumGuard>}
        </Route>
        <Route path="/clients/:id/risks/vulnerability-workbench">
          {(_params) => <PremiumGuard><ProtectedRoute component={VulnerabilityWorkbench} /></PremiumGuard>}
        </Route>
        <Route path="/clients/:id/vendors">
          {(_params) => <Redirect to={`/clients/${_params.id}/vendors/overview`} />}
        </Route>
        <Route path="/vendors">
          <VendorsAlias />
        </Route>
        <Route path="/vendors/assessments/overdue">
          <OverdueAssessmentsAlias />
        </Route>
        <Route path="/clients/:id/vendors/assessments/overdue">
          {(_params) => <ProtectedRoute component={OverdueAssessmentsPage} />}
        </Route>
        <Route path="/clients/:id/tprm">
          {(_params) => <Redirect to={`/clients/${_params.id}/vendors/overview`} />}
        </Route>
        <Route path="/clients/:id/vendors/overview-guide">
          {(_params) => <PremiumGuard><ProtectedRoute component={VendorOverview} /></PremiumGuard>}
        </Route>
        <Route path="/clients/:id/vendors/alignment-guide">
          {(_params) => <PremiumGuard><ProtectedRoute component={VendorAlignmentPage} /></PremiumGuard>}
        </Route>
        <Route path="/clients/:id/vendors/overview">
          {(_params) => (
            <PremiumGuard>
              <TPRMLayout clientId={parseInt(_params.id)}>
                <VendorDashboard />
              </TPRMLayout>
            </PremiumGuard>
          )}
        </Route>
        <Route path="/clients/:id/vendors/discovery">
          {(_params) => (
            <PremiumGuard>
              <TPRMLayout clientId={parseInt(_params.id)}>
                <VendorList mode="discovery" />
              </TPRMLayout>
            </PremiumGuard>
          )}
        </Route>
        <Route path="/clients/:id/vendors/reviews">
          {(_params) => (
            <PremiumGuard>
              <TPRMLayout clientId={parseInt(_params.id)}>
                <SecurityReviews />
              </TPRMLayout>
            </PremiumGuard>
          )}
        </Route>
        <Route path="/clients/:id/vendors/all">
          {(_params) => (
            <PremiumGuard>
              <TPRMLayout clientId={parseInt(_params.id)}>
                <VendorList mode="all" />
              </TPRMLayout>
            </PremiumGuard>
          )}
        </Route>
        <Route path="/clients/:id/vendors/catalog">
          {(_params) => (
            <PremiumGuard>
              <TPRMLayout clientId={parseInt(_params.id)}>
                <GlobalVendorCatalog />
              </TPRMLayout>
            </PremiumGuard>
          )}
        </Route>
        <Route path="/clients/:id/vendors/templates">
          {(_params) => (
            <PremiumGuard>
              <TPRMLayout clientId={parseInt(_params.id)}>
                <AssessmentTemplates />
              </TPRMLayout>
            </PremiumGuard>
          )}
        </Route>
        <Route path="/clients/:id/vendors/templates/new">
          {(_params) => (
            <PremiumGuard>
              <TPRMLayout clientId={parseInt(_params.id)}>
                <TemplateEditor />
              </TPRMLayout>
            </PremiumGuard>
          )}
        </Route>
        <Route path="/clients/:id/vendors/contracts">
          {(_params) => (
            <PremiumGuard>
              <TPRMLayout clientId={parseInt(_params.id)}>
                <ProtectedRoute component={VendorContractTemplates} />
              </TPRMLayout>
            </PremiumGuard>
          )}
        </Route>
        <Route path="/clients/:id/vendors/templates/:templateId">
          {(_params) => (
            <PremiumGuard>
              <TPRMLayout clientId={parseInt(_params.id)}>
                <TemplateEditor />
              </TPRMLayout>
            </PremiumGuard>
          )}
        </Route>
        <Route path="/clients/:id/vendors/onboard">
          {(_params) => (
            <PremiumGuard>
              <TPRMLayout clientId={parseInt(_params.id)}>
                <OnboardVendor />
              </TPRMLayout>
            </PremiumGuard>
          )}
        </Route>
        <Route path="/clients/:id/vendors/dpa-templates">
          {(_params) => (
            <PremiumGuard>
              <TPRMLayout clientId={parseInt(_params.id)}>
                <ProtectedRoute component={DPAManager} />
              </TPRMLayout>
            </PremiumGuard>
          )}
        </Route>
        <Route path="/clients/:id/ai-governance">
          {(_params) => <ProtectedRoute component={() => <PremiumGuard><AIGovernance /></PremiumGuard>} />}
        </Route>

        {/* Privacy routes are handled below in the dedicated section */}
        <Route path="/clients/:id/vendors/:vendorId">
          {(_params) => (
            <PremiumGuard>
              <TPRMLayout clientId={parseInt(_params.id)}>
                <VendorDetails />
              </TPRMLayout>
            </PremiumGuard>
          )}
        </Route>
        <Route path="/clients/:id/vendors/dpa-editor/:dpaId">
          {(_params) => (
            <PremiumGuard>
              <TPRMLayout clientId={parseInt(_params.id)}>
                <ProtectedRoute component={DPAEditor} />
              </TPRMLayout>
            </PremiumGuard>
          )}
        </Route>
        <Route path="/tprm/dpa-editor/:dpaId">
          {(_params) => (
            <PremiumGuard>
              <ProtectedRoute component={DPAEditor} />
            </PremiumGuard>
          )}
        </Route>
        <Route path="/clients/:id/evaluations/subprocessors">
          {(_params) => (
            <PremiumGuard>
              <TPRMLayout clientId={parseInt(_params.id)}>
                <SubprocessorRegister />
              </TPRMLayout>
            </PremiumGuard>
          )}
        </Route>
        <Route path="/clients/:id/risks/threats">
          {(_params) => <ProtectedRoute component={RiskThreatsPage} />}
        </Route>
        <Route path="/clients/:id/risks/vulnerabilities">
          {(_params) => <ProtectedRoute component={RiskVulnerabilitiesPage} />}
        </Route>
        <Route path="/clients/:id/risks/assessments">
          {(_params) => <ProtectedRoute component={RiskAssessmentsPage} />}
        </Route>
        <Route path="/clients/:clientId/risks/assessments/:assessmentId">
          {(_params) => <ProtectedRoute component={RiskAssessmentEditor} />}
        </Route>
        <Route path="/clients/:clientId/risks/vulnerabilities/:vulnerabilityId">
          {(_params) => <ProtectedRoute component={RiskVulnerabilityEditor} />}
        </Route>
        <Route path="/clients/:clientId/risks/assets/:assetId">
          {(_params) => <ProtectedRoute component={RiskAssetEditor} />}
        </Route>
        <Route path="/clients/:clientId/risks/threats/:threatId">
          {(_params) => <ProtectedRoute component={RiskThreatEditor} />}
        </Route>
        <Route path="/clients/:clientId/risks/guided">
          {(_params) => <ProtectedRoute component={GuidedRiskValidation} />}
        </Route>
        <Route path="/clients/:id/risks/alignment-guide">
          {(_params) => <ProtectedRoute component={RiskAlignmentPage} />}
        </Route>

        {/* Gap Analysis Routes */}
        <Route path="/clients/:id/gap-analysis">
          {(_params) => <ProtectedRoute component={GapAnalysisList} />}
        </Route>
        <Route path="/clients/:id/gap-analysis/new">
          {(_params) => <ProtectedRoute component={NewGapAnalysis} />}
        </Route>
        <Route path="/clients/:id/gap-analysis/:assessmentId">
          {(_params) => <ProtectedRoute component={GapAnalysisEditor} />}
        </Route>

        {/* ISO 27001 Readiness */}
        <Route path="/clients/:id/privacy/assessment/gdpr">
          {(params) => <GdprAssessmentPage />}
        </Route>
        <Route path="/clients/:id/readiness/wizard/:standardId?">
          {(_params) => <ProtectedRoute component={ReadinessWizardPage} />}
        </Route>
        <Route path="/clients/:id/readiness/roadmap">
          {(_params) => <ProtectedRoute component={RoadmapPage} />}
        </Route>
        <Route path="/clients/:id/roadmap/:roadmapId">
          {(_params) => <ProtectedRoute component={RoadmapDetailsPage} />}
        </Route>
        <Route path="/clients/:id/readiness/roadmap">
          {(_params) => <ProtectedRoute component={RoadmapPage} />}
        </Route>
        {/* Legacy redirect or alias if needed, keeping for robustness but user wants Strategic */}
        <Route path="/clients/:id/readiness/roadmap/:roadmapId">
          {(_params) => <Redirect to={`/clients/${_params.id}/roadmap/${_params.roadmapId}`} />}
        </Route>

        <Route path="/gap-analysis">
          <ProtectedRoute component={GapAnalysisAlias} />
        </Route>

        <Route path="/samm">
          <ProtectedRoute component={SAMMAlias} />
        </Route>

        {/* Federal Compliance Hub Routes */}
        <Route path="/clients/:id/federal/overview">
          {(_params) => <ProtectedRoute component={FederalOverview} />}
        </Route>
        <Route path="/clients/:id/federal">
          {(_params) => <ProtectedRoute component={FederalComplianceDashboard} />}
        </Route>

        <Route path="/clients/:id/compliance-obligations">
          {(_params) => <ProtectedRoute component={RegulationsDashboard} />}
        </Route>
        <Route path="/clients/:id/compliance-obligations/:regId">
          {(_params) => <ProtectedRoute component={RegulationDetail} />}
        </Route>
        <Route path="/clients/:id/federal/fips-199">
          {(_params) => <ProtectedRoute component={FipsCategorizationPage} />}
        </Route>
        <Route path="/clients/:id/federal/poam">
          {(_params) => <ProtectedRoute component={POAMTracker} />}
        </Route>
        <Route path="/clients/:id/federal/ssp-171">
          {(_params) => <ProtectedRoute component={SSPEditor} />}
        </Route>
        <Route path="/clients/:id/federal/ssp-172">
          {(_params) => <ProtectedRoute component={SSPEditor} />}
        </Route>
        <Route path="/clients/:id/federal/sar-171">
          {(_params) => <ProtectedRoute component={SARViewer} />}
        </Route>
        <Route path="/clients/:id/federal/sar-172">
          {(_params) => <ProtectedRoute component={SARViewer} />}
        </Route>
        {/* Generic SAR and SSP routes for simpler navigation */}
        <Route path="/clients/:id/federal/sar">
          {(_params) => <ProtectedRoute component={SARViewer} />}
        </Route>
        <Route path="/clients/:id/federal/ssp">
          {(_params) => <ProtectedRoute component={SSPEditor} />}
        </Route>
        <Route path="/clients/:id/federal/alignment-guide">
          {(_params) => <ProtectedRoute component={FederalAlignmentPage} />}
        </Route>

        {/* Privacy Routes */}
        <Route path="/clients/:id/privacy">
          {(_params) => (
            <PrivacyLayout clientId={parseInt(_params.id)}>
              <PrivacyDashboard />
            </PrivacyLayout>
          )}
        </Route>
        <Route path="/clients/:id/privacy/overview">
          {(_params) => (
            <PrivacyLayout clientId={parseInt(_params.id)}>
              <PrivacyOverview />
            </PrivacyLayout>
          )}
        </Route>
        <Route path="/clients/:id/privacy/inventory">
          {(_params) => (
            <PrivacyLayout clientId={parseInt(_params.id)}>
              <DataInventory />
            </PrivacyLayout>
          )}
        </Route>
        <Route path="/clients/:id/privacy/ropa">
          {(_params) => (
            <PrivacyLayout clientId={parseInt(_params.id)}>
              <ROPADashboard />
            </PrivacyLayout>
          )}
        </Route>
        <Route path="/clients/:id/privacy/dsar">
          {(_params) => (
            <PrivacyLayout clientId={parseInt(_params.id)}>
              <DSARManager />
            </PrivacyLayout>
          )}
        </Route>
        <Route path="/clients/:id/privacy/dsar/:dsarId">
          {(_params) => (
            <PrivacyLayout clientId={parseInt(_params.id)}>
              <DsarDetail />
            </PrivacyLayout>
          )}
        </Route>
        <Route path="/clients/:id/privacy/dpia">
          {(_params) => (
            <PrivacyLayout clientId={parseInt(_params.id)}>
              <DPIAManager />
            </PrivacyLayout>
          )}
        </Route>
        <Route path="/clients/:id/privacy/dpia/:dpiaId/questionnaire">
          {(_params) => (
            <PrivacyLayout clientId={parseInt(_params.id)}>
              <DPIAQuestionnaire />
            </PrivacyLayout>
          )}
        </Route>
        <Route path="/clients/:id/privacy/transfers">
          {(_params) => (
            <PrivacyLayout clientId={parseInt(_params.id)}>
              <TransferDashboard />
            </PrivacyLayout>
          )}
        </Route>
        <Route path="/clients/:id/privacy/transfers/:transferId">
          {(_params) => (
            <PrivacyLayout clientId={parseInt(_params.id)}>
              <TIAWorkspace />
            </PrivacyLayout>
          )}
        </Route>
        <Route path="/clients/:id/privacy/breaches">
          {(_params) => (
            <PrivacyLayout clientId={parseInt(_params.id)}>
              <DataBreachRegister />
            </PrivacyLayout>
          )}
        </Route>

        {/* Cyber Resilience Routes */}
        <Route path="/clients/:id/cyber/overview">
          {(_params) => <ProtectedRoute component={CyberOverview} />}
        </Route>
        <Route path="/clients/:id/cyber">
          {(_params) => <ProtectedRoute component={CyberDashboard} />}
        </Route>
        <Route path="/clients/:id/cyber/assessment">
          {(_params) => <ProtectedRoute component={CyberAssessment} />}
        </Route>
        <Route path="/clients/:id/cyber/incidents/new">
          {(_params) => <ProtectedRoute component={CyberIncidentReporting} />}
        </Route>
        <Route path="/clients/:id/cyber/incidents/:incidentId">
          {(_params) => <ProtectedRoute component={CyberIncidentDetail} />}
        </Route>
        <Route path="/clients/:id/cyber/incidents">
          {(_params) => <ProtectedRoute component={CyberIncidentsPage} />}
        </Route>
        <Route path="/clients/:id/cyber/documents">
          {(_params) => <ProtectedRoute component={CyberDocumentation} />}
        </Route>

        <Route path="/clients/:id/privacy/documents">
          {(_params) => <ProtectedRoute component={PrivacyDocsDashboard} />}
        </Route>

        {/* Reuse PolicyEditor but maybe wrapped or just passed ID. 
            PolicyEditor expects params :clientId and :policyId usually? 
            Let's check how PolicyEditor is used. 
            It is usually /clients/:clientId/policies/:policyId. 
            We can reuse it here mapping /clients/:id/privacy/documents/:policyId 
        */}
        <Route path="/clients/:id/privacy/documents/:policyId">
          {(_params) => (
            // We need to verify if PolicyEditor uses 'clientId' or 'id' param.
            // Looking at lazy import: const PolicyEditor = lazy(() => import("./pages/PolicyEditor"));
            // Let's assume it works if we match params or use standard route.
            // Actually PolicyEditor likely looks at specific URL pattern or params.
            // Let's just point to it.
            <ProtectedRoute component={PolicyEditor} />
          )}
        </Route>


        <Route path="/clients/:id/intake">
          {(_params) => (
            <PremiumGuard>
              <ProtectedRoute component={EvidenceIntakeBox} />
            </PremiumGuard>
          )}
        </Route>

        <Route path="/clients/:id/board-summary">
          {(_params) => <ProtectedRoute component={BoardSummaryPage} />}
        </Route>

        <Route path="/advisor/workbench">
          {(_params) => <PremiumGuard><ProtectedRoute component={AdvisorWorkbench} /></PremiumGuard>}
        </Route>

        {/* Generic client workspace route - redirect to governance dashboard */}
        <Route path="/clients/:id">
          {(_params) => <Redirect to={`/clients/${_params.id}/governance`} />}
        </Route>

        <Route path="/compliance">
          <ProtectedRoute component={ComplianceDashboardAlias} />
        </Route>



        <Route path="/client-controls">
          <ProtectedRoute component={ClientControlsAlias} />
        </Route>
        <Route path="/client-policies">
          <ProtectedRoute component={ClientPoliciesAlias} />
        </Route>
        <Route path="/risks">
          <ProtectedRoute component={RiskManagementAlias} />
        </Route>
        <Route path="/cyber/:rest*">
          <ProtectedRoute component={CyberAlias} />
        </Route>
        <Route path="/cyber/incidents/new">
          <ProtectedRoute component={CyberAlias} />
        </Route>
        <Route path="/cyber/incidents/:incidentId">
          <ProtectedRoute component={CyberAlias} />
        </Route>
        <Route path="/cyber/incidents">
          <ProtectedRoute component={CyberAlias} />
        </Route>
        <Route path="/cyber/assessment">
          <ProtectedRoute component={CyberAlias} />
        </Route>
        <Route path="/cyber/documents">
          <ProtectedRoute component={CyberAlias} />
        </Route>
        <Route path="/cyber">
          <ProtectedRoute component={CyberAlias} />
        </Route>

        <Route path="/controls">
          <ProtectedRoute component={Controls} />
        </Route>
        <Route path="/policy-templates">
          <ProtectedRoute component={PolicyTemplates} />
        </Route>

        <Route path="/mappings">
          <ProtectedRoute component={Mappings} />
        </Route>
        <Route path="/settings">
          <Redirect to="/settings/security" />
        </Route>
        <Route path="/settings/users">
          <ProtectedRoute component={UserManagement} />
        </Route>
        <Route path="/settings/organization">
          <ProtectedRoute component={OrganizationManagement} />
        </Route>
        <Route path="/settings/onboarding">
          <ProtectedRoute component={OnboardingSettings} />
        </Route>
        <Route path="/settings/security">
          <ProtectedRoute component={SecuritySettings} />
        </Route>
        <Route path="/settings/invitations">
          <ProtectedRoute component={UserInvitations} />
        </Route>
        <Route path="/evidence">
          <ProtectedRoute component={Evidence} />
        </Route>
        <Route path="/calendar">
          <ProtectedRoute component={Calendar} />
        </Route>
        <Route path="/notifications">
          <ProtectedRoute component={Notifications} />
        </Route>
        <Route path="/profile">
          <ProtectedRoute component={Profile} />
        </Route>

        <Route path="/onboarding">
          <ProtectedRoute component={EmployeeOnboarding} />
        </Route>

        <Route path="/admin/crm/:id">
          <AdminLayout>
            <ProtectedRoute component={ContactDetail} />
          </AdminLayout>
        </Route>
        <Route path="/admin/crm">
          <AdminLayout>
            <ProtectedRoute component={GlobalCRM} />
          </AdminLayout>
        </Route>


        {/* Admin Routes */}
        <Route path="/admin/:rest*">
          <AdminLayout>
            <Switch>
              <Route path="/admin/organizations" component={() => <ProtectedRoute component={OrganizationManagement} />} />
              <Route path="/admin/user-management" component={() => <ProtectedRoute component={UserManagement} />} />
              <Route path="/admin/invitations" component={() => <ProtectedRoute component={UserInvitations} />} />
              <Route path="/admin/audit" component={() => <ProtectedRoute component={AuditLogs} />} />
              <Route path="/admin/llm" component={() => <ProtectedRoute component={LLMSettings} />} />
              {/* <Route path="/admin/cloud" component={() => <ProtectedRoute component={CloudIntegrations} />} /> */}
              <Route path="/admin/billing" component={() => <ProtectedRoute component={AdminBilling} />} />
              <Route path="/admin/issue-tracker" component={() => <ProtectedRoute component={IssueTrackerSettings} />} />
              {/* <Route path="/admin/integrations" component={() => <ProtectedRoute component={Integrations} />} /> */}

              {/* Default admin route */}
              <Route path="/admin" component={() => <ProtectedRoute component={UserManagement} />} />
            </Switch>
          </AdminLayout>
        </Route>

        {/* Business Continuity Routes */}
        <Route path="/business-continuity">
          <ProtectedRoute component={BusinessContinuityAlias} />
        </Route>
        <Route path="/business-continuity/:rest*">
          <ProtectedRoute component={BusinessContinuityAlias} />
        </Route>

        <Route path="/clients/:id/business-continuity">
          {(_params) => <ProtectedRoute component={BusinessContinuityDashboard} />}
        </Route>
        <Route path="/clients/:id/business-continuity/governance">
          {(_params) => <ProtectedRoute component={BCGovernancePage} />}
        </Route>
        <Route path="/clients/:id/business-continuity/bia">
          {(_params) => <ProtectedRoute component={BusinessImpactAnalysisPage} />}
        </Route>
        <Route path="/clients/:id/business-continuity/bia/:biaId">
          {(_params) => <ProtectedRoute component={BusinessImpactAnalysisEditor} />}
        </Route>
        <Route path="/clients/:id/business-continuity/strategies">
          {(_params) => <ProtectedRoute component={BusinessContinuityStrategiesPage} />}
        </Route>
        <Route path="/clients/:id/business-continuity/plans">
          {(_params) => <ProtectedRoute component={BusinessContinuityPlansPage} />}
        </Route>
        <Route path="/clients/:id/business-continuity/plans/new">
          {(_params) => <ProtectedRoute component={RecoveryPlanBuilder} />}
        </Route>
        <Route path="/clients/:id/business-continuity/plans/:planId">
          {(_params) => <ProtectedRoute component={BCPlanManager} />}
        </Route>
        <Route path="/clients/:id/business-continuity/call-tree">
          {(_params) => <ProtectedRoute component={CallTreeManager} />}
        </Route>
        <Route path="/clients/:id/business-continuity/exercises">
          {(_params) => <ProtectedRoute component={BCExercisesPage} />}
        </Route>
        <Route path="/clients/:id/business-continuity/training">
          {(_params) => <ProtectedRoute component={BCTrainingPage} />}
        </Route>
        <Route path="/clients/:id/business-continuity/processes">
          {(_params) => <ProtectedRoute component={ProcessRegistry} />}
        </Route>
        <Route path="/clients/:id/business-continuity/processes/:action">
          {(_params) => <ProtectedRoute component={ProcessBuilder} />}
        </Route>
        <Route path="/clients/:id/business-continuity/scenarios">
          {(_params) => <ProtectedRoute component={DisruptiveScenariosPage} />}
        </Route>
        <Route path="/clients/:id/business-continuity/scenarios/:scenarioId">
          {(_params) => <ProtectedRoute component={DisruptiveScenarioEditor} />}
        </Route>
        <Route path="/clients/:id/business-continuity/wizard">
          {(_params) => <ProtectedRoute component={TotalBcpWizard} />}
        </Route>
        <Route path="/clients/:id/business-continuity/new-project">
          {(_params) => <ProtectedRoute component={BCPProjectWizard} />}
        </Route>
        <Route path="/clients/:id/business-continuity/tasks">
          {(_params) => <ProtectedRoute component={TasksDashboard} />}
        </Route>

        <Route path="/clients/:id/business-continuity/iso22301">
          {(_params) => <ProtectedRoute component={ISO22301CompliancePage} />}
        </Route>

        {/* Workflows & Playbooks */}
        <Route path="/clients/:id/workflows">
          {(_params) => <ProtectedRoute component={WorkflowsHub} />}
        </Route>
        <Route path="/clients/:id/workflows/:workflowId">
          {(_params) => <ProtectedRoute component={WorkflowPlayer} />}
        </Route>

        {/* Learning Zone */}
        <Route path="/learning/iso-27001/checklist">
          {(_params) => <ProtectedRoute component={ISO27001ReadinessChecklist} />}
        </Route>
        <Route path="/learning">
          <ProtectedRoute component={LearningPage} />
        </Route>
        <Route path="/learning/:frameworkId">
          <ProtectedRoute component={LearningPage} />
        </Route>

        {/* Onboarding */}
        <Route path="/start-here">
          <ProtectedRoute component={StartHere} />
        </Route>

        {/* UI Pattern Showcase */}
        <Route path="/ui-showcase">
          <ProtectedRoute component={UIPatternShowcase} />
        </Route>

        {/* Compliance Obligations */}


        <Route path="/frameworks/:id">
          <ProtectedRoute component={FrameworkDetails} />
        </Route>
        <Route path="/frameworks">
          <ProtectedRoute component={FrameworksDashboard} />
        </Route>

        {/* Route Aliases for better UX */}
        <Route path="/people">
          <ProtectedRoute component={() => {
            const { selectedClientId } = useClientContext();
            return selectedClientId ? <Redirect to={`/clients/${selectedClientId}/people`} /> : <Redirect to="/clients" />;
          }} />
        </Route>
        <Route path="/raci-matrix">
          <ProtectedRoute component={() => {
            const { selectedClientId } = useClientContext();
            return selectedClientId ? <Redirect to={`/clients/${selectedClientId}/raci-matrix`} /> : <Redirect to="/clients" />;
          }} />
        </Route>

        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrandingProvider>
        <AuthProvider>
          <ClientContextProvider>
            <AdvisorProvider>
              <ThemeProvider defaultTheme="light">
                <TooltipProvider>
                  <Toaster />
                  <GDPRBanner />
                  <Router />
                </TooltipProvider>
              </ThemeProvider>
            </AdvisorProvider>
          </ClientContextProvider>
        </AuthProvider>
      </BrandingProvider>
    </ErrorBoundary>
  );
}

export default App;
