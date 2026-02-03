
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    Plus,
    ArrowRight,
    MoreVertical,
    Calendar,
    Target,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Layout,
    BarChart3,
    Rocket,
    ChevronRight,
    Zap,
    BookOpen,
    FileText
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@complianceos/ui/ui/dropdown-menu";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { Progress } from "@complianceos/ui/ui/progress";
import { useClientContext } from "@/contexts/ClientContext";
import ReportGeneratorDialog from "./ReportGeneratorDialog";

export default function RoadmapDashboard() {
    const params = useParams();
    const clientIdParam = params.id ? parseInt(params.id, 10) : null;
    const { selectedClientId } = useClientContext();

    // Use URL param first, fall back to context
    const clientId = clientIdParam || selectedClientId;
    const [location, setLocation] = useLocation();
    const [reportDialogOpen, setReportDialogOpen] = useState(false);

    // Fetch roadmaps
    const { data: roadmaps, isLoading, error, refetch } = trpc.roadmap.listStrategic.useQuery(
        { clientId: clientId! },
        { 
            enabled: !!clientId,
            retry: (failureCount, error: any) => {
                if (error?.message?.includes('JSON.parse') || error?.message?.includes('unexpected end')) {
                    return failureCount < 2;
                }
                return failureCount < 3;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
        }
    );

    const deleteMutation = trpc.roadmap.delete.useMutation({
        onSuccess: () => {
            toast.success("Roadmap deleted successfully");
            refetch();
        },
        onError: (error) => {
            toast.error(`Error deleting roadmap: ${error.message}`);
        },
    });

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this roadmap?")) {
            await deleteMutation.mutateAsync({ id });
        }
    };

    if (!clientId) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
                    Please select a client to view roadmaps.
                </div>
            </DashboardLayout>
        );
    }

    // Show loading state
    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-600">Loading roadmaps...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Show error state
    if (error) {
        console.error('❌ Error loading roadmaps:', error);
        
        const isJsonParseError = error.message?.includes('JSON.parse') || error.message?.includes('unexpected end');
        const errorMessage = isJsonParseError 
            ? 'Connection issue detected. Please check your network and try again.'
            : error.message;

        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <p className="text-red-600 font-medium">Failed to load roadmaps</p>
                        <p className="text-slate-500 text-sm mt-2">{errorMessage}</p>
                        <div className="flex gap-2 justify-center mt-4">
                            <Button 
                                onClick={() => refetch()} 
                                variant="outline"
                            >
                                Retry
                            </Button>
                            {isJsonParseError && (
                                <Button 
                                    onClick={() => window.location.reload()} 
                                    variant="default"
                                >
                                    Refresh Page
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Debug logging
    console.log('📊 Roadmaps data received:', {
        hasData: !!roadmaps,
        count: roadmaps?.length || 0,
        roadmaps: roadmaps?.map(r => ({ id: r.id, title: r.title, status: r.status }))
    });

    // Group roadmaps for "Action Lanes"
    const activeRoadmaps = roadmaps?.filter(r => ['active', 'in_progress'].includes(r.status.toLowerCase())) || [];
    const draftingRoadmaps = roadmaps?.filter(r => ['draft', 'planning'].includes(r.status.toLowerCase())) || [];
    const criticalRoadmaps = roadmaps?.filter(r => ['at_risk', 'blocked', 'behind'].includes(r.status.toLowerCase())) || [];
    const completedRoadmaps = roadmaps?.filter(r => ['completed', 'archived'].includes(r.status.toLowerCase())) || [];

    return (
        <DashboardLayout>
            <div className="space-y-8 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">

                {/* HERO SECTION - Links to Overview/Explore */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20" />

                    <div className="relative z-10 p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="max-w-2xl space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-3 py-1">
                                    Strategic Execution
                                </Badge>
                                <div className="flex items-center text-slate-400 text-sm">
                                    <Clock className="w-4 h-4 mr-1" />
                                    <span>Q1 2026 Cycle</span>
                                </div>
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                                Strategic Roadmap Command Center
                            </h1>
                            <p className="text-lg text-slate-300 leading-relaxed">
                                Align vision with execution. Manage strategic initiatives, track milestones, and ensure operational readiness across your organization.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-2">
                                {roadmaps && roadmaps.length > 0 ? (
                                    <>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg shadow-emerald-500/25 h-12 px-6">
                                                    <Layout className="w-4 h-4 mr-2" />
                                                    View Roadmap
                                                    <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-white/30">
                                                        {roadmaps.length} active
                                                    </Badge>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-64">
                                                <DropdownMenuLabel>Select Roadmap</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {roadmaps.map((roadmap) => (
                                                    <DropdownMenuItem 
                                                        key={roadmap.id}
                                                        onClick={() => setLocation(`/clients/${clientId}/roadmap/${roadmap.id}`)}
                                                        className="cursor-pointer"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{roadmap.title}</span>
                                                            <span className="text-xs text-slate-500 truncate">
                                                                {roadmap.description || "No description"}
                                                            </span>
                                                            <div className="flex items-center justify-between mt-1">
                                                                <Badge variant="outline" className="text-xs capitalize">
                                                                    {roadmap.status.replace('_', ' ')}
                                                                </Badge>
                                                                <span className="text-xs text-slate-400">
                                                                    ID: {roadmap.id}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Button
                                            onClick={() => setLocation(`/clients/${clientId}/roadmap/templates`)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-500/25 h-12 px-6"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create New Roadmap
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        onClick={() => setLocation(`/clients/${clientId}/roadmap/templates`)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-500/25 h-12 px-6"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create New Roadmap
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-12 px-6"
                                    onClick={() => setLocation(`/clients/${clientId}/roadmap/overview`)}
                                >
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    Explore Methodology
                                </Button>
                                <Button
                                    variant="outline"
                                    className="bg-emerald-600/20 border-emerald-500/30 text-emerald-100 hover:bg-emerald-600/30 h-12 px-6"
                                    onClick={() => setReportDialogOpen(true)}
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Generate Report
                                </Button>
                            </div>
                        </div>

                        {/* Workflow Visualization */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm max-w-md w-full">
                            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center">
                                <Layout className="w-4 h-4 mr-2" />
                                Execution Framework
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { label: "1. Define Strategy", icon: Target, active: true },
                                    { label: "2. Plan Initiatives", icon: Calendar, active: true },
                                    { label: "3. Execute & Track", icon: Rocket, active: false },
                                    { label: "4. Measure Impact", icon: BarChart3, active: false },
                                ].map((step, idx) => (
                                    <div key={idx} className={`flex items-center gap-3 ${step.active ? 'opacity-100' : 'opacity-40'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.active ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                            <step.icon className="w-4 h-4" />
                                        </div>
                                        <div className="h-0.5 flex-1 bg-white/10 mx-2" />
                                        <span className="text-sm font-medium">{step.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CURRENT ROADMAP SECTION */}
                {roadmaps && roadmaps.length > 0 && (
                    <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    <Layout className="w-5 h-5 text-emerald-600" />
                                    Current Roadmap
                                </h3>
                                <p className="text-sm text-slate-600 mt-1">
                                    Your organization's primary strategic roadmap
                                </p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                                        <Layout className="w-4 h-4 mr-2" />
                                        Open Roadmap
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64">
                                    <DropdownMenuLabel>Select Roadmap</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {roadmaps.map((roadmap) => (
                                        <DropdownMenuItem 
                                            key={roadmap.id}
                                            onClick={() => setLocation(`/clients/${clientId}/roadmap/${roadmap.id}`)}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium">{roadmap.title}</span>
                                                <span className="text-xs text-slate-500 truncate">
                                                    {roadmap.description || "No description"}
                                                </span>
                                                <div className="flex items-center justify-between mt-1">
                                                    <Badge variant="outline" className="text-xs capitalize">
                                                        {roadmap.status.replace('_', ' ')}
                                                    </Badge>
                                                    <span className="text-xs text-slate-400">
                                                        ID: {roadmap.id}
                                                    </span>
                                                </div>
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {roadmaps.slice(0, 3).map((roadmap) => (
                                <div key={roadmap.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-emerald-300 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-medium text-slate-900 line-clamp-1">{roadmap.title}</h4>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                {roadmap.description || "No description"}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="capitalize">
                                            {roadmap.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-xs text-slate-500">
                                            Updated {format(new Date(roadmap.updatedAt), 'MMM d, yyyy')}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => setLocation(`/clients/${clientId}/roadmap/${roadmap.id}`)}
                                        >
                                            View
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ACTION LANES */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                    {/* Lane 1: Critical Activity */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                Attention Required
                            </h3>
                            <Badge variant="secondary" className="rounded-full">{criticalRoadmaps.length}</Badge>
                        </div>

                        {criticalRoadmaps.length === 0 ? (
                            <EmptyLaneState
                                icon={CheckCircle2}
                                title="All systems go"
                                description="No roadmaps require immediate attention."
                                color="text-emerald-500"
                            />
                        ) : (
                            <div className="space-y-3">
                                {criticalRoadmaps.map(roadmap => (
                                    <RoadmapCard key={roadmap.id} roadmap={roadmap} clientId={clientId!} onDelete={handleDelete} compact />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Lane 2: Active Execution */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Zap className="w-5 h-5 text-blue-500" />
                                Active Execution
                            </h3>
                            <Badge variant="secondary" className="rounded-full">{activeRoadmaps.length}</Badge>
                        </div>

                        {activeRoadmaps.length === 0 ? (
                            <EmptyLaneState
                                icon={Rocket}
                                title="No active roadmaps"
                                description="Launch a roadmap to see it here."
                                color="text-slate-400"
                            />
                        ) : (
                            <div className="space-y-3">
                                {activeRoadmaps.map(roadmap => (
                                    <RoadmapCard key={roadmap.id} roadmap={roadmap} clientId={clientId!} onDelete={handleDelete} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Lane 3: Planning & Drafts */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Layout className="w-5 h-5 text-slate-500" />
                                Planning & Drafts
                            </h3>
                            <Badge variant="secondary" className="rounded-full">{draftingRoadmaps.length}</Badge>
                        </div>

                        {draftingRoadmaps.length === 0 ? (
                            <EmptyLaneState
                                icon={Layout}
                                title="Empty drafting board"
                                description="Start a new plan to populate this list."
                                color="text-slate-400"
                            />
                        ) : (
                            <div className="space-y-3">
                                {draftingRoadmaps.map(roadmap => (
                                    <RoadmapCard key={roadmap.id} roadmap={roadmap} clientId={clientId!} onDelete={handleDelete} compact />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RECENTLY COMPLETED / ARCHIVED (Optional Collapsible or Bottom Section) */}
                {completedRoadmaps.length > 0 && (
                    <div className="pt-8 border-t">
                        <h3 className="text-lg font-medium text-slate-500 mb-4">Completed & Archived</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {completedRoadmaps.map(roadmap => (
                                <RoadmapCard key={roadmap.id} roadmap={roadmap} clientId={clientId!} onDelete={handleDelete} compact />
                            ))}
                        </div>
                    </div>
                )}

                {/* REPORT GENERATION */}
                <div className="pt-8 border-t">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-slate-900">Generate Reports</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-emerald-600/20 border-emerald-500/30 text-emerald-700 hover:bg-emerald-600/30"
                            onClick={() => setReportDialogOpen(true)}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Generate New Report
                        </Button>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">
                        Generate roadmap reports from this dashboard. All generated reports can be managed in the <a href={`/clients/${clientId}/roadmap/reports`} className="text-emerald-600 hover:text-emerald-700 font-medium">Report Management</a> page.
                    </p>
                </div>

                <ReportGeneratorDialog
                    open={reportDialogOpen}
                    onOpenChange={setReportDialogOpen}
                    clientId={clientId!}
                />
            </div>
        </DashboardLayout>
    );
}

// ----------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------

function EmptyLaneState({ icon: Icon, title, description, color }: { icon: any, title: string, description: string, color: string }) {
    return (
        <div className="border border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center h-[200px] bg-slate-50/50">
            <div className={`p-3 rounded-full bg-white shadow-sm mb-3 ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-900">{title}</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[150px]">{description}</p>
        </div>
    )
}

function RoadmapCard({ roadmap, clientId, onDelete, compact = false }: { roadmap: any, clientId: string, onDelete: (id: string) => void, compact?: boolean }) {
    const [location, setLocation] = useLocation();

    // Helper for colors
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'at_risk': return 'bg-red-500/10 text-red-600 border-red-500/20';
            case 'planning': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    // Mock progress calculation if not available
    const progress = Math.floor(Math.random() * 100);

    return (
        <Card className="group hover:shadow-md transition-all duration-200 border-slate-200">
            <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                    <div>
                        <Badge variant="outline" className={`mb-2 capitalize ${getStatusColor(roadmap.status)}`}>
                            {roadmap.status.replace('_', ' ')}
                        </Badge>
                        <h4 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors cursor-pointer"
                            onClick={() => setLocation(`/clients/${clientId}/roadmap/${roadmap.id}`)}>
                            {roadmap.title}
                        </h4>
                        {!compact && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2.5em]">
                                {roadmap.description || "No description provided."}
                            </p>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-400 hover:text-slate-600">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setLocation(`/clients/${clientId}/roadmap/${roadmap.id}`)}>
                                View Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLocation(`/clients/${clientId}/roadmap/${roadmap.id}/edit`)}>
                                Edit Configuration
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => onDelete(roadmap.id)}>
                                Delete Roadmap
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                    <div className="flex -space-x-2">
                        {/* Mock Avatars */}
                        <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] text-slate-600">JD</div>
                        <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-[10px] text-slate-600">+2</div>
                    </div>
                    <div className="flex items-center text-xs text-slate-400">
                        <Calendar className="w-3 h-3 mr-1" />
                        {format(new Date(roadmap.updatedAt), 'MMM d, yyyy')}
                    </div>
                </div>

                <Button
                    variant="ghost"
                    className="w-full text-xs h-8 bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-200 text-slate-600 hover:text-blue-600 transition-all"
                    onClick={() => setLocation(`/clients/${clientId}/roadmap/${roadmap.id}`)}
                >
                    Open Board
                    <ChevronRight className="w-3 h-3 ml-1 opacity-50" />
                </Button>
            </div>
        </Card>
    );
}

// Roadmap Report History Component

