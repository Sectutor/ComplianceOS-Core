/**
 * Scalable Dashboard Router with Caching
 * 
 * This router provides enterprise-scale dashboard data with intelligent caching,
 * performance monitoring, and optimized database queries.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, clientProcedure } from '../trpc';
import { getReadDb, cachedQuery, CacheKeys } from '../../db-enhanced';
import { sql, desc, eq, and, count, avg, sum } from 'drizzle-orm';
import * as schema from '../../schema';

// Input validation schemas
const dashboardInput = z.object({
  clientId: z.number(),
  refreshCache: z.boolean().optional(),
  timeRange: z.enum(['7d', '30d', '90d', '1y']).optional(),
});

const complianceScoreInput = z.object({
  clientId: z.number(),
  frameworkId: z.string().optional(),
  refreshCache: z.boolean().optional(),
});

/**
 * Get dashboard overview with intelligent caching
 */
export const getDashboardOverview = clientProcedure
  .input(dashboardInput)
  .query(async ({ input, ctx }) => {
    const { clientId, refreshCache = false, timeRange = '30d' } = input;
    const db = getReadDb();
    
    const cacheKey = CacheKeys.dashboard(clientId);
    const ttl = 300; // 5 minutes

    return await cachedQuery(
      cacheKey,
      async () => {
        console.log(`[DASHBOARD] Computing fresh data for client ${clientId}`);
        
        // Calculate date range
        const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
        const days = daysMap[timeRange];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Parallel queries for better performance
        const [
          complianceStats,
          riskStats,
          controlStats,
          evidenceStats,
          recentActivity,
        ] = await Promise.all([
          // Compliance statistics
          db.select({
            totalFrameworks: count(schema.clientControls.id),
            compliantControls: count(schema.clientControls.id).filter(
              eq(schema.clientControls.status, 'compliant')
            ),
            nonCompliantControls: count(schema.clientControls.id).filter(
              eq(schema.clientControls.status, 'non_compliant')
            ),
            inProgressControls: count(schema.clientControls.id).filter(
              eq(schema.clientControls.status, 'in_progress')
            ),
          })
            .from(schema.clientControls)
            .where(eq(schema.clientControls.clientId, clientId)),

          // Risk statistics
          db.select({
            totalRisks: count(schema.riskScenarios.id),
            highRisks: count(schema.riskScenarios.id).filter(
              eq(schema.riskScenarios.inherentRiskRating, 'high')
            ),
            mediumRisks: count(schema.riskScenarios.id).filter(
              eq(schema.riskScenarios.inherentRiskRating, 'medium')
            ),
            lowRisks: count(schema.riskScenarios.id).filter(
              eq(schema.riskScenarios.inherentRiskRating, 'low')
            ),
            avgRiskScore: avg(schema.riskScenarios.inherentRiskScore),
          })
            .from(schema.riskScenarios)
            .where(eq(schema.riskScenarios.clientId, clientId)),

          // Control statistics
          db.select({
            totalControls: count(schema.controls.id),
            implementedControls: count(schema.clientControls.id).filter(
              eq(schema.clientControls.implementationStatus, 'implemented')
            ),
            testedControls: count(schema.clientControls.id).filter(
              eq(schema.clientControls.testStatus, 'tested')
            ),
          })
            .from(schema.controls)
            .leftJoin(
              schema.clientControls,
              eq(schema.controls.id, schema.clientControls.controlId)
            )
            .where(eq(schema.clientControls.clientId, clientId)),

          // Evidence statistics
          db.select({
            totalEvidence: count(schema.evidence.id),
            recentEvidence: count(schema.evidence.id).filter(
              sql`${schema.evidence.createdAt} >= ${startDate}`
            ),
            pendingReview: count(schema.evidence.id).filter(
              eq(schema.evidence.status, 'pending_review')
            ),
          })
            .from(schema.evidence)
            .where(eq(schema.evidence.clientId, clientId)),

          // Recent activity (last 10 items)
          db.select({
            id: schema.activityLog.id,
            action: schema.activityLog.action,
            description: schema.activityLog.description,
            createdAt: schema.activityLog.createdAt,
            userName: schema.users.name,
            userEmail: schema.users.email,
          })
            .from(schema.activityLog)
            .leftJoin(schema.users, eq(schema.activityLog.userId, schema.users.id))
            .where(eq(schema.activityLog.clientId, clientId))
            .orderBy(desc(schema.activityLog.createdAt))
            .limit(10),
        ]);

        // Calculate compliance score
        const stats = complianceStats[0];
        const totalControls = stats.totalFrameworks;
        const compliantControls = stats.compliantControls;
        const complianceScore = totalControls > 0 
          ? Math.round((compliantControls / totalControls) * 100)
          : 0;

        // Calculate risk exposure
        const riskData = riskStats[0];
        const totalRisks = riskData.totalRisks;
        const highRiskCount = riskData.highRisks;
        const riskExposure = totalRisks > 0
          ? Math.round((highRiskCount / totalRisks) * 100)
          : 0;

        return {
          compliance: {
            score: complianceScore,
            totalControls,
            compliantControls,
            nonCompliantControls: stats.nonCompliantControls,
            inProgressControls: stats.inProgressControls,
          },
          risk: {
            totalRisks,
            highRisks: highRiskCount,
            mediumRisks: riskData.mediumRisks,
            lowRisks: riskData.lowRisks,
            avgRiskScore: Math.round(riskData.avgRiskScore || 0),
            exposure: riskExposure,
          },
          controls: {
            totalControls: controlStats[0]?.totalControls || 0,
            implementedControls: controlStats[0]?.implementedControls || 0,
            testedControls: controlStats[0]?.testedControls || 0,
          },
          evidence: {
            totalEvidence: evidenceStats[0]?.totalEvidence || 0,
            recentEvidence: evidenceStats[0]?.recentEvidence || 0,
            pendingReview: evidenceStats[0]?.pendingReview || 0,
          },
          recentActivity: recentActivity.map(activity => ({
            id: activity.id,
            action: activity.action,
            description: activity.description,
            createdAt: activity.createdAt,
            user: {
              name: activity.userName,
              email: activity.userEmail,
            },
          })),
          timeRange,
          generatedAt: new Date(),
        };
      },
      ttl,
      { clientId, refreshCache }
    );
  });

