import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { scoreToRiskLevel, getRiskLevelColor } from '@/lib/riskCalculations';

interface RiskAppetiteCheckProps {
    inherentScore: number;
    residualScore: number;
    appetiteThreshold?: number; // Default: 10 (Medium)
}

export function RiskAppetiteCheck({
    inherentScore,
    residualScore,
    appetiteThreshold = 10
}: RiskAppetiteCheckProps) {
    const inherentLevel = scoreToRiskLevel(inherentScore);
    const residualLevel = scoreToRiskLevel(residualScore);

    const inherentExceedsAppetite = inherentScore > appetiteThreshold;
    const residualExceedsAppetite = residualScore > appetiteThreshold;
    const withinAppetite = !residualExceedsAppetite;

    if (withinAppetite) {
        return (
            <Card className="bg-white border-gray-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-black">
                        <CheckCircle className="w-4 h-4" /> Within Risk Appetite
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-gray-600">
                        Residual risk ({residualLevel}, score: {residualScore}) is within the acceptable threshold of {appetiteThreshold}.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-white border-black">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-black">
                    <AlertTriangle className="w-4 h-4" /> Exceeds Risk Appetite
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <p className="text-xs text-black">
                        <strong>Residual risk ({residualLevel}, score: {residualScore})</strong> exceeds the acceptable threshold of {appetiteThreshold}.
                    </p>
                    {inherentExceedsAppetite && (
                        <p className="text-xs text-black">
                            Inherent risk ({inherentLevel}, score: {inherentScore}) also exceeds appetite.
                        </p>
                    )}
                    <p className="text-xs text-black mt-2 font-medium">
                        ⚠️ Additional controls or escalation may be required.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

export default RiskAppetiteCheck;
