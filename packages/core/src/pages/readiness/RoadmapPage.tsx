import React, { useState } from "react";
import { useClientContext } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Calendar } from "@complianceos/ui/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@complianceos/ui/ui/popover";
import { format, addMonths } from "date-fns";
import {
    CalendarIcon, Loader2, ArrowRight, Flag, CheckCircle2, Clock,
    LayoutDashboard, Kanban, List as ListIcon, TrendingUp, AlertTriangle, Plus,
    MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Badge } from "@complianceos/ui/ui/badge";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Separator } from "@complianceos/ui/ui/separator";
import StrategicDashboard from "@/components/roadmap/RoadmapDashboard";
import ExecutionDashboard from "@/components/roadmap/ExecutionDashboard";

export default function RoadmapPage() {
    const params = useParams();
    const clientIdParam = params.id ? parseInt(params.id, 10) : null;
    const { selectedClientId, setSelectedClientId } = useClientContext();

    const effectiveClientId = clientIdParam || selectedClientId;

    const [location] = useLocation();

    // Determine initial view based on URL
    const getInitialView = () => {
        if (location.includes('/roadmap/create')) return 'create' as const;
        if (location.includes('/roadmap/templates')) return 'templates' as const;
        return 'list' as const;
    };

    const [activeTab, setActiveTab] = useState("strategic");
    const [roadmapView, setRoadmapView] = useState<'list' | 'templates' | 'create'>(getInitialView());

    // Update view when location changes (for deep links)
    React.useEffect(() => {
        if (location.includes('/roadmap/create')) setRoadmapView('create');
        else if (location.includes('/roadmap/templates')) setRoadmapView('templates');
        else if (location.includes('/roadmap/dashboard')) setRoadmapView('list');
    }, [location]);

    const utils = trpc.useContext();
    const { data: plans, isLoading } = trpc.roadmap.list.useQuery(
        { clientId: effectiveClientId! },
        { enabled: !!effectiveClientId }
    );

    // MOVED: Fetch Strategic Roadmap early to ensure hook order consistency
    const { data: strategicRoadmaps, isLoading: isLoadingStrategic } = trpc.roadmap.listStrategic.useQuery(
        { clientId: effectiveClientId! },
        { enabled: !!effectiveClientId }
    );
    const activeStrategicRoadmap = strategicRoadmaps?.[0];

    // Enforce Singleton Pattern: If roadmap exists, don't show "create" unless explicitly forced
    React.useEffect(() => {
        if (activeStrategicRoadmap && roadmapView === 'create') {
            toast.info("Roadmap already exists. Switching to view mode.");
            setRoadmapView('list');
        }
    }, [activeStrategicRoadmap, roadmapView]);

    if (isLoading) return (
        <DashboardLayout>
            <div className="flex h-[calc(100vh-64px)] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Loading roadmap data...</p>
                </div>
            </div>
        </DashboardLayout>
    );

    const activePlan = plans?.[0]; // This retrieves the LEGACY remediation plan



    return (
        <DashboardLayout>
            <div className="p-8">
                {effectiveClientId ? (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Roadmap & Implementation</h1>
                                <p className="text-muted-foreground mt-1">
                                    Strategic planning and execution oversight.
                                </p>
                            </div>
                            <TabsList>
                                <TabsTrigger value="strategic" className="gap-2">
                                    <TrendingUp className="h-4 w-4" /> Strategic
                                </TabsTrigger>
                                <TabsTrigger value="execution" className="gap-2">
                                    <Kanban className="h-4 w-4" /> Execution
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="strategic" className="border-none p-0 outline-none">
                            <StrategicDashboard
                                clientId={effectiveClientId}
                                initialView={roadmapView}
                            />
                        </TabsContent>

                        <TabsContent value="execution" className="border-none p-0 outline-none">
                            {activePlan ? (
                                <ExecutionDashboard planId={activePlan.id} />
                            ) : (
                                <RoadmapWizard clientId={effectiveClientId} onCreated={() => utils.roadmap.list.invalidate()} />
                            )}
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="flex h-[calc(100vh-200px)] items-center justify-center border-2 border-dashed rounded-lg">
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-medium">No Client Selected</h3>
                            <p className="text-muted-foreground">Please select a client from the sidebar to view their roadmap.</p>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function RoadmapWizard({ clientId, onCreated }: { clientId: number | null, onCreated: () => void }) {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [duration, setDuration] = useState<number>(6);
    const [mode, setMode] = useState<'duration' | 'date'>('duration');

    const generateMutation = trpc.roadmap.generate.useMutation({
        onSuccess: () => {
            toast.success("Roadmap generated successfully!");
            onCreated();
        },
        onError: (err) => {
            toast.error("Failed to generate roadmap: " + err.message);
        }
    });

    const handleGenerate = () => {
        if (!clientId) return;
        generateMutation.mutate({
            clientId,
            title: `Remediation Roadmap ${new Date().getFullYear()}`,
            targetDate: mode === 'date' && date ? date.toISOString() : undefined,
            monthsDuration: mode === 'duration' ? duration : undefined
        });
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50/50 p-8">
            <div className="max-w-3xl w-full">
                <div className="text-center mb-10 space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                        <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900">Build Your Remediation Roadmap</h1>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Transform compliance gaps into an actionable project plan. Select your target date or duration below.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card
                        className={cn("cursor-pointer transition-all border-2 hover:border-primary hover:shadow-lg relative overflow-hidden", mode === 'duration' ? 'border-primary ring-1 ring-primary/20' : 'border-transparent shadow-sm')}
                        onClick={() => setMode('duration')}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Clock className="w-24 h-24" />
                        </div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" />
                                Fixed Duration
                            </CardTitle>
                            <CardDescription>Best for sprints or quartely goals</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2 relative z-10">
                                {[3, 6, 12].map(m => (
                                    <Button
                                        key={m}
                                        size="sm"
                                        variant={duration === m ? "default" : "outline"}
                                        onClick={(e) => { e.stopPropagation(); setDuration(m); setMode('duration'); }}
                                        className="flex-1"
                                    >
                                        {m} Months
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className={cn("cursor-pointer transition-all border-2 hover:border-primary hover:shadow-lg relative overflow-hidden", mode === 'date' ? 'border-primary ring-1 ring-primary/20' : 'border-transparent shadow-sm')}
                        onClick={() => setMode('date')}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Flag className="w-24 h-24" />
                        </div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Flag className="w-5 h-5 text-primary" />
                                Target Date
                            </CardTitle>
                            <CardDescription>Best for audit deadlines</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative z-10">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                            onClick={(e) => { e.stopPropagation(); setMode('date'); }}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a deadline</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={(d) => { setDate(d); setMode('date'); }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-10 flex justify-center">
                    <Button onClick={handleGenerate} disabled={generateMutation.isLoading} size="lg" className="px-8 h-12 text-lg shadow-xl shadow-primary/20">
                        {generateMutation.isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
                        Generate Action Plan
                    </Button>
                </div>
            </div>
        </div>
    );
}

// function ExecutionDashboard removed - using imported component
// function StatsCard removed - using imported component
// function RoadmapBoard removed - using imported component
// function RoadmapTimeline removed - using imported component
// function RoadmapList removed - using imported component
