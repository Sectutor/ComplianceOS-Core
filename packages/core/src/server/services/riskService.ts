import { eq, and } from "drizzle-orm";
import * as schema from "../../schema";
import { getMatrixScoreLevel } from "../../lib/riskCalculations";

export const recalculateRiskScore = async (db: any, riskAssessmentId: number) => {
    try {
        // 1. Get Inherent Score
        const [risk] = await db.select().from(schema.riskAssessments).where(eq(schema.riskAssessments.id, riskAssessmentId));
        if (!risk) return;

        // 2. Get all treatments and their linked controls
        const treatments = await db.select()
            .from(schema.riskTreatments)
            .where(eq(schema.riskTreatments.riskAssessmentId, riskAssessmentId));

        let totalReduction = 0;

        for (const treatment of treatments) {
            // Get linked controls
            const controls = await db.select()
                .from(schema.treatmentControls)
                .where(eq(schema.treatmentControls.treatmentId, treatment.id));

            for (const control of controls) {
                // Heuristic: Effective controls reduce risk by 20%, Partial by 10%
                if (control.effectiveness === 'effective') totalReduction += 0.20;
                else if (control.effectiveness === 'partially_effective') totalReduction += 0.10;
            }
        }

        // Cap reduction at 90% to never reach 0 risk
        totalReduction = Math.min(totalReduction, 0.90);

        // 3. Calculate Residual Score
        // Default to inherent if no controls
        const inherentScore = Number(risk.inherentScore) || (Number(risk.likelihood) * Number(risk.impact));
        const residualScore = Math.max(1, Math.round(inherentScore * (1 - totalReduction)));
        const residualRisk = getMatrixScoreLevel(residualScore);

        console.log(`[RiskCalc] Risk ${riskAssessmentId}: Inherent ${inherentScore} -> Reduction ${totalReduction * 100}% -> Residual ${residualScore} (${residualRisk})`);

        // 4. Update Risk
        await db.update(schema.riskAssessments)
            .set({
                residualScore,
                residualRisk,
                updatedAt: new Date()
            })
            .where(eq(schema.riskAssessments.id, riskAssessmentId));
    } catch (error) {
        console.error(`[RiskCalc] Failed to recalculate score for risk ${riskAssessmentId}:`, error);
    }
};
