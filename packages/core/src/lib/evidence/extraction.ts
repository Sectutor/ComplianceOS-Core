/**
 * AI Evidence Extraction Service
 * Automatically classifies, summarizes, and extracts verification steps from uploaded evidence files
 */

import { llmService } from '../llm/service';
import { generateEmbedding } from "../advisor/embeddings";
import { getDb } from '../../db';
import { embeddings } from '../../schema';
import { logger } from '../logger';
import { z } from 'zod';

// Zod schema for structured evidence extraction
const EvidenceExtractionSchema = z.object({
    classification: z.enum(['screenshot', 'configuration', 'report', 'certificate', 'log', 'document', 'other']),
    summary: z.string().min(10).max(500),
    keyFindings: z.array(z.string()).max(10),
    verificationSteps: z.array(z.string()).max(5),
    relevantControls: z.array(z.string()).max(10),
    confidence: z.number().min(0).max(1),
});

export type EvidenceExtraction = z.infer<typeof EvidenceExtractionSchema>;

export interface ExtractEvidenceOptions {
    fileName: string;
    fileType: string;
    textContent?: string; // Extracted text from file (OCR, PDF parsing, etc.)
    controlContext?: {
        controlId: string;
        controlName: string;
        framework: string;
    };
}

/**
 * Extract metadata and insights from evidence file
 */
export async function extractEvidenceMetadata(
    options: ExtractEvidenceOptions
): Promise<EvidenceExtraction> {
    const { fileName, fileType, textContent, controlContext } = options;

    // Build context for LLM
    const contextInfo = controlContext
        ? `This evidence is for control ${controlContext.controlId} (${controlContext.controlName}) in ${controlContext.framework}.`
        : 'This is general compliance evidence.';

    const prompt = `
Analyze the following evidence file and extract structured metadata:

File Name: ${fileName}
File Type: ${fileType}
${textContent ? `Extracted Text Content:\n${textContent.substring(0, 2000)}` : 'No text content available'}

${contextInfo}

Extract the following information in JSON format:
1. classification: Type of evidence (screenshot, configuration, report, certificate, log, document, other)
2. summary: Brief summary of what this evidence demonstrates (10-500 characters)
3. keyFindings: List of key findings or important details (max 10 items)
4. verificationSteps: Suggested steps to verify this evidence (max 5 items)
5. relevantControls: List of control IDs this evidence might be relevant to (max 10)
6. confidence: Your confidence in this analysis (0-1)

Return ONLY valid JSON matching this structure:
{
  "classification": "screenshot|configuration|report|certificate|log|document|other",
  "summary": "Brief summary here",
  "keyFindings": ["Finding 1", "Finding 2"],
  "verificationSteps": ["Step 1", "Step 2"],
  "relevantControls": ["AC-1", "AC-2"],
  "confidence": 0.85
}
`;

    try {
        const response = await llmService.generate({
            systemPrompt: 'You are an expert compliance auditor analyzing evidence files. Always return valid JSON.',
            userPrompt: prompt,
            temperature: 0.3,
            jsonMode: true,
            schema: EvidenceExtractionSchema,
        });

        // Parse and validate response
        const parsed = JSON.parse(response.text);
        const validated = EvidenceExtractionSchema.parse(parsed);

        return validated;

    } catch (error: any) {
        logger.error('Evidence extraction failed:', error);

        // Return fallback extraction
        return {
            classification: 'other',
            summary: `Evidence file: ${fileName}`,
            keyFindings: [],
            verificationSteps: ['Manual review required'],
            relevantControls: controlContext ? [controlContext.controlId] : [],
            confidence: 0.3,
        };
    }
}

/**
 * Store evidence summary as embedding for RAG retrieval
 */
export async function indexEvidenceForRAG(
    evidenceId: string,
    extraction: EvidenceExtraction,
    clientId: number,
    fileName: string
): Promise<void> {
    const db = await getDb();
    if (!db) {
        logger.warn('Database unavailable, skipping evidence indexing');
        return;
    }

    try {
        // Create searchable text from extraction
        const searchableText = `
Evidence: ${fileName}
Classification: ${extraction.classification}
Summary: ${extraction.summary}
Key Findings: ${extraction.keyFindings.join(', ')}
Relevant Controls: ${extraction.relevantControls.join(', ')}
        `.trim();

        // Generate embedding
        const { embedding } = await generateEmbedding(searchableText);

        // Store in embeddings table
        await db.insert(embeddings).values({
            clientId,
            docId: evidenceId,
            docType: 'evidence',
            content: searchableText,
            embeddingVector: embedding as any,
            embeddingData: JSON.stringify(embedding), // Fallback
            metadata: {
                fileName,
                classification: extraction.classification,
                confidence: extraction.confidence,
                relevantControls: extraction.relevantControls,
            },
        });

        logger.info(`Indexed evidence ${evidenceId} for RAG retrieval`);

    } catch (error) {
        logger.error('Failed to index evidence for RAG:', error);
    }
}

/**
 * Suggest evidence types for a control
 */
export async function suggestEvidenceTypes(
    controlId: string,
    controlName: string,
    framework: string
): Promise<string[]> {
    const prompt = `
For the following compliance control, suggest 5-7 specific types of evidence that would demonstrate compliance:

Control ID: ${controlId}
Control Name: ${controlName}
Framework: ${framework}

Return ONLY a JSON array of evidence type names, e.g.:
["Access control logs", "MFA configuration screenshots", "User access review reports"]

Be specific and actionable. Focus on evidence that auditors would accept.
`;

    try {
        const response = await llmService.generate({
            systemPrompt: 'You are a compliance auditor. Return only valid JSON arrays.',
            userPrompt: prompt,
            temperature: 0.4,
            jsonMode: true,
        });

        const text = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const suggestions = JSON.parse(text);

        return Array.isArray(suggestions) ? suggestions : [];

    } catch (error) {
        logger.error('Evidence type suggestion failed:', error);
        return [
            'Configuration screenshots',
            'Policy documents',
            'Audit logs',
            'Review reports',
            'Certificates or attestations',
        ];
    }
}
