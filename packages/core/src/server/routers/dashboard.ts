import { z } from "zod";
import * as db from "../../db";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, desc, count, and, sql, or, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const createDashboardRouter = (t: any, adminProcedure: any, isAuthed: any) => {
  return t.router({
    stats: isAuthed.query(async () => {
      const dbConn = await db.getDb();
      const [clientsCount] = await dbConn.select({ value: count() }).from(schema.clients);
      const [controlsCount] = await dbConn.select({ value: count() }).from(schema.clientControls);
      const [policiesCount] = await dbConn.select({ value: count() }).from(schema.clientPolicies);
      const [evidenceCount] = await dbConn.select({ value: count() }).from(schema.evidence);

      return {
        totalClients: Number(clientsCount.value),
        totalControls: Number(controlsCount.value),
        totalPolicies: Number(policiesCount.value),
        totalEvidence: Number(evidenceCount.value),
      };
    }),

    enhanced: isAuthed
      .input(z.any())
      .query(async ({ ctx, input }: any) => {
        const dbConn = await db.getDb();
        // Safely extract framework from input
        const frameworkFilter = input && typeof input === 'object' && 'framework' in input
          ? String(input.framework)
          : undefined;

        // Safely extract clientId from input
        const clientIdFilter = input && typeof input === 'object' && 'clientId' in input && input.clientId
          ? Number(input.clientId)
          : undefined;

        if (!ctx?.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
        }

        const isGlobalAdmin = ctx.user.role === 'admin' || ctx.user.role === 'owner' || ctx.user.role === 'super_admin';

        const userClientIds = isGlobalAdmin ? null : (await dbConn.select({ id: schema.userClients.clientId })
          .from(schema.userClients)
          .where(eq(schema.userClients.userId, ctx.user.id))).map((c: any) => c.id);

        // Determine effective client IDs to filter by
        let effectiveClientIds: number[] | null = null;

        if (clientIdFilter) {
          // If filtering by specific client
          if (isGlobalAdmin) {
            effectiveClientIds = [clientIdFilter];
          } else {
            // Ensure user has access to this client
            if (userClientIds?.includes(clientIdFilter)) {
              effectiveClientIds = [clientIdFilter];
            } else {
              // User trying to access client they don't own -> return empty
              effectiveClientIds = [];
            }
          }
        } else {
          // No specific filter
          effectiveClientIds = isGlobalAdmin ? null : (userClientIds || []);
        }

        if (effectiveClientIds !== null && effectiveClientIds.length === 0) {
          const [userData] = await dbConn.select({ maxClients: schema.users.maxClients })
            .from(schema.users)
            .where(eq(schema.users.id, ctx.user.id))
            .limit(1);

          return {
            overview: {
              totalClients: 0,
              totalControls: 0,
              totalPolicies: 0,
              totalEvidence: 0,
              totalLLMProviders: 0,
              totalRisks: 0,
              highRisks: 0,
              maxClients: userData?.maxClients || 2,
              ownedClientsCount: 0
            },
            controlsByStatus: { implemented: 0, inProgress: 0, notStarted: 0, notApplicable: 0 },
            policiesByStatus: { approved: 0, review: 0, draft: 0, archived: 0 },
            evidenceByStatus: { verified: 0, collected: 0, pending: 0, expired: 0, notApplicable: 0 },
            controlsByFramework: {},
            clientsOverview: [],
            recentActivity: []
          };
        }

        // 1. Overview Counts
        const clientsCountQuery = dbConn.select({ value: count() }).from(schema.clients);
        if (effectiveClientIds !== null) clientsCountQuery.where(inArray(schema.clients.id, effectiveClientIds));
        const [clientsCount] = await clientsCountQuery;

        // CHANGED: Count Master Controls (Global Library) instead of Client Controls
        const controlsQuery = dbConn.select({ value: count() }).from(schema.controls);
        if (frameworkFilter) {
          controlsQuery.where(eq(schema.controls.framework, frameworkFilter));
        }
        // Removed client filtering to show full Master Control library
        const [controlsCount] = await controlsQuery;

        // CHANGED: Count Master Policies (Templates) instead of Client Policies
        const policiesQuery = dbConn.select({ value: count() }).from(schema.policyTemplates);
        // Removed framework and client filtering to show full Policy Template library
        const [policiesCount] = await policiesQuery;

        const evidenceQuery = dbConn.select({ value: count() }).from(schema.evidence);

        const evidenceConditions = [];
        if (frameworkFilter) {
          evidenceQuery.innerJoin(schema.clientControls, eq(schema.evidence.clientControlId, schema.clientControls.id))
            .innerJoin(schema.controls, eq(schema.clientControls.controlId, schema.controls.id));
          evidenceConditions.push(eq(schema.controls.framework, frameworkFilter));
        }
        if (effectiveClientIds !== null) {
          evidenceConditions.push(inArray(schema.evidence.clientId, effectiveClientIds));
        }
        if (evidenceConditions.length > 0) {
          evidenceQuery.where(and(...evidenceConditions));
        }
        const [evidenceCount] = await evidenceQuery;

        const [llmCount] = await dbConn.select({ value: count() }).from(schema.llmProviders);

        // 2. Status Aggregations
        const controlsByStatusQuery = dbConn.select({
          status: schema.clientControls.status,
          value: count()
        })
          .from(schema.clientControls);

        const controlStatusConditions = [];
        if (frameworkFilter) {
          controlsByStatusQuery.innerJoin(schema.controls, eq(schema.clientControls.controlId, schema.controls.id));
          controlStatusConditions.push(eq(schema.controls.framework, frameworkFilter));
        }
        if (effectiveClientIds !== null) {
          controlStatusConditions.push(inArray(schema.clientControls.clientId, effectiveClientIds));
        }
        if (controlStatusConditions.length > 0) {
          controlsByStatusQuery.where(and(...controlStatusConditions));
        }

        const controlsByStatusResults = await controlsByStatusQuery.groupBy(schema.clientControls.status);
        const controlsByStatus: Record<string, number> = {
          implemented: 0,
          inProgress: 0,
          notStarted: 0,
          notApplicable: 0
        };
        controlsByStatusResults.forEach((r: any) => {
          if (r.status === 'implemented') controlsByStatus.implemented = Number(r.value);
          else if (r.status === 'in_progress') controlsByStatus.inProgress = Number(r.value);
          else if (r.status === 'not_implemented') controlsByStatus.notStarted = Number(r.value);
          else if (r.status === 'not_applicable') controlsByStatus.notApplicable = Number(r.value);
        });

        const policiesByStatusQuery = dbConn.select({
          status: schema.clientPolicies.status,
          value: count()
        })
          .from(schema.clientPolicies);

        const policyStatusConditions = [];
        if (frameworkFilter) {
          policiesByStatusQuery.innerJoin(schema.controlPolicyMappings, eq(schema.clientPolicies.id, schema.controlPolicyMappings.clientPolicyId))
            .innerJoin(schema.clientControls, eq(schema.controlPolicyMappings.clientControlId, schema.clientControls.id))
            .innerJoin(schema.controls, eq(schema.clientControls.controlId, schema.controls.id));
          policyStatusConditions.push(eq(schema.controls.framework, frameworkFilter));
        }
        if (effectiveClientIds !== null) {
          policyStatusConditions.push(inArray(schema.clientPolicies.clientId, effectiveClientIds));
        }
        if (policyStatusConditions.length > 0) {
          policiesByStatusQuery.where(and(...policyStatusConditions));
        }

        const policiesByStatusResults = await policiesByStatusQuery.groupBy(schema.clientPolicies.status);
        const policiesByStatus: Record<string, number> = {
          approved: 0,
          review: 0,
          draft: 0,
          archived: 0
        };
        policiesByStatusResults.forEach((r: any) => {
          if (r.status === 'approved') policiesByStatus.approved = Number(r.value);
          else if (r.status === 'review') policiesByStatus.review = Number(r.value);
          else if (r.status === 'draft') policiesByStatus.draft = Number(r.value);
          else if (r.status === 'archived') policiesByStatus.archived = Number(r.value);
        });

        const evidenceByStatusQuery = dbConn.select({
          status: schema.evidence.status,
          value: count()
        })
          .from(schema.evidence);

        const evidenceStatusConditions = [];
        if (frameworkFilter) {
          evidenceByStatusQuery.innerJoin(schema.clientControls, eq(schema.evidence.clientControlId, schema.clientControls.id))
            .innerJoin(schema.controls, eq(schema.clientControls.controlId, schema.controls.id));
          evidenceStatusConditions.push(eq(schema.controls.framework, frameworkFilter));
        }
        if (effectiveClientIds !== null) {
          evidenceStatusConditions.push(inArray(schema.evidence.clientId, effectiveClientIds));
        }
        if (evidenceStatusConditions.length > 0) {
          evidenceByStatusQuery.where(and(...evidenceStatusConditions));
        }

        const evidenceByStatusResults = await evidenceByStatusQuery.groupBy(schema.evidence.status);
        const evidenceByStatus: Record<string, number> = {
          verified: 0,
          collected: 0,
          pending: 0,
          expired: 0,
          notApplicable: 0
        };
        evidenceByStatusResults.forEach((r: any) => {
          if (r.status === 'verified') evidenceByStatus.verified = Number(r.value);
          else if (r.status === 'collected') evidenceByStatus.collected = Number(r.value);
          else if (r.status === 'pending') evidenceByStatus.pending = Number(r.value);
          else if (r.status === 'expired') evidenceByStatus.expired = Number(r.value);
        });

        // 3. Frameworks
        const frameworksQuery = dbConn.select({
          framework: schema.controls.framework,
          count: count()
        })
          .from(schema.controls);

        // Removed client filtering to show global framework distribution

        const frameworks = await frameworksQuery.groupBy(schema.controls.framework);
        const controlsByFramework: Record<string, number> = {};
        frameworks.forEach((f: { framework: string | null; count: number }) => {
          if (f.framework) controlsByFramework[f.framework] = Number(f.count);
        });

        // 4. Clients Overview - OPTIMIZED to avoid N+1 queries
        const allClientsQuery = dbConn.select({ id: schema.clients.id, name: schema.clients.name }).from(schema.clients);
        if (effectiveClientIds !== null) {
          allClientsQuery.where(inArray(schema.clients.id, effectiveClientIds));
        }
        const allClients = await allClientsQuery;

        // Fetch aggregation data for ALL clients in single queries using GROUP BY
        const controlsOverviewQuery = dbConn.select({
          clientId: schema.clientControls.clientId,
          count: count()
        })
          .from(schema.clientControls);

        if (frameworkFilter) {
          controlsOverviewQuery.innerJoin(schema.controls, eq(schema.clientControls.controlId, schema.controls.id))
            .where(eq(schema.controls.framework, frameworkFilter));
        }
        if (effectiveClientIds !== null) {
          controlsOverviewQuery.where(inArray(schema.clientControls.clientId, effectiveClientIds));
        }
        const controlsCounts = await controlsOverviewQuery.groupBy(schema.clientControls.clientId);
        const controlsMap = new Map<number, number>(controlsCounts.map((r: any) => [r.clientId, Number(r.count)]));

        // Implemented controls
        const implementedOverviewQuery = dbConn.select({
          clientId: schema.clientControls.clientId,
          count: count()
        })
          .from(schema.clientControls)
          .where(eq(schema.clientControls.status, 'implemented'));

        if (frameworkFilter) {
          implementedOverviewQuery.innerJoin(schema.controls, eq(schema.clientControls.controlId, schema.controls.id))
            .where(and(eq(schema.clientControls.status, 'implemented'), eq(schema.controls.framework, frameworkFilter)));
        }
        if (effectiveClientIds !== null) {
          implementedOverviewQuery.where(inArray(schema.clientControls.clientId, effectiveClientIds));
        }
        const implementedCounts = await implementedOverviewQuery.groupBy(schema.clientControls.clientId);
        const implementedMap = new Map<number, number>(implementedCounts.map((r: any) => [r.clientId, Number(r.count)]));

        // Policies count
        const policiesOverviewQuery = dbConn.select({
          clientId: schema.clientPolicies.clientId,
          count: count()
        })
          .from(schema.clientPolicies);
        if (effectiveClientIds !== null) {
          policiesOverviewQuery.where(inArray(schema.clientPolicies.clientId, effectiveClientIds));
        }
        const policiesCounts = await policiesOverviewQuery.groupBy(schema.clientPolicies.clientId);
        const policiesMap = new Map<number, number>(policiesCounts.map((r: any) => [r.clientId, Number(r.count)]));

        // Evidence count
        const evidenceOverviewQuery = dbConn.select({
          clientId: schema.evidence.clientId,
          count: count()
        })
          .from(schema.evidence);
        if (effectiveClientIds !== null) {
          evidenceOverviewQuery.where(inArray(schema.evidence.clientId, effectiveClientIds));
        }
        const evidenceCounts = await evidenceOverviewQuery.groupBy(schema.evidence.clientId);
        const evidenceMap = new Map<number, number>(evidenceCounts.map((r: any) => [r.clientId, Number(r.count)]));

        // Map data to clients
        const clientsOverview = allClients.map((c: { id: number; name: string }) => {
          const totalControls = controlsMap.get(c.id) || 0;
          const implemented = implementedMap.get(c.id) || 0;
          const policiesCount = policiesMap.get(c.id) || 0;
          const evidenceCount = evidenceMap.get(c.id) || 0;

          const percentage = totalControls > 0 ? Math.round((implemented / totalControls) * 100) : 0;

          return {
            id: c.id,
            name: c.name,
            compliancePercentage: percentage,
            controlsCount: totalControls,
            policiesCount: policiesCount,
            evidenceCount: evidenceCount
          };
        });

        // 5. Recent Activity
        const activityQuery = dbConn.select()
          .from(schema.auditLogs);

        if (effectiveClientIds !== null) {
          activityQuery.where(inArray(schema.auditLogs.clientId, effectiveClientIds));
        }

        const recentActivity = await activityQuery.orderBy(desc(schema.auditLogs.createdAt))
          .limit(5);

        const formattedActivity = recentActivity.map((a: typeof schema.auditLogs.$inferSelect) => ({
          type: a.entityType as 'control' | 'policy' | 'evidence',
          name: `${a.action} ${a.entityType}`,
          updatedAt: a.createdAt
        }));

        // 6. Risk Statistics (Global for now, optional framework filter if risks linked to controls)
        const risksCountQuery = dbConn.select({ value: count() }).from(schema.riskAssessments);
        if (effectiveClientIds !== null && effectiveClientIds.length > 0) {
          risksCountQuery.where(inArray(schema.riskAssessments.clientId, effectiveClientIds));
        }
        const [totalRisksCount] = await risksCountQuery;

        const highRisksQuery = dbConn.select({ count: count() })
          .from(schema.riskAssessments)
          .where(and(
            or(
              eq(schema.riskAssessments.residualRisk, 'High'),
              eq(schema.riskAssessments.residualRisk, 'Critical')
            ),
            effectiveClientIds !== null && effectiveClientIds.length > 0 ? inArray(schema.riskAssessments.clientId, effectiveClientIds) : undefined
          ));
        const [highRisksCount] = await highRisksQuery;

        // 7. Organization Limits (for Dashboard display)
        const [userData] = await dbConn.select({ maxClients: schema.users.maxClients })
          .from(schema.users)
          .where(eq(schema.users.id, ctx.user.id))
          .limit(1);

        const [ownedCountResult] = await dbConn.select({ count: count() })
          .from(schema.userClients)
          .where(and(
            eq(schema.userClients.userId, ctx.user.id),
            eq(schema.userClients.role, 'owner')
          ));

        return {
          overview: {
            totalClients: Number(clientsCount.value),
            totalControls: Number(controlsCount.value),
            totalPolicies: Number(policiesCount.value),
            totalEvidence: Number(evidenceCount.value),
            totalLLMProviders: Number(llmCount.value),
            totalRisks: Number(totalRisksCount.value),
            highRisks: Number(highRisksCount.count || 0),
            maxClients: userData?.maxClients || 2,
            ownedClientsCount: Number(ownedCountResult?.count || 0)
          },
          controlsByStatus,
          policiesByStatus,
          evidenceByStatus,
          controlsByFramework,
          clientsOverview,
          recentActivity: formattedActivity
        };
      }),

    complianceScores: isAuthed.query(async () => {
      // Mock data for compliance trend over the last 6 months
      const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
      const currentYear = new Date().getFullYear();

      return months.map((month, i) => ({
        date: month,
        score: 20 + (i * 12) + Math.round(Math.random() * 5), // Improving trend
        target: 80
      }));
    }),

    getInsights: isAuthed
      .input(z.any())
      .query(async ({ ctx, input }: any) => {
        const dbConn = await db.getDb();

        // Safely extract clientId from input
        const clientIdFilter = input && typeof input === 'object' && 'clientId' in input && input.clientId
          ? Number(input.clientId)
          : undefined;

        const isGlobalAdmin = ctx.user.role === 'admin' || ctx.user.role === 'owner';

        const userClientIds = isGlobalAdmin ? null : (await dbConn.select({ id: schema.userClients.clientId })
          .from(schema.userClients)
          .where(eq(schema.userClients.userId, ctx.user.id))).map((c: any) => c.id);

        // Determine effective client IDs to filter by
        let effectiveClientIds: number[] | null = null;

        if (clientIdFilter) {
          if (isGlobalAdmin) {
            effectiveClientIds = [clientIdFilter];
          } else {
            if (userClientIds?.includes(clientIdFilter)) {
              effectiveClientIds = [clientIdFilter];
            } else {
              effectiveClientIds = [];
            }
          }
        } else {
          effectiveClientIds = isGlobalAdmin ? null : (userClientIds || []);
        }

        if (effectiveClientIds !== null && effectiveClientIds.length === 0) {
          return [];
        }

        // Fetch some statistics to generate realistic insights
        const overdueVendorsQuery = dbConn.select({ value: count() })
          .from(schema.vendorAssessments)
          .innerJoin(schema.vendors, eq(schema.vendorAssessments.vendorId, schema.vendors.id))
          .where(and(
            sql`${schema.vendorAssessments.dueDate} < CURRENT_DATE`,
            sql`${schema.vendorAssessments.status} != 'completed'`,
            effectiveClientIds && effectiveClientIds.length > 0 ? inArray(schema.vendorAssessments.clientId, effectiveClientIds) : undefined
          ));
        const overdueVendorsRaw = (await overdueVendorsQuery)[0].value;
        const overdueVendors = overdueVendorsRaw ? Number(overdueVendorsRaw) : 0;

        const pendingEvidenceQuery = dbConn.select({ value: count() }).from(schema.evidence).where(and(
          eq(schema.evidence.status, 'pending'),
          effectiveClientIds !== null && effectiveClientIds.length > 0 ? inArray(schema.evidence.clientId, effectiveClientIds) : undefined
        ));
        const pendingEvidenceRaw = (await pendingEvidenceQuery)[0].value;
        const pendingEvidence = pendingEvidenceRaw ? Number(pendingEvidenceRaw) : 0;

        const expiredEvidenceQuery = dbConn.select({ value: count() }).from(schema.evidence).where(and(
          eq(schema.evidence.status, 'expired'),
          effectiveClientIds !== null && effectiveClientIds.length > 0 ? inArray(schema.evidence.clientId, effectiveClientIds) : undefined
        ));
        const expiredEvidenceRaw = (await expiredEvidenceQuery)[0].value;
        const expiredEvidence = expiredEvidenceRaw ? Number(expiredEvidenceRaw) : 0;

        // Check for Unmitigated Critical Risks (Live Wire)
        const unmitigatedRisksQuery = dbConn.select({ count: count() })
          .from(schema.riskAssessments)
          .where(and(
            // High or Critical Residual Risk
            or(
              eq(schema.riskAssessments.residualRisk, 'Critical'),
              eq(schema.riskAssessments.residualRisk, 'High')
            ),
            effectiveClientIds !== null && effectiveClientIds.length > 0 ? inArray(schema.riskAssessments.clientId, effectiveClientIds) : undefined
          ));

        const [unmitigatedCount] = await unmitigatedRisksQuery;
        const unmitigated = Number(unmitigatedCount?.count || 0);

        const insights = [];

        if (unmitigated > 0) {
          insights.push({
            id: 'critical-risks',
            type: 'critical',
            title: `${unmitigated} Unmitigated Critical Risks`,
            description: 'Risks remain high despite treatments. Immediate control implementation required.',
            action: 'View Risk Register',
            link: '/risk-register/critical'
          });
        }

        if (overdueVendors > 0) {
          insights.push({
            id: 'overdue-vendors',
            type: 'critical',
            title: `${overdueVendors} Overdue Vendor Assessments`,
            description: 'High risk detected in supply chain. Remediation required immediately.',
            action: 'View Assessments',
            link: '/vendors/assessments/overdue'
          });
        }

        if (expiredEvidence > 0) {
          insights.push({
            id: 'expired-evidence',
            type: 'warning',
            title: `${expiredEvidence} Expired Evidence Items`,
            description: 'Previously verified items are no longer valid. Re-certification needed.',
            action: 'Renew Evidence',
            link: '/evidence'
          });
        }

        if (pendingEvidence > 5) {
          insights.push({
            id: 'pending-evidence',
            type: 'info',
            title: `${pendingEvidence} Evidence Backlog Detected`,
            description: `You have ${pendingEvidence} pending evidence items. Review them to boost your score.`,
            action: 'Review Now',
            link: '/evidence?status=pending'
          });
        }

        // Default insight if everything is quiet
        if (insights.length === 0) {
          insights.push({
            id: 'all-clear',
            type: 'success',
            title: 'Compliance is on Track',
            description: 'All core metrics are within healthy ranges. Great job!',
            action: 'Run Audit Prep',
            link: '/audit-prep'
          });
        }

        return insights;
      })
  });
};
