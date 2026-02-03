import { getDb } from '../../db';
import { 
  governanceEvents, 
  workItems, 
  clientPolicies, 
  clientControls, 
  riskAssessments, 
  bcPlans,
  roadmaps,
  roadmapMilestones,
  implementationPlans,
  implementationTasks
} from '../../schema';
import { sql } from 'drizzle-orm';
import { eq, and } from 'drizzle-orm';
import { logActivity } from '../audit';

// ==========================================
// Workflow State Definitions
// ==========================================

export type EntityType = 'policy' | 'control' | 'risk' | 'bcp_plan' | 'roadmap' | 'implementation_plan';

export type PolicyStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';
export type ControlStatus = 'not_implemented' | 'in_progress' | 'implemented' | 'monitored';
export type RiskStatus = 'draft' | 'reviewed' | 'approved';
export type BcpStatus = 'draft' | 'review' | 'approved' | 'active' | 'tested';
export type RoadmapStatus = 'draft' | 'active' | 'on_track' | 'delayed' | 'completed';
export type ImplementationStatus = 'not_started' | 'planning' | 'in_progress' | 'testing' | 'completed' | 'blocked';

export type WorkflowStatus = PolicyStatus | ControlStatus | RiskStatus | BcpStatus | RoadmapStatus | ImplementationStatus;

// ==========================================
// State Transition Definitions
// ==========================================

interface StateTransition {
    from: WorkflowStatus[];
    to: WorkflowStatus;
    guards?: TransitionGuard[];
    sideEffects?: TransitionSideEffect[];
}

interface TransitionGuard {
    name: string;
    check: (context: TransitionContext) => Promise<{ allowed: boolean; reason?: string }>;
}

interface TransitionSideEffect {
    name: string;
    execute: (context: TransitionContext) => Promise<void>;
}

export interface TransitionContext {
    entityType: EntityType;
    entityId: number;
    clientId: number;
    fromStatus: WorkflowStatus;
    toStatus: WorkflowStatus;
    userId: number;
    userName?: string;
    metadata?: Record<string, unknown>;
}

// ==========================================
// Policy Workflow
// ==========================================

const policyTransitions: Record<string, StateTransition> = {
    'draft_to_review': {
        from: ['draft'],
        to: 'review',
        guards: [
            {
                name: 'has_content',
                check: async (ctx) => {
                    const db = await getDb();
                    const [policy] = await db.select().from(clientPolicies)
                        .where(eq(clientPolicies.id, ctx.entityId))
                        .limit(1);

                    if (!policy?.content || policy.content.trim().length < 100) {
                        return { allowed: false, reason: 'Policy must have substantial content (min 100 characters)' };
                    }
                    return { allowed: true };
                }
            }
        ],
        sideEffects: [
            {
                name: 'create_review_work_item',
                execute: async (ctx) => {
                    const db = await getDb();
                    const [policy] = await db.select().from(clientPolicies)
                        .where(eq(clientPolicies.id, ctx.entityId))
                        .limit(1);

                    await db.insert(workItems).values({
                        clientId: ctx.clientId,
                        type: 'policy_review',
                        title: `Review Policy: ${policy?.name}`,
                        description: `Policy "${policy?.name}" has been submitted for review`,
                        entityType: 'policy',
                        entityId: ctx.entityId,
                        priority: 'medium',
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                        createdBy: ctx.userId,
                    });
                }
            }
        ]
    },
    'review_to_approved': {
        from: ['review'],
        to: 'approved',
        guards: [
            {
                name: 'has_approvers',
                check: async (ctx) => {
                    // In a real implementation, check for approval records
                    // For now, we'll allow it if metadata contains approval info
                    const approvalCount = ctx.metadata?.approvalCount || 0;
                    const requiredApprovals = ctx.metadata?.requiredApprovals || 1;

                    if (approvalCount < requiredApprovals) {
                        return {
                            allowed: false,
                            reason: `Requires ${requiredApprovals} approvals, only ${approvalCount} received`
                        };
                    }
                    return { allowed: true };
                }
            }
        ],
        sideEffects: [
            {
                name: 'complete_review_work_items',
                execute: async (ctx) => {
                    const db = await getDb();
                    await db.update(workItems)
                        .set({
                            status: 'completed',
                            completedAt: new Date()
                        })
                        .where(and(
                            eq(workItems.entityType, 'policy'),
                            eq(workItems.entityId, ctx.entityId),
                            eq(workItems.type, 'policy_review'),
                            eq(workItems.status, 'pending')
                        ));
                }
            }
        ]
    },
    'approved_to_published': {
        from: ['approved'],
        to: 'published',
        sideEffects: [
            {
                name: 'version_snapshot',
                execute: async (ctx) => {
                    // Create version snapshot (implementation would go here)
                    console.log(`Creating version snapshot for policy ${ctx.entityId}`);
                }
            }
        ]
    },
    'any_to_archived': {
        from: ['draft', 'review', 'approved', 'published'],
        to: 'archived',
        sideEffects: []
    }
};

