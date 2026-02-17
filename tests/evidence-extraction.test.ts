/**
 * Unit tests for AI Evidence Extraction
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractEvidenceMetadata, suggestEvidenceTypes } from '../lib/evidence/extraction';
import { llmService } from '../lib/llm/service';

// Mock LLM service
vi.mock('../lib/llm/service', () => ({
    llmService: {
        generate: vi.fn(),
    },
}));

describe('Evidence Extraction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('extractEvidenceMetadata', () => {
        it('should extract metadata from configuration file', async () => {
            // Mock LLM response
            const mockResponse = {
                text: JSON.stringify({
                    classification: 'configuration',
                    summary: 'MFA configuration for access control',
                    keyFindings: ['MFA enabled', 'TOTP method configured'],
                    verificationSteps: ['Verify MFA is enforced', 'Test with test user'],
                    relevantControls: ['AC-1', 'AC-2'],
                    confidence: 0.92,
                }),
                provider: 'openai',
                model: 'gpt-4',
            };

            vi.mocked(llmService.generate).mockResolvedValue(mockResponse);

            const result = await extractEvidenceMetadata({
                fileName: 'mfa-config.json',
                fileType: 'application/json',
                textContent: '{"mfa": {"enabled": true, "method": "totp"}}',
                controlContext: {
                    controlId: 'AC-1',
                    controlName: 'Access Control Policy',
                    framework: 'ISO 27001',
                },
            });

            expect(result.classification).toBe('configuration');
            expect(result.summary).toContain('MFA');
            expect(result.keyFindings).toHaveLength(2);
            expect(result.verificationSteps).toHaveLength(2);
            expect(result.relevantControls).toContain('AC-1');
            expect(result.confidence).toBeGreaterThan(0.9);
        });

        it('should return fallback on LLM failure', async () => {
            vi.mocked(llmService.generate).mockRejectedValue(new Error('LLM error'));

            const result = await extractEvidenceMetadata({
                fileName: 'test.pdf',
                fileType: 'application/pdf',
            });

            expect(result.classification).toBe('other');
            expect(result.confidence).toBeLessThan(0.5);
            expect(result.verificationSteps).toContain('Manual review required');
        });

        it('should validate response against Zod schema', async () => {
            const invalidResponse = {
                text: JSON.stringify({
                    classification: 'invalid-type', // Invalid enum value
                    summary: 'Test',
                    keyFindings: [],
                    verificationSteps: [],
                    relevantControls: [],
                    confidence: 0.5,
                }),
                provider: 'openai',
                model: 'gpt-4',
            };

            vi.mocked(llmService.generate).mockResolvedValue(invalidResponse);

            const result = await extractEvidenceMetadata({
                fileName: 'test.txt',
                fileType: 'text/plain',
            });

            // Should return fallback due to validation error
            expect(result.classification).toBe('other');
        });
    });

    describe('suggestEvidenceTypes', () => {
        it('should suggest relevant evidence types for control', async () => {
            const mockResponse = {
                text: JSON.stringify([
                    'Access control logs',
                    'MFA configuration screenshots',
                    'User access review reports',
                    'Role assignment documentation',
                    'Audit trail exports',
                ]),
                provider: 'openai',
                model: 'gpt-4',
            };

            vi.mocked(llmService.generate).mockResolvedValue(mockResponse);

            const suggestions = await suggestEvidenceTypes(
                'AC-1',
                'Access Control Policy',
                'ISO 27001'
            );

            expect(suggestions).toHaveLength(5);
            expect(suggestions[0]).toContain('Access control');
            expect(suggestions).toContain('MFA configuration screenshots');
        });

        it('should return fallback suggestions on error', async () => {
            vi.mocked(llmService.generate).mockRejectedValue(new Error('Error'));

            const suggestions = await suggestEvidenceTypes('AC-1', 'Test', 'ISO 27001');

            expect(suggestions).toHaveLength(5);
            expect(suggestions).toContain('Configuration screenshots');
        });
    });
});
