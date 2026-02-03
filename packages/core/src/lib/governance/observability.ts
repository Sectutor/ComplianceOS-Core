/**
 * Observability Metrics for Governance Workbench
 * 
 * This module provides metrics collection for monitoring and alerting.
 * Integrate with your observability platform (e.g., Prometheus, Datadog, New Relic).
 */

export interface GovernanceMetrics {
    // Queue Metrics
    queueSize: number;
    queueSizeByPriority: Record<string, number>;
    queueSizeByType: Record<string, number>;
    avgQueueAge: number; // in days

    // SLA Metrics
    slaBreaches: number;
    slaComplianceRate: number; // percentage
    avgCompletionTime: number; // in days

    // Escalation Metrics
    activeEscalations: number;
    escalationRate: number; // percentage of items escalated
    avgEscalationResolutionTime: number; // in hours

    // Workflow Metrics
    transitionsPerDay: number;
    failedTransitions: number;
    avgTransitionTime: number; // in seconds

    // Health Metrics
    governanceHealthScore: number;
    healthScoreTrend: 'up' | 'down' | 'stable';
}

let metricsCache: GovernanceMetrics | null = null;
let lastCollectionTime: Date | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Collect current metrics for a client
 */
export async function collectMetrics(clientId: number): Promise<GovernanceMetrics> {
    // Check cache
    if (metricsCache && lastCollectionTime) {
        const age = Date.now() - lastCollectionTime.getTime();
        if (age < CACHE_TTL_MS) {
            return metricsCache;
        }
    }

    const { getDb } = await import('../../db');
    const { workItems } = await import('../../schema');
    const { eq, and, sql, lt } = await import('drizzle-orm');
    const { calculateGovernanceHealthScore } = await import('./metrics');

    const db = await getDb();
    const now = new Date();

    // Queue size metrics
    const [queueStats] = await db.select({
        total: sql<number>`count(*)`,
        avgAge: sql<number>`avg(extract(epoch from (${now} - created_at)) / 86400)`,
    }).from(workItems)
        .where(and(
            eq(workItems.clientId, clientId),
            eq(workItems.status, 'pending')
        ));

    // Priority breakdown
    const priorityStats = await db.select({
        priority: workItems.priority,
        count: sql<number>`count(*)`,
    }).from(workItems)
        .where(and(
            eq(workItems.clientId, clientId),
            eq(workItems.status, 'pending')
        ))
        .groupBy(workItems.priority);

    // Type breakdown
    const typeStats = await db.select({
        type: workItems.type,
        count: sql<number>`count(*)`,
    }).from(workItems)
        .where(and(
            eq(workItems.clientId, clientId),
            eq(workItems.status, 'pending')
        ))
        .groupBy(workItems.type);

    // SLA metrics
    const [slaStats] = await db.select({
        breaches: sql<number>`count(*) filter (where completed_at > due_date)`,
        total: sql<number>`count(*) filter (where status = 'completed')`,
        avgCompletion: sql<number>`avg(extract(epoch from (completed_at - created_at)) / 86400) filter (where status = 'completed')`,
    }).from(workItems)
        .where(eq(workItems.clientId, clientId));

    // Escalation metrics
    const [escalationStats] = await db.select({
        active: sql<number>`count(*) filter (where is_escalated = true and status != 'completed')`,
        total: sql<number>`count(*)`,
        avgResolution: sql<number>`avg(extract(epoch from (completed_at - escalated_at)) / 3600) filter (where is_escalated = true and status = 'completed')`,
    }).from(workItems)
        .where(eq(workItems.clientId, clientId));

    // Health score
    const healthData = await calculateGovernanceHealthScore(clientId);

    const metrics: GovernanceMetrics = {
        queueSize: Number(queueStats.total) || 0,
        queueSizeByPriority: priorityStats.reduce((acc, { priority, count }) => {
            acc[priority] = Number(count);
            return acc;
        }, {} as Record<string, number>),
        queueSizeByType: typeStats.reduce((acc, { type, count }) => {
            acc[type] = Number(count);
            return acc;
        }, {} as Record<string, number>),
        avgQueueAge: Math.round((Number(queueStats.avgAge) || 0) * 10) / 10,

        slaBreaches: Number(slaStats.breaches) || 0,
        slaComplianceRate: Number(slaStats.total) > 0
            ? Math.round((1 - Number(slaStats.breaches) / Number(slaStats.total)) * 100)
            : 100,
        avgCompletionTime: Math.round((Number(slaStats.avgCompletion) || 0) * 10) / 10,

        activeEscalations: Number(escalationStats.active) || 0,
        escalationRate: Number(escalationStats.total) > 0
            ? Math.round((Number(escalationStats.active) / Number(escalationStats.total)) * 100)
            : 0,
        avgEscalationResolutionTime: Math.round((Number(escalationStats.avgResolution) || 0) * 10) / 10,

        transitionsPerDay: 0, // Would need governance_events table query
        failedTransitions: 0, // Would need error tracking
        avgTransitionTime: 0, // Would need performance monitoring

        governanceHealthScore: healthData.score,
        healthScoreTrend: 'stable', // Would need historical comparison
    };

    // Update cache
    metricsCache = metrics;
    lastCollectionTime = new Date();

    return metrics;
}