// ==========================================
// Control Workflow
// ==========================================

const controlTransitions: Record<string, StateTransition> = {
    'not_implemented_to_in_progress': {
        from: ['not_implemented'],
        to: 'in_progress',
        guards: [
            {
                name: 'has_raci_assignment',
                check: async () => {
                    // Check if control has RACI assignments
                    // This would query the RACI matrix in a real implementation
                    return { allowed: true }; // Simplified for now
                }
            }
        ],
        sideEffects: [
            {
                name: 'create_implementation_work_item',
                execute: async (ctx) => {
                    const db = await getDb();
                    await db.insert(workItems).values({
                        clientId: ctx.clientId,
                        type: 'control_implementation',
                        title: `Implement Control ${ctx.entityId}`,
                        description: `Control implementation in progress`,
                        entityType: 'control',
                        entityId: ctx.entityId,
                        priority: 'high',
                        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                        createdBy: ctx.userId,
                    });
                }
            }
        ]
    },
    'in_progress_to_implemented': {
        from: ['in_progress'],
        to: 'implemented',
        guards: [
            {
                name: 'has_evidence',
                check: async (ctx) => {
                    const db = await getDb();
                    const { evidence } = await import('../../schema');
                    const { eq, and } = await import('drizzle-orm');
                    const evidenceRecords = await db.select().from(evidence)
                        .where(and(
                            eq(evidence.clientControlId, ctx.entityId),
                            eq(evidence.status, 'verified')
                        ));

                    if (evidenceRecords.length === 0) {
                        return {
                            allowed: false,
                            reason: 'Control requires at least one verified evidence item before marking as implemented'
                        };
                    }
                    return { allowed: true };
                }
            }
        ],
        sideEffects: [
            {
                name: 'complete_implementation_work_items',
                execute: async (ctx) => {
                    const db = await getDb();
                    await db.update(workItems)
                        .set({
                            status: 'completed',
                            completedAt: new Date()
                        })
                        .where(and(
                            eq(workItems.entityType, 'control'),
                            eq(workItems.entityId, ctx.entityId),
                            eq(workItems.type, 'control_implementation')
                        ));
                }
            }
        ]
    },
    'implemented_to_monitored': {
        from: ['implemented'],
        to: 'monitored',
        sideEffects: []
    },
    // Allow regression for controls
    'implemented_to_in_progress': {
        from: ['implemented', 'monitored'],
        to: 'in_progress',
        sideEffects: [
            {
                name: 'create_regression_escalation',
                execute: async (ctx) => {
                    const db = await getDb();
                    await db.insert(workItems).values({
                        clientId: ctx.clientId,
                        type: 'control_implementation',
                        title: `Control Regression: ${ctx.entityId}`,
                        description: `Control status regressed from ${ctx.fromStatus} to ${ctx.toStatus}`,
                        entityType: 'control',
                        entityId: ctx.entityId,
                        priority: 'critical',
                        isEscalated: true,
                        escalatedAt: new Date(),
                        metadata: {
                            previousStatus: ctx.fromStatus,
                            reason: ctx.metadata?.reason || 'Status regression detected'
                        },
                        createdBy: ctx.userId,
                    });
                }
            }
        ]
    }
};

// ==========================================
// Roadmap Workflow
// ==========================================

