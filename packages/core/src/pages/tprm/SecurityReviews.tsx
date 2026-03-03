import React, { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Badge } from "@complianceos/ui/ui/badge";
import { Loader2, Plus, Search, Filter, Calendar, Clock, CheckCircle2, AlertCircle, FileText, MoreHorizontal, ArrowRight, BrainCircuit, GripVertical } from "lucide-react";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@complianceos/ui/ui/dropdown-menu";
import { toast } from "sonner";
import { PageGuide } from "@/components/PageGuide";

type AssessmentStatus = 'Planned' | 'Sent' | 'In Progress' | 'In Review' | 'Completed';

const STATUS_COLUMNS: AssessmentStatus[] = ['Planned', 'Sent', 'In Progress', 'In Review', 'Completed'];

// Column color configurations for distinct visual differentiation
const COLUMN_COLORS = {
    'Planned': {
        headerBg: 'bg-slate-600',
        headerText: 'text-white',
        columnBg: 'bg-slate-50',
        border: 'border-slate-200',
        dot: 'bg-slate-500',
        badge: 'bg-slate-100 text-slate-700',
        accent: '#64748b',
    },
    'Sent': {
        headerBg: 'bg-blue-600',
        headerText: 'text-white',
        columnBg: 'bg-blue-50/70',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        badge: 'bg-blue-100 text-blue-700',
        accent: '#2563eb',
    },
    'In Progress': {
        headerBg: 'bg-amber-500',
        headerText: 'text-white',
        columnBg: 'bg-amber-50/70',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        badge: 'bg-amber-100 text-amber-700',
        accent: '#d97706',
    },
    'In Review': {
        headerBg: 'bg-violet-600',
        headerText: 'text-white',
        columnBg: 'bg-violet-50/70',
        border: 'border-violet-200',
        dot: 'bg-violet-500',
        badge: 'bg-violet-100 text-violet-700',
        accent: '#7c3aed',
    },
    'Completed': {
        headerBg: 'bg-emerald-600',
        headerText: 'text-white',
        columnBg: 'bg-emerald-50/70',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-700',
        accent: '#059669',
    },
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Planned': return 'bg-slate-100 text-slate-600';
        case 'Sent': return 'bg-blue-50 text-blue-600';
        case 'In Progress': return 'bg-amber-50 text-amber-600';
        case 'In Review': return 'bg-purple-50 text-purple-600';
        case 'Completed': return 'bg-emerald-50 text-emerald-600';
        default: return 'bg-slate-100 text-slate-600';
    }
};

