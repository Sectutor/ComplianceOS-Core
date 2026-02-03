import React, { useState, useMemo } from 'react';
import { EnhancedDialog } from '@complianceos/ui/ui/enhanced-dialog';
import { Button } from '@complianceos/ui/ui/button';
import { Label } from '@complianceos/ui/ui/label';
import { RadioGroup, RadioGroupItem } from '@complianceos/ui/ui/radio-group';
import { Input } from '@complianceos/ui/ui/input';
import { Textarea } from '@complianceos/ui/ui/textarea';
import { Slider } from '@complianceos/ui/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { Checkbox } from '@complianceos/ui/ui/checkbox';
import { ScrollArea } from '@complianceos/ui/ui/scroll-area';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Slot, SlotNames } from "@/registry";
import { Check, Link as LinkIcon, AlertTriangle, Shield, Building, Layers, ArrowRight, Wand2, Sparkles, Loader2, Info } from 'lucide-react';
import { calculateResidualScore, getRiskLevelColor, scoreToRiskLevel, getMatrixScoreLevel, getRiskLevelTextColor } from '@/lib/riskCalculations';
import { RiskAppetiteCheck } from '@/components/risk/RiskAppetiteCheck';

type WizardStep = 'method' | 'scope' | 'analysis' | 'treatment';

interface RiskAssessmentWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: number;
    onSuccess: () => void;
    initialData?: any;
}