const roadmapTransitions: Record<string, StateTransition> = {
    'draft_to_active': {
        from: ['draft'],
        to: 'active',
        guards: [
            {
                name: 'has_objectives_and_milestones',
                check: async (ctx) => {
                    const db = await getDb();
                    const [roadmap] = await db.select().from(roadmaps)
                        .where(eq(roadmaps.id, ctx.entityId))
                        .limit(1);

                    const [milestoneCount] = await db.select({ count: sql<number>`count(*)` })
                        .from(roadmapMilestones)
                        .where(eq(roadmapMilestones.roadmapId, ctx.entityId));

                    const objectives = ctx.metadata?.objectives || roadmap?.objectives;
                    const hasObjectives = objectives && objectives.length > 0;
                    const hasMilestones = milestoneCount.count > 0;

                    if (!hasObjectives || !hasMilestones) {
                        return {
                            allowed: false,
                            reason: 'Roadmap must have defined objectives and at least one milestone before activation'
                        };
                    }
                    return { allowed: true };
                }
            }
        ],
        sideEffects: [
            {
                name: 'create_roadmap_activation_work_items',
                execute: async (ctx) => {
                    const db = await getDb();
                    const [roadmap] = await db.select().from(roadmaps)
                        .where(eq(roadmaps.id, ctx.entityId))
                        .limit(1);

                    await db.insert(workItems).values({
                        clientId: ctx.clientId,
                        type: 'review',
                        title: `Roadmap Activated: ${roadmap?.title}`,
                        description: `Roadmap "${roadmap?.title}" has been activated and is now being executed`,
                        entityType: 'roadmap',
                        entityId: ctx.entityId,
                        priority: 'high',
                        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for first check-in
                        createdBy: ctx.userId,
                    });
                }
            }
        ]
    },
    'active_to_delayed': {
        from: ['active', 'on_track'],
        to: 'delayed',
        sideEffects: [
            {
                name: 'create_escalation_task',
                execute: async (ctx) => {
                    const db = await getDb();
                    const [roadmap] = await db.select().from(roadmaps)
                        .where(eq(roadmaps.id, ctx.entityId))
                        .limit(1);

                    await db.insert(workItems).values({
                        clientId: ctx.clientId,
                        type: 'risk_treatment',
                        title: `Roadmap Delayed: ${roadmap?.title}`,
                        description: `Roadmap "${roadmap?.title}" is delayed. Review progress and adjust timeline.`,
                        entityType: 'roadmap',
                        entityId: ctx.entityId,
                        priority: 'critical',
                        isEscalated: true,
                        escalatedAt: new Date(),
                        metadata: {
                            previousStatus: ctx.fromStatus,
                            reason: ctx.metadata?.reason || 'Milestone delays detected'
                        },
                        createdBy: ctx.userId,
                    });
                }
            }
        ]
    },
    'delayed_to_on_track': {
        from: ['delayed'],
        to: 'on_track',
        sideEffects: [
            {
                name: 'create_recovery_notification',
                execute: async (ctx) => {
                    const db = await getDb();
                    const [roadmap] = await db.select().from(roadmaps)
                        .where(eq(roadmaps.id, ctx.entityId))
                        .limit(1);

                    await db.insert(workItems).values({
                        clientId: ctx.clientId,
                        type: 'review',
                        title: `Roadmap Back on Track: ${roadmap?.title}`,
                        description: `Roadmap "${roadmap?.title}" has recovered and is back on track`,
                        entityType: 'roadmap',
                        entityId: ctx.entityId,
                        priority: 'medium',
                        createdBy: ctx.userId,
                    });
                }
            }
        ]
    },
    'on_track_to_completed': {
        from: ['on_track', 'active'],
        to: 'completed',
        guards: [
            {
                name: 'all_milestones_completed',
                check: async (ctx) => {
                    const db = await getDb();
                    const [incompleteMilestones] = await db.select({ count: sql<number>`count(*)` })
                        .from(roadmapMilestones)
                        .where(and(
                            eq(roadmapMilestones.roadmapId, ctx.entityId),
                            sql`status != 'completed'`
                        ));

                    if (incompleteMilestones.count > 0) {
                        return {
                            allowed: false,
                            reason: `Cannot complete roadmap with ${incompleteMilestones.count} incomplete milestones`
                        };
                    }
                    return { allowed: true };
                }
            }
        ],
        sideEffects: [
            {
                name: 'complete_roadmap_work_items',
                execute: async (ctx) => {
                    const db = await getDb();
                    const [roadmap] = await db.select().from(roadmaps)
                        .where(eq(roadmaps.id, ctx.entityId))
                        .limit(1);

                    await db.update(workItems)
                        .set({
                            status: 'completed',
                            completedAt: new Date()
                        })
                        .where(and(
                            eq(workItems.entityType, 'roadmap'),
                            eq(workItems.entityId, ctx.entityId),
                            eq(workItems.status, 'pending')
                        ));

                    // Create final completion notification
                    await db.insert(workItems).values({
                        clientId: ctx.clientId,
                        type: 'approval',
                        title: `Roadmap Completed: ${roadmap?.title}`,
                        description: `Congratulations! Roadmap "${roadmap?.title}" has been completed successfully`,
                        entityType: 'roadmap',
                        entityId: ctx.entityId,
                        priority: 'low',
                        createdBy: ctx.userId,
                    });
                }
            }
        ]
    }
};

