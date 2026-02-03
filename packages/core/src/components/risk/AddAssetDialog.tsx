import React, { useState, useEffect } from 'react';
import { Button } from '@complianceos/ui/ui/button';
import { EnhancedDialog } from '@complianceos/ui/ui/enhanced-dialog';
import { Label } from '@complianceos/ui/ui/label';
import { Input } from '@complianceos/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { Textarea } from '@complianceos/ui/ui/textarea';
import { trpc } from '@/lib/trpc';
import { Database, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddAssetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: number;
    onSuccess: () => void;
    initialData?: any;
}

const ASSET_TYPES = [
    'Hardware',
    'Software',
    'Information / Data',
    'People / Roles',
    'Service',
    'Intangible / Reputation',
    'Site / Facility'
];

export function AddAssetDialog({ open, onOpenChange, clientId, onSuccess, initialData }: AddAssetDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Hardware',
        owner: '',
        location: '',
        status: 'active',
        acquisitionDate: '',
        lastReviewDate: '',
        valuationC: 3,
        valuationI: 3,
        valuationA: 3,
        description: '',
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    type: initialData.type || 'Hardware',
                    owner: initialData.owner || '',
                    location: initialData.location || '',
                    status: initialData.status || 'active',
                    acquisitionDate: initialData.acquisitionDate ? new Date(initialData.acquisitionDate).toISOString().split('T')[0] : '',
                    lastReviewDate: initialData.lastReviewDate ? new Date(initialData.lastReviewDate).toISOString().split('T')[0] : '',
                    valuationC: initialData.valuationC || 3,
                    valuationI: initialData.valuationI || 3,
                    valuationA: initialData.valuationA || 3,
                    description: initialData.description || '',
                });
            } else {
                setFormData({
                    name: '',
                    type: 'Hardware',
                    owner: '',
                    location: '',
                    status: 'active',
                    acquisitionDate: '',
                    lastReviewDate: '',
                    valuationC: 3,
                    valuationI: 3,
                    valuationA: 3,
                    description: '',
                });
            }
        }
    }, [initialData, open]);

    const createAsset = trpc.risks.createAsset.useMutation();
    const updateAsset = trpc.risks.updateAsset.useMutation();

    const handleSubmit = async () => {
        if (!formData.name) {
            toast.error("Asset name is required");
            return;
        }

        setLoading(true);
        try {
            const commonData = {
                name: formData.name,
                type: formData.type,
                owner: formData.owner,
                location: formData.location,
                status: formData.status as any,
                acquisitionDate: formData.acquisitionDate || undefined,
                lastReviewDate: formData.lastReviewDate || undefined,
                valuationC: formData.valuationC,
                valuationI: formData.valuationI,
                valuationA: formData.valuationA,
                description: formData.description
            };

            if (initialData?.id) {
                await updateAsset.mutateAsync({
                    id: initialData.id,
                    ...commonData,
                });
                toast.success("Asset updated successfully");
            } else {
                await createAsset.mutateAsync({
                    clientId,
                    ...commonData,
                });
                toast.success("Asset added successfully");
            }

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save asset", error);
            toast.error("Failed to save asset");
        } finally {
            setLoading(false);
        }
    };

    return (
        <EnhancedDialog
            open={open}
            onOpenChange={onOpenChange}
            title={
                <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    {initialData ? 'Edit Asset' : 'Add to Asset Inventory'}
                </div>
            }
            description={initialData ? 'Update the details of the selected asset.' : 'Enter the details of the new asset below.'}
            size="md"
            footer={
                <>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? 'Update Asset' : 'Add Asset')}
                    </Button>
                </>
            }
        >
            <div className="space-y-4 py-4">

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Asset Name *</Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Customer Database"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={v => setFormData({ ...formData, type: v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ASSET_TYPES.map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Owner / Department</Label>
                        <Input
                            value={formData.owner}
                            onChange={e => setFormData({ ...formData, owner: e.target.value })}
                            placeholder="e.g., IT Dept, CTO"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g., Server Room A"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={v => setFormData({ ...formData, status: v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                                <SelectItem value="disposed">Disposed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Acquisition Date</Label>
                        <Input
                            type="date"
                            value={formData.acquisitionDate}
                            onChange={e => setFormData({ ...formData, acquisitionDate: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Last Review</Label>
                        <Input
                            type="date"
                            value={formData.lastReviewDate}
                            onChange={e => setFormData({ ...formData, lastReviewDate: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <Label>CIA Valuation (1-5)</Label>
                    <div className="flex gap-4">
                        {[
                            { label: 'Confidentiality', key: 'valuationC' },
                            { label: 'Integrity', key: 'valuationI' },
                            { label: 'Availability', key: 'valuationA' },
                        ].map(field => (
                            <div key={field.key} className="flex-1 space-y-1">
                                <span className="text-xs text-muted-foreground font-medium uppercase">{field.label.charAt(0)}</span>
                                <Input
                                    type="number"
                                    min={1} max={5}
                                    value={formData[field.key as keyof typeof formData] as number}
                                    onChange={e => setFormData({ ...formData, [field.key]: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of the asset..."
                    />
                </div>

            </div>
        </EnhancedDialog>
    );
}
