import React, { useState, useEffect } from 'react';
import { useClientContext } from "@/contexts/ClientContext";
import { Button } from "@complianceos/ui/ui/button";
import { Database, Plus, Search, Loader2, AlertTriangle, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { trpc } from '@/lib/trpc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@complianceos/ui/ui/dialog";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
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

const DATA_SENSITIVITY_OPTIONS = ["Low", "Medium", "High"];
const DATA_CRITICALITY_OPTIONS = ["Low", "Medium", "High", "Critical"];
const DATA_FORMAT_OPTIONS = [
    "Structured (SQL Database)",
    "Structured (NoSQL)",
    "Structured (Spreadsheet)",
    "Semi-structured (JSON)",
    "Unstructured (Documents)",
    "Unstructured (Media)",
    "Other"
];

export default function DataInventory() {
    const { selectedClientId } = useClientContext();
    const clientId = selectedClientId || 0;
    const [searchTerm, setSearchTerm] = useState("");
    const [location, setLocation] = useLocation();

    // Dialog state
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "",
        owner: "",
        dataOwner: "",
        criticality: "Medium",
        dataSensitivity: "Medium",
        dataFormat: "",
        location: ""
    });

    const { data: inventory, isLoading, refetch } = trpc.privacy.getInventory.useQuery({ clientId }, { enabled: !!clientId });

    // Auto-seed sample data on first load if empty
    const seedMutation = trpc.privacy.seedInventory.useMutation({
        onSuccess: (data: any) => {
            if (data.created > 0) {
                toast.success(`Created ${data.created} sample assets`);
                refetch();
            }
        },
    });

    // Create asset mutation
    const createMutation = trpc.privacy.createDataAsset.useMutation({
        onSuccess: () => {
            toast.success("Data asset created successfully");
            setCreateOpen(false);
            setFormData({
                name: "",
                description: "",
                category: "",
                owner: "",
                dataOwner: "",
                criticality: "Medium",
                dataSensitivity: "Medium",
                dataFormat: "",
                location: ""
            });
            refetch();
        },
        onError: (err: any) => toast.error(`Error: ${err.message}`)
    });

    // Update asset mutation
    const updateMutation = trpc.privacy.updateDataAsset.useMutation({
        onSuccess: () => {
            toast.success("Data asset updated successfully");
            setEditOpen(false);
            setSelectedAsset(null);
            refetch();
        },
        onError: (err: any) => toast.error(`Error: ${err.message}`)
    });

    // Delete asset mutation
    const deleteMutation = trpc.privacy.deleteDataAsset.useMutation({
        onSuccess: () => {
            toast.success("Data asset deleted successfully");
            setDeleteOpen(false);
            setSelectedAsset(null);
            refetch();
        },
        onError: (err: any) => toast.error(`Error: ${err.message}`)
    });

    const handleEdit = (asset: any) => {
        setSelectedAsset(asset);
        setFormData({
            name: asset.name || "",
            description: asset.description || "",
            category: asset.category || "",
            owner: asset.owner || "",
            dataOwner: asset.dataOwner || "",
            criticality: asset.criticality || "Medium",
            dataSensitivity: asset.dataSensitivity || "Medium",
            dataFormat: asset.dataFormat || "",
            location: asset.location || ""
        });
        setEditOpen(true);
    };

    const handleDelete = (asset: any) => {
        setSelectedAsset(asset);
        setDeleteOpen(true);
    };

    // Auto-seed on mount if no data
    useEffect(() => {
        if (!isLoading && inventory && inventory.length === 0 && !seedMutation.isPending) {
            seedMutation.mutate();
        }
    }, [isLoading, inventory]);

    const filteredInventory = inventory?.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.type && asset.type.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Data Inventory</h1>
                    <p className="text-slate-500 text-lg">Catalog and manage personal data assets and processing activities.</p>
                </div>
                <Button
                    variant="outline"
                    className="border-slate-200 hover:bg-slate-50 font-bold h-11 px-6 rounded-xl transition-all"
                    onClick={() => setCreateOpen(true)}
                >
                    <Plus className="mr-2 h-5 w-5" /> Add Data Asset
                </Button>
            </div>

            <div className="flex items-center py-6 px-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search assets by name or type..."
                        className="pl-10 h-12 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-24 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-[#3ABEF9]" />
                    <p className="text-slate-400 font-medium animate-pulse">Scanning data inventory...</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-0">
                                <TableHead className="font-bold text-slate-700 h-14">Asset Name</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Type</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Sensitivity</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Format</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Owner</TableHead>
                                <TableHead className="text-right font-bold text-slate-700 h-14 px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInventory && filteredInventory.length > 0 ? (
                                filteredInventory.map((asset, idx: number) => (
                                    <TableRow
                                        key={asset.id}
                                        className="hover:bg-slate-50/80 transition-colors group border-b border-slate-100 last:border-0"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <TableCell className="py-5">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 bg-sky-50 rounded-xl flex items-center justify-center text-[#3ABEF9] mr-4 shadow-sm">
                                                    <Database className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{asset.name}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">UID: {asset.id}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Badge className="bg-slate-100 text-slate-600 border-none font-bold uppercase text-[10px] tracking-wider px-2.5 py-1">
                                                {asset.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Badge className={cn(
                                                "border-none font-bold uppercase text-[10px] tracking-wider px-2.5 py-1",
                                                asset.dataSensitivity === 'High'
                                                    ? "bg-rose-100 text-rose-700"
                                                    : asset.dataSensitivity === 'Medium'
                                                        ? "bg-amber-100 text-amber-700"
                                                        : "bg-green-100 text-green-700"
                                            )}>
                                                {asset.dataSensitivity || 'Unclassified'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-5 text-slate-500 font-medium">{asset.dataFormat || '-'}</TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                                                    {asset.dataOwner ? asset.dataOwner.charAt(0) : '?'}
                                                </div>
                                                <span className="text-slate-700 font-medium">{asset.dataOwner || <span className="text-slate-300 italic">Unassigned</span>}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-sky-50"
                                                    onClick={() => handleEdit(asset)}
                                                >
                                                    <Pencil className="h-4 w-4 text-[#3ABEF9]" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-red-50"
                                                    onClick={() => handleDelete(asset)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-72 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="p-6 bg-slate-50 rounded-2xl">
                                                <Database className="h-12 w-12 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900 text-lg">No assets found</p>
                                                <p className="max-w-xs mx-auto">Start cataloging your personal data assets to build a compliant inventory.</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => setCreateOpen(true)}
                                                disabled={seedMutation.isPending}
                                                className="border-slate-200 hover:bg-slate-50 font-bold rounded-xl"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Data Asset
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Add Data Asset Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Add New Data Asset</DialogTitle>
                        <DialogDescription>
                            Register a new personal data asset for GDPR compliance tracking.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Asset Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Employee Records Database"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe the data asset"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Database">Database</SelectItem>
                                        <SelectItem value="Application">Application</SelectItem>
                                        <SelectItem value="Data Store">Data Store</SelectItem>
                                        <SelectItem value="Documents">Documents</SelectItem>
                                        <SelectItem value="Analytics">Analytics</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Data Format</Label>
                                <Select value={formData.dataFormat} onValueChange={(v) => setFormData({ ...formData, dataFormat: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
                                    <SelectContent>
                                        {DATA_FORMAT_OPTIONS.map((fmt) => (
                                            <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Data Sensitivity</Label>
                                <Select value={formData.dataSensitivity} onValueChange={(v) => setFormData({ ...formData, dataSensitivity: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {DATA_SENSITIVITY_OPTIONS.map((opt) => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Criticality</Label>
                                <Select value={formData.criticality} onValueChange={(v) => setFormData({ ...formData, criticality: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {DATA_CRITICALITY_OPTIONS.map((opt) => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Data Owner</Label>
                            <Input
                                value={formData.dataOwner}
                                onChange={(e) => setFormData({ ...formData, dataOwner: e.target.value })}
                                placeholder="e.g. HR Department, IT Security"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Storage Location</Label>
                            <Input
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g. On-premise Server, AWS S3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => createMutation.mutate({ clientId, ...formData })}
                            disabled={!formData.name.trim() || createMutation.isPending}
                            className="bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white"
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create Data Asset'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Data Asset Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Data Asset</DialogTitle>
                        <DialogDescription>
                            Update the personal data asset details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Asset Name *</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Database">Database</SelectItem>
                                        <SelectItem value="Application">Application</SelectItem>
                                        <SelectItem value="Data Store">Data Store</SelectItem>
                                        <SelectItem value="Documents">Documents</SelectItem>
                                        <SelectItem value="Analytics">Analytics</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Data Format</Label>
                                <Select value={formData.dataFormat} onValueChange={(v) => setFormData({ ...formData, dataFormat: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
                                    <SelectContent>
                                        {DATA_FORMAT_OPTIONS.map((fmt) => (
                                            <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Data Sensitivity</Label>
                                <Select value={formData.dataSensitivity} onValueChange={(v) => setFormData({ ...formData, dataSensitivity: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {DATA_SENSITIVITY_OPTIONS.map((opt) => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Criticality</Label>
                                <Select value={formData.criticality} onValueChange={(v) => setFormData({ ...formData, criticality: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {DATA_CRITICALITY_OPTIONS.map((opt) => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Data Owner</Label>
                            <Input
                                value={formData.dataOwner}
                                onChange={(e) => setFormData({ ...formData, dataOwner: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Storage Location</Label>
                            <Input
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => selectedAsset && updateMutation.mutate({ assetId: selectedAsset.id, ...formData })}
                            disabled={!formData.name.trim() || updateMutation.isPending}
                            className="bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white"
                        >
                            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Delete Data Asset?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <b>{selectedAsset?.name}</b>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedAsset && deleteMutation.mutate({ assetId: selectedAsset.id })}
                            disabled={deleteMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 rounded-xl"
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete Asset'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
