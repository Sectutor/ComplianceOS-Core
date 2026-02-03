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
import { Checkbox } from "@complianceos/ui/ui/checkbox";
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
import { FileText, Plus, Search, AlertTriangle, ShieldAlert, CheckCircle, Edit, Trash2 } from "lucide-react";
import { useParams } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";

export default function DataBreachRegister() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        description: "",
        effects: "",
        remedialActions: "",
        dateOccurred: "",
        dateDetected: "",
        status: "open",
        isNotifiableToDpa: false,
        isNotifiableToSubjects: false,
    });

    const { data: breaches, isLoading, refetch } = trpc.dataBreaches.list.useQuery({ clientId });

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const updateMutation = trpc.dataBreaches.update.useMutation({
        onSuccess: () => {
            toast.success("Breach record updated successfully");
            setIsDialogOpen(false);
            resetForm();
            refetch();
        },
        onError: (error) => {
            toast.error(`Failed to update breach: ${error.message}`);
        }
    });

    const createMutation = trpc.dataBreaches.create.useMutation({
        onSuccess: () => {
            toast.success("Breach record created successfully");
            setIsDialogOpen(false);
            resetForm();
            refetch();
        },
        onError: (error) => {
            toast.error(`Failed to create breach: ${error.message}`);
        }
    });

    const deleteMutation = trpc.dataBreaches.delete.useMutation({
        onSuccess: () => {
            toast.success("Breach record deleted successfully");
            setIsDeleteOpen(false);
            setDeleteId(null);
            refetch();
        },
        onError: (error) => {
            toast.error(`Failed to delete breach: ${error.message}`);
        }
    });

    const resetForm = () => {
        setFormData({
            description: "",
            effects: "",
            remedialActions: "",
            dateOccurred: "",
            dateDetected: "",
            status: "open",
            isNotifiableToDpa: false,
            isNotifiableToSubjects: false,
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

    const handleEdit = (breach: any) => {
        setIsEditing(true);
        setEditId(breach.id);
        setFormData({
            description: breach.description,
            effects: breach.effects,
            remedialActions: breach.remedialActions,
            dateOccurred: breach.dateOccurred ? new Date(breach.dateOccurred).toISOString().split('T')[0] : "",
            dateDetected: breach.dateDetected ? new Date(breach.dateDetected).toISOString().split('T')[0] : "",
            status: breach.status,
            isNotifiableToDpa: breach.isNotifiableToDpa,
            isNotifiableToSubjects: breach.isNotifiableToSubjects,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeleteId(id);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (deleteId) {
            deleteMutation.mutate({ id: deleteId, clientId });
        }
    };

    const filteredBreaches = breaches?.filter(b =>
        b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-red-100 text-red-800';
            case 'investigating': return 'bg-yellow-100 text-yellow-800';
            case 'closed': return 'bg-green-100 text-green-800';
            case 'reported': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Data Breach Register</h1>
                    <p className="text-muted-foreground">GDPR Article 33(5) - Records of Personal Data Breaches</p>
                </div>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Log New Breach
                </Button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search incidents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Incidents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{breaches?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Open / Investigating</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {breaches?.filter(b => ['open', 'investigating'].includes(b.status)).length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Notifiable to DPA</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {breaches?.filter(b => b.isNotifiableToDpa).length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Closed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {breaches?.filter(b => b.status === 'closed').length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date Detected</TableHead>
                            <TableHead>Description (Facts)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Notifiable?</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">Loading records...</TableCell>
                            </TableRow>
                        ) : filteredBreaches?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No data breach records found. Hopefully that stays true!
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBreaches?.map((breach) => (
                                <TableRow key={breach.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(breach)}>
                                    <TableCell>
                                        {breach.dateDetected ? format(new Date(breach.dateDetected), 'MMM d, yyyy') : '-'}
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert className="h-4 w-4 text-orange-500" />
                                            {breach.description}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(breach.status)}>
                                            {breach.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {breach.isNotifiableToDpa && <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">DPA</Badge>}
                                            {breach.isNotifiableToSubjects && <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">Subjects</Badge>}
                                            {!breach.isNotifiableToDpa && !breach.isNotifiableToSubjects && <span className="text-muted-foreground text-sm">-</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEdit(breach); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDelete(breach.id); }}>
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit' : 'Log'} Data Breach</DialogTitle>
                        <DialogDescription>
                            Enter the details of the personal data breach as required by GDPR Art. 33.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dateOccurred">Date Occurred</Label>
                                <Input
                                    id="dateOccurred"
                                    type="date"
                                    value={formData.dateOccurred}
                                    onChange={(e) => setFormData({ ...formData, dateOccurred: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dateDetected">Date Detected</Label>
                                <Input
                                    id="dateDetected"
                                    type="date"
                                    value={formData.dateDetected}
                                    onChange={(e) => setFormData({ ...formData, dateDetected: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Facts and Description *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe what happened..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="effects">Effects and Consequences *</Label>
                            <Textarea
                                id="effects"
                                value={formData.effects}
                                onChange={(e) => setFormData({ ...formData, effects: e.target.value })}
                                placeholder="What is the impact on data subjects?"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="remedialActions">Remedial Actions Taken *</Label>
                            <Textarea
                                id="remedialActions"
                                value={formData.remedialActions}
                                onChange={(e) => setFormData({ ...formData, remedialActions: e.target.value })}
                                placeholder="What steps have been taken to address the breach?"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="investigating">Investigating</SelectItem>
                                        <SelectItem value="reported">Reported</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 pt-8">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="dpa"
                                        checked={formData.isNotifiableToDpa}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isNotifiableToDpa: checked as boolean })}
                                    />
                                    <Label htmlFor="dpa">Notifiable to DPA</Label>
                                </div>
                                <div className="flex items-center space-x-2 mt-2">
                                    <Checkbox
                                        id="subjects"
                                        checked={formData.isNotifiableToSubjects}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isNotifiableToSubjects: checked as boolean })}
                                    />
                                    <Label htmlFor="subjects">Notifiable to Data Subjects</Label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={createMutation.isPending || updateMutation.isPending || !formData.description}
                        >
                            {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Log"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this breach record. This might violate accountability principles if done incorrectly.
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