export function RiskAssessmentWizard({ open, onOpenChange, clientId, onSuccess, initialData }: RiskAssessmentWizardProps) {
    const [step, setStep] = useState<WizardStep>('method');
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        assessmentType: 'asset',
        assetId: undefined as number | undefined,
        processId: '',
        vendorId: undefined as number | undefined,
        title: '',
        description: '',
        threatCategory: '',
        vulnerability: '',
        threatIds: [] as number[],
        vulnerabilityIds: [] as number[],
        likelihood: 1,
        impact: 1,
        treatmentStrategy: 'mitigate',
        selectedControlIds: [] as number[],
        riskOwner: '',
        priority: 'Medium',
    });

    // Mutations
    const upsertRiskMutation = trpc.risks.upsert.useMutation();
    const linkControlMutation = trpc.risks.linkControl.useMutation();
    const suggestControlsMutation = trpc.risks.suggestControls.useMutation();

    // AI Suggestion State
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
    const [suggestLoading, setSuggestLoading] = useState(false);

    // Queries
    const { data: assets } = trpc.risks.getAssets.useQuery({ clientId }, { enabled: open && step === 'scope' }); // Legacy? Might need new router
    const { data: threats } = trpc.risks.getThreats.useQuery({ clientId }, { enabled: open && step === 'scope' }); // Legacy?
    const { data: vulnerabilities } = trpc.risks.getVulnerabilities.useQuery({ clientId }, { enabled: open && step === 'scope' }); // Legacy?
    const { data: controls } = trpc.clientControls.list.useQuery({ clientId }, { enabled: open && step === 'treatment' });

    // Computed
    const inherentScore = formData.likelihood * formData.impact;

    const residualScore = useMemo(() => {
        // Simple simulation: each control reduces risk by a factor (e.g. 20% or flat 1 point)
        // For MPV, let's say each control reduces inherent score by 20% capped at 80% reduction
        if (formData.treatmentStrategy !== 'mitigate') return inherentScore;

        const controlCount = formData.selectedControlIds.length;
        if (controlCount === 0) return inherentScore;

        const reductionFactor = Math.min(controlCount * 0.2, 0.8);
        const reduced = Math.max(1, Math.round(inherentScore * (1 - reductionFactor)));
        return reduced;
    }, [inherentScore, formData.selectedControlIds, formData.treatmentStrategy]);



    // Helper to parse risk values (handles numbers, strings "3", and text "High")
    const parseRiskValue = (val: any): number => {
        if (!val) return 1;
        if (typeof val === 'number') return val;
        const str = String(val).toLowerCase();
        const num = parseInt(str);
        if (!isNaN(num)) return num;

        if (str.includes('critical') || str.includes('extreme')) return 5;
        if (str.includes('very high')) return 4;
        if (str.includes('high')) return 3;
        if (str.includes('medium')) return 2;
        return 1;
    };

    React.useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    assessmentType: initialData.contextSnapshot?.assessmentType || initialData.assessmentType || 'asset',
                    assetId: initialData.contextSnapshot?.assetId || initialData.assetId,
                    processId: initialData.contextSnapshot?.processId || initialData.processId || '',
                    vendorId: initialData.contextSnapshot?.vendorId || initialData.vendorId,
                    title: initialData.title || '',
                    description: initialData.contextSnapshot?.description || initialData.description || '',
                    threatCategory: initialData.contextSnapshot?.threatCategory || initialData.threatCategory || '',
                    vulnerability: initialData.contextSnapshot?.vulnerability || initialData.vulnerability || '',
                    threatIds: initialData.contextSnapshot?.threatIds || initialData.threatIds || (initialData.threatId ? [initialData.threatId] : []),
                    vulnerabilityIds: initialData.contextSnapshot?.vulnerabilityIds || initialData.vulnerabilityIds || (initialData.vulnerabilityId ? [initialData.vulnerabilityId] : []),
                    likelihood: parseRiskValue(initialData.likelihood),
                    impact: parseRiskValue(initialData.impact),
                    treatmentStrategy: initialData.treatmentStrategy || 'mitigate',
                    selectedControlIds: initialData.contextSnapshot?.controlIds || initialData.controlIds || [],
                    riskOwner: initialData.riskOwner || '',
                    priority: initialData.priority || 'Medium',
                });
            } else {
                setFormData({
                    assessmentType: 'asset',
                    assetId: undefined,
                    processId: '',
                    vendorId: undefined,
                    title: '',
                    description: '',
                    threatCategory: '',
                    vulnerability: '',
                    threatIds: [],
                    vulnerabilityIds: [],
                    likelihood: 1,
                    impact: 1,
                    treatmentStrategy: 'mitigate',
                    selectedControlIds: [],
                    riskOwner: '',
                    priority: 'Medium'
                });
                setStep('method');
            }
        }
    }, [open, initialData]);

    const handleNext = () => {
        if (step === 'method') setStep('scope');
        else if (step === 'scope') setStep('analysis');
        else if (step === 'analysis') setStep('treatment');
    };

    const handleBack = () => {
        if (step === 'treatment') setStep('analysis');
        else if (step === 'analysis') setStep('scope');
        else if (step === 'scope') setStep('method');
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // 1. Upsert Risk Assessment
            const risk = await upsertRiskMutation.mutateAsync({
                id: initialData?.id,
                clientId,
                title: formData.title,
                likelihood: formData.likelihood,
                impact: formData.impact,
                status: 'draft',
                // New Fields
                riskOwner: formData.riskOwner,
                treatmentOption: formData.treatmentStrategy,
                priority: formData.priority,
                residualScore: residualScore,
                residualRisk: getMatrixScoreLevel(residualScore),
                threatDescription: formData.description, // Save description to threatDescription column
                contextSnapshot: {
                    assessmentType: formData.assessmentType,
                    assetId: formData.assetId,
                    processId: formData.processId,
                    vendorId: formData.vendorId,
                    description: formData.description,
                    threatCategory: formData.threatCategory,
                    vulnerability: formData.vulnerability,
                    threatIds: formData.threatIds,
                    vulnerabilityIds: formData.vulnerabilityIds,
                    controlIds: formData.selectedControlIds, // Persist selected controls
                    // Include new fields in snapshot too for redundancy/ease
                    riskOwner: formData.riskOwner,
                    treatmentStrategy: formData.treatmentStrategy,
                    priority: formData.priority,
                    residualScore: residualScore,
                    residualRisk: getMatrixScoreLevel(residualScore)
                }
            });

            // 2. Link Controls if Mitigate strategy and controls selected
            if (formData.treatmentStrategy === 'mitigate' && formData.selectedControlIds.length > 0) {
                // Loop for now, ideal to have bulk link endpoint
                for (const cid of formData.selectedControlIds) {
                    // We need a treatment ID. The upsert currently just creates assessment.
                    // IMPORTANT: The treatment model structure implies we need to create a treatment entry first?
                    // For this MVP step, we might be skipping explicit treatment creation in the Wizard and just linking control to assessment?
                    // Re-reading schema: `treatment_controls` links `treatmentId` and `controlId`.
                    // `riskTreatments` links to `riskAssessmentId`.

                    // We need to create a treatment record first. 
                    // Since `upsert` in `risks` router was simplified, let's assume valid flow:
                    // We should add `treatments` handling to `upsert` or make a separate call.
                    // For now, let's just complete the Assessment creation. Full treatment logic might need `riskTreatments` creation.

                    // Simplification: We just save the assessment. Linking controls requires a treatment record which we haven't created here.
                    // TODO: Post-MVP, create `risk_treatment` record then link controls.
                }
            }

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Failed to save risk assessment", error);
            toast.error("Failed to save risk", { description: error.message || "An unexpected error occurred." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <EnhancedDialog
            open={open}
            onOpenChange={onOpenChange}
            title={
                <div>
                    <div className="mb-2">{initialData ? 'Edit Risk Assessment' : 'New Risk Assessment'}</div>
                    <div className="flex gap-2 mt-2">
                        {['Method', 'Scope & ID', 'Analysis', 'Treatment'].map((label, i) => (
                            <div
                                key={label}
                                onClick={() => setStep(['method', 'scope', 'analysis', 'treatment'][i] as WizardStep)}
                                className={`text-xs font-medium px-2 py-1 rounded cursor-pointer transition-colors ${(['method', 'scope', 'analysis', 'treatment'].indexOf(step) === i)
                                    ? 'bg-blue-100 text-blue-700'
                                    : (['method', 'scope', 'analysis', 'treatment'].indexOf(step) > i ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600')
                                    }`}
                            >
                                {i + 1}. {label}
                            </div>
                        ))}
                    </div>
                </div>
            }
            description="Follow the steps to assess and treat a risk scenario."
            size="lg"
            footer={
                <div className="flex w-full justify-between">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <div className="flex gap-2">
                        {step !== 'method' && (
                            <Button variant="outline" onClick={handleBack} className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800">Back</Button>
                        )}
                        {step !== 'treatment' ? (
                            <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white">Next <ArrowRight className="w-4 h-4 ml-2" /></Button>
                        ) : (
                            <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {loading ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update Risk' : 'Create Risk')}
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            <div className="py-2 min-h-[300px]">
                {step === 'method' && (
                    <div className="grid grid-cols-2 gap-4">
                        <MethodCard icon={Shield} title="Asset-Based" description="Assess specific assets." selected={formData.assessmentType === 'asset'} onClick={() => setFormData({ ...formData, assessmentType: 'asset' })} />
                        <MethodCard icon={AlertTriangle} title="Scenario-Based" description="Assess threat scenarios." selected={formData.assessmentType === 'scenario'} onClick={() => setFormData({ ...formData, assessmentType: 'scenario' })} />
                        <MethodCard icon={Layers} title="Process-Based" description="Assess business processes." selected={formData.assessmentType === 'process'} onClick={() => setFormData({ ...formData, assessmentType: 'process' })} />
                        <MethodCard icon={Building} title="Vendor-Based" description="Assess third-party vendors." selected={formData.assessmentType === 'vendor'} onClick={() => setFormData({ ...formData, assessmentType: 'vendor' })} />
                    </div>
                )}

                {step === 'scope' && (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <Label className="text-base">1. Define Scope ({formData.assessmentType})</Label>
                            <div className="space-y-2">
                                <Label>Title *</Label>
                                <Input placeholder="Risk Title (e.g. Data Breach)" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            {/* Simplified Scope Selection */}
                        </div>
                        <div className="space-y-4">
                            <Label className="text-base">2. Risk Context</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Threats ({formData.threatIds.length} selected)</Label>
                                    <ScrollArea className="h-[150px] border rounded-md p-2">
                                        <div className="space-y-1">
                                            {threats && threats.length > 0 ? threats.map((t: any) => (
                                                <div key={t.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded text-sm">
                                                    <Checkbox
                                                        checked={formData.threatIds.includes(t.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) setFormData({ ...formData, threatIds: [...formData.threatIds, t.id] });
                                                            else setFormData({ ...formData, threatIds: formData.threatIds.filter(id => id !== t.id) });
                                                        }}
                                                    />
                                                    <span className="truncate">{t.name}</span>
                                                </div>
                                            )) : <div className="text-sm text-gray-400 p-2">No threats found. Add threats first.</div>}
                                        </div>
                                    </ScrollArea>
                                </div>
                                <div className="space-y-2">
                                    <Label>Vulnerabilities ({formData.vulnerabilityIds.length} selected)</Label>
                                    <ScrollArea className="h-[150px] border rounded-md p-2">
                                        <div className="space-y-1">
                                            {vulnerabilities && vulnerabilities.length > 0 ? vulnerabilities.map((v: any) => (
                                                <div key={v.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded text-sm">
                                                    <Checkbox
                                                        checked={formData.vulnerabilityIds.includes(v.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) setFormData({ ...formData, vulnerabilityIds: [...formData.vulnerabilityIds, v.id] });
                                                            else setFormData({ ...formData, vulnerabilityIds: formData.vulnerabilityIds.filter(id => id !== v.id) });
                                                        }}
                                                    />
                                                    <span className="truncate">{v.name}</span>
                                                </div>
                                            )) : <div className="text-sm text-gray-400 p-2">No vulnerabilities found. Add vulnerabilities first.</div>}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                            <Textarea placeholder="Description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                    </div>
                )}

                {step === 'analysis' && (
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
                            <div className="flex items-start gap-3">
                                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                                <div className="text-[11px] space-y-1">
                                    <h4 className="font-semibold text-slate-900">Risk Calculation Methodology</h4>
                                    <p className="text-slate-600 leading-relaxed">
                                        Scores are calculated using a 5x5 matrix: <br />
                                        <span className="font-mono bg-slate-200 px-1 py-0.5 rounded text-[10px]">Likelihood (1-5) × Impact (1-5) = Risk Score</span>
                                    </p>
                                    <div className="grid grid-cols-2 gap-x-2 text-[10px] text-slate-500 font-medium pt-1">
                                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-800" /> 20-25: Critical</div>
                                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-600" /> 15-19: Very High</div>
                                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> 8-14: High</div>
                                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 4-7: Medium</div>
                                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> 1-3: Low</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-violet-50/50 p-4 rounded-lg border border-violet-100">
                                <div className="space-y-1">
                                    <Label className="text-violet-900 font-bold">Inherent Risk Scoring</Label>
                                    <p className="text-[10px] text-violet-700">Use AI to analyze the threat/vulnerability and suggest scores.</p>
                                </div>
                                <Slot
                                    name={SlotNames.RISK_AUTO_TRIAGE}
                                    props={{
                                        clientId,
                                        threatDescription: formData.description || '',
                                        vulnerabilityDescription: formData.vulnerability || '',
                                        affectedAssets: formData.assets,
                                        onAnalysisComplete: (data: any) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                likelihood: parseInt(data.likelihood),
                                                impact: parseInt(data.impact),
                                                notes: (prev.notes || '') + `\n\n[AI Triage]: ${data.reasoning}`
                                            }));
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex justify-between mt-4">
                                <Label>Likelihood ({formData.likelihood})</Label>
                            </div>
                            <Slider value={[formData.likelihood]} onValueChange={([val]) => setFormData({ ...formData, likelihood: val })} max={5} min={1} step={1} className="py-4" rangeClassName="bg-blue-700" />
                        </div>
                        <div className="space-y-4">
                            <Label>Priority</Label>
                            <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Critical">Critical</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <Label>Impact ({formData.impact})</Label>
                            </div>
                            <Slider value={[formData.impact]} onValueChange={([val]) => setFormData({ ...formData, impact: val })} max={5} min={1} step={1} className="py-4" rangeClassName="bg-blue-700" />
                        </div>
                        <div className="bg-gray-50 p-6 rounded-xl flex items-center justify-between border border-gray-200">
                            <div>
                                <h4 className="font-medium text-gray-900">Inherent Score</h4>
                                <p className="text-sm text-gray-500">Before Controls</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`text-3xl font-bold ${getRiskLevelTextColor(getMatrixScoreLevel(inherentScore))}`}>{inherentScore}</div>
                                <RiskBadge score={inherentScore} />
                            </div>
                        </div>
                    </div>
                )}

                {step === 'treatment' && (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <Label>Risk Owner</Label>
                            <Input
                                placeholder="Enter Risk Owner Name or Email"
                                value={formData.riskOwner}
                                onChange={(e) => setFormData({ ...formData, riskOwner: e.target.value })}
                            />
                        </div>
                        <div className="space-y-4">
                            <Label>Strategy</Label>
                            <RadioGroup value={formData.treatmentStrategy} onValueChange={(val) => setFormData({ ...formData, treatmentStrategy: val })} className="grid grid-cols-4 gap-2">
                                {['mitigate', 'accept', 'transfer', 'avoid'].map(s => (
                                    <div key={s} className={`border rounded p-3 cursor-pointer ${formData.treatmentStrategy === s ? 'border-blue-500 bg-blue-50' : ''}`}>
                                        <RadioGroupItem value={s} id={s} className="sr-only" />
                                        <Label htmlFor={s} className="capitalize cursor-pointer">{s}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        {formData.treatmentStrategy === 'mitigate' && (
                            <div className="space-y-4 border-t pt-4">
                                <div className="flex justify-between items-center">
                                    <Label>Select Controls to Mitigate Risk</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">{formData.selectedControlIds.length} selected</span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={suggestLoading || !formData.description}
                                            onClick={async () => {
                                                setSuggestLoading(true);
                                                setAiSuggestions([]);
                                                try {
                                                    const result = await suggestControlsMutation.mutateAsync({
                                                        clientId,
                                                        threat: formData.threatCategory || formData.description || 'Unknown threat',
                                                        vulnerability: formData.vulnerability || formData.description || 'Unknown vulnerability'
                                                    });
                                                    setAiSuggestions(result.suggestions || []);
                                                } catch (e) {
                                                    console.error('AI suggestion failed', e);
                                                }
                                                setSuggestLoading(false);
                                            }}
                                        >
                                            {suggestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                            <span className="ml-1">AI Suggest</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* AI Suggestions Panel */}
                                {aiSuggestions.length > 0 && (
                                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 rounded-lg p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                                <Sparkles className="w-4 h-4" /> AI Recommendations
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => {
                                                    const newIds = aiSuggestions
                                                        .map(s => s.clientControlId)
                                                        .filter((id: number) => !formData.selectedControlIds.includes(id));
                                                    setFormData({ ...formData, selectedControlIds: [...formData.selectedControlIds, ...newIds] });
                                                }}
                                            >
                                                <Check className="w-3 h-3 mr-1" /> Apply All
                                            </Button>
                                        </div>
                                        <div className="space-y-1">
                                            {aiSuggestions.map((s: any) => (
                                                <div key={s.clientControlId} className={`text-xs p-2 rounded flex justify-between items-start cursor-pointer transition-colors ${formData.selectedControlIds.includes(s.clientControlId)
                                                    ? 'bg-purple-200 dark:bg-purple-800'
                                                    : 'bg-white dark:bg-gray-800 hover:bg-purple-100'
                                                    }`}
                                                    onClick={() => {
                                                        if (!formData.selectedControlIds.includes(s.clientControlId)) {
                                                            setFormData({ ...formData, selectedControlIds: [...formData.selectedControlIds, s.clientControlId] });
                                                        }
                                                    }}
                                                >
                                                    <div>
                                                        <div className="font-medium">{s.details?.control?.name || s.details?.clientControl?.customDescription || `Control #${s.clientControlId}`}</div>
                                                        <div className="text-gray-500">{s.reasoning}</div>
                                                    </div>
                                                    <span className="text-purple-600 font-bold ml-2">{s.relevance}/10</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <ScrollArea className="h-[300px] border rounded-md p-2 bg-white">
                                    <div className="space-y-2">
                                        {(controls as any)?.map?.((c: any) => {
                                            const controlId = c.clientControl?.id || c.id;
                                            const isSelected = formData.selectedControlIds.includes(controlId);
                                            return (
                                                <div
                                                    key={controlId}
                                                    className={`flex items-start gap-3 p-3 rounded border transition-all cursor-pointer ${isSelected
                                                        ? 'bg-white border-black shadow-sm'
                                                        : 'bg-white border-gray-200 hover:border-gray-400'
                                                        }`}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setFormData({ ...formData, selectedControlIds: formData.selectedControlIds.filter(id => id !== controlId) });
                                                        } else {
                                                            setFormData({ ...formData, selectedControlIds: [...formData.selectedControlIds, controlId] });
                                                        }
                                                    }}
                                                >
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => { /* Handled by parent onClick */ }}
                                                        className="mt-1 data-[state=checked]:bg-black data-[state=checked]:text-white data-[state=checked]:border-black"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="text-sm font-semibold text-black">
                                                            {c.control?.controlId || c.refCode} - {c.control?.name || c.name || 'Unknown Control'}
                                                        </div>
                                                        <div className="text-sm mt-0.5 text-black">
                                                            {c.control?.description || c.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }) || <div className="text-sm text-gray-400 p-2">No controls found.</div>}
                                    </div>
                                </ScrollArea>

                                <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between shadow-sm">
                                    <div>
                                        <h4 className="font-medium text-black">Residual Score</h4>
                                        <p className="text-xs text-gray-500">Projected after controls</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`text-2xl font-bold ${getRiskLevelTextColor(getMatrixScoreLevel(residualScore))}`}>{residualScore}</div>
                                        <RiskBadge score={residualScore} />
                                    </div>
                                </div>

                                {/* Appetite Check */}
                                <RiskAppetiteCheck
                                    inherentScore={inherentScore}
                                    residualScore={residualScore}
                                    appetiteThreshold={10}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </EnhancedDialog>
    );
}

function MethodCard({ icon: Icon, title, description, selected, onClick }: any) {
    return (
        <div onClick={onClick} className={`p-4 border rounded-xl cursor-pointer transition-all ${selected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
            <Icon className={`w-6 h-6 mb-2 ${selected ? 'text-blue-600' : 'text-gray-500'}`} />
            <h3 className="font-semibold">{title}</h3>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
    );
}

function RiskBadge({ score }: { score: number }) {
    const level = getMatrixScoreLevel(score);
    const color = getRiskLevelColor(level);
    return <span className={`px-2 py-1 rounded text-xs font-bold ${color}`}>{level}</span>;
}

