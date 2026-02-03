import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { scoreToRiskLevel, getRiskLevelColor } from '@/lib/riskCalculations';

interface RiskItem {
    id: number;
    title: string;
    assessmentId: string;
    inherentScore?: number | null;
    residualScore?: number | null;
    status: string;
    likelihood?: string;
    impact?: string;
}

interface VirtualizedRiskListProps {
    items: RiskItem[];
    onItemClick?: (id: number) => void;
    height?: number;
}

export function VirtualizedRiskList({ items, onItemClick, height = 400 }: VirtualizedRiskListProps) {
    const parentRef = React.useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 72,
        overscan: 5,
    });

    if (items.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    No risk assessments found.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                    <span>Risk Assessments</span>
                    <Badge variant="secondary">{items.length} items</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div
                    ref={parentRef}
                    className="overflow-auto"
                    style={{ height, contain: 'strict' }}
                >
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const item = items[virtualRow.index];
                            const inherentLevel = item.inherentScore ? scoreToRiskLevel(item.inherentScore) : '';
                            const residualLevel = item.residualScore ? scoreToRiskLevel(item.residualScore) : '';

                            return (
                                <div
                                    key={item.id}
                                    className={`absolute top-0 left-0 w-full px-4 py-3 border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${virtualRow.index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-850'
                                        }`}
                                    style={{
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                    onClick={() => onItemClick?.(item.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-muted-foreground">{item.assessmentId}</span>
                                                <Badge variant={item.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                                                    {item.status}
                                                </Badge>
                                            </div>
                                            <p className="font-medium truncate mt-1">{item.title || 'Untitled Risk'}</p>
                                        </div>
                                        <div className="flex items-center gap-3 ml-4">
                                            {inherentLevel && (
                                                <div className="text-center">
                                                    <div className="text-xs text-muted-foreground">Inherent</div>
                                                    <Badge className={getRiskLevelColor(inherentLevel)}>{inherentLevel}</Badge>
                                                </div>
                                            )}
                                            {residualLevel && (
                                                <div className="text-center">
                                                    <div className="text-xs text-muted-foreground">Residual</div>
                                                    <Badge className={getRiskLevelColor(residualLevel)}>{residualLevel}</Badge>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default VirtualizedRiskList;