/**
 * Get compliance score breakdown with caching
 */
export const getComplianceScore = clientProcedure
  .input(complianceScoreInput)
  .query(async ({ input, ctx }) => {
    const { clientId, frameworkId, refreshCache = false } = input;
    const db = getReadDb();
    
    const cacheKey = CacheKeys.complianceScore(clientId);
    const ttl = 600; // 10 minutes

    return await cachedQuery(
      cacheKey,
      async () => {
        console.log(`[COMPLIANCE] Computing score for client ${clientId}`);

        // Base query for compliance calculations
        let query = db.select({
          frameworkId: schema.frameworks.id,
          frameworkName: schema.frameworks.name,
          frameworkVersion: schema.frameworks.version,
          totalControls: count(schema.clientControls.id),
          compliantControls: count(schema.clientControls.id).filter(
            eq(schema.clientControls.status, 'compliant')
          ),
          nonCompliantControls: count(schema.clientControls.id).filter(
            eq(schema.clientControls.status, 'non_compliant')
          ),
          inProgressControls: count(schema.clientControls.id).filter(
            eq(schema.clientControls.status, 'in_progress')
          ),
          notImplementedControls: count(schema.clientControls.id).filter(
            eq(schema.clientControls.implementationStatus, 'not_implemented')
          ),
        })
          .from(schema.frameworks)
          .leftJoin(
            schema.controls,
            eq(schema.frameworks.id, schema.controls.frameworkId)
          )
          .leftJoin(
            schema.clientControls,
            and(
              eq(schema.controls.id, schema.clientControls.controlId),
              eq(schema.clientControls.clientId, clientId)
            )
          )
          .groupBy(
            schema.frameworks.id,
            schema.frameworks.name,
            schema.frameworks.version
          );

        if (frameworkId) {
          query = query.where(eq(schema.frameworks.id, frameworkId)) as any;
        }

        const results = await query;

        // Calculate scores for each framework
        const frameworkScores = results.map(framework => {
          const total = framework.totalControls;
          const compliant = framework.compliantControls;
          const score = total > 0 ? Math.round((compliant / total) * 100) : 0;

          return {
            frameworkId: framework.frameworkId,
            frameworkName: framework.frameworkName,
            frameworkVersion: framework.frameworkVersion,
            totalControls: total,
            compliantControls: compliant,
            nonCompliantControls: framework.nonCompliantControls,
            inProgressControls: framework.inProgressControls,
            notImplementedControls: framework.notImplementedControls,
            complianceScore: score,
            status: this.getComplianceStatus(score),
          };
        });

        // Overall compliance score
        const overallScore = frameworkScores.length > 0
          ? Math.round(frameworkScores.reduce((sum, f) => sum + f.complianceScore, 0) / frameworkScores.length)
          : 0;

        return {
          overallScore,
          frameworkScores,
          totalFrameworks: frameworkScores.length,
          generatedAt: new Date(),
        };
      },
      ttl,
      { clientId, refreshCache }
    );
  });

