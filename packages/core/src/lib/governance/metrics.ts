import { getDb } from '../../db';
import { workItems, clientPolicies, clientControls, evidence, governanceEvents } from '../../schema';
import { eq, and, sql, lt, gte, or } from 'drizzle-orm';

/**
 * Calculate governance health score for a client
 */
export async function calculateGovernanceHealthScore(clientId: number): Promise<{
    score: number;
    breakdown: {
        coverage: number;
        slaCompliance: number;
        overdueItems: number;
        approvalVelocity: number;
    };
    metrics: {
        totalPolicies: number;
        approvedPolicies: number;
        totalControls: number;
        implementedControls: number;
        controlsWithEvidence: number;
        totalWorkItems: number;
        completedOnTime: number;
        overdueCount: number;
        avgApprovalDays: number;
    };
}> {
    const db = await getDb();
    const now = new Date();

    // Policy metrics
    const [policyStats] = await db.select({
        total: sql<number>`count(*)`,
        approved: sql<number>`count(*) filter (where status = 'approved' or status = 'published')`,
    }).from(clientPolicies)
        .where(eq(clientPolicies.clientId, clientId));

    // Control metrics
    const [controlStats] = await db.select({
        total: sql<number>`count(*)`,
        implemented: sql<number>`count(*) filter (where status = 'implemented' or status = 'monitored')`,
    }).from(clientControls)
        .where(eq(clientControls.clientId, clientId));

    // Controls with evidence
    const controlsWithEvidence = await db.selectDistinct({
        controlId: evidence.clientControlId
    }).from(evidence)
        .where(and(
            eq(evidence.clientId, clientId),
            eq(evidence.status, 'verified')
        ));

    // Work item SLA metrics
    const [workItemStats] = await db.select({
        total: sql<number>`count(*)`,
        completedOnTime: sql<number>`count(*) filter (where status = 'completed' and completed_at <= due_date)`,
        overdue: sql<number>`count(*) filter (where status = 'pending' and due_date < ${now})`,
    }).from(workItems)
        .where(eq(workItems.clientId, clientId));

    // Approval velocity (avg days from draft to approved for policies)
    const approvalVelocityQuery = await db.select({
        avgDays: sql<number>`avg(extract(epoch from (
      select created_at from governance_events 
      where entity_type = 'policy' 
      and entity_id = client_policies.id 
      and to_state = 'approved' 
      limit 1
    ) - created_at) / 86400)`,
    }).from(clientPolicies)
        .where(and(
            eq(clientPolicies.clientId, clientId),
            or(
                eq(clientPolicies.status, 'approved'),
                eq(clientPolicies.status, 'published')
            )
        ));

    const avgApprovalDays = approvalVelocityQuery[0]?.avgDays || 0;

    // Calculate component scores (0-100)
    const totalPolicies = Number(policyStats.total) || 1;
    const approvedPolicies = Number(policyStats.approved);
    const totalControls = Number(controlStats.total) || 1;
    const implementedControls = Number(controlStats.implemented);
    const controlsWithEvidenceCount = controlsWithEvidence.length;
    const totalWorkItems = Number(workItemStats.total) || 1;
    const completedOnTime = Number(workItemStats.completedOnTime);
    const overdueCount = Number(workItemStats.overdue);

    // Coverage Score (40% weight): policies approved + controls implemented + evidence coverage
    const policyCoverage = (approvedPolicies / totalPolicies) * 100;
    const controlCoverage = (implementedControls / totalControls) * 100;
    const evidenceCoverage = totalControls > 0 ? (controlsWithEvidenceCount / totalControls) * 100 : 0;
    const coverageScore = (policyCoverage * 0.4 + controlCoverage * 0.4 + evidenceCoverage * 0.2);

    // SLA Compliance Score (30% weight): work items completed on time
    const slaCompliance = totalWorkItems > 0 ? (completedOnTime / totalWorkItems) * 100 : 100;

    // Overdue Penalty (20% weight): penalize for overdue items
    const overduePenalty = totalWorkItems > 0 ? Math.max(0, 100 - (overdueCount / totalWorkItems) * 200) : 100;

    // Approval Velocity Score (10% weight): faster approvals = higher score
    // Target: 7 days or less = 100, 30 days = 50, 60+ days = 0
    const velocityScore = Math.max(0, Math.min(100, 100 - (avgApprovalDays / 60) * 100));

    // Overall score (weighted average)
    const score = Math.round(
        coverageScore * 0.4 +
        slaCompliance * 0.3 +
        overduePenalty * 0.2 +
        velocityScore * 0.1
    );

    return {
        score,
        breakdown: {
            coverage: Math.round(coverageScore),
            slaCompliance: Math.round(slaCompliance),
            overdueItems: Math.round(overduePenalty),
            approvalVelocity: Math.round(velocityScore),
        },
        metrics: {
            totalPolicies,
            approvedPolicies,
            totalControls,
            implementedControls,
            controlsWithEvidence: controlsWithEvidenceCount,
            totalWorkItems,
            completedOnTime,
            overdueCount,
            avgApprovalDays: Math.round(avgApprovalDays * 10) / 10,
        },
    };
}

