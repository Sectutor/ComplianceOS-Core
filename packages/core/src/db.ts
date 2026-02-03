import { and, desc, eq, like, ilike, or, sql, ne, isNotNull, lt, lte, gt, gte, aliasedTable, getTableColumns, inArray } from "drizzle-orm";

import { drizzle } from "drizzle-orm/postgres-js";

import postgres from "postgres";
import { encrypt } from "./lib/crypto";

import {

  InsertUser, users,

  clients, InsertClient, Client,

  userClients, InsertUserClient, UserClient,

  controls, InsertControl, Control,

  controlHistory, InsertControlHistory,

  policyTemplates, InsertPolicyTemplate, PolicyTemplate,

  clientControls, InsertClientControl, ClientControl,

  clientPolicies, InsertClientPolicy, ClientPolicy,

  controlPolicyMappings, InsertControlPolicyMapping,

  evidence, InsertEvidence, Evidence,

  auditNotes, InsertAuditNote,

  evidenceFiles, InsertEvidenceFile, EvidenceFile,

  notificationSettings, InsertNotificationSettings, NotificationSettings,

  notificationLog, InsertNotificationLog, NotificationLog,

  employees, InsertEmployee, Employee,

  employeeTaskAssignments, InsertEmployeeTaskAssignment, EmployeeTaskAssignment,

  // BIA Phase 2

  impactAssessments, InsertImpactAssessment, ImpactAssessment,

  financialImpacts, InsertFinancialImpact, FinancialImpact,

  bcpStakeholders, InsertBcpStakeholder, BcpStakeholder,

  businessImpactAnalyses, InsertBusinessImpactAnalysis, BusinessImpactAnalysis,

  biaQuestionnaires, InsertBiaQuestionnaire, BiaQuestionnaire,



  recoveryObjectives, InsertRecoveryObjective, RecoveryObjective,

  businessProcesses, InsertBusinessProcess, BusinessProcess,



  llmProviders, InsertLLMProvider, LLMProvider,

  llmRouterRules, InsertLLMRouterRule, LLMRouterRule,

  comments, InsertComment, Comment,

  policyReviews, InsertPolicyReview, PolicyReview,

  policyReviewResults, InsertPolicyReviewResult, PolicyReviewResult,

  orgRoles, InsertOrgRole, OrgRole,

  riskSettings, InsertRiskSettings, RiskSettings,

  kris, InsertKRI, KRI,

  vendors, InsertVendor, Vendor,

  vendorAssessments, InsertVendorAssessment, VendorAssessment,

  vendorContacts, InsertVendorContact, VendorContact,

  vendorContracts, InsertVendorContract, VendorContract,

  emailMessages, InsertEmailMessage, EmailMessage,

  clientIntegrations, InsertClientIntegration, ClientIntegration,

  clientFrameworks, InsertClientFramework, ClientFramework,

  clientFrameworkControls, InsertClientFrameworkControl, ClientFrameworkControl,

  // BCP

  bcpProjects, InsertBcpProject, BcpProject,

  processDependencies, InsertProcessDependency, ProcessDependency,

  bcStrategies, InsertBcStrategy, BcStrategy,
  // New Enhancements
  biaSeasonalEvents, InsertBiaSeasonalEvent, BiaSeasonalEvent,
  biaVitalRecords, InsertBiaVitalRecord, BiaVitalRecord,
  bcPlanCommunicationChannels, InsertBcPlanCommunicationChannel, BcPlanCommunicationChannel,
  bcPlanLogistics, InsertBcPlanLogistic, BcPlanLogistic,

  bcPrograms, InsertBcProgram, BcProgram,
  bcCommitteeMembers, InsertBcCommitteeMember, BcCommitteeMember,

  // Sections, Appendices, Training
  bcPlanSections, InsertBcPlanSection, BcPlanSection,
  bcPlanAppendices, InsertBcPlanAppendix, BcPlanAppendix,
  bcTrainingRecords, InsertBcTrainingRecord, BcTrainingRecord,

  bcPlans, InsertBcPlan, BcPlan,

  disruptiveScenarios, InsertDisruptiveScenario, DisruptiveScenario,

  // Collaboration

  tasks, InsertTask, Task,

  bcApprovals, InsertBcApproval, BcApproval,
  riskScenarios, InsertRiskScenario, RiskScenario,
  riskTreatments, InsertRiskTreatment, RiskTreatment,
  treatmentControls, InsertTreatmentControl, TreatmentControl,
  vulnerabilities, InsertVulnerability, Vulnerability,
  threats, InsertThreat, Threat,
  riskAssessments, InsertRiskAssessment, RiskAssessment,
  vendorScans, InsertVendorScan, VendorScan,
  vendorCveMatches, InsertVendorCveMatch, VendorCveMatch,
  vendorBreaches, InsertVendorBreach, VendorBreach,
  bcPlanBias, InsertBcPlanBia, BcPlanBia,
  bcPlanStrategies, InsertBcPlanStrategy, BcPlanStrategy,
  bcPlanScenarios, InsertBcPlanScenario, BcPlanScenario,
  projectTasks, InsertProjectTask, ProjectTask,
  remediationPlans, InsertRemediationPlan, RemediationPlan,
  roadmapItems, InsertRoadmapItem, RoadmapItem,
  crmEngagements, InsertCrmEngagement, CrmEngagement,
  crmActivities, InsertCrmActivity, CrmActivity,
  crmContacts, InsertCrmContact, CrmContact,
  cloudConnections, InsertCloudConnection, CloudConnection,
  cloudAssets, InsertCloudAsset, CloudAsset,
  intakeItems, InsertIntakeItem, IntakeItem,

  // Privacy
  processDataFlows, InsertProcessDataFlow, ProcessDataFlow,
  dsarRequests, InsertDsarRequest, DsarRequest,
  privacyAssessments, InsertPrivacyAssessment, PrivacyAssessment,

  // Missing modules for cascade delete
  roadmaps, roadmapMilestones,
  implementationPlans, implementationTasks, implementationProgress,
  gapAssessments, gapResponses, gapQuestionnaireRequests,
  auditFindings, complianceSnapshots,
  consents, consentTemplates,
  dsarTemplates, dpiaTemplates,
  dataFlowVisualizations, dataFlowNodes, dataFlowConnections,
  integrations, evidenceRequests,


  projectTasks
} from "./schema";

import * as schema from "./schema";

import { ENV } from './_core/env';

import { logger } from './lib/logger';



let _sql: postgres.Sql | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any

let _db: any | null = null;



export class DatabaseConnectionError extends Error {

  constructor(message: string) {

    super(message);

    this.name = 'DatabaseConnectionError';

  }

}



// ... (imports remain)

export async function getDb(): Promise<NonNullable<typeof _db>> {

  if (!_db) {

    if (!process.env.DATABASE_URL) {

      throw new DatabaseConnectionError("DATABASE_URL environment variable is not set");

    }

    console.log('[DB] Attempting to connect to database...');

    try {

      if (!_sql) {

        _sql = postgres(process.env.DATABASE_URL, {
          ssl: { rejectUnauthorized: false }, // Critical for Supabase Transaction Pooler compatibility
          prepare: false, // Required for Supabase Transaction Pooler (port 6543)
          idle_timeout: 60, // Close idle connections after 60s (increased from 20s)
          connect_timeout: 30, // Increased to 30s to prevent timeouts
          max: 10, // Max pool size
          connection: {
            statement_timeout: 30000, // 30s statement timeout (increased from 5s)
          },
          onnotice: (notice) => {
            console.log('[DB Notice]', notice);
          },
        });
        console.log(`[DB] Connection pool created with URL length: ${process.env.DATABASE_URL?.length}`);

      }

      _db = drizzle(_sql, { schema });
      console.log('[DB] Database connection initialized successfully');

    } catch (error) {

      logger.warn("[Database] Failed to connect:", error);

      _db = null;
      console.error('[DB] Database connection failed:', error);

      throw new DatabaseConnectionError(`Failed to connect to database: ${(error as Error).message}`);

    }

  }

  if (!_db) {

    throw new DatabaseConnectionError("Database connection failed to initialize");

  }

  return _db;

}



export async function closeDb() {

  try {

    await _sql?.end({ timeout: 5 });

  } catch { }

  _sql = null;

  _db = null;

}



// ==================== RISK FRAMEWORK FUNCTIONS ====================



export async function getRiskSettings(clientId: number): Promise<RiskSettings | null> {

  const db = await getDb();



  const result = await db.select()

    .from(riskSettings)

    .where(eq(riskSettings.clientId, clientId))

    .limit(1);



  return result[0] || null;

}



export async function upsertRiskSettings(data: InsertRiskSettings) {

  const db = await getDb();



  // Check if settings exist

  const existing = await getRiskSettings(data.clientId);



  if (existing) {

    return await db.update(riskSettings)

      .set({ ...data, updatedAt: new Date() })

      .where(eq(riskSettings.id, existing.id))

      .returning();

  } else {

    return await db.insert(riskSettings)

      .values(data)

      .returning();

  }

}



// ==================== USER FUNCTIONS ====================

export async function upsertUser(user: InsertUser): Promise<void> {

  if (!user.openId) {

    throw new Error("User openId is required for upsert");

  }



  const db = await getDb();





  try {

    const values: InsertUser = {

      openId: user.openId,

    };

    const updateSet: Record<string, unknown> = {};



    const textFields = ["name", "email", "loginMethod"] as const;

    type TextField = (typeof textFields)[number];



    const assignNullable = (field: TextField) => {

      const value = user[field];

      if (value === undefined) return;

      const normalized = value ?? null;

      values[field] = normalized;

      updateSet[field] = normalized;

    };



    textFields.forEach(assignNullable);



    if (user.lastSignedIn !== undefined) {

      values.lastSignedIn = user.lastSignedIn;

      updateSet.lastSignedIn = user.lastSignedIn;

    }

    if (user.role !== undefined) {

      values.role = user.role;

      updateSet.role = user.role;

    } else if (user.openId === ENV.ownerOpenId) {

      values.role = 'admin';

      updateSet.role = 'admin';

    }



    if (!values.lastSignedIn) {

      values.lastSignedIn = new Date();

    }



    if (Object.keys(updateSet).length === 0) {

      updateSet.lastSignedIn = new Date();

    }



    await db.insert(users).values(values).onConflictDoUpdate({

      target: users.openId,

      set: updateSet,

    });

  } catch (error) {

    logger.error("[Database] Failed to upsert user:", error);

    throw error;

  }

}



export async function getUserByOpenId(openId: string) {

  const db = await getDb();





  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;

}



export async function getAllUsers() {

  const db = await getDb();

  return db.select().from(users).orderBy(desc(users.createdAt));

}



export async function updateUserRole(id: number, role: string) {

  const db = await getDb();

  await db.update(users).set({ role }).where(eq(users.id, id));

}



// ==================== USER CLIENT ACCESS FUNCTIONS ====================

export async function assignUserToClient(userId: number, clientId: number, role: 'owner' | 'admin' | 'editor' | 'viewer') {

  const db = await getDb();



  await db.insert(userClients).values({

    userId,

    clientId,

    role,

  });

}



export async function getClientUsers(clientId: number) {

  const db = await getDb();





  const results = await db.select({

    user: users,

    role: userClients.role,

  })

    .from(userClients)

    .innerJoin(users, eq(userClients.userId, users.id))

    .where(eq(userClients.clientId, clientId));



  return results.map(r => ({ ...r.user, role: r.role }));

}



export async function getUserClients(userId: number) {

  const db = await getDb();



  const results = await db.select({

    client: clients,

    role: userClients.role,

  })

    .from(userClients)

    .innerJoin(clients, eq(userClients.clientId, clients.id))

    .where(eq(userClients.userId, userId));



  return results;

}



