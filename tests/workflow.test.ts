import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowEngine, TransitionContext } from '../lib/governance/workflow';

describe('WorkflowEngine', () => {
    const mockContext: TransitionContext = {
        entityType: 'policy',
        entityId: 1,
        clientId: 1,
        fromStatus: 'draft',
        toStatus: 'review',
        userId: 1,
        userName: 'Test User',
        metadata: { entityName: 'Test Policy' }
    };

    describe('Risk Workflow', () => {
        it('should validate draft to reviewed transition with assessment data', async () => {
            const riskContext: TransitionContext = {
                entityType: 'risk',
                entityId: 1,
                clientId: 1,
                fromStatus: 'draft',
                toStatus: 'reviewed',
                userId: 1,
                userName: 'Test User',
                metadata: {
                    entityName: 'Test Risk Assessment',
                    likelihood: 'Medium',
                    impact: 'High',
                    inherentRisk: 'High'
                }
            };

            const result = await WorkflowEngine.previewTransition(riskContext);

            expect(result.allowed).toBe(true);
            expect(result.sideEffects).toContain('create_review_work_item');
        });

        it('should prevent draft to reviewed transition without assessment data', async () => {
            const riskContext: TransitionContext = {
                entityType: 'risk',
                entityId: 1,
                clientId: 1,
                fromStatus: 'draft',
                toStatus: 'reviewed',
                userId: 1,
                userName: 'Test User',
                metadata: {
                    entityName: 'Test Risk Assessment',
                    likelihood: null,
                    impact: null,
                    inherentRisk: null
                }
            };

            const result = await WorkflowEngine.previewTransition(riskContext);

            expect(result.allowed).toBe(false);
            expect(result.reasons).toContain('Risk assessment must have likelihood, impact, and inherent risk evaluated before review');
        });

        it('should validate reviewed to approved transition with treatment plan', async () => {
            const riskContext: TransitionContext = {
                entityType: 'risk',
                entityId: 1,
                clientId: 1,
                fromStatus: 'reviewed',
                toStatus: 'approved',
                userId: 1,
                userName: 'Test User',
                metadata: {
                    entityName: 'Test Risk Assessment',
                    treatmentOption: 'Mitigate',
                    recommendedActions: 'Implement new controls'
                }
            };

            const result = await WorkflowEngine.previewTransition(riskContext);

            expect(result.allowed).toBe(true);
            expect(result.sideEffects).toContain('complete_review_work_items');
            expect(result.sideEffects).toContain('schedule_review_reminder');
        });

        it('should have no transition for approved to closed', async () => {
            const riskContext: TransitionContext = {
                entityType: 'risk',
                entityId: 1,
                clientId: 1,
                fromStatus: 'approved',
                toStatus: 'closed',
                userId: 1,
                userName: 'Test User'
            };

            const result = await WorkflowEngine.previewTransition(riskContext);

            expect(result.allowed).toBe(false);
            expect(result.reasons[0]).toContain('No transition defined from approved to closed');
        });
    });

    describe('BCP Plan Workflow', () => {
        it('should validate draft to review transition with content', async () => {
            const bcpContext: TransitionContext = {
                entityType: 'bcp_plan',
                entityId: 1,
                clientId: 1,
                fromStatus: 'draft',
                toStatus: 'review',
                userId: 1,
                userName: 'Test User',
                metadata: {
                    entityName: 'Test BCP Plan',
                    content: 'This is a comprehensive business continuity plan...'.repeat(10)
                }
            };

            const result = await WorkflowEngine.previewTransition(bcpContext);

            expect(result.allowed).toBe(true);
            expect(result.sideEffects).toContain('create_review_work_item');
        });

        it('should prevent draft to review transition without sufficient content', async () => {
            const bcpContext: TransitionContext = {
                entityType: 'bcp_plan',
                entityId: 1,
                clientId: 1,
                fromStatus: 'draft',
                toStatus: 'review',
                userId: 1,
                userName: 'Test User',
                metadata: {
                    entityName: 'Test BCP Plan',
                    content: 'Short'
                }
            };

            const result = await WorkflowEngine.previewTransition(bcpContext);

            expect(result.allowed).toBe(false);
            expect(result.reasons).toContain('BCP plan must have substantial content (min 100 characters)');
        });

        it('should validate review to approved transition', async () => {
            const bcpContext: TransitionContext = {
                entityType: 'bcp_plan',
                entityId: 1,
                clientId: 1,
                fromStatus: 'review',
                toStatus: 'approved',
                userId: 1,
                userName: 'Test User',
                metadata: {
                    entityName: 'Test BCP Plan'
                }
            };

            const result = await WorkflowEngine.previewTransition(bcpContext);

            expect(result.allowed).toBe(true);
            expect(result.sideEffects).toContain('complete_review_work_items');
        });

        it('should validate approved to active transition', async () => {
            const bcpContext: TransitionContext = {
                entityType: 'bcp_plan',
                entityId: 1,
                clientId: 1,
                fromStatus: 'approved',
                toStatus: 'active',
                userId: 1,
                userName: 'Test User',
                metadata: {
                    entityName: 'Test BCP Plan'
                }
            };

            const result = await WorkflowEngine.previewTransition(bcpContext);

            expect(result.allowed).toBe(true);
            expect(result.sideEffects).toContain('schedule_test_reminder');
        });

        it('should prevent active to tested transition without test date', async () => {
            const bcpContext: TransitionContext = {
                entityType: 'bcp_plan',
                entityId: 1,
                clientId: 1,
                fromStatus: 'active',
                toStatus: 'tested',
                userId: 1,
                userName: 'Test User',
                metadata: {
                    entityName: 'Test BCP Plan',
                    lastTestedDate: null
                }
            };

            const result = await WorkflowEngine.previewTransition(bcpContext);

            expect(result.allowed).toBe(false);
            expect(result.reasons).toContain('BCP plan must have a last tested date before marking as tested');
        });

        it('should validate active to tested transition with test date', async () => {
            const bcpContext: TransitionContext = {
                entityType: 'bcp_plan',
                entityId: 1,
                clientId: 1,
                fromStatus: 'active',
                toStatus: 'tested',
                userId: 1,
                userName: 'Test User',
                metadata: {
                    entityName: 'Test BCP Plan',
                    lastTestedDate: new Date('2024-01-15')
                }
            };

            const result = await WorkflowEngine.previewTransition(bcpContext);

            expect(result.allowed).toBe(true);
            expect(result.sideEffects).toContain('update_next_test_date');
            expect(result.sideEffects).toContain('create_next_test_task');
        });

        it('should allow tested to active transition (revert)', async () => {
            const bcpContext: TransitionContext = {
                entityType: 'bcp_plan',
                entityId: 1,
                clientId: 1,
                fromStatus: 'tested',
                toStatus: 'active',
                userId: 1,
                userName: 'Test User',
                metadata: {
                    entityName: 'Test BCP Plan'
                }
            };

            const result = await WorkflowEngine.previewTransition(bcpContext);

            expect(result.allowed).toBe(true);
            expect(result.sideEffects.length).toBe(0);
        });
    });

    describe('Transition Guards', () => {
        it('should reject invalid status transitions', async () => {
            const invalidContext: TransitionContext = {
                entityType: 'policy',
                entityId: 1,
                clientId: 1,
                fromStatus: 'draft',
                toStatus: 'approved',
                userId: 1,
                userName: 'Test User'
            };

            const result = await WorkflowEngine.previewTransition(invalidContext);

            expect(result.allowed).toBe(false);
        });

        it('should reject unsupported entity types', async () => {
            const invalidContext: TransitionContext = {
                entityType: 'invalid_entity' as any,
                entityId: 1,
                clientId: 1,
                fromStatus: 'draft',
                toStatus: 'review',
                userId: 1,
                userName: 'Test User'
            };

            const result = await WorkflowEngine.previewTransition(invalidContext);

            expect(result.sideEffects.length).toBe(0);
        });
    });
});
