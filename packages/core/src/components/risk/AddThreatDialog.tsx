import React, { useState } from 'react';
import { Button } from '@complianceos/ui/ui/button';
import { EnhancedDialog } from '@complianceos/ui/ui/enhanced-dialog';
import { Label } from '@complianceos/ui/ui/label';
import { Input } from '@complianceos/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { Textarea } from '@complianceos/ui/ui/textarea';
import { trpc } from '@/lib/trpc';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddThreatDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: number;
    onSuccess: () => void;
    initialData?: any;
}

export function AddThreatDialog({ open, onOpenChange, clientId, onSuccess, initialData }: AddThreatDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        threatId: `THREAT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
        name: '',
        description: '',
        category: 'Technical',
        source: 'External',
        intent: 'Deliberate',
        likelihood: 'Possible',
        potentialImpact: '',
        affectedAssets: '',
        relatedVulnerabilities: '',
        associatedRisks: '',
        scenario: '',
        detectionMethod: '',
        status: 'active',
        owner: '',
        lastReviewDate: '',
    });

    const { data: users } = trpc.clients.getUsers.useQuery({ clientId });

    React.useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    threatId: initialData.threatId || '',
                    name: initialData.name || '',
                    description: initialData.description || '',
                    category: initialData.category || 'Technical',
                    source: initialData.source || 'External',
                    intent: initialData.intent || 'Deliberate',
                    likelihood: initialData.likelihood || 'Possible',
                    potentialImpact: initialData.potentialImpact || '',
                    affectedAssets: Array.isArray(initialData.affectedAssets) ? initialData.affectedAssets.join(', ') : (initialData.affectedAssets || ''),
                    relatedVulnerabilities: Array.isArray(initialData.relatedVulnerabilities) ? initialData.relatedVulnerabilities.join(', ') : (initialData.relatedVulnerabilities || ''),
                    associatedRisks: Array.isArray(initialData.associatedRisks) ? initialData.associatedRisks.join(', ') : (initialData.associatedRisks || ''),
                    scenario: initialData.scenario || '',
                    detectionMethod: initialData.detectionMethod || '',
                    status: initialData.status || 'active',
                    owner: initialData.owner || '',
                    lastReviewDate: initialData.lastReviewDate ? new Date(initialData.lastReviewDate).toISOString().split('T')[0] : '',
                });
            } else {
                setFormData({
                    threatId: `THREAT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
                    name: '',
                    description: '',
                    category: 'Technical',
                    source: 'External',
                    intent: 'Deliberate',
                    likelihood: 'Possible',
                    potentialImpact: '',
                    affectedAssets: '',
                    relatedVulnerabilities: '',
                    associatedRisks: '',
                    scenario: '',
                    detectionMethod: '',
                    status: 'active',
                    owner: '',
                    lastReviewDate: '',
                });
            }
        }
    }, [open, initialData]);

    const createThreat = trpc.risks.createThreat.useMutation();
    const updateThreat = trpc.risks.updateThreat.useMutation();

    const handleSubmit = async () => {
        if (!formData.name) {
            toast.error("Threat name is required");
            return;
        }

        setLoading(true);
        try {
            const commonData = {
                name: formData.name,
                description: formData.description,
                category: formData.category,
                source: formData.source,
                intent: formData.intent,
                likelihood: formData.likelihood,
                potentialImpact: formData.potentialImpact,
                affectedAssets: formData.affectedAssets ? formData.affectedAssets.split(',').map(s => s.trim()) : [],
                relatedVulnerabilities: formData.relatedVulnerabilities ? formData.relatedVulnerabilities.split(',').map(s => s.trim()) : [],
                associatedRisks: formData.associatedRisks ? formData.associatedRisks.split(',').map(s => s.trim()) : [],
                scenario: formData.scenario,
                detectionMethod: formData.detectionMethod,
                status: formData.status as any,
                owner: formData.owner,
                lastReviewDate: formData.lastReviewDate || undefined,
            };

            if (initialData?.id) {
                await updateThreat.mutateAsync({
                    id: initialData.id,
                    ...commonData,
                });
                toast.success("Threat updated successfully");
            } else {
                await createThreat.mutateAsync({
                    clientId,
                    threatId: formData.threatId,
                    ...commonData,
                });
                toast.success("Threat recorded successfully");
            }

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save threat", error);
            toast.error("Failed to save threat");
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
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    {initialData ? 'Edit Threat' : 'Record Threat'}
                </div>
            }
            className="sm:max-w-3xl dark:bg-slate-900"
            size="lg"
            footer={
                <>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="dark:text-white dark:hover:bg-slate-800">Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? 'Update Threat' : 'Record Threat')}
                    </Button>
                </>
            }
        >
            <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2 col-span-2">
                    <Label className="dark:text-slate-300">Threat Name *</Label>
                    <Input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Malware Outbreak"
                        className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="dark:text-slate-300">ID</Label>
                    <Input
                        value={formData.threatId}
                        onChange={e => setFormData({ ...formData, threatId: e.target.value })}
                        disabled={!!initialData}
                        className="dark:bg-slate-950 dark:border-slate-800 dark:text-white disabled:opacity-50"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="dark:text-slate-300">Category</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                        <SelectTrigger className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                            <SelectItem value="Natural" className="dark:focus:bg-slate-800 dark:text-white">Natural</SelectItem>
                            <SelectItem value="Human" className="dark:focus:bg-slate-800 dark:text-white">Human</SelectItem>
                            <SelectItem value="Environmental" className="dark:focus:bg-slate-800 dark:text-white">Environmental</SelectItem>
                            <SelectItem value="Technical" className="dark:focus:bg-slate-800 dark:text-white">Technical</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="dark:text-slate-300">Source/Actor</Label>
                    <Select value={formData.source} onValueChange={v => setFormData({ ...formData, source: v })}>
                        <SelectTrigger className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                            <SelectItem value="Internal" className="dark:focus:bg-slate-800 dark:text-white">Internal</SelectItem>
                            <SelectItem value="External" className="dark:focus:bg-slate-800 dark:text-white">External</SelectItem>
                            <SelectItem value="Hacker" className="dark:focus:bg-slate-800 dark:text-white">Hacker</SelectItem>
                            <SelectItem value="Insider" className="dark:focus:bg-slate-800 dark:text-white">Insider</SelectItem>
                            <SelectItem value="Nature" className="dark:focus:bg-slate-800 dark:text-white">Nature</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="dark:text-slate-300">Intent</Label>
                    <Select value={formData.intent} onValueChange={v => setFormData({ ...formData, intent: v })}>
                        <SelectTrigger className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                            <SelectItem value="Accidental" className="dark:focus:bg-slate-800 dark:text-white">Accidental</SelectItem>
                            <SelectItem value="Deliberate" className="dark:focus:bg-slate-800 dark:text-white">Deliberate</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="dark:text-slate-300">Likelihood</Label>
                    <Select value={formData.likelihood} onValueChange={v => setFormData({ ...formData, likelihood: v })}>
                        <SelectTrigger className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                            <SelectItem value="Rare" className="dark:focus:bg-slate-800 dark:text-white">Rare</SelectItem>
                            <SelectItem value="Unlikely" className="dark:focus:bg-slate-800 dark:text-white">Unlikely</SelectItem>
                            <SelectItem value="Possible" className="dark:focus:bg-slate-800 dark:text-white">Possible</SelectItem>
                            <SelectItem value="Likely" className="dark:focus:bg-slate-800 dark:text-white">Likely</SelectItem>
                            <SelectItem value="Almost Certain" className="dark:focus:bg-slate-800 dark:text-white">Almost Certain</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2 col-span-2">
                    <Label className="dark:text-slate-300">Description</Label>
                    <Textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                    />
                </div>

                <div className="space-y-2 col-span-2">
                    <Label className="dark:text-slate-300">Threat Scenario/Example</Label>
                    <Textarea
                        value={formData.scenario}
                        onChange={e => setFormData({ ...formData, scenario: e.target.value })}
                        placeholder="Describe how this threat might manifest..."
                        className="dark:bg-slate-950 dark:border-slate-800 dark:text-white h-20"
                    />
                </div>

                <div className="space-y-2 col-span-2">
                    <Label className="dark:text-slate-300">Potential Impact</Label>
                    <Input
                        value={formData.potentialImpact}
                        onChange={e => setFormData({ ...formData, potentialImpact: e.target.value })}
                        className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                    />
                </div>

                <div className="space-y-2 col-span-2">
                    <Label className="dark:text-slate-300">Affected Assets (comma separated)</Label>
                    <Input
                        value={formData.affectedAssets}
                        onChange={e => setFormData({ ...formData, affectedAssets: e.target.value })}
                        className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                    />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label className="dark:text-slate-300">Related Vulnerabilities (comma separated)</Label>
                    <Input
                        value={formData.relatedVulnerabilities}
                        onChange={e => setFormData({ ...formData, relatedVulnerabilities: e.target.value })}
                        className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                    />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label className="dark:text-slate-300">Detection Method</Label>
                    <Input
                        value={formData.detectionMethod}
                        onChange={e => setFormData({ ...formData, detectionMethod: e.target.value })}
                        className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="dark:text-slate-300">Status</Label>
                    <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                        <SelectTrigger className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                            <SelectItem value="active" className="dark:focus:bg-slate-800 dark:text-white">Active</SelectItem>
                            <SelectItem value="dormant" className="dark:focus:bg-slate-800 dark:text-white">Dormant</SelectItem>
                            <SelectItem value="monitored" className="dark:focus:bg-slate-800 dark:text-white">Monitored</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="dark:text-slate-300">Owner</Label>
                    <Select value={formData.owner} onValueChange={v => setFormData({ ...formData, owner: v })}>
                        <SelectTrigger className="dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                            <SelectValue placeholder="Select Owner" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                            {users?.map(u => (
                                <SelectItem key={u.id} value={u.name || u.email} className="dark:focus:bg-slate-800 dark:text-white">
                                    {u.name} ({u.email})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="dark:text-slate-300">Last Review</Label>
                    <Input
                        type="date"
                        value={formData.lastReviewDate}
                        onChange={e => setFormData({ ...formData, lastReviewDate: e.target.value })}
                        className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                    />
                </div>
            </div>
        </EnhancedDialog>
    );
}