// ==========================================
// Implementation Plan Workflow
// ==========================================

const implementationPlanTransitions: Record<string, StateTransition> = {
    'not_started_to_planning': {
        from: ['not_started'],
        to: 'planning',
        guards: [
            {
                name: 'has_resource_allocation',
                check: async (ctx) => {
                    const db = await getDb();
                    const [plan] = await db.select().from(implementationPlans)
                        .where(eq(implementationPlans.id, ctx.entityId))
                        .limit(1);

                    const projectManager = ctx.metadata?.projectManagerId || plan?.projectManagerId;
                    const teamMembers = ctx.metadata?.teamMemberIds || plan?.teamMemberIds;
                    const hasTeam = projectManager && (teamMembers && teamMembers.length > 0);

                    if (!hasTeam) {
                        return {
                            allowed: false,
                            reason: 'Implementation plan must have assigned project manager and team members before planning'
                        };
                    }
                    return { allowed: true };
                }
            }
        ],
        sideEffects: [
            {
                name: 'create_planning_tasks',
                execute: async (ctx) => {
                    const db = await getDb();
                    const [plan] = await db.select().from(implementationPlans)
                        .where(eq(implementationPlans.id, ctx.entityId))
                        .limit(1);

                    await db.insert(workItems).values({
                        clientId: ctx.clientId,
                        type: 'control_assessment',
                        title: `Implementation Planning: ${plan?.title}`,
                        description: `Create detailed task breakdown and resource allocation for implementation plan`,
                        entityType: 'implementation_plan',
                        entityId: ctx.entityId,
                        priority: 'high',
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                        createdBy: ctx.userId,
                    });
                }
            }
        ]
    },
    'planning_to_in_progress': {
        from: ['planning'],
        to: 'in_progress',
        guards: [
            {
                name: 'has_tasks_defined',
                check: async (ctx) => {
                    const db = await getDb();
                    const [taskCount] = await db.select({ count: sql<number>`count(*)` })
                        .from(implementationTasks)
                        .where(eq(implementationTasks.implementationPlanId, ctx.entityId));

                    if (taskCount.count === 0) {
                        return {
                            allowed: false,
                            reason: 'Implementation plan must have defined tasks before starting execution'
                        };
                    }
                    return { allowed: true };
                }
            }
        ],
        sideEffects: [
            {
                name: 'activate_implementation_tasks',
                execute: async (ctx) => {
                    const db = await getDb();
                    const [plan] = await db.select().from(implementationPlans)
                        .where(eq(implementationPlans.id, ctx.entityId))
                        .limit(1);

                    await db.insert(workItems).values({
                        clientId: ctx.clientId,
                        type: 'control_implementation',
                        title: `Implementation Started: ${plan?.title}`,
                        description: `Implementation plan "${plan?.title}" is now in execution phase`,
                        entityType: 'implementation_plan',
                        entityId: ctx.entityId,
                        priority: 'high',
                        createdBy: ctx.userId,
                    });
                }
            }
        ]
    },
    'in_progress_to_testing': {
        from: ['in_progress'],
        to: 'testing',
        guards: [
            {
                name: 'all_tasks_completed',
                check: async (ctx) => {
                    const db = await getDb();
                    const [incompleteTasks] = await db.select({ count: sql<number>`count(*)` })
                        .from(implementationTasks)
                        .where(and(
                            eq(implementationTasks.implementationPlanId, ctx.entityId),
                            sql`status != 'done'`
                        ));

                    if (incompleteTasks.count > 0) {
                        return {
                            allowed: false,
                            reason: `Cannot start testing with ${incompleteTasks.count} incomplete tasks`
                        };
                    }
                    return { allowed: true };
                }
            }
        ],
        sideEffects: [
            {
                name: 'create_testing_tasks',
                execute: async (ctx) => {
                    const db = await getDb();
                    const [plan] = await db.select().from(implementationPlans)
                        .where(eq(implementationPlans.id, ctx.entityId))
                        .limit(1);

                    await db.insert(workItems).values({
                        clientId: ctx.clientId,
                        type: 'control_assessment',
                        title: `Implementation Testing: ${plan?.title}`,
                        description: `Test and validate implementation of "${plan?.title}"`,
                        entityType: 'implementation_plan',
                        entityId: ctx.entityId,
                        priority: 'medium',
                        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks for testing
                        createdBy: ctx.userId,
                    });
                }
            }
        ]
    },
    'testing_to_completed': {
        from: ['testing'],
        to: 'completed',
        guards: [
            {
                name: 'has_acceptance_criteria_met',
                check: async (ctx) => {
                    const acceptanceEvidence = ctx.metadata?.acceptanceEvidence as unknown[];
                    
                    if (!acceptanceEvidence || acceptanceEvidence.length === 0) {
                        return {
                            allowed: false,
                            reason: 'Implementation plan must have acceptance evidence before completion'
                        };
                    }
                    return { allowed: true };
                }
            }
        ],
        sideEffects: [
            {
                name: 'complete_implementation_plan',
                execute: async (ctx) => {
                    const db = await getDb();
                    const [plan] = await db.select().from(implementationPlans)
                        .where(eq(implementationPlans.id, ctx.entityId))
                        .limit(1);

                    await db.update(workItems)
                        .set({
                            status: 'completed',
                            completedAt: new Date()
                        })
                        .where(and(
                            eq(workItems.entityType, 'implementation_plan'),
                            eq(workItems.entityId, ctx.entityId),
                            eq(workItems.status, 'pending')
                        ));

                    // Update roadmap progress if linked
                    if (plan?.roadmapId) {
                        await db.insert(workItems).values({
                            clientId: ctx.clientId,
                            type: 'review',
                            title: `Implementation Completed: ${plan?.title}`,
                            description: `Implementation plan "${plan?.title}" completed. Update roadmap progress.`,
                            entityType: 'roadmap',
                            entityId: plan.roadmapId,
                            priority: 'medium',
                            createdBy: ctx.userId,
                        });
                    }
                }
            }
        ]
    },
    // Recovery transitions
    'in_progress_to_blocked': {
        from: ['in_progress'],
        to: 'blocked',
        sideEffects: [
            {
                name: 'create_blockage_escalation',
                execute: async (ctx) => {
                    const db = await getDb();
                    const [plan] = await db.select().from(implementationPlans)
                        .where(eq(implementationPlans.id, ctx.entityId))
                        .limit(1);

                    await db.insert(workItems).values({
                        clientId: ctx.clientId,
                        type: 'risk_treatment',
                        title: `Implementation Blocked: ${plan?.title}`,
                        description: `Implementation plan "${plan?.title}" is blocked: ${ctx.metadata?.blockageReason || 'Unknown'}`,
                        entityType: 'implementation_plan',
                        entityId: ctx.entityId,
                        priority: 'critical',
                        isEscalated: true,
                        escalatedAt: new Date(),
                        metadata: {
                            previousStatus: ctx.fromStatus,
                            blockageReason: ctx.metadata?.blockageReason
                        },
                        createdBy: ctx.userId,
                    });
                }
            }
        ]
    },
    'blocked_to_in_progress': {
        from: ['blocked'],
        to: 'in_progress',
        sideEffects: [
            {
                name: 'create_block_recovery_notification',
                execute: async (ctx) => {
                    const db = await getDb();
                    const [plan] = await db.select().from(implementationPlans)
                        .where(eq(implementationPlans.id, ctx.entityId))
                        .limit(1);

                    await db.insert(workItems).values({
                        clientId: ctx.clientId,
                        type: 'control_implementation',
                        title: `Implementation Unblocked: ${plan?.title}`,
                        description: `Implementation plan "${plan?.title}" blockage has been resolved`,
                        entityType: 'implementation_plan',
                        entityId: ctx.entityId,
                        priority: 'medium',
                        createdBy: ctx.userId,
                    });
                }
            }
        ]
    }
};

