import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Badge } from "@complianceos/ui/ui/badge";
import { Loader2, Plus, Search, Filter, Calendar, Clock, CheckCircle2, AlertCircle, FileText, MoreHorizontal, ArrowRight, BrainCircuit } from "lucide-react";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@complianceos/ui/ui/dropdown-menu";
import { toast } from "sonner";

type AssessmentStatus = 'Planned' | 'Sent' | 'In Progress' | 'In Review' | 'Completed';

const STATUS_COLUMNS: AssessmentStatus[] = ['Planned', 'Sent', 'In Progress', 'In Review', 'Completed'];

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

    const { data: assessments, isLoading, refetch } = trpc.vendorAssessments.listAll.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const updateStatusMutation = trpc.vendorAssessments.update.useMutation({
        onSuccess: () => {
            toast.success("Status updated");
            refetch();
        }
    });

    const handleStatusUpdate = (id: number, newStatus: string) => {
        updateStatusMutation.mutate({
            id,
            status: newStatus
        });
    };

    const filteredAssessments = assessments?.filter((a: any) =>
        a.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getColumnAssessments = (status: string) => {
        return filteredAssessments?.filter((a: any) => (a.status || 'Planned') === status) || [];
    };

    const renderAssessmentCard = (assessment: any) => {
        const daysLeft = assessment.dueDate ? differenceInDays(new Date(assessment.dueDate), new Date()) : null;
        const isOverdue = daysLeft !== null && daysLeft < 0;

        return (
            <Card key={assessment.id} className="mb-3 hover:shadow-md transition-all border-l-4" style={{
                borderLeftColor: assessment.vendorCriticality === 'High' ? '#e11d48' : assessment.vendorCriticality === 'Medium' ? '#d97706' : '#10b981'
            }}>
                <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="font-semibold text-sm line-clamp-1" title={assessment.vendorName}>
                                {assessment.vendorName}
                            </div>
                            <div className="text-xs text-muted-foreground">{assessment.type}</div>
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
                            {/* Mock Avatars */}
                            <div className="w-5 h-5 rounded-full bg-blue-100 border border-white flex items-center justify-center text-[8px] text-blue-700 font-bold">JD</div>
                            <div className="w-5 h-5 rounded-full bg-purple-100 border border-white flex items-center justify-center text-[8px] text-purple-700 font-bold">ME</div>
                        </div>
                        <Link href={`/clients/${clientId}/vendors/${assessment.vendorId}?tab=assessments`}>
                            <ArrowRight className="w-3.5 h-3.5 hover:text-indigo-600 cursor-pointer" />
                        </Link>
                    </div>
                </CardContent>
            </Card>
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

    const createMutation = trpc.vendorAssessments.create.useMutation({
        onSuccess: () => {
            toast.success("Assessment scheduled");
            setIsNewOpen(false);
            setNewForm({ vendorId: "", type: "", dueDate: "" });
            refetch();
        },
        onError: (err) => toast.error("Failed to create: " + err.message)
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
        <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Security Reviews</h1>
                    <p className="text-muted-foreground">Manage active security assessments and audit workflows.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                        <BrainCircuit className="w-4 h-4 mr-2" />
                        AI Review Assistant
                    </Button>
                    <Button onClick={() => setIsNewOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> New Assessment
                    </Button>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search assessments..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
                </div>
            ) : (
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex gap-4 min-w-[1200px] h-full pb-4">
                        {STATUS_COLUMNS.map(status => (
                            <div key={status} className="flex-1 min-w-[280px] flex flex-col bg-slate-50/50 rounded-lg border border-slate-100">
                                <div className="p-3 font-medium text-sm flex justify-between items-center border-b bg-white rounded-t-lg">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", getStatusColor(status).split(" ")[1].replace("text-", "bg-"))} />
                                        {status}
                                    </div>
                                    <Badge variant="secondary" className="text-xs font-normal">
                                        {getColumnAssessments(status).length}
                                    </Badge>
                                </div>
                                <div className="p-3 overflow-y-auto flex-1 custom-scrollbar">
                                    {getColumnAssessments(status).map(renderAssessmentCard)}
                                    {getColumnAssessments(status).length === 0 && (
                                        <div className="text-center py-8 text-xs text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
                                            No items
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
