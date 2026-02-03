
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import FrameworkSelectorWizard from '@/components/implementation/FrameworkSelectorWizard';
import { useLocation, useParams } from 'wouter';
import { Button } from '@complianceos/ui/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ImplementationCreate() {
    const params = useParams();
    const [, setLocation] = useLocation();
    const clientId = params.id ? parseInt(params.id, 10) : 0;

    const handleCancel = () => {
        setLocation(`/clients/${clientId}/implementation`);
    };

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="mb-8">
                    <Button variant="ghost" onClick={handleCancel} className="mb-4 pl-0 hover:pl-2 transition-all">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Implementation Plan</h1>
                    <p className="text-slate-500 mt-1">Select a framework and configure your roadmap.</p>
                </div>

                <FrameworkSelectorWizard clientId={clientId} onCancel={handleCancel} />
            </div>
        </DashboardLayout>
    );
}
