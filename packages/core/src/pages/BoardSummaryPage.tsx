import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import BoardDashboard from '@/components/admin/BoardDashboard';
import { trpc } from '@/lib/trpc';
import { useParams } from 'wouter';
import { Loader2 } from 'lucide-react';

export default function BoardSummaryPage() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || '0', 10);

    const { data: metrics, isLoading: loadingMetrics } = trpc.complianceExtensions.getBoardMetrics.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const { data: client, isLoading: loadingClient } = trpc.clients.get.useQuery(
        { id: clientId },
        { enabled: !!clientId }
    );

    if (loadingMetrics || loadingClient) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            </DashboardLayout>
        );
    }

    if (!metrics || !client) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center text-slate-500">
                    Unable to load board metrics. Please ensure the client exists.
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <BoardDashboard data={metrics} clientName={client.name} />
        </DashboardLayout>
    );
}
