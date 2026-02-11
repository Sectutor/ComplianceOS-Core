import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@complianceos/ui/ui/dialog";
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
import { FileText, Plus, Search, AlertCircle, Globe, Shield, Clock, Edit, Trash2 } from "lucide-react";
import { useParams } from "wouter";
import { toast } from "sonner";
import { PageGuide } from "@/components/PageGuide";

export default function ROPADashboard() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        activityName: "",
        activityId: "",
        description: "",
        role: "controller",
        purposes: "",
        legalBasis: "contract",
        dataCategories: "",
        dataSubjectCategories: "",
        recipients: "",
        status: "draft",
    });

    const { data: activities, isLoading, refetch } = trpc.processingActivities.list.useQuery({ clientId });
    const { data: exemptionStatus } = trpc.processingActivities.checkExemption.useQuery({ clientId });
    const { data: overdueReviews } = trpc.processingActivities.getOverdueReviews.useQuery({ clientId });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const updateMutation = trpc.processingActivities.update.useMutation({
        onSuccess: () => {
            toast.success("Processing activity updated successfully");
            setIsDialogOpen(false);
            resetForm();
            refetch();
        },
        onError: (error) => {
            toast.error(`Failed to update activity: ${error.message}`);
        }
    });

    const deleteMutation = trpc.processingActivities.delete.useMutation({
        onSuccess: () => {
            toast.success("Processing activity deleted successfully");
            setIsDeleteOpen(false);
            setDeleteId(null);
            refetch();
        },
        onError: (error) => {
            toast.error(`Failed to delete activity: ${error.message}`);
        }
    });

    const resetForm = () => {
        setFormData({
            activityName: "",
            activityId: "",
            description: "",
            role: "controller",
            purposes: "",
            legalBasis: "contract",
            dataCategories: "",
            dataSubjectCategories: "",
            recipients: "",
            status: "draft",
        });
        setIsEditing(false);
        setEditId(null);
    };

    const createMutation = trpc.processingActivities.create.useMutation({
        onSuccess: () => {
            toast.success("Processing activity created successfully");
            setIsDialogOpen(false);
            setFormData({
                activityName: "",
                activityId: "",
                description: "",
                role: "controller",
                purposes: "",
                legalBasis: "contract",
                dataCategories: "",
                dataSubjectCategories: "",
                recipients: "",
            });
            refetch();
        },
        onError: (error) => {
            toast.error(`Failed to create activity: ${error.message}`);
        }
    });

    const handleSave = () => {
        const payload = {
            clientId,
            activityName: formData.activityName,
            activityId: formData.activityId,
            description: formData.description,
            role: formData.role,
            purposes: formData.purposes.split(',').map(p => p.trim()).filter(Boolean),
            legalBasis: formData.legalBasis,
            dataCategories: formData.dataCategories.split(',').map(d => d.trim()).filter(Boolean),
            dataSubjectCategories: formData.dataSubjectCategories.split(',').map(d => d.trim()).filter(Boolean),
            recipients: formData.recipients.split(',').map(r => ({ name: r.trim(), type: 'internal' })).filter(r => r.name),
            status: formData.status,
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


    const handleEdit = (activity: any) => {
        console.log("[ROPA] Edit clicked (Row or Button) for ID:", activity.id);
        setIsEditing(true);
        setEditId(activity.id);
        setFormData({
            activityName: activity.activityName,
            activityId: activity.activityId,
            description: activity.description || "",
            role: activity.role,
            purposes: Array.isArray(activity.purposes) ? activity.purposes.join(', ') : "",
            legalBasis: activity.legalBasis,
            dataCategories: Array.isArray(activity.dataCategories) ? activity.dataCategories.join(', ') : "",
            dataSubjectCategories: Array.isArray(activity.dataSubjectCategories) ? activity.dataSubjectCategories.join(', ') : "",
            recipients: Array.isArray(activity.recipients) ? activity.recipients.map((r: any) => r.name).join(', ') : "",
            status: activity.status || "draft",
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

    const filteredActivities = activities?.filter(a =>
        a.activityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.activityId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'draft': return 'bg-yellow-100 text-yellow-800';
            case 'archived': return 'bg-gray-100 text-gray-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center animate-slide-down">
                <PageGuide
                    title="Records of Processing Activities (ROPA)"
                    description="GDPR Article 30 documentation of data processing."
                    rationale="Mandatory regulatory record of how personal data is handled."
                    howToUse={[
                        { step: "Document", description: "Record purpose, legal basis, and retention." },
                        { step: "Identify", description: "Map data categories and subject types." },
                        { step: "Maintain", description: "Regularly review and update activities." }
                    ]}
                />
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> New Processing Activity
                </Button>
            </div>

            {/* Search & Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Exemption Status Banner */}
            {exemptionStatus && (
                <Card className={exemptionStatus.isExempt ? "bg-blue-50 border-blue-200" : "bg-purple-50 border-purple-200"}>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className={`h-5 w-5 mt-0.5 ${exemptionStatus.isExempt ? "text-blue-600" : "text-purple-600"}`} />
                            <div className="flex-1">
                                <h3 className={`font-semibold mb-1 ${exemptionStatus.isExempt ? "text-blue-900" : "text-purple-900"}`}>
                                    {exemptionStatus.isExempt ? "Potential Exemption" : "ROPA Required"}
                                </h3>
                                <p className={`text-sm mb-2 ${exemptionStatus.isExempt ? "text-blue-800" : "text-purple-800"}`}>
                                    {exemptionStatus.recommendation}
                                </p>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <Badge variant="outline" className={exemptionStatus.criteria.isSmallOrg ? "bg-green-50" : "bg-red-50"}>
                                        {exemptionStatus.criteria.employeeCount} employees
                                    </Badge>
                                    <Badge variant="outline" className={exemptionStatus.criteria.isLowRisk ? "bg-green-50" : "bg-red-50"}>
                                        {exemptionStatus.criteria.isLowRisk ? "Low Risk" : "High Risk"}
                                    </Badge>
                                    <Badge variant="outline" className={exemptionStatus.criteria.isOccasional ? "bg-green-50" : "bg-red-50"}>
                                        {exemptionStatus.criteria.activityCount} activities
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Overdue Reviews Alert */}
            {overdueReviews && overdueReviews.length > 0 && (
                <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 mt-0.5 text-orange-600" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-orange-900 mb-1">
                                    {overdueReviews.length} {overdueReviews.length === 1 ? 'Activity' : 'Activities'} Overdue for Review
                                </h3>
                                <p className="text-sm text-orange-800 mb-2">
                                    The following processing activities require review to maintain compliance:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {overdueReviews.slice(0, 3).map(activity => (
                                        <Badge key={activity.id} variant="outline" className="bg-white">
                                            {activity.activityName}
                                        </Badge>
                                    ))}
                                    {overdueReviews.length > 3 && (
                                        <Badge variant="outline" className="bg-white">
                                            +{overdueReviews.length - 3} more
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Activities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activities?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {activities?.filter(a => a.status === 'active').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">International Transfers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {activities?.filter(a => a.hasInternationalTransfers).length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Special Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {activities?.filter(a => a.specialCategories && a.specialCategories.length > 0).length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Activities Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Activity Name</TableHead>
                            <TableHead>Reference ID</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="hidden md:table-cell">Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">Loading activities...</TableCell>
                            </TableRow>
                        ) : filteredActivities?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No processing activities found. Create your first one!
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredActivities?.map((activity) => (
                                <TableRow key={activity.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(activity)}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            {activity.activityName}
                                        </div>
                                    </TableCell>
                                    <TableCell>{activity.activityId}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {activity.role.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(activity.status || 'draft')}>
                                            {activity.status || 'draft'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground">
                                        {activity.description || '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEdit(activity); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDelete(activity.id); }}>
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

            {/* Create Activity Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit' : 'New'} Processing Activity</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="activityName">Activity Name *</Label>
                                <Input
                                    id="activityName"
                                    value={formData.activityName}
                                    onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                                    placeholder="e.g., Customer Data Processing"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="activityId">Activity ID *</Label>
                                <Input
                                    id="activityId"
                                    value={formData.activityId}
                                    onChange={(e) => setFormData({ ...formData, activityId: e.target.value })}
                                    placeholder="e.g., ROPA-001"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe the processing activity..."
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Role *</Label>
                                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="controller">Controller</SelectItem>
                                        <SelectItem value="processor">Processor</SelectItem>
                                        <SelectItem value="joint_controller">Joint Controller</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="legalBasis">Legal Basis *</Label>
                                <Select value={formData.legalBasis} onValueChange={(value) => setFormData({ ...formData, legalBasis: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="consent">Consent</SelectItem>
                                        <SelectItem value="contract">Contract</SelectItem>
                                        <SelectItem value="legal_obligation">Legal Obligation</SelectItem>
                                        <SelectItem value="vital_interests">Vital Interests</SelectItem>
                                        <SelectItem value="public_task">Public Task</SelectItem>
                                        <SelectItem value="legitimate_interests">Legitimate Interests</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="purposes">Purposes * (comma-separated)</Label>
                            <Input
                                id="purposes"
                                value={formData.purposes}
                                onChange={(e) => setFormData({ ...formData, purposes: e.target.value })}
                                placeholder="e.g., Service Delivery, Customer Support"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dataCategories">Data Categories * (comma-separated)</Label>
                            <Input
                                id="dataCategories"
                                value={formData.dataCategories}
                                onChange={(e) => setFormData({ ...formData, dataCategories: e.target.value })}
                                placeholder="e.g., name, email, phone"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dataSubjectCategories">Data Subject Categories * (comma-separated)</Label>
                            <Input
                                id="dataSubjectCategories"
                                value={formData.dataSubjectCategories}
                                onChange={(e) => setFormData({ ...formData, dataSubjectCategories: e.target.value })}
                                placeholder="e.g., customers, employees"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="recipients">Recipients * (comma-separated)</Label>
                            <Input
                                id="recipients"
                                value={formData.recipients}
                                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                                placeholder="e.g., Sales Team, Marketing Department"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={createMutation.isPending || updateMutation.isPending || !formData.activityName || !formData.activityId}
                        >
                            {createMutation.isPending || updateMutation.isPending ? "Saving..." : (isEditing ? "Save Changes" : "Create Activity")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the processing activity record.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
