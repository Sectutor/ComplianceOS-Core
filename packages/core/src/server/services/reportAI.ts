import { llmService } from "../../lib/llm/service";

export interface AIReportContext {
    client: any;
    roadmap?: any;
    milestones?: any[];
    tasks?: any[];
    gaps?: any[];
    risks?: any[];
}

/**
 * Generate AI insights for a specific section
 */
export async function generateAIContent(section: string, data: any): Promise<string> {
    try {
        console.log(`[ReportAI] Generating content for section: ${section}`);
        const response = await llmService.generate({
            systemPrompt: "You are a Senior Strategic Advisor. Provide a sharp, high-level strategic commentary (Exactly 2 paragraphs). Focus on the 'The Bottom Line' for executive stakeholders. Professional, direct, and insight-driven.",
            userPrompt: `Section: ${section}\nData Summary:\n${JSON.stringify(data, null, 2)}`,
            temperature: 0.3,
            maxTokens: 500
        });
        return response.text;
    } catch (error) {
        console.error(`[ReportAI] Error generating AI content for ${section}:`, error);
        return "Strategic analysis is currently being finalized based on mission-critical data streams.";
    }
}

/**
 * Generate a professional section introduction
 */
export async function generateSectionIntro(sectionId: string, context: any): Promise<string> {
    try {
        console.log(`[ReportAI] Generating intro for section: ${sectionId}`);
        const response = await llmService.generate({
            systemPrompt: "Generate a one-paragraph professional executive introduction for this compliance report section. Tone: Sharp, Strategic, Objective.",
            userPrompt: `Section: ${sectionId}\nContext:\n${JSON.stringify(context, null, 2)}`,
            temperature: 0.3,
            maxTokens: 300
        });
        return response.text;
    } catch (error) {
        console.error(`[ReportAI] Error generating section intro for ${sectionId}:`, error);
        return "";
    }
}
