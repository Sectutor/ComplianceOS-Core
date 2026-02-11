import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@complianceos/ui/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
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
import { FileText, Plus, Search, ClipboardCheck, Edit, Trash2, Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageGuide } from "@/components/PageGuide";

export default function DPIAManager() {
    const { id } = useParams<{ id: string }>();
    const [location, setLocation] = useLocation();
    const clientId = parseInt(id || "0");
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        scope: "",
        identifiedRisks: "",
        mitigationMeasures: "",
        status: "draft" as "draft" | "in_progress" | "under_review" | "completed",
        activityId: undefined as number | undefined,
        assignedTo: undefined as number | undefined,
    });

    const { data: assessments, isLoading, refetch } = trpc.dpia.list.useQuery({ clientId });
    const { data: activities } = trpc.processingActivities.list.useQuery({ clientId });

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const updateMutation = trpc.dpia.update.useMutation({
        onSuccess: () => {
            toast.success("DPIA record updated successfully");
            setIsDialogOpen(false);
            resetForm();
            refetch();
        },
        onError: (error) => {
            toast.error(`Failed to update DPIA: ${error.message}`);
        }
    });

    const createMutation = trpc.dpia.create.useMutation({
        onSuccess: () => {
            toast.success("DPIA record created successfully");
            setIsDialogOpen(false);
            resetForm();
            refetch();
        },
        onError: (error) => {
            toast.error(`Failed to create DPIA: ${error.message}`);
        }
    });

    const deleteMutation = trpc.dpia.delete.useMutation({
        onSuccess: () => {
            toast.success("DPIA record deleted successfully");
            setIsDeleteOpen(false);
            setDeleteId(null);
            refetch();
        },
        onError: (error) => {
            toast.error(`Failed to delete DPIA: ${error.message}`);
        }
    });

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            scope: "",
            identifiedRisks: "",
            mitigationMeasures: "",
            status: "draft",
            activityId: undefined,
            assignedTo: undefined,
        });
        setIsEditing(false);
        setEditId(null);
    };

    const handleSave = () => {
        const payload = {
            clientId,
            ...formData,
        };

        if (isEditing && editId) {
            updateMutation.mutate({
                id: editId,
                ...payload
            });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleEdit = (assessment: any) => {
        setIsEditing(true);
        setEditId(assessment.id);
        setFormData({
            title: assessment.title,
            description: assessment.description,
            scope: assessment.scope,
            identifiedRisks: assessment.identifiedRisks,
            mitigationMeasures: assessment.mitigationMeasures,
            status: assessment.status,
            activityId: assessment.activityId || undefined,
            assignedTo: assessment.assignedTo || undefined,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeleteId(id);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (deleteId) {
            deleteMutation.mutate({ id: deleteId });
        }
    };

    const filteredAssessments = assessments?.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'under_review': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'draft': return <FileText className="h-4 w-4" />;
            case 'in_progress': return <Clock className="h-4 w-4" />;
            case 'under_review': return <AlertTriangle className="h-4 w-4" />;
            case 'completed': return <CheckCircle className="h-4 w-4" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            <Breadcrumb
                items={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Privacy", href: `/clients/${clientId}/privacy` },
                    { label: "DPIA Manager" },
                ]}
            />
            <div className="flex justify-between items-center -mb-2 animate-slide-down">
                <PageGuide
                    title="DPI Assessment Manager"
                    description="Conduct and manage Data Protection Impact Assessments (DPIAs)."
                    rationale="Mandatory under GDPR Art. 35 for high-risk processing activities."
                    howToUse={[
                        { step: "Screen", description: "Identify high-risk activities needing assessment." },
                        { step: "Assess", description: "Analyze necessity, proportionality, and risks." },
                        { step: "Consult", description: "Seek DPO advice and consult supervisory authority if needed." }
                    ]}
                />
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> New Assessment
                </Button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search assessments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Assessments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{assessments?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {assessments?.filter(a => a.status === 'in_progress').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Under Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {assessments?.filter(a => a.status === 'under_review').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {assessments?.filter(a => a.status === 'completed').length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-semibold">Title</TableHead>
                            <TableHead className="font-semibold">Processing Activity</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Last Updated</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">Loading assessments...</TableCell>
                            </TableRow>
                        ) : filteredAssessments?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground bg-slate-50/50">
                                    <ClipboardCheck className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                                    <p className="text-lg font-medium text-slate-400">No DPIA records found</p>
                                    <p className="max-w-xs mx-auto mt-1">Start a high-risk processing assessment by clicking 'New Assessment'.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAssessments?.map((assessment) => (
                                <TableRow key={assessment.id} className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleEdit(assessment)}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                                <ClipboardCheck className="h-4 w-4 text-primary" />
                                            </div>
                                            {assessment.title}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {activities?.find(act => act.id === assessment.activityId)?.activityName || <span className="text-muted-foreground italic text-xs">Unlinked</span>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`flex items-center gap-1.5 w-fit ${getStatusColor(assessment.status)}`}>
                                            {getStatusIcon(assessment.status)}
                                            {assessment.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {assessment.updatedAt ? format(new Date(assessment.updatedAt), 'MMM d, yyyy') : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setLocation(`/clients/${clientId}/privacy/dpia/${assessment.id}/questionnaire`);
                                                }}
                                            >
                                                <ClipboardCheck className="h-3.5 w-3.5" />
                                                Conduct Assessment
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEdit(assessment); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDelete(assessment.id); }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit' : 'New'} Data Protection Impact Assessment</DialogTitle>
                        <DialogDescription>
                            Assess high-risk processing activities to ensure compliance with GDPR Article 35.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="title">Assessment Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., AI-Driven Customer Profiling DPIA"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="activity">Processing Activity (ROPA)</Label>
                                <Select
                                    value={formData.activityId?.toString()}
                                    onValueChange={(val) => {
                                        const aid = parseInt(val);
                                        const activity = activities?.find(a => a.id === aid);
                                        if (activity) {
                                            setFormData(prev => ({
                                                ...prev,
                                                activityId: aid,
                                                // Auto-populate if fields are empty
                                                description: prev.description || activity.description || "",
                                                scope: prev.scope || `Purposes: ${activity.purposes?.join(', ') || 'N/A'}. Legal Basis: ${activity.legalBasis}`,
                                                mitigationMeasures: prev.mitigationMeasures || [
                                                    ...(activity.technicalMeasures || []),
                                                    ...(activity.organizationalMeasures || [])
                                                ].join('\n') || activity.securityDescription || ""
                                            }));
                                        } else {
                                            setFormData({ ...formData, activityId: aid });
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Link to activity..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activities?.map(act => (
                                            <SelectItem key={act.id} value={act.id.toString()}>{act.activityName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Assessment Status</Label>
                                <Select value={formData.status} onValueChange={(val: any) => setFormData({ ...formData, status: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="under_review">Under Review</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Process Description *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe the systematic processing operations..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="scope">Scope and Purpose *</Label>
                            <Textarea
                                id="scope"
                                value={formData.scope}
                                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                                placeholder="Explain the necessity and proportionality..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="risks">Identified Risks to Rights & Freedoms *</Label>
                            <Textarea
                                id="risks"
                                value={formData.identifiedRisks}
                                onChange={(e) => setFormData({ ...formData, identifiedRisks: e.target.value })}
                                placeholder="What are the potential impacts on data subjects?"
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mitigation">Risk Mitigation Measures *</Label>
                            <Textarea
                                id="mitigation"
                                value={formData.mitigationMeasures}
                                onChange={(e) => setFormData({ ...formData, mitigationMeasures: e.target.value })}
                                placeholder="What technical or organizational measures address these risks?"
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter className="bg-slate-50 p-4 -mx-6 -mb-6 border-t mt-4 sticky bottom-0 z-10">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={createMutation.isPending || updateMutation.isPending || !formData.title || !formData.description}
                            className="px-8 shadow-md"
                        >
                            {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Assessment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete DPIA Record?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. Removing a DPIA record may impact your compliance evidence for high-risk processing activities.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
