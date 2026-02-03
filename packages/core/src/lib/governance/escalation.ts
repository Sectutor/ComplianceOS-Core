import { getDb } from '../../db';
import { workItems, escalationRules, governanceEvents, clientControls, clientPolicies, riskAssessments } from '../../schema';
import { eq, and, lt, or, isNull } from 'drizzle-orm';
import { sendOverdueNotification } from '../../emailNotification';

// ==========================================
// Escalation Detection & Response
// ==========================================

export class EscalationEngine {
    /**
     * Run all escalation checks for a client
     */
    static async checkEscalations(clientId: number): Promise<{
        triggered: number;
        workItemsCreated: number;
    }> {
        const db = await getDb();

        // Get active escalation rules for this client
        const rules = await db.select().from(escalationRules)
            .where(and(
                eq(escalationRules.clientId, clientId),
                eq(escalationRules.isActive, true)
            ));

        let triggered = 0;
        let workItemsCreated = 0;

        for (const rule of rules) {
            const result = await this.checkRule(rule);
            if (result.triggered) {
                triggered++;
                workItemsCreated += result.workItemsCreated;
            }
        }

        return { triggered, workItemsCreated };
    }

    /**
     * Check a single escalation rule
     */
    private static async checkRule(rule: any): Promise<{
        triggered: boolean;
        workItemsCreated: number;
    }> {
        switch (rule.trigger) {
            case 'overdue':
                return await this.checkOverdueItems(rule);
            case 'risk_threshold_breach':
                return await this.checkRiskThresholds(rule);
            case 'missing_evidence':
                return await this.checkMissingEvidence(rule);
            case 'missing_raci':
                return await this.checkMissingRaci(rule);
            default:
                return { triggered: false, workItemsCreated: 0 };
        }
    }

    /**
     * Check for overdue work items
     */
    private static async checkOverdueItems(rule: any): Promise<{
        triggered: boolean;
        workItemsCreated: number;
    }> {
        const db = await getDb();
        const now = new Date();
        const overdueDays = rule.triggerConditions?.overdueDays || 0;
        const overdueThreshold = new Date(now.getTime() - overdueDays * 24 * 60 * 60 * 1000);

        // Find overdue work items that haven't been escalated
        const overdueItems = await db.select().from(workItems)
            .where(and(
                eq(workItems.clientId, rule.clientId),
                eq(workItems.status, 'pending'),
                eq(workItems.isEscalated, false),
                lt(workItems.dueDate, overdueThreshold)
            ));

        let workItemsCreated = 0;

        for (const item of overdueItems) {
            // Mark as escalated
            await db.update(workItems)
                .set({
                    isEscalated: true,
                    escalatedAt: new Date(),
                    escalationRuleId: rule.id
                })
                .where(eq(workItems.id, item.id));

            // Execute escalation actions
            if (rule.actions?.createWorkItem) {
                await db.insert(workItems).values({
                    clientId: rule.clientId,
                    type: 'review',
                    title: `ESCALATION: ${item.title}`,
                    description: `Work item is overdue by ${overdueDays} days`,
                    entityType: item.entityType,
                    entityId: item.entityId,
                    priority: rule.workItemPriority || 'critical',
                    isEscalated: true,
                    escalatedAt: new Date(),
                    escalationRuleId: rule.id,
                    metadata: {
                        originalWorkItemId: item.id,
                        escalationReason: 'overdue'
                    }
                });
                workItemsCreated++;
            }

            // Send notifications
            if (rule.actions?.notifyAccountable || rule.actions?.sendEmail) {
                // In a real implementation, fetch accountable person and send notification
                console.log(`Sending escalation notification for work item ${item.id}`);
            }

            // Log event
            await db.insert(governanceEvents).values({
                clientId: rule.clientId,
                entityType: item.entityType || 'task',
                entityId: item.entityId || item.id,
                entityName: item.title,
                eventType: 'escalation',
                action: 'escalate_overdue',
                metadata: {
                    workItemId: item.id,
                    escalationRuleId: rule.id,
                    overdueDays
                }
            });
        }

        return {
            triggered: overdueItems.length > 0,
            workItemsCreated
        };
    }

