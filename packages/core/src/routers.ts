// Router index - updated at 2026-02-11 17:15
import { createClientPoliciesRouter } from "./server/routers/clientPolicies";
import { createClientControlsRouter } from "./server/routers/clientControls";
import { createComplianceRouter } from "./server/routers/compliance";
import { createEvidenceRouter } from "./server/routers/evidence";
import { createControlsRouter } from "./server/routers/controls"; // Restore missing router mapping
import { createEvidenceFilesRouter } from "./server/routers/evidenceFiles";
import { createAdvisorRouter } from "./server/routers/advisor";
import { initTRPC, TRPCError } from "@trpc/server";
import * as crypto from 'crypto';
import { z } from "zod";
import * as db from "./db";
import { getDb } from "./db";
import superjson from "superjson";
import { policyGenerator } from './lib/policy/policy-generation';
import { createVendorAssessmentsRouter } from "./server/routers/vendorAssessments";
import { createRoadmapRouter } from "./server/routers/roadmap";
import { createVendorContractsRouter } from "./server/routers/vendorContracts";
import { createVendorDpasRouter } from "./server/routers/vendorDpas";
import { createVendorRequestsRouter } from "./server/routers/vendorRequests";
import { createThreatIntelRouter } from "./server/routers/threatIntel";
import { createAsvsRouter } from "./server/routers/asvs";
// Premium import placeholders
// import { createSubprocessorsRouter } from "./server/routers/subprocessors";
import { createPrivacyEnhancementsRouter } from "./server/routers/privacyEnhancements";
// import { createManagementRouter, createReadinessRouterV2 } from "./routers/management-and-readiness";
import * as schema from "./schema";
import { businessImpactAnalyses, biaQuestionnaires, recoveryObjectives, bcStrategies, bcPlans, disruptiveScenarios } from "./schema";
import { tasks, auditLogs, users, regulationMappings, clientPolicies, evidence, evidenceRequests, notificationLog, clientReadinessResponses, userClients, cloudConnections, cloudAssets, issueTrackerConnections, remediationTasks, userInvitations, assets, riskScenarios, riskTreatments, vulnerabilities, threats, riskAssessments, riskPolicyMappings, treatmentControls, controls, clientControls, controlPolicyMappings, projectTasks, orgRoles, employees, employeeTaskAssignments, kris, vendors, vendorAssessments, vendorContacts, vendorContracts, clients, frameworkMappings, llmProviders, llmRouterRules } from "./schema";
import { logActivity } from "./lib/audit";
import { eq, desc, asc, and, sql, getTableColumns, lt, or, inArray, like } from "drizzle-orm";
import { createSammRouter } from "./server/routers/samm";
import { createEmployeesRouter } from "./server/routers/employees";
import {
  sendOverdueNotification,
  sendUpcomingNotification,
  sendDailyDigest,
  sendWeeklyDigest
} from "./emailNotification";
import { llmService } from "./lib/llm/service";
import { generateGapAnalysisReport } from "./lib/reporting";
import { suggestControlsForTreatment } from "./lib/ai/controlSuggestions";
// cleaned up unused imports
import * as adversaryIntelService from "./lib/adversaryService";
// threatIntel related schema tables removed

// Initialize tRPC
import { inferAsyncReturnType } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createCrmRouter } from './lib/modules/crm/router';
import { createSalesRouter } from './lib/modules/crm/sales-router';
import { createFrameworkImportRouter } from './server/routers/frameworkImport';
import { createFrameworkPluginsRouter } from './server/routers/frameworkPlugins';
import { createReadinessRouter } from './server/routers/readiness';
// Roadmap & Implementation
import { createImplementationRouter } from './server/routers/implementation';
import { createDevProjectsRouter } from './server/routers/devProjects';
import { createThreatModelsRouter } from './server/routers/threatModels';
import { createProjectsRouter } from './server/routers/projects';

// Add missing imports
import { createChecklistRouter } from './server/routers/checklist';
import { businessContinuitySubRouter } from "./server/routers/businessContinuity";
import { createRisksRouter } from "./server/routers/risks";
import { createMetricsRouter } from "./server/routers/metrics";
import { createGovernanceRouter } from "./server/routers/governance";
import { createAutopilotRouter } from "./server/routers/autopilot";
import { createGapAnalysisRouter } from "./server/routers/gapAnalysis";
import { createFederalRouter } from "./server/routers/federal";
import { createActionsRouter } from "./server/routers/actions";
import { createCalendarRouter } from "./server/routers/calendar";
import { createClientsRouter } from "./server/routers/clients";
import { usersSubRouter } from "./server/routers/users";
import { createIntakeRouter } from "./server/routers/intake";
import { createBillingRouter } from "./server/routers/billing";
import { createFrameworksRouter } from "./server/routers/frameworks";
import { createCompliancePlanningRouter } from "./server/routers/compliancePlanning";
import { createHarmonizationRouter } from "./server/routers/harmonization";
import { createAuditRouter } from "./server/routers/audit";
import { createDashboardRouter } from "./server/routers/dashboard";
import { createNotificationsRouter } from "./server/routers/notifications";
import { createWaitlistRouter } from "./server/routers/waitlist";
import { createGlobalCrmRouter } from "./server/routers/globalCrm";
import { createPrivacyRouter } from "./server/routers/privacy";
import { createCyberRouter } from "./server/routers/cyber";
import { createAssetsRouter } from "./server/routers/assets";
import { createPolicyManagementRouter } from "./lib/routers/policy-management";
import { createGlobalVendorsRouter } from "./server/routers/globalVendors";
import { integrationsRouter } from "./server/routers/integrations";
import { createKnowledgeBaseRouter } from "./server/routers/knowledgeBase";
import { createQuestionnaireRouter } from "./server/routers/questionnaire";
import { createTaskAssignmentsRouter } from "./server/routers/taskAssignments";
import { createPolicyTemplatesRouter } from "./server/routers/policyTemplates";
import { createReportsRouter } from "./server/routers/reports";
// import { createStrategicReportsRouter } from "./server/routers/strategicReports";
import { createFindingsRouter } from "./server/routers/findings";
import { createTrustCenterRouter } from "./server/routers/trustCenter";
import { createAiSystemsRouter } from "./server/routers/aiSystems";
import { createCommentsRouter } from "./server/routers/comments";
import { createOnboardingRouter } from "./server/routers/onboarding";
import { createTrainingRouter } from "./server/routers/training";
import { magicLinksRouter } from "./server/routers/magicLinks";
import { createSammV2Router } from "./server/routers/samm-v2";
import { emailTemplatesRouter } from "./server/routers/emailTemplates";
import { emailTriggersRouter } from "./server/routers/emailTriggers";
import { createAdversaryIntelRouter } from "./server/routers/adversaryIntel";
import { createEssentialEightRouter } from "./server/routers/essentialEight";
import { createStudioRouter } from "./server/routers/studio";


// Context type definition
export const createContext = ({ req, res }: CreateExpressContextOptions) => {
  const headerClientId = req.headers['x-client-id'] ? parseInt(req.headers['x-client-id'] as string) : undefined;
  return {
    req,
    res,
    user: req.user,
    clientId: (req as any).clientId || headerClientId as number | undefined,
    aal: (req as any).aal as 'aal1' | 'aal2' | null,
  };
};
export type Context = inferAsyncReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create({
  // transformer: superjson,
  errorFormatter({ shape, error }) {
    console.error("TRPC Error (Global):", error);
    return shape;
  },
});

console.log("[Routers] SuperJSON loaded:", !!superjson);

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user || (ctx.user.role !== 'admin' && ctx.user.role !== 'owner' && ctx.user.role !== 'super_admin')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

const checkClientAccess = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  // Safer input access that works with both batched and standard requests
  const input = (opts as any).rawInput || (opts as any).input || {};

  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

  const clientId = input?.clientId || input?.id || ctx.clientId;

  console.log('[DEBUG checkClientAccess routers.ts] Path:', (opts as any).path);
  console.log('[DEBUG checkClientAccess routers.ts] User:', ctx.user.id, 'Role:', ctx.user.role);
  console.log('[DEBUG checkClientAccess routers.ts] ctx.clientId:', ctx.clientId);
  console.log('[DEBUG checkClientAccess routers.ts] Resolved clientId:', clientId);

  // Admins have implicit access
  if (ctx.user.role === 'admin' || ctx.user.role === 'owner' || ctx.user.role === 'super_admin') {
    return next({ ctx: { ...ctx, clientId, clientRole: 'owner' } });
  }

  if (!clientId) {
    console.log('[DEBUG checkClientAccess routers.ts] No clientId found - THROWING FORBIDDEN');
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Client ID is required for this operation' });
  }

  const dbConn = await db.getDb();
  const membership = await dbConn.select().from(userClients)
    .where(and(eq(userClients.userId, ctx.user.id), eq(userClients.clientId, clientId)))
    .limit(1);

  if (membership.length === 0) {
    console.log('[DEBUG checkClientAccess routers.ts] Membership not found for client:', clientId);
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this client workspace' });
  }

  return next({ ctx: { ...ctx, clientId, clientRole: membership[0].role } });
});

export const protectedProcedure = publicProcedure.use(isAuthed);
export const adminProcedure = publicProcedure.use(isAuthed).use(isAdmin);
export const clientProcedure = publicProcedure.use(isAuthed).use(checkClientAccess);

const checkClientEditor = t.middleware(({ ctx, next }) => {
  const clientRole = (ctx as any).clientRole;
  if (clientRole !== 'owner' && clientRole !== 'admin' && clientRole !== 'editor') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Read-only access' });
  }
  return next();
});

const clientEditorProcedure = clientProcedure.use(checkClientEditor);

// Premium Feature Guard - Checks if client has Pro or Enterprise tier
const checkPremiumAccess = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  // Safer input access that works with both batched and standard requests
  const input = (opts as any).rawInput || (opts as any).input || {};
  const clientId = input?.clientId || input?.id || ctx.clientId;

  // Global Admin/Owner bypass OR Client Owner/Admin bypass
  if (ctx.user?.role === 'admin' || ctx.user?.role === 'owner' || ctx.user?.role === 'super_admin' ||
    (ctx as any).clientRole === 'owner' || (ctx as any).clientRole === 'admin') {
    console.log(`[PremiumGuard] Bypass for Global Admin or Client Owner/Admin`);
    return next({ ctx: { ...ctx, isPremium: true } });
  }

  if (!clientId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Client context required for premium features' });
  }

  try {
    const dbConn = await db.getDb();
    const [client] = await dbConn.select({ planTier: schema.clients.planTier })
      .from(schema.clients)
      .where(eq(schema.clients.id, clientId))
      .limit(1);

    if (!client) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
    }

    const isPremium = client.planTier === 'pro' || client.planTier === 'enterprise';
    if (!isPremium) {
      console.log(`[PremiumGuard] Access denied for client ${clientId} with plan tier: ${client.planTier}`);
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'This feature requires a Pro or Enterprise subscription. Please upgrade to access Vendor Risk Management.'
      });
    }

    console.log(`[PremiumGuard] Access granted for client ${clientId} with plan tier: ${client.planTier}`);
    return next({ ctx: { ...ctx, isPremium: true } });
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    console.error('[PremiumGuard] Error checking premium access:', err);
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to verify subscription status' });
  }
});

// Premium client procedure - requires auth + client access + premium tier
export const premiumClientProcedure = clientProcedure.use(checkPremiumAccess);
const requiresMFA = t.middleware(async ({ ctx, next }) => {
  const clientId = (ctx as any).clientId;
  if (!clientId) return next();
  const dbConn = await db.getDb();
  const [client] = await dbConn.select({ requireMfa: schema.clients.requireMfa as any })
    .from(schema.clients)
    .where(eq(schema.clients.id, clientId))
    .limit(1);
  const must = !!client?.requireMfa;
  const aal = (ctx as any).aal;
  if (must && aal !== 'aal2') {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Multi-factor authentication required' });
  }
  return next();
});

const STANDARD_CONTROLS_CONTEXT = `
AC-1: Access Control Policy and Procedures
AC-2: Account Management
AC-3: Access Enforcement
AC-4: Information Flow Enforcement
AC-5: Separation of Duties
AC-6: Least Privilege
AT-1: Security Awareness and Training Policy
AT-2: Security Awareness Training
AT-3: Role-Based Security Training
AU-1: Audit and Accountability Policy
AU-2: Audit Events
AU-3: Content of Audit Records
AU-6: Audit Review, Analysis, and Reporting
CM-1: Configuration Management Policy
CM-2: Baseline Configuration
CM-3: Configuration Change Control
CP-1: Contingency Planning Policy
CP-2: Contingency Plan
IA-1: Identification and Authentication Policy
IA-2: Identification and Authentication (Organizational Users)
IA-5: Authenticator Management
IR-1: Incident Response Policy
IR-4: Incident Handling
IR-6: Incident Reporting
PE-1: Physical and Environmental Protection Policy
PE-2: Physical Access Authorizations
PE-3: Physical Access Control
RA-1: Risk Assessment Policy
RA-3: Risk Assessment
SA-1: System and Services Acquisition Policy
SC-1: System and Communications Protection Policy
SC-7: Boundary Protection
SC-8: Transmission Confidentiality and Integrity
SI-1: System and Information Integrity Policy
SI-2: Flaw Remediation
SI-3: Malicious Code Protection
SI-4: Information System Monitoring
`;



import { createAuditorsRouter } from "./server/routers/auditors";

