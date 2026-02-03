import { llmService } from '../llm/service';
import { getDb } from '../../db';
import { controls, riskAssessments, riskTreatments, riskPolicyMappings } from '../../schema';
import { eq, and, isNull, or, sql } from 'drizzle-orm';

export interface ControlSuggestion {
    controlId: string;
    controlName: string;
    framework: string;
    relevanceScore: number;
    rationale: string;
    implementationTips?: string;
}

export interface GapAnalysisResult {
    riskId: number;
    assessmentId: string;
    threatDescription: string;
    vulnerabilityDescription: string;
    inherentRisk: string;
    residualRisk: string;
    priority: string;
    treatmentCount: number;
    gapSeverity: 'critical' | 'high' | 'medium' | 'low';
    recommendation: string;
}

export interface AITreatmentSuggestion {
    treatmentType: 'mitigate' | 'transfer' | 'accept' | 'avoid';
    strategy: string;
    suggestedControls: ControlSuggestion[];
    estimatedEffort: 'low' | 'medium' | 'high';
    justification: string;
}

/**
 * Generate AI-powered control suggestions based on threat and vulnerability
 */
export async function generateControlSuggestions(
    threatDescription: string,
    vulnerabilityDescription: string,
    existingControls?: string[],
    framework?: string
): Promise<ControlSuggestion[]> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Fetch available controls
    const availableControls = await db.select({
        controlId: controls.controlId,
        name: controls.name,
        description: controls.description,
        framework: controls.framework,
        category: controls.category,
    }).from(controls);

    const controlContext = availableControls
        .slice(0, 50) // Limit for context size
        .map((c: any) => `- ${c.controlId}: ${c.name} (${c.framework}) - ${c.description?.slice(0, 100) || 'No description'}`)
        .join('\n');

    const systemPrompt = `You are a cybersecurity risk management expert. Your task is to recommend security controls that would best mitigate the given threat/vulnerability combination.

You must respond in valid JSON format with an array of control recommendations. Each recommendation should include:
- controlId: The ID of the recommended control from the available list
- controlName: The name of the control
- framework: The framework it belongs to
- relevanceScore: A score from 1-100 indicating how relevant this control is
- rationale: A brief explanation of why this control is recommended
- implementationTips: Specific guidance for implementing this control`;

    const userPrompt = `Given the following threat and vulnerability, recommend the most appropriate security controls:

**Threat:** ${threatDescription}

**Vulnerability:** ${vulnerabilityDescription}

${existingControls?.length ? `**Already Implemented Controls:** ${existingControls.join(', ')}\n(Exclude these from recommendations)` : ''}

${framework ? `**Preferred Framework:** ${framework}` : ''}

**Available Controls:**
${controlContext}

Respond with a JSON array of 3-5 recommended controls, prioritized by relevance.`;

    try {
        const response = await llmService.generate({
            systemPrompt,
            userPrompt,
            temperature: 0.3,
        });

        // Parse JSON from response
        const jsonMatch = response.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const suggestions: ControlSuggestion[] = JSON.parse(jsonMatch[0]);
            return suggestions.slice(0, 5);
        }

        return [];
    } catch (error) {
        console.error('AI Control Suggestion Error:', error);
        return [];
    }
}


/**
 * Suggest controls for a specific treatment risk scenario
 */
export async function suggestControlsForTreatment(
    threat: string,
    vulnerability: string,
    riskDetails: string
): Promise<ControlSuggestion[]> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Fetch context (available controls)
    const availableControls = await db.select({
        controlId: controls.controlId,
        name: controls.name,
        description: controls.description,
        framework: controls.framework,
    }).from(controls);

    const controlContext = availableControls
        .slice(0, 50) // Limit context
        .map((c: any) => `- [${c.controlId}] ${c.name} (${c.framework}): ${c.description?.slice(0, 100)}`)
        .join('\n');

    const systemPrompt = `You are a security control expert. Recommend specific controls from the provided list that would most effectively mitigate the described risk.

Respond with a JSON array of objects:
[{
    "controlId": "ID from list",
    "controlName": "Name from list",
    "framework": "Framework from list",
    "relevanceScore": 0-100,
    "rationale": "Why this specific control mitigates this specific risk scenario."
}]`;

    const userPrompt = `Risk Scenario:
Threat: ${threat}
Vulnerability: ${vulnerability}
Context: ${riskDetails}

Available Controls:
${controlContext}

Recommend the top 3-5 most relevant controls.`;

    try {
        const response = await llmService.generate({
            systemPrompt,
            userPrompt,
            temperature: 0.2, // Lower temp for more precise mapping
        });

        const jsonMatch = response.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return [];
    } catch (error) {
        console.error('AI Control Suggestion Error:', error);
        return [];
    }
}

/**
 * Generate AI-powered treatment strategy suggestions
 */
