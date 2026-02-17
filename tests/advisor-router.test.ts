/**
 * Integration tests for Advisor Router
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import { createContext } from '../context';

describe('Advisor Router Integration', () => {
    let caller: any;

    beforeAll(async () => {
        // Create test context with mock user
        const ctx = await createContext({
            req: {
                user: { id: 1, clientId: 1, role: 'admin' },
            } as any,
            res: {} as any,
        });

        caller = appRouter.createCaller(ctx);
    });

    describe('suggestTechnologies', () => {
        it('should return technology suggestions for control', async () => {
            const result = await caller.advisor.suggestTechnologies({
                clientId: 1,
                controlId: 1,
                vendorPreference: 'Okta',
                budgetConstraint: 'medium',
            });

            expect(result).toHaveProperty('contextSummary');
            expect(result).toHaveProperty('suggestions');
            expect(Array.isArray(result.suggestions)).toBe(true);

            if (result.suggestions.length > 0) {
                const suggestion = result.suggestions[0];
                expect(suggestion).toHaveProperty('name');
                expect(suggestion).toHaveProperty('vendor');
                expect(suggestion).toHaveProperty('pros');
                expect(suggestion).toHaveProperty('cons');
                expect(suggestion).toHaveProperty('effort');
                expect(suggestion).toHaveProperty('confidence');
            }
        });

        it('should handle missing control gracefully', async () => {
            await expect(
                caller.advisor.suggestTechnologies({
                    clientId: 1,
                    controlId: 99999,
                })
            ).rejects.toThrow();
        });
    });

    describe('implementationPlan', () => {
        it('should generate implementation plan', async () => {
            const result = await caller.advisor.implementationPlan({
                clientId: 1,
                controlId: 1,
                selectedTech: 'Okta',
            });

            expect(result).toHaveProperty('estimatedDuration');
            expect(result).toHaveProperty('prerequisites');
            expect(result).toHaveProperty('steps');
            expect(Array.isArray(result.steps)).toBe(true);

            if (result.steps.length > 0) {
                const step = result.steps[0];
                expect(step).toHaveProperty('order');
                expect(step).toHaveProperty('title');
                expect(step).toHaveProperty('description');
                expect(step).toHaveProperty('estimatedDuration');
            }
        });
    });

    describe('askQuestion', () => {
        it('should answer contextual question', async () => {
            const result = await caller.advisor.askQuestion({
                clientId: 1,
                question: 'How do I implement MFA?',
                context: {
                    type: 'control',
                    id: '1',
                },
            });

            expect(result).toHaveProperty('answer');
            expect(result.answer).toBeTruthy();
            expect(result.answer.length).toBeGreaterThan(10);
        });

        it('should work without context', async () => {
            const result = await caller.advisor.askQuestion({
                clientId: 1,
                question: 'What is ISO 27001?',
            });

            expect(result).toHaveProperty('answer');
            expect(result.answer).toContain('ISO');
        });
    });

    describe('explainMapping', () => {
        it('should explain regulation mapping', async () => {
            const result = await caller.advisor.explainMapping({
                clientId: 1,
                regulationId: 'GDPR',
                articleId: 'Art-32',
            });

            expect(result).toHaveProperty('explanation');
            expect(result).toHaveProperty('mappedControls');
            expect(result).toHaveProperty('gaps');
        });
    });

    describe('vendorMitigationPlan', () => {
        it('should generate vendor mitigation plan', async () => {
            const result = await caller.advisor.vendorMitigationPlan({
                clientId: 1,
                vendorId: 1,
            });

            expect(result).toHaveProperty('vendorName');
            expect(result).toHaveProperty('riskScore');
            expect(result).toHaveProperty('mitigationSteps');
            expect(result).toHaveProperty('estimatedTimeline');
        });
    });
});