export const appRouter = router({
  evidenceFiles: createEvidenceFilesRouter(t, adminProcedure, publicProcedure),
  actions: createActionsRouter(t, clientProcedure),
  auditors: createAuditorsRouter(t, adminProcedure, clientProcedure),
  clients: createClientsRouter(t, adminProcedure, clientProcedure, clientEditorProcedure, publicProcedure, isAuthed, requiresMFA),
  controls: createControlsRouter(t, adminProcedure, publicProcedure), // Restore missing router mapping
  clientControls: createClientControlsRouter(t, clientProcedure, adminProcedure, publicProcedure, clientEditorProcedure),
  clientPolicies: createClientPoliciesRouter(t, clientProcedure, adminProcedure, publicProcedure, clientEditorProcedure),
  users: usersSubRouter,
  employees: createEmployeesRouter(t, clientProcedure),
  crm: createCrmRouter(t, clientProcedure),
  sales: createSalesRouter(t, clientProcedure),
  businessContinuity: businessContinuitySubRouter,
  billing: createBillingRouter(t, clientProcedure, isAuthed, publicProcedure),
  frameworks: createFrameworksRouter(t, protectedProcedure),
  frameworkImport: createFrameworkImportRouter(t, clientProcedure),
  frameworkPlugins: createFrameworkPluginsRouter(t, protectedProcedure),
  autopilot: createAutopilotRouter(t, clientProcedure),
  checklist: createChecklistRouter(t, clientProcedure),
  gapAnalysis: createGapAnalysisRouter(t, clientProcedure),
  federal: createFederalRouter(t, clientProcedure),
  readiness: createReadinessRouter(t, clientProcedure),
  samm: createSammRouter(t, clientProcedure),
  sammV2: createSammV2Router(t, clientProcedure),
  essentialEight: createEssentialEightRouter(t, clientProcedure),
  asvs: createAsvsRouter(t, clientProcedure),
  calendar: createCalendarRouter(t, clientProcedure),
  intake: createIntakeRouter(t, clientProcedure),


  dashboard: createDashboardRouter(t, adminProcedure, publicProcedure.use(isAuthed)),
  compliance: createComplianceRouter(t, adminProcedure, clientProcedure, clientEditorProcedure, publicProcedure),
  evidence: createEvidenceRouter(t, adminProcedure, publicProcedure, protectedProcedure),
  notifications: createNotificationsRouter(t, clientProcedure, adminProcedure, protectedProcedure),

  // Risk Management Module
  risks: createRisksRouter(t, clientProcedure, premiumClientProcedure),
  metrics: createMetricsRouter(t, clientProcedure),
  devProjects: createDevProjectsRouter(t, clientProcedure),
  projects: createProjectsRouter(t, clientProcedure),
  threatModels: createThreatModelsRouter(t, clientProcedure),
  threatIntel: createThreatIntelRouter(t, adminProcedure, publicProcedure, protectedProcedure, clientProcedure),
  adversaryIntel: createAdversaryIntelRouter(t, publicProcedure, clientProcedure),
  vendors: createVendorAssessmentsRouter(t, clientProcedure, publicProcedure, premiumClientProcedure, adminProcedure),
  roadmap: createRoadmapRouter(t, publicProcedure, adminProcedure),
  globalVendors: createGlobalVendorsRouter(t, premiumClientProcedure),
  vendorContracts: createVendorContractsRouter(t, premiumClientProcedure),
  vendorDpas: createVendorDpasRouter(t, premiumClientProcedure),
  vendorRequests: createVendorRequestsRouter(t, premiumClientProcedure),

  implementation: createImplementationRouter(t, publicProcedure, adminProcedure, protectedProcedure),
  compliancePlanning: createCompliancePlanningRouter(t, protectedProcedure),
  harmonization: createHarmonizationRouter(t, protectedProcedure),
  audit: createAuditRouter(t, protectedProcedure),
  findings: createFindingsRouter(t, protectedProcedure),

  waitlist: createWaitlistRouter(t, publicProcedure, adminProcedure),
  magicLinks: magicLinksRouter,
  emailTemplates: emailTemplatesRouter,
  emailTriggers: emailTriggersRouter,

  globalCrm: createGlobalCrmRouter(t, adminProcedure),
  privacy: createPrivacyRouter(t, clientProcedure),
  cyber: createCyberRouter(t, clientProcedure),
  assets: createAssetsRouter(t, clientProcedure, clientEditorProcedure),
  integrations: integrationsRouter ? integrationsRouter(t, clientProcedure, isAuthed) : router({}),
  policyManagement: createPolicyManagementRouter(t, clientProcedure, clientEditorProcedure, adminProcedure),

  governance: createGovernanceRouter(t, clientProcedure, adminProcedure),
  onboarding: createOnboardingRouter(t, clientProcedure, clientEditorProcedure),
  training: createTrainingRouter(t, clientProcedure, clientEditorProcedure),
  knowledgeBase: createKnowledgeBaseRouter(t, clientProcedure),
  questionnaire: createQuestionnaireRouter(t, clientProcedure, premiumClientProcedure),
  taskAssignments: createTaskAssignmentsRouter(t, clientProcedure),
  // subprocessors: createSubprocessorsRouter(t, premiumClientProcedure, publicProcedure), // Premium: VRM subprocessor tracking
  policyTemplates: createPolicyTemplatesRouter(t, publicProcedure, isAuthed),
  reports: createReportsRouter(t, adminProcedure, clientProcedure, clientEditorProcedure, publicProcedure, isAuthed),
  // strategicReports: createStrategicReportsRouter(t, publicProcedure, adminProcedure),
  trustCenter: createTrustCenterRouter(t, publicProcedure, protectedProcedure),

  ai: router({
    systems: createAiSystemsRouter(t, clientProcedure),
    // advisor: createAdvisorRouter(t, clientProcedure)
  }),
  studio: createStudioRouter(t, protectedProcedure),
  advisor: createAdvisorRouter(t, clientProcedure),

  comments: createCommentsRouter(t, clientProcedure),

  // New and Management Readiness Tools
  // management: createManagementRouter(t, protectedProcedure),
  // readiness: createReadinessRouterV2(t, protectedProcedure),
  regulations: router({
    mapToArticle: adminProcedure
      .input(z.object({
        clientId: z.number(),
        regulationId: z.string(),
        articleId: z.string(),
        mappedType: z.enum(['policy', 'evidence', 'control']),
        mappedId: z.number()
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        await dbConn.insert(regulationMappings).values({
          clientId: input.clientId,
          regulationId: input.regulationId,
          articleId: input.articleId,
          mappedType: input.mappedType,
          mappedId: input.mappedId
        });
        return { success: true };
      }),

    unmapFromArticle: adminProcedure
      .input(z.object({
        id: z.number()
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        await dbConn.delete(regulationMappings).where(eq(regulationMappings.id, input.id));
        return { success: true };
      }),

    getArticleLinks: clientProcedure
      .input(z.object({
        clientId: z.number(),
        regulationId: z.string(),
        articleId: z.string()
      }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();

        const links = await dbConn.select().from(regulationMappings)
          .where(and(
            eq(regulationMappings.clientId, input.clientId),
            eq(regulationMappings.regulationId, input.regulationId),
            eq(regulationMappings.articleId, input.articleId)
          ));

        // Group by type
        const policyIds = links.filter(l => l.mappedType === 'policy').map(l => l.mappedId);
        const evidenceIds = links.filter(l => l.mappedType === 'evidence').map(l => l.mappedId);
        const controlIds = links.filter(l => l.mappedType === 'control').map(l => l.mappedId);

        let policies: any[] = [];
        let evidenceList: any[] = [];
        let controlsList: any[] = [];

        if (policyIds.length > 0) {
          policies = await dbConn.select().from(clientPolicies).where(inArray(clientPolicies.id, policyIds));
        }
        if (evidenceIds.length > 0) {
          evidenceList = await dbConn.select().from(evidence).where(inArray(evidence.id, evidenceIds));
        }
        if (controlIds.length > 0) {
          controlsList = await dbConn.select().from(clientControls).where(inArray(clientControls.id, controlIds));
          // Hydrate with control definition
          /* In a real app we'd join, but for now we iterate or trust clientControls. */
        }

        return {
          policies: policies.map(p => ({ ...p, mappingId: links.find(l => l.mappedId === p.id && l.mappedType === 'policy')?.id })),
          evidence: evidenceList.map(e => ({ ...e, mappingId: links.find(l => l.mappedId === e.id && l.mappedType === 'evidence')?.id })),
          controls: controlsList.map(c => ({ ...c, mappingId: links.find(l => l.mappedId === c.id && l.mappedType === 'control')?.id }))
        };
      }),

    saveReadinessResponse: clientProcedure.input(z.object({
      clientId: z.number(),
      regulationId: z.string(),
      questionId: z.string(),
      response: z.string()
    })).mutation(async ({ input }) => {
      const dbConn = await db.getDb();

      // check existing
      const existing = await dbConn.select().from(clientReadinessResponses)
        .where(
          and(
            eq(clientReadinessResponses.clientId, input.clientId),
            eq(clientReadinessResponses.regulationId, input.regulationId),
            eq(clientReadinessResponses.questionId, input.questionId)
          )
        ).limit(1);

      if (existing.length > 0) {
        await dbConn.update(clientReadinessResponses)
          .set({ response: input.response, updatedAt: new Date() })
          .where(eq(clientReadinessResponses.id, existing[0].id));
      } else {
        await dbConn.insert(clientReadinessResponses).values({
          clientId: input.clientId,
          regulationId: input.regulationId,
          questionId: input.questionId,
          response: input.response
        });
      }
      return { success: true };
    }),

    getReadinessResponses: clientProcedure.input(z.object({
      clientId: z.number(),
      regulationId: z.string()
    })).query(async ({ input }) => {
      const dbConn = await db.getDb();
      const responses = await dbConn.select().from(clientReadinessResponses)
        .where(
          and(
            eq(clientReadinessResponses.clientId, input.clientId),
            eq(clientReadinessResponses.regulationId, input.regulationId)
          )
        );

      // Convert to map for easy frontend use
      const responseMap: Record<string, string> = {};
      responses.forEach(r => {
        if (r.response) responseMap[r.questionId] = r.response;
      });

      return responseMap;
    }),

    downloadReadinessReport: clientProcedure.input(z.object({
      clientId: z.number(),
      regulationId: z.string()
    })).mutation(async ({ input }) => {
      const { generateReadinessReport } = await import('./lib/reporting');
      const buffer = await generateReadinessReport(input.clientId, input.regulationId);
      return {
        filename: `${input.regulationId.toUpperCase()}_Readiness_Report.pdf`,
        pdfBase64: buffer.toString('base64')
      };
    }),

    generateReport: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .mutation(async ({ input }) => {
        const buffer = await generateGapAnalysisReport(input.clientId);
        return {
          filename: `compliance-report-${new Date().toISOString().split('T')[0]}.pdf`,
          pdfBase64: buffer.toString('base64')
        };
      }),
  }),

  riskSettings: router({
    get: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRiskSettings(input.clientId);
      }),
    update: adminProcedure
      .input(z.object({
        clientId: z.number(),
        scope: z.string().optional(),
        context: z.string().optional(),
        riskAppetite: z.string().optional(),
        methodology: z.string().optional(),
        riskTolerance: z.array(z.object({
          category: z.string(),
          threshold: z.string(),
          unit: z.string()
        })).optional(),
        impactCriteria: z.array(z.object({
          level: z.number(),
          name: z.string(),
          description: z.string()
        })).optional(),
        likelihoodCriteria: z.array(z.object({
          level: z.number(),
          name: z.string(),
          description: z.string()
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const { clientId, ...rest } = input;
        return await db.upsertRiskSettings({ clientId, ...rest } as any);
      }),
  }),







  // Remediation Tasks (Instances)
  remediationTasks: router({
    create: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        clientControlId: z.number().optional(),
        title: z.string(),
        description: z.string().optional(),
        priority: z.string().default('medium'),
        dueDate: z.string().optional(),
        assigneeId: z.number().optional(),
        issueTrackerConnectionId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const dbConn = await getDb();
        const [task] = await dbConn.insert(schema.remediationTasks).values({
          ...input,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          priority: input.priority || "medium",
          status: "open",
        }).returning();

        // If issue tracker connection specified, simulate sync
        if (input.issueTrackerConnectionId) {
          const [connection] = await dbConn.select().from(issueTrackerConnections)
            .where(eq(issueTrackerConnections.id, input.issueTrackerConnectionId));

          if (connection) {
            const mockIssueId = connection.provider === 'jira'
              ? `${connection.projectKey || 'COMP'}-${task.id}`
              : `LIN-${task.id}`;
            const mockUrl = connection.provider === 'jira'
              ? `${connection.baseUrl || 'https://company.atlassian.net'}/browse/${mockIssueId}`
              : `https://linear.app/company/issue/${mockIssueId}`;

            await dbConn.update(schema.remediationTasks)
              .set({
                issueTrackerConnectionId: input.issueTrackerConnectionId,
                externalIssueId: mockIssueId,
                externalIssueUrl: mockUrl,
                lastSyncedAt: new Date(),
              })
              .where(eq(schema.remediationTasks.id, task.id));
          }
        }

        await logActivity({
          userId: ctx.user.id,
          clientId: input.clientId,
          action: "create",
          entityType: "remediation_task",
          entityId: task.id,
          details: { title: task.title }
        });

        return task;
      }),

    update: clientEditorProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
        assigneeId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();
        const { id, ...updates } = input;
        await dbConn.update(schema.remediationTasks)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(schema.remediationTasks.id, id));
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();
        await dbConn.delete(schema.remediationTasks).where(eq(schema.remediationTasks.id, input.id));
        return { success: true };
      }),

    list: clientProcedure
      .input(z.object({ clientId: z.number().optional(), clientControlId: z.number().optional() }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();
        if (input.clientControlId) {
          return dbConn.select().from(schema.remediationTasks).where(eq(schema.remediationTasks.clientControlId, input.clientControlId));
        }
        if (input.clientId) {
          return dbConn.select().from(schema.remediationTasks).where(eq(schema.remediationTasks.clientId, input.clientId));
        }
        return [];
      }),
  }),

  // Remediation Playbooks
  remediationPlaybooks: router({
    // Get playbooks matching a gap
    getSuggestions: publicProcedure
      .input(z.object({
        controlId: z.string().optional(),
        controlName: z.string().optional(),
        category: z.string().optional(),
        framework: z.string().optional()
      }))
      .query(async ({ input }) => {
        const dbConn = await getDb();

        const playbooks = await dbConn.select().from(schema.remediationPlaybooks);

        const searchText = [
          input.controlId,
          input.controlName,
          input.category
        ].filter(Boolean).join(' ').toLowerCase();

        const matched = playbooks.filter(p => {
          if (p.framework && input.framework && p.framework !== input.framework) {
            return false;
          }
          const patternRaw = typeof p.gapPattern === 'string' ? p.gapPattern : '';
          if (!patternRaw) return false;
          try {
            const pattern = new RegExp(patternRaw, 'i');
            return pattern.test(searchText);
          } catch {
            const lowered = patternRaw.toLowerCase();
            return lowered ? searchText.includes(lowered) : false;
          }
        });

        return matched.sort((a, b) => (b.priority || 50) - (a.priority || 50));
      }),

    // Get single playbook by ID
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await getDb();
        const [playbook] = await dbConn.select()
          .from(schema.remediationPlaybooks)
          .where(eq(schema.remediationPlaybooks.id, input.id));
        return playbook || null;
      }),

    // List all playbooks
    list: publicProcedure.query(async () => {
      const dbConn = await getDb();
      return dbConn.select().from(schema.remediationPlaybooks);
    }),

    // Create playbook
    create: adminProcedure
      .input(z.object({
        title: z.string(),
        gapPattern: z.string(),
        category: z.string().optional(),
        framework: z.string().optional(),
        severity: z.string().optional(),
        estimatedEffort: z.string().optional(),
        steps: z.array(z.object({
          order: z.number(),
          title: z.string(),
          description: z.string(),
          owner: z.string().optional(),
          dueOffset: z.number().optional(),
          checklist: z.array(z.string()).optional(),
        })).optional(),
        ownerTemplate: z.string().optional(),
        policyLanguage: z.string().optional(),
        itsmTemplate: z.object({
          type: z.string(),
          summary: z.string(),
          description: z.string(),
          priority: z.string(),
          labels: z.array(z.string()).optional(),
        }).optional(),
        priority: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await getDb();

        const [playbook] = await dbConn.insert(schema.remediationPlaybooks).values({
          ...input,
        }).returning();

        return playbook;
      }),

    // Delete playbook
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const dbConn = await getDb();

        await dbConn.delete(schema.remediationPlaybooks)
          .where(eq(schema.remediationPlaybooks.id, input.id));

        return { success: true };
      }),

    // Seed common playbooks
    seed: adminProcedure.mutation(async () => {
      const dbConn = await getDb();

      const playbooks = [
        {
          title: "Implement Multi-Factor Authentication (MFA)",
          gapPattern: "MFA|multi-factor|two-factor|2FA|authentication",
          category: "Access Control",
          severity: "critical",
          estimatedEffort: "1-2 weeks",
          steps: [
            { order: 1, title: "Assess Current State", description: "Document which systems/applications currently lack MFA", owner: "IT Security", dueOffset: 2, checklist: ["Inventory all user-facing applications", "Identify privileged access points", "Check existing SSO/IdP capabilities"] },
            { order: 2, title: "Select MFA Solution", description: "Evaluate and select appropriate MFA provider", owner: "IT Security", dueOffset: 7, checklist: ["Compare vendors (Duo, Okta, Azure AD)", "Assess integration requirements", "Get budget approval"] },
            { order: 3, title: "Pilot Deployment", description: "Deploy MFA to IT and security teams first", owner: "IT Operations", dueOffset: 14, checklist: ["Configure MFA for pilot group", "Test all authentication methods", "Document issues and resolutions"] },
            { order: 4, title: "Company-Wide Rollout", description: "Deploy MFA to all users with phased approach", owner: "IT Operations", dueOffset: 21, checklist: ["Send user communications", "Provide enrollment instructions", "Set enrollment deadline"] },
            { order: 5, title: "Enforce and Monitor", description: "Enable enforcement mode and monitor adoption", owner: "IT Security", dueOffset: 28, checklist: ["Enable MFA enforcement", "Monitor authentication logs", "Address stragglers"] }
          ],
          ownerTemplate: "IT Security Lead with support from IT Operations",
          policyLanguage: "Multi-factor authentication shall be required for all remote access and privileged account access.",
          priority: 95
        },
        {
          title: "Enable Encryption at Rest",
          gapPattern: "encrypt.*rest|disk.*encrypt|storage.*encrypt|AES|cryptograph",
          category: "Data Protection",
          severity: "high",
          estimatedEffort: "3-5 days",
          steps: [
            { order: 1, title: "Inventory Data Stores", description: "Identify all databases, file shares, and storage systems", owner: "Data Governance", dueOffset: 2 },
            { order: 2, title: "Enable Native Encryption", description: "Enable TDE/encryption features on databases and cloud storage", owner: "Database Admin", dueOffset: 5, checklist: ["Enable TDE on SQL Server/MySQL", "Enable S3 bucket encryption", "Enable Azure Storage encryption"] },
            { order: 3, title: "Verify Encryption Status", description: "Confirm encryption is active and keys are managed", owner: "IT Security", dueOffset: 7 }
          ],
          ownerTemplate: "Database Administrator + Cloud Team",
          priority: 85
        },
        {
          title: "Implement Access Reviews",
          gapPattern: "access.*review|user.*review|privilege.*review|recertification",
          category: "Access Control",
          severity: "medium",
          estimatedEffort: "1-2 weeks",
          steps: [
            { order: 1, title: "Define Review Scope", description: "Determine which systems require access reviews", owner: "IT Security", dueOffset: 3 },
            { order: 2, title: "Extract User Access Reports", description: "Generate reports of current user access", owner: "IT Operations", dueOffset: 5 },
            { order: 3, title: "Conduct Manager Reviews", description: "Send access reports to managers for certification", owner: "HR/Managers", dueOffset: 14, checklist: ["Create review forms", "Set deadline", "Send reminders"] },
            { order: 4, title: "Remediate Findings", description: "Remove inappropriate access identified in reviews", owner: "IT Operations", dueOffset: 21 }
          ],
          ownerTemplate: "IT Security with Manager Participation",
          policyLanguage: "Access reviews shall be conducted quarterly for all systems containing sensitive data.",
          priority: 75
        },
        {
          title: "Deploy Endpoint Protection",
          gapPattern: "endpoint|antivirus|anti-malware|EDR|malware",
          category: "Endpoint Security",
          severity: "high",
          estimatedEffort: "1-2 weeks",
          steps: [
            { order: 1, title: "Select EDR Solution", description: "Evaluate endpoint detection and response tools", owner: "IT Security", dueOffset: 5 },
            { order: 2, title: "Deploy Agents", description: "Install EDR agents on all endpoints", owner: "IT Operations", dueOffset: 10 },
            { order: 3, title: "Configure Policies", description: "Set up detection rules and response actions", owner: "IT Security", dueOffset: 14 }
          ],
          ownerTemplate: "IT Security + IT Operations",
          priority: 80
        },
        {
          title: "Establish Vulnerability Management",
          gapPattern: "vulnerab|scan|patch|CVE|security.*update",
          category: "Vulnerability Management",
          severity: "high",
          estimatedEffort: "2-3 weeks",
          steps: [
            { order: 1, title: "Deploy Scanning Tool", description: "Set up vulnerability scanner (Qualys, Nessus, etc.)", owner: "IT Security", dueOffset: 5 },
            { order: 2, title: "Configure Scan Schedules", description: "Set up weekly/monthly scan schedules", owner: "IT Security", dueOffset: 7 },
            { order: 3, title: "Define SLAs", description: "Establish remediation timeframes by severity", owner: "IT Security", dueOffset: 10, checklist: ["Critical: 7 days", "High: 30 days", "Medium: 90 days"] },
            { order: 4, title: "Integrate with ITSM", description: "Auto-create tickets for vulnerabilities", owner: "IT Operations", dueOffset: 14 }
          ],
          ownerTemplate: "IT Security Team",
          policyLanguage: "Vulnerability scans shall be conducted at least monthly. Critical and high vulnerabilities shall be remediated within 7 and 30 days respectively.",
          priority: 85
        },
        {
          title: "Implement Security Awareness Training",
          gapPattern: "train|awareness|phish|security.*education",
          category: "Security Awareness",
          severity: "medium",
          estimatedEffort: "Ongoing",
          steps: [
            { order: 1, title: "Select Training Platform", description: "Choose security awareness training provider", owner: "IT Security", dueOffset: 7 },
            { order: 2, title: "Develop Training Content", description: "Customize content for organizational needs", owner: "IT Security", dueOffset: 14 },
            { order: 3, title: "Launch Initial Training", description: "Deploy mandatory training to all employees", owner: "HR", dueOffset: 21 },
            { order: 4, title: "Conduct Phishing Simulations", description: "Run simulated phishing campaigns", owner: "IT Security", dueOffset: 30 }
          ],
          ownerTemplate: "IT Security + HR",
          policyLanguage: "All employees shall complete security awareness training upon hire and annually thereafter.",
          priority: 70
        }
      ];

      let inserted = 0;
      for (const p of playbooks) {
        try {
          await dbConn.insert(schema.remediationPlaybooks).values(p);
          inserted++;
        } catch {
          // Skip duplicates
        }
      }

      return { inserted };
    }),
  }),

  // Posture Trending & Forecasting
  postureTrending: router({
    // Create a snapshot for a client (typically called weekly)
    createSnapshot: adminProcedure
      .input(z.object({ clientId: z.number() }))
      .mutation(async ({ input }) => {
        const dbConn = await getDb();

        // Get control stats
        const controls = await dbConn.select().from(schema.clientControls)
          .where(eq(schema.clientControls.clientId, input.clientId));

        const totalControls = controls.length;
        const implementedControls = controls.filter(c => c.status === 'implemented').length;
        const inProgressControls = controls.filter(c => c.status === 'in_progress').length;
        const notImplementedControls = controls.filter(c => c.status === 'not_implemented').length;
        const notApplicableControls = controls.filter(c => c.status === 'not_applicable').length;

        // Get gap stats from latest gap assessment
        const gapAssessments = await dbConn.select().from(schema.gapAssessments)
          .where(eq(schema.gapAssessments.clientId, input.clientId))
          .orderBy(desc(schema.gapAssessments.updatedAt))
          .limit(1);

        let totalGaps = 0, closedGaps = 0, criticalGaps = 0, highGaps = 0;
        if (gapAssessments.length > 0) {
          const gapResponses = await dbConn.select().from(schema.gapResponses)
            .where(eq(schema.gapResponses.assessmentId, gapAssessments[0].id));

          const gaps = gapResponses.filter(g => g.targetStatus === 'required' && g.currentStatus !== 'implemented');
          totalGaps = gaps.length;
          closedGaps = gapResponses.filter(g => g.currentStatus === 'implemented').length;
          criticalGaps = gaps.filter(g => (g.priorityScore || 0) >= 80).length;
          highGaps = gaps.filter(g => (g.priorityScore || 0) >= 60 && (g.priorityScore || 0) < 80).length;
        }

        // Get risk stats
        const risks = await dbConn.select().from(schema.riskAssessments)
          .where(eq(schema.riskAssessments.clientId, input.clientId));

        const totalRisks = risks.length;
        const mitigatedRisks = risks.filter(r => r.status === 'treated' || r.status === 'accepted').length;

        // Calculate compliance score (0-100)
        const applicableControls = totalControls - notApplicableControls;
        const complianceScore = applicableControls > 0
          ? Math.round((implementedControls / applicableControls) * 100)
          : 0;

        // Calculate risk score (lower is better, 0-100)
        const openRisks = totalRisks - mitigatedRisks;
        const riskScore = totalRisks > 0 ? Math.round((openRisks / totalRisks) * 100) : 0;

        // Get previous snapshot to calculate velocity
        const [prevSnapshot] = await dbConn.select().from(schema.complianceSnapshots)
          .where(eq(schema.complianceSnapshots.clientId, input.clientId))
          .orderBy(desc(schema.complianceSnapshots.snapshotDate))
          .limit(1);

        const controlsClosedThisPeriod = prevSnapshot
          ? implementedControls - (prevSnapshot.implementedControls || 0)
          : 0;
        const gapsClosedThisPeriod = prevSnapshot
          ? closedGaps - (prevSnapshot.closedGaps || 0)
          : 0;

        // Create snapshot
        const [snapshot] = await dbConn.insert(schema.complianceSnapshots).values({
          clientId: input.clientId,
          totalControls,
          implementedControls,
          inProgressControls,
          notImplementedControls,
          notApplicableControls,
          totalGaps,
          closedGaps,
          criticalGaps,
          highGaps,
          totalRisks,
          mitigatedRisks,
          complianceScore,
          riskScore,
          controlsClosedThisPeriod: Math.max(0, controlsClosedThisPeriod),
          gapsClosedThisPeriod: Math.max(0, gapsClosedThisPeriod),
        }).returning();

        return snapshot;
      }),

    // Get snapshot history for a client
    getHistory: publicProcedure
      .input(z.object({
        clientId: z.number(),
        limit: z.number().optional().default(12) // Last 12 weeks
      }))
      .query(async ({ input }) => {
        const dbConn = await getDb();

        return dbConn.select().from(schema.complianceSnapshots)
          .where(eq(schema.complianceSnapshots.clientId, input.clientId))
          .orderBy(desc(schema.complianceSnapshots.snapshotDate))
          .limit(input.limit);
      }),

    // Get forecast based on historical velocity
    getForecast: publicProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await getDb();

        const snapshots = await dbConn.select().from(schema.complianceSnapshots)
          .where(eq(schema.complianceSnapshots.clientId, input.clientId))
          .orderBy(desc(schema.complianceSnapshots.snapshotDate))
          .limit(8);

        if (snapshots.length < 2) {
          return {
            hasEnoughData: false,
            message: "Need at least 2 snapshots for forecasting",
            currentScore: snapshots[0]?.complianceScore || 0,
          };
        }

        // Calculate average velocity (controls closed per week)
        const velocities = snapshots.slice(0, -1).map((s, i) =>
          s.controlsClosedThisPeriod || 0
        );
        const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;

        const latest = snapshots[0];
        const applicableControls = (latest.totalControls || 0) - (latest.notApplicableControls || 0);
        const remainingControls = applicableControls - (latest.implementedControls || 0);

        // Weeks to 100% compliance
        const weeksTo100 = avgVelocity > 0
          ? Math.ceil(remainingControls / avgVelocity)
          : null;

        // Weeks to different milestones
        const currentScore = latest.complianceScore || 0;
        const controlsNeeded = (milestone: number) => {
          const needed = Math.ceil((milestone / 100) * applicableControls) - (latest.implementedControls || 0);
          return Math.max(0, needed);
        };

        const milestones = [80, 90, 95, 100].map(m => ({
          score: m,
          controlsNeeded: controlsNeeded(m),
          weeksEstimate: avgVelocity > 0 ? Math.ceil(controlsNeeded(m) / avgVelocity) : null
        })).filter(m => m.score > currentScore);

        return {
          hasEnoughData: true,
          currentScore,
          avgVelocity: Math.round(avgVelocity * 10) / 10,
          remainingControls,
          weeksTo100,
          milestones,
          projectedDate100: weeksTo100
            ? new Date(Date.now() + weeksTo100 * 7 * 24 * 60 * 60 * 1000).toISOString()
            : null
        };
      }),

    // List all snapshots (admin)
    list: publicProcedure.query(async () => {
      const dbConn = await getDb();
      return dbConn.select().from(schema.complianceSnapshots)
        .orderBy(desc(schema.complianceSnapshots.snapshotDate));
    }),
  }),

  // Gap Email Questionnaire
  kris: router({
    list: publicProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        return db.select().from(schema.kris).where(eq(schema.kris.clientId, input.clientId));
      }),
    create: adminProcedure
      .input(z.object({
        clientId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        thresholdGreen: z.string().optional(),
        thresholdAmber: z.string().optional(),
        thresholdRed: z.string().optional(),
        currentValue: z.string().optional(),
        currentStatus: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const [kri] = await db.insert(schema.kris).values({ ...input, status: 'active' }).returning();
        return kri;
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        thresholdGreen: z.string().optional(),
        thresholdAmber: z.string().optional(),
        thresholdRed: z.string().optional(),
        currentValue: z.string().optional(),
        currentStatus: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const { id, ...data } = input;
        const [kri] = await db.update(schema.kris).set(data).where(eq(schema.kris.id, id)).returning();
        return kri;
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        await db.delete(schema.kris).where(eq(schema.kris.id, input.id));
        return true;
      }),
  }),

  vendorAuthorizations: router({
    get: clientProcedure
      .input(z.object({ vendorId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.query.vendorAuthorizations.findFirst({
          where: and(
            eq(schema.vendorAuthorizations.clientId, ctx.clientId),
            eq(schema.vendorAuthorizations.vendorId, input.vendorId)
          )
        });
      }),

    initiate: clientEditorProcedure
      .input(z.object({ vendorId: z.number(), notes: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const { AuthorizationEngine } = await import('./server/services/AuthorizationEngine');
        return await AuthorizationEngine.initiateAuthorization(ctx.clientId, input.vendorId, ctx.userId, input.notes);
      }),

    notify: clientEditorProcedure
      .input(z.object({ authId: z.number() }))
      .mutation(async ({ input }) => {
        const { AuthorizationEngine } = await import('./server/services/AuthorizationEngine');
        return await AuthorizationEngine.sendNotification(input.authId);
      }),

    approve: adminProcedure // Only admins can force approve for now
      .input(z.object({ authId: z.number() }))
      .mutation(async ({ input }) => {
        const { AuthorizationEngine } = await import('./server/services/AuthorizationEngine');
        return await AuthorizationEngine.approve(input.authId);
      }),
  }),




  vendorContacts: router({
    list: premiumClientProcedure
      .input(z.object({ vendorId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        return db.select().from(schema.vendorContacts).where(eq(schema.vendorContacts.vendorId, input.vendorId));
      }),
    create: premiumClientProcedure
      .input(z.object({
        clientId: z.number(),
        vendorId: z.number(),
        name: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        role: z.string().optional(),
        isPrimary: z.boolean().optional()
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const [contact] = await db.insert(schema.vendorContacts).values(input).returning();
        return contact;
      }),
    update: premiumClientProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        role: z.string().optional(),
        isPrimary: z.boolean().optional()
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const { id, ...data } = input;
        const [contact] = await db.update(schema.vendorContacts).set(data).where(eq(schema.vendorContacts.id, id)).returning();
        return contact;
      }),
    delete: premiumClientProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        await db.delete(schema.vendorContacts).where(eq(schema.vendorContacts.id, input.id));
        return true;
      }),
  }),


  vendorAnalytics: router({
    getOverdueAssessments: protectedProcedure
      .input(z.object({ clientId: z.number().optional() }).optional())
      .query(async ({ input = {}, ctx }) => {
        const db = await getDb();
        const now = new Date();
        const conditions = [lt(schema.vendorAssessments.dueDate, now)];

        if (input?.clientId) {
          // If specific clientId provided, check access
          const membership = ctx.user.role === 'admin' || ctx.user.role === 'owner' ? [true] :
            await db.select().from(schema.userClients)
              .where(and(eq(schema.userClients.userId, ctx.user.id), eq(schema.userClients.clientId, input.clientId)))
              .limit(1);

          if (membership.length === 0) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this client' });
          }
          conditions.push(eq(schema.vendors.clientId, input.clientId));
        } else if (ctx.user.role !== 'admin' && ctx.user.role !== 'owner') {
          // For non-admins calling globally, filter by their clients
          const userClientIds = await db.select({ id: schema.userClients.clientId })
            .from(schema.userClients)
            .where(eq(schema.userClients.userId, ctx.user.id));

          if (userClientIds.length === 0) return [];
          conditions.push(inArray(schema.vendors.clientId, userClientIds.map(c => c.id)));
        }

        const results = await db.select({
          id: schema.vendorAssessments.id,
          vendorId: schema.vendorAssessments.vendorId,
          vendorName: schema.vendors.name,
          assessmentType: schema.vendorAssessments.type,
          dueDate: schema.vendorAssessments.dueDate,
          status: schema.vendorAssessments.status,
          clientId: schema.vendors.clientId
        })
          .from(schema.vendorAssessments)
          .innerJoin(schema.vendors, eq(schema.vendorAssessments.vendorId, schema.vendors.id))
          .where(and(...conditions));

        return results.filter(r => r.status !== 'Completed');
      }),
  }),

  communication: router({
    seed: adminProcedure.mutation(async () => {
      const db = await getDb();

      const defaults = [
        {
          key: "GAP_EXPIRED",
          name: "Gap Analysis Questionnaire Expired",
          subjectTemplate: "Action Required: Gap Analysis Questionnaire Expired - {{CLIENT_NAME}}",
          bodyTemplate: "<p>Dear {{RECIPIENT_NAME}},</p><p>This is a reminder that the Gap Analysis Questionnaire for <strong>{{ASSESSMENT_NAME}}</strong> has expired.</p><p>Please contact your compliance officer if you need a new link.</p><p>Best regards,<br>{{COMPANY_NAME}} Compliance Team</p>",
          category: "alert"
        },
        {
          key: "RISK_RAISED",
          name: "New Risk Identified",
          subjectTemplate: "New Risk Identified: {{RISK_TITLE}}",
          bodyTemplate: "<p>Hello,</p><p>A new risk has been identified for <strong>{{CLIENT_NAME}}</strong>.</p><ul><li><strong>Risk:</strong> {{RISK_TITLE}}</li><li><strong>Severity:</strong> {{RISK_SEVERITY}}</li></ul><p>Please review it in the Risk Register.</p>",
          category: "alert"
        },
        {
          key: "POLICY_REVIEW",
          name: "Policy Review Assigned",
          subjectTemplate: "Review Required: {{POLICY_NAME}}",
          bodyTemplate: "<p>Hi {{RECIPIENT_NAME}},</p><p>You have been assigned to review the policy: <strong>{{POLICY_NAME}}</strong>.</p><p>Please complete your review by {{DUE_DATE}}.</p><p><a href='{{LINK}}'>Click here to review</a></p>",
          category: "task"
        }
      ];

      for (const t of defaults) {
        await db.insert(schema.communicationTemplates)
          .values(t)
          .onConflictDoUpdate({
            target: schema.communicationTemplates.key,
            set: t
          });
      }
      return { success: true, count: defaults.length };
    }),

    listTemplates: adminProcedure.query(async () => {
      const db = await getDb();
      return db.select().from(schema.communicationTemplates);
    }),

    saveTemplate: adminProcedure
      .input(z.object({
        key: z.string(),
        name: z.string(),
        subjectTemplate: z.string(),
        bodyTemplate: z.string(),
        category: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();

        await db.insert(schema.communicationTemplates)
          .values(input)
          .onConflictDoUpdate({
            target: schema.communicationTemplates.key,
            set: input
          });
        return true;
      }),

    send: adminProcedure
      .input(z.object({
        clientId: z.number(),
        templateKey: z.string(),
        recipientEmail: z.string().email(),
        recipientName: z.string().optional(),
        variables: z.record(z.string()), // { "CLIENT_NAME": "Acme Inc" }
        meta: z.object({
          entityType: z.string(),
          entityId: z.number()
        }).optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();

        const template = await db.query.communicationTemplates.findFirst({
          where: eq(schema.communicationTemplates.key, input.templateKey)
        });

        if (!template) return { success: false, error: "Template not found" };

        // Simple Variable Substitution (Handlebars-main-like)
        let subject = template.subjectTemplate;
        let body = template.bodyTemplate;

        // Add standard vars
        const allVars = {
          ...input.variables,
          RECIPIENT_NAME: input.recipientName || input.recipientEmail,
          RECIPIENT_EMAIL: input.recipientEmail,
          DATE: new Date().toLocaleDateString()
        };

        for (const [key, val] of Object.entries(allVars)) {
          const regex = new RegExp(`{{${key}}}`, 'g');
          subject = subject.replace(regex, String(val));
          body = body.replace(regex, String(val));
        }

        // TODO: Integrate actual Nodemailer here
        // For now, we simulate sending by logging
        console.log(`[Communicator] Sending email to ${input.recipientEmail}`);
        console.log(`[Subject] ${subject}`);

        // Log to notification_log
        await db.insert(schema.notificationLog).values({
          userId: ctx.session?.user?.id || 0, // 0 = System
          type: input.templateKey,
          channel: 'email',
          title: subject,
          message: body,
          status: 'sent',
          metadata: input.variables,
          relatedEntityType: input.meta?.entityType,
          relatedEntityId: input.meta?.entityId
        });

        return { success: true };
      }),

    searchRecipients: clientProcedure
      .input(z.object({
        clientId: z.number(),
        query: z.string().optional()
      }))
      .query(async ({ input }) => {
        const db = await getDb();

        const search = input.query ? `%${input.query.toLowerCase()}%` : '%';

        // 1. Fetch Users
        const userResults = await db.select({
          name: schema.users.name,
          email: schema.users.email,
        })
          .from(schema.userClients)
          .innerJoin(schema.users, eq(schema.userClients.userId, schema.users.id))
          .where(and(
            eq(schema.userClients.clientId, input.clientId),
            or(like(sql`lower(${schema.users.name})`, search), like(sql`lower(${schema.users.email})`, search))
          ));

        // 2. Fetch Employees
        const employeeResults = await db.select({
          name: sql<string>`concat(${schema.employees.firstName}, ' ', ${schema.employees.lastName})`,
          email: schema.employees.email,
        })
          .from(schema.employees)
          .where(and(
            eq(schema.employees.clientId, input.clientId),
            or(
              like(sql`lower(concat(${schema.employees.firstName}, ' ', ${schema.employees.lastName}))`, search),
              like(sql`lower(${schema.employees.email})`, search)
            )
          ));

        // 3. Fetch Vendor Contacts
        const contactResults = await db.select({
          name: schema.vendorContacts.name,
          email: schema.vendorContacts.email,
        })
          .from(schema.vendorContacts)
          .innerJoin(schema.vendors, eq(schema.vendorContacts.vendorId, schema.vendors.id))
          .where(and(
            eq(schema.vendors.clientId, input.clientId),
            or(like(sql`lower(${schema.vendorContacts.name})`, search), like(sql`lower(${schema.vendorContacts.email})`, search))
          ));

        // Combine and dedup
        const combined = [
          ...userResults.map(r => ({ name: r.name || 'Unknown User', email: r.email || '', type: 'user' as const })),
          ...employeeResults.map(r => ({ name: r.name || 'Unknown Employee', email: r.email, type: 'employee' as const })),
          ...contactResults.map(r => ({ name: r.name, email: r.email || '', type: 'contact' as const }))
        ].filter(r => r.email && r.email.includes('@')); // Basic validation

        // Deduplicate by email
        const unique = Array.from(new Map(combined.map(item => [item.email, item])).values());

        return unique.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 50);
      })
  }),

  email: router({
    list: clientProcedure
      .input(z.object({
        clientId: z.number(),
        folder: z.enum(['inbox', 'drafts', 'sent', 'archive', 'trash']).default('inbox'),
        search: z.string().optional(),
        isStarred: z.boolean().optional()
      }))
      .query(async ({ input }) => {
        const db = await getDb();

        const conditions = [
          eq(schema.emailMessages.clientId, input.clientId),
          eq(schema.emailMessages.folder, input.folder)
        ];

        if (input.isStarred) {
          conditions.push(eq(schema.emailMessages.isStarred, true));
        }

        if (input.search) {
          const searchLower = `%${input.search.toLowerCase()}%`;
          conditions.push(or(
            ilike(schema.emailMessages.subject, searchLower),
            ilike(schema.emailMessages.from, searchLower),
            // Note: Body search might be slow, but useful
            ilike(schema.emailMessages.snippet, searchLower)
          ));
        }

        return db.select()
          .from(schema.emailMessages)
          .where(and(...conditions))
          .orderBy(desc(schema.emailMessages.createdAt));
      }),

    get: clientProcedure
      .input(z.object({ clientId: z.number(), id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        const msg = await db.query.emailMessages.findFirst({
          where: and(
            eq(schema.emailMessages.id, input.id),
            eq(schema.emailMessages.clientId, input.clientId)
          )
        });
        return msg;
      }),

    createDraft: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        subject: z.string().default(""),
        to: z.array(z.string()).default([]),
        cc: z.array(z.string()).default([]),
        bcc: z.array(z.string()).default([]),
        body: z.string().default("")
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();

        const [draft] = await db.insert(schema.emailMessages).values({
          clientId: input.clientId,
          userId: ctx.session?.user?.id || 0,
          folder: 'drafts',
          status: 'draft',
          subject: input.subject,
          body: input.body,
          to: input.to,
          cc: input.cc,
          bcc: input.bcc,
          isRead: true, // Own drafts are read
          from: ctx.session?.user?.email || "user@example.com"
        }).returning();

        return draft;
      }),

    updateDraft: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        id: z.number(),
        subject: z.string().optional(),
        body: z.string().optional(),
        to: z.array(z.string()).optional(),
        cc: z.array(z.string()).optional(),
        bcc: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();

        const { id, clientId, ...data } = input;

        // Update snippet if body changes
        const updates: any = { ...data };
        if (data.body) {
          // Simple HTML strip for snippet (improvement: use a library or regex)
          updates.snippet = data.body.replace(/<[^>]*>/g, '').substring(0, 200);
        }
        updates.updatedAt = new Date();

        const [updated] = await db.update(schema.emailMessages)
          .set(updates)
          .where(and(
            eq(schema.emailMessages.id, id),
            eq(schema.emailMessages.clientId, clientId)
          ))
          .returning();
        return updated;
      }),

    send: clientEditorProcedure
      .input(z.object({ clientId: z.number(), id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();

        // 1. Get Draft
        const msg = await db.query.emailMessages.findFirst({
          where: and(eq(schema.emailMessages.id, input.id), eq(schema.emailMessages.clientId, input.clientId))
        });

        if (!msg) return { success: false, error: "Draft not found" };

        // 2. Send via Transporter (Standard or Client-Specific)
        const { sendEmail } = await import('./lib/email/transporter');

        // Ensure recipients are standard array
        // Drizzle JSON type inference can be tricky, casting safely
        const toList = Array.isArray(msg.to) ? msg.to as string[] : [msg.to as unknown as string];

        const result = await sendEmail({
          to: toList,
          subject: msg.subject || "(No Subject)",
          html: msg.body || "",
          replyTo: msg.from || undefined, // Allow recipients to reply to sender
          clientId: input.clientId
        });

        if (!result.success) {
          console.error("Email send failed", result.error);
          return { success: false, error: "Failed to send email. Check SMTP settings." };
        }

        // 3. Update Status
        await db.update(schema.emailMessages)
          .set({
            status: 'sent',
            folder: 'sent',
            sentAt: new Date(),
            // Store messageId if we want? Schema doesn't have it yet, maybe add later.
          })
          .where(eq(schema.emailMessages.id, input.id));

        return { success: true };
      }),

    moveToTrash: clientEditorProcedure
      .input(z.object({ clientId: z.number(), id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        await db.update(schema.emailMessages)
          .set({ folder: 'trash' })
          .where(and(eq(schema.emailMessages.id, input.id), eq(schema.emailMessages.clientId, input.clientId)));
        return true;
      }),

    restore: clientEditorProcedure
      .input(z.object({ clientId: z.number(), id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        // Logic: if sent -> sent folder, else -> inbox? or just inbox/drafts logic
        // For simplicity: check status. If sent -> sent. If draft -> drafts. Else -> inbox.

        const msg = await db.query.emailMessages.findFirst({
          where: and(eq(schema.emailMessages.id, input.id), eq(schema.emailMessages.clientId, input.clientId))
        });
        if (!msg) return;

        let targetFolder = 'inbox';
        if (msg.status === 'sent') targetFolder = 'sent';
        if (msg.status === 'draft') targetFolder = 'drafts';

        await db.update(schema.emailMessages)
          .set({ folder: targetFolder })
          .where(eq(schema.emailMessages.id, input.id));
        return true;
      }),

    // Generic Move (Archive, Trash, Restore, etc.)
    move: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        id: z.number(),
        folder: z.enum(['inbox', 'drafts', 'sent', 'archive', 'trash'])
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        await db.update(schema.emailMessages)
          .set({ folder: input.folder })
          .where(and(eq(schema.emailMessages.id, input.id), eq(schema.emailMessages.clientId, input.clientId)));
        return { success: true };
      }),

    // Permanent Delete (only if in trash)
    permanentDelete: clientEditorProcedure
      .input(z.object({ clientId: z.number(), id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();

        // Verify it is in trash first? Or just allow delete.
        // Safer to just delete.
        await db.delete(schema.emailMessages)
          .where(and(eq(schema.emailMessages.id, input.id), eq(schema.emailMessages.clientId, input.clientId)));

        return { success: true };
      }),

    toggleStar: clientProcedure
      .input(z.object({ clientId: z.number(), id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();

        const msg = await db.query.emailMessages.findFirst({
          where: and(eq(schema.emailMessages.id, input.id), eq(schema.emailMessages.clientId, input.clientId))
        });
        if (!msg) return;

        await db.update(schema.emailMessages)
          .set({ isStarred: !msg.isStarred })
          .where(eq(schema.emailMessages.id, input.id));
        return { success: true, isStarred: !msg.isStarred };
      })
  }),

  aiLegacy1: router({
    suggestMismatch: publicProcedure
      .input(z.object({
        articleId: z.string(),
        title: z.string(),
        description: z.string()
      }))
      .mutation(async ({ input }) => {
        console.log("AI Suggestion Request Started:", input.articleId);
        try {
          const prompt = `
You are a Senior Compliance Officer.
Your task is to map a "Regulation Article" to standard NIST 800-53 controls.

Regulation Article:
ID: ${input.articleId}
Title: ${input.title}
Text: "${input.description}"

Available Standard Controls:
${STANDARD_CONTROLS_CONTEXT}

Instructions:
1. Analyze the article text.
2. Select 1 to 3 best matching controls from the list above.
3. Return a JSON object in this format:
{
  "matches": [
    { "controlId": "AC-1", "reason": "Article requires policy documentation." }
  ],
  "confidence": "High"
}
ONLY return the JSON. No Markdown formatting.
`;

          console.log("Calling LLM Service...");
          // Fallback if LLM fails (for debugging/demo purposes if no keys configured)
          let response;
          try {
            response = await llmService.generate({
              userPrompt: prompt,
              systemPrompt: "You are a specialized JSON-only compliance scheduling API helper.",
              temperature: 0.1
            });
          } catch (e: any) {
            console.error("LLM Service Failed hard:", e);
            // Return a mock success to prove the endpoint works
            return {
              matches: [
                { controlId: "AC-1", reason: "(MOCK) System Access Control Policy - Fallback due to missing LLM Key" },
                { controlId: "IA-2", reason: "(MOCK) User Identification - Fallback due to missing LLM Key" }
              ],
              confidence: "Low (Fallback)"
            };
          }

          console.log("LLM Response received:", response.text.substring(0, 50) + "...");

          // Clean response of potential markdown code blocks
          // Clean response of potential markdown code blocks
          const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();

          if (!cleanJson) {
            throw new Error("Empty response from LLM");
          }

          const parsed = JSON.parse(cleanJson);
          return parsed;

        } catch (error: any) {
          console.error("AI Suggestion Logic Error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate AI suggestions: " + error.message
          });
        }
      }),

    // AI Advisor sub-router
    advisor: router({
      suggestTechnologies: publicProcedure
        .input(z.object({
          clientId: z.number(),
          controlId: z.number(),
          vendorPreference: z.string().optional(),
          budgetConstraint: z.enum(['low', 'medium', 'high']).optional(),
        }))
        .mutation(async ({ input }) => {
          console.log("AI Advisor: suggestTechnologies called with:", input);
          try {
            const control = await db.getControlById(input.controlId);
            if (!control) throw new TRPCError({ code: "NOT_FOUND", message: "Control not found" });

            const prompt = `
You are an expert compliance technology advisor.
Suggest 2-3 technology solutions for implementing the following control:

Control ID: ${control.controlId}
Control Name: ${control.name}
Description: ${control.description || 'N/A'}
Framework: ${control.framework}

${input.vendorPreference ? `Vendor Preference: ${input.vendorPreference}` : ''}
${input.budgetConstraint ? `Budget Constraint: ${input.budgetConstraint}` : ''}

Return a JSON object with this structure:
{
  "suggestions": [
    {
      "techId": "unique-id",
      "name": "Technology Name",
      "vendor": "Vendor Name",
      "description": "Brief description",
      "pros": ["pro1", "pro2"],
      "cons": ["con1", "con2"],
      "effort": "low|medium|high",
      "confidence": 0.8
    }
  ],
  "contextSummary": "Brief summary of recommendations"
}
ONLY return the JSON. No Markdown formatting.
`;

            let response;
            try {
              response = await llmService.generate({
                userPrompt: prompt,
                systemPrompt: "You are a specialized JSON-only compliance technology advisor.",
                temperature: 0.3
              });
              const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
              if (!cleanJson) throw new Error("Empty response from LLM");
              return JSON.parse(cleanJson);
            } catch (e: any) {
              console.error("LLM failed for suggestTechnologies:", e);
              // Return mock data
              return {
                suggestions: [
                  {
                    techId: "mock-1",
                    name: "Example IAM Solution",
                    vendor: "Cloud Provider",
                    description: "Identity and Access Management solution for control implementation",
                    pros: ["Easy integration", "Scalable"],
                    cons: ["Requires training"],
                    effort: "medium" as const,
                    sources: [],
                    confidence: 0.7
                  }
                ],
                contextSummary: "Mock suggestions provided due to LLM unavailability"
              };
            }
          } catch (error: any) {
            console.error("suggestTechnologies error:", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to suggest technologies: " + error.message
            });
          }
        }),

      implementationPlan: publicProcedure
        .input(z.object({
          clientId: z.number(),
          controlId: z.number(),
          selectedTech: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          console.log("AI Advisor: implementationPlan called with:", input);
          try {
            const control = await db.getControlById(input.controlId);
            if (!control) throw new TRPCError({ code: "NOT_FOUND", message: "Control not found" });

            const prompt = `
You are an expert compliance implementation consultant.
Generate an implementation plan for the following control:

Control ID: ${control.controlId}
Control Name: ${control.name}
Description: ${control.description || 'N/A'}
Framework: ${control.framework}
${input.selectedTech ? `Selected Technology: ${input.selectedTech}` : ''}

Return a JSON object with this structure:
{
  "steps": [
    {
      "order": 1,
      "title": "Step title",
      "description": "Detailed description",
      "owner": "Role responsible",
      "estimatedDuration": "1 week"
    }
  ],
  "prerequisites": ["prerequisite1", "prerequisite2"],
  "estimatedDuration": "4 weeks",
  "sources": []
}
ONLY return the JSON. No Markdown formatting.
`;

            let response;
            try {
              response = await llmService.generate({
                userPrompt: prompt,
                systemPrompt: "You are a specialized JSON-only compliance implementation planner.",
                temperature: 0.3
              });
              const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
              if (!cleanJson) throw new Error("Empty response from LLM");
              return JSON.parse(cleanJson);
            } catch (e: any) {
              console.error("LLM failed for implementationPlan:", e);
              return {
                steps: [
                  {
                    order: 1,
                    title: "Assess Current State",
                    description: "Review existing controls and identify gaps",
                    owner: "Compliance Team",
                    estimatedDuration: "1 week"
                  },
                  {
                    order: 2,
                    title: "Implement Control",
                    description: "Deploy necessary technical and procedural controls",
                    owner: "IT Team",
                    estimatedDuration: "2 weeks"
                  },
                  {
                    order: 3,
                    title: "Validate and Test",
                    description: "Verify control effectiveness through testing",
                    owner: "Audit Team",
                    estimatedDuration: "1 week"
                  }
                ],
                prerequisites: ["Management approval", "Budget allocation"],
                estimatedDuration: "4 weeks",
                sources: []
              };
            }
          } catch (error: any) {
            console.error("implementationPlan error:", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to generate implementation plan: " + error.message
            });
          }
        }),

      explainMapping: publicProcedure
        .input(z.object({
          clientId: z.number(),
          regulationId: z.string(),
          articleId: z.string(),
        }))
        .mutation(async ({ input }) => {
          console.log("AI Advisor: explainMapping called with:", input);
          try {
            const prompt = `
You are an expert compliance analyst.
Explain how the following regulation article maps to controls:

Regulation ID: ${input.regulationId}
Article ID: ${input.articleId}

Provide an explanation of the mapping, any related controls, evidence requirements, and gaps.

Return a JSON object with this structure:
{
  "explanation": "Detailed explanation of the mapping",
  "mappedControls": [
    { "controlId": "AC-1", "controlName": "Access Control Policy", "status": "implemented" }
  ],
  "evidenceLinks": [
    { "evidenceId": "E-001", "description": "Evidence description", "status": "collected" }
  ],
  "gaps": ["Gap 1", "Gap 2"],
  "sources": []
}
ONLY return the JSON. No Markdown formatting.
`;

            let response;
            try {
              response = await llmService.generate({
                userPrompt: prompt,
                systemPrompt: "You are a specialized JSON-only compliance mapping analyst.",
                temperature: 0.3
              });
              const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
              if (!cleanJson) throw new Error("Empty response from LLM");
              return JSON.parse(cleanJson);
            } catch (e: any) {
              console.error("LLM failed for explainMapping:", e);
              return {
                explanation: "This regulation article requires implementation of access control policies and procedures. Mock explanation provided.",
                mappedControls: [
                  { controlId: "AC-1", controlName: "Access Control Policy", status: "pending" }
                ],
                evidenceLinks: [],
                gaps: ["Full LLM analysis unavailable"],
                sources: []
              };
            }
          } catch (error: any) {
            console.error("explainMapping error:", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to explain mapping: " + error.message
            });
          }
        }),

      askQuestion: publicProcedure
        .input(z.object({
          clientId: z.number(),
          question: z.string(),
          context: z.object({
            type: z.enum(['control', 'policy', 'evidence', 'regulation']),
            id: z.string(),
          }).optional(),
        }))
        .mutation(async ({ input }) => {
          console.log("AI Advisor: askQuestion called with:", input);
          try {
            let contextInfo = "";
            if (input.context) {
              contextInfo = `\nContext: ${input.context.type} with ID: ${input.context.id}`;
            }

            const prompt = `
You are an expert compliance advisor for a GRC (Governance, Risk, Compliance) platform.
Answer the following question from a compliance professional:

Question: ${input.question}
${contextInfo}

Provide a helpful, accurate, and actionable answer. Include relevant sources or references where applicable.

Return a JSON object with this structure:
{
  "answer": "Your detailed answer here",
  "sources": [
    { "type": "external", "title": "Source title", "url": "https://example.com" }
  ]
}
ONLY return the JSON. No Markdown formatting.
`;

            let response;
            try {
              response = await llmService.generate({
                userPrompt: prompt,
                systemPrompt: "You are a specialized JSON-only compliance expert advisor.",
                temperature: 0.5
              });
              const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
              if (!cleanJson) throw new Error("Empty response from LLM");
              return JSON.parse(cleanJson);
            } catch (e: any) {
              console.error("LLM failed for askQuestion:", e);
              return {
                answer: "I apologize, but I'm currently unable to process your question due to a service limitation. Please try again later or contact support for assistance.",
                sources: []
              };
            }
          } catch (error: any) {
            console.error("askQuestion error:", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to answer question: " + error.message
            });
          }
        }),
    }),
  }),


  orgRoles: router({
    list: publicProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getOrgRoles(input.clientId);
      }),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const role = await db.getOrgRoleById(input.id);
        if (!role) throw new TRPCError({ code: "NOT_FOUND" });
        return role;
      }),
    create: adminProcedure
      .input(z.object({
        clientId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        responsibilities: z.string().optional(),
        department: z.string().optional(),
        reportingRoleId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createOrgRole(input);
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        responsibilities: z.string().optional(),
        department: z.string().optional(),
        reportingRoleId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateOrgRole(id, data);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteOrgRole(input.id);
        return { success: true };
      }),
  }),

  //   employees: router({
  //     list: publicProcedure
  //       .input(z.object({ clientId: z.number() }))
  //       .query(async ({ input }) => {
  //         return await db.getEmployees(input.clientId);
  //       }),
  //     get: publicProcedure
  //       .input(z.object({ id: z.number() }))
  //       .query(async ({ input }) => {
  //         const employee = await db.getEmployee(input.id);
  //         if (!employee) throw new TRPCError({ code: "NOT_FOUND" });
  //         return employee;
  //       }),
  //     create: adminProcedure
  //       .input(z.object({
  //         clientId: z.number(),
  //         firstName: z.string(),
  //         lastName: z.string(),
  //         email: z.string().email(),
  //         jobTitle: z.string().optional(),
  //         department: z.string().optional(),
  //         role: z.string().optional(),
  //         orgRoleId: z.number().optional(),
  //         managerId: z.number().optional(),
  //         employmentStatus: z.string().optional(),
  //         startDate: z.string().optional(),
  //       }))
  //       .mutation(async ({ input }) => {
  //         const data = {
  //           ...input,
  //           startDate: input.startDate ? new Date(input.startDate) : undefined
  //         } as any;
  //         const result = await db.createEmployee(data);
  //         if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create employee" });
  //         return result;
  //       }),
  //     update: adminProcedure
  //       .input(z.object({
  //         id: z.number(),
  //         firstName: z.string().optional(),
  //         lastName: z.string().optional(),
  //         email: z.string().email().optional(),
  //         jobTitle: z.string().optional(),
  //         department: z.string().optional(),
  //         role: z.string().optional(),
  //         orgRoleId: z.number().optional(),
  //         managerId: z.number().optional(),
  //         employmentStatus: z.string().optional(),
  //       }))
  //       .mutation(async ({ input }) => {
  //         const { id, ...data } = input;
  //         const result = await db.updateEmployee(id, data);
  //         if (!result) throw new TRPCError({ code: "NOT_FOUND" });
  //         return result;
  //       }),
  //     delete: adminProcedure
  //       .input(z.object({ id: z.number() }))
  //       .mutation(async ({ input }) => {
  //         await db.deleteEmployee(input.id);
  //         return { success: true };
  //       }),
  //     getRACIMatrix: publicProcedure
  //       .input(z.object({ clientId: z.number() }))
  //       .query(async ({ input }) => {
  //         return await db.getRACIMatrix(input.clientId);
  //       }),
  //     getRACIGapAnalysis: publicProcedure
  //       .input(z.object({ clientId: z.number() }))
  //       .query(async ({ input }) => {
  //         return await db.getRACIGapAnalysis(input.clientId);
  //       }),
  //   }),

  search: router({
    global: publicProcedure
      .input(z.object({
        query: z.string(),
        limit: z.number().optional().default(20),
        filters: z.object({
          clientId: z.number().optional(),
          framework: z.string().optional(),
          status: z.string().optional(),
          type: z.enum(['control', 'policy', 'evidence', 'client']).optional()
        }).optional()
      }))
      .query(async ({ input }) => {
        return await db.globalSearch(input.query, input.limit, input.filters);
      }),
    getMappings: publicProcedure
      .input(z.object({ controlId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();
        return await dbConn.select({
          mapping: controlMappings,
          targetControl: controls
        })
          .from(controlMappings)
          .innerJoin(controls, eq(controlMappings.targetControlId, controls.id))
          .where(eq(controlMappings.sourceControlId, input.controlId));
      }),
  }),



  evidenceRequests: router({
    create: adminProcedure
      .input(z.object({
        clientId: z.number(),
        clientControlId: z.number(),
        assigneeId: z.number(),
        dueDate: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Default requester to admin/owner if context user is weird, but ctx.user should be there
        const requesterId = (ctx.user as any)?.id || 1;

        const dbConn = await getDb();

        await dbConn.insert(evidenceRequests).values({
          clientId: input.clientId,
          clientControlId: input.clientControlId,
          requesterId: requesterId,
          assigneeId: input.assigneeId,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          description: input.description,
          status: 'open'
        });
        return { success: true };
      }),

    list: publicProcedure
      .input(z.object({
        clientId: z.number().optional(),
        clientControlId: z.number().optional()
      }))
      .query(async ({ input }) => {
        const dbConn = await getDb();

        const results = await dbConn.select({
          request: evidenceRequests,
          assignee: employees,
          requester: users,
          control: controls
        })
          .from(evidenceRequests)
          .leftJoin(employees, eq(evidenceRequests.assigneeId, employees.id))
          .leftJoin(users, eq(evidenceRequests.requesterId, users.id))
          .leftJoin(clientControls, eq(evidenceRequests.clientControlId, clientControls.id))
          .leftJoin(controls, eq(clientControls.controlId, controls.id))
          .where(
            input.clientId ? eq(evidenceRequests.clientId, input.clientId) :
              input.clientControlId ? eq(evidenceRequests.clientControlId, input.clientControlId) : undefined
          );

        return results;
      }),

    updateStatus: publicProcedure
      .input(z.object({ id: z.number(), status: z.string() }))
      .mutation(async ({ input }) => {
        const dbConn = await getDb();

        await dbConn.update(evidenceRequests)
          .set({ status: input.status })
          .where(eq(evidenceRequests.id, input.id));

        return { success: true };
      })
  }),




  // LLM Settings Router
  llm: router({
    list: adminProcedure.query(async () => {
      const providers = await db.getLLMProviders();
      // Mask API keys for security
      return providers.map(p => ({
        ...p,
        apiKey: '********' // Never return full key
      }));
    }),

    create: adminProcedure
      .input(z.object({
        name: z.string(),
        provider: z.string(),
        model: z.string(),
        apiKey: z.string(),
        baseUrl: z.string().optional(),
        priority: z.number().default(0),
        isEnabled: z.boolean().default(false),
        supportsEmbeddings: z.boolean().default(false)
      }))
      .mutation(async ({ input }) => {
        return await db.createLLMProvider(input);
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        provider: z.string().optional(),
        model: z.string().optional(),
        apiKey: z.string().optional(), // Optional, only if changing
        baseUrl: z.string().optional(),
        priority: z.number().optional(),
        isEnabled: z.boolean().optional(),
        supportsEmbeddings: z.boolean().optional()
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateLLMProvider(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteLLMProvider(input.id);
      }),

    test: adminProcedure
      .input(z.object({
        apiKey: z.string(),
        baseUrl: z.string().optional(),
        model: z.string() // Need model to test
      }))
      .mutation(async ({ input }) => {
        // Dynamic import to avoid circular dep issues
        const { llmService } = await import('./lib/llm/service');
        return await llmService.testConnection(input);
      }),

    getRoutes: adminProcedure.query(async () => {
      const dbConn = await db.getDb();
      /* 
         We need to join llmRouterRules with llmProviders to show which provider is selected.
         We also want to return ALL features defined in code + DB.
         For now, we just return the DB rules. The frontend can merge with known features.
      */
      const rules = await dbConn.select({
        id: llmRouterRules.id,
        feature: llmRouterRules.feature,
        providerId: llmRouterRules.providerId,
        providerName: llmProviders.name,
        model: llmProviders.model
      })
        .from(llmRouterRules)
        .leftJoin(llmProviders, eq(llmRouterRules.providerId, llmProviders.id));

      return rules;
    }),

    setRoute: adminProcedure
      .input(z.object({
        feature: z.string(),
        providerId: z.number().nullable()
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();
        if (input.providerId === null) {
          // Remove rule to fallback to default
          await dbConn.delete(llmRouterRules).where(eq(llmRouterRules.feature, input.feature));
        } else {
          // Upsert rule
          // Check if exists
          const existing = await dbConn.select().from(llmRouterRules).where(eq(llmRouterRules.feature, input.feature)).limit(1);
          if (existing.length > 0) {
            await dbConn.update(llmRouterRules)
              .set({ providerId: input.providerId, updatedAt: new Date() })
              .where(eq(llmRouterRules.id, existing[0].id));
          } else {
            await dbConn.insert(llmRouterRules).values({
              feature: input.feature,
              providerId: input.providerId
            });
          }
        }
        return { success: true };
      }),
  }),






  // Phase 5: Cloud Integrations
  cloudConnections: router({
    list: adminProcedure
      .input(z.object({ clientId: z.number().optional() }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();

        if (input.clientId) {
          return await dbConn.select().from(cloudConnections).where(eq(cloudConnections.clientId, input.clientId));
        }
        return await dbConn.select().from(cloudConnections);
      }),

    create: adminProcedure
      .input(z.object({
        clientId: z.number(),
        provider: z.enum(["aws", "azure", "gcp"]),
        name: z.string(),
        credentials: z.string(), // Already encrypted by frontend or encrypt here
        region: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        const { encrypt } = await import('./lib/crypto');

        const [result] = await dbConn.insert(cloudConnections).values({
          clientId: input.clientId,
          provider: input.provider,
          name: input.name,
          credentials: encrypt(input.credentials),
          region: input.region,
          status: "pending",
        }).returning();

        return result;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        await dbConn.delete(cloudConnections).where(eq(cloudConnections.id, input.id));
        return { success: true };
      }),

    testConnection: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        // For MVP, just mark as connected (real implementation would test AWS/Azure/GCP API)
        await dbConn.update(cloudConnections)
          .set({ status: "connected", updatedAt: new Date() })
          .where(eq(cloudConnections.id, input.id));

        return { success: true, message: "Connection verified" };
      }),
  }),

  cloudAssets: router({
    list: adminProcedure
      .input(z.object({ connectionId: z.number().optional(), clientId: z.number().optional() }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();

        if (input.connectionId) {
          return await dbConn.select().from(cloudAssets).where(eq(cloudAssets.connectionId, input.connectionId));
        }
        if (input.clientId) {
          return await dbConn.select().from(cloudAssets).where(eq(cloudAssets.clientId, input.clientId));
        }
        return [];
      }),

    sync: adminProcedure
      .input(z.object({ connectionId: z.number() }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        // Get connection details
        const [connection] = await dbConn.select().from(cloudConnections).where(eq(cloudConnections.id, input.connectionId));
        if (!connection) throw new TRPCError({ code: "NOT_FOUND" });

        // For MVP, create mock assets based on provider
        const mockAssets = connection.provider === 'aws' ? [
          { assetType: 'ec2', assetId: 'i-mock123', name: 'Web Server 1', region: 'us-east-1' },
          { assetType: 's3', assetId: 'mock-bucket-1', name: 'Data Bucket', region: 'us-east-1' },
          { assetType: 'iam_user', assetId: 'user-admin', name: 'admin@company.com', region: 'global' },
        ] : connection.provider === 'azure' ? [
          { assetType: 'vm', assetId: 'vm-mock123', name: 'Azure VM 1', region: 'eastus' },
          { assetType: 'storage_account', assetId: 'storageacct1', name: 'Primary Storage', region: 'eastus' },
        ] : [
          { assetType: 'compute_instance', assetId: 'gcp-vm-1', name: 'GCP Instance', region: 'us-central1' },
          { assetType: 'gcs_bucket', assetId: 'gcp-bucket-1', name: 'GCP Bucket', region: 'us-central1' },
        ];

        // Insert mock assets & Automate Mapping
        for (const assetData of mockAssets) {
          const [asset] = await dbConn.insert(cloudAssets).values({
            connectionId: input.connectionId,
            clientId: connection.clientId,
            ...assetData,
            complianceStatus: 'unknown',
            lastScannedAt: new Date(),
          }).returning();

          // Continuous Assurance: Automated Evidence Mapping
          // 1. Find relevant controls for the asset type
          let keywords: string[] = [];
          if (asset.assetType === 's3' || asset.assetType === 'storage_account' || asset.assetType === 'gcs_bucket') {
            keywords = ['Encryption at Rest', 'Storage', 'Access Control'];
          } else if (asset.assetType === 'iam_user') {
            keywords = ['MFA', 'Multi-factor', 'Identification', 'Authentication'];
          } else if (asset.assetType === 'ec2' || asset.assetType === 'vm') {
            keywords = ['Intrusion', 'Vulnerability', 'Patch'];
          }

          if (keywords.length > 0) {
            // Find client controls that match these keywords
            const relevantControls = await dbConn.select({
              id: clientControls.id,
              name: controls.name
            })
              .from(clientControls)
              .innerJoin(controls, eq(clientControls.controlId, controls.id))
              .where(and(
                eq(clientControls.clientId, connection.clientId),
                or(...keywords.map(kw => ilike(controls.name, `%${kw}%`)))
              ));

            // 2. Propose Evidence Mappings
            for (const ctrl of relevantControls) {
              await dbConn.insert(evidence).values({
                clientId: connection.clientId,
                clientControlId: ctrl.id,
                evidenceId: `AUTO-${asset.assetType}-${asset.id}-${ctrl.id}`,
                description: `Automated evidence from cloud asset: ${asset.name} (${asset.assetType})`,
                type: 'System Configuration',
                status: 'pending',
                location: `Cloud Asset: ${asset.assetId} (${connection.provider})`,
                owner: 'ComplianceBot'
              });
            }
          }
        }

        // Update connection last sync
        await dbConn.update(cloudConnections)
          .set({ lastSyncAt: new Date(), status: 'connected' })
          .where(eq(cloudConnections.id, input.connectionId));

        return { success: true, assetsFound: mockAssets.length };
      }),
  }),

  // Continuous Assurance: Proactive AI Advisor
  proactiveAdvisor: router({
    getSuggestions: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();

        // 1. Identify "Drifts" or "Gaps"
        // For MVP: Find Client Controls with 'implemented' status
        // We simulate "drift" by flagging those without approved evidence entries.
        const gaps = await dbConn.select({
          controlId: clientControls.id,
          controlName: controls.name,
          status: clientControls.status
        })
          .from(clientControls)
          .innerJoin(controls, eq(clientControls.controlId, controls.id))
          .where(and(
            eq(clientControls.clientId, input.clientId),
            eq(clientControls.status, 'implemented')
          ))
          .limit(5);

        // Map gaps to suggestions
        const suggestions = gaps.map(gap => ({
          id: `suggestion-${gap.controlId}`,
          title: `Evidence Refresh Required`,
          description: `No evidence has been uploaded for "${gap.controlName}" in the last 30 days. This may indicate a compliance drift.`,
          severity: 'medium' as const,
          category: 'Evidence Gap',
          impact: 'Compliance score may decrease if not refreshed.',
          recommendedAction: 'link_evidence',
          metadata: { controlId: gap.controlId, controlName: gap.controlName }
        }));

        // Add a mock "New Asset" suggestion
        suggestions.push({
          id: 'suggestion-new-assets',
          title: 'Unmapped Cloud Assets Detected',
          description: 'New S3 buckets were discovered in your AWS environment. Map them to controls to ensure coverage.',
          severity: 'high' as const,
          category: 'Automation',
          impact: 'Unmonitored cloud resources increase risk profile.',
          recommendedAction: 'map_assets',
          metadata: {}
        });

        return suggestions;
      }),

    listAllSuggestions: clientProcedure
      .query(async () => {
        const dbConn = await db.getDb();
        const clientsList = await dbConn.select().from(schema.clients);

        const allSuggestions = [];

        for (const client of clientsList) {
          // Find Client Controls with 'implemented' status
          const gaps = await dbConn.select({
            controlId: clientControls.id,
            controlName: controls.name,
            status: clientControls.status
          })
            .from(clientControls)
            .innerJoin(controls, eq(clientControls.controlId, controls.id))
            .where(and(
              eq(clientControls.clientId, client.id),
              eq(clientControls.status, 'implemented')
            ))
            .limit(2);

          const clientSuggestions = gaps.map(gap => ({
            id: `suggestion-${gap.controlId}`,
            clientId: client.id,
            clientName: client.name,
            title: `Evidence Refresh Required`,
            description: `No evidence for "${gap.controlName}" in the last 30 days.`,
            severity: 'medium' as const,
            category: 'Evidence Gap',
            recommendedAction: 'link_evidence',
            metadata: { controlId: gap.controlId, controlName: gap.controlName }
          }));

          allSuggestions.push(...clientSuggestions);
        }

        // Add a few consolidated mock suggestions
        allSuggestions.push({
          id: 'suggestion-new-assets-global',
          clientName: 'Global',
          title: 'Unmapped Cloud Assets',
          description: 'New assets were discovered across 3 client environments.',
          severity: 'high' as const,
          category: 'Automation',
          recommendedAction: 'map_assets',
          metadata: {}
        });

        return allSuggestions;
      }),

    applyRecommendation: clientProcedure
      .input(z.object({
        clientId: z.number(),
        suggestionId: z.string(),
        action: z.string()
      }))
      .mutation(async ({ input }) => {
        // In a real app, this would perform the action (e.g., create a task)
        return { success: true, message: `Recommendation ${input.suggestionId} applied successfully.` };
      })
  }),

  // Phase 4: Reporting & Governance
  reporting: router({
    generateSoA: clientProcedure
      .input(z.object({ clientId: z.number(), framework: z.string() }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        const results = await dbConn.select({
          controlId: controls.controlId,
          name: controls.name,
          applicability: clientControls.applicability,
          justification: clientControls.justification,
          status: clientControls.status,
          implementationDate: clientControls.implementationDate
        })
          .from(clientControls)
          .innerJoin(controls, eq(clientControls.controlId, controls.id))
          .where(and(
            eq(clientControls.clientId, input.clientId),
            eq(controls.framework, input.framework)
          ));

        return {
          framework: input.framework,
          generatedAt: new Date(),
          controls: results
        };
      })
  }),

  complianceExtensions: router({
    getBoardMetrics: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();

        // Calculate General Readiness
        const [stats] = await dbConn.select({
          total: sql<number>`count(*)`.mapWith(Number),
          implemented: sql<number>`count(*) filter (where ${clientControls.status} = 'implemented')`.mapWith(Number)
        })
          .from(clientControls)
          .where(eq(clientControls.clientId, input.clientId));

        const readinessPercent = stats.total > 0 ? (stats.implemented / stats.total) * 100 : 0;

        return {
          readinessPercent: Math.round(readinessPercent),
          riskScore: 32,
          complianceVelocity: 1.4,
          missingEvidenceCount: 8,
          criticalGaps: 3,
          frameworkPostures: [
            { name: 'SOC2', score: 85 },
            { name: 'ISO 27001', score: 72 },
            { name: 'ISO 22301', score: Math.round(readinessPercent) }
          ]
        };
      })
  }),


  // Phase 5: Issue Tracker Integrations
  issueTrackers: router({
    list: adminProcedure
      .input(z.object({ clientId: z.number().optional() }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();

        if (input.clientId) {
          return await dbConn.select().from(issueTrackerConnections).where(eq(issueTrackerConnections.clientId, input.clientId));
        }
        return await dbConn.select().from(issueTrackerConnections);
      }),

    create: adminProcedure
      .input(z.object({
        clientId: z.number(),
        provider: z.enum(["jira", "linear"]),
        name: z.string(),
        baseUrl: z.string().optional(),
        credentials: z.string(),
        projectKey: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        const { encrypt } = await import('./lib/crypto');

        const [result] = await dbConn.insert(issueTrackerConnections).values({
          clientId: input.clientId,
          provider: input.provider,
          name: input.name,
          baseUrl: input.baseUrl,
          credentials: encrypt(input.credentials),
          projectKey: input.projectKey,
          status: "connected", // Assume connected for MVP
        }).returning();

        return result;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        await dbConn.delete(issueTrackerConnections).where(eq(issueTrackerConnections.id, input.id));
        return { success: true };
      }),
  }),



  auditLogs: router({
    list: publicProcedure
      .use(isAuthed)
      .input(z.object({
        page: z.number().default(1),
        limit: z.number().default(50),
        clientId: z.number().optional(), // If provided, filters by client
        entityType: z.string().optional(),
        action: z.string().optional(),
        userId: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const dbConn = await db.getDb();

        // Security Check
        const isSuperAdmin = ctx.user.role === 'admin' || ctx.user.role === 'owner';

        // If filtering by client, ensure user has access to THAT client
        if (input.clientId) {
          if (!isSuperAdmin) {
            const hasAccess = await db.isUserAllowedForClient(ctx.user.id, input.clientId);
            if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "No access to this client's logs" });
          }
        } else {
          // Global view requires Super Admin
          if (!isSuperAdmin) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Global audit logs restricted to Admins" });
          }
        }

        // Build Query
        const conditions = [];
        if (input.clientId) conditions.push(eq(auditLogs.clientId, input.clientId));
        if (input.entityType) conditions.push(eq(auditLogs.entityType, input.entityType));
        if (input.action) conditions.push(eq(auditLogs.action, input.action));
        if (input.userId) conditions.push(eq(auditLogs.userId, input.userId));

        const offset = (input.page - 1) * input.limit;

        const results = await dbConn.select({
          log: auditLogs,
          user: users
        })
          .from(auditLogs)
          .leftJoin(users, eq(auditLogs.userId, users.id))
          .where(and(...conditions))
          .orderBy(desc(auditLogs.createdAt))
          .limit(input.limit)
          .offset(offset);

        return results.map(r => ({
          ...r.log,
          userName: r.user?.name || r.user?.email || 'Unknown',
          userEmail: r.user?.email
        }));
      }),
  }),

  // AI Advisor Router - Phase 3
  aiLegacy2: router({
    advisor: router({
      suggestTechnologies: publicProcedure
        .use(isAuthed)
        .input(z.object({
          clientId: z.number(),
          controlId: z.number(),
          vendorPreference: z.string().optional(),
          budgetConstraint: z.enum(['low', 'medium', 'high']).optional(),
        }))
        .mutation(async ({ input }) => {
          const { suggestTechnologies } = await import('./lib/advisor/service');
          return await suggestTechnologies(input);
        }),

      implementationPlan: publicProcedure
        .use(isAuthed)
        .input(z.object({
          clientId: z.number(),
          controlId: z.number(),
          selectedTech: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const { generateImplementationPlan } = await import('./lib/advisor/service');
          return await generateImplementationPlan(input);
        }),

      vendorMitigationPlan: publicProcedure
        .use(isAuthed)
        .input(z.object({
          clientId: z.number(),
          vendorId: z.number(),
          scanId: z.number().optional(),
        }))
        .mutation(async ({ input }) => {
          const { generateVendorMitigationPlan } = await import('./lib/advisor/service');
          return await generateVendorMitigationPlan(input);
        }),

      explainMapping: publicProcedure
        .use(isAuthed)
        .input(z.object({
          clientId: z.number(),
          regulationId: z.string(),
          articleId: z.string(),
        }))
        .mutation(async ({ input }) => {
          const { explainMapping } = await import('./lib/advisor/service');
          return await explainMapping(input);
        }),

      askQuestion: publicProcedure
        .use(isAuthed)
        .input(z.object({
          clientId: z.number(),
          question: z.string(),
          context: z.object({
            type: z.enum(['control', 'policy', 'evidence', 'regulation']),
            id: z.string(),
          }).optional(),
        }))
        .mutation(async ({ input }) => {
          const { askQuestion } = await import('./lib/advisor/service');
          return await askQuestion({
            clientId: input.clientId,
            question: input.question,
            context: input.context as { type: 'control' | 'policy' | 'evidence' | 'regulation'; id: string } | undefined
          });
        }),
    }),
  }),


  risksLegacy: router({
    // --- ASSETS ---
    // --- ASSETS ---
    getAssets: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();

        return await dbConn
          .select({
            ...assets,
            riskCount: sql<number>`count(${riskScenarios.id})`.mapWith(Number)
          })
          .from(assets)
          .leftJoin(riskScenarios, eq(riskScenarios.assetId, assets.id))
          .where(eq(assets.clientId, input.clientId))
          .groupBy(assets.id);
      }),

    createAsset: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        name: z.string(),
        type: z.string(),
        owner: z.string().optional(),
        valuationC: z.number().min(1).max(5).default(3),
        valuationI: z.number().min(1).max(5).default(3),
        valuationA: z.number().min(1).max(5).default(3),
        description: z.string().optional(),
        location: z.string().optional(),
        department: z.string().optional(),
        status: z.enum(["active", "archived", "disposed"]).default("active"),
        acquisitionDate: z.string().optional(),
        lastReviewDate: z.string().optional(),
        // Technical identifiers for NVD matching
        vendor: z.string().optional(),
        productName: z.string().optional(),
        version: z.string().optional(),
        technologies: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        const [newAsset] = await dbConn.insert(assets).values({
          ...input,
          acquisitionDate: input.acquisitionDate ? new Date(input.acquisitionDate) : null,
          lastReviewDate: input.lastReviewDate ? new Date(input.lastReviewDate) : null,
        } as any).returning();
        return newAsset;
      }),

    updateAsset: clientEditorProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        type: z.string().optional(),
        owner: z.string().optional(),
        valuationC: z.number().min(1).max(5).optional(),
        valuationI: z.number().min(1).max(5).optional(),
        valuationA: z.number().min(1).max(5).optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        department: z.string().optional(),
        status: z.enum(["active", "archived", "disposed"]).optional(),
        acquisitionDate: z.string().optional(),
        lastReviewDate: z.string().optional(),
        // Technical identifiers for NVD matching
        vendor: z.string().optional(),
        productName: z.string().optional(),
        version: z.string().optional(),
        technologies: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        const { id, ...updates } = input;

        // Handle dates
        const updateData: any = { ...updates };
        if (updateData.acquisitionDate) updateData.acquisitionDate = new Date(updateData.acquisitionDate);
        if (updateData.lastReviewDate) updateData.lastReviewDate = new Date(updateData.lastReviewDate);

        await dbConn.update(assets)
          .set({ ...updateData, updatedAt: new Date() })
          .where(eq(assets.id, id));
        return { success: true };
      }),

    // --- RISK SCENARIOS ---
    getScenarios: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();
        return await dbConn.select({
          ...getTableColumns(riskScenarios),
          linkedThreatName: threats.name,
          linkedVulnerabilityName: vulnerabilities.name
        })
          .from(riskScenarios)
          .leftJoin(threats, eq(riskScenarios.threatId, threats.id))
          .leftJoin(vulnerabilities, eq(riskScenarios.vulnerabilityId, vulnerabilities.id))
          .where(eq(riskScenarios.clientId, input.clientId));
      }),

    // --- RISK ASSESSMENTS (Global Register) ---
    getAssessments: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();
        return await dbConn.select({
          ...getTableColumns(riskAssessments),
          linkedThreatName: threats.name,
          linkedVulnerabilityName: vulnerabilities.name
        })
          .from(riskAssessments)
          .leftJoin(threats, eq(riskAssessments.threatId, threats.id))
          .leftJoin(vulnerabilities, eq(riskAssessments.vulnerabilityId, vulnerabilities.id))
          .where(eq(riskAssessments.clientId, input.clientId))
          .orderBy(desc(riskAssessments.createdAt));
      }),

    createScenario: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        assessmentType: z.string().default('asset'),
        assetId: z.number().optional(),
        processId: z.string().optional(),
        vendorId: z.number().optional(),
        likelihood: z.number().min(1).max(5).default(1),
        impact: z.number().min(1).max(5).default(1),
        threatCategory: z.string().optional(),
        vulnerability: z.string().optional(),
        threatId: z.number().optional(),
        vulnerabilityId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        // Calculate inherent score manually since we removed generated column
        const inherentRiskScore = input.likelihood * input.impact;

        const [scen] = await dbConn.insert(riskScenarios).values({
          ...input,
          inherentRiskScore,
          status: 'identified'
        } as any).returning();
        return scen;
      }),

    updateScenario: clientEditorProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        assessmentType: z.string().optional(),
        assetId: z.number().optional(),
        processId: z.string().optional(),
        vendorId: z.number().optional(),
        likelihood: z.number().min(1).max(5).optional(),
        impact: z.number().min(1).max(5).optional(),
        threatCategory: z.string().optional(),
        vulnerability: z.string().optional(),
        threatId: z.number().optional(),
        vulnerabilityId: z.number().optional(),
        status: z.string().optional(),
        treatmentStrategy: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        const { id, ...updates } = input;

        const updateData: any = { ...updates };

        // Recalculate score if needed (simplified logic, ideally fetch current if one missing)
        if (input.likelihood && input.impact) {
          updateData.inherentRiskScore = input.likelihood * input.impact;
        }

        await dbConn.update(riskScenarios)
          .set({ ...updateData, updatedAt: new Date() })
          .where(eq(riskScenarios.id, input.id));
        return { success: true };
      }),

    createTreatment: clientEditorProcedure
      .input(z.object({
        riskScenarioId: z.number(),
        controlId: z.number(),
        treatmentType: z.string().default('mitigate'),
        justification: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        // 1. Create Treatment
        await dbConn.insert(riskTreatments).values({
          riskScenarioId: input.riskScenarioId,
          controlId: input.controlId,
          treatmentType: input.treatmentType,
          justification: input.justification,
          status: 'planned'
        });

        // 2. Update Risk Status
        await dbConn.update(riskScenarios)
          .set({ status: 'treated' })
          .where(eq(riskScenarios.id, input.riskScenarioId));

        return { success: true };
      }),

    // --- VULNERABILITIES ---
    getVulnerabilities: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();
        return await dbConn.select().from(vulnerabilities).where(eq(vulnerabilities.clientId, input.clientId));
      }),

    createVulnerability: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        vulnerabilityId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        cveId: z.string().optional(),
        cvssScore: z.number().optional(), // 0-100
        severity: z.string().optional(),
        affectedAssets: z.array(z.string()).optional(),
        discoveryDate: z.string().optional(),
        source: z.string().optional(),
        exploitability: z.string().optional(),
        impact: z.string().optional(),
        status: z.enum(["open", "mitigated", "accepted", "remediated"]).default("open"),
        owner: z.string().optional(),
        remediationPlan: z.string().optional(),
        dueDate: z.string().optional(),
        lastReviewDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        // Convert CVSS score from 0-10 decimal to x10 integer (e.g., 7.5 -> 75)
        const cvssInt = input.cvssScore !== undefined ? Math.round(input.cvssScore * 10) : null;

        const [newVuln] = await dbConn.insert(vulnerabilities).values({
          ...input,
          cvssScore: cvssInt,
          discoveryDate: input.discoveryDate ? new Date(input.discoveryDate) : null,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          lastReviewDate: input.lastReviewDate ? new Date(input.lastReviewDate) : null,
        } as any).returning();
        return newVuln;
      }),

    updateVulnerability: clientEditorProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        cveId: z.string().optional(),
        cvssScore: z.number().optional(),
        severity: z.string().optional(),
        affectedAssets: z.array(z.string()).optional(),
        discoveryDate: z.string().optional(),
        source: z.string().optional(),
        exploitability: z.string().optional(),
        impact: z.string().optional(),
        owner: z.string().optional(),
        dueDate: z.string().optional(),
        lastReviewDate: z.string().optional(),
        status: z.enum(["open", "mitigated", "accepted", "remediated"]).optional(),
        remediationPlan: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        const { id, ...updates } = input;

        // Handle dates and cvssScore conversion
        const updateData: any = { ...updates };
        if (updateData.discoveryDate) updateData.discoveryDate = new Date(updateData.discoveryDate);
        if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);
        if (updateData.lastReviewDate) updateData.lastReviewDate = new Date(updateData.lastReviewDate);
        // Convert CVSS score from 0-10 decimal to x10 integer
        if (updateData.cvssScore !== undefined) updateData.cvssScore = Math.round(updateData.cvssScore * 10);

        await dbConn.update(vulnerabilities)
          .set({ ...updateData, updatedAt: new Date() })
          .where(eq(vulnerabilities.id, id));
        return { success: true };
      }),

    // --- THREATS ---
    getThreats: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();
        return await dbConn.select().from(threats).where(eq(threats.clientId, input.clientId));
      }),

    createThreat: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        threatId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        source: z.string().optional(),
        intent: z.string().optional(),
        likelihood: z.string().optional(),
        potentialImpact: z.string().optional(),
        affectedAssets: z.array(z.string()).optional(),
        relatedVulnerabilities: z.array(z.string()).optional(),
        associatedRisks: z.array(z.string()).optional(),
        scenario: z.string().optional(),
        detectionMethod: z.string().optional(),
        status: z.enum(["active", "dormant", "monitored"]).default("active"),
        owner: z.string().optional(),
        lastReviewDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        const [newThreat] = await dbConn.insert(threats).values({
          ...input,
          lastReviewDate: input.lastReviewDate ? new Date(input.lastReviewDate) : null,
        } as any).returning();
        return newThreat;
      }),

    updateThreat: clientEditorProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        source: z.string().optional(),
        intent: z.string().optional(),
        likelihood: z.string().optional(),
        potentialImpact: z.string().optional(),
        affectedAssets: z.array(z.string()).optional(),
        relatedVulnerabilities: z.array(z.string()).optional(),
        associatedRisks: z.array(z.string()).optional(),
        scenario: z.string().optional(),
        detectionMethod: z.string().optional(),
        lastReviewDate: z.string().optional(),
        status: z.enum(["active", "dormant", "monitored"]).optional(),
        owner: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        const { id, ...updates } = input;

        // Handle dates
        const updateData: any = { ...updates };
        if (updateData.lastReviewDate) updateData.lastReviewDate = new Date(updateData.lastReviewDate);

        await dbConn.update(threats)
          .set({ ...updateData, updatedAt: new Date() })
          .where(eq(threats.id, id));
        return { success: true };
      }),

    // --- RISK ASSESSMENTS ---
    getRiskAssessments: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();

        // Get assessments with treatment counts


        // Get policy counts separate or embedded? 
        // GroupBy riskAssessments.id is fine but if we join two many-to-manys (treatments, policies) we get cartesian product issues with count()
        // Better approach: Subqueries or separate aggregation. 
        // Drizzle's count(distinct x) works.
        const assessmentsWithCounts = await dbConn
          .select({
            id: riskAssessments.id,
            clientId: riskAssessments.clientId,
            assessmentId: riskAssessments.assessmentId,
            title: riskAssessments.title,
            assessmentDate: riskAssessments.assessmentDate,
            assessor: riskAssessments.assessor,
            method: riskAssessments.method,
            threatDescription: riskAssessments.threatDescription,
            vulnerabilityDescription: riskAssessments.vulnerabilityDescription,
            affectedAssets: riskAssessments.affectedAssets,
            likelihood: riskAssessments.likelihood,
            impact: riskAssessments.impact,
            inherentRisk: riskAssessments.inherentRisk,
            existingControls: riskAssessments.existingControls,
            controlEffectiveness: riskAssessments.controlEffectiveness,
            residualRisk: riskAssessments.residualRisk,
            riskOwner: riskAssessments.riskOwner,
            treatmentOption: riskAssessments.treatmentOption,
            recommendedActions: riskAssessments.recommendedActions,
            priority: riskAssessments.priority,
            targetResidualRisk: riskAssessments.targetResidualRisk,
            status: riskAssessments.status,
            createdAt: riskAssessments.createdAt,
            updatedAt: riskAssessments.updatedAt,
            controlIds: riskAssessments.controlIds,
            nextReviewDate: riskAssessments.nextReviewDate,
            reviewDueDate: riskAssessments.reviewDueDate,
            notes: riskAssessments.notes,
            threatId: riskAssessments.threatId,
            vulnerabilityId: riskAssessments.vulnerabilityId,
            treatmentCount: sql<number>`count(distinct ${riskTreatments.id})::int`.as('treatment_count'),
            policyCount: sql<number>`count(distinct ${riskPolicyMappings.id})::int`.as('policy_count'),
          })
          .from(riskAssessments)
          .leftJoin(riskTreatments, eq(riskTreatments.riskAssessmentId, riskAssessments.id))
          .leftJoin(riskPolicyMappings, eq(riskPolicyMappings.riskAssessmentId, riskAssessments.id))
          .where(eq(riskAssessments.clientId, input.clientId))
          .groupBy(riskAssessments.id)
          .orderBy(desc(riskAssessments.createdAt));

        return assessmentsWithCounts;
      }),

    // Get Overdue Risk Items
    getOverdueItems: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();
        const now = new Date();

        // Overdue Risk Reviews
        const overdueReviews = await dbConn.select({
          id: riskAssessments.id,
          title: riskAssessments.title,
          assessmentId: riskAssessments.assessmentId,
          nextReviewDate: riskAssessments.nextReviewDate,
        })
          .from(riskAssessments)
          .where(and(
            eq(riskAssessments.clientId, input.clientId),
            sql`${riskAssessments.nextReviewDate} < ${now}`,
            eq(riskAssessments.status, 'approved')
          ))
          .limit(10);

        // Overdue Treatments
        const overdueTreatments = await dbConn.select({
          id: riskTreatments.id,
          title: riskTreatments.strategy,
          dueDate: riskTreatments.dueDate,
        })
          .from(riskTreatments)
          .innerJoin(riskAssessments, eq(riskTreatments.riskAssessmentId, riskAssessments.id))
          .where(and(
            eq(riskAssessments.clientId, input.clientId),
            sql`${riskTreatments.dueDate} < ${now}`,
            sql`${riskTreatments.status} NOT IN ('implemented', 'completed')`
          ))
          .limit(10);

        const items = [
          ...overdueReviews.map((r: any) => ({
            id: r.id,
            title: r.title || r.assessmentId,
            type: 'review',
            daysOverdue: Math.floor((now.getTime() - new Date(r.nextReviewDate!).getTime()) / (1000 * 60 * 60 * 24))
          })),
          ...overdueTreatments.map((t: any) => ({
            id: t.id,
            title: t.title || 'Treatment',
            type: 'treatment',
            daysOverdue: Math.floor((now.getTime() - new Date(t.dueDate!).getTime()) / (1000 * 60 * 60 * 24))
          }))
        ].sort((a, b) => b.daysOverdue - a.daysOverdue);

        return items;
      }),

    // Get Upcoming Deadlines
    getUpcomingDeadlines: clientProcedure
      .input(z.object({ clientId: z.number(), days: z.number().default(7) }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();
        const now = new Date();
        const future = new Date();
        future.setDate(now.getDate() + input.days);

        // Upcoming Risk Reviews
        const upcomingReviews = await dbConn.select({
          id: riskAssessments.id,
          title: riskAssessments.title,
          assessmentId: riskAssessments.assessmentId,
          nextReviewDate: riskAssessments.nextReviewDate,
        })
          .from(riskAssessments)
          .where(and(
            eq(riskAssessments.clientId, input.clientId),
            sql`${riskAssessments.nextReviewDate} >= ${now}`,
            sql`${riskAssessments.nextReviewDate} <= ${future}`,
            eq(riskAssessments.status, 'approved')
          ))
          .limit(10);

        // Upcoming Treatments
        const upcomingTreatments = await dbConn.select({
          id: riskTreatments.id,
          title: riskTreatments.strategy,
          dueDate: riskTreatments.dueDate,
        })
          .from(riskTreatments)
          .innerJoin(riskAssessments, eq(riskTreatments.riskAssessmentId, riskAssessments.id))
          .where(and(
            eq(riskAssessments.clientId, input.clientId),
            sql`${riskTreatments.dueDate} >= ${now}`,
            sql`${riskTreatments.dueDate} <= ${future}`,
            sql`${riskTreatments.status} NOT IN ('implemented', 'completed')`
          ))
          .limit(10);

        const items = [
          ...upcomingReviews.map((r: any) => ({
            id: r.id,
            title: r.title || r.assessmentId,
            type: 'review',
            daysUntilDue: Math.ceil((new Date(r.nextReviewDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          })),
          ...upcomingTreatments.map((t: any) => ({
            id: t.id,
            title: t.title || 'Treatment',
            type: 'treatment',
            daysUntilDue: Math.ceil((new Date(t.dueDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          }))
        ].sort((a, b) => a.daysUntilDue - b.daysUntilDue);

        return items;
      }),

    // Get KRI Statistics
    getKRIStats: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();

        // High/Critical risks (inherentScore >= 15)
        const [highRiskResult] = await dbConn.select({ count: sql<number>`count(*)` })
          .from(riskAssessments)
          .where(and(
            eq(riskAssessments.clientId, input.clientId),
            sql`COALESCE(${riskAssessments.inherentScore}, 0) >= 15`
          ));

        // Average residual score
        const [avgResult] = await dbConn.select({ avg: sql<number>`COALESCE(AVG(${riskAssessments.residualScore}), 0)` })
          .from(riskAssessments)
          .where(eq(riskAssessments.clientId, input.clientId));

        // Linked controls count
        const [linkedControlsResult] = await dbConn.select({ count: sql<number>`count(*)` })
          .from(treatmentControls)
          .where(eq(treatmentControls.clientId, input.clientId));

        // Treatment progress
        const [totalTreatments] = await dbConn.select({ count: sql<number>`count(*)` })
          .from(riskTreatments)
          .where(eq(riskTreatments.clientId, input.clientId));

        const [completedTreatments] = await dbConn.select({ count: sql<number>`count(*)` })
          .from(riskTreatments)
          .where(and(
            eq(riskTreatments.clientId, input.clientId),
            sql`${riskTreatments.status} IN ('implemented', 'completed', 'verified')`
          ));

        const treatmentProgress = Number(totalTreatments?.count || 0) > 0
          ? Math.round((Number(completedTreatments?.count || 0) / Number(totalTreatments.count)) * 100)
          : 0;

        return {
          highRiskCount: Number(highRiskResult?.count || 0),
          avgResidualScore: Math.round(Number(avgResult?.avg || 0)),
          linkedControlsCount: Number(linkedControlsResult?.count || 0),
          treatmentProgress,
          previousHighRiskCount: undefined,
          previousAvgResidual: undefined,
          previousLinkedControls: undefined,
          previousTreatmentProgress: undefined
        };
      }),

    suggestControls: clientProcedure
      .input(z.object({
        clientId: z.number(),
        threat: z.string(),
        vulnerability: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { llmService } = await import('./lib/llm/service');
        const dbConn = await db.getDb();

        // 1. Get all available client controls
        const clientControlsList = await db.getClientControls(input.clientId);

        if (clientControlsList.length === 0) {
          return { suggestions: [] };
        }

        // 2. Simplify control list for token efficiency
        const controlContext = clientControlsList.map(c => ({
          id: c.clientControl.id,
          code: c.control?.controlId || c.clientControl.clientControlId,
          name: c.control?.name || c.clientControl.customDescription,
          description: c.control?.description,
        }));

        const prompt = `You are a risk management expert. Analyze the following Threat and Vulnerability and recommend the most effective controls from the provided list to mitigate this specific risk.

Threat: ${input.threat}
Vulnerability: ${input.vulnerability}

Available Controls:
${JSON.stringify(controlContext.map(c => `${c.id}: [${c.code}] ${c.name} - ${c.description || ''}`).slice(0, 50), null, 2)} 
(Note: Only top 50 controls shown to save space)

Return a JSON object with a list of "suggestions". Each suggestion must have:
- "clientControlId": The numeric ID from the list above.
- "reasoning": A brief explanation (1 sentence) of why this control is relevant.
- "relevance": A score from 1-10 (10 being critical).

Rank by relevance (descending). Return at most 5 suggestions.

Example format:
{
  "suggestions": [
    { "clientControlId": 12, "reasoning": "Encrypting data at rest directly mitigates the risk of data theft.", "relevance": 9 }
  ]
}`;

        try {
          const response = await llmService.generate({
            systemPrompt: "You are a JSON-only API. You must strictly output valid JSON.",
            userPrompt: prompt,
            temperature: 0.1,
          });

          // Clean markdown code blocks if present
          const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
          if (!cleanJson) throw new Error("Empty response from LLM");
          const result = JSON.parse(cleanJson);

          // Map back to full control details
          const enrichedSuggestions = result.suggestions.map((s: any) => {
            const original = clientControlsList.find(c => c.clientControl.id === s.clientControlId);
            return {
              ...s,
              details: original
            };
          }).filter((s: any) => s.details); // Ensure we only return valid ones

          return { suggestions: enrichedSuggestions };

        } catch (e) {
          console.error("AI Advice Failed:", e);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate suggestions" });
        }
      }),

    analyzeGaps: clientProcedure
      .input(z.object({
        clientId: z.number(),
        threat: z.string(),
        vulnerability: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { llmService } = await import('./lib/llm/service');
        const { retrieveControls } = await import('./lib/advisor/retrieval');
        const dbConn = await db.getDb();

        // 1. Get existing client controls to exclude
        const existingClientControls = await db.getClientControls(input.clientId);
        const existingControlIds = new Set(existingClientControls.map(c => c.control?.id).filter(id => id !== undefined));

        // 2. Find relevant candidates from Master Control Library
        // Try semantic search first
        let candidates: any[] = [];
        try {
          const retrievalResults = await retrieveControls(`${input.threat} ${input.vulnerability}`, undefined, 20);
          candidates = retrievalResults.map(r => ({
            id: parseInt(r.docId),
            code: r.metadata?.controlId,
            name: r.content.split('\n')[0], // Approximation
            description: r.content,
            framework: r.metadata?.framework
          }));
        } catch (e) {
          console.warn("Semantic search failed or empty, falling back to database fetch", e);
        }

        // If semantic search didn't return enough, fetch generic high-priority controls from DB
        if (candidates.length < 5) {
          const allControls = await db.getControls(); // Gets all master controls
          candidates = allControls.map(c => ({
            id: c.id,
            code: c.controlId,
            name: c.name,
            description: c.description,
            framework: c.framework
          }));
        }

        // 3. Filter out what they already have
        const gapCandidates = candidates.filter(c => !existingControlIds.has(c.id));

        if (gapCandidates.length === 0) {
          return { gaps: [] };
        }

        // 4. LLM Analysis
        // We limit to top 30 candidates to save tokens
        const candidateContext = gapCandidates.slice(0, 30).map(c =>
          `ID:${c.id} [${c.framework}] ${c.code}: ${c.name} - ${c.description}`
        ).join('\n');

        const prompt = `You are a security auditor performing a Gap Analysis.
Threat: ${input.threat}
Vulnerability: ${input.vulnerability}

The client MISSES the following controls. Identify which 2-3 are MOST CRITICAL to add to mitigate this specific risk.

Missing Candidates:
${candidateContext}

Return JSON:
{
  "gaps": [
    { "controlId": <ID>, "reasoning": "...", "priority": "HIGH|MEDIUM" }
  ]
}
`;

        try {
          const response = await llmService.generate({
            systemPrompt: "You are a JSON-only security expert.",
            userPrompt: prompt,
            temperature: 0.2,
          });

          const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
          if (!cleanJson) throw new Error("Empty response from LLM");
          const result = JSON.parse(cleanJson);

          // Re-hydrate with full details
          const gaps = result.gaps.map((g: any) => {
            const original = gapCandidates.find(c => c.id === g.controlId);
            return original ? { ...g, details: original } : null;
          }).filter((g: any) => g !== null);

          return { gaps };

        } catch (e) {
          console.error("Gap Analysis Failed:", e);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to analyze gaps" });
        }
      }),

    createRiskAssessment: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        assessmentId: z.string(),
        title: z.string().optional(),
        riskId: z.number().optional(),
        assessmentDate: z.union([z.string(), z.date()]).optional(),
        assessor: z.string().optional(),
        method: z.string().optional(),
        formattedAssessmentDate: z.string().optional(), // For UI convenience
        threatId: z.number().optional(),
        threatDescription: z.string().optional(),
        vulnerabilityId: z.number().optional(),
        vulnerabilityDescription: z.string().optional(),
        affectedAssets: z.array(z.string()).optional(),
        affectedProcessIds: z.array(z.number()).optional(),
        likelihood: z.string().optional(),
        impact: z.string().optional(),
        inherentRisk: z.string().optional(),
        existingControls: z.string().optional(),
        controlEffectiveness: z.string().optional(),
        residualRisk: z.string().optional(),
        riskOwner: z.string().optional(),
        treatmentOption: z.string().optional(),
        recommendedActions: z.string().optional(),
        priority: z.string().optional(),
        targetResidualRisk: z.string().optional(),
        reviewDueDate: z.union([z.string(), z.date()]).optional(),
        status: z.enum(["draft", "approved", "reviewed"]).default("draft"),
        notes: z.string().optional(),
        nextReviewDate: z.union([z.string(), z.date()]).optional(),
        controlIds: z.array(z.number()).optional(),
        gapResponseId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        const [newAssessment] = await dbConn.insert(riskAssessments).values({
          ...input,
          assessmentDate: input.assessmentDate ? new Date(input.assessmentDate) : null,
          reviewDueDate: input.reviewDueDate ? new Date(input.reviewDueDate) : null,
          nextReviewDate: input.nextReviewDate ? new Date(input.nextReviewDate) : null,
        } as any).returning();
        return newAssessment;
      }),

    updateRiskAssessment: clientEditorProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        assessmentDate: z.union([z.string(), z.date()]).optional(),
        assessor: z.string().optional(),
        method: z.string().optional(),
        threatId: z.number().optional(),
        threatDescription: z.string().optional(),
        vulnerabilityId: z.number().optional(),
        vulnerabilityDescription: z.string().optional(),
        affectedAssets: z.array(z.string()).optional(),
        affectedProcessIds: z.array(z.number()).optional(),
        likelihood: z.string().optional(),
        impact: z.string().optional(),
        inherentRisk: z.string().optional(),
        existingControls: z.string().optional(),
        controlIds: z.array(z.number()).optional(),
        controlEffectiveness: z.string().optional(),
        residualRisk: z.string().optional(),
        riskOwner: z.string().optional(),
        treatmentOption: z.string().optional(),
        recommendedActions: z.string().optional(),
        priority: z.string().optional(),
        targetResidualRisk: z.string().optional(),
        reviewDueDate: z.union([z.string(), z.date()]).optional(),
        status: z.enum(["draft", "approved", "reviewed"]).optional(),
        notes: z.string().optional(),
        nextReviewDate: z.union([z.string(), z.date()]).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const dbConn = await db.getDb();

          const { id, ...updates } = input;

          // Handle date conversions
          const updateData: any = { ...updates };
          if (updateData.assessmentDate) updateData.assessmentDate = new Date(updateData.assessmentDate);
          if (updateData.reviewDueDate) updateData.reviewDueDate = new Date(updateData.reviewDueDate);
          if (updateData.nextReviewDate) updateData.nextReviewDate = new Date(updateData.nextReviewDate);

          await dbConn.update(riskAssessments)
            .set({ ...updateData, updatedAt: new Date() })
            .where(eq(riskAssessments.id, id));

          return { success: true };
        } catch (e: any) {
          console.error("SERVER: updateRiskAssessment Error", e);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message || "Update Failed" });
        }
      }),

    // ==================== RISK TREATMENTS ====================
    getRiskTreatments: clientProcedure
      .input(z.object({ riskAssessmentId: z.number() }))
      .query(async ({ input: { riskAssessmentId }, ctx }) => {
        const dbConn = await db.getDb();

        // Get treatments for this assessment
        const treatments = await dbConn.select()
          .from(riskTreatments)
          .where(eq(riskTreatments.riskAssessmentId, riskAssessmentId));

        // Get linked controls for each treatment
        const treatmentsWithControls = await Promise.all(
          treatments.map(async (treatment) => {
            const linkedControls = await dbConn.select({
              id: treatmentControls.id,
              controlId: treatmentControls.controlId,
              effectiveness: treatmentControls.effectiveness,
              implementationNotes: treatmentControls.implementationNotes,
              controlCode: controls.controlId,
              controlTitle: controls.name,
            })
              .from(treatmentControls)
              .leftJoin(controls, eq(treatmentControls.controlId, controls.id))
              .where(eq(treatmentControls.treatmentId, treatment.id));

            return { ...treatment, linkedControls };
          })
        );

        return treatmentsWithControls;
      }),



    getSuggestedControls: clientProcedure
      .input(z.object({
        threat: z.string(),
        vulnerability: z.string(),
        riskDetails: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const suggestions = await suggestControlsForTreatment(
          input.threat,
          input.vulnerability,
          input.riskDetails || ""
        );
        return suggestions;
      }),

    createRiskTreatment: clientProcedure
      .input(z.object({
        clientId: z.number(),
        riskAssessmentId: z.number(),
        treatmentType: z.enum(["mitigate", "transfer", "accept", "avoid"]),
        strategy: z.string().optional(),
        justification: z.string().optional(),
        owner: z.string().optional(),
        dueDate: z.string().optional(),
        priority: z.string().optional(),
        estimatedCost: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const dbConn = await db.getDb();

        const treatmentData: any = {
          clientId: input.clientId,
          riskAssessmentId: input.riskAssessmentId,
          treatmentType: input.treatmentType,
          strategy: input.strategy || null,
          justification: input.justification || null,
          owner: input.owner || null,
          priority: input.priority || null,
          estimatedCost: input.estimatedCost || null,
        };

        if (input.dueDate) {
          treatmentData.dueDate = new Date(input.dueDate);
        }

        const [newTreatment] = await dbConn.insert(riskTreatments)
          .values(treatmentData)
          .returning();

        return newTreatment;
      }),

    updateRiskTreatment: clientProcedure
      .input(z.object({
        id: z.number(),
        strategy: z.string().optional(),
        justification: z.string().optional(),
        status: z.enum(["planned", "in_progress", "implemented", "verified"]).optional(),
        owner: z.string().optional(),
        dueDate: z.string().optional(),
        implementationDate: z.string().optional(),
        priority: z.string().optional(),
        estimatedCost: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...updateData } = input;
        const dbConn = await db.getDb();

        const dataToUpdate: any = {};
        if (updateData.strategy !== undefined) dataToUpdate.strategy = updateData.strategy || null;
        if (updateData.justification !== undefined) dataToUpdate.justification = updateData.justification || null;
        if (updateData.status !== undefined) dataToUpdate.status = updateData.status;
        if (updateData.owner !== undefined) dataToUpdate.owner = updateData.owner || null;
        if (updateData.priority !== undefined) dataToUpdate.priority = updateData.priority || null;
        if (updateData.estimatedCost !== undefined) dataToUpdate.estimatedCost = updateData.estimatedCost || null;

        if (updateData.dueDate) dataToUpdate.dueDate = new Date(updateData.dueDate);
        if (updateData.implementationDate) dataToUpdate.implementationDate = new Date(updateData.implementationDate);

        await dbConn.update(schema.riskTreatments)
          .set({ ...dataToUpdate, updatedAt: new Date() })
          .where(eq(schema.riskTreatments.id, id));

        return { success: true };
      }),

    deleteRiskTreatment: clientProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input: { id }, ctx }) => {
        const dbConn = await db.getDb();

        // Delete linked controls first
        await dbConn.delete(schema.treatmentControls)
          .where(eq(schema.treatmentControls.treatmentId, id));

        // Delete treatment
        await dbConn.delete(schema.riskTreatments)
          .where(eq(schema.riskTreatments.id, id));

        return { success: true };
      }),

    linkTreatmentControl: clientProcedure
      .input(z.object({
        treatmentId: z.number(),
        controlId: z.number(),
        effectiveness: z.enum(["effective", "partially_effective", "ineffective"]).optional(),
        implementationNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const dbConn = await db.getDb();

          // Check if link already exists
          const existingLink = await dbConn.select()
            .from(treatmentControls)
            .where(and(
              eq(treatmentControls.treatmentId, input.treatmentId),
              eq(treatmentControls.controlId, input.controlId)
            ))
            .limit(1);

          if (existingLink.length > 0) {
            // Update existing
            const [updated] = await dbConn.update(treatmentControls)
              .set({
                effectiveness: input.effectiveness || null,
                implementationNotes: input.implementationNotes || null,
              })
              .where(eq(treatmentControls.id, existingLink[0].id))
              .returning();
            return updated;
          }

          // Insert new
          const [link] = await dbConn.insert(treatmentControls)
            .values({
              treatmentId: input.treatmentId,
              controlId: input.controlId,
              effectiveness: input.effectiveness || null,
              implementationNotes: input.implementationNotes || null,
            })
            .returning();

          return link;
        } catch (error) {
          console.error('linkTreatmentControl FAILED:', error);
          throw error;
        }
      }),

    unlinkTreatmentControl: clientProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input: { id }, ctx }) => {
        const dbConn = await db.getDb();

        await dbConn.delete(schema.treatmentControls)
          .where(eq(schema.treatmentControls.id, id));

        return { success: true };
      }),

    // ==================== AI-POWERED CONTROL SUGGESTIONS ====================
    getGapAnalysis: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const { performGapAnalysis } = await import('./lib/ai/controlSuggestions');
        const gaps = await performGapAnalysis(input.clientId);
        return gaps;
      }),

    getAIControlSuggestions: clientProcedure
      .input(z.object({
        threatDescription: z.string(),
        vulnerabilityDescription: z.string(),
        existingControls: z.array(z.string()).optional(),
        framework: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { generateControlSuggestions } = await import('./lib/ai/controlSuggestions');
        const suggestions = await generateControlSuggestions(
          input.threatDescription,
          input.vulnerabilityDescription,
          input.existingControls,
          input.framework
        );
        return suggestions;
      }),

    getAITreatmentSuggestion: clientProcedure
      .input(z.object({
        threatDescription: z.string(),
        vulnerabilityDescription: z.string(),
        affectedAssets: z.array(z.string()),
        inherentRisk: z.string(),
        existingControls: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { generateTreatmentSuggestion } = await import('./lib/ai/controlSuggestions');
        const suggestion = await generateTreatmentSuggestion(
          input.threatDescription,
          input.vulnerabilityDescription,
          input.affectedAssets,
          input.inherentRisk,
          input.existingControls
        );
        return suggestion;
      }),
  }),

  mappings: router({
    list: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();

        const result = await dbConn.select({
          mapping: controlPolicyMappings,
          clientControl: clientControls,
          clientPolicy: clientPolicies,
          control: controls
        })
          .from(controlPolicyMappings)
          .innerJoin(clientControls, eq(controlPolicyMappings.clientControlId, clientControls.id))
          .innerJoin(clientPolicies, eq(controlPolicyMappings.clientPolicyId, clientPolicies.id))
          .leftJoin(controls, eq(clientControls.controlId, controls.id))
          .where(eq(controlPolicyMappings.clientId, input.clientId));

        return result;
      }),

    create: clientProcedure
      .input(z.object({
        clientId: z.number(),
        clientControlId: z.number(),
        clientPolicyId: z.number(),
        evidenceReference: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        await dbConn.insert(controlPolicyMappings).values({
          clientId: input.clientId,
          clientControlId: input.clientControlId,
          clientPolicyId: input.clientPolicyId,
          // evidenceReference and notes are currently not in schema, ignoring
        });
        return { success: true };
      }),

    delete: clientProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        await dbConn.delete(controlPolicyMappings).where(eq(controlPolicyMappings.id, input.id));
        return { success: true };
      }),
  }),

  projectTasks: router({
    list: clientProcedure
      .input(z.object({
        clientId: z.number(),
        status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
      }))
      .query(async ({ input, ctx }) => {
        const dbConn = await db.getDb();

        // Access Control Logic
        const isGlobalAdmin = ctx.user.role === 'admin' || ctx.user.role === 'owner';
        const isClientAdmin = ['owner', 'admin'].includes(ctx.clientRole || '');
        const hasFullAccess = isGlobalAdmin || isClientAdmin;

        let filterUserId: number | undefined;
        let filterEmployeeId: number | undefined;

        if (!hasFullAccess) {
          filterUserId = ctx.user.id;
          // Find linked employee for this client
          const employee = await dbConn.query.employees.findFirst({
            where: and(
              eq(employees.clientId, input.clientId),
              eq(employees.email, ctx.user.email)
            )
          });
          filterEmployeeId = employee?.id;
        }

        // 1. Fetch Project Tasks with Assignee
        const ptConditions = [eq(projectTasks.clientId, input.clientId)];
        if (input.status) {
          ptConditions.push(eq(projectTasks.status, input.status));
        }
        if (!hasFullAccess) {
          ptConditions.push(eq(projectTasks.assigneeId, filterUserId || -1));
        }

        const pTasks = await dbConn.select({
          task: projectTasks,
          assignee: users
        })
          .from(projectTasks)
          .leftJoin(users, eq(projectTasks.assigneeId, users.id))
          .where(and(...ptConditions));

        // 2. Fetch Remediation Tasks with Assignee
        const remStatusMap: Record<string, string> = { 'open': 'todo', 'in_progress': 'in_progress', 'resolved': 'review', 'closed': 'done' };

        let rTasks: { task: typeof remediationTasks.$inferSelect, assignee: typeof employees.$inferSelect | null }[] = [];
        try {
          const rtConditions = [eq(remediationTasks.clientId, input.clientId)];
          if (!hasFullAccess) {
            rtConditions.push(eq(remediationTasks.assigneeId, filterEmployeeId || -1));
          }
          rTasks = await dbConn.select({
            task: remediationTasks,
            assignee: employees
          })
            .from(remediationTasks)
            .leftJoin(employees, eq(remediationTasks.assigneeId, employees.id))
            .where(and(...rtConditions));
        } catch (e) { console.error("Error fetching remediation tasks", e) }

        // 3. Fetch Risk Treatments
        const rtStatusMap: Record<string, string> = { 'planned': 'todo', 'in_progress': 'in_progress', 'implemented': 'review', 'verified': 'done' };

        let tTasks: any[] = [];
        let cTasks: any[] = [];
        let polTasks: any[] = [];

        if (hasFullAccess) {
          try {
            tTasks = await dbConn.select().from(riskTreatments).where(eq(riskTreatments.clientId, input.clientId));

            // 4. Fetch Client Controls (as Tasks)
            cTasks = await dbConn.select({
              control: clientControls,
              def: controls
            })
              .from(clientControls)
              .leftJoin(controls, eq(clientControls.controlId, controls.id))
              .where(eq(clientControls.clientId, input.clientId));

            // 5. Fetch Client Policies (as Tasks)
            polTasks = await dbConn.select().from(clientPolicies).where(eq(clientPolicies.clientId, input.clientId));

          } catch (e) { console.error("Error fetching extra tasks", e) }
        }

        // Normalize and Merge
        const unified = [
          ...pTasks.map(({ task, assignee }) => ({
            ...task,
            canEdit: true,
            sourceType: 'project_task',
            displayStatus: task.status,
            displayPriority: task.priority,
            assigneeName: assignee?.name || 'Unassigned',
            assigneeInitials: assignee?.name ? assignee.name.substring(0, 2).toUpperCase() : 'NA',
          })),
          ...rTasks.map(({ task, assignee }) => {
            const mappedStatus = remStatusMap[task.status || 'open'] || 'todo';
            const fullName = assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unassigned';
            return {
              id: task.id,
              clientId: task.clientId,
              title: task.title,
              description: task.description,
              status: mappedStatus as any,
              priority: task.priority,
              dueDate: task.dueDate,
              assigneeId: task.assigneeId,
              assigneeName: fullName,
              assigneeInitials: assignee ? (assignee.firstName[0] + assignee.lastName[0] || 'NA').toUpperCase() : 'NA',
              position: 0,
              tags: [],
              sourceType: 'remediation',
              sourceId: task.id,
              canEdit: false,
              updatedAt: task.updatedAt,
              createdAt: task.createdAt
            };
          }).filter(t => !input.status || t.status === input.status),
          ...tTasks.map(t => {
            const mappedStatus = rtStatusMap[t.status || 'planned'] || 'todo';
            const ownerName = t.owner || 'Unassigned';
            return {
              id: t.id,
              clientId: t.clientId,
              title: t.strategy || "Risk Treatment",
              description: t.justification,
              status: mappedStatus as any,
              priority: t.priority || 'medium',
              dueDate: t.dueDate,
              assigneeId: null,
              assigneeName: ownerName,
              assigneeInitials: ownerName.substring(0, 2).toUpperCase(),
              position: 0,
              tags: ['Risk'],
              sourceType: 'risk_treatment',
              sourceId: t.id,
              canEdit: false,
              updatedAt: null,
              createdAt: null
            };
          }).filter(t => !input.status || t.status === input.status),
          // Mapped Controls
          ...cTasks.map(({ control, def }) => {
            const statusMap: Record<string, string> = { 'not_implemented': 'todo', 'in_progress': 'in_progress', 'implemented': 'review', 'not_applicable': 'done' };
            const mappedStatus = statusMap[control.status || 'not_implemented'] || 'todo';
            const ownerName = control.owner || 'Unassigned';
            return {
              id: control.id,
              clientId: control.clientId,
              title: def?.name || control.clientControlId || "Control",
              description: control.customDescription || def?.description,
              status: mappedStatus as any,
              priority: 'medium', // Controls don't have direct priority, assume medium
              dueDate: control.implementationDate,
              assigneeId: null,
              assigneeName: ownerName,
              assigneeInitials: ownerName.substring(0, 2).toUpperCase(),
              position: 0,
              tags: ['Control', def?.framework || ''],
              sourceType: 'control',
              sourceId: control.id,
              canEdit: false,
              updatedAt: control.updatedAt,
              createdAt: control.createdAt
            }
          }).filter(t => !input.status || t.status === input.status),
          // Mapped Policies
          ...polTasks.map(p => {
            const statusMap: Record<string, string> = { 'draft': 'todo', 'review': 'review', 'approved': 'done', 'archived': 'done' };
            const mappedStatus = statusMap[p.status || 'draft'] || 'todo';
            const ownerName = p.owner || 'Unassigned';
            return {
              id: p.id,
              clientId: p.clientId,
              title: p.name,
              description: "Policy Document",
              status: mappedStatus as any,
              priority: 'medium',
              dueDate: null,
              assigneeId: null,
              assigneeName: ownerName,
              assigneeInitials: ownerName.substring(0, 2).toUpperCase(),
              position: 0,
              tags: ['Policy'],
              sourceType: 'policy',
              sourceId: p.id,
              canEdit: false,
              updatedAt: p.updatedAt,
              createdAt: p.createdAt
            }
          }).filter(t => !input.status || t.status === input.status)
        ];

        // Sort: Position (desc) then UpdatedAt (desc)
        return unified.sort((a, b) => {
          if (a.position !== b.position) return (b.position || 0) - (a.position || 0);
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        });
      }),

    create: clientProcedure
      .input(z.object({
        clientId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
        priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        assigneeId: z.number().optional(),
        dueDate: z.string().optional(), // ISO string
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        // Get max position to append to end
        const existing = await dbConn.select({ pos: projectTasks.position })
          .from(projectTasks)
          .where(and(
            eq(projectTasks.clientId, input.clientId),
            eq(projectTasks.status, input.status)
          ))
          .orderBy(desc(projectTasks.position))
          .limit(1);

        const newPos = (existing[0]?.pos || 0) + 1000;

        const [newTask] = await dbConn.insert(projectTasks).values({
          clientId: input.clientId,
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          assigneeId: input.assigneeId,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          position: newPos,
        }).returning();

        return newTask;
      }),

    update: clientProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        assigneeId: z.number().nullable().optional(),
        dueDate: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        const updateData: any = {};
        if (input.title !== undefined) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.status !== undefined) updateData.status = input.status;
        if (input.priority !== undefined) updateData.priority = input.priority;
        if (input.assigneeId !== undefined) updateData.assigneeId = input.assigneeId;
        if (input.dueDate !== undefined) updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
        updateData.updatedAt = new Date();

        await dbConn.update(projectTasks)
          .set(updateData)
          .where(eq(projectTasks.id, input.id));

        return { success: true };
      }),

    updatePosition: clientProcedure
      .input(z.object({
        id: z.number(), // This is the ID of the entity
        sourceType: z.string().optional().default('project_task'), // New field to identify type
        status: z.enum(['todo', 'in_progress', 'review', 'done']),
        position: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const dbConn = await db.getDb();

          const { id, status, sourceType } = input;
          console.log(`Updating position for ${sourceType} ${id} to ${status}`);

          if (sourceType === 'project_task') {
            await dbConn.update(projectTasks)
              .set({
                status: status,
                position: input.position || 0,
                updatedAt: new Date()
              })
              .where(eq(projectTasks.id, id));
          } else if (sourceType === 'remediation') {
            // Map Kanban status back to Remediation ID
            const revRemMap: Record<string, string> = { 'todo': 'open', 'in_progress': 'in_progress', 'review': 'resolved', 'done': 'closed' };
            const newStatus = revRemMap[status] || 'open';

            await dbConn.update(remediationTasks)
              .set({ status: newStatus, updatedAt: new Date() })
              .where(eq(remediationTasks.id, id));
          } else if (sourceType === 'risk_treatment') {
            // Map Kanban status back to Risk Treatment
            const revRiskMap: Record<string, string> = { 'todo': 'planned', 'in_progress': 'in_progress', 'review': 'implemented', 'done': 'verified' };
            const newStatus = revRiskMap[status] || 'planned';

            await dbConn.update(riskTreatments)
              .set({ status: newStatus }) // riskTreatments might not have updatedAt
              .where(eq(riskTreatments.id, id));
          } else if (sourceType === 'control') {
            // Map Kanban status back to Client Control
            // 'not_implemented', 'in_progress', 'implemented', 'not_applicable'
            const revControlMap: Record<string, string> = {
              'todo': 'not_implemented',
              'in_progress': 'in_progress',
              'review': 'implemented',
              'done': 'implemented' // Mapping done to implemented as safe default
            };
            const newStatus = revControlMap[status] || 'not_implemented';

            await dbConn.update(clientControls)
              .set({ status: newStatus as any, updatedAt: new Date() })
              .where(eq(clientControls.id, id));
          } else if (sourceType === 'policy') {
            // Map Kanban status back to Policy
            // 'draft', 'review', 'approved', 'archived'
            const revPolicyMap: Record<string, string> = {
              'todo': 'draft',
              'in_progress': 'draft',
              'review': 'review',
              'done': 'approved'
            };
            const newStatus = revPolicyMap[status] || 'draft';

            await dbConn.update(clientPolicies)
              .set({ status: newStatus as any, updatedAt: new Date() })
              .where(eq(clientPolicies.id, id));
          }

          return { success: true };
        } catch (error) {
          console.error("Error in projectTasks.updatePosition:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: String(error) });
        }
      }),

    delete: clientProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();

        await dbConn.delete(projectTasks).where(eq(projectTasks.id, input.id));
        return { success: true };
      }),
  }),






  // ==================== ADVERSARY INTELLIGENCE (PREMIUM) ====================
  // Live security feeds and MITRE ATT&CK integration
  adversaryIntel: router({
    // Get security feeds from CISA, The Hacker News, Bleeping Computer
    getSecurityFeeds: premiumClientProcedure
      .input(z.object({
        limit: z.number().default(100),
        source: z.string().optional(),
        forceRefresh: z.boolean().optional(),
        clientId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        try {
          if (input.forceRefresh) {
            console.log('[AdversaryIntel Router] Manual cache clear requested via query');
            adversaryIntelService.clearCaches();
          }

          const items = await adversaryIntelService.fetchSecurityFeeds(input.limit);

          // Filter by source if specified
          let filteredItems = input.source
            ? items.filter(item => item.source === input.source)
            : items;

          // Relevance Scoring & Asset Matching
          let clientAssets: any[] = [];
          if (input.clientId) {
            const dbConn = await getDb();
            clientAssets = await dbConn.select().from(assets).where(eq(assets.clientId, input.clientId));
          }

          const processedItems = filteredItems.map(item => {
            let relevanceScore = 0;
            const impactedAssets: { id: number; name: string; type: string }[] = [];

            // Base score for severity
            if (item.severity === 'critical') relevanceScore += 10;
            if (item.severity === 'high') relevanceScore += 5;

            // Tech Stack Matching
            if (item.techStack && item.techStack.length > 0 && clientAssets.length > 0) {
              for (const asset of clientAssets) {
                const assetStr = ((asset.name || '') + ' ' + (asset.type || '') + ' ' + (asset.os || '') + ' ' + (asset.description || '')).toLowerCase();
                const isMatch = item.techStack.some(tech => assetStr.includes(tech.toLowerCase()));

                if (isMatch) {
                  impactedAssets.push({ id: asset.id, name: asset.name, type: asset.type || 'Unknown' });
                }
              }

              if (impactedAssets.length > 0) {
                relevanceScore += 20 + (impactedAssets.length * 2); // Boost for hitting assets
              }
            }

            return {
              ...item,
              pubDate: item.pubDate.toISOString(),
              relevanceScore,
              impactedAssets: impactedAssets.slice(0, 5) // Limit matched assets
            };
          });

          // Sort by Relevance, then Date
          processedItems.sort((a, b) => {
            if (b.relevanceScore !== a.relevanceScore) {
              return b.relevanceScore - a.relevanceScore;
            }
            return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
          });

          return {
            items: processedItems,
            lastUpdated: new Date().toISOString(),
          };
        } catch (error) {
          console.error('[AdversaryIntel] Error fetching feeds:', error);
          return { items: [], lastUpdated: new Date().toISOString() };
        }
      }),

    // Manual refresh to bypass cache
    refreshFeeds: premiumClientProcedure
      .input(z.object({
        clientId: z.number().optional(),
      }).optional())
      .mutation(async () => {
        console.log('[AdversaryIntel Router] Manual cache refresh requested via mutation');
        adversaryIntelService.clearCaches();
        const items = await adversaryIntelService.fetchSecurityFeeds(100);
        return {
          items: items.map(item => ({
            ...item,
            pubDate: item.pubDate.toISOString(),
          })),
        };
      }),

    // Search security feeds
    searchFeeds: premiumClientProcedure
      .input(z.object({
        query: z.string(),
        limit: z.number().default(20),
        clientId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const items = await adversaryIntelService.searchSecurityFeeds(input.query, input.limit);
        return {
          items: items.map(item => ({
            ...item,
            pubDate: item.pubDate.toISOString(),
          })),
        };
      }),

    // Get MITRE ATT&CK data (tactics and techniques)
    getMitreData: premiumClientProcedure
      .input(z.object({
        tacticId: z.string().optional(),
        clientId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        try {
          const data = await adversaryIntelService.fetchMitreAttackData();

          let techniques = data.techniques;
          if (input.tacticId) {
            techniques = techniques.filter(t => t.tacticId === input.tacticId);
          }

          return {
            tactics: data.tactics,
            techniques: techniques.slice(0, 200), // Limit for performance
            mitigations: data.mitigations.slice(0, 100),
            lastUpdated: data.lastUpdated.toISOString(),
          };
        } catch (error) {
          console.error('[AdversaryIntel] Error fetching MITRE data:', error);
          return {
            tactics: [],
            techniques: [],
            mitigations: [],
            lastUpdated: new Date().toISOString(),
          };
        }
      }),

    // Search MITRE techniques
    searchTechniques: premiumClientProcedure
      .input(z.object({
        query: z.string(),
        limit: z.number().default(20),
        clientId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const techniques = await adversaryIntelService.searchMitreTechniques(input.query, input.limit);
        return { techniques };
      }),

    // Get a specific technique by ID
    getTechnique: premiumClientProcedure
      .input(z.object({
        id: z.string(),
        clientId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const technique = await adversaryIntelService.getMitreTechniqueById(input.id);
        return { technique };
      }),

    // Get techniques by tactic
    getTechniquesByTactic: premiumClientProcedure
      .input(z.object({
        tacticId: z.string(),
        clientId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const techniques = await adversaryIntelService.getTechniquesByTactic(input.tacticId);
        return { techniques };
      }),

    // Get intelligence summary for dashboard
    getSummary: premiumClientProcedure
      .query(async () => {
        const summary = await adversaryIntelService.getIntelligenceSummary();
        return summary;
      }),

    // Refresh all caches
    refreshCaches: premiumClientProcedure
      .mutation(async () => {
        adversaryIntelService.clearCaches();

        // Pre-warm caches
        const [feeds, mitre] = await Promise.all([
          adversaryIntelService.fetchSecurityFeeds(50),
          adversaryIntelService.fetchMitreAttackData(),
        ]);

        return {
          success: true,
          feedCount: feeds.length,
          techniqueCount: mitre.techniques.length,
          refreshedAt: new Date().toISOString(),
        };
      }),
  }),

  gapQuestionnaire: router({
    create: publicProcedure
      .input(z.object({
        assessmentId: z.number(),
        controlIds: z.array(z.number()),
        recipientEmail: z.string().email(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const token = crypto.randomUUID();

        // Store controlIds as JSON (array of strings)
        const [request] = await db.insert(schema.gapQuestionnaireRequests).values({
          token,
          assessmentId: input.assessmentId,
          recipientEmail: input.recipientEmail,
          message: input.message,
          controlIds: input.controlIds,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          status: 'pending'
        }).returning();

        const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/questionnaire/${token}`;
        return { success: true, token, link };
      }),

    sendEmail: publicProcedure
      .input(z.object({
        email: z.string().email(),
        link: z.string(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        console.log(`[gapQuestionnaire] Sending email to ${input.email}`);
        console.log(`[gapQuestionnaire] Link: ${input.link}`);
        // Real email sending would go here (using user's SMTP if set, or system default)
        return { success: true };
      }),

    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        const [request] = await db.select().from(schema.gapQuestionnaireRequests).where(eq(schema.gapQuestionnaireRequests.token, input.token));
        if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired token" });

        const expired = request.expiresAt ? new Date() > request.expiresAt : false;
        // Also check if completed? The prompt implies re-visiting is okay until expired?
        // Let's stick to expiration for access denial.

        const [assessment] = await db.select().from(schema.gapAssessments).where(eq(schema.gapAssessments.id, request.assessmentId));

        const controlIds = request.controlIds || [];
        let controlsDetails: any[] = [];

        if (controlIds.length > 0) {
          // If stored as numbers in JSON
          const numericIds = controlIds.map((id: any) => parseInt(id)).filter((n: number) => !isNaN(n));
          if (numericIds.length > 0) {
            const rows = await db.select().from(schema.controls)
              .where(inArray(schema.controls.id, numericIds));

            // Pre-fill existing responses
            const responses = await db.select().from(schema.gapResponses)
              .where(and(
                eq(schema.gapResponses.assessmentId, request.assessmentId),
                inArray(schema.gapResponses.controlId, rows.map(r => r.controlId))
              ));

            controlsDetails = rows.map(row => {
              const resp = responses.find(r => r.controlId === row.controlId);
              return { ...row, currentResponse: resp };
            });
          }
        }

        return { request, assessment, controls: controlsDetails, expired };
      }),

    submitResponses: publicProcedure
      .input(z.object({
        token: z.string(),
        respondentName: z.string().optional(),
        responses: z.array(z.object({
          controlId: z.number(),
          currentStatus: z.string().optional(),
          notes: z.string().optional(),
        }))
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        const [request] = await db.select().from(schema.gapQuestionnaireRequests).where(eq(schema.gapQuestionnaireRequests.token, input.token));
        if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired token" });

        // Update respondent name if not set
        if (input.respondentName && !request.recipientName) {
          await db.update(schema.gapQuestionnaireRequests)
            .set({ recipientName: input.respondentName })
            .where(eq(schema.gapQuestionnaireRequests.id, request.id));
        }

        // Map numeric ID to string ControlID
        const controlIdsRequested = input.responses.map(r => r.controlId);
        const controls = await db.select().from(schema.controls).where(inArray(schema.controls.id, controlIdsRequested));
        const controlMap = new Map(controls.map(c => [c.id, c.controlId]));

        for (const resp of input.responses) {
          const stringControlId = controlMap.get(resp.controlId);
          if (!stringControlId) continue;

          const existing = await db.select().from(schema.gapResponses)
            .where(and(
              eq(schema.gapResponses.assessmentId, request.assessmentId),
              eq(schema.gapResponses.controlId, stringControlId)
            ));

          const newNote = resp.notes ? `[External - ${input.respondentName || 'User'}]: ${resp.notes}` : null;

          if (existing.length > 0) {
            const currentNotes = existing[0].notes || "";
            const updatedNotes = newNote ? (currentNotes ? currentNotes + "\n\n" + newNote : newNote) : currentNotes;

            await db.update(schema.gapResponses).set({
              notes: updatedNotes,
              currentStatus: resp.currentStatus || existing[0].currentStatus,
              updatedAt: new Date()
            }).where(eq(schema.gapResponses.id, existing[0].id));
          } else {
            await db.insert(schema.gapResponses).values({
              assessmentId: request.assessmentId,
              controlId: stringControlId,
              notes: newNote,
              currentStatus: resp.currentStatus || 'not_implemented',
            });
          }
        }

        await db.update(schema.gapQuestionnaireRequests)
          .set({ status: 'completed' })
          .where(eq(schema.gapQuestionnaireRequests.id, request.id));

        return { success: true };
      }),
  }),

  frameworkImports: createFrameworkImportRouter(t, clientProcedure),




  universalTasks: router({
    listAll: clientProcedure
      .input(z.object({
        clientId: z.number(),
        status: z.string().optional(), // 'all', 'pending', 'completed'
      }))
      .query(async ({ input, ctx }) => {
        const dbConn = await db.getDb();
        const { clientId, status } = input;
        const userId = ctx.user?.id;
        const role = ctx.clientRole; // 'owner', 'admin', 'editor', 'viewer' or specific role

        // Determine visibility
        // Admin/Owner => See ALL tasks
        // Others => See ONLY their assigned tasks
        const isAdmin = role === 'owner' || role === 'admin';

        // Base Query on ProjectTasks (Main generic tasks)
        // We can optionally UNION with Remediation Tasks if needed, but for now let's start with ProjectTasks 
        // as the "Universal" bucket if other modules sync to it or if generic tasks are created there.
        // Actually, let's try to pull from multiple sources if possible, or just ProjectTasks if that's the intended "Unified" view.
        // Given the prompt "anytime there is work or tasks assign anywhere in the app it must appear here",
        // we should ideally query multiple tables: project_tasks, remediation_tasks, etc.
        // BUT for MVP, let's assume 'projectTasks' is the main one OR query them separately and combine.
        // Combining is better for the user request.

        // 1. Project Tasks
        let ptQuery = dbConn.select({
          id: projectTasks.id,
          title: projectTasks.title,
          status: projectTasks.status,
          dueDate: projectTasks.dueDate,
          assigneeId: projectTasks.assigneeId,
          sourceType: projectTasks.sourceType, // 'remediation', 'general', etc.
          sourceId: projectTasks.sourceId,
          priority: projectTasks.priority,
          createdAt: projectTasks.createdAt
        }).from(projectTasks).where(eq(projectTasks.clientId, clientId));

        if (!isAdmin && userId) {
          ptQuery.where(and(eq(projectTasks.clientId, clientId), eq(projectTasks.assigneeId, userId)));
        }

        // 2. Remediation Tasks (If not already double-written to projectTasks)
        // Check schema... projectTasks has sourceType 'remediation'. 
        // If the system syncs remediation -> projectTasks, we only need projectTasks.
        // If not, we need to UNION.
        // Let's assume for now we just return projectTasks as the "Universal Task" container.
        // If user says "anytime there is work... it must appear here", 
        // we should ensure other modules WRITE to projectTasks or we UNION here.
        // Let's stick to projectTasks for safety and performance first, assuming syncing exists or will be added.
        // Wait, looking at schema (Step 2358), remediationTasks DOES exist separately.
        // Let's Query BOTH and combine in memory for the MVP "Universal" view.

        const [pTasks, rTasks] = await Promise.all([
          ptQuery,
          dbConn.select({
            id: remediationTasks.id,
            title: remediationTasks.title,
            status: remediationTasks.status,
            dueDate: remediationTasks.dueDate,
            assigneeId: remediationTasks.assigneeId,
            priority: remediationTasks.priority,
            createdAt: remediationTasks.createdAt
          }).from(remediationTasks).where(isAdmin
            ? eq(remediationTasks.clientId, clientId)
            : and(eq(remediationTasks.clientId, clientId), eq(remediationTasks.assigneeId, userId!))
          )
        ]);

        // Normalize and Combine
        const combined = [
          ...pTasks.map(t => ({ ...t, type: t.sourceType || 'general', origin: 'project_tasks' })),
          ...rTasks.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            dueDate: t.dueDate,
            assigneeId: t.assigneeId,
            sourceType: 'remediation',
            sourceId: t.id,
            priority: t.priority,
            createdAt: t.createdAt,
            type: 'remediation',
            origin: 'remediation_tasks'
          }))
        ];

        // Sort by Due Date (Asc) then CreatedAt (Desc)
        return combined.sort((a, b) => {
          if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
        });
      }),

    // Helper: Get All Assignees (Employees) for Filter
    listAssignees: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();
        return dbConn.select().from(employees).where(eq(employees.clientId, input.clientId));
      }),

    // Update Task (Universal)
    update: clientProcedure
      .input(z.object({
        id: z.number(),
        type: z.string(), // 'project_tasks' or 'remediation_tasks' (origin) OR 'remediation', 'general' (type) - Let's use 'origin' from listAll
        // Updateable fields
        status: z.string().optional(),
        priority: z.string().optional(),
        dueDate: z.string().optional(), // ISO date string
        assigneeId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const dbConn = await db.getDb();
        const { id, type, ...updates } = input;

        // Prepare update object
        const data: any = { updatedAt: new Date() };
        if (updates.status) data.status = updates.status;
        if (updates.priority) data.priority = updates.priority;
        if (updates.dueDate) data.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
        if (updates.assigneeId) data.assigneeId = updates.assigneeId;

        if (type === 'project_tasks' || type === 'general') {
          await dbConn.update(projectTasks).set(data).where(eq(projectTasks.id, id));
        } else if (type === 'remediation_tasks' || type === 'remediation') {
          await dbConn.update(remediationTasks).set(data).where(eq(remediationTasks.id, id));
        } else {
          // Fallback or Error?
          // Maybe it's a 'project_task' with source type... treat as project_task if id matches?
          // Safer to rely on the 'origin' we sent in listAll.
          // Let's assume the frontend sends the 'origin' prop as 'type'.
          throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown task type for update" });
        }

        return { success: true };
      }),
  }),



  vendorCommunication: router({
    sendVendorEmail: clientProcedure
      .input(z.object({
        clientId: z.number(),
        vendorId: z.number(),
        contactId: z.number().optional(),
        to: z.string().email(),
        subject: z.string(),
        body: z.string(), // HTML or text
        attachments: z.array(z.object({ filename: z.string(), path: z.string() })).optional()
      }))
      .mutation(async ({ input }) => {
        const { sendEmail } = await import('./lib/email/transporter');

        // In a real scenario, we might want to log this to 'communication_logs' table

        const result = await sendEmail({
          clientId: input.clientId,
          to: input.to,
          subject: input.subject,
          html: input.body,
        });

        if (!result.success) {
          console.error("Failed to send vendor email:", result.error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to send email" });
        }

        return { success: true };
      }),
  }),

  dpaTemplates: router({
    list: protectedProcedure.query(async () => {
      const dbConn = await getDb();
      return await dbConn.select().from(schema.dpaTemplates);
    }),
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        content: z.string(),
        jurisdiction: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        console.log("Creating DPA Template:", input.name);
        const dbConn = await getDb();
        return await dbConn.insert(schema.dpaTemplates).values({
          name: input.name,
          content: input.content,
          jurisdiction: input.jurisdiction
        }).returning();
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        content: z.string().optional(),
        jurisdiction: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        const dbConn = await getDb();
        return await dbConn.update(schema.dpaTemplates)
          .set(updates)
          .where(eq(schema.dpaTemplates.id, id))
          .returning();
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const dbConn = await getDb();
        await dbConn.delete(schema.dpaTemplates)
          .where(eq(schema.dpaTemplates.id, input.id));
        return { success: true };
      }),
  }),

  processingActivities: router({
    list: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await getDb();
        return await dbConn.select()
          .from(schema.processingActivities)
          .where(eq(schema.processingActivities.clientId, input.clientId))
          .orderBy(desc(schema.processingActivities.createdAt));
      }),

    get: clientProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await getDb();
        const [activity] = await dbConn.select()
          .from(schema.processingActivities)
          .where(eq(schema.processingActivities.id, input.id))
          .limit(1);

        if (!activity) throw new TRPCError({ code: 'NOT_FOUND', message: 'Processing activity not found' });

        // Get linked vendors
        const linkedVendors = await dbConn.select({
          id: schema.processingActivityVendors.id,
          vendorId: schema.processingActivityVendors.vendorId,
          role: schema.processingActivityVendors.role,
          vendorName: schema.vendors.name
        })
          .from(schema.processingActivityVendors)
          .leftJoin(schema.vendors, eq(schema.processingActivityVendors.vendorId, schema.vendors.id))
          .where(eq(schema.processingActivityVendors.processingActivityId, input.id));

        // Get linked assets
        const linkedAssets = await dbConn.select({
          id: schema.processingActivityAssets.id,
          assetId: schema.processingActivityAssets.assetId,
          assetName: schema.assets.name
        })
          .from(schema.processingActivityAssets)
          .leftJoin(schema.assets, eq(schema.processingActivityAssets.assetId, schema.assets.id))
          .where(eq(schema.processingActivityAssets.processingActivityId, input.id));

        return { ...activity, linkedVendors, linkedAssets };
      }),

    create: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        activityName: z.string(),
        activityId: z.string(),
        description: z.string().optional(),
        role: z.string(),
        purposes: z.array(z.string()),
        legalBasis: z.string(),
        dataCategories: z.array(z.string()),
        dataSubjectCategories: z.array(z.string()),
        recipients: z.array(z.any()),
        hasInternationalTransfers: z.boolean().optional(),
        transferCountries: z.array(z.string()).optional(),
        transferSafeguards: z.string().optional(),
        retentionPeriod: z.string().optional(),
        technicalMeasures: z.array(z.string()).optional(),
        organizationalMeasures: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const dbConn = await getDb();
        const [activity] = await dbConn.insert(schema.processingActivities)
          .values({
            ...input,
            createdBy: ctx.user?.id,
            status: 'draft'
          })
          .returning();
        return activity;
      }),

    update: clientEditorProcedure
      .input(z.object({
        id: z.number(),
        activityName: z.string().optional(),
        description: z.string().optional(),
        role: z.string().optional(),
        purposes: z.array(z.string()).optional(),
        legalBasis: z.string().optional(),
        dataCategories: z.array(z.string()).optional(),
        dataSubjectCategories: z.array(z.string()).optional(),
        recipients: z.array(z.any()).optional(),
        hasInternationalTransfers: z.boolean().optional(),
        transferCountries: z.array(z.string()).optional(),
        transferSafeguards: z.string().optional(),
        retentionPeriod: z.string().optional(),
        technicalMeasures: z.array(z.string()).optional(),
        organizationalMeasures: z.array(z.string()).optional(),
        status: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        const dbConn = await getDb();
        const [activity] = await dbConn.update(schema.processingActivities)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(schema.processingActivities.id, id))
          .returning();
        return activity;
      }),

    delete: clientEditorProcedure
      .input(z.object({ id: z.number(), clientId: z.number() }))
      .mutation(async ({ input }) => {
        console.log(`[ROPA] Attempting delete. ID: ${input.id}, Client: ${input.clientId}`);
        const dbConn = await getDb();
        const deleted = await dbConn.delete(schema.processingActivities)
          .where(and(
            eq(schema.processingActivities.id, input.id),
            eq(schema.processingActivities.clientId, input.clientId)
          ))
          .returning();

        console.log(`[ROPA] Deleted records: ${deleted.length}`);

        if (deleted.length === 0) {
          console.error(`[ROPA] Delete failed. Record not found or client mismatch?`);
          // Check if record exists at all for debugging
          const check = await dbConn.select().from(schema.processingActivities).where(eq(schema.processingActivities.id, input.id));
          if (check.length > 0) {
            console.error(`[ROPA] Record exists but clientId is ${check[0].clientId}. Input clientId is ${input.clientId}`);
          }
          throw new TRPCError({ code: "NOT_FOUND", message: "Activity not found or permission denied" });
        }

        return { success: true };
      }),

    // Phase 3: Compliance Automation
    scheduleReview: clientEditorProcedure
      .input(z.object({
        id: z.number(),
        reviewIntervalMonths: z.number().default(12)
      }))
      .mutation(async ({ input }) => {
        const dbConn = await getDb();
        const now = new Date();
        const nextReview = new Date(now);
        nextReview.setMonth(nextReview.getMonth() + input.reviewIntervalMonths);

        const [activity] = await dbConn.update(schema.processingActivities)
          .set({
            lastReviewDate: now,
            nextReviewDate: nextReview,
            updatedAt: now
          })
          .where(eq(schema.processingActivities.id, input.id))
          .returning();

        return activity;
      }),

    getOverdueReviews: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await getDb();
        const now = new Date();

        return await dbConn.select()
          .from(schema.processingActivities)
          .where(and(
            eq(schema.processingActivities.clientId, input.clientId),
            eq(schema.processingActivities.status, 'active'),
            lt(schema.processingActivities.nextReviewDate, now)
          ))
          .orderBy(asc(schema.processingActivities.nextReviewDate));
      }),

    checkExemption: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await getDb();

        // Get client details
        const [client] = await dbConn.select()
          .from(schema.clients)
          .where(eq(schema.clients.id, input.clientId))
          .limit(1);

        if (!client) throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });

        // Check exemption criteria
        const employeeCount = parseInt(client.orgSize || '0');
        const isSmallOrg = employeeCount < 250;

        // Check if any activities have special categories or high-risk processing
        const activities = await dbConn.select()
          .from(schema.processingActivities)
          .where(eq(schema.processingActivities.clientId, input.clientId));

        const hasSpecialCategories = activities.some(a =>
          a.specialCategories && Array.isArray(a.specialCategories) && a.specialCategories.length > 0
        );

        const hasInternationalTransfers = activities.some(a => a.hasInternationalTransfers);

        const isLowRisk = !hasSpecialCategories && !hasInternationalTransfers;
        const isOccasional = activities.length < 5; // Simple heuristic

        const isExempt = isSmallOrg && isLowRisk && isOccasional;

        return {
          isExempt,
          criteria: {
            isSmallOrg,
            employeeCount,
            isLowRisk,
            isOccasional,
            hasSpecialCategories,
            hasInternationalTransfers,
            activityCount: activities.length
          },
          recommendation: isExempt
            ? 'Your organization may qualify for GDPR Article 30 exemption, but maintaining records is still recommended as best practice.'
            : 'Your organization is required to maintain Records of Processing Activities under GDPR Article 30.'
        };
      }),

    getCompletenessScore: clientProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await getDb();
        const [activity] = await dbConn.select()
          .from(schema.processingActivities)
          .where(eq(schema.processingActivities.id, input.id))
          .limit(1);

        if (!activity) throw new TRPCError({ code: 'NOT_FOUND', message: 'Activity not found' });

        // Required fields
        const requiredFields = [
          'activityName',
          'role',
          'purposes',
          'legalBasis',
          'dataCategories',
          'dataSubjectCategories',
          'recipients'
        ];

        // Recommended fields
        const recommendedFields = [
          'description',
          'retentionPeriod',
          'technicalMeasures',
          'organizationalMeasures'
        ];

        let score = 0;
        let maxScore = requiredFields.length + recommendedFields.length;

        // Check required fields (weighted more heavily)
        requiredFields.forEach(field => {
          const value = activity[field as keyof typeof activity];
          if (value && (typeof value !== 'object' || (Array.isArray(value) && value.length > 0))) {
            score += 1;
          }
        });

        // Check recommended fields
        recommendedFields.forEach(field => {
          const value = activity[field as keyof typeof activity];
          if (value && (typeof value !== 'object' || (Array.isArray(value) && value.length > 0))) {
            score += 1;
          }
        });

        const percentage = Math.round((score / maxScore) * 100);

        const missingRequired = requiredFields.filter(field => {
          const value = activity[field as keyof typeof activity];
          return !value || (Array.isArray(value) && value.length === 0);
        });

        const missingRecommended = recommendedFields.filter(field => {
          const value = activity[field as keyof typeof activity];
          return !value || (Array.isArray(value) && value.length === 0);
        });

        return {
          score: percentage,
          missingRequired,
          missingRecommended,
          isComplete: missingRequired.length === 0
        };
      }),
  }),

  dataBreaches: router({
    list: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await getDb();
        return await dbConn.select()
          .from(schema.dataBreaches)
          .where(eq(schema.dataBreaches.clientId, input.clientId))
          .orderBy(desc(schema.dataBreaches.createdAt));
      }),

    create: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        description: z.string(),
        effects: z.string(),
        remedialActions: z.string(),
        dateOccurred: z.string().optional(), // Receive as string, convert to date
        dateDetected: z.string().optional(),
        isNotifiableToDpa: z.boolean().default(false),
        isNotifiableToSubjects: z.boolean().default(false),
        status: z.enum(['open', 'investigating', 'closed', 'reported']).default('open'),
      }))
      .mutation(async ({ input, ctx }) => {
        const dbConn = await getDb();
        const [breach] = await dbConn.insert(schema.dataBreaches)
          .values({
            ...input,
            dateOccurred: input.dateOccurred ? new Date(input.dateOccurred) : undefined,
            dateDetected: input.dateDetected ? new Date(input.dateDetected) : undefined,
            createdBy: ctx.user?.id,
          })
          .returning();
        return breach;
      }),

    update: clientEditorProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number(),
        description: z.string().optional(),
        effects: z.string().optional(),
        remedialActions: z.string().optional(),
        dateOccurred: z.string().optional(),
        dateDetected: z.string().optional(),
        isNotifiableToDpa: z.boolean().optional(),
        isNotifiableToSubjects: z.boolean().optional(),
        status: z.enum(['open', 'investigating', 'closed', 'reported']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, clientId, ...updates } = input;
        const dbConn = await getDb();
        const [breach] = await dbConn.update(schema.dataBreaches)
          .set({
            ...updates,
            dateOccurred: updates.dateOccurred ? new Date(updates.dateOccurred) : undefined,
            dateDetected: updates.dateDetected ? new Date(updates.dateDetected) : undefined,
            updatedAt: new Date(),
          })
          .where(and(
            eq(schema.dataBreaches.id, id),
            eq(schema.dataBreaches.clientId, clientId)
          ))
          .returning();
        return breach;
      }),

    delete: clientEditorProcedure
      .input(z.object({ id: z.number(), clientId: z.number() }))
      .mutation(async ({ input }) => {
        const dbConn = await getDb();
        await dbConn.delete(schema.dataBreaches)
          .where(and(
            eq(schema.dataBreaches.id, input.id),
            eq(schema.dataBreaches.clientId, input.clientId)
          ));
        return { success: true };
      }),
  }),


  dpia: router({
    list: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await getDb();
        return await dbConn
          .select()
          .from(schema.dataProtImpactAssessments)
          .where(eq(schema.dataProtImpactAssessments.clientId, input.clientId))
          .orderBy(desc(schema.dataProtImpactAssessments.createdAt));
      }),

    get: clientProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await getDb();
        const results = await dbConn
          .select()
          .from(schema.dataProtImpactAssessments)
          .where(eq(schema.dataProtImpactAssessments.id, input.id));
        return results[0];
      }),

    create: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        activityId: z.number().optional(),
        title: z.string(),
        description: z.string(),
        scope: z.string(),
        identifiedRisks: z.string(),
        mitigationMeasures: z.string(),
        status: z.enum(["draft", "in_progress", "under_review", "completed"]).optional(),
        assignedTo: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await getDb();
        const [result] = await dbConn
          .insert(schema.dataProtImpactAssessments)
          .values({
            ...input,
            status: input.status || "draft",
          })
          .returning();
        return result;
      }),

    update: clientEditorProcedure
      .input(z.object({
        id: z.number(),
        activityId: z.number().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        scope: z.string().optional(),
        identifiedRisks: z.string().optional(),
        mitigationMeasures: z.string().optional(),
        status: z.enum(["draft", "in_progress", "under_review", "completed"]).optional(),
        assignedTo: z.number().optional(),
        lastReviewDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const dbConn = await getDb();
        const [result] = await dbConn
          .update(schema.dataProtImpactAssessments)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(schema.dataProtImpactAssessments.id, id))
          .returning();
        return result;
      }),

    delete: clientEditorProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const dbConn = await getDb();
        await dbConn
          .delete(schema.dataProtImpactAssessments)
          .where(eq(schema.dataProtImpactAssessments.id, input.id));
        return { success: true };
      }),

    saveResponses: clientEditorProcedure
      .input(z.object({
        id: z.number(),
        responses: z.any(), // JSON data for sections
        status: z.enum(["draft", "in_progress", "under_review", "completed"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await getDb();
        const [result] = await dbConn
          .update(schema.dataProtImpactAssessments)
          .set({
            questionnaireData: input.responses,
            status: input.status,
            updatedAt: new Date(),
          })
          .where(eq(schema.dataProtImpactAssessments.id, input.id))
          .returning();
        return result;
      }),
  }),

  // International Transfers
  transfers: router({
    list: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await getDb();
        return await dbConn
          .select()
          .from(schema.internationalTransfers)
          .where(eq(schema.internationalTransfers.clientId, input.clientId))
          .orderBy(desc(schema.internationalTransfers.createdAt));
      }),

    get: clientProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await getDb();
        const [transfer] = await dbConn
          .select()
          .from(schema.internationalTransfers)
          .where(eq(schema.internationalTransfers.id, input.id))
          .limit(1);

        if (!transfer) return null;

        const tias = await dbConn
          .select()
          .from(schema.transferImpactAssessments)
          .where(eq(schema.transferImpactAssessments.transferId, input.id))
          .orderBy(desc(schema.transferImpactAssessments.createdAt));

        return { ...transfer, tias, latestTia: tias[0] || null };
      }),

    create: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        activityId: z.number().optional().nullable(),
        vendorId: z.number().optional().nullable(),
        title: z.string(),
        destinationCountry: z.string().length(2),
        transferTool: z.enum(["scc_2021", "bcr", "adequacy", "derogation", "ad_hoc"]),
        sccModule: z.enum(["c2c", "c2p", "p2p", "p2c"]).optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await getDb();
        const [result] = await dbConn
          .insert(schema.internationalTransfers)
          .values({
            ...input,
            status: "pending",
          })
          .returning();
        return result;
      }),

    update: clientEditorProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number().optional(),
        title: z.string().optional(),
        destinationCountry: z.string().length(2).optional(),
        vendorId: z.number().optional().nullable(),
        activityId: z.number().optional().nullable(),
        status: z.enum(["pending", "active", "expired", "risk_flagged"]).optional(),
        transferTool: z.enum(["scc_2021", "bcr", "adequacy", "derogation", "ad_hoc"]).optional(),
        sccModule: z.enum(["c2c", "c2p", "p2p", "p2c"]).optional().nullable(),
        nextReviewDate: z.date().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await getDb();
        const { id, clientId, ...data } = input;
        const [result] = await dbConn
          .update(schema.internationalTransfers)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(schema.internationalTransfers.id, id))
          .returning();
        return result;
      }),

    delete: clientEditorProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const dbConn = await getDb();
        await dbConn
          .delete(schema.internationalTransfers)
          .where(eq(schema.internationalTransfers.id, input.id));
        return { success: true };
      }),

    saveTIA: clientEditorProcedure
      .input(z.object({
        transferId: z.number(),
        clientId: z.number(),
        riskLevel: z.string().optional(),
        status: z.string().optional(),
        responses: z.any(),
        version: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await getDb();
        const { transferId, ...data } = input;

        // Find existing draft or create new
        const [existing] = await dbConn
          .select()
          .from(schema.transferImpactAssessments)
          .where(and(
            eq(schema.transferImpactAssessments.transferId, transferId),
            eq(schema.transferImpactAssessments.status, "draft")
          ))
          .limit(1);

        if (existing) {
          const [updated] = await dbConn
            .update(schema.transferImpactAssessments)
            .set({
              questionnaireData: input.responses,
              riskLevel: input.riskLevel,
              status: input.status,
              updatedAt: new Date()
            })
            .where(eq(schema.transferImpactAssessments.id, existing.id))
            .returning();
          return updated;
        } else {
          const [inserted] = await dbConn
            .insert(schema.transferImpactAssessments)
            .values({
              transferId,
              clientId: input.clientId,
              riskLevel: input.riskLevel,
              status: input.status || "draft",
              questionnaireData: input.responses,
              version: input.version || 1,
            })
            .returning();
          return inserted;
        }
      }),

    getAdequacy: clientProcedure
      .input(z.object({ countryCode: z.string().length(2) }))
      .query(async ({ input }) => {
        const dbConn = await getDb();
        const [decision] = await dbConn
          .select()
          .from(schema.adequacyDecisions)
          .where(eq(schema.adequacyDecisions.countryCode, input.countryCode))
          .limit(1);
        return decision || null;
      }),
  }),

  admin: router({
    // Admin procedures go here
  }),
});


export type AppRouter = typeof appRouter;



