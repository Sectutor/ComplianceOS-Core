import React, { useState, useEffect } from 'react';
import { Button } from '@complianceos/ui/ui/button';
import { EnhancedDialog } from '@complianceos/ui/ui/enhanced-dialog';
import { Label } from '@complianceos/ui/ui/label';
import { Input } from '@complianceos/ui/ui/input';
import { Textarea } from '@complianceos/ui/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface TreatmentEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    treatment: any;
    clientId: number;
    onSuccess: () => void;
}

export function TreatmentEditDialog({ open, onOpenChange, treatment, clientId, onSuccess }: TreatmentEditDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        treatmentType: treatment?.treatmentType || 'mitigate',
        strategy: treatment?.strategy || '',
        justification: treatment?.justification || '',
        owner: treatment?.owner || '',
        dueDate: treatment?.dueDate ? new Date(treatment.dueDate).toISOString().split('T')[0] : '',
        priority: treatment?.priority || 'medium',
        status: treatment?.status || 'planned',
        estimatedCost: treatment?.estimatedCost || '',
    });

    // Fetch organization users
    const { data: orgUsers, isLoading: usersLoading } = trpc.clients.getUsers.useQuery({ clientId }, { enabled: open && !!clientId });

    useEffect(() => {
        if (open) {
            console.log('[TreatmentEditDialog] clientId:', clientId);
            console.log('[TreatmentEditDialog] orgUsers:', orgUsers);
        }
    }, [open, orgUsers, clientId]);

    useEffect(() => {
        if (treatment) {
            setFormData({
                treatmentType: treatment.treatmentType || 'mitigate',
                strategy: treatment.strategy || '',
                justification: treatment.justification || '',
                owner: treatment.owner || '',
                dueDate: treatment.dueDate ? new Date(treatment.dueDate).toISOString().split('T')[0] : '',
                priority: treatment.priority || 'medium',
                status: treatment.status || 'planned',
                estimatedCost: treatment.estimatedCost || '',
            });
        }
    }, [treatment]);

    const updateTreatmentMutation = trpc.risks.updateRiskTreatment.useMutation();

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await updateTreatmentMutation.mutateAsync({
                id: treatment.id,
                ...formData,
            });
            toast.success('Treatment updated successfully');
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to update treatment', error);
            toast.error('Failed to update treatment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <EnhancedDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Edit Risk Treatment"
            description="Update the treatment strategy for this risk."
            size="lg"
            footer={
                <>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </>
            }
        >
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Treatment Type</Label>
                        <Select
                            value={formData.treatmentType}
                            onValueChange={(value) => setFormData({ ...formData, treatmentType: value as any })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mitigate">Mitigate</SelectItem>
                                <SelectItem value="transfer">Transfer</SelectItem>
                                <SelectItem value="accept">Accept</SelectItem>
                                <SelectItem value="avoid">Avoid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="planned">Planned</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="on_hold">On Hold</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Strategy</Label>
                    <Input
                        placeholder="e.g., Implement MFA, Add encryption, etc."
                        value={formData.strategy}
                        onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Justification / Notes</Label>
                    <Textarea
                        placeholder="Explain how this treatment addresses the risk..."
                        value={formData.justification}
                        onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Owner</Label>
                        <Select
                            value={formData.owner}
                            onValueChange={(value) => setFormData({ ...formData, owner: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select owner..." />
                            </SelectTrigger>
                            <SelectContent>
                                {orgUsers && orgUsers.length > 0 ? (
                                    orgUsers
                                        .filter((item: any) => {
                                            const u = item.user || item;
                                            return u?.name && u?.email;
                                        })
                                        .map((item: any) => {
                                            const u = item.user || item;
                                            return (
                                                <SelectItem key={u.id} value={u.name}>
                                                    {u.name} ({u.email})
                                                </SelectItem>
                                            );
                                        })
                                ) : (
                                    <div className="px-2 py-1.5 text-sm text-slate-500">No users found</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select
                            value={formData.priority}
                            onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="critical">Critical</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Estimated Cost</Label>
                    <Input
                        placeholder="e.g., $5,000"
                        value={formData.estimatedCost}
                        onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                    />
                </div>
            </div>
        </EnhancedDialog>
    );
}