/**
 * Check if any metrics exceed thresholds (for alerting)
 */
export function checkAlertThresholds(metrics: GovernanceMetrics): {
    alerts: Array<{ severity: 'warning' | 'critical'; message: string }>;
} {
    const alerts: Array<{ severity: 'warning' | 'critical'; message: string }> = [];

    // Queue size alerts
    if (metrics.queueSize > 100) {
        alerts.push({
            severity: 'warning',
            message: `Queue size (${metrics.queueSize}) exceeds threshold (100)`,
        });
    }

    if (metrics.queueSize > 200) {
        alerts.push({
            severity: 'critical',
            message: `Queue size (${metrics.queueSize}) critically high (>200)`,
        });
    }

    // SLA alerts
    if (metrics.slaComplianceRate < 80) {
        alerts.push({
            severity: 'warning',
            message: `SLA compliance (${metrics.slaComplianceRate}%) below target (80%)`,
        });
    }

    if (metrics.slaComplianceRate < 60) {
        alerts.push({
            severity: 'critical',
            message: `SLA compliance (${metrics.slaComplianceRate}%) critically low (<60%)`,
        });
    }

    // Escalation alerts
    if (metrics.activeEscalations > 10) {
        alerts.push({
            severity: 'warning',
            message: `High number of active escalations (${metrics.activeEscalations})`,
        });
    }

    // Health score alerts
    if (metrics.governanceHealthScore < 70) {
        alerts.push({
            severity: 'warning',
            message: `Governance health score (${metrics.governanceHealthScore}) below target (70)`,
        });
    }

    if (metrics.governanceHealthScore < 50) {
        alerts.push({
            severity: 'critical',
            message: `Governance health score (${metrics.governanceHealthScore}) critically low (<50)`,
        });
    }

    return { alerts };
}

/**
 * Export metrics in Prometheus format
 */
export function exportPrometheusMetrics(clientId: number, metrics: GovernanceMetrics): string {
    return `
# HELP governance_queue_size Current size of the governance work queue
# TYPE governance_queue_size gauge
governance_queue_size{client_id="${clientId}"} ${metrics.queueSize}

# HELP governance_queue_age_days Average age of items in queue (days)
# TYPE governance_queue_age_days gauge
governance_queue_age_days{client_id="${clientId}"} ${metrics.avgQueueAge}

# HELP governance_sla_compliance_rate SLA compliance rate (percentage)
# TYPE governance_sla_compliance_rate gauge
governance_sla_compliance_rate{client_id="${clientId}"} ${metrics.slaComplianceRate}

# HELP governance_active_escalations Number of active escalations
# TYPE governance_active_escalations gauge
governance_active_escalations{client_id="${clientId}"} ${metrics.activeEscalations}

# HELP governance_health_score Overall governance health score
# TYPE governance_health_score gauge
governance_health_score{client_id="${clientId}"} ${metrics.governanceHealthScore}
`.trim();
}