// ==========================================
// Risk Workflow
// ==========================================

const riskTransitions: Record<string, StateTransition> = {
    'draft_to_reviewed': {
        from: ['draft'],
        to: 'reviewed',
        guards: [
            {
                name: 'has_assessment_data',
                check: async (ctx) => {
                    const db = await getDb();
                    const [assessment] = await db.select().from(riskAssessments)
                        .where(eq(riskAssessments.id, ctx.entityId))
                        .limit(1);

                    const likelihood = ctx.metadata?.likelihood || assessment?.likelihood;
                    const impact = ctx.metadata?.impact || assessment?.impact;
                    const inherentRisk = ctx.metadata?.inherentRisk || assessment?.inherentRisk;

                    if (!likelihood || !impact || !inherentRisk) {
                        return {
                            allowed: false,
                            reason: 'Risk assessment must have likelihood, impact, and inherent risk evaluated before review'
                        };
                    }
                    return { allowed: true };
                }
            }
        ],
        sideEffects: [
            {
                name: 'create_review_work_item',
                execute: async (ctx) => {
                    const db = await getDb();
                    const [assessment] = await db.select().from(riskAssessments)
                        .where(eq(riskAssessments.id, ctx.entityId))
                        .limit(1);

                    await db.insert(workItems).values({
                        clientId: ctx.clientId,
                        type: 'risk_review',
                        title: `Review Risk Assessment: ${assessment?.title || assessment?.assessmentId}`,
                        description: `Risk assessment "${assessment?.title}" has been submitted for review`,
                        entityType: 'risk',
                        entityId: ctx.entityId,
                        priority: 'medium',
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                        createdBy: ctx.userId,
                    });
                }
            }
        ]
    },
    'reviewed_to_approved': {
        from: ['reviewed'],
        to: 'approved',
        guards: [
            {
                name: 'has_treatment_plan',
                check: async (ctx) => {
                    const db = await getDb();
                    const [assessment] = await db.select().from(riskAssessments)
                        .where(eq(riskAssessments.id, ctx.entityId))
                        .limit(1);

                    const treatmentOption = ctx.metadata?.treatmentOption || assessment?.treatmentOption;
                    const recommendedActions = ctx.metadata?.recommendedActions || assessment?.recommendedActions;

                    if (!treatmentOption || !recommendedActions) {
                        return {
                            allowed: false,
                            reason: 'Risk assessment must have treatment option and recommended actions before approval'
                        };
                    }
                    return { allowed: true };
                }
            }
        ],
        sideEffects: [
            {
                name: 'complete_review_work_items',
                execute: async (ctx) => {
                    const db = await getDb();
                    await db.update(workItems)
                        .set({
                            status: 'completed',
                            completedAt: new Date()
                        })
                        .where(and(
                            eq(workItems.entityType, 'risk'),
                            eq(workItems.entityId, ctx.entityId),
                            eq(workItems.type, 'risk_review'),
                            eq(workItems.status, 'pending')
                        ));
                }
            },
            {
                name: 'schedule_review_reminder',
                execute: async (_ctx) => {
                    const db = await getDb();
                    const [assessment] = await db.select().from(riskAssessments)
                        .where(eq(riskAssessments.id, _ctx.entityId))
                        .limit(1);

                    if (assessment?.nextReviewDate) {
                        await db.insert(workItems).values({
                            clientId: _ctx.clientId,
                            type: 'risk_review',
                            title: `Review Risk: ${assessment?.title || assessment?.assessmentId}`,
                            description: `Scheduled risk review based on next review date`,
                            entityType: 'risk',
                            entityId: _ctx.entityId,
                            priority: 'medium',
                            dueDate: assessment.nextReviewDate,
                            createdBy: _ctx.userId,
                        });
                    }
                }
            }
        ]
    }
};