    /**
     * Check for risk threshold breaches
     */
    private static async checkRiskThresholds(rule: any): Promise<{
        triggered: boolean;
        workItemsCreated: number;
    }> {
        const db = await getDb();
        const threshold = rule.triggerConditions?.riskThreshold || 15; // Default high risk

        // Find risks exceeding threshold
        const highRisks = await db.select().from(riskAssessments)
            .where(and(
                eq(riskAssessments.clientId, rule.clientId),
                // In a real implementation, calculate residual risk score
                // For now, we'll use a placeholder
            ));

        let workItemsCreated = 0;

        // Filter risks that actually exceed threshold (would need proper risk calculation)
        const exceedingRisks = highRisks.filter((riskItem) => {
            const residualScore = (riskItem.likelihood || 1) * (riskItem.impact || 1);
            return residualScore > threshold;
        });

        for (const risk of exceedingRisks) {
            // Check if we already have an escalation work item for this risk
            const existing = await db.select().from(workItems)
                .where(and(
                    eq(workItems.clientId, rule.clientId),
                    eq(workItems.entityType, 'risk'),
                    eq(workItems.entityId, risk.id),
                    eq(workItems.type, 'risk_treatment'),
                    or(
                        eq(workItems.status, 'pending'),
                        eq(workItems.status, 'in_progress')
                    )
                ))
                .limit(1);

            if (existing.length === 0) {
                await db.insert(workItems).values({
                    clientId: rule.clientId,
                    type: 'risk_treatment',
                    title: `Risk Exceeds Threshold: ${risk.title}`,
                    description: `Risk residual score exceeds acceptable threshold of ${threshold}`,
                    entityType: 'risk',
                    entityId: risk.id,
                    priority: rule.workItemPriority || 'high',
                    isEscalated: true,
                    escalatedAt: new Date(),
                    escalationRuleId: rule.id,
                    metadata: {
                        riskScore: (risk.likelihood || 1) * (risk.impact || 1),
                        threshold,
                        escalationReason: 'risk_threshold_breach'
                    }
                });
                workItemsCreated++;

                // Log event
                await db.insert(governanceEvents).values({
                    clientId: rule.clientId,
                    entityType: 'risk',
                    entityId: risk.id,
                    entityName: risk.title,
                    eventType: 'escalation',
                    action: 'escalate_risk_threshold',
                    metadata: {
                        threshold,
                        escalationRuleId: rule.id
                    }
                });
            }
        }

        return {
            triggered: exceedingRisks.length > 0,
            workItemsCreated
        };
    }

    /**
     * Check for controls missing evidence
     */
    private static async checkMissingEvidence(rule: any): Promise<{
        triggered: boolean;
        workItemsCreated: number;
    }> {
        const db = await getDb();

        // Find implemented controls without verified evidence
        const controlsWithoutEvidence = await db.select().from(clientControls)
            .where(and(
                eq(clientControls.clientId, rule.clientId),
                eq(clientControls.status, 'implemented')
            ));

        let workItemsCreated = 0;

        for (const control of controlsWithoutEvidence) {
            // Check if control has verified evidence
            const evidence = await db.query.evidence.findMany({
                where: (evidenceTable, { eq, and }) => and(
                    eq(evidenceTable.clientControlId, control.id),
                    eq(evidenceTable.status, 'verified')
                )
            });

            if (evidence.length === 0) {
                // Check if we already have a work item for this
                const existing = await db.select().from(workItems)
                    .where(and(
                        eq(workItems.clientId, rule.clientId),
                        eq(workItems.entityType, 'control'),
                        eq(workItems.entityId, control.id),
                        eq(workItems.type, 'evidence_collection'),
                        or(
                            eq(workItems.status, 'pending'),
                            eq(workItems.status, 'in_progress')
                        )
                    ))
                    .limit(1);

                if (existing.length === 0) {
                    await db.insert(workItems).values({
                        clientId: rule.clientId,
                        type: 'evidence_collection',
                        title: `Missing Evidence for Control ${control.id}`,
                        description: `Control is marked as implemented but lacks verified evidence`,
                        entityType: 'control',
                        entityId: control.id,
                        priority: rule.workItemPriority || 'medium',
                        isEscalated: true,
                        escalatedAt: new Date(),
                        escalationRuleId: rule.id,
                        metadata: {
                            escalationReason: 'missing_evidence'
                        }
                    });
                    workItemsCreated++;
                }
            }
        }

        return {
            triggered: workItemsCreated > 0,
            workItemsCreated
        };
    }

