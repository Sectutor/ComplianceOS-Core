
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Plus, Layout, ArrowRight, Calendar, ClipboardList } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Link, useLocation } from "wouter";
import { useClientContext } from "@/contexts/ClientContext";
import { useParams } from "wouter";
import { trpc } from '@/lib/trpc';
import { Badge } from "@complianceos/ui/ui/badge";
import { useState } from 'react';
import { FileText } from 'lucide-react';
import ImplementationReportDialog from './ImplementationReportDialog';
import { toast } from 'sonner';
import { MyTasksView } from './MyTasksView';
import { TeamWorkloadChart } from './TeamWorkloadChart';
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
import { Trash2 } from "lucide-react";

export default function ImplementationDashboard() {
    const params = useParams();
    const [, setLocation] = useLocation();
    const clientIdParam = params.id ? parseInt(params.id, 10) : null;
    const { selectedClientId } = useClientContext();
    const clientId = clientIdParam || selectedClientId;

    // Dialog state
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<{ id: number, title: string } | null>(null);

    const utils = trpc.useContext();
    const { data: plans, isLoading } = trpc.implementation.list.useQuery({
        clientId: clientId!
    }, { enabled: !!clientId });

    const deletePlanMutation = trpc.implementation.deletePlan.useMutation({
        onSuccess: () => {
            toast.success("Plan deleted successfully");
            utils.implementation.list.invalidate();
            setDeleteDialogOpen(false);
            setPlanToDelete(null);
        },
        onError: (err) => {
            toast.error("Failed to delete plan", { description: err.message });
        }
    });

    const handleDeleteClick = (e: React.MouseEvent, plan: any) => {
        e.stopPropagation(); // Prevent card click
        setPlanToDelete(plan);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (planToDelete) {
            deletePlanMutation.mutate({ planId: planToDelete.id });
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 p-8 animate-in fade-in duration-500 max-w-[1200px] mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Tactical Implementation</h2>
                        <p className="text-muted-foreground mt-2">
                            Manage your security projects and track execution progress.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="bg-white/50 hover:bg-white border-slate-200"
                            onClick={() => setReportDialogOpen(true)}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Generate Report
                        </Button>
                        <Link href={`/clients/${clientId}/implementation/create`}>
                            <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                                <Plus className="w-4 h-4 mr-2" />
                                Create New Plan
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MyTasksView />
                    {clientId && <TeamWorkloadChart clientId={clientId} />}
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-slate-900">Active Plans</h3>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : plans && plans.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {plans.map((plan) => (
                                <Card
                                    key={plan.id}
                                    className="group hover:border-blue-400 hover:shadow-xl transition-all duration-300 border-slate-200 cursor-pointer overflow-hidden relative"
                                    onClick={() => setLocation(`/clients/${clientId}/implementation/kanban/${plan.id}`)}
                                >
                                    <div className="absolute top-0 right-0 p-4 flex gap-2">
                                        <Badge variant="outline" className="bg-white/80 backdrop-blur-sm text-[10px] uppercase">
                                            {plan.status.replace('_', ' ')}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50 -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-all"
                                            onClick={(e) => handleDeleteClick(e, plan)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                    <CardHeader className="pb-2">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                            <ClipboardList className="w-5 h-5 pointer-events-none" />
                                        </div>
                                        <CardTitle className="text-xl line-clamp-1">{plan.title}</CardTitle>
                                        <CardDescription className="line-clamp-2 h-10 mt-2">
                                            {plan.description || "Project implementation and task management."}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-2">
                                            <div className="flex items-center text-xs text-slate-500">
                                                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                                {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : 'N/A'}
                                            </div>
                                            <div className="flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                Manage Board <ArrowRight className="ml-1.5 w-4 h-4" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Layout className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900">No Implementation Plans</h3>
                            <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                                Kickstart your security journey by creating a plan manually or from a strategic roadmap.
                            </p>
                            <Link href={`/clients/${clientId}/implementation/create`}>
                                <Button variant="outline" className="mt-6 bg-white">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    )}

                </div>

                {/* IMPLEMENTATION REPORT HISTORY */}
                <div className="pt-8 border-t">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-slate-900">Generate Reports</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-600/20 border-blue-500/30 text-blue-700 hover:bg-blue-600/30"
                            onClick={() => setReportDialogOpen(true)}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Generate New Report
                        </Button>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">
                        Generate implementation reports from this dashboard. All generated reports can be managed in the <a href={`/clients/${clientId}/roadmap/reports`} className="text-blue-600 hover:text-blue-700 font-medium">Report Management</a> page.
                    </p>
                </div>

                <ImplementationReportDialog
                    open={reportDialogOpen}
                    onOpenChange={setReportDialogOpen}
                    clientId={clientId!}
                />

                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the plan <strong>{planToDelete?.title}</strong> and all associated tasks. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                                {deletePlanMutation.isPending ? "Deleting..." : "Delete Plan"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}

// Implementation Report History Component

