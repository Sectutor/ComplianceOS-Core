
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
    BarChart3
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

export default function DfarsPage() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [, setLocation] = useLocation();
    const utils = trpc.useUtils();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newAssessment, setNewAssessment] = useState({
        title: "",
        scopeDescription: ""
    });

    const { data: assessments, isLoading } = trpc.federal.listSprsAssessments.useQuery({ clientId });

    const createMutation = trpc.federal.createSprsAssessment.useMutation({
        onSuccess: () => {
            toast.success("Assessment created successfully");
            setIsCreateOpen(false);
            utils.federal.listSprsAssessments.invalidate({ clientId });
            setNewAssessment({ title: "", scopeDescription: "" });
        },
        onError: (err) => {
            toast.error("Failed to create assessment: " + err.message);
        }
    });

    const handleCreate = () => {
        if (!newAssessment.title) {
            toast.error("Assessment title is required");
            return;
        }
        createMutation.mutate({
            clientId,
            ...newAssessment
        });
    };

    const [assessmentToDelete, setAssessmentToDelete] = useState<any>(null);

    const deleteMutation = trpc.federal.deleteSprsAssessment.useMutation({
        onSuccess: () => {
            toast.success("Assessment deleted successfully");
            utils.federal.listSprsAssessments.invalidate({ clientId });
            setAssessmentToDelete(null);
        },
        onError: (err) => {
            toast.error(`Error deleting assessment: ${err.message}`);
        }
    });

    const handleDelete = () => {
        if (assessmentToDelete) {
            deleteMutation.mutate({ clientId, assessmentId: assessmentToDelete.id });
        }
    };

    const getScoreColor = (score: number | null) => {
        const s = score ?? 0;
        if (s === 110) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (s >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (s >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-rose-600 bg-rose-50 border-rose-200';
    };

    return (
        <DashboardLayout>
            <div className="pb-20">
                <div className="px-6 pt-6 pb-2">
                    <Breadcrumb items={[
                        { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                        { label: "Federal Compliance", href: `/clients/${clientId}/federal` },
                        { label: "DFARS / SPRS" }
                    ]} />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-40 bg-slate-50/90 backdrop-blur-xl py-4 px-6 border-b border-slate-200 shadow-sm mb-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Target className="h-10 w-10 text-blue-600" />
                            DFARS / SPRS Scoring
                        </h1>
                        <p className="text-slate-500 text-lg">Manage NIST 800-171 self-assessments and generate SPRS scores.</p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95">
                                <Plus className="h-5 w-5" />
                                New Assessment
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-3xl p-8">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">New SPRS Assessment</DialogTitle>
                                <DialogDescription>
                                    Start a new NIST SP 800-171 self-assessment.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="font-bold text-slate-700">Assessment Title</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. FY2026 Q1 Self-Assessment"
                                        className="h-12 rounded-xl"
                                        value={newAssessment.title}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="font-bold text-slate-700">Scope Description</Label>
                                    <Input
                                        id="description"
                                        placeholder="Define the boundary (CUI environment)..."
                                        className="h-12 rounded-xl"
                                        value={newAssessment.scopeDescription}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, scopeDescription: e.target.value })}
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
                                    {createMutation.isLoading ? "Creating..." : "Start Assessment"}
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
                    ) : assessments?.length === 0 ? (
                        <Card className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-20 text-center">
                            <div className="flex flex-col items-center max-w-md mx-auto space-y-4">
                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
                                    <Shield className="h-12 w-12 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">No Assessments Found</h3>
                                <p className="text-slate-500">
                                    You haven't performed any NIST 800-171 self-assessments yet.
                                    Create one to calculate your SPRS score.
                                </p>
                                <Button
                                    onClick={() => setIsCreateOpen(true)}
                                    variant="outline"
                                    className="mt-4 border-slate-300 rounded-xl font-bold h-11 px-8"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Start First Assessment
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                            {assessments?.map((assessment: any) => (
                                <Card
                                    key={assessment.id}
                                    className="group rounded-3xl border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-500 overflow-hidden flex flex-col"
                                >
                                    <div className="cursor-pointer" onClick={() => setLocation(`/clients/${clientId}/federal/assessment-171?sprsAssessmentId=${assessment.id}`)}>
                                        <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
                                        <CardHeader className="pb-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
                                                    <Shield className="h-6 w-6 text-slate-400 group-hover:text-blue-600" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="bg-white">{assessment.status}</Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAssessmentToDelete(assessment);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                                                {assessment.title}
                                            </CardTitle>
                                            <CardDescription className="text-sm font-medium text-slate-500 mt-2 line-clamp-2">
                                                {assessment.scopeDescription || "No scope defined."}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1 space-y-6 pt-0">
                                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                                <span className="text-sm font-bold text-slate-500">SPRS Score</span>
                                                <Badge className={`text-lg px-3 py-1 ${getScoreColor(assessment.score)}`}>
                                                    {assessment.score} / 110
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </div>
                                    <CardFooter className="bg-slate-50/50 p-6 pt-0 flex flex-col gap-3 group-hover:bg-blue-50/50 transition-colors">
                                        <div className="w-full flex justify-between items-center mb-2 px-1">
                                            <div className="flex items-center text-xs font-bold text-slate-400">
                                                <Calendar className="h-3 w-3 mr-1.5" />
                                                {new Date(assessment.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full">
                                            <Button
                                                className="w-full rounded-xl h-11 bg-slate-900 hover:bg-black text-white font-bold text-xs gap-2"
                                                onClick={() => setLocation(`/clients/${clientId}/federal/assessment-171?sprsAssessmentId=${assessment.id}`)}
                                            >
                                                Continue Assessment
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
                                <span className="font-bold text-slate-400 group-hover:text-blue-600">New Assessment</span>
                            </div>
                        </div>
                    )}

                    {/* SPRS Resources Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 mt-12 border-t border-slate-100">
                        <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-gradient-to-br from-slate-900 to-blue-950 text-white overflow-hidden p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black">SPRS Submission</h3>
                                    <p className="text-slate-400 text-sm font-medium">Generate scores and artifacts for SPRS upload.</p>
                                </div>
                                <div className="p-3 bg-white/10 rounded-2xl">
                                    <FileText className="h-8 w-8 text-blue-400" />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <Button
                                    variant="outline"
                                    className="border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl h-11 px-6 active:scale-95 transition-all"
                                    onClick={() => toast.info("Report generation is currently under development.")}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export SPRS Report
                                </Button>
                            </div>
                        </Card>

                        <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-white p-8 border border-slate-100">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900">PO&AM Tracking</h3>
                                    <p className="text-slate-500 text-sm font-medium">Track remediation of non-compliant controls.</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-2xl">
                                    <BarChart3 className="h-8 w-8 text-blue-600" />
                                </div>
                            </div>
                            <Button
                                className="w-full bg-slate-900 text-white hover:bg-black font-bold rounded-xl h-11 active:scale-95 transition-all"
                                onClick={() => toast.info("PO&AM dashboard is coming soon.")}
                            >
                                View Remediation Plan
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>

            <AlertDialog open={!!assessmentToDelete} onOpenChange={(open) => !open && setAssessmentToDelete(null)}>
                <AlertDialogContent className="rounded-3xl p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-900">
                            Delete Assessment?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-base leading-relaxed">
                            This will permanently delete the assessment <span className="font-bold text-slate-900">"{assessmentToDelete?.title}"</span> and all associated data. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="rounded-xl h-12 font-bold px-8">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="rounded-xl h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold px-8"
                            disabled={deleteMutation.isLoading}
                        >
                            {deleteMutation.isLoading ? "Deleting..." : "Delete Assessment"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
