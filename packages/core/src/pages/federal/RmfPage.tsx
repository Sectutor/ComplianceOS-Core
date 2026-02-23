
import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import {
    Shield,
    Plus,
    ArrowRight,
    Calendar,
    Trash2,
    FileText,
    Download,
    Target,
    BarChart3,
    Activity,
    Layers,
    CheckCircle2
} from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@complianceos/ui/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@complianceos/ui/ui/dialog";

export default function RmfPage() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [, setLocation] = useLocation();
    const utils = trpc.useUtils();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newWorkflow, setNewWorkflow] = useState({
        systemName: "",
    });

    const { data: workflows, isLoading } = trpc.federal.listRmfWorkflows.useQuery({ clientId });

    const createMutation = trpc.federal.createRmfWorkflow.useMutation({
        onSuccess: () => {
            toast.success("RMF Workflow created successfully");
            setIsCreateOpen(false);
            utils.federal.listRmfWorkflows.invalidate({ clientId });
            setNewWorkflow({ systemName: "" });
        },
        onError: (err) => {
            toast.error("Failed to create workflow: " + err.message);
        }
    });

    const handleCreate = () => {
        if (!newWorkflow.systemName) {
            toast.error("System Name is required");
            return;
        }
        createMutation.mutate({
            clientId,
            ...newWorkflow
        });
    };

    const [workflowToDelete, setWorkflowToDelete] = useState<any>(null);

    const deleteMutation = trpc.federal.deleteRmfWorkflow.useMutation({
        onSuccess: () => {
            toast.success("RMF Workflow deleted successfully");
            utils.federal.listRmfWorkflows.invalidate({ clientId });
            setWorkflowToDelete(null);
        },
        onError: (err) => {
            toast.error(`Error deleting workflow: ${err.message}`);
        }
    });

    const handleDelete = () => {
        if (workflowToDelete) {
            deleteMutation.mutate({ clientId, id: workflowToDelete.id });
        }
    };

    const getStepStatusColor = (step: number, status: any) => {
        // Simple logic: if step is completed, green. If in progress, blue.
        const s = status?.[step] || 'not_started';
        if (s === 'completed') return 'bg-emerald-500';
        if (s === 'in_progress') return 'bg-blue-500';
        return 'bg-slate-200';
    };

    const getCurrentStepLabel = (step: any) => {
        const steps = ["Prepare", "Categorize", "Select", "Implement", "Assess", "Authorize", "Monitor"];
        const stepNum = parseInt(step || "1");
        return steps[stepNum - 1] || "Unknown";
    };

    return (
        <DashboardLayout>
            <div className="pb-20">
                <div className="px-6 pt-6 pb-2">
                    <Breadcrumb items={[
                        { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                        { label: "Federal Compliance", href: `/clients/${clientId}/federal` },
                        { label: "RMF Workflows" }
                    ]} />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-40 bg-slate-50/90 backdrop-blur-xl py-4 px-6 border-b border-slate-200 shadow-sm mb-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Layers className="h-10 w-10 text-blue-600" />
                            RMF Workflows
                        </h1>
                        <p className="text-slate-500 text-lg">Manage NIST Risk Management Framework (RMF) authorization cycles.</p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95">
                                <Plus className="h-5 w-5" />
                                New System Authorization
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-3xl p-8">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">New RMF Workflow</DialogTitle>
                                <DialogDescription>
                                    Start a new 7-step Risk Management Framework cycle for a system.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="systemName" className="font-bold text-slate-700">System Name</Label>
                                    <Input
                                        id="systemName"
                                        placeholder="e.g. Core Logistics System"
                                        className="h-12 rounded-xl"
                                        value={newWorkflow.systemName}
                                        onChange={(e) => setNewWorkflow({ ...newWorkflow, systemName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="h-12 rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={createMutation.isLoading}
                                    className="h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold px-8"
                                >
                                    {createMutation.isLoading ? "Creating..." : "Start Workflow"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="px-6 space-y-8">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-64 bg-slate-100 rounded-3xl" />
                            ))}
                        </div>
                    ) : workflows?.length === 0 ? (
                        <Card className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-20 text-center">
                            <div className="flex flex-col items-center max-w-md mx-auto space-y-4">
                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
                                    <Layers className="h-12 w-12 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">No RMF Workflows Found</h3>
                                <p className="text-slate-500">
                                    You haven't started any RMF authorization cycles yet.
                                    Create one to begin the 7-step process.
                                </p>
                                <Button
                                    onClick={() => setIsCreateOpen(true)}
                                    variant="outline"
                                    className="mt-4 border-slate-300 rounded-xl font-bold h-11 px-8"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Start First Workflow
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                            {workflows?.map((workflow: any) => (
                                <Card
                                    key={workflow.id}
                                    className="group rounded-3xl border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-500 overflow-hidden flex flex-col"
                                >
                                    <div className="cursor-pointer" onClick={() => setLocation(`/clients/${clientId}/federal/rmf/${workflow.id}`)}>
                                        <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
                                        <CardHeader className="pb-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
                                                    <Layers className="h-6 w-6 text-slate-400 group-hover:text-blue-600" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="bg-white">Step {workflow.currentStep}</Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setWorkflowToDelete(workflow);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                                                {workflow.systemName}
                                            </CardTitle>
                                            <CardDescription className="text-sm font-medium text-slate-500 mt-2">
                                                Current Phase: <span className="text-slate-900 font-bold">{getCurrentStepLabel(workflow.currentStep)}</span>
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1 space-y-6 pt-0">
                                            {/* Mini Progress Bar */}
                                            <div className="flex gap-1 h-2 mt-4">
                                                {[1, 2, 3, 4, 5, 6, 7].map(step => (
                                                    <div
                                                        key={step}
                                                        className={`flex-1 rounded-full ${getStepStatusColor(step, workflow.stepStatus)}`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                <span>Prepare</span>
                                                <span>Monitor</span>
                                            </div>
                                        </CardContent>
                                    </div>
                                    <CardFooter className="bg-slate-50/50 p-6 pt-0 flex flex-col gap-3 group-hover:bg-blue-50/50 transition-colors">
                                        <div className="w-full flex justify-between items-center mb-2 px-1">
                                            <div className="flex items-center text-xs font-bold text-slate-400">
                                                <Calendar className="h-3 w-3 mr-1.5" />
                                                Last updated: {new Date(workflow.updatedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full">
                                            <Button
                                                className="w-full rounded-xl h-11 bg-slate-900 hover:bg-black text-white font-bold text-xs gap-2"
                                                onClick={() => setLocation(`/clients/${clientId}/federal/rmf/${workflow.id}`)}
                                            >
                                                Manage Authorization
                                                <ArrowRight className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}

                            {/* Quick Add Placeholder */}
                            <div
                                onClick={() => setIsCreateOpen(true)}
                                className="h-full min-h-[300px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center space-y-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group"
                            >
                                <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors">
                                    <Plus className="h-8 w-8 text-slate-300 group-hover:text-blue-500" />
                                </div>
                                <span className="font-bold text-slate-400 group-hover:text-blue-600">New Authorization</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AlertDialog open={!!workflowToDelete} onOpenChange={(open) => !open && setWorkflowToDelete(null)}>
                <AlertDialogContent className="rounded-3xl p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-900">
                            Delete Workflow?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-base leading-relaxed">
                            This will permanently delete the RMF workflow for <span className="font-bold text-slate-900">"{workflowToDelete?.systemName}"</span> and all associated assessments and artifacts. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="rounded-xl h-12 font-bold px-8">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="rounded-xl h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold px-8"
                            disabled={deleteMutation.isLoading}
                        >
                            {deleteMutation.isLoading ? "Deleting..." : "Delete Workflow"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
