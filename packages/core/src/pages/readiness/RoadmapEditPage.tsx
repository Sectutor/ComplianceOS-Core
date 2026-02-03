import React from 'react';
import { useParams, Link } from 'wouter';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import RoadmapCreateForm from '@/components/roadmap/RoadmapCreateForm';
import { Button } from '@complianceos/ui/ui/button';
import { trpc } from '@/lib/trpc';

export default function RoadmapEditPage() {
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

    // Fetch the existing roadmap data
    const { data: roadmap, isLoading, error } = trpc.roadmap.getStrategic.useQuery(
        { roadmapId },
        { enabled: !!roadmapId }
    );

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-slate-600">Loading roadmap data...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="p-8">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <p className="text-red-600 font-medium">Failed to load roadmap</p>
                        <p className="text-slate-500 text-sm mt-2">{error.message}</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!roadmap) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center">
                    <p className="text-slate-600">Roadmap not found</p>
                </div>
            </DashboardLayout>
        );
    }

    // Parse the JSON description to extract the data
    let roadmapData: any = { 
        id: roadmapId, 
        title: roadmap.title,
        description: roadmap.description // Pass the raw description too
    };
    
    try {
        if (roadmap.description && typeof roadmap.description === 'string' && roadmap.description.trim().length > 0 && roadmap.description.startsWith('{')) {
            try {
                const parsedData = JSON.parse(roadmap.description);
                
                // Map the JSON fields to what RoadmapCreateForm expects
                roadmapData = {
                    ...roadmapData,
                    ...parsedData,
                    // Direct fields that RoadmapCreateForm uses
                    vision: parsedData.vision || '',
                    framework: parsedData.framework || '',
                    targetDate: parsedData.targetDate ? new Date(parsedData.targetDate) : undefined,
                    // Objectives can be in different formats
                    objectives: parsedData.objectives || [],
                    detailedObjectives: parsedData.objectives ? parsedData.objectives.map((obj: string, index: number) => ({
                        id: `obj-${index}`,
                        title: obj,
                        alignment: parsedData.vision || '',
                        priority: "High",
                        horizon: "Q1",
                        owner: "TBD",
                        estimatedHours: 40,
                        budget: 0,
                        complexity: "Medium"
                    })) : [],
                    metrics: parsedData.metrics || [],
                    kpiTargets: parsedData.kpiTargets || []
                };
            } catch (parseError) {
                console.error("Error parsing roadmap description JSON:", parseError);
                // If JSON parsing fails, description might be plain text
                roadmapData.vision = roadmap.description || '';
            }
        } else {
            roadmapData.vision = roadmap.description || '';
        }
    } catch (error) {
        console.error("Error processing roadmap data:", error);
        roadmapData.vision = roadmap.description || '';
        roadmapData.description = roadmap.description || '';
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
                            <h1 className="text-2xl font-bold text-slate-900">Edit Roadmap: {roadmap.title}</h1>
                            <p className="text-slate-600 mt-2">
                                Update your roadmap configuration and details
                            </p>
                        </div>

                        {/* Debug: Show what data is being passed */}
                        <div className="mb-4 p-4 bg-slate-50 rounded-lg text-sm">
                            <div className="font-medium text-slate-700 mb-2">Debug: Data being passed to form</div>
                            <div className="text-slate-600">
                                <div>Title: {roadmapData.title}</div>
                                <div>Vision: {roadmapData.vision?.substring(0, 50)}...</div>
                                <div>Framework: {roadmapData.framework}</div>
                                <div>Objectives count: {roadmapData.objectives?.length || 0}</div>
                                <div>Detailed objectives count: {roadmapData.detailedObjectives?.length || 0}</div>
                            </div>
                        </div>

                        <RoadmapCreateForm
                            clientId={clientId}
                            initialData={roadmapData}
                            onSuccess={(updatedRoadmap) => {
                                // Navigate back to the roadmap view after successful edit
                                window.location.href = `/clients/${clientId}/roadmap/${updatedRoadmap.id}`;
                            }}
                            onCancel={() => {
                                window.location.href = `/clients/${clientId}/roadmap/${roadmapId}`;
                            }}
                        />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}