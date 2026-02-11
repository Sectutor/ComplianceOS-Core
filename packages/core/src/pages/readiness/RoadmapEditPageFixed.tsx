import React from 'react';
import { useParams, Link } from 'wouter';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import RoadmapCreateForm from '@/components/roadmap/RoadmapCreateForm';
import { Button } from '@complianceos/ui/ui/button';
import { trpc } from '@/lib/trpc';
import { PageGuide } from "@/components/PageGuide";

export default function RoadmapEditPageFixed() {
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
        description: roadmap.description
    };

    try {
        if (roadmap.description && typeof roadmap.description === 'string' && roadmap.description.trim().length > 0 && roadmap.description.startsWith('{')) {
            try {
                const parsedData = JSON.parse(roadmap.description);

                // Map the JSON fields to what RoadmapCreateForm expects
                roadmapData = {
                    ...roadmapData,
                    ...parsedData.businessContext || {},
                    ...parsedData.drivers || {},
                    ...parsedData.posture || {},
                    ...parsedData.governance || {},
                    vision: parsedData.vision || '',
                    framework: parsedData.framework || '',
                    targetDate: parsedData.targetDate ? new Date(parsedData.targetDate) : undefined,
                    objectives: parsedData.objectives || [],
                    detailedObjectives: parsedData.detailedObjectives || (parsedData.objectives ? parsedData.objectives.map((obj: string, index: number) => ({
                        id: `obj-${index}`,
                        title: obj,
                        alignment: parsedData.vision || '',
                        priority: "High",
                        horizon: "Q1",
                        owner: "TBD",
                        estimatedHours: 40,
                        budget: 0,
                        complexity: "Medium"
                    })) : []),
                    metrics: parsedData.metrics || [],
                    kpiTargets: parsedData.kpiTargets || []
                };
            } catch (parseError) {
                console.error("Error parsing roadmap description JSON:", parseError);
                // If JSON parsing fails, description might be plain text
                // Just use the basic roadmap data without parsing
                roadmapData.vision = roadmap.description || '';
            }
        } else {
            roadmapData.vision = roadmap.description || '';
        }
    } catch (error) {
        console.error("Error processing roadmap data:", error);
        // If parsing fails, just use the basic roadmap data
        roadmapData.vision = roadmap.description || '';
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full">
                <div className="pt-6 pb-2">
                    <div className="px-8">
                        <Link href={`/clients/${clientId}/roadmap/${roadmapId}`}>
                            <Button variant="ghost" size="sm" className="gap-2 mb-4 pl-0 hover:pl-2 transition-all">
                                <ArrowLeft className="h-4 w-4" /> Back to Roadmap
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="flex-1 pb-8">
                    {/* Full width header */}
                    <div className="mb-8">
                        <div className="px-8 flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Edit Roadmap: {roadmap.title}</h1>
                                <p className="text-slate-600 mt-2">
                                    Update your roadmap configuration and details
                                </p>
                            </div>
                            <PageGuide
                                title="Edit Roadmap Configuration"
                                description="Modify roadmap metadata and initial setup."
                                rationale="Keep roadmap parameters aligned with changing business needs."
                                howToUse={[
                                    { step: "Update Info", description: "Change title, description, and vision." },
                                    { step: "Adjust Timeline", description: "Modify target dates and milestones." },
                                    { step: "Drivers", description: "Update business drivers and objectives." }
                                ]}
                                integrations={[
                                    { name: "Roadmap Engine", description: "Updates recalculate project timelines." }
                                ]}
                            />
                        </div>
                    </div>



                    {/* Full width form */}
                    <div className="w-full px-0">
                        <RoadmapCreateForm
                            clientId={clientId}
                            initialData={roadmapData}
                            onSuccess={(updatedRoadmap) => {
                                // Always redirect to the original roadmap ID to avoid issues
                                window.location.href = `/clients/${clientId}/roadmap/${roadmapId}`;
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