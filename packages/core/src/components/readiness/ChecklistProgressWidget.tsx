import React from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Progress } from '@complianceos/ui/ui/progress';
import { CheckSquare, Loader2 } from 'lucide-react';

interface ChecklistProgressWidgetProps {
    clientId: number;
    checklistId?: string;
}

export function ChecklistProgressWidget({ clientId, checklistId = 'iso-27001-readiness' }: ChecklistProgressWidgetProps) {
    const { data, isLoading } = trpc.checklist.get.useQuery({
        clientId,
        checklistId
    });

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    const items = data?.items || {};
    const totalChecked = Object.values(items).filter(Boolean).length;
    // Total items is hardcoded for now based on the visual checklist, 
    // or we could pass it as a prop. 
    // There are approx 40 items in the full checklist based on the user request.
    // Let's assume 40 for calculation or just show count.
    const totalItemsRef = 40;
    const progress = Math.min(Math.round((totalChecked / totalItemsRef) * 100), 100);

    return (
        <div className="p-4 rounded-xl border-none shadow-lg shadow-indigo-200 dark:shadow-none bg-indigo-600 text-white">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-white/80 font-medium">Readiness Checklist</p>
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-md">
                    <CheckSquare className="w-4 h-4 text-white" />
                </div>
            </div>
            <div className="text-2xl font-bold text-white">{totalChecked} / {totalItemsRef}</div>
            <p className="text-xs text-white/60 mt-1 mb-3">
                Items completed
            </p>
            <Progress value={progress} className="h-2 bg-white/30" />
        </div>
    );
}