const getRiskColor = (criticality: string | null) => {
    switch (criticality) {
        case 'High': return 'text-rose-600 bg-rose-50 border-rose-200';
        case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200';
        default: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
};

export default function SecurityReviews() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [searchTerm, setSearchTerm] = useState("");
    const [draggedItem, setDraggedItem] = useState<{ id: number; status: string } | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const { data: assessments, isLoading, refetch } = trpc.vendors.listAll.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const updateStatusMutation = trpc.vendors.update.useMutation({
        onSuccess: () => {
            toast.success("Status updated");
            refetch();
            // Clear drag state on successful update
            setDraggedItem(null);
            setDragOverColumn(null);
        },
        onError: (err: any) => {
            toast.error("Failed to update status: " + (err.message || "Unknown error"));
            console.error('Status update failed:', err);
            // Clear drag state on error too to avoid stuck UI
            setDraggedItem(null);
            setDragOverColumn(null);
        }
    });

    const handleStatusUpdate = (id: number, newStatus: string) => {
        updateStatusMutation.mutate({
            id,
            status: newStatus
        });
    };

    const handleDragStart = (e: React.DragEvent, assessment: any) => {
        try {
            setDraggedItem({ id: assessment.id, status: assessment.status || 'Planned' });
            e.dataTransfer.effectAllowed = 'move';
            // Set default drag image behavior - no custom image needed for basic functionality
            // This is more reliable than creating temporary DOM elements
        } catch (err) {
            console.error('Drag start failed:', err);
            // Continue with drag even if setup fails
        }
    };

    const handleDragEnd = () => {
        // Delay clearing state to allow drag cancellation to complete
        setTimeout(() => {
            setDraggedItem(null);
            setDragOverColumn(null);
        }, 50);
    };

    const handleDragOver = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(status);
    };

    const handleDrop = (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        // Don't clear state here - let the mutation callbacks handle it
        // This ensures state is cleared whether the update succeeds or fails
        if (draggedItem && draggedItem.status !== newStatus) {
            handleStatusUpdate(draggedItem.id, newStatus);
        } else {
            // If no actual status change, just clear state
            setDraggedItem(null);
            setDragOverColumn(null);
        }
    };

    const filteredAssessments = assessments?.filter((a: any) =>
        a.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getColumnAssessments = (status: string) => {
        return filteredAssessments?.filter((a: any) => (a.status || 'Planned') === status) || [];
    };

    const renderAssessmentCard = (assessment: any, columnStatus: string) => {
        const daysLeft = assessment.dueDate ? differenceInDays(new Date(assessment.dueDate), new Date()) : null;
        const isOverdue = daysLeft !== null && daysLeft < 0;
        const isDragging = draggedItem?.id === assessment.id;

        return (
            <div
                key={assessment.id}
                draggable
                onDragStart={(e) => handleDragStart(e, assessment)}
                onDragEnd={handleDragEnd}
                className={cn(
                    "mb-3 cursor-grab active:cursor-grabbing transition-all",
                    isDragging && "opacity-50"
                )}
            >
                <Card className="hover:shadow-md border-l-4 bg-white" style={{
                    borderLeftColor: assessment.vendorCriticality === 'High' ? '#e11d48' : assessment.vendorCriticality === 'Medium' ? '#d97706' : (COLUMN_COLORS[columnStatus as AssessmentStatus]?.accent || '#10b981')
                }}>
                    <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-start gap-2">
                                <GripVertical className="w-4 h-4 text-slate-300 mt-1 flex-shrink-0" />
                                <div>
                                    <div className="font-semibold text-sm line-clamp-1" title={assessment.vendorName}>
                                        {assessment.vendorName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{assessment.type}</div>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-6 w-6 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(assessment.id, 'Planned')}>Move to Planned</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(assessment.id, 'Sent')}>Move to Sent</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(assessment.id, 'In Progress')}>Move to In Progress</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(assessment.id, 'In Review')}>Move to In Review</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(assessment.id, 'Completed')}>Mark Completed</DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/clients/${clientId}/vendors/${assessment.vendorId}?tab=assessments`}>View Details</Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getRiskColor(assessment.vendorCriticality))}>
                                {assessment.vendorCriticality} Risk
                            </Badge>
                            {assessment.score && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    Score: {assessment.score}
                                </Badge>
                            )}
                        </div>

                        {assessment.dueDate && (
                            <div className={cn("flex items-center gap-1.5 text-xs", isOverdue ? "text-rose-600 font-medium" : "text-slate-500")}>
                                {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {isOverdue ? `${Math.abs(daysLeft!)} days overdue` : `${daysLeft} days left`}
                            </div>
                        )}

                        <div className="pt-2 flex justify-between items-center text-xs text-muted-foreground border-t mt-2">
                            <div className="flex -space-x-1.5">
                                <div className="w-5 h-5 rounded-full bg-blue-100 border border-white flex items-center justify-center text-[8px] text-blue-700 font-bold">JD</div>
                                <div className="w-5 h-5 rounded-full bg-purple-100 border border-white flex items-center justify-center text-[8px] text-purple-700 font-bold">ME</div>
                            </div>
                            <Link href={`/clients/${clientId}/vendors/${assessment.vendorId}?tab=assessments`}>
                                <ArrowRight className="w-3.5 h-3.5 hover:text-indigo-600 cursor-pointer" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    // New Assessment State
    const [isNewOpen, setIsNewOpen] = useState(false);
    const [newForm, setNewForm] = useState({
        vendorId: "",
        type: "",
        dueDate: ""
    });

    const { data: vendors } = trpc.vendors.list.useQuery({ clientId });

    const createMutation = trpc.vendors.create.useMutation({
        onSuccess: () => {
            toast.success("Assessment scheduled");
            setIsNewOpen(false);
            setNewForm({ vendorId: "", type: "", dueDate: "" });
            refetch();
        },
        onError: (err: any) => toast.error("Failed to create: " + err.message)
    });

    const handleCreate = () => {
        if (!newForm.vendorId) return toast.error("Vendor is required");
        if (!newForm.type) return toast.error("Assessment Type is required");

        createMutation.mutate({
            clientId,
            vendorId: parseInt(newForm.vendorId),
            type: newForm.type,
            dueDate: newForm.dueDate,
            status: 'Planned'
        });
    };

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col animate-in fade-in duration-500 bg-slate-50">
            <div className="bg-white border-b px-6 py-4 shadow-sm">
                <div className="flex justify-between items-center">
                    <div>
                        <PageGuide
                            title="Assessment Projects"
                            description="Manage active assessment projects and workflows."
                            rationale="Systematic evaluation of vendor security controls reduces third-party risk."
                            moduleId="vendor-security-reviews"
                            isTrainingRequirement={true}
                            howToUse={[
                                {
                                    step: "Schedule",
                                    description: "Initiate new assessments (SIG, CAIQ).",
                                    targetId: "btn-new-assessment"
                                },
                                {
                                    step: "Search",
                                    description: "Quickly locate specific vendor reviews.",
                                    targetId: "search-assessments"
                                },
                                {
                                    step: "Track & Move",
                                    description: "Drag and drop assessments across columns to update lifecycle status.",
                                    targetId: "column-Planned"
                                },
                                {
                                    step: "Review",
                                    description: "Analyze vendor responses and approve completed reviews.",
                                    targetId: "column-In Review"
                                }
                            ]}
                            scenarios={[
                                {
                                    title: "Annual Vendor Re-assessment",
                                    example: "A high-criticality vendor's SOC2 report has expired. You need to schedule a new SIG questionnaire.",
                                    auditTip: "Auditors look for 'Review Closure'—ensure that any 'In Review' items have detailed notes before moving to 'Completed'."
                                },
                                {
                                    title: "Handling Obstructed Reviews",
                                    example: "Vendor is unresponsive after 'Sent'. Move item to 'In Progress' with a comment to follow up via legal.",
                                    auditTip: "Document all follow-up attempts directly in the vendor notes for a clear evidence trail."
                                }
                            ]}
                            resources={[
                                {
                                    name: "Third-Party Risk Policy",
                                    description: "Master document outlining vendor criticality levels.",
                                    href: "/policies/tprm-policy"
                                },
                                {
                                    name: "Standard Assessment Guide",
                                    description: "Internal guide on how to grade SIG/CAIQ responses.",
                                    href: "/resources/grading-rubric"
                                }
                            ]}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                            <BrainCircuit className="w-4 h-4 mr-2" />
                            AI Review Assistant
                        </Button>
                        <Button id="btn-new-assessment" onClick={() => setIsNewOpen(true)} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700">
                            <Plus className="mr-2 h-4 w-4" /> New Assessment
                        </Button>
                    </div>
                </div>

                <div className="flex gap-4 mt-4">
                    <div id="search-assessments" className="relative w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search assessments by vendor or type..."
                            className="pl-9 bg-slate-50 border-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="border-slate-200"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
                </div>
            ) : (
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex gap-4 min-w-[1200px] h-full pb-4 p-4">
                        {STATUS_COLUMNS.map(status => (
                            <div
                                key={status}
                                id={`column-${status}`}
                                className={`flex-1 min-w-[280px] flex flex-col rounded-lg border ${COLUMN_COLORS[status].border} shadow-sm transition-all ${dragOverColumn === status ? 'ring-2 ring-indigo-400 ring-offset-2 bg-indigo-50' : ''}`}
                                style={{ backgroundColor: status === 'Planned' ? '#f8fafc' : status === 'Sent' ? '#eff6ff' : status === 'In Progress' ? '#fffbeb' : status === 'In Review' ? '#f5f3ff' : '#ecfdf5' }}
                                onDragOver={(e) => handleDragOver(e, status)}
                                onDragLeave={() => setDragOverColumn(null)}
                                onDrop={(e) => handleDrop(e, status)}
                            >
                                <div className={`p-3 font-semibold text-sm flex justify-between items-center rounded-t-lg ${COLUMN_COLORS[status].headerBg} ${COLUMN_COLORS[status].headerText} shadow-sm`}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${COLUMN_COLORS[status].dot} ring-2 ring-white/30`} />
                                        <span>{status}</span>
                                    </div>
                                    <Badge className={`${COLUMN_COLORS[status].badge} text-xs font-semibold px-2 py-0.5 shadow-sm`}>
                                        {getColumnAssessments(status).length}
                                    </Badge>
                                </div>
                                <div className="p-3 overflow-y-auto flex-1 custom-scrollbar">
                                    {getColumnAssessments(status).map((assessment: any) => renderAssessmentCard(assessment, status))}
                                    {getColumnAssessments(status).length === 0 && (
                                        <div className="text-center py-8 text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-lg bg-white/50">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <CheckCircle2 className="w-4 h-4 text-slate-300" />
                                                </div>
                                                Drop here
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <EnhancedDialog
                open={isNewOpen}
                onOpenChange={setIsNewOpen}
                title="Schedule New Assessment"
                description="Start a new security review or questionnaire for a vendor."
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="outline" onClick={() => setIsNewOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={createMutation.isPending}>
                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Schedule
                        </Button>
                    </div>
                }
            >
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Vendor</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background md:text-sm"
                            value={newForm.vendorId}
                            onChange={(e) => setNewForm({ ...newForm, vendorId: e.target.value })}
                        >
                            <option value="">Select a vendor...</option>
                            {vendors?.map((v: any) => (
                                <option key={v.vendor.id} value={v.vendor.id}>{v.vendor.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Assessment Type</label>
                        <Input
                            placeholder="e.g. SOC2 Review, SIG Lite, Security Questionnaire 2024"
                            value={newForm.type}
                            onChange={(e) => setNewForm({ ...newForm, type: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Due Date</label>
                        <Input
                            type="date"
                            value={newForm.dueDate}
                            onChange={(e) => setNewForm({ ...newForm, dueDate: e.target.value })}
                        />
                    </div>
                </div>
            </EnhancedDialog>
        </div>
    );
}
