
import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
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
import { Globe, Plus, Search, FileText, Edit, Trash2, Shield, AlertTriangle, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";

const COUNTRIES = [
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "JP", name: "Japan" },
    { code: "CH", name: "Switzerland" },
    { code: "IN", name: "India" },
    { code: "SG", name: "Singapore" },
    { code: "IL", name: "Israel" },
    { code: "KR", name: "South Korea" },
    { code: "NZ", name: "New Zealand" },
    { code: "BR", name: "Brazil" },
    { code: "MX", name: "Mexico" },
    { code: "TR", name: "Turkey" },
    { code: "CN", name: "China" },
    { code: "AE", name: "United Arab Emirates" },
    { code: "HK", name: "Hong Kong" },
    { code: "AR", name: "Argentina" },
    { code: "RU", name: "Russia" },
    { code: "ZA", name: "South Africa" },
    { code: "TH", name: "Thailand" },
    { code: "MY", name: "Malaysia" },
    { code: "ID", name: "Indonesia" },
    { code: "VN", name: "Vietnam" },
    { code: "PH", name: "Philippines" },
    { code: "SA", name: "Saudi Arabia" },
    { code: "EG", name: "Egypt" },
    { code: "NG", name: "Nigeria" },
    { code: "KE", name: "Kenya" },
    { code: "CO", name: "Colombia" },
    { code: "CL", name: "Chile" },
    { code: "PE", name: "Peru" },
    { code: "UA", name: "Ukraine" },
    { code: "RS", name: "Serbia" },
    { code: "MA", name: "Morocco" },
].sort((a, b) => a.name.localeCompare(b.name));

import { Breadcrumb } from "@/components/Breadcrumb";

