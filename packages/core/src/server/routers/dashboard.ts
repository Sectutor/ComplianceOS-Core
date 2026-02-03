import { z } from "zod";
import * as db from "../../db";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, desc, count, and, sql, or } from "drizzle-orm";
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
        
        if (!ctx?.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
        }
        
        const isGlobalAdmin = ctx.user.role === 'admin' || ctx.user.role === 'owner';

        // If not admin, maybe return stats for their assigned clients? 
        // For now, let's assume this is the Admin Dashboard.
        // If regular user, we might want to restrict or return subset.

        // 1. Overview Counts
        const [clientsCount] = await dbConn.select({ value: count() }).from(schema.clients);

        const controlsQuery = dbConn.select({ value: count() }).from(schema.clientControls);
        if (frameworkFilter) {
          controlsQuery.innerJoin(schema.controls, eq(schema.clientControls.controlId, schema.controls.id))
            .where(eq(schema.controls.framework, frameworkFilter));
        }
        const [controlsCount] = await controlsQuery;

        const policiesQuery = dbConn.select({ value: count() }).from(schema.clientPolicies);
        if (frameworkFilter) {
          policiesQuery.innerJoin(schema.controlPolicyMappings, eq(schema.clientPolicies.id, schema.controlPolicyMappings.clientPolicyId))
            .innerJoin(schema.clientControls, eq(schema.controlPolicyMappings.clientControlId, schema.clientControls.id))
            .innerJoin(schema.controls, eq(schema.clientControls.controlId, schema.controls.id))
            .where(eq(schema.controls.framework, frameworkFilter));
        }
        const [policiesCount] = await policiesQuery;

        const evidenceQuery = dbConn.select({ value: count() }).from(schema.evidence);
        if (frameworkFilter) {
          evidenceQuery.innerJoin(schema.clientControls, eq(schema.evidence.clientControlId, schema.clientControls.id))
            .innerJoin(schema.controls, eq(schema.clientControls.controlId, schema.controls.id))
            .where(eq(schema.controls.framework, frameworkFilter));
        }
        const [evidenceCount] = await evidenceQuery;

        const [llmCount] = await dbConn.select({ value: count() }).from(schema.llmProviders);

        // 2. Status Aggregations
        const controlsByStatusQuery = dbConn.select({
          status: schema.clientControls.status,
          value: count()
        })
          .from(schema.clientControls);

        if (frameworkFilter) {
          controlsByStatusQuery.innerJoin(schema.controls, eq(schema.clientControls.controlId, schema.controls.id))
            .where(eq(schema.controls.framework, frameworkFilter));
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

        if (frameworkFilter) {
          policiesByStatusQuery.innerJoin(schema.controlPolicyMappings, eq(schema.clientPolicies.id, schema.controlPolicyMappings.clientPolicyId))
            .innerJoin(schema.clientControls, eq(schema.controlPolicyMappings.clientControlId, schema.clientControls.id))
            .innerJoin(schema.controls, eq(schema.clientControls.controlId, schema.controls.id))
            .where(eq(schema.controls.framework, frameworkFilter));
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

        if (frameworkFilter) {
          evidenceByStatusQuery.innerJoin(schema.clientControls, eq(schema.evidence.clientControlId, schema.clientControls.id))
            .innerJoin(schema.controls, eq(schema.clientControls.controlId, schema.controls.id))
            .where(eq(schema.controls.framework, frameworkFilter));
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
          .from(schema.controls)
          .groupBy(schema.controls.framework);

        const frameworks = await frameworksQuery;
        const controlsByFramework: Record<string, number> = {};
        frameworks.forEach((f: { framework: string | null; count: number }) => {
          if (f.framework) controlsByFramework[f.framework] = Number(f.count);
        });

        // 4. Clients Overview - OPTIMIZED to avoid N+1 queries
        const allClients = await dbConn.select({ id: schema.clients.id, name: schema.clients.name }).from(schema.clients);

        // Fetch aggregation data for ALL clients in single queries using GROUP BY
        const controlsOverviewQuery = dbConn.select({
          clientId: schema.clientControls.clientId,
          count: count()
        })
          .from(schema.clientControls)
          .groupBy(schema.clientControls.clientId);

        if (frameworkFilter) {
          controlsOverviewQuery.innerJoin(schema.controls, eq(schema.clientControls.controlId, schema.controls.id))
            .where(eq(schema.controls.framework, frameworkFilter));
        }
        const controlsCounts = await controlsOverviewQuery;
        const controlsMap = new Map<number, number>(controlsCounts.map((r: any) => [r.clientId, Number(r.count)]));

        // Implemented controls
        const implementedOverviewQuery = dbConn.select({
          clientId: schema.clientControls.clientId,
          count: count()
        })
          .from(schema.clientControls)
          .where(eq(schema.clientControls.status, 'implemented'))
          .groupBy(schema.clientControls.clientId);

        if (frameworkFilter) {
          implementedOverviewQuery.innerJoin(schema.controls, eq(schema.clientControls.controlId, schema.controls.id))
            .where(and(eq(schema.clientControls.status, 'implemented'), eq(schema.controls.framework, frameworkFilter)));
        }
        const implementedCounts = await implementedOverviewQuery;
        const implementedMap = new Map<number, number>(implementedCounts.map((r: any) => [r.clientId, Number(r.count)]));

        // Policies count
        const policiesOverviewQuery = dbConn.select({
          clientId: schema.clientPolicies.clientId,
          count: count()
        })
          .from(schema.clientPolicies)
          .groupBy(schema.clientPolicies.clientId);
        const policiesCounts = await policiesOverviewQuery;
        const policiesMap = new Map<number, number>(policiesCounts.map((r: any) => [r.clientId, Number(r.count)]));

        // Evidence count
        const evidenceOverviewQuery = dbConn.select({
          clientId: schema.evidence.clientId,
          count: count()
        })
          .from(schema.evidence)
          .groupBy(schema.evidence.clientId);
        const evidenceCounts = await evidenceOverviewQuery;
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
          .from(schema.auditLogs)
          .orderBy(desc(schema.auditLogs.createdAt))
          .limit(5);

        // Activity filtering by framework is harder as auditLogs might not link easily, skipped for now or simplified.
        const recentActivity = await activityQuery;

        const formattedActivity = recentActivity.map((a: typeof schema.auditLogs.$inferSelect) => ({
          type: a.entityType as 'control' | 'policy' | 'evidence',
          name: `${a.action} ${a.entityType}`,
          updatedAt: a.createdAt
        }));

        // 6. Risk Statistics (Global for now, optional framework filter if risks linked to controls)
        const [totalRisksCount] = await dbConn.select({ value: count() }).from(schema.riskAssessments);
        const [highRisksCount] = await dbConn.select({ count: count() })
          .from(schema.riskAssessments)
          .where(or(
            eq(schema.riskAssessments.inherentRisk, 'High'),
            eq(schema.riskAssessments.inherentRisk, 'Critical')
          ));

        return {
          overview: {
            totalClients: Number(clientsCount.value),
            totalControls: Number(controlsCount.value),
            totalPolicies: Number(policiesCount.value),
            totalEvidence: Number(evidenceCount.value),
            totalLLMProviders: Number(llmCount.value),
            totalRisks: Number(totalRisksCount.value),
            highRisks: Number(highRisksCount.count || 0)
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

    getInsights: isAuthed.query(async ({ ctx }: any) => {
      const dbConn = await db.getDb();

      // Fetch some statistics to generate realistic insights
      const overdueVendorsRaw = (await dbConn.select({ value: count() }).from(schema.vendorAssessments).where(and(
        sql`due_date < CURRENT_DATE`,
        sql`status != 'completed'`
      )))[0].value;
      const overdueVendors = overdueVendorsRaw ? Number(overdueVendorsRaw) : 0;

      const pendingEvidenceRaw = (await dbConn.select({ value: count() }).from(schema.evidence).where(eq(schema.evidence.status, 'pending')))[0].value;
      const pendingEvidence = pendingEvidenceRaw ? Number(pendingEvidenceRaw) : 0;

      const expiredEvidenceRaw = (await dbConn.select({ value: count() }).from(schema.evidence).where(eq(schema.evidence.status, 'expired')))[0].value;
      const expiredEvidence = expiredEvidenceRaw ? Number(expiredEvidenceRaw) : 0;

      const insights = [];

      if (overdueVendors > 0) {
        insights.push({
          id: 'overdue-vendors',
          type: 'critical',
          title: `${overdueVendors} Overdue Vendor Assessments`,
          description: 'High risk detected in supply chain. Remediation required immediately.',
          action: 'View Assessments',
          link: '/vendors'
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
          title: 'Evidence Backlog Detected',
          description: `You have ${pendingEvidence} pending evidence items. Review them to boost your score.`,
          action: 'Review Now',
          link: '/evidence'
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
