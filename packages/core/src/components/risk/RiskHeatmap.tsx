import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@complianceos/ui/ui/card';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@complianceos/ui/ui/tooltip';
import { Button } from '@complianceos/ui/ui/button';

interface RiskHeatmapProps {
    assessments: any[];
    onFilterChange: (filters: { impact?: string, likelihood?: string, type?: string } | null) => void;
    activeFilter: { impact?: string, likelihood?: string, type?: string } | null;
    type?: 'inherent' | 'residual';
    title?: string;
}

// 5x5 Matrix scales
const SCALES = ['1 - Very Low', '2 - Low', '3 - Medium', '4 - High', '5 - Very High'];

const toViewScale = (val: string | number | undefined): number => {
    if (!val) return 0;
    const strVal = val.toString().toLowerCase().trim();
    let num = parseInt(strVal.charAt(0));

    // Map text descriptions if numeric parse fails
    if (isNaN(num)) {
        if (strVal.includes('critical') || strVal.includes('extreme') || strVal.includes('catastrophic')) num = 5;
        else if (strVal.includes('very high') || strVal.includes('almost certain')) num = 4;
        else if (strVal.includes('high') || strVal.includes('likely') || strVal.includes('major')) num = 3;
        else if (strVal.includes('medium') || strVal.includes('moderate') || strVal.includes('possible')) num = 2;
        else if (strVal.includes('low') || strVal.includes('unlikely') || strVal.includes('minor') || strVal.includes('rare') || strVal.includes('insignificant')) num = 1;
    }

    if (num >= 1 && num <= 5) return num;
    return 0;
};


export function RiskHeatmap({ assessments = [], onFilterChange, activeFilter, type = 'inherent', title }: RiskHeatmapProps) {

    // Calculate matrix counts (Using View Scale)
    const matrixData = useMemo(() => {
        const data: Record<string, number> = {};
        if (!assessments || !Array.isArray(assessments)) return data;

        assessments.forEach(a => {
            let l = 0;
            let i = 0;

            if (type === 'residual') {
                const rScore = toViewScale(a.residualRisk);
                if (rScore > 0) {
                    l = rScore;
                    i = rScore;
                }
            } else {
                l = toViewScale(a.likelihood); // Y-Axis
                i = toViewScale(a.impact); // X-Axis
            }

            if (l > 0 && i > 0) {
                const key = `${l}-${i}`;
                data[key] = (data[key] || 0) + 1;
            }
        });
        return data;
    }, [assessments, type]);

    const getCellColor = (l: number, i: number) => {
        const score = l * i;
        if (score >= 15) return 'bg-red-500 hover:bg-red-600 text-white';
        if (score >= 8) return 'bg-orange-500 hover:bg-orange-600 text-white';
        if (score >= 4) return 'bg-yellow-400 hover:bg-yellow-500 text-black';
        return 'bg-green-400 hover:bg-green-500 text-black';
    };

    const handleCellClick = (l: number, i: number) => {
        // Use View Scale (1-5) directly for filtering to match RiskRegister's normalizedValue logic
        const viewL = l.toString();
        const viewI = i.toString();

        // We include type in the filter so the parent knows which heatmap was clicked
        if (activeFilter?.likelihood === viewL && activeFilter?.impact === viewI && activeFilter?.type === type) {
            onFilterChange(null);
        } else {
            onFilterChange({ likelihood: viewL, impact: viewI, type });
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{title || (type === 'residual' ? 'Residual Risk' : 'Inherent Risk')}</h3>
                {activeFilter?.type === type && (
                    <Button variant="ghost" size="sm" onClick={() => onFilterChange(null)} className="h-6 text-xs text-muted-foreground hover:text-foreground">
                        Clear Filter
                    </Button>
                )}
            </div>

            <div className="flex">
                {/* Y-Axis Label */}
                <div className="flex items-center justify-center mr-2">
                    <span className="text-xs font-medium text-muted-foreground -rotate-90 whitespace-nowrap">Likelihood</span>
                </div>

                <div className="flex-1">
                    <div className="flex flex-col gap-1">
                        {/* Heatmap Rows (Likelihood) - 5 down to 1 */}
                        {[5, 4, 3, 2, 1].map(l => (
                            <div key={l} className="flex gap-1 h-10 md:h-12">
                                {/* Y-Axis Number */}
                                <div className="w-6 flex items-center justify-center text-xs text-muted-foreground font-medium">
                                    {l}
                                </div>

                                {/* Cells (Impact) - 1 to 5 */}
                                {[1, 2, 3, 4, 5].map(i => {
                                    const key = `${l}-${i}`;
                                    const count = matrixData[key] || 0;

                                    // Check Active Filter: Compare View coords directly
                                    const isActive = activeFilter?.likelihood === l.toString() && activeFilter?.impact === i.toString() && activeFilter?.type === type;

                                    return (
                                        <div
                                            key={key}
                                            onClick={() => handleCellClick(l, i)}
                                            className={cn(
                                                "flex-1 rounded-md flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-200 shadow-sm",
                                                getCellColor(l, i),
                                                isActive ? "ring-2 ring-offset-2 ring-primary scale-105 z-10" : "opacity-90 hover:opacity-100"
                                            )}
                                            title={`Likelihood: ${l}, Impact: ${i} (${count} risks)`}
                                        >
                                            {count > 0 && <span className="drop-shadow-md">{count}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* X-Axis Numbers */}
                    <div className="flex gap-1 mt-1 pl-6">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex-1 flex items-center justify-center text-xs text-muted-foreground font-medium">
                                {i}
                            </div>
                        ))}
                    </div>

                    {/* X-Axis Label */}
                    <div className="flex items-center justify-center mt-2 pl-6">
                        <span className="text-xs font-medium text-muted-foreground">Impact</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