// ==========================================
// BCP Plan Workflow
// ==========================================

const bcpTransitions: Record<string, StateTransition> = {
    'draft_to_review': {
        from: ['draft'],
        to: 'review',
        guards: [
            {
                name: 'has_content',
                check: async (ctx) => {
                    const db = await getDb();
                    const [plan] = await db.select().from(bcPlans)
                        .where(eq(bcPlans.id, ctx.entityId))
                        .limit(1);

                    const content = ctx.metadata?.content || plan?.content;

                    if (!content || content.trim().length < 100) {
                        return { allowed: false, reason: 'BCP plan must have substantial content (min 100 characters)' };
                    }
                    return { allowed: true };
                }
            }
        ],
        sideEffects: [
            {
                name: 'create_review_work_item',
                execute: async (ctx) => {
                    const db = await getDb();
                    const [plan] = await db.select().from(bcPlans)
                        .where(eq(bcPlans.id, ctx.entityId))
                        .limit(1);

                    await db.insert(workItems).values({
                        clientId: ctx.clientId,
                        type: 'bcp_approval',
                        title: `Review BCP Plan: ${plan?.title}`,
                        description: `BCP plan "${plan?.title}" has been submitted for review`,
                        entityType: 'bcp_plan',
                        entityId: ctx.entityId,
                        priority: 'medium',
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                        createdBy: ctx.userId,
                    });
                }
            }
        ]
    },
    'review_to_approved': {
        from: ['review'],
        to: 'approved',
        guards: [
            {
                name: 'has_stakeholders',
                check: async () => {
                    // In a real implementation, check for plan stakeholders/contacts
                    // For now, we'll allow it
                    return { allowed: true };
                }
            }
        ],
        sideEffects: [
            {
                name: 'complete_review_work_items',
                execute: async (ctx) => {
                    const db = await getDb();
                    await db.update(workItems)
                        .set({
                            status: 'completed',
                            completedAt: new Date()
                        })
                        .where(and(
                            eq(workItems.entityType, 'bcp_plan'),
                            eq(workItems.entityId, ctx.entityId),
                            eq(workItems.type, 'bcp_approval'),
                            eq(workItems.status, 'pending')
                        ));
                }
            }
        ]
    },
    'approved_to_active': {
        from: ['approved'],
        to: 'active',
        sideEffects: [
            {
                name: 'schedule_test_reminder',
                execute: async (ctx) => {
                    const db = await getDb();
                    await db.insert(workItems).values({
                        clientId: ctx.clientId,
                        type: 'control_assessment',
                        title: `Test BCP Plan: ${ctx.entityId}`,
                        description: `Scheduled BCP plan test - recommended within 12 months of activation`,
                        entityType: 'bcp_plan',
                        entityId: ctx.entityId,
                        priority: 'medium',
                        dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                        createdBy: ctx.userId,
                    });
                }
            }
        ]
    },
    'active_to_tested': {
        from: ['active'],
        to: 'tested',
        guards: [
            {
                name: 'has_test_date',
                check: async (ctx) => {
                    const db = await getDb();
                    const [plan] = await db.select().from(bcPlans)
                        .where(eq(bcPlans.id, ctx.entityId))
                        .limit(1);

                    const lastTestedDate = ctx.metadata?.lastTestedDate || plan?.lastTestedDate;

                    if (!lastTestedDate) {
                        return {
                            allowed: false,
                            reason: 'BCP plan must have a last tested date before marking as tested'
                        };
                    }
                    return { allowed: true };
                }
            }
        ],
        sideEffects: [
            {
                name: 'update_next_test_date',
                execute: async (ctx) => {
                    const db = await getDb();
                    const [plan] = await db.select().from(bcPlans)
                        .where(eq(bcPlans.id, ctx.entityId))
                        .limit(1);

                    if (plan) {
                        const nextTestDate = new Date(plan.lastTestedDate);
                        nextTestDate.setFullYear(nextTestDate.getFullYear() + 1); // Annual testing

                        await db.update(bcPlans)
                            .set({ nextTestDate })
                            .where(eq(bcPlans.id, ctx.entityId));
                    }
                }
            },
            {
                name: 'create_next_test_task',
                execute: async (ctx) => {
                    const db = await getDb();
                    const [plan] = await db.select().from(bcPlans)
                        .where(eq(bcPlans.id, ctx.entityId))
                        .limit(1);

                    if (plan?.nextTestDate) {
                        await db.insert(workItems).values({
                            clientId: ctx.clientId,
                            type: 'control_assessment',
                            title: `Annual BCP Test: ${plan.title}`,
                            description: `Scheduled annual BCP plan test`,
                            entityType: 'bcp_plan',
                            entityId: ctx.entityId,
                            priority: 'medium',
                            dueDate: plan.nextTestDate,
                            createdBy: ctx.userId,
                        });
                    }
                }
            }
        ]
    },
    'tested_to_active': {
        from: ['tested'],
        to: 'active',
        sideEffects: []
    }
};

