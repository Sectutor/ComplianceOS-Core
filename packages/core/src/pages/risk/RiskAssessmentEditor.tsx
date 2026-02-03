import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@complianceos/ui/ui/button';
import { Label } from '@complianceos/ui/ui/label';
import { Input } from '@complianceos/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { Textarea } from '@complianceos/ui/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { trpc } from '@/lib/trpc';
import { Shield, Loader2, Check, Calculator, Plus, ArrowLeft, Save, Trash2, Calendar, FileText, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@complianceos/ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import { calculateResidualRisk, type RiskLevel, type ControlEffectiveness } from '@/lib/riskCalculations';
import { RiskTreatmentForm } from '@/components/risk/RiskTreatmentForm';
import { RiskTreatmentCard } from '@/components/risk/RiskTreatmentCard';
import { useClientContext } from '@/contexts/ClientContext';
import { Separator } from '@complianceos/ui/ui/separator';
import DashboardLayout from '@/components/DashboardLayout';
import { SearchableSelect, type SearchableSelectItem } from '@/components/ui-custom/SearchableSelect';
import { GapAnalysis } from '@/components/risk/GapAnalysis';
import { Slot } from "@/registry";
import { SlotNames } from "@/registry/slotNames";
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

export default function RiskAssessmentEditor() {
    const [location, setLocation] = useLocation();
    const [_, params] = useRoute('/clients/:clientId/risks/assessments/:assessmentId');
    const clientId = params?.clientId ? parseInt(params.clientId) : 0;
    const assessmentId = params?.assessmentId === 'new' ? null : (params?.assessmentId ? parseInt(params.assessmentId) : null);

    const { selectedClientId } = useClientContext();

    // Ensure we are in the correct client context
    useEffect(() => {
        if (clientId && selectedClientId && clientId !== selectedClientId) {
            // Optional: redirect or warn? For now assume URL is source of truth or context syncs
        }
    }, [clientId, selectedClientId]);

    const [loading, setLoading] = useState(false);
    const [isResidualRiskManual, setIsResidualRiskManual] = useState(false);
    const [activeTab, setActiveTab] = useState('identification'); // Split into more granular tabs or sections? keeping tabs for now but page layout

    // Treatment Form State
    const [showTreatmentForm, setShowTreatmentForm] = useState(false);
    const [selectedTreatment, setSelectedTreatment] = useState<any>(null);
    const [treatmentToDelete, setTreatmentToDelete] = useState<any>(null);

    const [formData, setFormData] = useState({
        assessmentId: `RA-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
        title: '',
        assessmentDate: new Date().toISOString().split('T')[0],
        assessor: '',
        method: 'Qualitative',
        threatId: undefined as number | undefined,
        threatDescription: '',
        vulnerabilityId: undefined as number | undefined,
        vulnerabilityDescription: '',
        affectedAssets: [] as string[],
        affectedProcessIds: [] as number[],
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

    // Queries
    const { data: controls } = trpc.clientControls.list.useQuery({ clientId }, { enabled: !!clientId });
    const { data: assets } = trpc.risks.getAssets.useQuery({ clientId }, { enabled: !!clientId });
    const { data: users } = trpc.clients.getUsers.useQuery({ clientId }, { enabled: !!clientId });
    const { data: threatsData } = trpc.risks.getThreats.useQuery({ clientId }, { enabled: !!clientId });
    const { data: vulnerabilitiesData } = trpc.risks.getVulnerabilities.useQuery({ clientId }, { enabled: !!clientId });
    const { data: processes } = trpc.businessContinuity.processes.list.useQuery({ clientId }, { enabled: !!clientId });

    // Fetch existing assessment if editing
    const { data: existingAssessment, isLoading: isLoadingAssessment } = trpc.risks.getRiskAssessments.useQuery(
        { clientId },
        {
            select: (data) => data.find(r => r.id === assessmentId),
            enabled: !!assessmentId && !!clientId
        }
    );

    // Initial Data Load
    useEffect(() => {
        if (existingAssessment) {
            const calculated = calculateResidualRisk(
                existingAssessment.inherentRisk as RiskLevel,
                existingAssessment.controlEffectiveness as ControlEffectiveness
            );
            const isManual = existingAssessment.residualRisk !== calculated;
            setIsResidualRiskManual(isManual);

            setFormData({
                assessmentId: existingAssessment.assessmentId,
                title: existingAssessment.title || '',
                assessmentDate: existingAssessment.assessmentDate ? new Date(existingAssessment.assessmentDate).toISOString().split('T')[0] : '',
                assessor: existingAssessment.assessor || '',
                method: existingAssessment.method || 'Qualitative',
                threatId: existingAssessment.threatId,
                threatDescription: existingAssessment.threatDescription || '',
                vulnerabilityId: existingAssessment.vulnerabilityId,
                vulnerabilityDescription: existingAssessment.vulnerabilityDescription || '',
                affectedAssets: Array.isArray(existingAssessment.affectedAssets) ? existingAssessment.affectedAssets : [],
                likelihood: existingAssessment.likelihood || 'Possible',
                impact: existingAssessment.impact || 'High',
                inherentRisk: existingAssessment.inherentRisk || 'Medium',
                controlEffectiveness: existingAssessment.controlEffectiveness || 'Effective',
                residualRisk: existingAssessment.residualRisk || 'Low',
                riskOwner: existingAssessment.riskOwner || '',
                treatmentOption: existingAssessment.treatmentOption || 'Mitigate',
                recommendedActions: existingAssessment.recommendedActions || '',
                priority: existingAssessment.priority || 'Medium',
                targetResidualRisk: existingAssessment.targetResidualRisk || 'Low',
                reviewDueDate: existingAssessment.reviewDueDate ? new Date(existingAssessment.reviewDueDate).toISOString().split('T')[0] : '',
                status: existingAssessment.status || 'draft',
                notes: existingAssessment.notes || '',
                nextReviewDate: existingAssessment.nextReviewDate ? new Date(existingAssessment.nextReviewDate).toISOString().split('T')[0] : '',
                controlIds: Array.isArray(existingAssessment.controlIds) ? existingAssessment.controlIds.filter((id: any) => typeof id === 'number') : [],
            });
        }
    }, [existingAssessment]);

    // Auto-calculate residual risk
    useEffect(() => {
        if (!isResidualRiskManual && formData.inherentRisk) {
            const calculated = calculateResidualRisk(formData.inherentRisk as RiskLevel, formData.controlEffectiveness as ControlEffectiveness);
            if (calculated && calculated !== formData.residualRisk) {
                setFormData(prev => ({ ...prev, residualRisk: calculated }));
            }
        }
    }, [formData.inherentRisk, formData.controlEffectiveness, isResidualRiskManual]);

    // Mutations
    const createMutation = trpc.risks.createRiskAssessment.useMutation({
        onSuccess: () => {
            toast.success('Risk Assessment created successfully');
            setLocation(`/clients/${clientId}/risks/assessments`);
        },
        onError: (err) => toast.error(`Failed to create: ${err.message}`)
    });

    const updateMutation = trpc.risks.updateRiskAssessment.useMutation({
        onSuccess: () => {
            toast.success('Risk Assessment updated successfully');
            setLocation(`/clients/${clientId}/risks/assessments`);
        },
        onError: (err) => toast.error(`Failed to update: ${err.message}`)
    });

    const createThreatMutation = trpc.risks.createThreat.useMutation({
        onSuccess: (data) => {
            toast.success('Threat created');
            setFormData(prev => ({ ...prev, threatId: data.id, threatDescription: data.name }));
            // Refetch is tricky with SearchableSelect unless we manually update local state or refetch query
            // The query hook will refetch automatically if we invalidate, but let's assume we proceed
        }
    });



    // Auto-Triage Mutation (Removed in favor of Slot component)
    /*
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
    */

    const createVulnerabilityMutation = trpc.risks.createVulnerability.useMutation({
        onSuccess: (data) => {
            toast.success('Vulnerability created');
            setFormData(prev => ({ ...prev, vulnerabilityId: data.id, vulnerabilityDescription: data.name }));
        }
    });

    const handleCreateThreat = async (name: string) => {
        try {
            await createThreatMutation.mutateAsync({
                clientId,
                name,
                threatId: `T-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
                status: 'active'
            });
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleCreateVulnerability = async (name: string) => {
        try {
            await createVulnerabilityMutation.mutateAsync({
                clientId,
                name,
                vulnerabilityId: `VULN-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
                status: 'open'
            });
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (assessmentId) { // Update
                const payload: any = {
                    id: assessmentId,
                    title: formData.title,
                    assessmentDate: formData.assessmentDate || undefined,
                    assessor: formData.assessor,
                    method: formData.method,
                    threatId: formData.threatId || undefined,
                    threatDescription: formData.threatDescription,
                    vulnerabilityId: formData.vulnerabilityId || undefined,
                    vulnerabilityDescription: formData.vulnerabilityDescription,
                    affectedAssets: formData.affectedAssets,
                    affectedProcessIds: formData.affectedProcessIds,
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
                    reviewDueDate: formData.reviewDueDate || undefined,
                    status: formData.status as "draft" | "approved" | "reviewed",
                    notes: formData.notes,
                    nextReviewDate: formData.nextReviewDate || undefined,
                    controlIds: formData.controlIds,
                };
                console.log("Submitting Update Payload:", payload);
                await updateMutation.mutateAsync(payload);
            } else { // Create
                const payload: any = {
                    clientId,
                    assessmentId: formData.assessmentId,
                    title: formData.title,
                    assessmentDate: formData.assessmentDate || undefined,
                    assessor: formData.assessor,
                    method: formData.method,
                    threatId: formData.threatId || undefined,
                    threatDescription: formData.threatDescription,
                    vulnerabilityId: formData.vulnerabilityId || undefined,
                    vulnerabilityDescription: formData.vulnerabilityDescription,
                    affectedAssets: formData.affectedAssets,
                    affectedProcessIds: formData.affectedProcessIds,
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
                    reviewDueDate: formData.reviewDueDate || undefined,
                    status: formData.status as "draft" | "approved" | "reviewed",
                    notes: formData.notes,
                    nextReviewDate: formData.nextReviewDate || undefined,
                    controlIds: formData.controlIds,
                };
                console.log("Submitting Create Payload:", payload);
                await createMutation.mutateAsync(payload);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Treatment Logic
    const { data: treatments, refetch: refetchTreatments } = trpc.risks.getRiskTreatments.useQuery(
        { riskAssessmentId: assessmentId || 0 },
        { enabled: !!assessmentId }
    );

    const deleteTreatmentMutation = trpc.risks.deleteRiskTreatment.useMutation({
        onSuccess: () => {
            toast.success('Treatment deleted');
            refetchTreatments();
        },
        onError: (err) => toast.error(`Failed to delete: ${err.message}`)
    });

    const handleDeleteTreatment = (id: number) => {
        setTreatmentToDelete(id);
    };

    const confirmDeleteTreatment = async () => {
        if (treatmentToDelete) {
            await deleteTreatmentMutation.mutateAsync({ id: treatmentToDelete });
            setTreatmentToDelete(null);
        }
    };

    // Helpers
    const toggleControl = (controlId: number) => {
        setFormData(prev => {
            const exists = prev.controlIds.includes(controlId);
            return {
                ...prev,
                controlIds: exists
                    ? prev.controlIds.filter(id => id !== controlId)
                    : [...prev.controlIds, controlId]
            };
        });
    };

    const toggleAsset = (assetName: string) => {
        setFormData(prev => {
            const exists = prev.affectedAssets.includes(assetName);
            return {
                ...prev,
                affectedAssets: exists
                    ? prev.affectedAssets.filter(a => a !== assetName)
                    : [...prev.affectedAssets, assetName]
            };
        });
    };

    const toggleProcess = (processId: number) => {
        setFormData(prev => {
            const exists = (prev.affectedProcessIds || []).includes(processId);
            return {
                ...prev,
                affectedProcessIds: exists
                    ? (prev.affectedProcessIds || []).filter(id => id !== processId)
                    : [...(prev.affectedProcessIds || []), processId]
            };
        });
    };

    if (isLoadingAssessment) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <DashboardLayout>
            <div className="px-6 py-8 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setLocation(`/clients/${clientId}/risks/assessments`)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Shield className="w-6 h-6 text-[#1C4D8D]" />
                                {assessmentId ? 'Edit Risk Assessment' : 'New Risk Assessment'}
                            </h1>
                            <p className="text-muted-foreground flex items-center gap-2">
                                {formData.assessmentId}
                                {existingAssessment?.gapResponseId && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="text-orange-600 p-0 h-auto"
                                        onClick={() => setLocation(`/clients/${clientId}/gap-analysis`)}
                                    >
                                        View Source Gap →
                                    </Button>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setLocation(`/clients/${clientId}/risks/assessments`)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <Save className="w-4 h-4 mr-2" />
                            Save Assessment
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
                    <TabsList className="w-full h-auto p-1.5 bg-slate-100/50 border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-2">
                        {[
                            { id: 'identification', label: 'Identification', icon: FileText, desc: 'Basic Details' },
                            { id: 'analysis', label: 'Risk Analysis', icon: Calculator, desc: 'Score Risk' },
                            { id: 'controls', label: 'Controls', icon: Shield, desc: 'Mitigation' },
                            { id: 'treatment', label: 'Treatment', icon: Activity, desc: 'Action Plan' }
                        ].map((section) => (
                            <TabsTrigger
                                key={section.id}
                                value={section.id}
                                className="flex items-center gap-3 px-4 py-3 h-auto data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#1C4D8D] border border-transparent data-[state=active]:border-slate-200 transition-all"
                            >
                                <div className={`p-2 rounded-md transition-colors ${activeTab === section.id
                                    ? 'bg-[#1C4D8D]/10 text-[#1C4D8D]'
                                    : 'bg-slate-200/50 text-slate-500'
                                    }`}>
                                    <section.icon className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col items-start transition-all">
                                    <span className="text-sm font-bold tracking-tight">{section.label}</span>
                                    <span className="text-[10px] font-medium opacity-70 uppercase tracking-wider">{section.desc}</span>
                                </div>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="w-full">
                        {/* Identification Section */}
                        <TabsContent value="identification" className="mt-0 focus-visible:ring-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-gray-500" />
                                        Identification
                                    </CardTitle>
                                    <CardDescription>Basic details about the risk assessment.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Title / Name</Label>
                                        <Input
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g. Annual Review of AWS Access Controls"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Assessment Date</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                                <Input
                                                    type="date"
                                                    className="pl-9"
                                                    value={formData.assessmentDate}
                                                    onChange={(e) => setFormData({ ...formData, assessmentDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Assessor</Label>
                                            <Select onValueChange={(val) => setFormData({ ...formData, assessor: val })} value={formData.assessor}>
                                                <SelectTrigger><SelectValue placeholder="Select Assessor" /></SelectTrigger>
                                                <SelectContent>
                                                    {users?.map(u => (
                                                        <SelectItem key={u.id} value={u.name || u.email}>{u.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Affected Assets</Label>
                                        <div className="border rounded-md p-3 min-h-[100px] max-h-[200px] overflow-y-auto space-y-1 bg-slate-50/50">
                                            {assets?.map(asset => (
                                                <div
                                                    key={asset.id}
                                                    className={`flex items-center gap-2 p-2 rounded text-sm cursor-pointer transition-colors ${formData.affectedAssets.includes(asset.name)
                                                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                                                        : 'hover:bg-slate-100'
                                                        }`}
                                                    onClick={() => toggleAsset(asset.name)}
                                                >
                                                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${formData.affectedAssets.includes(asset.name) ? 'bg-blue-600 border-blue-600' : 'border-gray-400'
                                                        }`}>
                                                        {formData.affectedAssets.includes(asset.name) && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span>{asset.name}</span>
                                                </div>
                                            ))}
                                            {(!assets || assets.length === 0) && <p className="text-muted-foreground text-sm italic">No assets found</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Affected Business Processes</Label>
                                        <div className="border rounded-md p-3 min-h-[100px] max-h-[200px] overflow-y-auto space-y-1 bg-slate-50/50">
                                            {processes?.map(proc => {
                                                const isSelected = (formData.affectedProcessIds || []).includes(proc.id);
                                                return (
                                                    <div
                                                        key={proc.id}
                                                        className={`flex items-center gap-2 p-2 rounded text-sm cursor-pointer transition-colors ${isSelected
                                                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                                                            : 'hover:bg-slate-100'
                                                            }`}
                                                        onClick={() => toggleProcess(proc.id)}
                                                    >
                                                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected ? 'bg-[#1C4D8D] border-[#1C4D8D]' : 'border-gray-400'
                                                            }`}>
                                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <span>{proc.name}</span>
                                                        {proc.criticalityTier && <Badge variant="outline" className="ml-auto text-xs">{proc.criticalityTier}</Badge>}
                                                    </div>
                                                );
                                            })}
                                            {(!processes || processes.length === 0) && <p className="text-muted-foreground text-sm italic">No processes found</p>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Analysis Section */}
                        <TabsContent value="analysis" className="mt-0 focus-visible:ring-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calculator className="w-5 h-5 text-gray-500" />
                                        Risk Analysis
                                    </CardTitle>
                                    <CardDescription>Analyze the threat, vulnerability, and inherent risk.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Threat Scenario</Label>
                                            <SearchableSelect
                                                items={(threatsData || []).map(t => ({ label: t.name, value: t.id, description: t.description || undefined }))}
                                                value={formData.threatId}
                                                onChange={(val) => {
                                                    const t = threatsData?.find(x => x.id === val);
                                                    setFormData({ ...formData, threatId: val as number | undefined, threatDescription: t?.name || '' });
                                                }}
                                                onCreate={handleCreateThreat}
                                                placeholder="Select or create a threat..."
                                                searchPlaceholder="Search threats..."
                                            />
                                            <Textarea
                                                placeholder="Additional details about the threat event..."
                                                value={formData.threatDescription}
                                                onChange={(e) => setFormData({ ...formData, threatDescription: e.target.value })}
                                                className="min-h-[60px] text-sm text-muted-foreground"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Vulnerability</Label>
                                            <SearchableSelect
                                                items={(vulnerabilitiesData || []).map(v => ({ label: v.name, value: v.id, description: v.description || undefined }))}
                                                value={formData.vulnerabilityId}
                                                onChange={(val) => {
                                                    const v = vulnerabilitiesData?.find(x => x.id === val);
                                                    setFormData({ ...formData, vulnerabilityId: val as number | undefined, vulnerabilityDescription: v?.name || '' });
                                                }}
                                                onCreate={handleCreateVulnerability}
                                                placeholder="Select or create a vulnerability..."
                                                searchPlaceholder="Search vulnerabilities..."
                                            />
                                            <Textarea
                                                placeholder="Additional details about the vulnerability..."
                                                value={formData.vulnerabilityDescription}
                                                onChange={(e) => setFormData({ ...formData, vulnerabilityDescription: e.target.value })}
                                                className="min-h-[60px] text-sm text-muted-foreground"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Slot
                                            name={SlotNames.RISK_AUTO_TRIAGE}
                                            props={{
                                                clientId: parseInt(clientId?.toString() || "0"),
                                                threatDescription: formData.threatDescription,
                                                vulnerabilityDescription: formData.vulnerabilityDescription,
                                                affectedAssets: formData.affectedAssets,
                                                onAnalysisComplete: (data: any) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        likelihood: data.likelihood,
                                                        impact: data.impact,
                                                        inherentRisk: data.inherentRisk
                                                    }));
                                                }
                                            }}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label>Likelihood</Label>
                                            <Select onValueChange={(val) => setFormData({ ...formData, likelihood: val })} value={formData.likelihood}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'].map(x => (
                                                        <SelectItem key={x} value={x}>{x}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Impact</Label>
                                            <Select onValueChange={(val) => setFormData({ ...formData, impact: val })} value={formData.impact}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {['Low', 'Medium', 'High', 'Very High'].map(x => (
                                                        <SelectItem key={x} value={x}>{x}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-blue-700">Inherent Risk (Pre-Control)</Label>
                                            <Select onValueChange={(val) => setFormData({ ...formData, inherentRisk: val as RiskLevel })} value={formData.inherentRisk}>
                                                <SelectTrigger className="bg-blue-50/50 border-blue-200"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {['Low', 'Medium', 'High', 'Very High'].map(x => (
                                                        <SelectItem key={x} value={x}>{x}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Controls Section */}
                        <TabsContent value="controls" className="mt-0 focus-visible:ring-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-gray-500" />
                                        Existing Controls & Residual Risk
                                    </CardTitle>
                                    <CardDescription>Evaluate current controls and calculate residual risk.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex gap-3 text-sm text-blue-900">
                                        <Shield className="w-5 h-5 text-[#1C4D8D] shrink-0" />
                                        <div>
                                            <span className="font-semibold block mb-1">Active Defenses (Current State)</span>
                                            Select controls that are <strong>currently active</strong>. These give you immediate credit and lower your <em>Residual Risk</em> score now.
                                        </div>
                                    </div>
                                    <Slot
                                        name={SlotNames.RISK_CONTROL_SUGGESTION}
                                        props={{
                                            clientId: parseInt(clientId?.toString() || "0"),
                                            threat: formData.threatDescription || "",
                                            vulnerability: formData.vulnerabilityDescription || "",
                                            selectedControlIds: formData.controlIds,
                                            onAddControl: (id: number) => {
                                                if (!formData.controlIds.includes(id)) {
                                                    toggleControl(id);
                                                }
                                            }
                                        }}
                                    />
                                    <div className="space-y-2">
                                        <Label>Applicable Controls</Label>
                                        <div className="border rounded-md p-4 max-h-60 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-50/50">
                                            {controls?.map((item: any) => {
                                                const { clientControl, control } = item;
                                                const isSelected = formData.controlIds.includes(clientControl.id);
                                                return (
                                                    <div
                                                        key={clientControl.id}
                                                        className={`flex items-start gap-3 p-2.5 rounded text-sm cursor-pointer border transition-colors ${isSelected ? 'bg-white border-blue-500 shadow-sm' : 'border-transparent hover:bg-white hover:border-slate-200'
                                                            }`}
                                                        onClick={() => toggleControl(clientControl.id)}
                                                    >
                                                        <div className={`mt-0.5 w-4 h-4 border rounded flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                                            }`}>
                                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold block text-slate-700">{control?.controlId || clientControl.controlId}</span>
                                                            <span className="text-slate-500 text-xs line-clamp-2">{control?.name || clientControl.customDescription}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {(!controls || controls.length === 0) && <p className="text-muted-foreground text-sm">No controls available in library.</p>}
                                        </div>
                                    </div>

                                    <GapAnalysis
                                        clientId={parseInt(clientId!)}
                                        threat={formData.threatDescription || ""}
                                        vulnerability={formData.vulnerabilityDescription || ""}
                                        onControlAdopted={() => {
                                            // Refresh control list? In a real app we'd invalidate query
                                            // But since we use useQuery hook in parent, simpler to just let user refresh or optimistic update
                                            // Actually trpc.useContext().clientControls.list.invalidate() would benefit here
                                            window.location.reload(); // Brute force refresh for now to see new control
                                        }}
                                    />

                                    <Separator />

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label>Control Effectiveness</Label>
                                            <Select onValueChange={(val) => setFormData({ ...formData, controlEffectiveness: val as ControlEffectiveness })} value={formData.controlEffectiveness}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Effective">Effective</SelectItem>
                                                    <SelectItem value="Partially Effective">Partially Effective</SelectItem>
                                                    <SelectItem value="Ineffective">Ineffective</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-violet-700 font-semibold">Residual Risk (Post-Control)</Label>
                                                {!isResidualRiskManual && (
                                                    <Badge variant="outline" className="text-[10px] font-normal gap-1 bg-violet-50 text-violet-700 border-violet-200">
                                                        Auto-calculated
                                                    </Badge>
                                                )}
                                            </div>
                                            <Select
                                                onValueChange={(val) => {
                                                    setFormData({ ...formData, residualRisk: val as RiskLevel });
                                                    setIsResidualRiskManual(true);
                                                }}
                                                value={formData.residualRisk}
                                            >
                                                <SelectTrigger className="bg-violet-50/50 border-violet-200 font-medium">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['Low', 'Medium', 'High', 'Very High'].map(x => (
                                                        <SelectItem key={x} value={x}>{x}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {isResidualRiskManual && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsResidualRiskManual(false)}
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    Reset to auto-calculate
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Target Risk Level</Label>
                                            <Select onValueChange={(val) => setFormData({ ...formData, targetResidualRisk: val })} value={formData.targetResidualRisk}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {['Low', 'Medium', 'High'].map(x => (
                                                        <SelectItem key={x} value={x}>{x}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Treatment Plan Section */}
                        <TabsContent value="treatment" className="mt-0 focus-visible:ring-0">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Risk Treatment</CardTitle>
                                        <CardDescription>Decide how to respond to the residual risk.</CardDescription>
                                    </div>
                                    {assessmentId && !showTreatmentForm && (
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setSelectedTreatment(null);
                                                setShowTreatmentForm(true);
                                            }}
                                            className="gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Treatment
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex gap-3 text-sm text-amber-900">
                                        <Calendar className="w-5 h-5 text-amber-600 shrink-0" />
                                        <div>
                                            <span className="font-semibold block mb-1">What is a Treatment Plan?</span>
                                            Treatment Plans are <strong>future actions</strong> or projects. Use this if your Residual Risk is still too high after applying existing controls.
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Treatment Decision</Label>
                                            <Select onValueChange={(val) => setFormData({ ...formData, treatmentOption: val })} value={formData.treatmentOption}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                                                <SelectTrigger><SelectValue placeholder="Select Owner" /></SelectTrigger>
                                                <SelectContent>
                                                    {users?.map(u => (
                                                        <SelectItem key={u.id} value={u.name || u.email}>{u.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Recommended Actions</Label>
                                        <Textarea
                                            value={formData.recommendedActions}
                                            onChange={(e) => setFormData({ ...formData, recommendedActions: e.target.value })}
                                            placeholder="Summary of actions required..."
                                        />
                                    </div>

                                    {!assessmentId ? (
                                        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800 flex gap-2">
                                            <div className="shrink-0">⚠️</div>
                                            <p>You must save the risk assessment first before adding detailed treatment plans.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 pt-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Active Treatment Plans</h3>
                                            </div>

                                            {showTreatmentForm ? (
                                                <div className="mt-4">
                                                    <RiskTreatmentForm
                                                        clientId={clientId}
                                                        riskAssessmentId={assessmentId}
                                                        onSuccess={() => {
                                                            refetchTreatments();
                                                            setShowTreatmentForm(false);
                                                            setSelectedTreatment(null);
                                                        }}
                                                        onCancel={() => {
                                                            setShowTreatmentForm(false);
                                                            setSelectedTreatment(null);
                                                        }}
                                                        initialData={selectedTreatment}
                                                        riskContext={{
                                                            threat: formData.threatDescription || '',
                                                            vulnerability: formData.vulnerabilityDescription || '',
                                                            riskDetails: `Impact: ${formData.impact}, Likelihood: ${formData.likelihood}, Risk: ${formData.inherentRisk}`
                                                        }}
                                                    />
                                                </div>
                                            ) : treatments && treatments.length > 0 ? (
                                                <div className="grid gap-4">
                                                    {treatments.map((treatment) => (
                                                        <RiskTreatmentCard
                                                            key={treatment.id}
                                                            treatment={treatment}
                                                            onEdit={(t) => { setSelectedTreatment(t); setShowTreatmentForm(true); }}
                                                            onDelete={handleDeleteTreatment}
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                                    <p className="text-sm text-muted-foreground italic mb-3">No treatment plans added yet.</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedTreatment(null);
                                                            setShowTreatmentForm(true);
                                                        }}
                                                        className="gap-2"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Create First Treatment
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
