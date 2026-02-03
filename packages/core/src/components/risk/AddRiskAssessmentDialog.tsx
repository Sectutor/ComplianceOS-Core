import React, { useState, useEffect } from 'react';
import { Button } from '@complianceos/ui/ui/button';
import { EnhancedDialog } from '@complianceos/ui/ui/enhanced-dialog';
import { Label } from '@complianceos/ui/ui/label';
import { Input } from '@complianceos/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { Textarea } from '@complianceos/ui/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { trpc } from '@/lib/trpc';
import { Shield, Loader2, Check, Calculator, Plus, Save, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@complianceos/ui/ui/badge';
import { calculateResidualRisk, type RiskLevel, type ControlEffectiveness } from '@/lib/riskCalculations';
import { RiskTreatmentForm } from './RiskTreatmentForm';
import { RiskTreatmentCard } from './RiskTreatmentCard';

interface AddRiskAssessmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: number;
    onSuccess: () => void;
    initialData?: any;
}

export function AddRiskAssessmentDialog({ open, onOpenChange, clientId, onSuccess, initialData }: AddRiskAssessmentDialogProps) {
    const [loading, setLoading] = useState(false);
    const [isResidualRiskManual, setIsResidualRiskManual] = useState(false);
    const [activeTab, setActiveTab] = useState('assessment');
    // Renamed for clarity, though logic remains similar (toggle between list and form)
    const [showTreatmentForm, setShowTreatmentForm] = useState(false);
    const [selectedTreatment, setSelectedTreatment] = useState<any>(null);
    const [formData, setFormData] = useState({
        assessmentId: `RA-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
        assessmentDate: new Date().toISOString().split('T')[0],
        assessor: '',
        method: 'Qualitative',
        threatDescription: '',
        vulnerabilityDescription: '',
        affectedAssets: [] as string[],
        likelihood: 'Possible',
        impact: 'High',
        inherentRisk: 'Medium' as RiskLevel | '',
        controlEffectiveness: 'Effective' as ControlEffectiveness,
        residualRisk: 'Low' as RiskLevel | '',
        riskOwner: '',
        treatmentOption: 'None',
        recommendedActions: '',
        priority: 'Medium',
        targetResidualRisk: 'Low',
        reviewDueDate: '',
        status: 'draft',
        notes: '',
        nextReviewDate: '',
        controlIds: [] as number[],
    });

    const { data: controls } = trpc.clientControls.list.useQuery({ clientId });
    const { data: assets } = trpc.risks.getAssets.useQuery({ clientId });
    const { data: users } = trpc.clients.getUsers.useQuery({ clientId });

    useEffect(() => {
        if (initialData && open) {
            // Check if residual risk was manually overridden
            const calculated = calculateResidualRisk(
                initialData.inherentRisk as RiskLevel,
                initialData.controlEffectiveness as ControlEffectiveness
            );
            const isManual = initialData.residualRisk !== calculated;
            setIsResidualRiskManual(isManual);

            setFormData({
                assessmentId: initialData.assessmentId,
                assessmentDate: initialData.assessmentDate ? new Date(initialData.assessmentDate).toISOString().split('T')[0] : '',
                assessor: initialData.assessor || '',
                method: initialData.method || 'Qualitative',
                threatDescription: initialData.threatDescription || '',
                vulnerabilityDescription: initialData.vulnerabilityDescription || '',
                affectedAssets: Array.isArray(initialData.affectedAssets) ? initialData.affectedAssets : [],
                likelihood: initialData.likelihood || 'Possible',
                impact: initialData.impact || 'High',
                inherentRisk: initialData.inherentRisk || 'Medium',
                controlEffectiveness: initialData.controlEffectiveness || 'Effective',
                residualRisk: initialData.residualRisk || 'Low',
                riskOwner: initialData.riskOwner || '',
                treatmentOption: initialData.treatmentOption || 'Mitigate',
                recommendedActions: initialData.recommendedActions || '',
                priority: initialData.priority || 'Medium',
                targetResidualRisk: initialData.targetResidualRisk || 'Low',
                reviewDueDate: initialData.reviewDueDate ? new Date(initialData.reviewDueDate).toISOString().split('T')[0] : '',
                status: initialData.status || 'draft',
                notes: initialData.notes || '',
                nextReviewDate: initialData.nextReviewDate ? new Date(initialData.nextReviewDate).toISOString().split('T')[0] : '',
                controlIds: Array.isArray(initialData.controlIds) ? initialData.controlIds.filter((id: any) => typeof id === 'number') : [],
            });
        } else if (open && !initialData) {
            // Reset form for new entry
            setIsResidualRiskManual(false);
            setFormData({
                assessmentId: `RA-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
                assessmentDate: new Date().toISOString().split('T')[0],
                assessor: '',
                method: 'Qualitative',
                threatDescription: '',
                vulnerabilityDescription: '',
                affectedAssets: [],
                likelihood: 'Possible',
                impact: 'High',
                inherentRisk: 'Medium',
                controlEffectiveness: 'Effective',
                residualRisk: 'Low', // Defaults to calculated value (Medium - Effective = Low)
                riskOwner: '',
                treatmentOption: 'None',
                recommendedActions: '',
                priority: 'Medium',
                targetResidualRisk: 'Low',
                reviewDueDate: '',
                status: 'draft',
                notes: '',
                nextReviewDate: '',
                controlIds: [],
            });
        }
    }, [initialData, open]);

    // Auto-calculate residual risk when inherent risk or control effectiveness changes
    useEffect(() => {
        if (!isResidualRiskManual && formData.inherentRisk) {
            const calculated = calculateResidualRisk(formData.inherentRisk, formData.controlEffectiveness);
            if (calculated && calculated !== formData.residualRisk) {
                setFormData(prev => ({ ...prev, residualRisk: calculated }));
            }
        }
    }, [formData.inherentRisk, formData.controlEffectiveness, isResidualRiskManual, formData.residualRisk]);

    const createMutation = trpc.risks.createRiskAssessment.useMutation({
        onSuccess: () => {
            toast.success('Risk Assessment created successfully');
            onSuccess();
            onOpenChange(false);
            setLoading(false);
        },
        onError: (err) => {
            toast.error(`Failed to create assessment: ${err.message}`);
            setLoading(false);
        }
    });

    // Auto-Triage Mutation
    const analyzeMutation = trpc.advisor.analyzeRisk.useMutation({
        onSuccess: (data) => {
            setFormData(prev => ({
                ...prev,
                likelihood: data.likelihood,
                impact: data.impact,
                inherentRisk: data.inherentRisk
            }));
            toast.success('Risk scored by AI', {
                description: data.reasoning,
                duration: 5000
            });
        },
        onError: (err) => {
            toast.error(`Auto-triage failed: ${err.message}`);
        }
    });

    const handleAutoTriage = async () => {
        if (!formData.threatDescription || !formData.vulnerabilityDescription) {
            toast.error('Please enter threat and vulnerability descriptions first');
            return;
        }

        toast.info('Analyzing risk scenario...');
        await analyzeMutation.mutateAsync({
            clientId,
            threat: formData.threatDescription,
            vulnerability: formData.vulnerabilityDescription,
            assets: formData.affectedAssets
        });
    };

    const updateMutation = trpc.risks.updateRiskAssessment.useMutation({
        onSuccess: () => {
            toast.success('Risk Assessment updated successfully');
            onSuccess();
            onOpenChange(false);
            setLoading(false);
        },
        onError: (err) => {
            toast.error(`Failed to update assessment: ${err.message}`);
            setLoading(false);
        }
    });

    const handleSubmit = async () => {
        setLoading(true);
        if (initialData) {
            // Prepare update data, ensuring dates stay as strings
            const updatePayload = {
                id: initialData.id,
                assessor: formData.assessor,
                method: formData.method,
                threatDescription: formData.threatDescription,
                vulnerabilityDescription: formData.vulnerabilityDescription,
                affectedAssets: formData.affectedAssets,
                likelihood: formData.likelihood,
                impact: formData.impact,
                inherentRisk: formData.inherentRisk,
                controlEffectiveness: formData.controlEffectiveness,
                residualRisk: formData.residualRisk,
                riskOwner: formData.riskOwner,
                treatmentOption: formData.treatmentOption,
                recommendedActions: formData.recommendedActions,
                priority: formData.priority,
                targetResidualRisk: formData.targetResidualRisk,
                status: formData.status as "draft" | "approved" | "reviewed",
                notes: formData.notes,
                controlIds: (formData.controlIds || []).filter((id: any) => typeof id === 'number'),
                // Dates as strings (YYYY-MM-DD format)
                assessmentDate: formData.assessmentDate || undefined,
                reviewDueDate: formData.reviewDueDate || undefined,
                nextReviewDate: formData.nextReviewDate || undefined,
            };
            updateMutation.mutate(updatePayload);
        } else {
            createMutation.mutate({
                clientId,
                ...formData,
                controlIds: (formData.controlIds || []).filter((id: any) => typeof id === 'number')
            });
        }
    };

    const toggleControl = (controlId: number) => {
        setFormData(prev => {
            const exists = prev.controlIds.includes(controlId);
            if (exists) {
                return { ...prev, controlIds: prev.controlIds.filter(id => id !== controlId) };
            } else {
                return { ...prev, controlIds: [...prev.controlIds, controlId] };
            }
        });
    };

    const toggleAsset = (assetName: string) => {
        setFormData(prev => {
            const exists = prev.affectedAssets.includes(assetName);
            if (exists) {
                return { ...prev, affectedAssets: prev.affectedAssets.filter(a => a !== assetName) };
            } else {
                return { ...prev, affectedAssets: [...prev.affectedAssets, assetName] };
            }
        });
    };

    const { data: treatments, refetch: refetchTreatments } = trpc.risks.getRiskTreatments.useQuery(
        { riskAssessmentId: initialData?.id || 0 },
        { enabled: !!initialData?.id }
    );

    const deleteTreatmentMutation = trpc.risks.deleteRiskTreatment.useMutation({
        onSuccess: () => {
            toast.success('Treatment deleted successfully');
            refetchTreatments();
        },
        onError: (err) => {
            toast.error(`Failed to delete treatment: ${err.message}`);
        }
    });

    const handleEditTreatment = (treatment: any) => {
        setSelectedTreatment(treatment);
        setShowTreatmentForm(true);
    };

    const handleDeleteTreatment = async (id: number) => {
        if (confirm('Are you sure you want to delete this treatment plan?')) {
            await deleteTreatmentMutation.mutateAsync({ id });
        }
    };

    const handleTreatmentSuccess = () => {
        refetchTreatments();
        setShowTreatmentForm(false);
        setSelectedTreatment(null);
    };

    return (
        <EnhancedDialog
            open={open}
            onOpenChange={onOpenChange}
            title={initialData ? 'Edit Risk Assessment' : 'New Risk Assessment'}
            description={initialData ? 'Update the details of this risk assessment.' : 'Complete the form below to create a comprehensive risk assessment.'}
            size="xl"
            className="max-h-[90vh]"
            footer={
                <div className="flex w-full justify-between">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close Dialog</Button>
                    <div className="flex gap-2">
                        <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {initialData ? 'Save Assessment Details' : 'Create Assessment'}
                        </Button>
                    </div>
                </div>
            }
        >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="assessment">Assessment Details</TabsTrigger>
                    <TabsTrigger value="treatments" disabled={!initialData}>
                        Treatments {treatments && treatments.length > 0 && `(${treatments.length})`}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="assessment" className="space-y-4">
                    <div className="grid grid-cols-2 gap-6 py-4">
                        {/* Identification */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 border-b pb-2">Identification</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Assessment ID</Label>
                                    <Input value={formData.assessmentId} disabled onChange={() => { }} className="border-2" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input type="date" value={formData.assessmentDate} onChange={(e) => setFormData({ ...formData, assessmentDate: e.target.value })} className="border-2" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Assessor</Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, assessor: val })} value={formData.assessor}>
                                    <SelectTrigger className="border-2">
                                        <SelectValue placeholder="Select Assessor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users?.map(u => (
                                            <SelectItem key={u.id} value={u.name || u.email}>{u.name} ({u.email})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Affected Assets</Label>
                                <div className="border-2 rounded-md p-2 h-32 overflow-y-auto space-y-1 bg-background">
                                    {assets?.map(asset => (
                                        <div
                                            key={asset.id}
                                            className={`flex items-center gap-2 p-1.5 rounded text-sm cursor-pointer hover:bg-gray-50 ${formData.affectedAssets.includes(asset.name) ? 'bg-blue-50 text-blue-700' : ''}`}
                                            onClick={() => toggleAsset(asset.name)}
                                        >
                                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${formData.affectedAssets.includes(asset.name) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                                {formData.affectedAssets.includes(asset.name) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span>{asset.name}</span>
                                        </div>
                                    ))}
                                    {(!assets || assets.length === 0) && <p className="text-gray-400 text-sm p-1">No assets found</p>}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {formData.affectedAssets.map(asset => (
                                        <Badge key={asset} variant="secondary" className="text-xs">{asset}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Threat & Vuln */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 border-b pb-2">Analysis</h3>
                            <div className="space-y-2">
                                <Label>Threat Description</Label>
                                <Textarea
                                    placeholder="What is the thread?"
                                    value={formData.threatDescription}
                                    onChange={(e) => setFormData({ ...formData, threatDescription: e.target.value })}
                                    className="border-2"
                                />

                            </div>
                            <div className="space-y-2">
                                <Label>Vulnerability Description</Label>
                                <Textarea
                                    placeholder="What is the weakness?"
                                    value={formData.vulnerabilityDescription}
                                    onChange={(e) => setFormData({ ...formData, vulnerabilityDescription: e.target.value })}
                                    className="border-2"
                                />

                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAutoTriage}
                                    disabled={analyzeMutation.isLoading}
                                    className="gap-2 text-violet-600 border-violet-200 hover:bg-violet-50"
                                >
                                    {analyzeMutation.isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                    Auto-Triage with AI
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Likelihood</Label>
                                    <Select onValueChange={(val) => setFormData({ ...formData, likelihood: val })} value={formData.likelihood}>
                                        <SelectTrigger className="border-2"><SelectValue placeholder="Likelihood" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Rare">Rare</SelectItem>
                                            <SelectItem value="Unlikely">Unlikely</SelectItem>
                                            <SelectItem value="Possible">Possible</SelectItem>
                                            <SelectItem value="Likely">Likely</SelectItem>
                                            <SelectItem value="Almost Certain">Almost Certain</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Impact</Label>
                                    <Select onValueChange={(val) => setFormData({ ...formData, impact: val })} value={formData.impact}>
                                        <SelectTrigger className="border-2"><SelectValue placeholder="Impact" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Low">Low</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="High">High</SelectItem>
                                            <SelectItem value="Very High">Very High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Inherent Risk</Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, inherentRisk: val })} value={formData.inherentRisk}>
                                    <SelectTrigger className="border-2"><SelectValue placeholder="Level" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                        <SelectItem value="Very High">Very High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="space-y-4 col-span-2">
                            <h3 className="font-semibold text-gray-900 border-b pb-2">Existing Controls</h3>
                            <div className="border rounded-md p-4 max-h-48 overflow-y-auto grid grid-cols-2 gap-2">
                                {controls?.map((item: any) => {
                                    const { clientControl, control } = item;
                                    return (
                                        <div
                                            key={clientControl.id}
                                            className={`flex items-start gap-2 p-2 rounded text-sm cursor-pointer hover:bg-gray-50 border ${formData.controlIds.includes(clientControl.id) ? 'bg-blue-50 border-blue-200' : 'border-transparent'}`}
                                            onClick={() => toggleControl(clientControl.id)}
                                        >
                                            <div className={`mt-0.5 w-4 h-4 border rounded flex items-center justify-center shrink-0 ${formData.controlIds.includes(clientControl.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                                {formData.controlIds.includes(clientControl.id) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <div>
                                                <span className="font-medium block">{control?.controlId || clientControl.controlId}</span>
                                                <span className="text-gray-500 text-xs">{control?.name || clientControl.customDescription}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!controls || controls.length === 0) && <p className="text-gray-400 text-sm">No controls available in library.</p>}
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-2">
                                <div className="space-y-2">
                                    <Label>Control Effectiveness</Label>
                                    <Select onValueChange={(val) => setFormData({ ...formData, controlEffectiveness: val })} value={formData.controlEffectiveness}>
                                        <SelectTrigger className="border-2"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Effective">Effective</SelectItem>
                                            <SelectItem value="Partially Effective">Partially Effective</SelectItem>
                                            <SelectItem value="Ineffective">Ineffective</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Residual Risk</Label>
                                        {!isResidualRiskManual && (
                                            <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                <Calculator className="w-3 h-3" />
                                                Auto-calculated
                                            </span>
                                        )}
                                    </div>
                                    <Select
                                        onValueChange={(val) => {
                                            setFormData({ ...formData, residualRisk: val as RiskLevel });
                                            setIsResidualRiskManual(true);
                                        }}
                                        value={formData.residualRisk}
                                    >
                                        <SelectTrigger className={!isResidualRiskManual ? "border-blue-300 dark:border-blue-700" : ""}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Low">Low</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="High">High</SelectItem>
                                            <SelectItem value="Very High">Very High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {isResidualRiskManual && (
                                        <button
                                            type="button"
                                            onClick={() => setIsResidualRiskManual(false)}
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            Reset to auto-calculate
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Target Risk</Label>
                                    <Select onValueChange={(val) => setFormData({ ...formData, targetResidualRisk: val })} value={formData.targetResidualRisk}>
                                        <SelectTrigger className="border-2"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Low">Low</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Treatment */}
                        <div className="space-y-4 col-span-2">
                            <h3 className="font-semibold text-gray-900 border-b pb-2">Treatment Plan</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Treatment Option</Label>
                                    <Select onValueChange={(val) => setFormData({ ...formData, treatmentOption: val })} value={formData.treatmentOption}>
                                        <SelectTrigger className="border-2"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="None">None (Not Decided)</SelectItem>
                                            <SelectItem value="Mitigate">Mitigate</SelectItem>
                                            <SelectItem value="Accept">Accept</SelectItem>
                                            <SelectItem value="Transfer">Transfer</SelectItem>
                                            <SelectItem value="Avoid">Avoid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Risk Owner</Label>
                                    <Select onValueChange={(val) => setFormData({ ...formData, riskOwner: val })} value={formData.riskOwner}>
                                        <SelectTrigger className="border-2">
                                            <SelectValue placeholder="Select Owner" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users?.map(u => (
                                                <SelectItem key={u.id} value={u.name || u.email}>{u.name} ({u.email})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select onValueChange={(val) => setFormData({ ...formData, priority: val })} value={formData.priority}>
                                        <SelectTrigger className="border-2"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Low">Low</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="High">High</SelectItem>
                                            <SelectItem value="Critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Recommended Actions</Label>
                                <Textarea
                                    value={formData.recommendedActions}
                                    onChange={(e) => setFormData({ ...formData, recommendedActions: e.target.value })}
                                    placeholder="Actions to take..."
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="treatments" className="space-y-4 mt-4">
                    <div className="space-y-4">
                        {showTreatmentForm ? (
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <h3 className="text-lg font-semibold mb-4 text-primary">
                                    {selectedTreatment ? 'Edit Treatment Analysis' : 'New Treatment Analysis'}
                                </h3>
                                <RiskTreatmentForm
                                    clientId={clientId}
                                    riskAssessmentId={initialData?.id || 0}
                                    onSuccess={handleTreatmentSuccess}
                                    onCancel={() => { setShowTreatmentForm(false); setSelectedTreatment(null); }}
                                    initialData={selectedTreatment}
                                    riskContext={{
                                        threat: formData.threatDescription || '',
                                        vulnerability: formData.vulnerabilityDescription || '',
                                        riskDetails: `Impact: ${formData.impact}, Likelihood: ${formData.likelihood}, Risk: ${formData.inherentRisk}`
                                    }}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-semibold">Treatment Plans</h3>
                                        <p className="text-sm text-muted-foreground">Manage risk mitigation strategies for this assessment</p>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setSelectedTreatment(null);
                                            setShowTreatmentForm(true);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Treatment
                                    </Button>
                                </div>

                                {treatments && treatments.length > 0 ? (
                                    <div className="space-y-3">
                                        {treatments.map((treatment) => (
                                            <RiskTreatmentCard
                                                key={treatment.id}
                                                treatment={treatment}
                                                onEdit={handleEditTreatment}
                                                onDelete={handleDeleteTreatment}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed rounded-lg p-12 text-center">
                                        <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                        <h4 className="font-medium mb-1">No Treatment Plans Yet</h4>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Create treatment plans to document how this risk will be managed
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setSelectedTreatment(null);
                                                setShowTreatmentForm(true);
                                            }}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create First Treatment
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </EnhancedDialog>
    );
}
