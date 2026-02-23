
import React, { useState } from "react";
import { useParams } from "wouter";
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
    Calendar,
    Trash2,
    Lock,
    Search,
    Award,
    FileCheck,
    AlertTriangle,
    Edit2
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@complianceos/ui/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@complianceos/ui/ui/table";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";

export default function Fips140Page() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const utils = trpc.useUtils();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [newModule, setNewModule] = useState({
        moduleName: "",
        vendor: "",
        certificateNumber: "",
        validationLevel: "Level 1",
        validationVersion: "140-3",
        assetIds: [] as number[]
    });

    const { data: modules, isLoading } = trpc.federal.listFips140Modules.useQuery({ clientId });
    const { data: assets } = trpc.assets.list.useQuery({ clientId });

    const createMutation = trpc.federal.createFips140Module.useMutation({
        onSuccess: () => {
            toast.success("FIPS 140 Module tracked successfully");
            setIsCreateOpen(false);
            utils.federal.listFips140Modules.invalidate({ clientId });
            setNewModule({ 
                moduleName: "", 
                vendor: "", 
                certificateNumber: "", 
                validationLevel: "Level 1",
                validationVersion: "140-3",
                assetIds: []
            });
        },
        onError: (err) => {
            toast.error("Failed to track module: " + err.message);
        }
    });

    const handleCreate = () => {
        if (!newModule.moduleName) {
            toast.error("Module Name is required");
            return;
        }
        createMutation.mutate({
            clientId,
            ...newModule
        });
    };

    const [moduleToEdit, setModuleToEdit] = useState<any>(null);

    const updateMutation = trpc.federal.updateFips140Module.useMutation({
        onSuccess: () => {
            toast.success("Module updated successfully");
            setModuleToEdit(null);
            utils.federal.listFips140Modules.invalidate({ clientId });
        },
        onError: (err) => {
            toast.error("Failed to update module: " + err.message);
        }
    });

    const handleUpdate = () => {
        if (!moduleToEdit) return;
        updateMutation.mutate({
            clientId,
            id: moduleToEdit.id,
            moduleName: moduleToEdit.moduleName,
            vendor: moduleToEdit.vendor,
            certificateNumber: moduleToEdit.certificateNumber,
            validationLevel: moduleToEdit.validationLevel,
            validationVersion: moduleToEdit.validationVersion,
            assetIds: moduleToEdit.assetIds
        });
    };

    const [moduleToDelete, setModuleToDelete] = useState<any>(null);

    const deleteMutation = trpc.federal.deleteFips140Module.useMutation({
        onSuccess: () => {
            toast.success("Module removed successfully");
            utils.federal.listFips140Modules.invalidate({ clientId });
            setModuleToDelete(null);
        },
        onError: (err) => {
            toast.error(`Error removing module: ${err.message}`);
        }
    });

    const handleDelete = () => {
        if (moduleToDelete) {
            deleteMutation.mutate({ clientId, id: moduleToDelete.id });
        }
    };

    const filteredModules = modules?.filter((mod: any) => 
        mod.moduleName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.certificateNumber?.includes(searchQuery) ||
        mod.validationLevel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.validationVersion?.includes(searchQuery)
    );

    const toggleNewAsset = (assetId: number) => {
        setNewModule(prev => {
            const current = prev.assetIds || [];
            if (current.includes(assetId)) {
                return { ...prev, assetIds: current.filter(id => id !== assetId) };
            } else {
                return { ...prev, assetIds: [...current, assetId] };
            }
        });
    };

    const toggleEditAsset = (assetId: number) => {
        setModuleToEdit((prev: any) => {
            const current = (prev.assets || []).map((a: any) => a.id);
            // We need to maintain the assetIds array for the mutation, 
            // but the UI might be relying on 'assets' array for display.
            // Let's normalize: use 'assetIds' for mutation, and update local state to reflect change.
            
            // Actually, list returns 'assets' array. 
            // When we start editing, we should probably initialize 'assetIds' from 'assets'.
            // But 'moduleToEdit' is just the row object.
            
            // Let's handle initialization when opening the dialog? 
            // Or just compute 'assetIds' on the fly.
            
            // Better: When setting moduleToEdit, we can map assets to assetIds if not present.
            // But 'moduleToEdit' is set directly from the row.
            
            // Let's use a dedicated state for edit asset selection? 
            // Or just update moduleToEdit carefully.
            
            // Simple approach: Add assetIds to moduleToEdit if missing
            const currentIds = prev.assetIds || prev.assets?.map((a: any) => a.id) || [];
            
            let newIds;
            if (currentIds.includes(assetId)) {
                newIds = currentIds.filter((id: number) => id !== assetId);
            } else {
                newIds = [...currentIds, assetId];
            }
            
            return { ...prev, assetIds: newIds };
        });
    };

    const getValidationColor = (level: string) => {
        switch (level) {
            case 'Level 1': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'Level 2': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Level 3': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'Level 4': return 'bg-purple-50 text-purple-700 border-purple-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8 w-full">
                <Breadcrumb items={[
                    { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                    { label: "Federal Compliance", href: `/clients/${clientId}/federal` },
                    { label: "FIPS 140 Tracking" }
                ]} />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Lock className="h-10 w-10 text-blue-600" />
                            FIPS 140 Inventory
                        </h1>
                        <p className="text-slate-500 text-lg">Track cryptographic modules and their validation status.</p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95">
                                <Plus className="h-5 w-5" />
                                Add Cryptographic Module
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-3xl p-8">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Track New Module</DialogTitle>
                                <DialogDescription>
                                    Add a cryptographic module to your inventory.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="moduleName" className="font-bold text-slate-700">Module Name</Label>
                                    <Input
                                        id="moduleName"
                                        placeholder="e.g. OpenSSL FIPS Provider"
                                        className="h-12 rounded-xl"
                                        value={newModule.moduleName}
                                        onChange={(e) => setNewModule({ ...newModule, moduleName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vendor" className="font-bold text-slate-700">Vendor</Label>
                                    <Input
                                        id="vendor"
                                        placeholder="e.g. OpenSSL Software Foundation"
                                        className="h-12 rounded-xl"
                                        value={newModule.vendor}
                                        onChange={(e) => setNewModule({ ...newModule, vendor: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="certNum" className="font-bold text-slate-700">Certificate Number</Label>
                                    <Input
                                        id="certNum"
                                        placeholder="e.g. 4282"
                                        className="h-12 rounded-xl"
                                        value={newModule.certificateNumber}
                                        onChange={(e) => setNewModule({ ...newModule, certificateNumber: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700">Validation Level</Label>
                                        <Select 
                                            value={newModule.validationLevel} 
                                            onValueChange={(val) => setNewModule({ ...newModule, validationLevel: val })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Level 1">Level 1</SelectItem>
                                                <SelectItem value="Level 2">Level 2</SelectItem>
                                                <SelectItem value="Level 3">Level 3</SelectItem>
                                                <SelectItem value="Level 4">Level 4</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700">Standard</Label>
                                        <Select 
                                            value={newModule.validationVersion} 
                                            onValueChange={(val) => setNewModule({ ...newModule, validationVersion: val })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="140-2">FIPS 140-2</SelectItem>
                                                <SelectItem value="140-3">FIPS 140-3</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">Linked Assets</Label>
                                    <Card className="border-slate-200 shadow-none">
                                        <ScrollArea className="h-40 p-4">
                                            <div className="space-y-2">
                                                {assets?.map((asset: any) => (
                                                    <div key={asset.id} className="flex items-center space-x-2">
                                                        <Checkbox 
                                                            id={`new-asset-${asset.id}`} 
                                                            checked={(newModule.assetIds || []).includes(asset.id)}
                                                            onCheckedChange={() => toggleNewAsset(asset.id)}
                                                        />
                                                        <label
                                                            htmlFor={`new-asset-${asset.id}`}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                        >
                                                            {asset.name}
                                                        </label>
                                                    </div>
                                                ))}
                                                {(!assets || assets.length === 0) && (
                                                    <p className="text-sm text-slate-500 italic">No assets found in inventory.</p>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </Card>
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
                                    {createMutation.isLoading ? "Saving..." : "Add Module"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="rounded-2xl border-none shadow-sm bg-white p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <Shield className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Modules</p>
                            <p className="text-3xl font-black text-slate-900">{modules?.length || 0}</p>
                        </div>
                    </Card>
                    <Card className="rounded-2xl border-none shadow-sm bg-white p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl">
                            <Award className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Validations</p>
                            <p className="text-3xl font-black text-slate-900">
                                {modules?.filter((m: any) => m.status === 'Active').length || 0}
                            </p>
                        </div>
                    </Card>
                    <Card className="rounded-2xl border-none shadow-sm bg-white p-6 flex items-center gap-4">
                        <div className="p-3 bg-amber-50 rounded-xl">
                            <AlertTriangle className="h-8 w-8 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Historical / Revoked</p>
                            <p className="text-3xl font-black text-slate-900">
                                {modules?.filter((m: any) => m.status !== 'Active').length || 0}
                            </p>
                        </div>
                    </Card>
                </div>

                <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-white flex flex-col md:flex-row justify-between gap-4 items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                className="pl-10 bg-slate-50 border-none rounded-xl focus-visible:ring-blue-500/20"
                                placeholder="Search by name, vendor, or certificate..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-500">Loading inventory...</div>
                    ) : filteredModules?.length === 0 ? (
                         <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                            <div className="p-4 bg-slate-50 rounded-full">
                                <Lock className="h-8 w-8 text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">No Modules Found</h3>
                                <p className="text-slate-500">Add your cryptographic modules to track their validation status.</p>
                            </div>
                            <Button 
                                variant="outline" 
                                onClick={() => setIsCreateOpen(true)}
                                className="rounded-xl"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add First Module
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="font-bold text-slate-700">Module Name</TableHead>
                                    <TableHead className="font-bold text-slate-700">Vendor</TableHead>
                                    <TableHead className="font-bold text-slate-700">Certificate</TableHead>
                                    <TableHead className="font-bold text-slate-700">Validation</TableHead>
                                    <TableHead className="font-bold text-slate-700">Standard</TableHead>
                                    <TableHead className="font-bold text-slate-700">Linked Assets</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredModules?.map((mod: any) => (
                                    <TableRow key={mod.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-bold text-slate-900">
                                            {mod.moduleName}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {mod.vendor || "Unknown"}
                                        </TableCell>
                                        <TableCell>
                                            {mod.certificateNumber ? (
                                                <Badge variant="outline" className="font-mono bg-slate-50">
                                                    #{mod.certificateNumber}
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-400 text-sm italic">Pending</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getValidationColor(mod.validationLevel)}>
                                                {mod.validationLevel}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-600 font-medium">
                                            FIPS {mod.validationVersion}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {mod.assets && mod.assets.length > 0 ? (
                                                    mod.assets.map((a: any) => (
                                                        <Badge key={a.id} variant="secondary" className="text-[10px] bg-slate-100 text-slate-700">
                                                            {a.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 text-xs italic">None</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                    onClick={() => setModuleToEdit(mod)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                    onClick={() => setModuleToDelete(mod)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            </div>

            <AlertDialog open={!!moduleToDelete} onOpenChange={(open) => !open && setModuleToDelete(null)}>
                <AlertDialogContent className="rounded-3xl p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-900">
                            Remove Module?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-base leading-relaxed">
                            Are you sure you want to remove <span className="font-bold text-slate-900">"{moduleToDelete?.moduleName}"</span> from your inventory?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="rounded-xl h-12 font-bold px-8">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="rounded-xl h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold px-8"
                            disabled={deleteMutation.isLoading}
                        >
                            {deleteMutation.isLoading ? "Removing..." : "Remove Module"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!moduleToEdit} onOpenChange={(open) => !open && setModuleToEdit(null)}>
                <DialogContent className="sm:max-w-[500px] rounded-3xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Edit Module</DialogTitle>
                        <DialogDescription>
                            Update the details of this cryptographic module.
                        </DialogDescription>
                    </DialogHeader>
                    {moduleToEdit && (
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="editModuleName" className="font-bold text-slate-700">Module Name</Label>
                                <Input
                                    id="editModuleName"
                                    className="h-12 rounded-xl"
                                    value={moduleToEdit.moduleName}
                                    onChange={(e) => setModuleToEdit({ ...moduleToEdit, moduleName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editVendor" className="font-bold text-slate-700">Vendor</Label>
                                <Input
                                    id="editVendor"
                                    className="h-12 rounded-xl"
                                    value={moduleToEdit.vendor || ""}
                                    onChange={(e) => setModuleToEdit({ ...moduleToEdit, vendor: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editCertNum" className="font-bold text-slate-700">Certificate Number</Label>
                                <Input
                                    id="editCertNum"
                                    className="h-12 rounded-xl"
                                    value={moduleToEdit.certificateNumber || ""}
                                    onChange={(e) => setModuleToEdit({ ...moduleToEdit, certificateNumber: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">Validation Level</Label>
                                    <Select 
                                        value={moduleToEdit.validationLevel || "Level 1"} 
                                        onValueChange={(val) => setModuleToEdit({ ...moduleToEdit, validationLevel: val })}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Level 1">Level 1</SelectItem>
                                            <SelectItem value="Level 2">Level 2</SelectItem>
                                            <SelectItem value="Level 3">Level 3</SelectItem>
                                            <SelectItem value="Level 4">Level 4</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">Standard</Label>
                                    <Select 
                                        value={moduleToEdit.validationVersion || "140-3"} 
                                        onValueChange={(val) => setModuleToEdit({ ...moduleToEdit, validationVersion: val })}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="140-2">FIPS 140-2</SelectItem>
                                            <SelectItem value="140-3">FIPS 140-3</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700">Linked Assets</Label>
                                <Card className="border-slate-200 shadow-none">
                                    <ScrollArea className="h-40 p-4">
                                        <div className="space-y-2">
                                            {assets?.map((asset: any) => (
                                                <div key={asset.id} className="flex items-center space-x-2">
                                                    <Checkbox 
                                                        id={`edit-asset-${asset.id}`} 
                                                        checked={(moduleToEdit?.assetIds || moduleToEdit?.assets?.map((a: any) => a.id) || []).includes(asset.id)}
                                                        onCheckedChange={() => toggleEditAsset(asset.id)}
                                                    />
                                                    <label
                                                        htmlFor={`edit-asset-${asset.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {asset.name}
                                                    </label>
                                                </div>
                                            ))}
                                            {(!assets || assets.length === 0) && (
                                                <p className="text-sm text-slate-500 italic">No assets found in inventory.</p>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </Card>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setModuleToEdit(null)}
                            className="h-12 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={updateMutation.isLoading}
                            className="h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold px-8"
                        >
                            {updateMutation.isLoading ? "Updating..." : "Update Module"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
