
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ImplementationKanban from './ImplementationKanban';
import { useParams } from 'wouter';
import { useClientContext } from '@/contexts/ClientContext';

export default function ImplementationKanbanPage() {
    const params = useParams();
    const clientIdParam = params.id ? parseInt(params.id, 10) : null;
    const { selectedClientId } = useClientContext();
    const clientId = clientIdParam || selectedClientId;

    const planId = params.planId ? parseInt(params.planId, 10) : 0;

    return (
        <DashboardLayout>
            <div className="p-8 h-full">
                <h2 className="text-3xl font-bold tracking-tight mb-6">Implementation Task Board</h2>
                <ImplementationKanban clientId={clientId!} planId={planId} />
            </div>
        </DashboardLayout>
    );
}