// ==========================================
// Workflow Engine
// ==========================================

export class WorkflowEngine {
    private static getTransitions(entityType: EntityType): Record<string, StateTransition> {
        switch (entityType) {
            case 'policy':
                return policyTransitions;
            case 'control':
                return controlTransitions;
            case 'risk':
                return riskTransitions;
            case 'bcp_plan':
                return bcpTransitions;
            case 'roadmap':
                return roadmapTransitions;
            case 'implementation_plan':
                return implementationPlanTransitions;
            default:
                return {};
        }
    }

    /**
     * Preview a transition without executing it
     */
    static async previewTransition(context: TransitionContext): Promise<{
        allowed: boolean;
        reasons: string[];
        sideEffects: string[];
    }> {
        const transitions = this.getTransitions(context.entityType);
        const transition = this.findTransition(transitions, context.fromStatus, context.toStatus);

        if (!transition) {
            return {
                allowed: false,
                reasons: [`No transition defined from ${context.fromStatus} to ${context.toStatus}`],
                sideEffects: []
            };
        }

        const reasons: string[] = [];
        let allowed = true;

        // Check guards
        if (transition.guards) {
            for (const guard of transition.guards) {
                const result = await guard.check(context);
                if (!result.allowed) {
                    allowed = false;
                    reasons.push(result.reason || `Guard ${guard.name} failed`);
                }
            }
        }

        const sideEffects = transition.sideEffects?.map(se => se.name) || [];

        return { allowed, reasons, sideEffects };
    }

