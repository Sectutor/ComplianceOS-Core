import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Badge } from "@complianceos/ui/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@complianceos/ui/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Search, Laptop, Monitor, Tablet, Smartphone, Package, Plus, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EquipmentAssignmentTabProps {
    clientId: number;
}

export default function EquipmentAssignmentTab({ clientId }: EquipmentAssignmentTabProps) {
    const [search, setSearch] = useState("");
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<{ id: number; name: string } | null>(null);
    const [selectedAssetId, setSelectedAssetId] = useState<string>("");
    const [notes, setNotes] = useState("");

    // Fetch employee onboarding statuses (which includes asset info)
    const { data: employeeStatuses, isLoading: loadingEmployees, refetch: refetchEmployees } = (trpc.onboarding as any).getCompanyOnboardingStatus.useQuery(
        { clientId },
        { enabled: clientId > 0 }
    );

    // Fetch all available assets
    const { data: allAssets, isLoading: loadingAssets } = (trpc.assets as any).list.useQuery(
        { clientId },
        { enabled: clientId > 0 }
    );

    const assignAssetMutation = (trpc.onboarding as any).assignAsset.useMutation({
        onSuccess: () => {
            toast.success("Equipment assigned successfully");
            setIsAssignDialogOpen(false);
            setSelectedAssetId("");
            setNotes("");
            refetchEmployees();
        },
        onError: (error: any) => {
            toast.error(`Failed to assign equipment: ${error.message}`);
        }
    });

    const filteredEmployees = employeeStatuses?.filter((emp: any) =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleAssignClick = (emp: any) => {
        setSelectedEmployee({ id: emp.employeeId, name: `${emp.firstName} ${emp.lastName}` });
        setIsAssignDialogOpen(true);
    };

    const handleAssignSubmit = () => {
        if (!selectedEmployee || !selectedAssetId) return;

        const asset = allAssets?.find((a: any) => a.id.toString() === selectedAssetId);
        if (!asset) return;

        assignAssetMutation.mutate({
            clientId,
            employeeId: selectedEmployee.id,
            assetType: asset.type || asset.category || 'Equipment',
            serialNumber: asset.serialNumber || undefined,
            notes: notes || undefined
        });
    };

    const getAssetIcon = (type: string) => {
        const t = (type || "").toLowerCase();
        if (t.includes('laptop')) return <Laptop className="h-4 w-4" />;
        if (t.includes('monitor')) return <Monitor className="h-4 w-4" />;
        if (t.includes('tablet')) return <Tablet className="h-4 w-4" />;
        if (t.includes('phone')) return <Smartphone className="h-4 w-4" />;
        return <Package className="h-4 w-4" />;
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle>Equipment Assignment</CardTitle>
                    <CardDescription>
                        Assign business equipment to employees for confirmation during onboarding.
                    </CardDescription>
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search employees..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Employee</TableHead>
                                <TableHead>Assigned Equipment</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingEmployees ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                            <span>Loading employees...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredEmployees?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                        No employees found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEmployees?.map((emp: any) => (
                                    <TableRow key={emp.employeeId} className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{emp.firstName} {emp.lastName}</span>
                                                <span className="text-xs text-muted-foreground">{emp.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2">
                                                {emp.tasks.assets?.total > 0 ? (
                                                    // This might need more specific asset data from the backend to show names
                                                    // For now, we show the count or summary status
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Package className="h-4 w-4" />
                                                        <span>{emp.tasks.assets.count}/{emp.tasks.assets.total} Confirmed</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">No equipment assigned</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {emp.tasks.assets?.complete ? (
                                                <Badge className="bg-green-500 hover:bg-green-600">
                                                    All Confirmed
                                                </Badge>
                                            ) : emp.tasks.assets?.total > 0 ? (
                                                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                                    Pending Confirmation
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">Unassigned</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2"
                                                onClick={() => handleAssignClick(emp)}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Assign Item
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Equipment</DialogTitle>
                        <DialogDescription>
                            Select an item from the asset inventory to assign to <strong>{selectedEmployee?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Asset</label>
                            <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose an asset..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {loadingAssets ? (
                                        <SelectItem value="loading" disabled>Loading assets...</SelectItem>
                                    ) : allAssets?.length === 0 ? (
                                        <SelectItem value="none" disabled>No assets in inventory</SelectItem>
                                    ) : (
                                        allAssets?.map((asset: any) => (
                                            <SelectItem key={asset.id} value={asset.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    {getAssetIcon(asset.type || asset.category)}
                                                    <span>{asset.name}</span>
                                                    {asset.serialNumber && <span className="text-xs text-muted-foreground">({asset.serialNumber})</span>}
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notes (Optional)</label>
                            <Input
                                placeholder="Condition, special instructions, etc."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleAssignSubmit}
                            disabled={!selectedAssetId || assignAssetMutation.isLoading}
                        >
                            {assignAssetMutation.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Assign Equipment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
