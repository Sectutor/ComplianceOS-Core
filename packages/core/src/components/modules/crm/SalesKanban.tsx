import React, { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { Button } from '@complianceos/ui/ui/button';
import { Plus, MoreHorizontal, DollarSign } from 'lucide-react';
import { ScrollArea } from '@complianceos/ui/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SalesKanbanProps {
    clientId?: number;
}

// Hardcoded columns for MVP - normally fetched from DB
const COLUMNS = [
    { id: 1, title: 'New Lead', color: 'bg-slate-50 border-t-4 border-slate-500' },
    { id: 2, title: 'Qualified', color: 'bg-blue-50 border-t-4 border-blue-500' },
    { id: 3, title: 'Proposal', color: 'bg-orange-50 border-t-4 border-orange-500' },
    { id: 4, title: 'Negotiation', color: 'bg-purple-50 border-t-4 border-purple-500' },
    { id: 5, title: 'Won', color: 'bg-emerald-50 border-t-4 border-emerald-500' },
    { id: 6, title: 'Lost', color: 'bg-red-50 border-t-4 border-red-500' },
];

export function SalesKanban({ clientId }: SalesKanbanProps) {
    // @ts-ignore - trpc types might not be regenerated yet
    const { data: deals, isLoading, refetch } = trpc.sales.getDeals.useQuery({});
    // @ts-ignore
    const updateStageMutation = trpc.sales.updateDealStage.useMutation();

    const [draggedDealId, setDraggedDealId] = useState<number | null>(null);
    const [activeColumn, setActiveColumn] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, dealId: number) => {
        e.dataTransfer.setData('dealId', dealId.toString());
        setDraggedDealId(dealId);
    };

    const handleDragOver = (e: React.DragEvent, stageId: number) => {
        e.preventDefault();
        if (activeColumn !== stageId) setActiveColumn(stageId);
    };

    const handleDrop = async (e: React.DragEvent, stageId: number) => {
        e.preventDefault();
        setActiveColumn(null);
        const dealId = parseInt(e.dataTransfer.getData('dealId'));
        if (dealId) {
            try {
                await updateStageMutation.mutateAsync({ dealId, stageId });
                toast.success("Deal moved!");
                refetch();
            } catch (e) {
                toast.error("Failed to move deal");
            }
        }
        setDraggedDealId(null);
    };

    const dealsByStage = useMemo(() => {
        const acc: Record<number, any[]> = {};
        deals?.forEach((deal: any) => {
            const stage = deal.stageId;
            if (!acc[stage]) acc[stage] = [];
            acc[stage].push(deal);
        });
        return acc;
    }, [deals]);

    if (isLoading) return <div>Loading pipeline...</div>;

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex-1 overflow-x-auto min-h-[500px]">
                <div className="flex gap-4 h-full min-w-[1000px]">
                    {COLUMNS.map(column => (
                        <div
                            key={column.id}
                            className={cn(
                                "flex-1 flex flex-col rounded-lg border shadow-sm p-3 min-w-[280px] transition-all duration-200 h-full",
                                column.color,
                                activeColumn === column.id && "ring-2 ring-primary/20 scale-[1.01]"
                            )}
                            onDragOver={(e) => handleDragOver(e, column.id)}
                            onDrop={(e) => handleDrop(e, column.id)}
                        >
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">{column.title}</h3>
                                <Badge variant="secondary" className="bg-white/50 text-slate-700 hover:bg-white/80">
                                    {dealsByStage[column.id]?.length || 0}
                                </Badge>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="space-y-3 pr-2 pb-2">
                                    {dealsByStage[column.id]?.map((deal: any) => (
                                        <Card
                                            key={deal.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, deal.id)}
                                            className="cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 border-none shadow-sm ring-1 ring-slate-200"
                                        >
                                            <CardContent className="p-4 space-y-3">
                                                <div className="font-semibold text-sm text-slate-900 leading-tight">{deal.title}</div>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <Badge variant="outline" className="font-mono text-[10px] bg-slate-50">
                                                        <DollarSign className="w-3 h-3 mr-0.5" />
                                                        {deal.value?.toLocaleString() || 0}
                                                    </Badge>
                                                    {deal.expectedCloseDate && (
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                            {format(new Date(deal.expectedCloseDate), 'MMM d')}
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {(!dealsByStage[column.id] || dealsByStage[column.id].length === 0) && (
                                        <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                                            Drop deals here
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