export default function TransferDashboard() {
    const { id } = useParams<{ id: string }>();
    const [location, setLocation] = useLocation();
    const clientId = parseInt(id || "0");
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        destinationCountry: "",
        transferTool: "scc_2021" as "scc_2021" | "bcr" | "adequacy" | "derogation" | "ad_hoc",
        sccModule: undefined as "c2c" | "c2p" | "p2p" | "p2c" | undefined,
        activityId: undefined as number | undefined,
        vendorId: undefined as number | undefined,
    });

    const { data: transfers, isLoading, refetch } = trpc.transfers.list.useQuery({ clientId });
    const { data: activities } = trpc.processingActivities.list.useQuery({ clientId });
    const { data: vendors } = trpc.vendors.list.useQuery({ clientId });

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const createMutation = trpc.transfers.create.useMutation({
        onSuccess: () => {
            toast.success("Transfer record created successfully");
            setIsDialogOpen(false);
            resetForm();
            refetch();
        },
        onError: (error) => toast.error(`Error: ${error.message}`)
    });

    const updateMutation = trpc.transfers.update.useMutation({
        onSuccess: () => {
            toast.success("Transfer record updated");
            setIsDialogOpen(false);
            resetForm();
            refetch();
        },
        onError: (error) => toast.error(`Error: ${error.message}`)
    });

    const deleteMutation = trpc.transfers.delete.useMutation({
        onSuccess: () => {
            toast.success("Transfer deleted");
            setIsDeleteOpen(false);
            setDeleteId(null);
            refetch();
        },
        onError: (error) => toast.error(`Error: ${error.message}`)
    });

    const resetForm = () => {
        setFormData({
            title: "",
            destinationCountry: "",
            transferTool: "scc_2021",
            sccModule: undefined,
            activityId: undefined,
            vendorId: undefined,
        });
        setIsEditing(false);
        setEditId(null);
    };

    const handleSave = () => {
        if (!formData.title || !formData.destinationCountry || !formData.transferTool) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (isEditing && editId) {
            updateMutation.mutate({
                id: editId,
                title: formData.title,
            });
        } else {
            createMutation.mutate({
                clientId,
                title: formData.title,
                destinationCountry: formData.destinationCountry.toUpperCase(),
                transferTool: formData.transferTool,
                sccModule: formData.sccModule || undefined,
                activityId: formData.activityId,
                vendorId: formData.vendorId,
            });
        }
    };

    const confirmDelete = () => {
        if (deleteId) {
            deleteMutation.mutate({ id: deleteId });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
            case 'pending': return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Clock className="w-3 h-3 mr-1" /> Pending TIA</Badge>;
            case 'risk_flagged': return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertTriangle className="w-3 h-3 mr-1" /> Risk Flagged</Badge>;
            case 'expired': return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Expired</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredTransfers = transfers?.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.destinationCountry.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 flex flex-col h-full">
            <Breadcrumb
                items={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Privacy", href: `/clients/${clientId}/privacy` },
                    { label: "International Transfers" },
                ]}
            />
            <div className="flex justify-between items-center -mb-2">
                <div>
                    <h1 className="text-2xl font-bold">International Data Transfers</h1>
                    <p className="text-muted-foreground">Manage cross-border data flows and Chapter V compliance</p>
                </div>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> New Transfer
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Transfers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{transfers?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Flows</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {transfers?.filter(t => t.status === 'active').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending TIA</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {transfers?.filter(t => t.status === 'pending').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">High Risk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {transfers?.filter(t => t.status === 'risk_flagged').length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search transfers or countries..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Transfer Name</TableHead>
                                <TableHead>Destination</TableHead>
                                <TableHead>Transfer Tool</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10">Loading...</TableCell></TableRow>
                            ) : filteredTransfers?.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10">No transfers found</TableCell></TableRow>
                            ) : filteredTransfers?.map((transfer) => (
                                <TableRow key={transfer.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{transfer.title}</span>
                                            {transfer.vendorId && (
                                                <span className="text-xs text-muted-foreground flex items-center mt-1">
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    {vendors?.find(v => v.id === transfer.vendorId)?.name || 'Unknown Vendor'}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center">
                                            <Globe className="w-4 h-4 mr-2 text-slate-400" />
                                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs uppercase">
                                                {transfer.destinationCountry}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="capitalize text-sm font-medium">
                                                {transfer.transferTool.replace('_', ' ')}
                                            </span>
                                            {transfer.sccModule && (
                                                <span className="text-[10px] text-blue-600 font-bold uppercase">
                                                    Module {transfer.sccModule.replace('c', 'C').replace('p', 'P')}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(transfer.status || 'pending')}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {transfer.updatedAt ? format(new Date(transfer.updatedAt), 'MMM d, yyyy') : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setLocation(`/clients/${clientId}/privacy/transfers/${transfer.id}`)}>
                                                <ExternalLink className="h-4 w-4 mr-1" /> Open TIA
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => {
                                                setFormData({
                                                    title: transfer.title,
                                                    destinationCountry: transfer.destinationCountry,
                                                    transferTool: transfer.transferTool as any,
                                                    sccModule: (transfer.sccModule as any) || undefined,
                                                    activityId: transfer.activityId || undefined,
                                                    vendorId: transfer.vendorId || undefined,
                                                });
                                                setIsEditing(true);
                                                setEditId(transfer.id);
                                                setIsDialogOpen(true);
                                            }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => { setDeleteId(transfer.id); setIsDeleteOpen(true); }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Transfer' : 'New International Transfer'}</DialogTitle>
                        <DialogDescription>
                            Define a new data flow to a country outside the EEA.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Transfer Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. AWS US Hosting Flow"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="country">Destination Country</Label>
                                <Select
                                    value={formData.destinationCountry}
                                    onValueChange={(val) => setFormData({ ...formData, destinationCountry: val })}
                                >
                                    <SelectTrigger id="country">
                                        <SelectValue placeholder="Select Country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COUNTRIES.map(c => (
                                            <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vendor">Vendor (Optional)</Label>
                                <Select
                                    value={formData.vendorId ? formData.vendorId.toString() : "none"}
                                    onValueChange={(val) => setFormData({ ...formData, vendorId: val === "none" ? undefined : parseInt(val) })}
                                >
                                    <SelectTrigger id="vendor">
                                        <SelectValue placeholder="Select Vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Vendor Linked</SelectItem>
                                        {vendors?.map(({ vendor: v }: any) => (
                                            <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Transfer Tool (Legal Basis)</Label>
                            <Select
                                value={formData.transferTool}
                                onValueChange={(val: any) => setFormData({ ...formData, transferTool: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="adequacy">Adequacy Decision (Art. 45)</SelectItem>
                                    <SelectItem value="scc_2021">SCCs 2021 (Art. 46)</SelectItem>
                                    <SelectItem value="bcr">Binding Corporate Rules (BCR)</SelectItem>
                                    <SelectItem value="derogation">Derogation (Art. 49)</SelectItem>
                                    <SelectItem value="ad_hoc">Ad-hoc Contractual Clauses</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.transferTool === 'scc_2021' && (
                            <div className="space-y-2 border-l-2 border-blue-500 pl-4 py-1 bg-blue-50/50">
                                <Label className="text-blue-700">SCC Module Selection</Label>
                                <Select
                                    value={formData.sccModule || ""}
                                    onValueChange={(val) => {
                                        setFormData({ ...formData, sccModule: val as "c2c" | "c2p" | "p2p" | "p2c" | undefined })
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Module" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="c2c">Module 1: Controller to Controller</SelectItem>
                                        <SelectItem value="c2p">Module 2: Controller to Processor</SelectItem>
                                        <SelectItem value="p2p">Module 3: Processor to Processor</SelectItem>
                                        <SelectItem value="p2c">Module 4: Processor to Controller</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="activity">Link to Processing Activity (ROPA)</Label>
                            <Select
                                value={formData.activityId ? formData.activityId.toString() : "none"}
                                onValueChange={(val) => setFormData({ ...formData, activityId: val === "none" ? undefined : parseInt(val) })}
                            >
                                <SelectTrigger id="activity">
                                    <SelectValue placeholder="Select Activity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Activity Linked</SelectItem>
                                    {activities?.map(a => (
                                        <SelectItem key={a.id} value={a.id.toString()}>{a.activityName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                            {isEditing ? 'Update Transfer' : 'Create Transfer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove this international transfer record. Any associated Transfer Impact Assessments (TIA) will remain in the database but will be unlinked.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