    /**
     * Apply a state transition
     */
    static async applyTransition(context: TransitionContext): Promise<{
        success: boolean;
        error?: string;
        newStatus?: WorkflowStatus;
    }> {
        const transitions = this.getTransitions(context.entityType);
        const transition = this.findTransition(transitions, context.fromStatus, context.toStatus);

        if (!transition) {
            return {
                success: false,
                error: `No transition defined from ${context.fromStatus} to ${context.toStatus}`
            };
        }

        // Check guards
        if (transition.guards) {
            for (const guard of transition.guards) {
                const result = await guard.check(context);
                if (!result.allowed) {
                    return {
                        success: false,
                        error: result.reason || `Guard ${guard.name} failed`
                    };
                }
            }
        }

        try {
            const db = await getDb();

            // Update entity status
            await this.updateEntityStatus(context.entityType, context.entityId, transition.to);

            // Log governance event
            await db.insert(governanceEvents).values({
                clientId: context.clientId,
                entityType: context.entityType,
                entityId: context.entityId,
                entityName: context.metadata?.entityName || `${context.entityType} ${context.entityId}`,
                eventType: 'status_change',
                fromState: context.fromStatus,
                toState: transition.to,
                action: 'transition',
                actorUserId: context.userId,
                actorName: context.userName,
                metadata: context.metadata
            });

            // Execute side effects
            if (transition.sideEffects) {
                for (const sideEffect of transition.sideEffects) {
                    await sideEffect.execute(context);
                }
            }

            // Log to audit trail
            await logActivity({
                clientId: context.clientId,
                userId: context.userId,
                action: 'update' as const,
                entityType: context.entityType,
                entityId: context.entityId,
                details: {
                    action: 'workflow_transition',
                    fromStatus: context.fromStatus,
                    toStatus: transition.to,
                    metadata: context.metadata
                }
            });

            return {
                success: true,
                newStatus: transition.to
            };
        } catch (error) {
            console.error('Workflow transition error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during transition'
            };
        }
    }

    private static findTransition(
        transitions: Record<string, StateTransition>,
        from: WorkflowStatus,
        to: WorkflowStatus
    ): StateTransition | null {
        for (const transition of Object.values(transitions)) {
            if (transition.from.includes(from) && transition.to === to) {
                return transition;
            }
        }
        return null;
    }

    private static async updateEntityStatus(
        entityType: EntityType,
        entityId: number,
        newStatus: WorkflowStatus
    ): Promise<void> {
        const db = await getDb();

        switch (entityType) {
            case 'policy':
                await db.update(clientPolicies)
                    .set({ status: newStatus as PolicyStatus, updatedAt: new Date() })
                    .where(eq(clientPolicies.id, entityId));
                break;
            case 'control':
                await db.update(clientControls)
                    .set({ status: newStatus as ControlStatus, updatedAt: new Date() })
                    .where(eq(clientControls.id, entityId));
                break;
            case 'risk':
                await db.update(riskAssessments)
                    .set({ status: newStatus as RiskStatus, updatedAt: new Date() })
                    .where(eq(riskAssessments.id, entityId));
                break;
            case 'bcp_plan':
                await db.update(bcPlans)
                    .set({ status: newStatus as BcpStatus, updatedAt: new Date() })
                    .where(eq(bcPlans.id, entityId));
                break;
            case 'roadmap':
                await db.update(roadmaps)
                    .set({ status: newStatus as RoadmapStatus, updatedAt: new Date() })
                    .where(eq(roadmaps.id, entityId));
                break;
            case 'implementation_plan':
                await db.update(implementationPlans)
                    .set({ status: newStatus as ImplementationStatus, updatedAt: new Date() })
                    .where(eq(implementationPlans.id, entityId));
                break;
            default:
                throw new Error(`Unsupported entity type: ${entityType}`);
        }
    }
}