export async function generateTreatmentSuggestion(
    threatDescription: string,
    vulnerabilityDescription: string,
    affectedAssets: string[],
    inherentRisk: string,
    existingControls?: string
): Promise<AITreatmentSuggestion | null> {
    const systemPrompt = `You are a risk management expert. Based on the risk information provided, recommend a treatment strategy.

Respond in valid JSON format with:
- treatmentType: One of "mitigate", "transfer", "accept", or "avoid"
- strategy: A detailed description of the recommended treatment strategy
- suggestedControls: Array of control recommendations (each with controlId, controlName, rationale)
- estimatedEffort: One of "low", "medium", or "high"
- justification: Explanation for why this treatment approach is recommended`;

    const userPrompt = `Analyze this risk and recommend a treatment strategy:

**Threat:** ${threatDescription}

**Vulnerability:** ${vulnerabilityDescription}

**Affected Assets:** ${affectedAssets.join(', ')}

**Inherent Risk Level:** ${inherentRisk}

${existingControls ? `**Existing Controls:** ${existingControls}` : 'No existing controls documented.'}

Consider:
1. Cost-effectiveness of different treatment options
2. The severity of the risk
3. Available resources and effort required
4. Regulatory requirements

Provide a JSON response with your recommendation.`;

    try {
        const response = await llmService.generate({
            systemPrompt,
            userPrompt,
            temperature: 0.4,
        });

        // Parse JSON from response
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as AITreatmentSuggestion;
        }

        return null;
    } catch (error) {
        console.error('AI Treatment Suggestion Error:', error);
        return null;
    }
}

/**
 * Perform gap analysis on risks to identify untreated high-priority items
 */