    /**
     * Check for entities missing RACI assignments
     */
    private static async checkMissingRaci(rule: any): Promise<{
        triggered: boolean;
        workItemsCreated: number;
    }> {
        const db = await getDb();

        // Find policies without RACI assignments
        const policiesWithoutRaci = await db.select().from(clientPolicies)
            .where(and(
                eq(clientPolicies.clientId, rule.clientId),
                or(
                    eq(clientPolicies.status, 'review'),
                    eq(clientPolicies.status, 'approved')
                )
            ));

        let workItemsCreated = 0;

        for (const policy of policiesWithoutRaci) {
            // In a real implementation, check RACI matrix for this policy
            // For now, check if owner is set
            if (!policy.owner) {
                const existing = await db.select().from(workItems)
                    .where(and(
                        eq(workItems.clientId, rule.clientId),
                        eq(workItems.entityType, 'policy'),
                        eq(workItems.entityId, policy.id),
                        eq(workItems.type, 'raci_assignment'),
                        or(
                            eq(workItems.status, 'pending'),
                            eq(workItems.status, 'in_progress')
                        )
                    ))
                    .limit(1);

                if (existing.length === 0) {
                    await db.insert(workItems).values({
                        clientId: rule.clientId,
                        type: 'raci_assignment',
                        title: `Assign RACI for Policy: ${policy.name}`,
                        description: `Policy requires RACI assignments before approval`,
                        entityType: 'policy',
                        entityId: policy.id,
                        priority: rule.workItemPriority || 'medium',
                        isEscalated: true,
                        escalatedAt: new Date(),
                        escalationRuleId: rule.id,
                        metadata: {
                            escalationReason: 'missing_raci'
                        }
                    });
                    workItemsCreated++;
                }
            }
        }

        return {
            triggered: workItemsCreated > 0,
            workItemsCreated
        };
    }

    /**
     * Seed default escalation rules for a client
     */
    static async seedDefaultRules(clientId: number, createdBy: number): Promise<void> {
        const db = await getDb();

        const defaultRules = [
            {
                clientId,
                name: 'Overdue Work Items (7 days)',
                description: 'Escalate work items that are overdue by 7 days',
                trigger: 'overdue' as const,
                triggerConditions: { overdueDays: 7 },
                actions: {
                    createWorkItem: true,
                    notifyAccountable: true,
                    sendEmail: true
                },
                workItemPriority: 'high' as const,
                createdBy
            },
            {
                clientId,
                name: 'High Risk Threshold Breach',
                description: 'Escalate when residual risk exceeds threshold of 15',
                trigger: 'risk_threshold_breach' as const,
                entityType: 'risk' as const,
                triggerConditions: { riskThreshold: 15 },
                actions: {
                    createWorkItem: true,
                    notifyAccountable: true
                },
                workItemPriority: 'critical' as const,
                createdBy
            },
            {
                clientId,
                name: 'Missing Evidence for Implemented Controls',
                description: 'Escalate controls marked as implemented without verified evidence',
                trigger: 'missing_evidence' as const,
                entityType: 'control' as const,
                actions: {
                    createWorkItem: true,
                    notifyResponsible: true
                },
                workItemPriority: 'medium' as const,
                createdBy
            },
            {
                clientId,
                name: 'Missing RACI Assignments',
                description: 'Escalate policies and controls without RACI assignments',
                trigger: 'missing_raci' as const,
                actions: {
                    createWorkItem: true,
                    notifyAccountable: true
                },
                workItemPriority: 'medium' as const,
                createdBy
            }
        ];

        for (const rule of defaultRules) {
            await db.insert(escalationRules).values(rule);
        }
    }
}
