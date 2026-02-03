import { z } from 'zod';
import { llmService } from '../llm/service';
import { logger } from '../logger';
// import * as pdfLib from 'pdf-parse';
// const pdf = (pdfLib as any).default || pdfLib;

const classificationSchema = z.object({
    classification: z.string(),
    reasoning: z.string(),
    suggestedControlId: z.string().optional(),
    confidence: z.number().min(0).max(100),
    suggestedTitle: z.string().optional()
});

export async function classifyIntakeItem(filename: string, clientId: number, fileBuffer?: Buffer) {
    let extractedText = "";

    if (fileBuffer && filename.toLowerCase().endsWith('.pdf')) {
        try {
            // const data = await pdf(fileBuffer);
            // extractedText = data.text;
            // logger.info(`Extracted ${extractedText.length} characters from ${filename}`);
            logger.warn('PDF parsing temporarily disabled to fix server crash');
        } catch (e) {
            logger.error(`Failed to parse PDF ${filename}: ${e}`);
        }
    }

    const systemPrompt = `You are a Compliance Advisor AI. Your task is to classify "evidence receipts" that users have uploaded to their intake box.
Predict what kind of compliance evidence this is based on the filename and any extracted text content provided.
If extracted text is present, favor it over the filename.

Available Classifications:
- Access Control Evidence (MFA screenshots, User logs)
- Policy Document (Handbooks, Security policies)
- Technical Configuration (Firewall rules, Cloud configs)
- Human Resources (Background checks, Training records)
- Financial Record (Invoices, Receipts)
- Meeting Minutes (Management reviews, Board meetings)
- Other (General office files)

Respond in JSON format with:
- classification: The category name
- reasoning: Why you chose this (cite specific keywords seen in the text if available)
- suggestedControlId: (Optional) A standard control ID like AC-1, PE-3, etc.
- confidence: 0-100 score
- suggestedTitle: A cleaner, more professional name for this evidence record.`;

    const userPrompt = `Classify this file for Client ID ${clientId}:
Filename: ${filename}
${extractedText ? `--- EXTRACTED TEXT CONTENT (First 3000 chars) ---
${extractedText.substring(0, 3000)}
--- END TEXT CONTENT ---` : "No text content available for this file type or extraction failed."}`;
    try {
        const response = await llmService.generate({
            systemPrompt,
            userPrompt,
            jsonMode: true,
            schema: classificationSchema,
            feature: 'intake_triage'
        }, { clientId, endpoint: 'classify_intake' });

        return classificationSchema.parse(JSON.parse(response.text));
    } catch (error) {
        logger.error(`Failed to classify intake item: ${error}`);
        return {
            classification: 'Other',
            reasoning: 'AI Triage failed to process this file.',
            confidence: 0
        };
    }
}