export async function performGapAnalysis(clientId: number): Promise<GapAnalysisResult[]> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get all risk assessments
    const assessments = await db
        .select({
            id: riskAssessments.id,
            assessmentId: riskAssessments.assessmentId,
            threatDescription: riskAssessments.threatDescription,
            vulnerabilityDescription: riskAssessments.vulnerabilityDescription,
            inherentRisk: riskAssessments.inherentRisk,
            residualRisk: riskAssessments.residualRisk,
            priority: riskAssessments.priority,
            existingControls: riskAssessments.existingControls,
            controlEffectiveness: riskAssessments.controlEffectiveness,
            treatmentOption: riskAssessments.treatmentOption,
            reviewDueDate: riskAssessments.reviewDueDate,
            nextReviewDate: riskAssessments.nextReviewDate,
        })
        .from(riskAssessments)
        .where(eq(riskAssessments.clientId, clientId));

    // Get all treatments for this client's risks
    // We fetch all and map in memory to avoid N+1 queries or complex aggregation
    // This is performant enough for typical risk register sizes (hundreds/thousands)
    const treatments = await db
        .select({
            id: riskTreatments.id,
            riskAssessmentId: riskTreatments.riskAssessmentId,
            status: riskTreatments.status,
            dueDate: riskTreatments.dueDate,
        })
        .from(riskTreatments)
        .where(
            or(
                ...assessments.map(a => eq(riskTreatments.riskAssessmentId, a.id))
            )
        );

    // Group treatments by assessment ID
    const treatmentsByRisk = new Map<number, typeof treatments>();
    treatments.forEach(t => {
        if (!t.riskAssessmentId) return;
        const current = treatmentsByRisk.get(t.riskAssessmentId) || [];
        current.push(t);
        treatmentsByRisk.set(t.riskAssessmentId, current);
    });

    // Get policy mappings
    const policyMappings = await db
        .select({
            riskId: riskPolicyMappings.riskAssessmentId
        })
        .from(riskPolicyMappings)
        .where(eq(riskPolicyMappings.clientId, clientId));

    const policyCountByRisk = new Map<number, number>();
    policyMappings.forEach(p => {
        policyCountByRisk.set(p.riskId, (policyCountByRisk.get(p.riskId) || 0) + 1);
    });

    const gaps: GapAnalysisResult[] = [];
    const now = new Date();

    for (const assessment of assessments) {
        const riskTreatments = treatmentsByRisk.get(assessment.id) || [];
        const inherentScore = getRiskScore(assessment.inherentRisk);
        const residualScore = getRiskScore(assessment.residualRisk);

        const treatmentOption = assessment.treatmentOption || 'None';
        const treatmentCount = riskTreatments.length;
        const policyCount = policyCountByRisk.get(assessment.id) || 0;
        const hasEffectiveControls = assessment.controlEffectiveness === 'Effective'; // Case sensitive check usually, assume standardized

        // Check for overdue treatments
        const hasOverdueTreatments = riskTreatments.some(t => {
            // If status is not done and due date is past
            const isDone = t.status === 'implemented' || t.status === 'completed';
            if (isDone) return false;
            if (!t.dueDate) return false;
            return new Date(t.dueDate) < now;
        });

        const assessmentDueDate = assessment.reviewDueDate ? new Date(assessment.reviewDueDate) : null;
        const isAssessmentOverdue = assessmentDueDate && assessmentDueDate < now;

        // Determine gap severity
        let gapSeverity: 'critical' | 'high' | 'medium' | 'low' = 'low';
        let recommendation = '';

        // Check for 'None' treatment option FIRST - applies to all risk levels
        if (treatmentOption === 'None') {
            if (inherentScore >= 4) {
                gapSeverity = 'critical';
                recommendation = 'Major risk with no defined treatment plan.';
            } else if (inherentScore >= 3) {
                gapSeverity = 'high';
                recommendation = 'Risk needs a treatment decision (Mitigate/Transfer/Accept).';
            } else {
                gapSeverity = 'medium';
                recommendation = 'Low risk needs a formal treatment decision.';
            }
        }

        // Check for 'Mitigate' but NO treatments - applies to all risk levels
        if (gapSeverity === 'low' && treatmentOption === 'Mitigate' && treatmentCount === 0) {
            if (inherentScore >= 4) {
                gapSeverity = 'critical';
                recommendation = 'Critical risk mitigation selected but no treatments defined.';
            } else if (inherentScore >= 3) {
                gapSeverity = 'high';
                recommendation = 'Mitigation strategy selected but no treatments created.';
            } else {
                gapSeverity = 'medium';
                recommendation = 'Mitigation selected but no treatments defined.';
            }
        }

        // CRITICAL GAPS (if not already caught)
        if (gapSeverity === 'low' && inherentScore >= 4) {
            if (treatmentOption === 'Mitigate' && treatmentCount === 0) {
                gapSeverity = 'critical';
                recommendation = 'Critical risk mitigation selected but no treatments defined.';
            } else if (hasOverdueTreatments) {
                gapSeverity = 'critical';
                recommendation = 'Critical risk mitigation is overdue. Immediate attention required.';
            } else if (!assessment.reviewDueDate && !assessment.nextReviewDate) {
                gapSeverity = 'high';
                recommendation = 'Critical risk has no review deadline set.';
            } else if (policyCount === 0) {
                gapSeverity = 'high';
                recommendation = 'Critical risk has no governing policy linked.';
            }
        }

        // HIGH GAPS (if not already caught)
        if (gapSeverity === 'low' && inherentScore >= 3) {
            if (inherentScore >= 4 && residualScore >= 3 && treatmentCount > 0) {
                gapSeverity = 'high';
                recommendation = 'Current treatments are insufficient to reduce critical risk.';
            } else if (isAssessmentOverdue) {
                gapSeverity = 'high';
                recommendation = 'Risk review is overdue.';
            } else if (policyCount === 0) {
                gapSeverity = 'medium'; // Medium priority for High risk missing policy, Critical gets High priority
                recommendation = 'High risk has no governing policy linked.';
            }
        }

        // MEDIUM GAPS (if not already caught)
        if (gapSeverity === 'low') {
            if (inherentScore >= 3 && residualScore >= inherentScore) {
                gapSeverity = 'medium';
                recommendation = 'Residual risk not reduced. Consider additional controls.';
            } else if (!hasEffectiveControls && assessment.existingControls) {
                // Check if control effectiveness is marked as ineffective or just not "Effective"
                if (assessment.controlEffectiveness === 'Ineffective' || assessment.controlEffectiveness === 'Needs Improvement') {
                    gapSeverity = 'medium';
                    recommendation = 'Existing controls are rated as ineffective.';
                }
            }
        }

        // Only include items with identified gaps
        if (gapSeverity !== 'low') {
            gaps.push({
                riskId: assessment.id,
                assessmentId: assessment.assessmentId,
                threatDescription: assessment.threatDescription || '',
                vulnerabilityDescription: assessment.vulnerabilityDescription || '',
                inherentRisk: assessment.inherentRisk || 'Medium',
                residualRisk: assessment.residualRisk || assessment.inherentRisk || 'Medium',
                priority: assessment.priority || 'Medium',
                treatmentCount: treatmentCount,
                gapSeverity,
                recommendation,
            });
        }
    }

    // Sort by severity (critical first, then by inherent risk)
    gaps.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (severityOrder[a.gapSeverity] !== severityOrder[b.gapSeverity]) {
            return severityOrder[a.gapSeverity] - severityOrder[b.gapSeverity];
        }
        return getRiskScore(b.inherentRisk) - getRiskScore(a.inherentRisk);
    });

    return gaps;
}

// Helper to convert risk level to numeric score
function getRiskScore(level: string | null): number {
    const scores: Record<string, number> = {
        'Very High': 5,
        'High': 4,
        'Medium': 3,
        'Low': 2,
        'Very Low': 1,
    };
    return scores[level || 'Medium'] || 3;
}
