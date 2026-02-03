
import { Card, CardHeader, CardTitle, CardContent } from "@complianceos/ui/ui/card";
import { cn } from "@/lib/utils";

export type HeatMapDataPoint = {
    id: number;
    label: string; // e.g. Process Name
    riskScore: number; // 1-25 or normalized
    criticality: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4' | string;
};

interface RiskHeatMapProps {
    data: HeatMapDataPoint[];
    title?: string;
    description?: string;
}

export function RiskHeatMap({ data, title = "Criticality vs. Risk Heatmap", description }: RiskHeatMapProps) {

    // Define Axes
    const yAxisLabels = ["Critical", "High", "Medium", "Low"]; // Risk Levels
    const xAxisLabels = ["Tier 4 (Non-Critical)", "Tier 3", "Tier 2", "Tier 1 (Mission Critical)"];

    // Helper to map Risk Score to Y-Index (0=Critical, 3=Low)
    const getRiskLevelIndex = (score: number) => {
        if (score >= 20) return 0; // Critical
        if (score >= 15) return 1; // High
        if (score >= 8) return 2; // Medium
        return 3; // Low
    };

    // Helper to map Criticality to X-Index (0=Tier 4, 3=Tier 1)
    const getCriticalityIndex = (tier: string) => {
        if (tier.includes("Tier 1")) return 3;
        if (tier.includes("Tier 2")) return 2;
        if (tier.includes("Tier 3")) return 1;
        return 0; // Tier 4
    };

    // Build Grid Data
    const grid = Array(4).fill(null).map(() => Array(4).fill(0));

    // Populate Grid
    data.forEach(item => {
        const y = getRiskLevelIndex(item.riskScore);
        const x = getCriticalityIndex(item.criticality);
        grid[y][x]++;
    });

    // Color Scale for Cell Background (Opacity based on count or specific color mapping)
    const getCellColor = (y: number, x: number, count: number) => {
        // Base color depends on the "Severity" of the intersection
        // Top-Right (Critical Risk + Tier 1) is worst -> Red
        // Bottom-Left (Low Risk + Tier 4) is best -> Green/Gray

        // Severity Score (0-6)
        // y is 0(Crit)..3(Low). Invert y for calculation: 3(Crit)..0(Low)
        const riskLevel = 3 - y;
        const critLevel = x; // 0(T4)..3(T1)
        const combinedSeverity = riskLevel + critLevel; // 0 to 6

        // Static Coloring (Vivid Risk Matrix Style)
        if (combinedSeverity >= 5) return "bg-red-500 dark:bg-red-600 text-white border-red-600"; // Critical
        if (combinedSeverity >= 4) return "bg-orange-500 dark:bg-orange-600 text-white border-orange-600"; // High
        if (combinedSeverity >= 2) return "bg-yellow-400 dark:bg-yellow-500 text-zinc-900 border-yellow-500"; // Medium
        return "bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-600"; // Low
    };

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium">{title}</CardTitle>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </CardHeader>
            <CardContent>
                <div className="flex">
                    {/* Y-Axis Labels */}
                    <div className="flex flex-col justify-between pr-4 py-6 h-64 text-sm text-muted-foreground font-medium w-20 text-right">
                        {yAxisLabels.map(l => <div key={l} className="flex-1 flex items-center justify-end">{l}</div>)}
                    </div>

                    {/* Grid */}
                    <div className="flex-1">
                        <div className="grid grid-cols-4 grid-rows-4 gap-1 h-64 border rounded-md overflow-hidden dark:border-slate-800">
                            {grid.map((row, rowIndex) => (
                                row.map((count, colIndex) => (
                                    <div
                                        key={`${rowIndex}-${colIndex}`}
                                        className={cn(
                                            "flex items-center justify-center font-bold text-lg border transition-all hover:brightness-95 cursor-default relative group",
                                            getCellColor(rowIndex, colIndex, count),
                                            count > 0 ? "border-transparent" : "border-slate-100 dark:border-slate-800"
                                        )}
                                        title={`${yAxisLabels[rowIndex]} Risk + ${xAxisLabels[colIndex]}: ${count} items`}
                                    >
                                        {count > 0 && count}
                                        {/* Tooltip logic could be added here */}
                                    </div>
                                ))
                            ))}
                        </div>
                        {/* X-Axis Labels */}
                        <div className="grid grid-cols-4 pt-2 text-xs text-muted-foreground text-center">
                            {xAxisLabels.map(l => <div key={l}>{l.split(' ')[0] + ' ' + l.split(' ')[1]}</div>)}
                        </div>
                        <div className="text-center text-xs font-semibold mt-1 text-slate-500 uppercase tracking-wider">Process Criticality</div>
                    </div>
                </div>
                {/* Y-Axis Label (Rotated) - can perform with absolute positioning if needed, or omit */}
            </CardContent>
        </Card>
    );
}