export async function getUserById(id: number) {
  const db = await getDb();
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

// Role hierarchy definition
const ROLE_HIERARCHY = {
  'owner': 4,
  'admin': 3,
  'editor': 2,
  'viewer': 1
};

export async function isUserAllowedForClient(userId: number, clientId: number, minRole?: 'owner' | 'admin' | 'editor' | 'viewer') {
  const db = await getDb();

  const results = await db.select().from(userClients)
    .where(and(
      eq(userClients.userId, userId),
      eq(userClients.clientId, clientId)
    ));

  if (results.length === 0) return false;

  const userRole = results[0].role as keyof typeof ROLE_HIERARCHY;

  // If a minimum role is required, check hierarchy
  if (minRole) {
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
    return userLevel >= requiredLevel;
  }

  return true;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(data: { email: string; name: string; password?: string }) {
  const db = await getDb();
  // Generate a placeholder openId for invited users (e.g. email-based or uuid)
  // Since we don't have UUID gen here easily, we'll use a prefix.
  const openId = `invite:${data.email}`;

  const [user] = await db.insert(users).values({
    email: data.email,
    name: data.name,
    openId: openId,
    loginMethod: 'email_invite',
    role: 'user'
  }).returning();

  return user;
}

// ==================== CLIENT FUNCTIONS ====================

export async function createClient(data: InsertClient) {

  const db = await getDb();



  const [row] = await db.insert(clients).values(data).returning({ id: clients.id });

  return { id: row.id };

}



export async function getClients() {

  const db = await getDb();



  return db.select().from(clients).orderBy(desc(clients.updatedAt));

}



export async function getClientById(id: number) {

  const db = await getDb();



  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);

  return result[0];

}



export async function updateClient(id: number, data: Partial<InsertClient>) {

  const db = await getDb();



  await db.update(clients).set(data).where(eq(clients.id, id));

}



export async function deleteClient(id: number) {
  const db = await getDb();
  logger.info(`[deleteClient] Starting deletion for Client ID ${id}`);

  try {
    await db.transaction(async (tx) => {
      // Manual Cascade Delete - Ordered to avoid foreign key violations

      // 1. Project Management & Roadmaps
      logger.info(`[deleteClient] Deleting project tasks & roadmaps...`);
      await tx.delete(projectTasks).where(eq(projectTasks.clientId, id));

      const clientRoadmaps = await tx.select({ id: roadmaps.id }).from(roadmaps).where(eq(roadmaps.clientId, id));
      if (clientRoadmaps.length > 0) {
        const roadmapIds = clientRoadmaps.map(r => r.id);
        await tx.delete(roadmapMilestones).where(inArray(roadmapMilestones.roadmapId, roadmapIds));
        await tx.delete(roadmaps).where(eq(roadmaps.clientId, id));
      }

      // 2. Implementation Plans
      logger.info(`[deleteClient] Deleting implementation plans...`);
      const clientPlans = await tx.select({ id: implementationPlans.id }).from(implementationPlans).where(eq(implementationPlans.clientId, id));
      if (clientPlans.length > 0) {
        const planIds = clientPlans.map(p => p.id);
        await tx.delete(implementationTasks).where(inArray(implementationTasks.implementationPlanId, planIds));
        await tx.delete(implementationProgress).where(inArray(implementationProgress.implementationPlanId, planIds));
        await tx.delete(implementationPlans).where(eq(implementationPlans.clientId, id));
      }

      // 3. Assessments & Findings
      logger.info(`[deleteClient] Deleting assessments & findings...`);
      await tx.delete(gapResponses).where(eq(gapResponses.clientId, id));
      await tx.delete(gapQuestionnaireRequests).where(inArray(gapQuestionnaireRequests.assessmentId,
        tx.select({ id: gapAssessments.id }).from(gapAssessments).where(eq(gapAssessments.clientId, id))
      ));
      await tx.delete(gapAssessments).where(eq(gapAssessments.clientId, id));
      await tx.delete(auditFindings).where(eq(auditFindings.clientId, id));
      await tx.delete(complianceSnapshots).where(eq(complianceSnapshots.clientId, id));

      // 4. Privacy & Consent
      logger.info(`[deleteClient] Deleting privacy & consent data...`);
      await tx.delete(consents).where(eq(consents.clientId, id));
      await tx.delete(consentTemplates).where(eq(consentTemplates.clientId, id));
      await tx.delete(dsarTemplates).where(eq(dsarTemplates.clientId, id));
      await tx.delete(dpiaTemplates).where(eq(dpiaTemplates.clientId, id));

      // 5. Data Flows
      logger.info(`[deleteClient] Deleting data flows...`);
      const clientFlows = await tx.select({ id: dataFlowVisualizations.id }).from(dataFlowVisualizations).where(eq(dataFlowVisualizations.clientId, id));
      if (clientFlows.length > 0) {
        const flowIds = clientFlows.map(f => f.id);
        await tx.delete(dataFlowConnections).where(inArray(dataFlowConnections.flowId, flowIds));
        await tx.delete(dataFlowNodes).where(inArray(dataFlowNodes.flowId, flowIds));
        await tx.delete(dataFlowVisualizations).where(eq(dataFlowVisualizations.clientId, id));
      }

      // 6. Integrations & Notifications
      logger.info(`[deleteClient] Deleting integrations & notifications...`);
      await tx.delete(integrations).where(eq(integrations.clientId, id));
      await tx.delete(notificationSettings).where(eq(notificationSettings.clientId, id));
      await tx.delete(emailMessages).where(eq(emailMessages.clientId, id));

      // 7. Core Tasks & Evidence (Existing logic migrated to transaction)
      logger.info(`[deleteClient] Deleting core tasks & evidence...`);
      await tx.delete(employeeTaskAssignments).where(eq(employeeTaskAssignments.clientId, id));
      await tx.delete(evidenceRequests).where(eq(evidenceRequests.clientId, id));
      await tx.delete(controlPolicyMappings).where(eq(controlPolicyMappings.clientId, id));

      const clientEvidence = await tx.select({ id: evidence.id }).from(evidence).where(eq(evidence.clientId, id));
      if (clientEvidence.length > 0) {
        for (const ev of clientEvidence) {
          await tx.delete(evidenceFiles).where(eq(evidenceFiles.evidenceId, ev.id));
        }
        await tx.delete(evidence).where(eq(evidence.clientId, id));
      }

      // 8. Base Data
      logger.info(`[deleteClient] Deleting base client data...`);
      await tx.delete(clientPolicies).where(eq(clientPolicies.clientId, id));
      await tx.delete(clientControls).where(eq(clientControls.clientId, id));
      await tx.delete(employees).where(eq(employees.clientId, id));
      await tx.delete(auditNotes).where(eq(auditNotes.clientId, id));
      await tx.delete(userClients).where(eq(userClients.clientId, id));

      // 9. Finally delete the client record
      logger.info(`[deleteClient] Deleting client record...`);
      await tx.delete(clients).where(eq(clients.id, id));

      logger.info(`[deleteClient] Successfully deleted Client ID ${id}`);
    });

  } catch (error) {
    logger.error(`[deleteClient] FAILED at some step:`, error);
    throw error;
  }
}



// ==================== CONTROL FUNCTIONS ====================

export async function createControl(data: InsertControl) {

  const db = await getDb();



  const [row] = await db.insert(controls).values(data).returning({ id: controls.id });

  return { id: row.id };

}



export async function getControls(framework?: string, clientId?: number) {

  const db = await getDb();



  // 1. Fetch Standard Controls

  let standardQuery = db.select().from(controls);

  if (framework && framework !== 'all') {

    standardQuery = standardQuery.where(eq(controls.framework, framework));

  }

  const standardControls = await standardQuery.orderBy(controls.controlId);



  // 2. Fetch Client Framework Controls (if clientId provided)

  // 2. Fetch Client Framework Controls

  // If clientId is provided, restrict to that client.

  // If NOT provided, fetch controls from all clients (filtered by framework if specified).



  let frameworkQuery = db.select({

    fc: clientFrameworkControls,

    fw: clientFrameworks

  })

    .from(clientFrameworkControls)

    .innerJoin(clientFrameworks, eq(clientFrameworkControls.frameworkId, clientFrameworks.id));



  const filters = [];

  if (clientId) {

    filters.push(eq(clientFrameworks.clientId, clientId));

  }

  if (framework && framework !== 'all') {

    filters.push(eq(clientFrameworks.name, framework));

  }



  // Apply filters

  if (filters.length > 0) {

    frameworkQuery = frameworkQuery.where(and(...filters));

  }



  // Optimization: If no client ID and no framework (i.e. 'all'), 

  // do we really want to return EVERY custom control from EVERY client?

  // Potentially massive. 

  // For now, let's assume 'all' on global view ONLY shows standard controls to keep it clean,

  // UNLESS the user explicitly asks for a framework.

  if (!clientId && (!framework || framework === 'all')) {

    return standardControls;

  }



  const results = await frameworkQuery;



  // Map to Control shape

  const mappedControls = results

    .map(({ fc, fw }) => ({

      id: -fc.id,

      controlId: fc.controlCode,

      name: fc.title,

      description: fc.description,

      framework: fw.name,

      category: fc.grouping || 'General',

      owner: fc.owner || 'Client Admin',

      frequency: 'Annual',

      evidenceType: 'Document',

      status: 'active' as const,

      version: 1,

      createdAt: fc.createdAt,

      updatedAt: fc.updatedAt

    }));



  return [...standardControls, ...mappedControls].sort((a, b) =>

    a.controlId.localeCompare(b.controlId, undefined, { numeric: true })

  );





}


export async function getControlsPaginated(
  framework?: string | string[],
  clientId?: number,
  limit: number = 50,
  offset: number = 0,
  search?: string
) {
  const db = await getDb();

  const conditions = [];
  if (search) {
    const searchLower = `%${search.toLowerCase()}%`;
    conditions.push(or(
      ilike(controls.name, searchLower),
      ilike(controls.controlId, searchLower),
      ilike(controls.description, searchLower)
    ));
  }
  if (framework && framework !== 'all') {
    if (Array.isArray(framework)) {
      if (framework.length > 0 && !framework.includes('all')) {
        conditions.push(inArray(controls.framework, framework));
      }
    } else {
      conditions.push(eq(controls.framework, framework));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let totalCount = 0;
  try {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(controls)
      .where(whereClause);
    if (result && result[0]) {
      totalCount = Number(result[0].count);
    }
  } catch (e) {
    console.error("Error counting controls:", e);
    totalCount = 0;
  }

  const data = await db.select().from(controls)
    .where(whereClause)
    .orderBy(controls.id)
    .limit(limit)
    .offset(offset);

  // Simplified: Return controls with their own framework only
  // Temporary fix to avoid complex join errors
  const enrichedData = data.map((c: any) => ({
    ...c,
    id: c.id ? Number(c.id) : c.id,
    version: c.version ? Number(c.version) : c.version,
    clientId: c.clientId ? Number(c.clientId) : c.clientId,
    mappedFrameworks: [c.framework]
  }));

  return {
    items: enrichedData,
    total: totalCount
  };
}


export async function getControlById(id: number) {

  const db = await getDb();



  const result = await db.select().from(controls).where(eq(controls.id, id)).limit(1);

  return result[0];

}



export async function updateControl(id: number, data: Partial<InsertControl>, userId: number, changeNote?: string) {

  const db = await getDb();



  // Get current control for history

  const current = await getControlById(id);

  if (current) {

    // Save to history

    await db.insert(controlHistory).values({

      controlId: id,

      version: current.version,

      name: current.name,

      description: current.description,

      framework: current.framework,

      owner: current.owner,

      frequency: current.frequency,

      evidenceType: current.evidenceType,

      changedBy: userId,

      changeNote: changeNote || 'Updated',

    });



    // Update with incremented version

    await db.update(controls).set({

      ...data,

      version: current.version + 1,

    }).where(eq(controls.id, id));

  }

}



export async function deleteControl(id: number) {

  const db = await getDb();



  await db.delete(controls).where(eq(controls.id, id));

}



export async function getControlHistory(controlId: number) {

  const db = await getDb();



  return db.select().from(controlHistory)

    .where(eq(controlHistory.controlId, controlId))

    .orderBy(desc(controlHistory.version));

}



// ==================== POLICY TEMPLATE FUNCTIONS ====================

export async function createPolicyTemplate(data: InsertPolicyTemplate) {

  const db = await getDb();



  const [row] = await db.insert(policyTemplates).values(data).returning({ id: policyTemplates.id });

  return { id: row.id };

}



export async function getPolicyTemplates(framework?: string) {

  const db = await getDb();



  if (framework && framework !== 'all') {

    return db.select().from(policyTemplates)

      .where(eq(policyTemplates.framework, framework))

      .orderBy(policyTemplates.templateId);

  }

  return db.select().from(policyTemplates).orderBy(policyTemplates.templateId);

}



export async function getPolicyTemplateById(id: number) {

  const db = await getDb();



  const result = await db.select().from(policyTemplates).where(eq(policyTemplates.id, id)).limit(1);

  return result[0];

}



// ==================== DEFAULT SEEDING ====================

export async function ensureDefaultDataSeeded() {

  const db = await getDb();



  // Seed Controls if empty

  const [controlCount] = await db.select({ count: sql<number>`count(*)` }).from(controls);

  if (!controlCount?.count) {

    const defaultControls: InsertControl[] = [

      {

        controlId: "A.5-Policies",

        name: "Information Security Policies",

        description: "Policies for information security shall be defined, approved, published and communicated.",

        framework: "ISO 27001",

        owner: "CISO",

        frequency: "Annual",

        evidenceType: "Document",

        status: "active",

        category: "Governance",

        grouping: "Governance",

      },

      {

        controlId: "A.9-Access",

        name: "Access Control",

        description: "Access to information assets shall be controlled based on business and security requirements.",

        framework: "ISO 27001",

        owner: "IT Security",

        frequency: "Annual",

        evidenceType: "Configuration",

        status: "active",

        category: "Access Control",

        grouping: "Access Control",

      },

      {

        controlId: "CC6.1",

        name: "Logical Access Controls",

        description: "Logical access to information assets and systems is restricted to authorized personnel.",

        framework: "SOC 2",

        owner: "IT Security",

        frequency: "Annual",

        evidenceType: "Configuration",

        status: "active",

        category: "Access Control",

        grouping: "Access Control",

      },

      {

        controlId: "CC7.2",

        name: "Change Management",

        description: "Changes to infrastructure, data, software are authorized, tested, approved, and documented.",

        framework: "SOC 2",

        owner: "Engineering",

        frequency: "Quarterly",

        evidenceType: "Log",

        status: "active",

        category: "Operations",

        grouping: "Operations",

      },

    ];

    await db.insert(controls).values(defaultControls);

    logger.info(`[Seed] Inserted ${defaultControls.length} default controls`);

  }



  // Seed NIST CSF Controls if missing

  const [nistCount] = await db.select({ count: sql<number>`count(*)` }).from(controls).where(eq(controls.framework, "NIST CSF"));

  if (!nistCount?.count) {

    const nistControls: InsertControl[] = [

      // GOVERN

      {

        controlId: "GV.OC-01",

        name: "Organizational Context",

        description: "The organizational mission, objectives, stakeholders, and legal, regulatory, and contractual requirements are understood and prioritized.",

        framework: "NIST CSF",

        owner: "Executive Management",

        frequency: "Annual",

        evidenceType: "Document",

        status: "active",

        category: "Govern",

      },

      // IDENTIFY

      {

        controlId: "ID.AM-01",

        name: "Asset Management",

        description: "Inventories of hardware, software, services, and data are maintained and managed.",

        framework: "NIST CSF",

        owner: "IT Manager",

        frequency: "Quarterly",

        evidenceType: "Log",

        status: "active",

        category: "Identify",

      },

      {

        controlId: "ID.RA-01",

        name: "Risk Assessment",

        description: "Cybersecurity risks to the organization, assets, and individuals are identified and assessed.",

        framework: "NIST CSF",

        owner: "CISO",

        frequency: "Annual",

        evidenceType: "Document",

        status: "active",

        category: "Identify",

      },

      // PROTECT

      {

        controlId: "PR.AA-01",

        name: "Identity Management & Access Control",

        description: "Access to physical and logical assets is limited to authorized users, processes, and devices.",

        framework: "NIST CSF",

        owner: "IT Security",

        frequency: "Monthly",

        evidenceType: "Configuration",

        status: "active",

        category: "Protect",

      },

      {

        controlId: "PR.DS-01",

        name: "Data Security",

        description: "Data is managed consistent with the organization's risk strategy to protect the confidentiality, integrity, and availability of information.",

        framework: "NIST CSF",

        owner: "Data Privacy Officer",

        frequency: "Annual",

        evidenceType: "Document",

        status: "active",

        category: "Protect",

      },

      // DETECT

      {

        controlId: "DE.CM-01",

        name: "Continuous Monitoring",

        description: "The information system and assets are monitored to identify cybersecurity events and verify the effectiveness of protective measures.",

        framework: "NIST CSF",

        owner: "SOC Lead",

        frequency: "Daily",

        evidenceType: "Log",

        status: "active",

        category: "Detect",

      },

      // RESPOND

      {

        controlId: "RS.MA-01",

        name: "Incident Management",

        description: "Incident response processes and procedures are established, maintained, and exercised.",

        framework: "NIST CSF",

        owner: "Incident Response Team",

        frequency: "Annual",

        evidenceType: "Document",

        status: "active",

        category: "Respond",

      },

      // RECOVER

      {

        controlId: "RC.RP-01",

        name: "Recovery Planning",

        description: "Recovery processes and procedures are executed and maintained to ensure timely restoration of systems or assets affected by cybersecurity incidents.",

        framework: "NIST CSF",

        owner: "IT Operations",

        frequency: "Annual",

        evidenceType: "Document",

        status: "active",

        category: "Recover",

      },

    ];

    await db.insert(controls).values(nistControls);

    logger.info(`[Seed] Inserted ${nistControls.length} NIST CSF controls`);

  }



  // Seed Policy Templates if empty

  const [templateCount] = await db.select({ count: sql<number>`count(*)` }).from(policyTemplates);

  if (!templateCount?.count) {

    const defaultTemplates: InsertPolicyTemplate[] = [

      {

        templateId: "POL-001",

        name: "Information Security Policy",

        framework: "ISO 27001",

        sections: [

          "Purpose",

          "Scope",

          "Roles & Responsibilities",

          "Policy Statement",

          "Procedures",

          "Review & Approval",

        ],

        content: "[COMPANY NAME] establishes an Information Security Policy to protect information assets.",

      },

      {

        templateId: "POL-002",

        name: "Access Control Policy",

        framework: "ISO 27001",

        sections: ["Purpose", "Scope", "Policy Statement", "Procedures", "Review & Approval"],

        content: "Access to systems and data is granted based on least privilege and business need.",

      },

      {

        templateId: "POL-003",

        name: "Incident Response Policy",

        framework: "SOC 2",

        sections: ["Purpose", "Scope", "Policy Statement", "Procedures", "Review & Approval"],

        content: "Defines processes to respond to and recover from security incidents.",

      },

      {

        templateId: "POL-004",

        name: "Vendor Risk Management Policy",

        framework: "SOC 2",

        sections: ["Purpose", "Scope", "Policy Statement", "Procedures", "Review & Approval"],

        content: "Establishes due diligence and monitoring of third-party service providers.",

      },

    ];

    await db.insert(policyTemplates).values(defaultTemplates);

    logger.info(`[Seed] Inserted ${defaultTemplates.length} default policy templates`);

  }

}



export async function updatePolicyTemplate(id: number, data: Partial<InsertPolicyTemplate>) {

  const db = await getDb();



  await db.update(policyTemplates).set(data).where(eq(policyTemplates.id, id));

}



export async function deletePolicyTemplate(id: number) {

  const db = await getDb();



  await db.delete(policyTemplates).where(eq(policyTemplates.id, id));

}



// ==================== CLIENT CONTROL FUNCTIONS ====================

export async function createClientControl(data: InsertClientControl) {

  const db = await getDb();



  const [row] = await db.insert(clientControls).values(data).returning({ id: clientControls.id });

  return { id: row.id };

}





export async function getClientControls(clientId: number) {

  const db = await getDb();



  // 1. Fetch Standard Controls

  const standardControls = await db.select({

    clientControl: {

      id: clientControls.id,

      clientId: clientControls.clientId,

      controlId: clientControls.controlId,

      clientControlId: clientControls.clientControlId,

      customDescription: clientControls.customDescription,

      owner: clientControls.owner,

      status: clientControls.status,

      applicability: clientControls.applicability,

      justification: clientControls.justification,

      implementationDate: clientControls.implementationDate,

      implementationNotes: clientControls.implementationNotes,

      evidenceLocation: clientControls.evidenceLocation,

      createdAt: clientControls.createdAt,

    },

    control: {

      id: controls.id,

      controlId: controls.controlId,

      name: controls.name,

      description: controls.description,

      framework: controls.framework,

      category: controls.category,

    },

  })

    .from(clientControls)

    .leftJoin(controls, eq(clientControls.controlId, controls.id))

    .where(eq(clientControls.clientId, clientId));



  // 2. Fetch Framework Controls (BYOF)

  const frameworkControls = await db.select({

    fc: clientFrameworkControls,

    fw: clientFrameworks

  })

    .from(clientFrameworkControls)

    .innerJoin(clientFrameworks, eq(clientFrameworkControls.frameworkId, clientFrameworks.id))

    .where(eq(clientFrameworks.clientId, clientId));



  // 3. Map Framework Controls to Standard Shape

  const mappedFrameworkControls = frameworkControls.map(({ fc, fw }) => ({

    clientControl: {

      id: -fc.id, // Negative ID to distinguish

      clientId: fw.clientId,

      controlId: 0, // Dummy

      clientControlId: fc.controlCode,

      customDescription: fc.customDescription,

      owner: fc.owner,

      status: fc.status as any, // Cast enum if needed

      applicability: fc.applicability,

      justification: fc.justification,

      implementationDate: fc.implementationDate,

      implementationNotes: fc.implementationNotes,

      evidenceLocation: fc.evidenceLocation,

      createdAt: fc.createdAt,

    },

    control: {

      id: 0, // Dummy

      controlId: fc.controlCode,

      name: fc.title,

      description: fc.description,

      framework: fw.name,

      category: fc.grouping || 'General',

    }

  }));



  // 4. Merge and Sort

  const combined = [...standardControls, ...mappedFrameworkControls];

  return combined.sort((a, b) => {

    const codeA = a.clientControl.clientControlId || '';

    const codeB = b.clientControl.clientControlId || '';

    return codeA.localeCompare(codeB, undefined, { numeric: true });

  });

}



export async function getClientControlById(id: number) {

  const db = await getDb();



  if (id < 0) {

    // Framework Control

    const realId = Math.abs(id);

    const result = await db.select({

      fc: clientFrameworkControls,

      fw: clientFrameworks

    })

      .from(clientFrameworkControls)

      .innerJoin(clientFrameworks, eq(clientFrameworkControls.frameworkId, clientFrameworks.id))

      .where(eq(clientFrameworkControls.id, realId))

      .limit(1);



    if (!result[0]) return undefined;

    const { fc, fw } = result[0];



    return {

      clientControl: {

        id: -fc.id,

        clientId: fw.clientId,

        controlId: 0,

        clientControlId: fc.controlCode,

        customDescription: fc.customDescription,

        owner: fc.owner,

        status: fc.status as any,

        applicability: fc.applicability,

        justification: fc.justification,

        implementationDate: fc.implementationDate,

        implementationNotes: fc.implementationNotes,

        evidenceLocation: fc.evidenceLocation,

        createdAt: fc.createdAt,

      },

      control: {

        id: 0,

        controlId: fc.controlCode,

        name: fc.title,

        description: fc.description,

        framework: fw.name,

        category: fc.grouping || 'General',

      }

    };

  }



  const result = await db.select({

    clientControl: clientControls,

    control: controls,

  })

    .from(clientControls)

    .leftJoin(controls, eq(clientControls.controlId, controls.id))

    .where(eq(clientControls.id, id))

    .limit(1);

  return result[0];

}



export async function updateClientControl(id: number, data: Partial<InsertClientControl>) {

  const db = await getDb();



  if (id < 0) {

    // It's a framework control

    const realId = Math.abs(id);

    // Filter data to only valid columns for framework controls

    // We added parity columns earlier

    const { controlId, clientId, clientControlId, ...validData } = data as any;

    await db.update(clientFrameworkControls).set(validData).where(eq(clientFrameworkControls.id, realId));

  } else {

    await db.update(clientControls).set(data).where(eq(clientControls.id, id));

  }

}



export async function deleteClientControl(id: number) {

  const db = await getDb();



  if (id < 0) {

    // Delete framework control

    // NOTE: This actually deletes the imported record. In BYOF, do we want to "delete" or just "hide"?

    // Assuming delete is fine for now. User can re-import or we might just want to set status to 'not_applicable'?

    // For now, let's delete to unpollute the view.

    const realId = Math.abs(id);

    await db.delete(clientFrameworkControls).where(eq(clientFrameworkControls.id, realId));

  } else {

    // Delete related evidence first (FK constraint)

    await db.delete(evidence).where(eq(evidence.clientControlId, id));



    // Delete related mappings (FK constraint)

    await db.delete(controlPolicyMappings).where(eq(controlPolicyMappings.clientControlId, id));



    // Now delete the client control

    await db.delete(clientControls).where(eq(clientControls.id, id));

  }

}



// ==================== CLIENT POLICY FUNCTIONS ====================

export async function createClientPolicy(data: InsertClientPolicy) {

  const db = await getDb();



  const [row] = await db.insert(clientPolicies).values(data).returning();
  return row;

}



export async function getClientPolicies(clientId: number) {

  const db = await getDb();



  return db.select({

    clientPolicy: clientPolicies,

    template: policyTemplates,

  })

    .from(clientPolicies)

    .leftJoin(policyTemplates, eq(clientPolicies.templateId, policyTemplates.id))

    .where(eq(clientPolicies.clientId, clientId))

    .orderBy(clientPolicies.clientPolicyId);

}



export async function getClientPolicyById(id: number) {

  const db = await getDb();



  const result = await db.select({

    clientPolicy: clientPolicies,

    template: policyTemplates,

  })

    .from(clientPolicies)

    .leftJoin(policyTemplates, eq(clientPolicies.templateId, policyTemplates.id))

    .where(eq(clientPolicies.id, id))

    .limit(1);

  return result[0];

}



export async function updateClientPolicy(id: number, data: Partial<InsertClientPolicy>) {

  const db = await getDb();



  await db.update(clientPolicies).set(data).where(eq(clientPolicies.id, id));

}



export async function deleteClientPolicy(id: number) {

  const db = await getDb();



  // Delete mappings first

  await db.delete(controlPolicyMappings).where(eq(controlPolicyMappings.clientPolicyId, id));



  // Delete RACI assignments

  await db.delete(employeeTaskAssignments)

    .where(and(

      eq(employeeTaskAssignments.taskType, 'policy'),

      eq(employeeTaskAssignments.taskId, id)

    ));



  await db.delete(clientPolicies).where(eq(clientPolicies.id, id));

}



export async function getPolicyRACIAssignments(policyId: number) {

  const db = await getDb();



  return await db.select({

    assignment: employeeTaskAssignments,

    employee: employees,

  })

    .from(employeeTaskAssignments)

    .leftJoin(employees, eq(employeeTaskAssignments.employeeId, employees.id))

    .where(and(

      eq(employeeTaskAssignments.taskType, 'policy'),

      eq(employeeTaskAssignments.taskId, policyId)

    ));

}



export async function updatePolicyRACIAssignments(clientId: number, policyId: number, assignments: { role: string, employeeId: number }[]) {

  const db = await getDb();



  await db.transaction(async (tx) => {

    // Delete existing assignments for this policy

    await tx.delete(employeeTaskAssignments)

      .where(and(

        eq(employeeTaskAssignments.taskType, 'policy'),

        eq(employeeTaskAssignments.taskId, policyId)

      ));



    // Insert new assignments

    if (assignments.length > 0) {

      await tx.insert(employeeTaskAssignments).values(

        assignments.map(a => ({

          clientId: clientId, // Schema requires clientId

          taskType: 'policy' as const,

          taskId: policyId,

          employeeId: a.employeeId,

          raciRole: a.role as "responsible" | "accountable" | "consulted" | "informed",

        }))

      );

    }

  });

}



// ==================== MAPPING FUNCTIONS ====================

export async function createMapping(data: InsertControlPolicyMapping) {

  const db = await getDb();



  const [row] = await db.insert(controlPolicyMappings).values(data).returning({ id: controlPolicyMappings.id });

  return { id: row.id };

}



export async function getMappings(clientId: number) {

  const db = await getDb();



  return db.select({

    mapping: controlPolicyMappings,

    clientControl: clientControls,

    clientPolicy: clientPolicies,

    control: controls,

  })

    .from(controlPolicyMappings)

    .leftJoin(clientControls, eq(controlPolicyMappings.clientControlId, clientControls.id))

    .leftJoin(clientPolicies, eq(controlPolicyMappings.clientPolicyId, clientPolicies.id))

    .leftJoin(controls, eq(clientControls.controlId, controls.id))

    .where(eq(controlPolicyMappings.clientId, clientId));

}



export async function deleteMapping(id: number) {

  const db = await getDb();



  await db.delete(controlPolicyMappings).where(eq(controlPolicyMappings.id, id));

}



export async function updateMapping(id: number, data: Partial<InsertControlPolicyMapping>) {

  const db = await getDb();



  await db.update(controlPolicyMappings).set(data).where(eq(controlPolicyMappings.id, id));

}



// ==================== EVIDENCE FUNCTIONS ====================

export async function createEvidence(data: InsertEvidence) {

  const db = await getDb();



  const [row] = await db.insert(evidence).values(data).returning({ id: evidence.id });

  return { id: row.id };

}



export async function getEvidence(clientId: number) {
  const db = await getDb();

  return db.select({
    id: evidence.id,
    evidenceId: evidence.evidenceId,
    description: evidence.description,
    framework: evidence.framework,
    status: evidence.status,
    lastVerified: evidence.lastVerified,
    // Include full objects for joined tables if needed, or specific fields
    clientControl: clientControls,
    control: controls,
    fileCount: sql<number>`(SELECT count(*)::int FROM ${evidenceFiles} WHERE ${evidenceFiles.evidenceId} = ${evidence.id})`.mapWith(Number)
  })
    .from(evidence)
    .leftJoin(clientControls, eq(evidence.clientControlId, clientControls.id))
    .leftJoin(controls, eq(clientControls.controlId, controls.id))
    .where(eq(evidence.clientId, clientId))
    .orderBy(evidence.evidenceId);
}



export async function getEvidenceById(id: number) {

  const db = await getDb();



  const result = await db.select().from(evidence).where(eq(evidence.id, id)).limit(1);

  return result[0];

}



export async function updateEvidence(id: number, data: Partial<InsertEvidence>) {

  const db = await getDb();



  await db.update(evidence).set(data).where(eq(evidence.id, id));

}



export async function deleteEvidence(id: number) {

  const db = await getDb();



  await db.delete(evidence).where(eq(evidence.id, id));

}



// ==================== COMPLIANCE SCORE FUNCTIONS ====================
// Note: getClientComplianceScore is defined later in this file (line ~4011) with more comprehensive implementation

// Note: getPolicyCoverageAnalysis is defined later in this file (line ~4294) with more comprehensive implementation


// ==================== AUDIT NOTES FUNCTIONS ====================

export async function createAuditNote(data: InsertAuditNote) {

  const db = await getDb();



  const [row] = await db.insert(auditNotes).values(data).returning({ id: auditNotes.id });

  return { id: row.id };

}



export async function getAuditNotes(clientId: number) {

  const db = await getDb();



  return db.select().from(auditNotes)

    .where(eq(auditNotes.clientId, clientId))

    .orderBy(desc(auditNotes.createdAt));

}



export async function deleteAuditNote(id: number) {

  const db = await getDb();



  await db.delete(auditNotes).where(eq(auditNotes.id, id));

}



// ==================== DASHBOARD STATS ====================

export async function getDashboardStats() {
  const db = await getDb();

  const [clientCount] = await db.select({ count: sql<number>`count(*)` }).from(clients);
  const [controlCount] = await db.select({ count: sql<number>`count(*)` }).from(controls);
  const [policyCount] = await db.select({ count: sql<number>`count(*)` }).from(clientPolicies);
  const [evidenceCount] = await db.select({ count: sql<number>`count(*)` }).from(evidence);
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [llmCount] = await db.select({ count: sql<number>`count(*)` }).from(llmProviders);



  return {

    totalClients: clientCount?.count || 0,

    totalControls: controlCount?.count || 0,

    totalPolicies: policyCount?.count || 0,

    totalEvidence: evidenceCount?.count || 0,

    totalUsers: userCount?.count || 0,

    totalLLMProviders: llmCount?.count || 0,

  };

}





// ==================== BULK CONTROL ASSIGNMENT ====================

export async function getControlsByFramework(framework: string) {

  const db = await getDb();



  // Match controls that contain the framework (handles "ISO 27001", "SOC 2", or "ISO 27001 / SOC 2")

  return db.select().from(controls)

    .where(ilike(controls.framework, `%${framework}%`))

    .orderBy(controls.controlId);

}



export async function getExistingClientControlIds(clientId: number) {

  const db = await getDb();



  const existing = await db.select({ controlId: clientControls.controlId })

    .from(clientControls)

    .where(eq(clientControls.clientId, clientId));



  return new Set(existing.map(e => e.controlId));

}



export async function bulkAssignControls(clientId: number, frameworks: string[] | string, tx?: any) {
  const db = await getDb();
  const frameworksList = Array.isArray(frameworks) ? frameworks : [frameworks];

  const logic = async (t: any) => {
    // Get existing assigned controls for this client
    const existingControls = await t.select({ controlId: clientControls.controlId })
      .from(clientControls)
      .where(eq(clientControls.clientId, clientId));
    const existingControlIds = new Set(existingControls.map((e: any) => e.controlId));

    let totalFound = 0;
    const controlsToInsert: any[] = [];
    const uniqueControlsProcessed = new Set<number>();

    let currentCount = existingControlIds.size;

    for (const framework of frameworksList) {
      const frameworkControls = await getControlsByFramework(framework);
      totalFound += frameworkControls.length;

      for (const control of frameworkControls) {
        if (!existingControlIds.has(control.id) && !uniqueControlsProcessed.has(control.id)) {
          controlsToInsert.push({
            clientId,
            controlId: control.id,
            clientControlId: `CC-${String(currentCount + 1).padStart(3, '0')}`,
            status: 'not_implemented' as const,
          });
          uniqueControlsProcessed.add(control.id);
          currentCount++;
        }
      }
    }

    if (controlsToInsert.length === 0) {
      return { assigned: 0, skipped: totalFound, message: 'All controls already assigned' };
    }

    await t.insert(clientControls).values(controlsToInsert);

    return {
      assigned: controlsToInsert.length,
      skipped: totalFound - controlsToInsert.length,
      total: totalFound,
      message: `Successfully assigned ${controlsToInsert.length} controls from ${frameworksList.join(', ')}`
    };
  };

  if (tx) return logic(tx);
  return await db.transaction(logic);
}



// ==================== BULK POLICY GENERATION ====================

export async function getAllPolicyTemplates() {

  const db = await getDb();



  return db.select().from(policyTemplates).orderBy(policyTemplates.templateId);

}



export async function getExistingClientPolicyTemplateIds(clientId: number) {

  const db = await getDb();



  const existing = await db.select({ templateId: clientPolicies.templateId })

    .from(clientPolicies)

    .where(eq(clientPolicies.clientId, clientId));



  return new Set(existing.filter(e => e.templateId !== null).map(e => e.templateId as number));

}



export async function bulkGeneratePolicies(clientId: number, companyName: string, tx?: any) {
  const db = tx || await getDb();



  // Get all policy templates

  const templates = await getAllPolicyTemplates();



  // Get existing policies for this client (by template ID)

  const existingTemplateIds = await getExistingClientPolicyTemplateIds(clientId);



  // Filter out templates that already have policies created

  const newTemplates = templates.filter(t => !existingTemplateIds.has(t.id));



  if (newTemplates.length === 0) {

    return { created: 0, skipped: templates.length, message: 'All policies already generated from templates' };

  }



  // Get existing policy count for ID generation

  const existingPolicies = await db.select({ id: clientPolicies.id })

    .from(clientPolicies)

    .where(eq(clientPolicies.clientId, clientId));

  const existingCount = existingPolicies.length;



  // Generate policies from templates

  const policiesToInsert = newTemplates.map((template, index) => {

    // Generate policy number

    const policyNumber = `POL-${String(existingCount + index + 1).padStart(3, '0')}`;



    // Replace placeholders in content

    let content = template.content || '';

    content = content.replace(/\[COMPANY NAME\]/g, companyName);

    content = content.replace(/\[DATE\]/g, new Date().toLocaleDateString());

    content = content.replace(/\[AUTHOR\]/g, 'System Generated');

    content = content.replace(/\[POLICY NUMBER\]/g, policyNumber);

    content = content.replace(/\[VERSION\]/g, '1.0');



    return {

      clientId,

      templateId: template.id,

      clientPolicyId: `CP-${String(existingCount + index + 1).padStart(3, '0')}`,

      name: template.name,

      content,

      status: 'draft' as const,

      version: 1,

    };

  });



  // Bulk insert

  await db.insert(clientPolicies).values(policiesToInsert);



  return {
    created: newTemplates.length,
    skipped: templates.length - newTemplates.length,
    total: templates.length,
    message: `Successfully generated ${newTemplates.length} policies from templates`
  };
}



export async function onboardClient(data: {
  name: string;
  industry: string;
  userId: number;
  frameworks: string[] | string;
  companyName: string;
}) {
  const db = await getDb();
  return await db.transaction(async (tx) => {
    // 1. Create Client
    const [client] = await tx.insert(clients).values({
      name: data.name,
      industry: data.industry,
      status: 'active'
    }).returning();

    // 2. Assign User
    await tx.insert(userClients).values({
      userId: data.userId,
      clientId: client.id,
      role: 'owner'
    });

    // 3. Assign Frameworks
    if (data.frameworks) {
      await bulkAssignControls(client.id, data.frameworks, tx);
    }

    // 4. Generate Policies
    await bulkGeneratePolicies(client.id, data.companyName, tx);

    return client;
  });
}

/**
 * Modular seeders for specific sections
 */

async function seedRiskModule(clientId: number) {
  const db = await getDb();
  try {
    // 1. Assets
    const [asset] = await db.insert(schema.assets).values({
      clientId,
      name: "Core Cloud Infrastructure",
      type: "Cloud Service",
      status: "active",
      valuationC: 5, valuationI: 5, valuationA: 5,
      description: "Primary AWS/Azure environment hosting production workloads."
    } as any).returning();

    // 2. KRIs
    await db.insert(schema.kris).values([
      { clientId, name: "Critical System Uptime", description: "Tracking availability of core services", thresholdGreen: "> 99.9%", thresholdAmber: "99.0% - 99.9%", thresholdRed: "< 99.0%", currentStatus: "green", currentValue: "99.99%" },
      { clientId, name: "Mean Time to Patch (Critical)", description: "Days to remediate critical vulns", thresholdGreen: "< 7 days", thresholdAmber: "7-14 days", thresholdRed: "> 14 days", currentStatus: "amber", currentValue: "9 days" }
    ] as any);

    // 3. Threats & Vulnerabilities
    const [threat] = await db.insert(schema.threats).values({
      clientId,
      threatId: "T-001",
      name: "External Ransomware via Phishing",
      category: "Human / Malicious",
      source: "External",
      likelihood: "Likely",
      description: "Phishing attack targeting employees to deliver malware."
    } as any).returning();

    const [vuln] = await db.insert(schema.vulnerabilities).values({
      clientId,
      vulnerabilityId: "V-001",
      name: "Lack of MFA on Legacy Admin Portal",
      severity: "High",
      status: "remediated",
      description: "Older administration tool does not support modern auth."
    } as any).returning();

    // 4. Scenarios & Assessments
    await db.insert(schema.riskAssessments).values([
      {
        clientId,
        assessmentId: `RA-${new Date().getFullYear()}-001`,
        title: "Unauthorized Access to Production Database",
        status: "approved",
        likelihood: "2", impact: "5", inherentScore: 10, inherentRisk: "Medium",
        riskOwner: "CISO",
        assetId: asset.id,
        threatId: threat.id,
        vulnerabilityId: vuln.id
      },
      {
        clientId,
        assessmentId: `RA-${new Date().getFullYear()}-002`,
        title: "DDoS Attack on Public API",
        status: "reviewed",
        likelihood: "3", impact: "4", inherentScore: 12, inherentRisk: "High",
        riskOwner: "SRE Lead"
      }
    ] as any);

    return { assetId: asset.id };
  } catch (err) {
    console.error("Failed to seed risk module:", err);
  }
}

async function seedTPRMModule(clientId: number) {
  const db = await getDb();
  try {
    const [vendor] = await db.insert(schema.vendors).values({
      clientId,
      name: "CloudBase Solutions",
      description: "Primary hosting and managed services provider",
      criticality: "High",
      status: "Active",
      category: "Cloud Services"
    } as any).returning();

    await db.insert(schema.vendorContacts).values({
      clientId,
      vendorId: vendor.id,
      name: "John Doe",
      email: "j.doe@cloudbase.example",
      role: "Account Manager",
      isPrimary: true
    } as any);

    await db.insert(schema.vendorAssessments).values({
      clientId,
      vendorId: vendor.id,
      type: "Annual Security Review",
      status: "Completed",
      score: 88,
      findings: "Minor issues with password rotation policy, remediated.",
      completedDate: new Date()
    } as any);

    await db.insert(schema.vendorContracts).values({
      clientId,
      vendorId: vendor.id,
      title: "Master Services Agreement",
      status: "Active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    } as any);
  } catch (err) {
    console.error("Failed to seed TPRM module:", err);
  }
}

async function seedBCPModule(clientId: number) {
  const db = await getDb();
  try {
    const [process] = await db.insert(schema.businessProcesses).values({
      clientId,
      name: "Online Order Fulfillment",
      description: "Core e-commerce order processing and delivery",
      criticalityTier: "Tier 1",
      rto: "4 hours",
      rpo: "1 hour"
    } as any).returning();

    const [bia] = await db.insert(schema.businessImpactAnalyses).values({
      clientId,
      processId: process.id,
      title: "Impact Analysis: Order Fulfillment",
      status: "completed",
      approvedAt: new Date()
    } as any).returning();

    await db.insert(schema.recoveryObjectives).values({
      biaId: bia.id,
      activity: "Database Restore", // Fixed column name from activityName to activity
      criticalityLevel: "high",
      rto: "2 hours",
      rpo: "15 minutes"
    } as any);

    const [plan] = await db.insert(schema.bcPlans).values({
      clientId,
      title: "Global Business Continuity Plan",
      status: "draft",
      version: "1.0"
    } as any).returning();

    await db.insert(schema.bcPlanBias).values({
      planId: plan.id,
      biaId: bia.id
    } as any);
  } catch (err) {
    console.error("Failed to seed BCP module:", err);
  }
}

async function seedGovernanceModule(clientId: number) {
  const db = await getDb();
  try {
    const [plan] = await db.insert(schema.remediationPlans).values({
      clientId,
      title: "ISO 27001 Roadmap 2024",
      status: "active",
      startDate: new Date()
    } as any).returning();

    await db.insert(schema.roadmapItems).values([
      { planId: plan.id, title: "Implement MFA for all users", phase: 1, status: "done", order: 1 },
      { planId: plan.id, title: "Conduct full internal audit", phase: 1, status: "pending", order: 2 },
      { planId: plan.id, title: "Final certification audit", phase: 2, status: "pending", order: 1 }
    ] as any);

    await db.insert(schema.projectTasks).values([
      { clientId, title: "Upload SOC 2 report for review", status: "todo", priority: "high", tags: ["soc2"] },
      { clientId, title: "Schedule quarterly access review", status: "in_progress", priority: "medium" }
    ] as any);
  } catch (err) {
    console.error("Failed to seed governance module:", err);
  }
}

async function seedCRMModule(clientId: number) {
  const db = await getDb();
  try {
    const [eng] = await db.insert(schema.crmEngagements).values({
      clientId,
      title: "SOC 2 Type II Readiness",
      stage: "remediation",
      framework: "SOC 2",
      progress: 65
    } as any).returning();

    await db.insert(schema.crmActivities).values([
      { clientId, userId: 1, type: "meeting", subject: "Initial Gap Analysis Walkthrough", content: "Discussed critical gaps in access control." },
      { clientId, userId: 1, type: "task", subject: "Send follow-up doc request", outcome: "Sent" }
    ] as any);
  } catch (err) {
    console.error("Failed to seed CRM module:", err);
  }
}

async function seedInfraModule(clientId: number) {
  const db = await getDb();
  try {
    const [conn] = await db.insert(schema.cloudConnections).values({
      clientId,
      provider: "aws",
      name: "Production-AWS",
      status: "connected",
      credentials: "{}" // Mock encrypted
    } as any).returning();

    await db.insert(schema.cloudAssets).values([
      { connectionId: conn.id, clientId, assetType: "ec2", assetId: "i-0abc123def456", name: "prod-db-master", complianceStatus: "compliant" },
      { connectionId: conn.id, clientId, assetType: "s3", assetId: "prod-customer-data", name: "bucket-customer-data", complianceStatus: "non_compliant" }
    ] as any);
  } catch (err) {
    console.error("Failed to seed infra module:", err);
  }
}

async function seedGapModule(clientId: number) {
  const db = await getDb();
  try {
    const [assess] = await db.insert(schema.gapAssessments).values({
      clientId,
      name: "Initial ISO 27001 Readiness Gap Analysis",
      framework: "ISO 27001",
      status: "in_progress",
      executiveSummary: "Initial assessment shows strong foundation in physical security but gaps in formal policy documentation.",
      userId: 1
    } as any).returning();

    await db.insert(schema.gapResponses).values([
      { assessmentId: assess.id, controlId: "A.5.1", currentStatus: "partial", targetStatus: "required", notes: "Policy exists but hasn't been reviewed in 2 years.", gapSeverity: "medium", priorityScore: 70 },
      { assessmentId: assess.id, controlId: "A.9.1", currentStatus: "not_implemented", targetStatus: "required", notes: "Access control policy is missing.", gapSeverity: "high", priorityScore: 90 }
    ] as any);
  } catch (err) {
    console.error("Failed to seed Gap module:", err);
  }
}

async function seedAuditModule(clientId: number) {
  const db = await getDb();
  try {
    // 1. Evidence Requests
    await db.insert(schema.evidenceRequests).values({
      clientId,
      clientControlId: 1, // Mock
      requesterId: 1,
      assigneeId: 1,
      status: "open",
      description: "Please provide the latest firewall configuration backup."
    } as any);

    // 2. Audit Logs
    await db.insert(schema.auditLogs).values([
      { clientId, userId: 1, action: "create", entityType: "policy", details: { name: "Information Security Policy" } },
      { clientId, userId: 1, action: "update", entityType: "control", details: { status: "implemented" } }
    ] as any);

    // 3. Regulation Mappings (NIS2)
    await db.insert(schema.regulationMappings).values({
      clientId,
      regulationId: "nis2",
      articleId: "nis2-art-21-2-a",
      mappedType: "policy",
      mappedId: 1 // Mock
    } as any);
  } catch (err) {
    console.error("Failed to seed Audit module:", err);
  }
}

/**
 * Orchestrates the creation of a "Magic" sample data workspace.
 */
export async function seedSampleData(userId: number, options: { name: string, industry: string, clientId?: number }) {
  const db = await getDb();

  let client;
  if (options.clientId) {
    client = await getClientById(options.clientId);
    if (!client) throw new Error("Client not found");
  } else {
    // 1. Create the Client
    client = await createClient({
      name: options.name,
      industry: options.industry,
      status: 'active'
    });

    // 2. Link User
    await assignUserToClient(userId, client.id, 'owner');
  }

  // 3. Bulk Assign ISO 27001 & SOC 2 Controls
  await bulkAssignControls(client.id, ['ISO 27001', 'SOC 2']);

  // 4. Bulk Generate Policies
  await bulkGeneratePolicies(client.id, options.name);

  // 5. Run expanded module seeders
  await seedRiskModule(client.id);
  await seedTPRMModule(client.id);
  await seedBCPModule(client.id);
  await seedGovernanceModule(client.id);
  await seedCRMModule(client.id);
  await seedInfraModule(client.id);
  await seedGapModule(client.id);
  await seedAuditModule(client.id);
  await seedPeopleModule(client.id);

  // 6. Seed some mock Evidence (enhanced)
  try {
    const cControls = await db.select().from(clientControls).where(eq(clientControls.clientId, client.id)).limit(5);
    if (cControls.length > 0) {
      await db.insert(evidence).values(cControls.map((cc: any, i: number) => ({
        clientId: client.id,
        clientControlId: cc.id, // Fixed: should be clientControlId, not controlId if linking to client_controls
        evidenceId: `DEMO-EV-${i}`,
        description: "Automatic evidence generated for demo purposes.",
        status: i % 2 === 0 ? "verified" : "collected",
        type: "automated"
      })) as any);

      // Set some controls to 'implemented'
      for (const cc of cControls) {
        await db.update(clientControls)
          .set({ status: 'implemented' })
          .where(eq(clientControls.id, cc.id));
      }
    }
  } catch (err) {
    console.error("Failed to seed sample evidence:", err);
  }

  return client;
}

async function seedPeopleModule(clientId: number) {
  const db = await getDb();
  try {
    const DEPARTMENTS = ["Executive", "IT", "Security", "HR", "Sales"];
    const FIRST_NAMES = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi"];
    const LAST_NAMES = ["Smith", "Jones", "Williams", "Brown", "Taylor", "Davies"];

    // 1. Create Roles
    const roleIds: number[] = [];
    const deptRoles = new Map<string, number[]>();

    for (const dept of DEPARTMENTS) {
      const roles = [
        { title: `${dept} Director`, responsibilities: `Lead ${dept}` },
        { title: `${dept} Manager`, responsibilities: `Manage ${dept}` },
      ];
      for (const r of roles) {
        const [res] = await db.insert(orgRoles).values({
          clientId,
          title: r.title,
          department: dept,
          description: r.responsibilities,
          responsibilities: r.responsibilities
        }).returning();
        roleIds.push(res.id);
        if (!deptRoles.has(dept)) deptRoles.set(dept, []);
        deptRoles.get(dept)?.push(res.id);
      }
    }

    // 2. Create Employees
    for (let i = 0; i < 15; i++) {
      const fname = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lname = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const dept = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
      const possibleRoles = deptRoles.get(dept) || [];
      const roleId = possibleRoles[Math.floor(Math.random() * possibleRoles.length)];

      await db.insert(employees).values({
        clientId,
        firstName: fname,
        lastName: lname,
        email: `${fname.toLowerCase()}.${lname.toLowerCase()}${i}@demo.com`,
        department: dept,
        orgRoleId: roleId,
        employmentStatus: "active",
        startDate: new Date(),
        jobTitle: "Employee"
      });
    }

  } catch (err) {
    console.error("Failed to seed People module:", err);
  }
}




// ==================== EVIDENCE FILES ====================

export async function getEvidenceFiles(evidenceId: number) {

  const db = await getDb();



  return db.select().from(evidenceFiles)

    .where(eq(evidenceFiles.evidenceId, evidenceId))

    .orderBy(desc(evidenceFiles.createdAt));

}



export async function createEvidenceFile(data: InsertEvidenceFile) {

  const db = await getDb();



  const [row] = await db.insert(evidenceFiles).values(data).returning({ id: evidenceFiles.id });

  return { id: row.id, ...data };

}



export async function deleteEvidenceFile(id: number) {

  const db = await getDb();



  await db.delete(evidenceFiles).where(eq(evidenceFiles.id, id));

}



export async function getEvidenceFileById(id: number) {

  const db = await getDb();



  const [file] = await db.select().from(evidenceFiles)

    .where(eq(evidenceFiles.id, id))

    .limit(1);



  return file;

}



// ==================== ENHANCED DASHBOARD STATS ====================

export async function getEnhancedDashboardStats() {
  const db = await getDb();

  const [clientCount] = await db.select({ count: sql<number>`count(*)` }).from(clients);
  const [controlCount] = await db.select({ count: sql<number>`count(*)` }).from(controls);
  const [policyCount] = await db.select({ count: sql<number>`count(*)` }).from(clientPolicies);
  const [evidenceCount] = await db.select({ count: sql<number>`count(*)` }).from(evidence);
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [llmCount] = await db.select({ count: sql<number>`count(*)` }).from(llmProviders);



  // Controls by framework
  const controlsByFrameworkList = await db.select({
    framework: controls.framework,
    count: sql<number>`count(*)`
  })
    .from(controls)
    .groupBy(controls.framework);

  const controlsByFramework: Record<string, number> = {};
  controlsByFrameworkList.forEach(r => {
    if (r.framework) controlsByFramework[r.framework] = r.count;
  });



  // Client controls by status (Native)

  const controlStatusCounts = await db.select({

    status: clientControls.status,

    count: sql<number>`count(*)`

  }).from(clientControls).groupBy(clientControls.status);



  // Client Framework Controls by status (Imported)

  const frameworkControlStatusCounts = await db.select({

    status: clientFrameworkControls.status,

    count: sql<number>`count(*)`

  }).from(clientFrameworkControls).groupBy(clientFrameworkControls.status);



  const controlsByStatus = {

    notStarted: 0,

    inProgress: 0,

    implemented: 0,

    notApplicable: 0,

  };



  // Helper to map DB status to dashboard keys
  const mapStatus = (status: string | null, count: number | string) => {
    const numCount = Number(count) || 0;
    if (status === 'not_implemented') controlsByStatus.notStarted += numCount;
    if (status === 'in_progress') controlsByStatus.inProgress += numCount;
    if (status === 'implemented') controlsByStatus.implemented += numCount;
    if (status === 'not_applicable') controlsByStatus.notApplicable += numCount;
  };





  controlStatusCounts.forEach(row => mapStatus(row.status, row.count));

  frameworkControlStatusCounts.forEach(row => mapStatus(row.status || 'not_implemented', row.count));



  // Policies by status

  const policyStatusCounts = await db.select({

    status: clientPolicies.status,

    count: sql<number>`count(*)`

  }).from(clientPolicies).groupBy(clientPolicies.status);



  const policiesByStatus = {

    draft: 0,

    review: 0,

    approved: 0,

    archived: 0,

  };

  policyStatusCounts.forEach(row => {

    if (row.status === 'draft') policiesByStatus.draft = row.count;

    if (row.status === 'review') policiesByStatus.review = row.count;

    if (row.status === 'approved') policiesByStatus.approved = row.count;

    if (row.status === 'archived') policiesByStatus.archived = row.count;

  });



  // Evidence by status

  const evidenceStatusCounts = await db.select({

    status: evidence.status,

    count: sql<number>`count(*)`

  }).from(evidence).groupBy(evidence.status);



  const evidenceByStatus = {

    pending: 0,

    collected: 0,

    verified: 0,

    expired: 0,

    notApplicable: 0,

  };

  evidenceStatusCounts.forEach(row => {

    if (row.status === 'pending') evidenceByStatus.pending = row.count;

    if (row.status === 'collected') evidenceByStatus.collected = row.count;

    if (row.status === 'verified') evidenceByStatus.verified = row.count;

    if (row.status === 'expired') evidenceByStatus.expired = row.count;

    if (row.status === 'not_applicable') evidenceByStatus.notApplicable = row.count;

  });



  // Clients overview with their stats

  const allClients = await db.select().from(clients).orderBy(desc(clients.updatedAt)).limit(10);



  const clientsOverview = await Promise.all(allClients.map(async (client) => {

    // Native Controls

    const [ccCount] = await db.select({ count: sql<number>`count(*)` })

      .from(clientControls).where(eq(clientControls.clientId, client.id));



    // Framework Controls (Imported)

    const [cfcCount] = await db.select({ count: sql<number>`count(*)` })

      .from(clientFrameworkControls)

      .innerJoin(clientFrameworks, eq(clientFrameworkControls.frameworkId, clientFrameworks.id))

      .where(eq(clientFrameworks.clientId, client.id));



    const [cpCount] = await db.select({ count: sql<number>`count(*)` })

      .from(clientPolicies).where(eq(clientPolicies.clientId, client.id));

    const [evCount] = await db.select({ count: sql<number>`count(*)` })

      .from(evidence).where(eq(evidence.clientId, client.id));



    // Calculate compliance percentage (implemented controls / total controls)

    // 1. Native Implemented

    const [implementedNativeCount] = await db.select({ count: sql<number>`count(*)` })

      .from(clientControls)

      .where(and(

        eq(clientControls.clientId, client.id),

        eq(clientControls.status, 'implemented')

      ));



    // 2. Framework Implemented

    const [implementedFrameworkCount] = await db.select({ count: sql<number>`count(*)` })

      .from(clientFrameworkControls)

      .innerJoin(clientFrameworks, eq(clientFrameworkControls.frameworkId, clientFrameworks.id))

      .where(and(

        eq(clientFrameworks.clientId, client.id),

        eq(clientFrameworkControls.status, 'implemented')

      ));



    const totalControls = (ccCount?.count || 0) + (cfcCount?.count || 0);

    const implemented = (implementedNativeCount?.count || 0) + (implementedFrameworkCount?.count || 0);

    const compliancePercentage = totalControls > 0 ? Math.round((implemented / totalControls) * 100) : 0;



    return {

      id: client.id,

      name: client.name,

      industry: client.industry,

      status: client.status,

      controlsCount: totalControls,

      policiesCount: cpCount?.count || 0,

      evidenceCount: evCount?.count || 0,

      compliancePercentage,

      updatedAt: client.updatedAt,

    };

  }));



  // Recent activity (last 10 updates across all entities)

  const recentControls = await db.select({

    type: sql<string>`'control'`,

    name: clientControls.clientControlId,

    clientId: clientControls.clientId,

    updatedAt: clientControls.updatedAt,

  }).from(clientControls).orderBy(desc(clientControls.updatedAt)).limit(5);



  const recentPolicies = await db.select({

    type: sql<string>`'policy'`,

    name: clientPolicies.name,

    clientId: clientPolicies.clientId,

    updatedAt: clientPolicies.updatedAt,

  }).from(clientPolicies).orderBy(desc(clientPolicies.updatedAt)).limit(5);



  const recentEvidence = await db.select({

    type: sql<string>`'evidence'`,

    name: evidence.evidenceId,

    clientId: evidence.clientId,

    updatedAt: evidence.updatedAt,

  }).from(evidence).orderBy(desc(evidence.updatedAt)).limit(5);



  // Combine and sort recent activity

  const recentActivity = [...recentControls, ...recentPolicies, ...recentEvidence]

    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    .slice(0, 10);



  return {

    overview: {

      totalClients: clientCount?.count || 0,

      totalControls: controlCount?.count || 0,

      totalPolicies: policyCount?.count || 0,

      totalEvidence: evidenceCount?.count || 0,
      totalUsers: userCount?.count || 0,
      totalLLMProviders: llmCount?.count || 0,
    },

    controlsByFramework,

    controlsByStatus,

    policiesByStatus,

    evidenceByStatus,

    clientsOverview,

    recentActivity,

  };

}





// ==================== CALENDAR FUNCTIONS ====================



export interface CalendarEvent {

  id: string;

  type: 'control_review' | 'policy_renewal' | 'evidence_expiration';

  title: string;

  description: string;

  dueDate: Date;

  clientId: number;

  clientName: string;

  status: string;

  entityId: number;

  priority: 'high' | 'medium' | 'low';

}



/**

 * Get all calendar events for a date range

 */

export async function getCalendarEvents(

  startDate: Date,

  endDate: Date,

  clientId?: number

): Promise<CalendarEvent[]> {

  const db = await getDb();



  const events: CalendarEvent[] = [];



  // Get control review dates based on frequency

  const controlsQuery = db.select({

    id: clientControls.id,

    clientControlId: clientControls.clientControlId,

    status: clientControls.status,

    clientId: clientControls.clientId,

    clientName: clients.name,

    controlName: controls.name,

    frequency: controls.frequency,

    lastReviewDate: clientControls.updatedAt,

  })

    .from(clientControls)

    .innerJoin(clients, eq(clientControls.clientId, clients.id))

    .innerJoin(controls, eq(clientControls.controlId, controls.id))

    .where(

      clientId ? eq(clientControls.clientId, clientId) : undefined

    );



  const controlResults = await controlsQuery;



  for (const control of controlResults) {

    // Calculate next review date based on frequency

    const lastReview = new Date(control.lastReviewDate);

    let nextReview: Date;



    switch (control.frequency?.toLowerCase()) {

      case 'daily':

        nextReview = new Date(lastReview);

        nextReview.setDate(nextReview.getDate() + 1);

        break;

      case 'weekly':

        nextReview = new Date(lastReview);

        nextReview.setDate(nextReview.getDate() + 7);

        break;

      case 'monthly':

        nextReview = new Date(lastReview);

        nextReview.setMonth(nextReview.getMonth() + 1);

        break;

      case 'quarterly':

        nextReview = new Date(lastReview);

        nextReview.setMonth(nextReview.getMonth() + 3);

        break;

      case 'semi-annually':

      case 'semi-annual':

        nextReview = new Date(lastReview);

        nextReview.setMonth(nextReview.getMonth() + 6);

        break;

      case 'annually':

      case 'annual':

        nextReview = new Date(lastReview);

        nextReview.setFullYear(nextReview.getFullYear() + 1);

        break;

      default:

        // Default to annual if frequency not specified

        nextReview = new Date(lastReview);

        nextReview.setFullYear(nextReview.getFullYear() + 1);

    }



    // Check if next review falls within the date range

    if (nextReview >= startDate && nextReview <= endDate) {

      const daysUntilDue = Math.ceil((nextReview.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      let priority: 'high' | 'medium' | 'low' = 'low';

      if (daysUntilDue <= 7) priority = 'high';

      else if (daysUntilDue <= 30) priority = 'medium';



      events.push({

        id: `control-${control.id}`,

        type: 'control_review',

        title: `Review: ${control.controlName}`,

        description: `${control.frequency || 'Annual'} review for control ${control.clientControlId}`,

        dueDate: nextReview,

        clientId: control.clientId,

        clientName: control.clientName || 'Unknown Client',

        status: control.status || 'pending',

        entityId: control.id,

        priority,

      });

    }

  }



  // Get policy renewal dates (assuming annual renewal from updatedAt)

  const policiesQuery = db.select({

    id: clientPolicies.id,

    name: clientPolicies.name,

    status: clientPolicies.status,

    clientId: clientPolicies.clientId,

    clientName: clients.name,

    updatedAt: clientPolicies.updatedAt,

  })

    .from(clientPolicies)

    .innerJoin(clients, eq(clientPolicies.clientId, clients.id))

    .where(

      clientId ? eq(clientPolicies.clientId, clientId) : undefined

    );



  const policyResults = await policiesQuery;



  for (const policy of policyResults) {

    // Policies typically need annual review

    const lastUpdate = new Date(policy.updatedAt);

    const nextReview = new Date(lastUpdate);

    nextReview.setFullYear(nextReview.getFullYear() + 1);



    if (nextReview >= startDate && nextReview <= endDate) {

      const daysUntilDue = Math.ceil((nextReview.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      let priority: 'high' | 'medium' | 'low' = 'low';

      if (daysUntilDue <= 7) priority = 'high';

      else if (daysUntilDue <= 30) priority = 'medium';



      events.push({

        id: `policy-${policy.id}`,

        type: 'policy_renewal',

        title: `Renew: ${policy.name}`,

        description: `Annual policy renewal required`,

        dueDate: nextReview,

        clientId: policy.clientId,

        clientName: policy.clientName || 'Unknown Client',

        status: policy.status || 'draft',

        entityId: policy.id,

        priority,

      });

    }

  }



  // Get evidence expiration dates

  const evidenceQuery = db.select({

    id: evidence.id,

    evidenceId: evidence.evidenceId,

    description: evidence.description,

    status: evidence.status,

    clientId: evidence.clientId,

    clientName: clients.name,

    lastVerified: evidence.lastVerified,

  })

    .from(evidence)

    .innerJoin(clients, eq(evidence.clientId, clients.id))

    .where(

      clientId ? eq(evidence.clientId, clientId) : undefined

    );



  const evidenceResults = await evidenceQuery;



  for (const ev of evidenceResults) {

    // Evidence typically expires after 1 year from last verification

    if (ev.lastVerified) {

      const lastVerified = new Date(ev.lastVerified);

      const expirationDate = new Date(lastVerified);

      expirationDate.setFullYear(expirationDate.getFullYear() + 1);



      if (expirationDate >= startDate && expirationDate <= endDate) {

        const daysUntilDue = Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        let priority: 'high' | 'medium' | 'low' = 'low';

        if (daysUntilDue <= 7) priority = 'high';

        else if (daysUntilDue <= 30) priority = 'medium';



        events.push({

          id: `evidence-${ev.id}`,

          type: 'evidence_expiration',

          title: `Expires: ${ev.description || ev.evidenceId}`,

          description: `Evidence ${ev.evidenceId} needs re-verification`,

          dueDate: expirationDate,

          clientId: ev.clientId,

          clientName: ev.clientName || 'Unknown Client',

          status: ev.status || 'pending',

          entityId: ev.id,

          priority,

        });

      }

    }

  }



  // Sort events by due date

  events.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());



  return events;

}









// ==================== NOTIFICATION FUNCTIONS ====================



/**

 * Get notification settings for a user

 */

export async function getNotificationSettings(userId: number): Promise<NotificationSettings | null> {

  const db = await getDb();



  const result = await db.select()

    .from(notificationSettings)

    .where(eq(notificationSettings.userId, userId))

    .limit(1);



  return result[0] || null;

}



/**

 * Create or update notification settings for a user

 */

export async function upsertNotificationSettings(

  userId: number,

  settings: Partial<InsertNotificationSettings>

): Promise<NotificationSettings | null> {

  const db = await getDb();



  const existing = await getNotificationSettings(userId);



  if (existing) {

    await db.update(notificationSettings)

      .set(settings)

      .where(eq(notificationSettings.userId, userId));

  } else {

    await db.insert(notificationSettings).values({

      userId,

      ...settings,

    });

  }



  return getNotificationSettings(userId);

}



/**

 * Log a sent notification

 */

export async function logNotification(log: InsertNotificationLog): Promise<void> {

  const db = await getDb();



  await db.insert(notificationLog).values(log);

}



/**

 * Get notification logs for a user

 */

export async function getNotificationLogs(

  userId: number,

  limit: number = 50

): Promise<NotificationLog[]> {

  const db = await getDb();



  return db.select()

    .from(notificationLog)

    .where(eq(notificationLog.userId, userId))

    .orderBy(desc(notificationLog.sentAt))

    .limit(limit);

}



/**

 * Get users who need notifications for upcoming items

 */

export async function getUsersForUpcomingNotifications(): Promise<{

  userId: number;

  email: string;

  name: string;

  settings: NotificationSettings;

}[]> {

  const db = await getDb();



  const result = await db.select({

    userId: users.id,

    email: users.email,

    name: users.name,

    settings: notificationSettings,

  })

    .from(users)

    .innerJoin(notificationSettings, eq(users.id, notificationSettings.userId))

    .where(eq(notificationSettings.emailEnabled, 1));



  return result.filter(r => r.email && r.settings) as {

    userId: number;

    email: string;

    name: string;

    settings: NotificationSettings;

  }[];

}





// ==================== GLOBAL SEARCH ====================



export interface SearchResult {

  id: number;

  type: 'control' | 'policy' | 'evidence' | 'client';

  title: string;

  description: string;

  clientId?: number;

  clientName?: string;

  framework?: string;

  status?: string;

  url: string;

}



export interface SearchFilters {

  clientId?: number;

  framework?: string;

  status?: string;

  type?: 'control' | 'policy' | 'evidence' | 'client';

}



/**

 * Global search across controls, policies, evidence, and clients with optional filters

 */

export async function globalSearch(

  query: string,

  limit: number = 20,

  filters?: SearchFilters

): Promise<SearchResult[]> {

  const db = await getDb();

  if (!db || !query.trim()) return [];



  const searchTerm = `%${query.toLowerCase()}%`;

  const results: SearchResult[] = [];



  // Search master controls (only if no type filter or type is 'control')

  if (!filters?.type || filters.type === 'control') {

    let controlQuery = db.select()

      .from(controls)

      .where(

        or(

          like(sql`LOWER(${controls.name})`, searchTerm),

          like(sql`LOWER(${controls.controlId})`, searchTerm),

          like(sql`LOWER(${controls.description})`, searchTerm),

          like(sql`LOWER(${controls.framework})`, searchTerm)

        )

      );



    const controlResults = await controlQuery.limit(limit);



    for (const control of controlResults) {

      // Apply framework filter

      if (filters?.framework && control.framework !== filters.framework) continue;



      results.push({

        id: control.id,

        type: 'control',

        title: `${control.controlId} - ${control.name}`,

        description: control.description || '',

        framework: control.framework || undefined,

        url: '/controls',

      });

    }

  }



  // Search clients (only if no type filter or type is 'client')

  if (!filters?.type || filters.type === 'client') {

    const clientResults = await db.select()

      .from(clients)

      .where(

        or(

          like(sql`LOWER(${clients.name})`, searchTerm),

          like(sql`LOWER(${clients.industry})`, searchTerm),

          like(sql`LOWER(${clients.notes})`, searchTerm)

        )

      )

      .limit(limit);



    for (const client of clientResults) {

      // Apply status filter

      if (filters?.status && client.status !== filters.status) continue;

      // Apply clientId filter

      if (filters?.clientId && client.id !== filters.clientId) continue;



      results.push({

        id: client.id,

        type: 'client',

        title: client.name,

        description: client.industry || '',

        status: client.status || undefined,

        url: `/clients/${client.id}`,

      });

    }

  }



  // Search client policies (only if no type filter or type is 'policy')

  if (!filters?.type || filters.type === 'policy') {

    const policyResults = await db.select({

      policy: clientPolicies,

      clientName: clients.name,

    })

      .from(clientPolicies)

      .innerJoin(clients, eq(clientPolicies.clientId, clients.id))

      .where(

        or(

          like(sql`LOWER(${clientPolicies.name})`, searchTerm),

          like(sql`LOWER(${clientPolicies.content})`, searchTerm)

        )

      )

      .limit(limit);



    for (const { policy, clientName } of policyResults) {

      // Apply filters

      if (filters?.clientId && policy.clientId !== filters.clientId) continue;

      if (filters?.status && policy.status !== filters.status) continue;



      results.push({

        id: policy.id,

        type: 'policy',

        title: policy.name,

        description: `Policy for ${clientName}`,

        clientId: policy.clientId,

        clientName: clientName || undefined,

        status: policy.status || undefined,

        url: `/clients/${policy.clientId}/policies/${policy.id}`,

      });

    }

  }



  // Search evidence (only if no type filter or type is 'evidence')

  if (!filters?.type || filters.type === 'evidence') {

    const evidenceResults = await db.select({

      evidence: evidence,

      clientName: clients.name,

    })

      .from(evidence)

      .innerJoin(clients, eq(evidence.clientId, clients.id))

      .where(

        or(

          like(sql`LOWER(${evidence.evidenceId})`, searchTerm),

          like(sql`LOWER(${evidence.description})`, searchTerm),

          like(sql`LOWER(${evidence.type})`, searchTerm),

          like(sql`LOWER(${evidence.owner})`, searchTerm)

        )

      )

      .limit(limit);



    for (const { evidence: ev, clientName } of evidenceResults) {

      // Apply filters

      if (filters?.clientId && ev.clientId !== filters.clientId) continue;

      if (filters?.status && ev.status !== filters.status) continue;



      results.push({

        id: ev.id,

        type: 'evidence',

        title: `${ev.evidenceId} - ${ev.description || 'Evidence'}`,

        description: `${ev.type || 'Document'} for ${clientName}`,

        clientId: ev.clientId,

        clientName: clientName || undefined,

        status: ev.status || undefined,

        url: `/clients/${ev.clientId}/evidence`,

      });

    }

  }



  // Sort by relevance (exact matches first, then partial)

  results.sort((a, b) => {

    const aExact = a.title.toLowerCase().includes(query.toLowerCase()) ? 0 : 1;

    const bExact = b.title.toLowerCase().includes(query.toLowerCase()) ? 0 : 1;

    return aExact - bExact;

  });



  return results.slice(0, limit);

}





/**

 * Calculate compliance score for a single client

 */

export async function getClientComplianceScore(clientId: number): Promise<{

  clientId: number;

  clientName: string;

  totalControls: number;

  implementedControls: number;

  inProgressControls: number;

  notStartedControls: number;

  complianceScore: number;

  controlsByFramework: { framework: string; total: number; implemented: number }[];

  policyStatus: { total: number; approved: number; draft: number; review: number };

  evidenceStatus: { total: number; verified: number; pending: number; expired: number };

}> {

  const db = await getDb();



  // Get client info

  const clientResult = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);

  if (clientResult.length === 0) throw new Error("Client not found");

  const client = clientResult[0];



  // Get all client controls with their master control info

  const clientControlsData = await db.select({

    clientControl: clientControls,

    control: controls,

  })

    .from(clientControls)

    .innerJoin(controls, eq(clientControls.controlId, controls.id))

    .where(eq(clientControls.clientId, clientId));



  const totalControls = clientControlsData.length;

  const implementedControls = clientControlsData.filter(c => c.clientControl.status === 'implemented').length;

  const inProgressControls = clientControlsData.filter(c => c.clientControl.status === 'in_progress').length;

  const notStartedControls = clientControlsData.filter(c => c.clientControl.status === 'not_implemented').length;



  // Calculate score (implemented = 100%, in_progress = 50%, not_started = 0%)

  const complianceScore = totalControls > 0

    ? Math.round(((implementedControls * 100) + (inProgressControls * 50)) / totalControls)

    : 0;



  // Group by framework

  const frameworkMap = new Map<string, { total: number; implemented: number }>();

  for (const { clientControl, control } of clientControlsData) {

    const framework = control.framework || 'Unknown';

    if (!frameworkMap.has(framework)) {

      frameworkMap.set(framework, { total: 0, implemented: 0 });

    }

    const entry = frameworkMap.get(framework)!;

    entry.total++;

    if (clientControl.status === 'implemented') {

      entry.implemented++;

    }

  }



  const controlsByFramework = Array.from(frameworkMap.entries()).map(([framework, data]) => ({

    framework,

    ...data,

  }));



  // Get policy status

  const policiesData = await db.select().from(clientPolicies).where(eq(clientPolicies.clientId, clientId));

  const policyStatus = {

    total: policiesData.length,

    approved: policiesData.filter(p => p.status === 'approved').length,

    draft: policiesData.filter(p => p.status === 'draft').length,

    review: policiesData.filter(p => p.status === 'review').length,

  };



  // Get evidence status

  const evidenceData = await db.select().from(evidence).where(eq(evidence.clientId, clientId));

  const evidenceStatus = {

    total: evidenceData.length,

    verified: evidenceData.filter(e => e.status === 'verified').length,

    pending: evidenceData.filter(e => e.status === 'pending').length,

    expired: evidenceData.filter(e => e.status === 'expired').length,

  };



  return {

    clientId,

    clientName: client.name,

    totalControls,

    implementedControls,

    inProgressControls,

    notStartedControls,

    complianceScore,

    controlsByFramework,

    policyStatus,

    evidenceStatus,

  };

}



/**

 * Get compliance scores for all clients

 */

export async function getAllClientComplianceScores(): Promise<{

  clientId: number;

  clientName: string;

  industry: string | null;

  status: string | null;

  totalControls: number;

  implementedControls: number;

  complianceScore: number;

  targetScore: number;

  policyCount: number;

  evidenceCount: number;

}[]> {

  const db = await getDb();



  const allClients = await db.select().from(clients);

  const results = [];



  for (const client of allClients) {

    // Count controls

    const controlsData = await db.select()

      .from(clientControls)

      .where(eq(clientControls.clientId, client.id));



    const totalControls = controlsData.length;

    const implementedControls = controlsData.filter(c => c.status === 'implemented').length;

    const inProgressControls = controlsData.filter(c => c.status === 'in_progress').length;



    const complianceScore = totalControls > 0

      ? Math.round(((implementedControls * 100) + (inProgressControls * 50)) / totalControls)

      : 0;



    // Count policies

    const policiesData = await db.select().from(clientPolicies).where(eq(clientPolicies.clientId, client.id));



    // Count evidence

    const evidenceData = await db.select().from(evidence).where(eq(evidence.clientId, client.id));



    results.push({

      clientId: client.id,

      clientName: client.name,

      industry: client.industry,

      status: client.status,

      totalControls,

      implementedControls,

      complianceScore,

      targetScore: client.targetComplianceScore || 80,

      policyCount: policiesData.length,

      evidenceCount: evidenceData.length,

    });

  }



  // Sort by compliance score descending

  results.sort((a, b) => b.complianceScore - a.complianceScore);



  return results;

}





// ==================== CONTROL-POLICY INTEGRATION ====================



/**

 * Get controls with their suggested policy mappings

 */

export async function getControlsWithSuggestedPolicies(): Promise<{

  control: Control;

  suggestedPolicyIds: string[];

}[]> {

  const db = await getDb();



  const allControls = await db.select().from(controls);



  return allControls.map(control => ({

    control,

    suggestedPolicyIds: control.suggestedPolicies

      ? control.suggestedPolicies.split(',').map(s => s.trim())

      : [],

  }));

}



/**

 * Get policy coverage analysis for a client - shows which controls are covered by which policies

 */

export async function getPolicyCoverageAnalysis(clientId: number): Promise<{

  totalControls: number;

  mappedControls: number;

  unmappedControls: number;

  coveragePercentage: number;

  policyCoverage: {

    policyId: number;

    policyName: string;

    controlCount: number;

    controls: { id: number; controlId: string; name: string }[];

  }[];

  unmappedControlsList: { id: number; controlId: string; name: string; suggestedPolicies: string[] }[];

}> {

  const db = await getDb();



  // Get all client controls

  const clientControlsList = await db.select({

    clientControl: clientControls,

    control: controls,

  })

    .from(clientControls)

    .innerJoin(controls, eq(clientControls.controlId, controls.id))

    .where(eq(clientControls.clientId, clientId));



  // Get all mappings for this client

  const mappings = await db.select({

    mapping: controlPolicyMappings,

    clientControl: clientControls,

    control: controls,

    policy: clientPolicies,

  })

    .from(controlPolicyMappings)

    .innerJoin(clientControls, eq(controlPolicyMappings.clientControlId, clientControls.id))

    .innerJoin(controls, eq(clientControls.controlId, controls.id))

    .innerJoin(clientPolicies, eq(controlPolicyMappings.clientPolicyId, clientPolicies.id))

    .where(eq(controlPolicyMappings.clientId, clientId));



  // Get all client policies

  const policies = await db.select().from(clientPolicies).where(eq(clientPolicies.clientId, clientId));



  // Build policy coverage map

  const policyCoverageMap = new Map<number, {

    policyId: number;

    policyName: string;

    controls: { id: number; controlId: string; name: string }[];

  }>();



  for (const policy of policies) {

    policyCoverageMap.set(policy.id, {

      policyId: policy.id,

      policyName: policy.name,

      controls: [],

    });

  }



  // Track mapped control IDs

  const mappedControlIds = new Set<number>();



  for (const m of mappings) {

    mappedControlIds.add(m.clientControl.id);



    const policyEntry = policyCoverageMap.get(m.policy.id);

    if (policyEntry) {

      policyEntry.controls.push({

        id: m.clientControl.id,

        controlId: m.control.controlId,

        name: m.control.name,

      });

    }

  }



  // Find unmapped controls

  const unmappedControlsList = clientControlsList

    .filter(cc => !mappedControlIds.has(cc.clientControl.id))

    .map(cc => ({

      id: cc.clientControl.id,

      controlId: cc.control.controlId,

      name: cc.control.name,

      suggestedPolicies: cc.control.suggestedPolicies

        ? cc.control.suggestedPolicies.split(',').map(s => s.trim())

        : [],

    }));



  const totalControls = clientControlsList.length;

  const mappedControls = mappedControlIds.size;

  const unmappedControls = totalControls - mappedControls;

  const coveragePercentage = totalControls > 0 ? Math.round((mappedControls / totalControls) * 100) : 0;



  return {

    totalControls,

    mappedControls,

    unmappedControls,

    coveragePercentage,

    policyCoverage: Array.from(policyCoverageMap.values())

      .map(p => ({ ...p, controlCount: p.controls.length }))

      .sort((a, b) => b.controlCount - a.controlCount),

    unmappedControlsList,

  };

}



/**

 * Get suggested mappings for a client based on control categories and policy templates

 */

export async function getSuggestedMappings(clientId: number): Promise<{

  controlId: number;

  clientControlId: string;

  controlName: string;

  category: string;

  suggestedPolicies: {

    policyId: number;

    policyName: string;

    templateId: string;

    matchReason: string;

  }[];

}[]> {

  const db = await getDb();



  // Get unmapped client controls with their suggested policies

  const clientControlsList = await db.select({

    clientControl: clientControls,

    control: controls,

  })

    .from(clientControls)

    .innerJoin(controls, eq(clientControls.controlId, controls.id))

    .where(eq(clientControls.clientId, clientId));



  // Get existing mappings

  const existingMappings = await db.select({

    clientControlId: controlPolicyMappings.clientControlId,

    clientPolicyId: controlPolicyMappings.clientPolicyId,

  })

    .from(controlPolicyMappings)

    .where(eq(controlPolicyMappings.clientId, clientId));



  const mappedPairs = new Set(

    existingMappings.map(m => `${m.clientControlId}-${m.clientPolicyId}`)

  );



  // Get client policies with their template IDs

  const clientPoliciesList = await db.select({

    policy: clientPolicies,

    template: policyTemplates,

  })

    .from(clientPolicies)

    .leftJoin(policyTemplates, eq(clientPolicies.templateId, policyTemplates.id))

    .where(eq(clientPolicies.clientId, clientId));



  // Build template ID to policy map

  const templateToPolicyMap = new Map<string, { policyId: number; policyName: string }>();

  for (const { policy, template } of clientPoliciesList) {

    if (template?.templateId) {

      templateToPolicyMap.set(template.templateId, {

        policyId: policy.id,

        policyName: policy.name,

      });

    }

  }



  // Generate suggestions

  const suggestions: {

    controlId: number;

    clientControlId: string;

    controlName: string;

    category: string;

    suggestedPolicies: {

      policyId: number;

      policyName: string;

      templateId: string;

      matchReason: string;

    }[];

  }[] = [];



  for (const { clientControl, control } of clientControlsList) {

    const suggestedPolicyIds = control.suggestedPolicies

      ? control.suggestedPolicies.split(',').map(s => s.trim())

      : [];



    const suggestedPolicies: {

      policyId: number;

      policyName: string;

      templateId: string;

      matchReason: string;

    }[] = [];



    for (const templateId of suggestedPolicyIds) {

      const policyInfo = templateToPolicyMap.get(templateId);

      if (policyInfo) {

        // Check if this mapping already exists

        if (!mappedPairs.has(`${clientControl.id}-${policyInfo.policyId}`)) {

          suggestedPolicies.push({

            policyId: policyInfo.policyId,

            policyName: policyInfo.policyName,

            templateId,

            matchReason: `Control category "${control.category || 'General'}" matches policy type`,

          });

        }

      }

    }



    if (suggestedPolicies.length > 0) {

      suggestions.push({

        controlId: clientControl.id,

        clientControlId: clientControl.clientControlId || `CC-${clientControl.id}`,

        controlName: control.name,

        category: control.category || 'General',

        suggestedPolicies,

      });

    }

  }



  return suggestions;

}



/**

 * Bulk create mappings from suggestions

 */

export async function bulkCreateMappings(

  clientId: number,

  mappings: { clientControlId: number; clientPolicyId: number }[]

): Promise<{ created: number; skipped: number }> {

  const db = await getDb();



  // Get existing mappings

  const existingMappings = await db.select({

    clientControlId: controlPolicyMappings.clientControlId,

    clientPolicyId: controlPolicyMappings.clientPolicyId,

  })

    .from(controlPolicyMappings)

    .where(eq(controlPolicyMappings.clientId, clientId));



  const existingPairs = new Set(

    existingMappings.map(m => `${m.clientControlId}-${m.clientPolicyId}`)

  );



  let created = 0;

  let skipped = 0;



  for (const mapping of mappings) {

    const pairKey = `${mapping.clientControlId}-${mapping.clientPolicyId}`;

    if (existingPairs.has(pairKey)) {

      skipped++;

      continue;

    }



    await db.insert(controlPolicyMappings).values({

      clientId,

      clientControlId: mapping.clientControlId,

      clientPolicyId: mapping.clientPolicyId,

    });

    created++;

    existingPairs.add(pairKey);

  }



  return { created, skipped };

}



/**

 * Get controls that a specific policy covers

 */

export async function getControlsForPolicy(clientPolicyId: number): Promise<{

  control: Control;

  clientControl: ClientControl;

  mapping: typeof controlPolicyMappings.$inferSelect;

}[]> {

  const db = await getDb();



  const results = await db.select({

    control: controls,

    clientControl: clientControls,

    mapping: controlPolicyMappings,

  })

    .from(controlPolicyMappings)

    .innerJoin(clientControls, eq(controlPolicyMappings.clientControlId, clientControls.id))

    .innerJoin(controls, eq(clientControls.controlId, controls.id))

    .where(eq(controlPolicyMappings.clientPolicyId, clientPolicyId));



  return results;

}



/**

 * Get policies that cover a specific control

 */

export async function getPoliciesForControl(clientControlId: number): Promise<{

  policy: ClientPolicy;

  mapping: typeof controlPolicyMappings.$inferSelect;

}[]> {

  const db = await getDb();



  const results = await db.select({

    policy: clientPolicies,

    mapping: controlPolicyMappings,

  })

    .from(controlPolicyMappings)

    .innerJoin(clientPolicies, eq(controlPolicyMappings.clientPolicyId, clientPolicies.id))

    .where(eq(controlPolicyMappings.clientControlId, clientControlId));



  return results;

}





// ==================== EMPLOYEE FUNCTIONS ====================



/**

 * Get all employees for a client

 */

// ==================== ORG ROLE FUNCTIONS ====================

export async function getOrgRoles(clientId: number) {

  const db = await getDb();

  return db.select().from(orgRoles).where(eq(orgRoles.clientId, clientId)).orderBy(orgRoles.title);

}



export async function getOrgRoleById(id: number) {

  const db = await getDb();

  const result = await db.select().from(orgRoles).where(eq(orgRoles.id, id)).limit(1);

  return result[0];

}



export async function createOrgRole(data: InsertOrgRole) {

  const db = await getDb();

  const [row] = await db.insert(orgRoles).values(data).returning();

  return row;

}



export async function updateOrgRole(id: number, data: Partial<InsertOrgRole>) {

  const db = await getDb();

  const [row] = await db.update(orgRoles).set(data).where(eq(orgRoles.id, id)).returning();

  return row;

}



export async function deleteOrgRole(id: number) {

  const db = await getDb();

  await db.delete(orgRoles).where(eq(orgRoles.id, id));

  return true;

}



/**

 * Get all employees for a client with role and manager details

 */

export async function getEmployees(clientId: number) {

  const db = await getDb();



  const managers = aliasedTable(employees, 'managers');



  return db.select({

    ...getTableColumns(employees),

    orgRoleTitle: orgRoles.title,

    managerName: sql<string>`concat(${managers.firstName}, ' ', ${managers.lastName})`,

  })

    .from(employees)

    .leftJoin(orgRoles, eq(employees.orgRoleId, orgRoles.id))

    .leftJoin(managers, eq(employees.managerId, managers.id))

    .where(eq(employees.clientId, clientId))

    .orderBy(employees.firstName);

}



/**

 * Get a specific employee

 */

/**

 * Get a specific employee with role and manager details

 */

export async function getEmployee(employeeId: number) {

  const db = await getDb();



  const managers = aliasedTable(employees, 'managers');



  const result = await db.select({

    ...getTableColumns(employees),

    orgRoleTitle: orgRoles.title,

    managerName: sql<string>`concat(${managers.firstName}, ' ', ${managers.lastName})`,

  })

    .from(employees)

    .leftJoin(orgRoles, eq(employees.orgRoleId, orgRoles.id))

    .leftJoin(managers, eq(employees.managerId, managers.id))

    .where(eq(employees.id, employeeId))

    .limit(1);



  return result[0] || null;

}



/**

 * Create a new employee

 */

export async function createEmployee(data: InsertEmployee): Promise<Employee | null> {

  const db = await getDb();



  const [row] = await db.insert(employees).values(data).returning({ id: employees.id });

  if (!row?.id) return null;

  return getEmployee(Number(row.id));

}



/**

 * Update an employee

 */

export async function updateEmployee(employeeId: number, data: Partial<InsertEmployee>): Promise<Employee | null> {

  const db = await getDb();



  await db.update(employees)

    .set(data)

    .where(eq(employees.id, employeeId));



  return getEmployee(employeeId);

}



/**

 * Delete an employee

 */

export async function deleteEmployee(employeeId: number): Promise<boolean> {

  const db = await getDb();



  // Also delete associated task assignments

  await db.delete(employeeTaskAssignments)

    .where(eq(employeeTaskAssignments.employeeId, employeeId));



  await db.delete(employees)

    .where(eq(employees.id, employeeId));



  return true;

}



// ==================== EMPLOYEE TASK ASSIGNMENT FUNCTIONS ====================



/**

 * Get all task assignments for a specific task

 */

export async function getTaskAssignments(taskType: string, taskId: number): Promise<{

  assignment: EmployeeTaskAssignment;

  employee: Employee;

}[]> {

  const db = await getDb();



  return db.select({

    assignment: employeeTaskAssignments,

    employee: employees,

  })

    .from(employeeTaskAssignments)

    .innerJoin(employees, eq(employeeTaskAssignments.employeeId, employees.id))

    .where(and(

      eq(employeeTaskAssignments.taskType, taskType as any),

      eq(employeeTaskAssignments.taskId, taskId)

    ))

    .orderBy(employeeTaskAssignments.raciRole);



  // Manually fetch org roles for these employees to override jobTitle if needed

  // (Doing efficient join in the query above is better but requires changing the select structure significantly

  // if we want to keep returning 'employee' object structure cleanly.

  // Actually, let's just do a join)



  const results = await db.select({

    assignment: employeeTaskAssignments,

    employee: employees,

    orgRoleTitle: orgRoles.title

  })

    .from(employeeTaskAssignments)

    .innerJoin(employees, eq(employeeTaskAssignments.employeeId, employees.id))

    .leftJoin(orgRoles, eq(employees.orgRoleId, orgRoles.id))

    .where(and(

      eq(employeeTaskAssignments.taskType, taskType as any),

      eq(employeeTaskAssignments.taskId, taskId)

    ))

    .orderBy(employeeTaskAssignments.raciRole);



  // Return with mapped jobTitle

  return results.map(r => ({

    assignment: r.assignment,

    employee: {

      ...r.employee,

      jobTitle: r.orgRoleTitle || r.employee.jobTitle // Polyfill jobTitle with OrgRole if available

    }

  }));

}



/**

 * Get all task assignments for an employee

 */

export async function getEmployeeAssignments(employeeId: number): Promise<EmployeeTaskAssignment[]> {

  const db = await getDb();



  return db.select()

    .from(employeeTaskAssignments)

    .where(eq(employeeTaskAssignments.employeeId, employeeId))

    .orderBy(desc(employeeTaskAssignments.assignedAt));

}



/**

 * Assign an employee to a task with RACI role

 */

export async function assignEmployeeToTask(data: InsertEmployeeTaskAssignment): Promise<EmployeeTaskAssignment | null> {

  const db = await getDb();



  const [row] = await db.insert(employeeTaskAssignments).values(data).returning({ id: employeeTaskAssignments.id });

  if (!row?.id) return null;

  const assignment = await db.select()

    .from(employeeTaskAssignments)

    .where(eq(employeeTaskAssignments.id, Number(row.id)))

    .limit(1);



  return assignment[0] || null;

}



/**

 * Update task assignment RACI role

 */

export async function updateTaskAssignment(assignmentId: number, raciRole: string, notes?: string): Promise<EmployeeTaskAssignment | null> {

  const db = await getDb();



  await db.update(employeeTaskAssignments)

    .set({ raciRole: raciRole as any, notes })

    .where(eq(employeeTaskAssignments.id, assignmentId));



  const result = await db.select()

    .from(employeeTaskAssignments)

    .where(eq(employeeTaskAssignments.id, assignmentId))

    .limit(1);



  return result[0] || null;

}



/**

 * Remove task assignment

 */

export async function removeTaskAssignment(assignmentId: number): Promise<boolean> {

  const db = await getDb();



  await db.delete(employeeTaskAssignments)

    .where(eq(employeeTaskAssignments.id, assignmentId));



  return true;

}



/**

 * Get RACI summary for a task

 */

export async function getTaskRACISummary(taskType: string, taskId: number): Promise<{

  responsible: Employee[];

  accountable: Employee[];

  consulted: Employee[];

  informed: Employee[];

}> {

  const assignments = await getTaskAssignments(taskType, taskId);



  return {

    responsible: assignments.filter(a => a.assignment.raciRole === 'responsible').map(a => a.employee),

    accountable: assignments.filter(a => a.assignment.raciRole === 'accountable').map(a => a.employee),

    consulted: assignments.filter(a => a.assignment.raciRole === 'consulted').map(a => a.employee),

    informed: assignments.filter(a => a.assignment.raciRole === 'informed').map(a => a.employee),

  };

}





// RACI Matrix Functions

export async function getRACIMatrix(clientId: number) {

  const db = await getDb();



  /* 

    Updated to fetch employees WITH their Org Role 

  */

  const emps = await db.select({

    ...getTableColumns(employees),

    orgRoleTitle: orgRoles.title

  })

    .from(employees)

    .leftJoin(orgRoles, eq(employees.orgRoleId, orgRoles.id))

    .where(eq(employees.clientId, clientId))

    .orderBy(employees.firstName);



  const assignments = await db.select().from(employeeTaskAssignments).where(eq(employeeTaskAssignments.clientId, clientId));



  // Fetch controls and policies to get task names and status

  const controlsList = await db.select({

    id: clientControls.id,

    name: controls.name,

    clientControlId: clientControls.clientControlId,

    status: clientControls.status,

  }).from(clientControls)

    .leftJoin(controls, eq(clientControls.controlId, controls.id))

    .where(eq(clientControls.clientId, clientId));



  const policiesList = await db.select({

    id: clientPolicies.id,

    name: clientPolicies.name,

    clientPolicyId: clientPolicies.clientPolicyId,

    status: clientPolicies.status,

  }).from(clientPolicies).where(eq(clientPolicies.clientId, clientId));



  const evidenceList = await db.select({

    id: evidence.id,

    description: evidence.description,

    evidenceId: evidence.evidenceId,

    status: evidence.status,

  }).from(evidence).where(eq(evidence.clientId, clientId));



  // Build lookup maps

  const controlsMap = new Map(controlsList.map(c => [c.id, c]));

  const policiesMap = new Map(policiesList.map(p => [p.id, p]));

  const evidenceMap = new Map(evidenceList.map(e => [e.id, e]));



  const matrix = emps.map((emp: any) => {

    const empAssignments = assignments.filter((a: any) => a.employeeId === emp.id);



    return {

      employeeId: emp.id,

      employeeName: `${emp.firstName} ${emp.lastName}`,

      department: emp.department,

      jobTitle: emp.orgRoleTitle || emp.jobTitle, // Use OrgRole title if available

      assignments: empAssignments.map((a: any) => {

        let taskName = 'Unknown';

        let taskStatus = 'unknown';

        let taskIdentifier = '';



        if (a.taskType === 'control') {

          const ctrl = controlsMap.get(a.taskId);

          if (ctrl) {

            taskName = ctrl.name || 'Unnamed Control';

            taskStatus = ctrl.status || 'not_implemented';

            taskIdentifier = ctrl.clientControlId || '';

          }

        } else if (a.taskType === 'policy') {

          const pol = policiesMap.get(a.taskId);

          if (pol) {

            taskName = pol.name || 'Unnamed Policy';

            taskStatus = pol.status || 'draft';

            taskIdentifier = pol.clientPolicyId || '';

          }

        } else if (a.taskType === 'evidence') {

          const ev = evidenceMap.get(a.taskId);

          if (ev) {

            taskName = ev.description || 'Unnamed Evidence';

            taskStatus = ev.status || 'pending';

            taskIdentifier = ev.evidenceId || '';

          }

        }



        // Map raciRole to single letter

        const roleMap: Record<string, string> = {

          'responsible': 'R',

          'accountable': 'A',

          'consulted': 'C',

          'informed': 'I'

        };



        return {

          assignmentId: a.id,

          id: a.taskId,

          taskType: a.taskType,

          taskName,

          taskStatus,

          taskIdentifier,

          role: roleMap[a.raciRole] || a.raciRole,

          raciRole: a.raciRole,

          dueDate: a.dueDate,

          notes: a.notes,

        };

      }),

      totalAssignments: empAssignments.length,

    };

  });



  return matrix;

}



export async function getRACIGapAnalysis(clientId: number) {

  const db = await getDb();

  // First, get counts efficiently without joins
  const allControls = await db.select({
    id: clientControls.id,
    controlId: clientControls.controlId,
    clientControlId: clientControls.clientControlId,
    owner: clientControls.owner,
  })
    .from(clientControls)
    .where(eq(clientControls.clientId, clientId));

  const policies = await db.select().from(clientPolicies).where(eq(clientPolicies.clientId, clientId));
  const evs = await db.select().from(evidence).where(eq(evidence.clientId, clientId));

  // Filter unassigned items
  const unassignedControlsBasic = allControls.filter((c: any) => !c.owner);

  // Only join with master controls for unassigned items (optimization)
  const unassignedControlIds = unassignedControlsBasic.map(c => c.controlId);
  let controlDetails: any[] = [];

  if (unassignedControlIds.length > 0) {
    controlDetails = await db.select({
      id: controls.id,
      controlId: controls.controlId,
      name: controls.name,
      description: controls.description
    })
      .from(controls)
      .where(inArray(controls.id, unassignedControlIds));
  }

  // Map control details
  const controlDetailsMap = new Map(controlDetails.map(c => [c.id, c]));

  const unassignedControls = unassignedControlsBasic.map((c: any) => {
    const details = controlDetailsMap.get(c.controlId);
    return {
      id: c.id,
      name: c.clientControlId || details?.controlId || String(c.controlId),
      title: details?.name,
      description: details?.description,
      type: 'control'
    };
  });

  const unassignedPolicies = policies.filter((p: any) => !p.owner).map((p: any) => ({
    id: p.id,
    name: p.clientPolicyId || p.name,
    title: p.name,
    type: 'policy'
  }));

  const unassignedEvidence = evs.filter((e: any) => !e.owner).map((e: any) => ({ id: e.id, name: e.evidenceId, type: 'evidence' }));



  return {

    totalControls: allControls.length,

    assignedControls: allControls.filter((c: any) => c.owner).length,

    unassignedControls: unassignedControls,

    totalPolicies: policies.length,

    assignedPolicies: policies.filter((p: any) => p.owner).length,

    unassignedPolicies: unassignedPolicies,

    totalEvidence: evs.length,

    assignedEvidence: evs.filter((e: any) => e.owner).length,

    unassignedEvidence: unassignedEvidence,

  };

}



// ==================== POLICY GAP ANALYSIS ====================



export async function getPolicyGapAnalysis(clientId: number) {

  const db = await getDb();



  // 1. Get all unimplemented controls for this client that have suggestions

  const unimplemented = await db.select({

    controlId: controls.controlId,

    controlName: controls.name,

    suggestedPolicy: controls.suggestedPolicies,

    status: clientControls.status

  })

    .from(clientControls)

    .innerJoin(controls, eq(clientControls.controlId, controls.id))

    .where(and(

      eq(clientControls.clientId, clientId),

      ne(clientControls.status, 'implemented'),

      isNotNull(controls.suggestedPolicies)

    ));



  // 2. Get all policies the client ALREADY has

  const existingPolicies = await db.select({

    name: clientPolicies.name,

    templateId: policyTemplates.templateId

  })

    .from(clientPolicies)

    .leftJoin(policyTemplates, eq(clientPolicies.templateId, policyTemplates.id))

    .where(eq(clientPolicies.clientId, clientId));



  const existingPolicyNames = new Set(existingPolicies.map(p => p.name.toLowerCase()));



  // 3. Map suggestions to unique templates

  const suggestionsMap = new Map<string, {

    policyName: string,

    reasons: string[],

    templateId?: number,

    templateRef?: string

  }>();



  for (const item of unimplemented) {

    if (!item.suggestedPolicy) continue;



    // Split by comma if multiple policies suggested (e.g. "Policy A, Policy B")

    // Simple implementation assumes one policy string for now, but robustness helps.

    const policyNames = item.suggestedPolicy.split(',').map(s => s.trim());



    for (const pName of policyNames) {

      if (existingPolicyNames.has(pName.toLowerCase())) continue;



      if (!suggestionsMap.has(pName)) {

        suggestionsMap.set(pName, {

          policyName: pName,

          reasons: [],

        });

      }



      const entry = suggestionsMap.get(pName)!;

      if (!entry.reasons.includes(item.controlId)) {

        entry.reasons.push(item.controlId);

      }

    }

  }



  // 4. Resolve Template IDs

  const results = [];

  for (const [name, data] of suggestionsMap.entries()) {

    const template = await db.query.policyTemplates.findFirst({

      where: eq(policyTemplates.name, name)

    });



    if (template) {

      results.push({

        policyName: name,

        templateId: template.id,

        templateRef: template.templateId,

        reasons: data.reasons.slice(0, 5), // Limit reasons to 5

        totalReasonCount: data.reasons.length,

        priority: data.reasons.length > 2 ? 'high' : 'medium'

      });

    }

  }



  return results.sort((a, b) => {

    if (a.priority === 'high' && b.priority !== 'high') return -1;

    if (a.priority !== 'high' && b.priority === 'high') return 1;

    return a.policyName.localeCompare(b.policyName);

  });

}



// LLM Provider Management

export async function getLLMProviders() {

  const db = await getDb();

  // Return all, ordering by priority desc

  return await db.select().from(llmProviders).orderBy(desc(llmProviders.priority));

}



export async function createLLMProvider(data: InsertLLMProvider) {

  const db = await getDb();



  // Encrypt the API key before saving

  const encryptedKey = encrypt(data.apiKey);



  return await db.insert(llmProviders).values({

    ...data,

    apiKey: encryptedKey

  }).returning();

}



export async function updateLLMProvider(id: number, data: Partial<InsertLLMProvider>) {

  const db = await getDb();



  // If apiKey is being updated, encrypt it

  const updateData = { ...data };

  if (updateData.apiKey) {

    updateData.apiKey = encrypt(updateData.apiKey);

  }



  return await db.update(llmProviders)

    .set(updateData)

    .where(eq(llmProviders.id, id))

    .returning();

}



export async function deleteLLMProvider(id: number) {

  const db = await getDb();

  return await db.delete(llmProviders).where(eq(llmProviders.id, id));

}

// ==================== COMMENT FUNCTIONS ====================

export async function createComment(data: InsertComment) {

  const db = await getDb();



  const [row] = await db.insert(comments).values(data).returning({ id: comments.id });

  return { id: row.id, ...data };

}



export async function getClientStats(clientId: number) {

  const db = await getDb();



  // Count controls assigned to this client

  const controlsAssigned = await db.select()

    .from(clientControls)

    .where(eq(clientControls.clientId, clientId));



  // Count policies created for this client

  const policiesCreated = await db.select()

    .from(clientPolicies)

    .where(eq(clientPolicies.clientId, clientId));



  // Count evidence items for this client

  const evidenceCount = await db.select()

    .from(evidence)

    .where(eq(evidence.clientId, clientId));



  // Count control-policy mappings for this client

  const mappingsCount = await db.select()

    .from(controlPolicyMappings)

    .where(eq(controlPolicyMappings.clientId, clientId));



  return {

    controlsAssigned: controlsAssigned.length,

    policiesCreated: policiesCreated.length,

    evidenceCount: evidenceCount.length,

    mappingsCount: mappingsCount.length,

  };

}



export async function getComments(entityType: string, entityId: number) {

  const db = await getDb();



  return db.select({

    comment: comments,

    user: {

      id: users.id,

      name: users.name,

      email: users.email,

      role: users.role,

    }

  })

    .from(comments)

    .innerJoin(users, eq(comments.userId, users.id))

    .where(and(

      eq(comments.entityType, entityType),

      eq(comments.entityId, entityId)

    ))

    .orderBy(desc(comments.id)); // Newest first

}



export async function deleteComment(id: number) {

  const db = await getDb();



  await db.delete(comments).where(eq(comments.id, id));

}



// ==================== POLICY REVIEW FUNCTIONS ====================



/**

 * Create a new policy review session

 */

export async function createPolicyReview(data: InsertPolicyReview): Promise<PolicyReview | null> {

  const db = await getDb();



  const [row] = await db.insert(policyReviews).values(data).returning();

  return row || null;

}



/**

 * Get a policy review by ID

 */

export async function getPolicyReview(id: number): Promise<PolicyReview | null> {

  const db = await getDb();



  const result = await db.select()

    .from(policyReviews)

    .where(eq(policyReviews.id, id))

    .limit(1);



  return result[0] || null;

}



/**

 * Get a policy review by review ID

 */

export async function getPolicyReviewByReviewId(policyReviewId: string): Promise<PolicyReview | null> {

  const db = await getDb();



  const result = await db.select()

    .from(policyReviews)

    .where(eq(policyReviews.policyReviewId, policyReviewId))

    .limit(1);



  return result[0] || null;

}



/**

 * Update policy review status

 */

export async function updatePolicyReviewStatus(id: number, status: string): Promise<void> {

  const db = await getDb();



  await db.update(policyReviews)

    .set({ status: status as any, updatedAt: new Date() })

    .where(eq(policyReviews.id, id));

}



/**

 * Create policy review result

 */

export async function createPolicyReviewResult(data: InsertPolicyReviewResult): Promise<PolicyReviewResult | null> {

  const db = await getDb();



  const [row] = await db.insert(policyReviewResults).values(data).returning();

  return row || null;

}



/**

 * Get policy review result by policy review ID

 */

export async function getPolicyReviewResult(policyReviewId: number): Promise<PolicyReviewResult | null> {

  const db = await getDb();



  const result = await db.select()

    .from(policyReviewResults)

    .where(eq(policyReviewResults.policyReviewId, policyReviewId))

    .limit(1);



  return result[0] || null;

}



/**

 * List policy reviews for a client

 */

export async function listPolicyReviews(clientId: number): Promise<PolicyReview[]> {

  const db = await getDb();



  return db.select()

    .from(policyReviews)

    .where(eq(policyReviews.clientId, clientId))

    .orderBy(desc(policyReviews.createdAt));

}



/**

 * Delete policy review and its results

 */

export async function deletePolicyReview(id: number): Promise<void> {

  const db = await getDb();



  // Delete results first

  await db.delete(policyReviewResults)

    .where(eq(policyReviewResults.policyReviewId, id));



  // Delete review

  await db.delete(policyReviews)

    .where(eq(policyReviews.id, id));

}





// ==================== CALENDAR & ALERTS ====================



// Helper to check if a date is in the past (ignoring time)

function isPast(date: Date | string | null): boolean {

  if (!date) return false;

  const d = new Date(date);

  const now = new Date();

  d.setHours(0, 0, 0, 0);

  now.setHours(0, 0, 0, 0);

  return d < now;

}



// Helper to check if a date is within N days (ignoring time)

function isWithinDays(date: Date | string | null, days: number): boolean {

  if (!date) return false;

  const d = new Date(date);

  const now = new Date();

  const future = new Date();

  future.setDate(now.getDate() + days);



  d.setHours(0, 0, 0, 0);

  now.setHours(0, 0, 0, 0);

  future.setHours(0, 0, 0, 0);



  return d >= now && d <= future;

}



export interface CalendarEvent {

  id: string; // Composite ID

  title: string;

  date: Date; // The due date

  type: 'control_review' | 'policy_renewal' | 'evidence_expiration' | 'risk_review' | 'treatment_due';

  status: string;

  priority: 'low' | 'medium' | 'high' | 'critical';

  description?: string;

  clientId: number;

  clientName?: string;

  url?: string;

  completed?: boolean;

}



export async function getOverdueItems(clientId?: number): Promise<CalendarEvent[]> {

  const db = await getDb();



  const now = new Date();

  const events: CalendarEvent[] = [];



  // 1. Overdue Control Reviews

  const overdueControls = await db.select({

    id: clientControls.id,

    clientControlId: clientControls.clientControlId,

    controlId: controls.controlId,

    controlName: controls.name,

    clientId: clientControls.clientId,

    clientName: clients.name,

    updatedAt: clientControls.updatedAt,

    frequency: controls.frequency,

    status: clientControls.status,

  })

    .from(clientControls)

    .innerJoin(controls, eq(clientControls.controlId, controls.id))

    .innerJoin(clients, eq(clientControls.clientId, clients.id))

    .where(and(

      clientId ? eq(clientControls.clientId, clientId) : undefined,

      ne(clientControls.status, 'implemented') // Only notify if not implemented? Or if review is overdue? 

      // Assuming 'review' means verifying it's still effective. For now, let's use implementation date logic if needed, 

      // but simpler: checks if it hasn't been updated in [Frequency] time.

    ));

  // (Logic for control review calculation omitted for brevity, focusing on explicit due dates first)



  // 2. Risk Reviews (Explicit Due Date)

  // We need to import riskAssessments from schema. Assuming it is exported as riskAssessments

  try {

    const overdueRisks = await db.select({

      id: schema.riskAssessments.id,

      assessmentId: schema.riskAssessments.assessmentId,

      threat: schema.riskAssessments.threatDescription,

      reviewDate: schema.riskAssessments.nextReviewDate,

      clientId: schema.riskAssessments.clientId,

      clientName: clients.name,

      status: schema.riskAssessments.status,

    })

      .from(schema.riskAssessments)

      .innerJoin(clients, eq(schema.riskAssessments.clientId, clients.id))

      .where(and(

        clientId ? eq(schema.riskAssessments.clientId, clientId) : undefined,

        lt(schema.riskAssessments.nextReviewDate, now), // Use Date object

        eq(schema.riskAssessments.status, 'approved')

      ));



    overdueRisks.forEach(r => {

      if (r.reviewDate) {

        events.push({

          id: `risk-review-${r.id}`,

          title: `Risk Review Overdue: ${r.assessmentId}`,

          date: new Date(r.reviewDate),

          type: 'risk_review',

          status: 'overdue',

          priority: 'high',

          description: `Risk review for "${r.threat?.substring(0, 50)}..." was due on ${new Date(r.reviewDate).toLocaleDateString()}.`,

          clientId: r.clientId!,

          clientName: r.clientName || 'Unknown Client',

          url: `/clients/${r.clientId}/risks`,

          completed: false

        });

      }

    });

  } catch (e) {

    logger.warn("Error fetching overdue risks:", e);

  }



  // 3. Risk Treatments (Explicit Due Date)

  try {

    const overdueTreatments = await db.select({

      id: schema.riskTreatments.id,

      strategy: schema.riskTreatments.strategy,

      dueDate: schema.riskTreatments.dueDate,

      riskId: schema.riskTreatments.riskAssessmentId,

      clientId: schema.riskAssessments.clientId,

      clientName: clients.name,

      status: schema.riskTreatments.status

    })

      .from(schema.riskTreatments)

      .innerJoin(schema.riskAssessments, eq(schema.riskTreatments.riskAssessmentId, schema.riskAssessments.id))

      .innerJoin(clients, eq(schema.riskAssessments.clientId, clients.id))

      .where(and(

        clientId ? eq(schema.riskAssessments.clientId, clientId) : undefined,

        lt(schema.riskTreatments.dueDate, now),

        ne(schema.riskTreatments.status, 'implemented'),

        ne(schema.riskTreatments.status, 'completed')

      ));



    overdueTreatments.forEach(t => {

      if (t.dueDate) {

        events.push({

          id: `treatment-${t.id}`,

          title: `Treatment Overdue: ${t.strategy?.substring(0, 30)}...`,

          date: new Date(t.dueDate),

          type: 'treatment_due',

          status: 'overdue',

          priority: 'high',

          description: `Treatment action is overdue.`,

          clientId: t.clientId!,

          clientName: t.clientName || '',

          url: `/clients/${t.clientId}/risks`,

          completed: false

        });

      }

    });

  } catch (e) {

    logger.warn("Error fetching overdue treatments:", e);

  }



  return events.sort((a, b) => a.date.getTime() - b.date.getTime());

}



export async function getUpcomingDeadlines(clientId?: number, days: number = 7): Promise<CalendarEvent[]> {

  const db = await getDb();



  const now = new Date();

  const future = new Date();

  future.setDate(now.getDate() + days);

  const events: CalendarEvent[] = [];



  // 1. Upcoming Risk Reviews

  try {

    const upcomingRisks = await db.select({

      id: schema.riskAssessments.id,

      assessmentId: schema.riskAssessments.assessmentId,

      threat: schema.riskAssessments.threatDescription,

      reviewDate: schema.riskAssessments.nextReviewDate,

      clientId: schema.riskAssessments.clientId,

      clientName: clients.name,

      status: schema.riskAssessments.status,

    })

      .from(schema.riskAssessments)

      .innerJoin(clients, eq(schema.riskAssessments.clientId, clients.id))

      .where(and(

        clientId ? eq(schema.riskAssessments.clientId, clientId) : undefined,

        gte(schema.riskAssessments.nextReviewDate, now),

        lte(schema.riskAssessments.nextReviewDate, future),

        eq(schema.riskAssessments.status, 'approved')

      ));



    upcomingRisks.forEach(r => {

      if (r.reviewDate) {

        events.push({

          id: `risk-review-${r.id}`,

          title: `Risk Review Due: ${r.assessmentId}`,

          date: new Date(r.reviewDate),

          type: 'risk_review',

          status: 'upcoming',

          priority: 'medium',

          description: `Risk review for "${r.threat?.substring(0, 50)}..." is due soon.`,

          clientId: r.clientId!,

          clientName: r.clientName || 'Unknown Client',

          url: `/clients/${r.clientId}/risks`,

          completed: false

        });

      }

    });

  } catch (e) {

    logger.warn("Error fetching upcoming risks:", e);

  }



  // 2. Upcoming Treatments

  try {

    const upcomingTreatments = await db.select({

      id: schema.riskTreatments.id,

      strategy: schema.riskTreatments.strategy,

      dueDate: schema.riskTreatments.dueDate,

      riskId: schema.riskTreatments.riskAssessmentId,

      clientId: schema.riskAssessments.clientId,

      clientName: clients.name,

      status: schema.riskTreatments.status

    })

      .from(schema.riskTreatments)

      .innerJoin(schema.riskAssessments, eq(schema.riskTreatments.riskAssessmentId, schema.riskAssessments.id))

      .innerJoin(clients, eq(schema.riskAssessments.clientId, clients.id))

      .where(and(

        clientId ? eq(schema.riskAssessments.clientId, clientId) : undefined,

        gte(schema.riskTreatments.dueDate, now),

        lte(schema.riskTreatments.dueDate, future),

        ne(schema.riskTreatments.status, 'implemented'),

        ne(schema.riskTreatments.status, 'completed')

      ));



    upcomingTreatments.forEach(t => {

      if (t.dueDate) {

        events.push({

          id: `treatment-${t.id}`,

          title: `Treatment Due: ${t.strategy?.substring(0, 30)}...`,

          date: new Date(t.dueDate),

          type: 'treatment_due',

          status: 'upcoming',

          priority: 'medium',

          description: `Treatment action is due soon.`,

          clientId: t.clientId!,

          clientName: t.clientName || '',

          url: `/clients/${t.clientId}/risks`,

          completed: false

        });

      }

    });

  } catch (e) {

    logger.warn("Error fetching upcoming treatments:", e);

  }



  return events.sort((a, b) => a.date.getTime() - b.date.getTime());

}



// ==================== VENDOR MANAGEMENT (TPRM) ====================



export async function createVendor(data: InsertVendor) {

  const db = await getDb();

  const [row] = await db.insert(vendors).values(data).returning();

  return row;

}



export async function getVendors(clientId: number, filters?: { status?: string, reviewStatus?: string }) {

  const db = await getDb();



  const query = db.select({

    vendor: vendors,

  })

    .from(vendors)

    .where(and(

      eq(vendors.clientId, clientId),

      filters?.status ? eq(vendors.status, filters.status) : undefined,

      filters?.reviewStatus ? eq(vendors.reviewStatus, filters.reviewStatus) : undefined

    ))

    .orderBy(desc(vendors.updatedAt));



  // Fetch users for mapping owners manually to avoid complex joins if not needed, 

  // or just return vendors and let frontend handle it.

  // The screenshot shows "Security Owner" which is a relaionship.

  // Let's do a simple join if possible, or just return raw for now and improve if frontend needs names.

  // Actually, left joining users for owner names is better.



  return query;

}



export async function getVendorById(id: number) {

  const db = await getDb();

  const [row] = await db.select().from(vendors).where(eq(vendors.id, id));

  return row || null;

}



export async function updateVendor(id: number, data: Partial<InsertVendor>) {

  const db = await getDb();

  await db.update(vendors).set({ ...data, updatedAt: new Date() }).where(eq(vendors.id, id));

}



export async function deleteVendor(id: number) {

  const db = await getDb();

  await db.delete(vendors).where(eq(vendors.id, id));

}



export async function getVendorStats(clientId: number) {

  const db = await getDb();



  // Aggregate stats

  const [total] = await db.select({ count: sql<number>`count(*)` }).from(vendors).where(eq(vendors.clientId, clientId));



  // By Risk

  const riskCounts = await db.select({

    risk: vendors.criticality,

    count: sql<number>`count(*)`

  })

    .from(vendors)

    .where(eq(vendors.clientId, clientId))

    .groupBy(vendors.criticality);



  // Needs Review

  const [needsReview] = await db.select({ count: sql<number>`count(*)` })

    .from(vendors)

    .where(and(

      eq(vendors.clientId, clientId),

      eq(vendors.reviewStatus, 'needs_review')

    ));



  // Analysis In Progress (security reviews) - Count Active Assessments

  const [inProgress] = await db.select({ count: sql<number>`count(*)` })

    .from(vendorAssessments)

    .where(and(

      eq(vendorAssessments.clientId, clientId),

      ne(vendorAssessments.status, 'Completed')

    ));



  return {

    totalVendors: total?.count || 0,

    needsReview: needsReview?.count || 0,

    inProgress: inProgress?.count || 0,

    riskBreakdown: riskCounts.reduce((acc, curr) => {

      acc[curr.risk || 'Unscored'] = curr.count;

      return acc;

    }, {} as Record<string, number>)

  };

}



// --- Business Continuity Functions ---



export async function createBcpProject(data: InsertBcpProject) {

  const dbConn = await getDb();

  const [project] = await dbConn.insert(bcpProjects).values(data).returning();

  return project;

}



export async function getBcpProjects(clientId: number) {

  const dbConn = await getDb();

  return await dbConn.select().from(bcpProjects).where(eq(bcpProjects.clientId, clientId)).orderBy(desc(bcpProjects.createdAt));

}



export async function createBusinessProcess(data: InsertBusinessProcess) {

  const dbConn = await getDb();

  const [process] = await dbConn.insert(businessProcesses).values(data).returning();

  return process;

}



export async function updateBusinessProcess(id: number, data: Partial<InsertBusinessProcess>) {

  const dbConn = await getDb();

  const [updated] = await dbConn.update(businessProcesses).set(data).where(eq(businessProcesses.id, id)).returning();

  return updated;

}



export async function deleteBusinessProcess(id: number) {
  const dbConn = await getDb();
  // Delete dependencies first
  await dbConn.delete(processDependencies).where(eq(processDependencies.processId, id));
  await dbConn.delete(businessProcesses).where(eq(businessProcesses.id, id));
}



export async function getBusinessProcesses(clientId: number) {
  const dbConn = await getDb();
  return await dbConn.select().from(businessProcesses).where(eq(businessProcesses.clientId, clientId)).orderBy(desc(businessProcesses.createdAt));
}



export async function addProcessDependency(data: InsertProcessDependency) {

  const dbConn = await getDb();

  const [dependency] = await dbConn.insert(processDependencies).values(data).returning();

  return dependency;

}



export async function removeProcessDependency(id: number) {

  const dbConn = await getDb();

  return await dbConn.delete(processDependencies).where(eq(processDependencies.id, id));

}



export async function getProcessDependencies(processId: number) {

  const dbConn = await getDb();

  return await dbConn.select().from(processDependencies).where(eq(processDependencies.processId, processId));

}



// --- BIA Functions ---



export async function createBIA(data: InsertBusinessImpactAnalysis) {

  const dbConn = await getDb();

  const [bia] = await dbConn.insert(businessImpactAnalyses).values(data).returning();

  return bia;

}



export async function getBIAs(clientId: number) {

  const dbConn = await getDb();

  return await dbConn.select({

    id: businessImpactAnalyses.id,

    title: businessImpactAnalyses.title,

    status: businessImpactAnalyses.status,

    processId: businessImpactAnalyses.processId,

    processName: businessProcesses.name,

    createdAt: businessImpactAnalyses.createdAt,

  })

    .from(businessImpactAnalyses)

    .leftJoin(businessProcesses, eq(businessImpactAnalyses.processId, businessProcesses.id))

    .where(eq(businessImpactAnalyses.clientId, clientId))

    .orderBy(desc(businessImpactAnalyses.createdAt));

}



export async function getBIAById(id: number) {

  const dbConn = await getDb();

  const results = await dbConn.select({

    bia: businessImpactAnalyses,

    process: businessProcesses,

  })

    .from(businessImpactAnalyses)

    .leftJoin(businessProcesses, eq(businessImpactAnalyses.processId, businessProcesses.id))

    .where(eq(businessImpactAnalyses.id, id));



  if (results.length === 0) return null;



  const questions = await dbConn.select().from(biaQuestionnaires).where(eq(biaQuestionnaires.biaId, id));



  return {

    ...results[0].bia,

    process: results[0].process,

    questions,

  };

}



export async function updateBIAStatus(id: number, status: string) {

  const dbConn = await getDb();

  return await dbConn.update(businessImpactAnalyses).set({ status, updatedAt: new Date() }).where(eq(businessImpactAnalyses.id, id));

}



export async function updateBIAQuestionResponse(id: number, response: string, notes?: string) {

  const dbConn = await getDb();

  return await dbConn.update(biaQuestionnaires).set({ response, notes, updatedAt: new Date() }).where(eq(biaQuestionnaires.id, id));

}





// --- BIA Phase 2 Functions ---



export async function createImpactAssessment(data: InsertImpactAssessment) {

  const dbConn = await getDb();

  return await dbConn.insert(impactAssessments).values(data).returning();

}



export async function getImpactAssessments(biaId: number) {

  const dbConn = await getDb();

  return await dbConn.select().from(impactAssessments).where(eq(impactAssessments.biaId, biaId));

}



export async function createFinancialImpact(data: InsertFinancialImpact) {

  const dbConn = await getDb();

  return await dbConn.insert(financialImpacts).values(data).returning();

}



export async function getFinancialImpacts(biaId: number) {

  const dbConn = await getDb();

  return await dbConn.select().from(financialImpacts).where(eq(financialImpacts.biaId, biaId));

}



export async function saveRecoveryObjective(data: InsertRecoveryObjective) {

  const dbConn = await getDb();

  // Check if exists

  const existing = await dbConn.select().from(recoveryObjectives).where(and(

    eq(recoveryObjectives.biaId, data.biaId),

    eq(recoveryObjectives.activity, data.activity)

  ));



  if (existing.length > 0) {

    return await dbConn.update(recoveryObjectives)

      .set({ ...data, createdAt: undefined }) // Don't update createdAt

      .where(eq(recoveryObjectives.id, existing[0].id))

      .returning();

  } else {

    return await dbConn.insert(recoveryObjectives).values(data).returning();

  }

}



export async function getRecoveryObjectives(biaId: number) {

  const dbConn = await getDb();

  return await dbConn.select().from(recoveryObjectives).where(eq(recoveryObjectives.biaId, biaId));

}



export async function addStakeholder(data: InsertBcpStakeholder) {

  const dbConn = await getDb();

  return await dbConn.insert(bcpStakeholders).values(data).returning();

}



export async function getStakeholders(projectId?: number, processId?: number) {

  const dbConn = await getDb();

  let query = dbConn.select({

    stakeholder: bcpStakeholders,

    user: {

      id: users.id,

      name: users.name,

      email: users.email,

      role: users.role

    }

  })

    .from(bcpStakeholders)

    .leftJoin(users, eq(bcpStakeholders.userId, users.id));



  if (projectId) {

    query = query.where(eq(bcpStakeholders.projectId, projectId));

  } else if (processId) {

    query = query.where(eq(bcpStakeholders.processId, processId));

  }



  return await query;

}



// --- Disruptive Scenarios ---



export async function createDisruptiveScenario(data: InsertDisruptiveScenario) {

  const dbConn = await getDb();

  return await dbConn.insert(disruptiveScenarios).values(data).returning();

}



export async function getDisruptiveScenarios(clientId: number) {

  const dbConn = await getDb();

  return await dbConn.select().from(disruptiveScenarios).where(eq(disruptiveScenarios.clientId, clientId)).orderBy(desc(disruptiveScenarios.createdAt));

}



export async function deleteDisruptiveScenario(id: number) {

  const dbConn = await getDb();

  return await dbConn.delete(disruptiveScenarios).where(eq(disruptiveScenarios.id, id));

}



export async function updateDisruptiveScenario(id: number, data: Partial<InsertDisruptiveScenario>) {
  const dbConn = await getDb();
  return await dbConn.update(disruptiveScenarios).set(data).where(eq(disruptiveScenarios.id, id)).returning();
}








// ==================== MISSING HELPERS ADDED BY AGENT ====================

export async function getBcpProjectById(id: number) {
  const dbConn = await getDb();
  const result = await dbConn.select().from(bcpProjects).where(eq(bcpProjects.id, id));
  return result[0];
}

export async function updateBcpProject(id: number, data: any) {
  const dbConn = await getDb();
  const [updated] = await dbConn.update(bcpProjects).set(data).where(eq(bcpProjects.id, id)).returning();
  return updated;
}

export async function getBusinessProcessById(id: number) {
  const dbConn = await getDb();
  const result = await dbConn.select().from(businessProcesses).where(eq(businessProcesses.id, id));
  return result[0];
}

export async function updateBIAQuestionFull(id: number, response: string, notes?: string, impactLevel?: string) {
  const db = await getDb();
  await db.update(biaQuestionnaires)
    .set({
      response,
      notes,
      impactLevel: impactLevel as any
    })
    .where(eq(biaQuestionnaires.id, id));
}




// ==========================================
// Comprehensive BIA/BCP Helpers
// ==========================================

// Seasonal Events
export async function getBiaSeasonalEvents(biaId: number) {
  const dbConn = await getDb();
  return await dbConn.select().from(biaSeasonalEvents).where(eq(biaSeasonalEvents.biaId, biaId));
}
export async function createBiaSeasonalEvent(data: any) {
  const dbConn = await getDb();
  return await dbConn.insert(biaSeasonalEvents).values(data).returning();
}
export async function deleteBiaSeasonalEvent(id: number) {
  const dbConn = await getDb();
  return await dbConn.delete(biaSeasonalEvents).where(eq(biaSeasonalEvents.id, id));
}

// Vital Records
export async function getBiaVitalRecords(biaId: number) {
  const dbConn = await getDb();
  return await dbConn.select().from(biaVitalRecords).where(eq(biaVitalRecords.biaId, biaId));
}
export async function createBiaVitalRecord(data: any) {
  const dbConn = await getDb();
  return await dbConn.insert(biaVitalRecords).values(data).returning();
}
export async function deleteBiaVitalRecord(id: number) {
  const dbConn = await getDb();
  return await dbConn.delete(biaVitalRecords).where(eq(biaVitalRecords.id, id));
}

// Communication Channels
export async function getPlanCommunicationChannels(planId: number) {
  const dbConn = await getDb();
  return await dbConn.select().from(bcPlanCommunicationChannels).where(eq(bcPlanCommunicationChannels.planId, planId));
}
export async function createPlanCommunicationChannel(data: any) {
  const dbConn = await getDb();
  return await dbConn.insert(bcPlanCommunicationChannels).values(data).returning();
}
export async function deletePlanCommunicationChannel(id: number) {
  const dbConn = await getDb();
  return await dbConn.delete(bcPlanCommunicationChannels).where(eq(bcPlanCommunicationChannels.id, id));
}

// Logistics
export async function getPlanLogistics(planId: number) {
  const dbConn = await getDb();
  return await dbConn.select().from(bcPlanLogistics).where(eq(bcPlanLogistics.planId, planId));
}
export async function createPlanLogistic(data: any) {
  const dbConn = await getDb();
  return await dbConn.insert(bcPlanLogistics).values(data).returning();
}
export async function deletePlanLogistic(id: number) {
  const dbConn = await getDb();
  return await dbConn.delete(bcPlanLogistics).where(eq(bcPlanLogistics.id, id));
}

// ==========================================
// BC Program Governance Helpers
// ==========================================

export async function getBcProgram(clientId: number) {
  const dbConn = await getDb();
  const program = await dbConn.select().from(bcPrograms)
    .where(eq(bcPrograms.clientId, clientId))
    .limit(1);
  return program[0] || null;
}

export async function createBcProgram(data: any) {
  const dbConn = await getDb();
  return await dbConn.insert(bcPrograms).values(data).returning();
}

export async function updateBcProgram(id: number, data: any) {
  const dbConn = await getDb();
  return await dbConn.update(bcPrograms)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(bcPrograms.id, id))
    .returning();
}

export async function getCommitteeMembers(programId: number) {
  const dbConn = await getDb();
  return await dbConn.select({
    id: bcCommitteeMembers.id,
    programId: bcCommitteeMembers.programId,
    userId: bcCommitteeMembers.userId,
    role: bcCommitteeMembers.role,
    responsibilities: bcCommitteeMembers.responsibilities,
    assignedAt: bcCommitteeMembers.assignedAt,
    user: {
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    }
  })
    .from(bcCommitteeMembers)
    .leftJoin(users, eq(bcCommitteeMembers.userId, users.id))
    .where(eq(bcCommitteeMembers.programId, programId));
}

export async function addCommitteeMember(data: any) {
  const dbConn = await getDb();
  return await dbConn.insert(bcCommitteeMembers).values(data).returning();
}

export async function removeCommitteeMember(id: number) {
  const dbConn = await getDb();
  return await dbConn.delete(bcCommitteeMembers).where(eq(bcCommitteeMembers.id, id)).returning();
}

// ==========================================
// BCP Sections (Intro, Scope, Playbooks content)
// ==========================================
export async function getPlanSections(planId: number) {
  const dbConn = await getDb();
  return await dbConn.select().from(bcPlanSections).where(eq(bcPlanSections.planId, planId)).orderBy(bcPlanSections.order);
}

export async function upsertPlanSection(data: InsertBcPlanSection) {
  const dbConn = await getDb();
  // Check if exists
  const existing = await dbConn.select().from(bcPlanSections).where(and(eq(bcPlanSections.planId, data.planId), eq(bcPlanSections.sectionKey, data.sectionKey)));
  if (existing.length > 0) {
    return await dbConn.update(bcPlanSections).set({ content: data.content, updatedAt: new Date() }).where(eq(bcPlanSections.id, existing[0].id)).returning();
  } else {
    return await dbConn.insert(bcPlanSections).values(data).returning();
  }
}

// ==========================================
// BCP Appendices
// ==========================================
export async function getPlanAppendices(planId: number) {
  const dbConn = await getDb();
  return await dbConn.select().from(bcPlanAppendices).where(eq(bcPlanAppendices.planId, planId));
}

export async function addPlanAppendix(data: InsertBcPlanAppendix) {
  const dbConn = await getDb();
  return await dbConn.insert(bcPlanAppendices).values(data).returning();
}

export async function removePlanAppendix(id: number) {
  const dbConn = await getDb();
  return await dbConn.delete(bcPlanAppendices).where(eq(bcPlanAppendices.id, id)).returning();
}

// ==========================================
// BCP Training
// ==========================================
export async function getTrainingRecords(clientId: number) {
  const dbConn = await getDb();
  return await dbConn.select({
    id: bcTrainingRecords.id,
    userId: bcTrainingRecords.userId,
    trainingType: bcTrainingRecords.trainingType,
    completionDate: bcTrainingRecords.completionDate,
    expiryDate: bcTrainingRecords.expiryDate,
    status: bcTrainingRecords.status,
    user: users
  })
    .from(bcTrainingRecords)
    .leftJoin(users, eq(bcTrainingRecords.userId, users.id))
    .where(eq(bcTrainingRecords.clientId, clientId));
}

export async function addTrainingRecord(data: InsertBcTrainingRecord) {
  const dbConn = await getDb();
  return await dbConn.insert(bcTrainingRecords).values(data).returning();
}



// ==========================================
// BCP Readiness & Wizard Helpers
// ==========================================

export async function getBIAByProcessId(processId: number) {
  const dbConn = await getDb();
  const [bia] = await dbConn.select().from(businessImpactAnalyses).where(eq(businessImpactAnalyses.processId, processId)).limit(1);
  return bia || null;
}
