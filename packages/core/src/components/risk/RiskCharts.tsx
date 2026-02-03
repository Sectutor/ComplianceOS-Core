import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie } from 'recharts';
import { TrendingDown, TrendingUp, Minus, ArrowRight, Shield, Target, CheckCircle2 } from 'lucide-react';

interface RiskChartsProps {
    risks: Array<{
        id: number;
        assessmentId?: string;
        inherentRisk?: string | null;
        residualRisk?: string | null;
        treatmentOption?: string | null;
        priority?: string | null;
        status?: string | null;
        treatmentCount?: number;
    }>;
}

// Risk level to numeric score
const riskLevelScore: Record<string, number> = {
    'Very High': 5,
    'High': 4,
    'Medium': 3,
    'Low': 2,
    'Very Low': 1,
};

const riskLevelColors: Record<string, string> = {
    'Very High': '#dc2626',
    'High': '#f97316',
    'Medium': '#eab308',
    'Low': '#22c55e',
    'Very Low': '#3b82f6',
};

export function RiskComparisonChart({ risks }: RiskChartsProps) {
    const comparisonData = useMemo(() => {
        const levels = ['Very High', 'High', 'Medium', 'Low', 'Very Low'];

        return levels.map(level => {
            const inherentCount = risks.filter(r => r.inherentRisk === level).length;
            const residualCount = risks.filter(r => r.residualRisk === level).length;

            return {
                name: level,
                inherent: inherentCount,
                residual: residualCount,
                fill: riskLevelColors[level],
            };
        });
    }, [risks]);

    return (
        <div className="bg-card rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
                <ArrowRight className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Inherent vs Residual Risk</h3>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData} layout="vertical" barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                        }}
                    />
                    <Legend />
                    <Bar
                        dataKey="inherent"
                        name="Inherent Risk"
                        fill="#f97316"
                        radius={[0, 4, 4, 0]}
                    />
                    <Bar
                        dataKey="residual"
                        name="Residual Risk"
                        fill="#22c55e"
                        radius={[0, 4, 4, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function RiskReductionROI({ risks }: RiskChartsProps) {
    const metrics = useMemo(() => {
        let totalInherent = 0;
        let totalResidual = 0;
        let risksReduced = 0;
        let risksUnchanged = 0;
        let risksIncreased = 0;
        let treatedCount = 0;
        let untreatedHighRisks = 0;

        risks.forEach(risk => {
            const inherentScore = riskLevelScore[risk.inherentRisk || 'Medium'] || 3;
            const residualScore = riskLevelScore[risk.residualRisk || risk.inherentRisk || 'Medium'] || 3;

            totalInherent += inherentScore;
            totalResidual += residualScore;

            if (residualScore < inherentScore) {
                risksReduced++;
            } else if (residualScore > inherentScore) {
                risksIncreased++;
            } else {
                risksUnchanged++;
            }

            if ((risk as any).treatmentCount > 0) {
                treatedCount++;
            }

            if ((inherentScore >= 4) && (!(risk as any).treatmentCount || (risk as any).treatmentCount === 0)) {
                untreatedHighRisks++;
            }
        });

        const reductionPercentage = totalInherent > 0
            ? Math.round(((totalInherent - totalResidual) / totalInherent) * 100)
            : 0;

        const treatmentCoverage = risks.length > 0
            ? Math.round((treatedCount / risks.length) * 100)
            : 0;

        return {
            totalInherent,
            totalResidual,
            reductionPercentage,
            risksReduced,
            risksUnchanged,
            risksIncreased,
            treatedCount,
            untreatedHighRisks,
            treatmentCoverage,
            totalRisks: risks.length,
        };
    }, [risks]);

    const pieData = [
        { name: 'Reduced', value: metrics.risksReduced, fill: '#22c55e' },
        { name: 'Unchanged', value: metrics.risksUnchanged, fill: '#6b7280' },
        { name: 'Increased', value: metrics.risksIncreased, fill: '#ef4444' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-4">
            {/* ROI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Risk Reduction */}
                <div className="bg-emerald-500 rounded-xl shadow-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-white/90">Risk Reduction</p>
                            <p className="text-3xl font-bold mt-1 text-white">
                                {metrics.reductionPercentage}%
                            </p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm">
                            {metrics.reductionPercentage > 0 ? (
                                <TrendingDown className="w-6 h-6 text-white" />
                            ) : metrics.reductionPercentage < 0 ? (
                                <TrendingUp className="w-6 h-6 text-white" />
                            ) : (
                                <Minus className="w-6 h-6 text-white" />
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-white/80 mt-2 font-medium">
                        Inherent: {metrics.totalInherent} → Residual: {metrics.totalResidual}
                    </p>
                </div>

                {/* Treatment Coverage */}
                <div className="bg-blue-500 rounded-xl shadow-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-white/90">Treatment Coverage</p>
                            <p className="text-3xl font-bold mt-1 text-white">{metrics.treatmentCoverage}%</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-white/80 mt-2 font-medium">
                        {metrics.treatedCount} of {metrics.totalRisks} risks treated
                    </p>
                </div>

                {/* Risks Improved */}
                <div className="bg-indigo-500 rounded-xl shadow-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-white/90">Risks Improved</p>
                            <p className="text-3xl font-bold mt-1 text-white">{metrics.risksReduced}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-white/80 mt-2 font-medium">
                        Residual lower than inherent
                    </p>
                </div>

                {/* Untreated High Risks */}
                <div className={`rounded-xl shadow-lg p-4 text-white ${metrics.untreatedHighRisks > 0 ? 'bg-rose-500' : 'bg-teal-500'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-white/90">Attention Needed</p>
                            <p className="text-3xl font-bold mt-1 text-white">
                                {metrics.untreatedHighRisks}
                            </p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-white/80 mt-2 font-medium">
                        High risks without treatments
                    </p>
                </div>
            </div>

            {/* Risk Change Distribution */}
            <div className="bg-card rounded-xl border shadow-sm p-6">
                <h3 className="font-semibold text-lg mb-4">Risk Level Changes</h3>
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-48 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-sm font-medium">Reduced (Improved)</span>
                            </div>
                            <span className="font-bold text-green-600">{metrics.risksReduced}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gray-500" />
                                <span className="text-sm font-medium">Unchanged</span>
                            </div>
                            <span className="font-bold text-gray-600">{metrics.risksUnchanged}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="text-sm font-medium">Increased (Worsened)</span>
                            </div>
                            <span className="font-bold text-red-600">{metrics.risksIncreased}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