/**
 * Get governance trends over time
 */
export async function getGovernanceTrends(clientId: number, days: number = 30): Promise<{
    dates: string[];
    scores: number[];
    workItemsCompleted: number[];
    workItemsCreated: number[];
}> {
    const db = await getDb();
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Get daily work item activity
    const dailyActivity = await db.select({
        date: sql<string>`date(created_at)`,
        created: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where status = 'completed')`,
    }).from(workItems)
        .where(and(
            eq(workItems.clientId, clientId),
            gte(workItems.createdAt, startDate)
        ))
        .groupBy(sql`date(created_at)`)
        .orderBy(sql`date(created_at)`);

    // For now, return simplified trend data
    // In a real implementation, you'd calculate daily health scores
    const dates = dailyActivity.map(d => d.date);
    const workItemsCreated = dailyActivity.map(d => Number(d.created));
    const workItemsCompleted = dailyActivity.map(d => Number(d.completed));

    // Placeholder scores (would need historical calculation)
    const scores = dates.map(() => 0);

    return {
        dates,
        scores,
        workItemsCompleted,
        workItemsCreated,
    };
}

/**
 * Get governance bottlenecks
 */
export async function getGovernanceBottlenecks(clientId: number): Promise<{
    slowestTransitions: Array<{
        entityType: string;
        fromState: string;
        toState: string;
        avgDays: number;
        count: number;
    }>;
    mostEscalatedTypes: Array<{
        type: string;
        count: number;
    }>;
}> {
    const db = await getDb();

    // Find slowest state transitions
    const slowTransitions = await db.select({
        entityType: governanceEvents.entityType,
        fromState: governanceEvents.fromState,
        toState: governanceEvents.toState,
        avgDays: sql<number>`avg(extract(epoch from (
      select min(created_at) from governance_events ge2
      where ge2.entity_id = governance_events.entity_id
      and ge2.entity_type = governance_events.entity_type
      and ge2.from_state = governance_events.to_state
      and ge2.created_at > governance_events.created_at
    ) - governance_events.created_at) / 86400)`,
        count: sql<number>`count(*)`,
    }).from(governanceEvents)
        .where(and(
            eq(governanceEvents.clientId, clientId),
            eq(governanceEvents.eventType, 'status_change')
        ))
        .groupBy(governanceEvents.entityType, governanceEvents.fromState, governanceEvents.toState)
        .having(sql`count(*) > 2`)
        .orderBy(sql`avg(extract(epoch from (
      select min(created_at) from governance_events ge2
      where ge2.entity_id = governance_events.entity_id
      and ge2.entity_type = governance_events.entity_type
      and ge2.from_state = governance_events.to_state
      and ge2.created_at > governance_events.created_at
    ) - governance_events.created_at) / 86400) desc`)
        .limit(5);

    // Most escalated work item types
    const escalatedTypes = await db.select({
        type: workItems.type,
        count: sql<number>`count(*)`,
    }).from(workItems)
        .where(and(
            eq(workItems.clientId, clientId),
            eq(workItems.isEscalated, true)
        ))
        .groupBy(workItems.type)
        .orderBy(sql`count(*) desc`)
        .limit(5);

    return {
        slowestTransitions: slowTransitions.map(t => ({
            entityType: t.entityType,
            fromState: t.fromState || '',
            toState: t.toState || '',
            avgDays: Math.round((Number(t.avgDays) || 0) * 10) / 10,
            count: Number(t.count),
        })),
        mostEscalatedTypes: escalatedTypes.map(t => ({
            type: t.type,
            count: Number(t.count),
        })),
    };
}
