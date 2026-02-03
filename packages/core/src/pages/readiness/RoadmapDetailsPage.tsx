
import React from 'react';
import { useParams, Link } from 'wouter';
import { ArrowLeft, LayoutDashboard, ListTodo } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ExecutionDashboard from '@/components/roadmap/ExecutionDashboard';
import StrategicRoadmapDetail from '@/components/roadmap/StrategicRoadmapDetail';
import { Button } from '@complianceos/ui/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';

export default function RoadmapDetailsPage() {
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
                    <Link href={`/clients/${clientId}/roadmap/dashboard`}>
                        <Button variant="ghost" size="sm" className="gap-2 mb-4 pl-0 hover:pl-2 transition-all">
                            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                        </Button>
                    </Link>
                </div>

                <div className="flex-1 px-8">
                    <Tabs defaultValue="strategy" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="strategy" className="gap-2">
                                <LayoutDashboard className="w-4 h-4" />
                                Strategic Plan
                            </TabsTrigger>
                            <TabsTrigger value="execution" className="gap-2">
                                <ListTodo className="w-4 h-4" />
                                Execution Board
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="strategy" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <StrategicRoadmapDetail
                                roadmapId={roadmapId}
                                clientId={clientId}
                            />
                        </TabsContent>

                        <TabsContent value="execution" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <ExecutionDashboard planId={roadmapId} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </DashboardLayout>
    );
}
