import React, { useState, useEffect } from 'react';
import { Button } from '@complianceos/ui/ui/button';
import { EnhancedDialog } from '@complianceos/ui/ui/enhanced-dialog';
import { Label } from '@complianceos/ui/ui/label';
import { Input } from '@complianceos/ui/ui/input';
import { Textarea } from '@complianceos/ui/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

import { Info } from 'lucide-react';

interface RiskEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    risk: any;
    clientId: number;
    onSuccess: () => void;
}

export function RiskEditDialog({ open, onOpenChange, risk, clientId, onSuccess }: RiskEditDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: risk?.title || '',
        description: risk?.description || '',
        threatCategory: risk?.threatCategory || 'General',
        status: risk?.status || 'identified',
        owner: risk?.owner || '',
        likelihood: risk?.likelihood || 1,
        impact: risk?.impact || 1,
        residualLikelihood: risk?.residualLikelihood,
        residualImpact: risk?.residualImpact,
        residualScore: risk?.residualScore,
    });

    // Fetch organization users
    const { data: orgUsers } = trpc.clients.getUsers.useQuery({ clientId }, { enabled: open && !!clientId });

    useEffect(() => {
        if (risk) {
            setFormData({
                title: risk.title || '',
                description: risk.description || '',
                threatCategory: risk.threatCategory || 'General',
                status: risk.status || 'identified',
                owner: risk.owner || '',
                likelihood: risk.likelihood ? Number(risk.likelihood) : 1,
                impact: risk.impact ? Number(risk.impact) : 1,
                residualLikelihood: risk.residualLikelihood ? Number(risk.residualLikelihood) : undefined,
                residualImpact: risk.residualImpact ? Number(risk.residualImpact) : undefined,
                residualScore: risk.residualScore ? Number(risk.residualScore) : undefined,
            });
        }
    }, [risk]);

    const updateRiskMutation = trpc.devProjects.updateRisk.useMutation();

    const handleSubmit = async () => {
        setLoading(true);
        const payload = {
            id: risk.id,
            clientId: clientId,
            ...formData,
        };
        console.log('[RiskEditDialog] Submitting mutation with payload:', JSON.stringify(payload, null, 2));
        try {
            const result = await updateRiskMutation.mutateAsync(payload);
            console.log('[RiskEditDialog] Mutation result:', JSON.stringify(result, null, 2));
            toast.success('Risk updated successfully');
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('[RiskEditDialog] Failed to update risk', error);
            toast.error('Failed to update risk');
        } finally {
            setLoading(false);
        }
    };

    return (
        <EnhancedDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Edit Risk"
            description="Update the details for this risk."
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
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm space-y-2">
                            <h4 className="font-semibold text-slate-900">Risk Assessment Methodology</h4>
                            <p className="text-slate-600 leading-relaxed text-xs">
                                Risks are evaluated using a standard 5x5 matrix: <br />
                                <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded text-[10px]">Likelihood (1-5) × Impact (1-5) = Risk Score</span>
                            </p>
                            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-500 font-medium">
                                <li className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-600" /> 15-25: Critical</li>
                                <li className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" /> 9-14: High</li>
                                <li className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> 4-8: Medium</li>
                                <li className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-600" /> 1-3: Low</li>
                            </ul>
                            <div className="pt-2 border-t border-slate-200 flex gap-4 text-[10px]">
                                <div>
                                    <strong className="text-slate-700">Inherent:</strong> Before controls
                                </div>
                                <div>
                                    <strong className="text-slate-700">Residual:</strong> After mitigations
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Input
                            value={formData.threatCategory}
                            onChange={(e) => setFormData({ ...formData, threatCategory: e.target.value })}
                        />
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
                                <SelectItem value="identified">Identified</SelectItem>
                                <SelectItem value="assessed">Assessed</SelectItem>
                                <SelectItem value="mitigated">Mitigated</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Likelihood (1-5)</Label>
                        <p className="text-[10px] text-slate-500">Frequency of threat event</p>
                        <Select
                            value={String(formData.likelihood)}
                            onValueChange={(value) => setFormData({ ...formData, likelihood: parseInt(value) })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5].map((v) => (
                                    <SelectItem key={v} value={String(v)}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Impact (1-5)</Label>
                        <p className="text-[10px] text-slate-500">Severity of potential loss</p>
                        <Select
                            value={String(formData.impact)}
                            onValueChange={(value) => setFormData({ ...formData, impact: parseInt(value) })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5].map((v) => (
                                    <SelectItem key={v} value={String(v)}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Residual Likelihood (Opt.)</Label>
                        <Select
                            value={String(formData.residualLikelihood || '')}
                            onValueChange={(value) => setFormData({ ...formData, residualLikelihood: value ? parseInt(value) : undefined })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="-" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5].map((v) => (
                                    <SelectItem key={v} value={String(v)}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Residual Impact (Opt.)</Label>
                        <Select
                            value={String(formData.residualImpact || '')}
                            onValueChange={(value) => setFormData({ ...formData, residualImpact: value ? parseInt(value) : undefined })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="-" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5].map((v) => (
                                    <SelectItem key={v} value={String(v)}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Residual Score (Manual)</Label>
                        <Input
                            type="number"
                            placeholder="Auto-calculated if L/I set"
                            value={formData.residualScore || ''}
                            onChange={(e) => setFormData({ ...formData, residualScore: e.target.value ? parseInt(e.target.value) : undefined })}
                        />
                    </div>
                </div>

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
            </div>
        </EnhancedDialog>
    );
}
