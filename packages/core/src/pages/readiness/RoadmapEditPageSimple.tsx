import React from 'react';
import { useParams, Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@complianceos/ui/ui/button';

export default function RoadmapEditPageSimple() {
    const params = useParams();
    const roadmapId = params.roadmapId ? parseInt(params.roadmapId, 10) : null;
    const clientId = params.id ? parseInt(params.id, 10) : null;

    if (!roadmapId || !clientId) {
        return (
            <DashboardLayout>
                <div className="p-8">Invalid URL parameters</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full">
                <div className="px-8 pt-6 pb-2">
                    <Link href={`/clients/${clientId}/roadmap/${roadmapId}`}>
                        <Button variant="ghost" size="sm" className="gap-2 mb-4 pl-0 hover:pl-2 transition-all">
                            <ArrowLeft className="h-4 w-4" /> Back to Roadmap
                        </Button>
                    </Link>
                </div>

                <div className="flex-1 px-8 pb-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-slate-900">Edit Roadmap</h1>
                            <p className="text-slate-600 mt-2">
                                Edit functionality coming soon. Roadmap ID: {roadmapId}, Client ID: {clientId}
                            </p>
                        </div>

                        <div className="p-8 border border-dashed border-slate-300 rounded-lg text-center">
                            <p className="text-slate-500">Edit form will be implemented here</p>
                            <p className="text-slate-400 text-sm mt-2">Roadmap ID: {roadmapId}</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}