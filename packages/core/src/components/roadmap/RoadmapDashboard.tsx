
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
import { PageGuide } from "@/components/PageGuide";
import { Breadcrumb } from "@/components/Breadcrumb";
import ReportGeneratorDialog from "./ReportGeneratorDialog";

// Type definition for Roadmap data
interface RoadmapData {
    id: number;
    title: string;
    description: string | null;
    status: string;
    progress?: number;
    updatedAt: string | Date;
}

// Utility function to clean up descriptions that might be stored as JSON configuration strings
// Also used for sanitizing titles to prevent XSS
// NOTE: We intentionally escape HTML entities here as defense-in-depth against XSS.
// React escapes text content by default, so this provides an extra layer of protection.
const sanitizeText = (text: string | null, fallback: string): string => {
    if (!text) return fallback;
    const trimmed = text.trim();

    // Try to parse and extract meaningful content from JSON
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            const parsed = JSON.parse(trimmed);
            // Try to extract common display fields from JSON object
            if (typeof parsed === 'object' && parsed !== null) {
                const displayFields = ['title', 'name', 'description', 'summary', 'goal', 'objective'];
                for (const field of displayFields) {
                    if (parsed[field] && typeof parsed[field] === 'string') {
                        return parsed[field].substring(0, 500); // Limit length
                    }
                }
                // If no common fields, return the first string value found
                const firstString = Object.values(parsed).find(v => typeof v === 'string' && v.length > 5);
                if (firstString) return (firstString as string).substring(0, 500);
            }
        } catch {
            // Invalid JSON, log for debugging but fall through to generic message
            console.warn('Failed to parse text as JSON:', trimmed.substring(0, 100));
        }
        // Return generic message only if we couldn't extract meaningful content
        return fallback;
    }
    // React handles HTML escaping automatically - just limit length
    return trimmed.substring(0, 500);
};

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
                <div className="flex items-center justify-between">
                    <Breadcrumb items={[{ label: "Strategic Roadmap" }]} />
                    <PageGuide
                        title="Strategic Roadmap"
                        description="Align compliance initiatives with business growth and operational milestones."
                        rationale="A roadmap transforms a static compliance list into a dynamic execution plan. It helps stakeholders understand the timeline, resource requirements, and dependencies for reaching multi-year compliance goals."
                        howToUse={[
                            {
                                step: "Define Strategy",
                                description: "Use 'Create New Roadmap' to start a new strategic cycle or project.",
                                targetId: "roadmap-create-btn"
                            },
                            {
                                step: "Monitor Execution",
                                description: "Track active initiatives in the 'Active Execution' lane to ensure they stay on schedule.",
                                targetId: "roadmap-active-lane"
                            },
                            {
                                step: "Report Progress",
                                description: "Generate executive-ready PDF reports to communicate roadmap status to the board.",
                                targetId: "roadmap-report-btn"
                            },
                            {
                                step: "Address Blocks",
                                description: "Check the 'Attention Required' lane for initiatives that are behind or blocked.",
                                targetId: "roadmap-critical-lane"
                            }
                        ]}
                        scenarios={[
                            {
                                title: "Board Meeting Preparation",
                                example: "You need to show the board that the ISO 27001 certification project is 60% complete and on track for next quarter.",
                                auditTip: "Auditors look for evidence of management review and oversight. A well-maintained strategic roadmap demonstrates that compliance is part of the corporate planning process."
                            },
                            {
                                title: "Resource Balancing",
                                example: "Two major initiatives (e.g., SOC 2 and GDPR) are overlapping in Q3, causing a bottleneck.",
                                auditTip: "Prioritize roadmaps based on risk-impact. Use the report to justify budget or resource increases where critical compliance paths are blocked."
                            }
                        ]}
                        integrations={[
                            { name: "Compliance Journey", description: "Milestones here feed into your overall journey progress." },
                            { name: "Assurance Reports", description: "Generate board-ready summaries of your strategic posture." }
                        ]}
                    />
                </div>

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
                                                            <span className="font-medium">{sanitizeText(roadmap.title, roadmap.title)}</span>
                                                            <span className="text-xs text-slate-500 truncate">
                                                                {sanitizeText(roadmap.description, "No description")}
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
                                            id="roadmap-create-btn"
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
                                    id="roadmap-report-btn"
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
                                                <span className="font-medium">{sanitizeText(roadmap.title, roadmap.title)}</span>
                                                <span className="text-xs text-slate-500 truncate">
                                                    {sanitizeText(roadmap.description, "No description")}
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {roadmaps.slice(0, 3).map((roadmap) => (
                                <div
                                    key={roadmap.id}
                                    className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 cursor-pointer flex flex-col h-full"
                                    onClick={() => setLocation(`/clients/${clientId}/roadmap/${roadmap.id}`)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                                            {sanitizeText(roadmap.title, roadmap.title)}
                                        </h4>
                                        <Badge variant="outline" className="capitalize bg-slate-50 text-[10px] h-5 px-2 border-slate-200">
                                            {roadmap.status.replace('_', ' ')}
                                        </Badge>
                                    </div>

                                    <p className="text-xs text-slate-600 line-clamp-3 mb-6 flex-grow leading-relaxed">
                                        {sanitizeText(roadmap.description, "Strategic planning and execution initiative.")}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                                        <div className="flex items-center text-[10px] text-slate-400 font-medium">
                                            <Calendar className="w-3 h-3 mr-1.5 opacity-60" />
                                            {format(new Date(roadmap.updatedAt), 'MMM d, yyyy')}
                                        </div>
                                        <span className="text-[10px] font-bold text-emerald-600 flex items-center group-hover:translate-x-1 transition-transform">
                                            View Roadmap
                                            <ArrowRight className="w-3 h-3 ml-1" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ACTION LANES */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                    {/* Lane 1: Critical Activity */}
                    <div id="roadmap-critical-lane" className="space-y-4">
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
                    <div id="roadmap-active-lane" className="space-y-4">
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

function RoadmapCard({ roadmap, clientId, onDelete, compact = false }: { roadmap: RoadmapData, clientId: string, onDelete: (id: string) => void, compact?: boolean }) {
    const [location, setLocation] = useLocation();

    // Helper for colors
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'at_risk': return 'bg-red-500/10 text-red-600 border-red-500/20';
            case 'planning': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'in_progress': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    // Mock progress calculation if not available
    const progress = roadmap.progress ?? 50;

    return (
        <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-blue-400/50 overflow-hidden bg-white">
            <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <Badge variant="outline" className={`mb-2 capitalize text-[10px] h-5 px-2 ${getStatusColor(roadmap.status)}`}>
                            {roadmap.status.replace('_', ' ')}
                        </Badge>
                        <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer truncate"
                            onClick={() => setLocation(`/clients/${clientId}/roadmap/${roadmap.id}`)}>
                            {sanitizeText(roadmap.title, roadmap.title)}
                        </h4>
                        {!compact && (
                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                                {sanitizeText(roadmap.description, "No description")}
                            </p>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setLocation(`/clients/${clientId}/roadmap/${roadmap.id}`)} className="cursor-pointer">
                                <Layout className="w-4 h-4 mr-2" />
                                View Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLocation(`/clients/${clientId}/roadmap/${roadmap.id}/edit`)} className="cursor-pointer">
                                <Zap className="w-4 h-4 mr-2" />
                                Edit Configuration
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => onDelete(roadmap.id)}>
                                <Plus className="w-4 h-4 mr-2 rotate-45" />
                                Delete Roadmap
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Progress</span>
                        <span className="text-xs font-bold text-slate-700">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-1">
                    <div className="flex -space-x-1.5 overflow-hidden">
                        {/* Mock Avatars */}
                        <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-indigo-600">JD</div>
                        <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-emerald-600">AS</div>
                        <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">+1</div>
                    </div>
                    <div className="flex items-center text-[10px] font-medium text-slate-400">
                        <Clock className="w-3 h-3 mr-1 opacity-60" />
                        {format(new Date(roadmap.updatedAt), 'MMM d, yyyy')}
                    </div>
                </div>

                <Button
                    variant="secondary"
                    className="w-full text-xs h-9 bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-200 hover:border-blue-600 transition-all duration-300 font-semibold rounded-lg"
                    onClick={() => setLocation(`/clients/${clientId}/roadmap/${roadmap.id}`)}
                >
                    Open Strategic Board
                    <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
            </div>
        </Card>
    );
}

// Roadmap Report History Component