/**
 * Get risk register summary with caching
 */
export const getRiskRegisterSummary = clientProcedure
  .input(dashboardInput)
  .query(async ({ input, ctx }) => {
    const { clientId, refreshCache = false, timeRange = '30d' } = input;
    const db = getReadDb();
    
    const cacheKey = CacheKeys.riskRegister(clientId);
    const ttl = 300; // 5 minutes

    return await cachedQuery(
      cacheKey,
      async () => {
        console.log(`[RISK] Computing risk register for client ${clientId}`);

        // Calculate date range
        const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
        const days = daysMap[timeRange];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Risk summary query
        const riskSummary = await db.select({
          totalRisks: count(schema.riskScenarios.id),
          highRisks: count(schema.riskScenarios.id).filter(
            eq(schema.riskScenarios.inherentRiskRating, 'high')
          ),
          mediumRisks: count(schema.riskScenarios.id).filter(
            eq(schema.riskScenarios.inherentRiskRating, 'medium')
          ),
          lowRisks: count(schema.riskScenarios.id).filter(
            eq(schema.riskScenarios.inherentRiskRating, 'low')
          ),
          criticalRisks: count(schema.riskScenarios.id).filter(
            eq(schema.riskScenarios.inherentRiskRating, 'critical')
          ),
          avgInherentScore: avg(schema.riskScenarios.inherentRiskScore),
          avgResidualScore: avg(schema.riskScenarios.residualRiskScore),
          treatedRisks: count(schema.riskScenarios.id).filter(
            eq(schema.riskScenarios.treatmentStatus, 'treated')
          ),
          acceptedRisks: count(schema.riskScenarios.id).filter(
            eq(schema.riskScenarios.treatmentStatus, 'accepted')
          ),
          mitigatedRisks: count(schema.riskScenarios.id).filter(
            eq(schema.riskScenarios.treatmentStatus, 'mitigated')
          ),
        })
          .from(schema.riskScenarios)
          .where(eq(schema.riskScenarios.clientId, clientId));

        // Recent risks
        const recentRisks = await db.select({
          id: schema.riskScenarios.id,
          title: schema.riskScenarios.title,
          description: schema.riskScenarios.description,
          inherentRating: schema.riskScenarios.inherentRiskRating,
          inherentScore: schema.riskScenarios.inherentRiskScore,
          residualRating: schema.riskScenarios.residualRiskRating,
          residualScore: schema.riskScenarios.residualRiskScore,
          treatmentStatus: schema.riskScenarios.treatmentStatus,
          createdAt: schema.riskScenarios.createdAt,
          updatedAt: schema.riskScenarios.updatedAt,
        })
          .from(schema.riskScenarios)
          .where(and(
            eq(schema.riskScenarios.clientId, clientId),
            sql`${schema.riskScenarios.createdAt} >= ${startDate}`
          ))
          .orderBy(desc(schema.riskScenarios.createdAt))
          .limit(10);

        const summary = riskSummary[0];
        const totalRisks = summary.totalRisks;

        return {
          summary: {
            totalRisks,
            highRisks: summary.highRisks,
            mediumRisks: summary.mediumRisks,
            lowRisks: summary.lowRisks,
            criticalRisks: summary.criticalRisks,
            avgInherentScore: Math.round(summary.avgInherentScore || 0),
            avgResidualScore: Math.round(summary.avgResidualScore || 0),
            treatedRisks: summary.treatedRisks,
            acceptedRisks: summary.acceptedRisks,
            mitigatedRisks: summary.mitigatedRisks,
            exposureRate: totalRisks > 0 ? Math.round(((summary.highRisks + summary.criticalRisks) / totalRisks) * 100) : 0,
          },
          recentRisks: recentRisks.map(risk => ({
            id: risk.id,
            title: risk.title,
            description: risk.description,
            inherentRating: risk.inherentRating,
            inherentScore: risk.inherentScore,
            residualRating: risk.residualRating,
            residualScore: risk.residualScore,
            treatmentStatus: risk.treatmentStatus,
            createdAt: risk.createdAt,
            updatedAt: risk.updatedAt,
          })),
          timeRange,
          generatedAt: new Date(),
        };
      },
      ttl,
      { clientId, refreshCache }
    );
  });

/**
 * Helper method to determine compliance status
 */
function getComplianceStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
}

/**
 * Export scalable dashboard router
 */
export const scalableDashboardRouter = {
  getDashboardOverview,
  getComplianceScore,
  getRiskRegisterSummary,
};