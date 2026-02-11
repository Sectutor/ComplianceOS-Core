import { llmService } from '../llm/service';

export async function suggestTechnologies(request: {
    clientId: number;
    controlId: number;
    vendorPreference?: string;
    budgetConstraint?: string;
}) {
    const userPrompt = `I need technology suggestions for implementing a compliance control.
Control ID: ${request.controlId}
${request.vendorPreference ? `Vendor Preference: ${request.vendorPreference}` : ''}
${request.budgetConstraint ? `Budget Constraint: ${request.budgetConstraint}` : ''}

Please provide 3-5 ranked technology options with pros, cons, and implementation effort.`;

    const response = await llmService.generate({
        systemPrompt: "You are a senior compliance architect.",
        userPrompt,
        temperature: 0.3,
        feature: 'tech_suggestion'
    });

    return {
        suggestions: [], // In core, we return the text for now or simple parse
        analysis: response.text
    };
}

export async function generateImplementationPlan(request: {
    clientId: number;
    controlId: number;
    selectedTech?: string;
}) {
    const userPrompt = `Create a detailed implementation plan for control ${request.controlId}.
${request.selectedTech ? `Selected Technology: ${request.selectedTech}` : ''}

Provide a step-by-step plan with prerequisites, tasks, and estimated durations.`;

    const response = await llmService.generate({
        systemPrompt: "You are a senior compliance architect.",
        userPrompt,
        temperature: 0.4,
        feature: 'implementation_plan'
    });

    return {
        steps: [], // Simple placeholder
        plan: response.text
    };
}

export async function generateVendorMitigationPlan(request: {
    clientId: number;
    vendorId: number;
}) {
    // Basic implementation for core
    return { plan: [], strategy: "Manual Review Required" };
}

export async function explainMapping(input: any) {
    return { explanation: "AI mapping explanation is a premium feature." };
}


export async function askQuestion(request: {
    clientId: number;
    question: string;
    context?: any;
}) {
    const response = await llmService.generate({
        systemPrompt: "You are a helpful compliance advisor.",
        userPrompt: request.question,
        temperature: 0.3,
        feature: 'general_advisor'
    });

    return { answer: response.text, sources: [] };
}

export async function analyzeRisk(request: {
    threat: string;
    vulnerability: string;
    assets: string[];
}) {
    const userPrompt = `
Risk Scenario Analysis:
Threat: "${request.threat}"
Vulnerability: "${request.vulnerability}"
Affected Assets: ${request.assets.join(', ')}

Based on this context, estimate:
1. Likelihood (Rare, Unlikely, Possible, Likely, Almost Certain)
2. Impact (Low, Medium, High, Very High)
3. Inherent Risk Level (Low, Medium, High, Very High)

Provide a short reasoning (max 2 sentences).

Output as JSON:
{
  "likelihood": "String",
  "impact": "String",
  "inherentRisk": "String",
  "reasoning": "String"
}`;

    const response = await llmService.generate({
        systemPrompt: "You are a risk management expert.",
        userPrompt,
        temperature: 0.2,
        jsonMode: true,
        feature: 'risk_analysis'
    });

    try {
        return JSON.parse(response.text);
    } catch (e) {
        return {
            likelihood: 'Possible',
            impact: 'Medium',
            inherentRisk: 'Medium',
            reasoning: 'AI analysis failed to parse. Defaulting to medium.'
        };
    }
}

export async function reindexKnowledgeBase(input: any) {
    console.warn('AI features are available in the Premium edition.');
    return { success: false, message: "Premium feature required." };
}

export async function generateRiskMitigationPlan(request: {
    riskTitle: string;
    riskDescription: string;
    riskContext?: string;
    currentMitigations?: string[];
}) {
    const systemPrompt = `You are a senior cybersecurity architect and risk manager.
Your task is to generate a comprehensive, actionable mitigation plan for a specific risk.
The output must be formatted as HTML content suitable for a rich text editor (using <h3>, <p>, <ul>, <li>, <strong> tags).
Do NOT include <html>, <body>, or markdown code blocks (like \`\`\`html). Just the raw HTML content.
Focus on:
1. Technical controls (what to implement)
2. Process controls (policies, reviews)
3. Verification steps (how to test)
`;

    const userPrompt = `
Risk: ${request.riskTitle}
Description: ${request.riskDescription}
Context: ${request.riskContext || 'General System'}
${request.currentMitigations?.length ? `Current Planned Mitigations: ${request.currentMitigations.join(', ')}` : ''}

Please provide a detailed mitigation plan.
`;

    const response = await llmService.generate({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
        feature: 'risk_mitigation'
    });

    // Strip markdown code blocks if present
    const cleanResponse = (response.text || '')
        .replace(/^```html\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '');

    return {
        mitigationPlan: cleanResponse || '<p>Failed to generate plan.</p>'
    };
}

export async function generateBcpContent(input: any) {
    console.warn('AI features are available in the Premium edition.');
    return "";
}
