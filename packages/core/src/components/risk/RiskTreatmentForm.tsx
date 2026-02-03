import React, { useState, useEffect } from 'react';
import { Button } from '@complianceos/ui/ui/button';
import { Label } from '@complianceos/ui/ui/label';
import { Input } from '@complianceos/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { Textarea } from '@complianceos/ui/ui/textarea';
import { trpc } from '@/lib/trpc';
import { Shield, Loader2, Check, X, Plus, CheckCircle, AlertTriangle, Ban, Sparkles, Lightbulb, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@complianceos/ui/ui/badge';

interface RiskTreatmentFormProps {
    clientId: number;
    riskAssessmentId: number;
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: any;
    riskContext?: {
        threat: string;
        vulnerability: string;
        riskDetails?: string;
    };
}

export function RiskTreatmentForm({
    clientId,
    riskAssessmentId,
    onSuccess,
    onCancel,
    initialData,
    riskContext
}: RiskTreatmentFormProps) {
    const utils = trpc.useUtils();
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        treatmentType: 'mitigate' as 'mitigate' | 'transfer' | 'accept' | 'avoid',
        strategy: '',
        justification: '',
        owner: '',
        dueDate: '',
        priority: 'medium' as 'critical' | 'high' | 'medium' | 'low',
        estimatedCost: '',
        // Store selected controls with their configuration
        selectedControls: {} as Record<number, { effectiveness: string; implementationNotes: string }>,
    });

    // Custom Control Creation State
    const [showCreateControl, setShowCreateControl] = useState(false);
    const [newControlData, setNewControlData] = useState({ name: '', description: '', code: '' });

    const { data: controls } = trpc.clientControls.list.useQuery({ clientId });

    // Standard Control Browser State
    const [browseMode, setBrowseMode] = useState<'client' | 'standard'>('client');
    const [selectedFramework, setSelectedFramework] = useState<string>('ISO 27001');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Fetch standard controls
    const { data: standardControls } = trpc.controls.list.useQuery(
        { framework: selectedFramework },
        { enabled: browseMode === 'standard' }
    );

    // Get unique categories from standard controls
    const categories = React.useMemo(() => {
        if (!standardControls) return [];
        const cats = new Set(standardControls.map(c => c.category).filter(Boolean));
        return Array.from(cats) as string[];
    }, [standardControls]);

    const filteredStandardControls = React.useMemo(() => {
        if (!standardControls) return [];
        if (selectedCategory === 'all') return standardControls;
        return standardControls.filter(c => c.category === selectedCategory);
    }, [standardControls, selectedCategory]);

    const createMutation = trpc.risks.createRiskTreatment.useMutation();
    const updateMutation = trpc.risks.updateRiskTreatment.useMutation();
    const linkControlMutation = trpc.risks.linkTreatmentControl.useMutation();

    useEffect(() => {
        if (initialData) {
            // Transform array of linked controls into record
            const controlMap: Record<number, { effectiveness: string; implementationNotes: string }> = {};
            if (initialData.linkedControls) {
                initialData.linkedControls.forEach((lc: any) => {
                    controlMap[lc.controlId] = {
                        effectiveness: lc.effectiveness || 'effective',
                        implementationNotes: lc.implementationNotes || '',
                    };
                });
            }

            setFormData({
                treatmentType: initialData.treatmentType || 'mitigate',
                strategy: initialData.strategy || '',
                justification: initialData.justification || '',
                owner: initialData.owner || '',
                dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
                priority: initialData.priority || 'medium',
                estimatedCost: initialData.estimatedCost || '',
                selectedControls: controlMap,
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let treatmentId: number;

            if (initialData?.id) {
                // Update existing treatment
                await updateMutation.mutateAsync({
                    id: initialData.id,
                    strategy: formData.strategy || undefined,
                    justification: formData.justification || undefined,
                    owner: formData.owner || undefined,
                    dueDate: formData.dueDate || undefined,
                    priority: formData.priority || undefined,
                    estimatedCost: formData.estimatedCost || undefined,
                });
                treatmentId = initialData.id;
                toast.success('Treatment plan updated successfully');
            } else {
                // Create new treatment
                const newTreatment = await createMutation.mutateAsync({
                    clientId,
                    riskAssessmentId,
                    treatmentType: formData.treatmentType,
                    strategy: formData.strategy || undefined,
                    justification: formData.justification || undefined,
                    owner: formData.owner || undefined,
                    dueDate: formData.dueDate || undefined,
                    priority: formData.priority || undefined,
                    estimatedCost: formData.estimatedCost || undefined,
                });
                treatmentId = newTreatment.id;
                toast.success('Treatment plan created successfully');
            }

            // Link selected controls with their configuration
            const controlIds = Object.keys(formData.selectedControls).map(Number);
            if (controlIds.length > 0 && treatmentId) {
                await Promise.all(
                    controlIds.map(controlId => {
                        const config = formData.selectedControls[controlId];
                        return linkControlMutation.mutateAsync({
                            treatmentId,
                            controlId,
                            effectiveness: config.effectiveness as any,
                            implementationNotes: config.implementationNotes,
                        });
                    })
                );
            }

            onSuccess();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save treatment plan');
        } finally {
            setLoading(false);
        }
    };

    const handleGetSuggestions = async () => {
        if (!riskContext?.threat || !riskContext?.vulnerability) {
            toast.error("Risk Threat and Vulnerability descriptions are required for AI suggestions.");
            return;
        }

        setLoadingSuggestions(true);
        setShowSuggestions(true);
        try {
            const results = await utils.risks.getSuggestedControls.fetch({
                threat: riskContext.threat,
                vulnerability: riskContext.vulnerability,
                riskDetails: riskContext.riskDetails
            });
            setSuggestions(results);
            if (results.length === 0) {
                toast.info("No specific controls suggested by AI.");
            }
        } catch (error) {
            console.error("Failed to get suggestions", error);
            toast.error("Failed to get AI suggestions");
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const treatmentTypes = [
        { value: 'mitigate', label: 'Mitigate', icon: Shield, color: 'text-blue-600', desc: 'Apply controls to reduce risk' },
        { value: 'transfer', label: 'Transfer', icon: AlertTriangle, color: 'text-orange-600', desc: 'Transfer risk' },
        { value: 'accept', label: 'Accept', icon: CheckCircle, color: 'text-green-600', desc: 'Formally accept the risk' },
        { value: 'avoid', label: 'Avoid', icon: Ban, color: 'text-red-600', desc: 'Eliminate the activity' },
    ];

    const toggleControl = (controlId: number) => {
        setFormData(prev => {
            const newControls = { ...prev.selectedControls };
            if (newControls[controlId]) {
                delete newControls[controlId];
            } else {
                newControls[controlId] = {
                    effectiveness: 'effective',
                    implementationNotes: ''
                };
            }
            return { ...prev, selectedControls: newControls };
        });
    };

    const createControlMutation = trpc.clientControls.createCustom.useMutation({
        onSuccess: (data) => {
            toast.success("Custom control created and applied");
            utils.clientControls.list.invalidate();
            // Add to selected controls
            toggleControl(data.clientControl.id);
            setShowCreateControl(false);
            setNewControlData({ name: '', description: '', code: '' });
        },
        onError: (err) => {
            toast.error(`Failed to create control: ${err.message}`);
        }
    });

    const handleCreateControl = () => {
        if (!newControlData.name) {
            toast.error("Control name is required");
            return;
        }
        createControlMutation.mutate({
            clientId,
            name: newControlData.name,
            description: newControlData.description,
            code: newControlData.code || undefined
        });
    };

    const updateControlConfig = (controlId: number, field: 'effectiveness' | 'implementationNotes', value: string) => {
        setFormData(prev => ({
            ...prev,
            selectedControls: {
                ...prev.selectedControls,
                [controlId]: {
                    ...prev.selectedControls[controlId],
                    [field]: value
                }
            }
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 border rounded-lg p-6 bg-card shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between pb-4 border-b mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    {initialData ? 'Edit Risk Treatment Plan' : 'Create Risk Treatment Plan'}
                </h3>
                <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Treatment Type Selection */}
            <div className="space-y-3">
                <Label>Treatment Type *</Label>
                <div className="grid grid-cols-2 gap-3">
                    {treatmentTypes.map(type => {
                        const Icon = type.icon;
                        const isSelected = formData.treatmentType === type.value;

                        return (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, treatmentType: type.value as any }))}
                                className={`p-4 rounded-lg border-2 transition-all text-left ${isSelected
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-border hover:border-blue-300 dark:hover:border-blue-700'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <Icon className={`w-5 h-5 mt-0.5 ${type.color}`} />
                                    <div className="flex-1">
                                        <div className="font-medium">{type.label}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{type.desc}</div>
                                    </div>
                                    {isSelected && <Check className="w-5 h-5 text-blue-600" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Strategy Description */}
            <div className="space-y-2">
                <Label htmlFor="strategy">Treatment Strategy *</Label>
                <Textarea
                    id="strategy"
                    value={formData.strategy}
                    onChange={(e) => setFormData(prev => ({ ...prev, strategy: e.target.value }))}
                    placeholder="Describe the specific actions to be taken..."
                    rows={3}
                    required
                />
            </div>

            {/* Justification (required for "Accept") */}
            {formData.treatmentType === 'accept' && (
                <div className="space-y-2">
                    <Label htmlFor="justification">Justification (Required for Accept) *</Label>
                    <Textarea
                        id="justification"
                        value={formData.justification}
                        onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
                        placeholder="Provide business justification for accepting this risk..."
                        rows={2}
                        required={formData.treatmentType === 'accept'}
                    />
                </div>
            )}

            {/* Control Selection (for "Mitigate") */}
            {formData.treatmentType === 'mitigate' && (
                <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex gap-3 text-sm text-amber-900 mb-4">
                        <Lightbulb className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                            <span className="font-semibold block mb-1">Planning Future Controls</span>
                            Controls selected here are <strong>NOT yet active</strong>. They will be added to your roadmap as "Planned" tasks to reduce risk in the future.
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Label>Select Controls to Apply</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleGetSuggestions}
                                className="h-8 gap-2 text-violet-600 border-violet-200 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-900/20"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                {loadingSuggestions ? 'Thinking...' : 'AI Suggestions'}
                            </Button>
                            <Button
                                type="button"
                                variant={browseMode === 'standard' ? "default" : "outline"}
                                size="sm"
                                onClick={() => setBrowseMode(browseMode === 'client' ? 'standard' : 'client')}
                                className="h-8 gap-2"
                            >
                                <Globe className="w-3.5 h-3.5" />
                                {browseMode === 'standard' ? 'Browsing Library' : 'Browse Library'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCreateControl(!showCreateControl)}
                                className="h-8 gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                New Custom
                            </Button>
                        </div>
                    </div>

                    {browseMode === 'standard' && (
                        <div className="bg-slate-50 dark:bg-slate-900/50 border rounded-lg p-3 mb-3 space-y-3">
                            <div className="flex gap-3">
                                <div className="w-1/2">
                                    <Label className="text-xs mb-1 block">Framework</Label>
                                    <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                                        <SelectTrigger className="h-8 text-xs bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ISO 27001">ISO 27001</SelectItem>
                                            <SelectItem value="SOC 2">SOC 2</SelectItem>
                                            <SelectItem value="NIST CSF">NIST CSF</SelectItem>
                                            <SelectItem value="GDPR">GDPR</SelectItem>
                                            <SelectItem value="HIPAA">HIPAA</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-1/2">
                                    <Label className="text-xs mb-1 block">Category / Domain</Label>
                                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                        <SelectTrigger className="h-8 text-xs bg-background">
                                            <SelectValue placeholder="All Categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {categories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="border rounded bg-background max-h-60 overflow-y-auto">
                                {filteredStandardControls.length > 0 ? (
                                    <div className="divide-y">
                                        {filteredStandardControls.map((sc: any) => {
                                            const existing = controls?.find(c => c.control?.controlId === sc.controlId);
                                            const clientControlId = existing?.clientControl?.id;
                                            const isSelected = clientControlId && formData.selectedControls[clientControlId];

                                            return (
                                                <div key={sc.id} className="p-2 hover:bg-slate-50 flex items-center justify-between group">
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs font-semibold text-slate-500">{sc.controlId}</span>
                                                            <span className="text-sm font-medium truncate">{sc.name}</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">{sc.description}</p>
                                                    </div>
                                                    {clientControlId ? (
                                                        <Button
                                                            type="button" size="sm" variant={isSelected ? "secondary" : "outline"} className="h-6 text-xs"
                                                            onClick={() => isSelected ? toggleControl(clientControlId) : toggleControl(clientControlId)}
                                                        >
                                                            {isSelected ? <Check className="w-3 h-3 mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                                                            {isSelected ? 'Selected' : 'Select'}
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            type="button" size="sm" variant="ghost" className="h-6 text-xs text-blue-600 hover:bg-blue-50"
                                                            disabled={createControlMutation.isLoading}
                                                            onClick={() => {
                                                                createControlMutation.mutate({
                                                                    clientId,
                                                                    name: sc.name,
                                                                    description: sc.description,
                                                                    framework: sc.framework,
                                                                    code: sc.controlId
                                                                });
                                                            }}
                                                        >
                                                            <Plus className="w-3 h-3 mr-1" />
                                                            Add to Library
                                                        </Button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-xs text-muted-foreground">No controls found matching filters</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Create Assignment Panel */}
                    {showCreateControl && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3 animate-in slide-in-from-top-2">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold flex items-center gap-2 text-blue-800 dark:text-blue-300">
                                    <Plus className="w-4 h-4" />
                                    Create Custom Control
                                </h4>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => setShowCreateControl(false)}
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-xs">Control Name *</Label>
                                    <Input
                                        className="h-8 text-sm bg-background"
                                        placeholder="e.g. Weekly Access Review"
                                        value={newControlData.name}
                                        onChange={(e) => setNewControlData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Description</Label>
                                    <Input
                                        className="h-8 text-sm bg-background"
                                        placeholder="What does this control do?"
                                        value={newControlData.description}
                                        onChange={(e) => setNewControlData(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Control Code (Optional)</Label>
                                    <Input
                                        className="h-8 text-sm bg-background"
                                        placeholder="e.g. AC-1-CUSTOM"
                                        value={newControlData.code}
                                        onChange={(e) => setNewControlData(prev => ({ ...prev, code: e.target.value }))}
                                    />
                                </div>
                                <div className="flex justify-end pt-1">
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleCreateControl}
                                        disabled={createControlMutation.isLoading}
                                    >
                                        {createControlMutation.isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                                        Create & Apply
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* AI Suggestions Panel */}
                    {showSuggestions && (
                        <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-lg p-3 mb-3 animate-in slide-in-from-top-2">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold flex items-center gap-2 text-violet-800 dark:text-violet-300">
                                    <Lightbulb className="w-4 h-4" />
                                    Recommended Controls
                                </h4>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => setShowSuggestions(false)}
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>

                            {loadingSuggestions ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                                </div>
                            ) : suggestions.length > 0 ? (
                                <div className="space-y-2">
                                    {suggestions.map((suggestion: any) => {
                                        const existingControl = controls?.find((c: any) => c.control?.controlId === suggestion.controlId || c.clientControl?.controlId === suggestion.controlId);
                                        const clientControlId = existingControl?.clientControl?.id;
                                        const isSelected = clientControlId && formData.selectedControls[clientControlId];

                                        return (
                                            <div key={suggestion.controlId} className="bg-background rounded border p-2 text-sm">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div>
                                                        <div className="font-medium flex items-center gap-2">
                                                            {suggestion.controlId} {suggestion.framework ? `(${suggestion.framework})` : ''}
                                                            <Badge variant="outline" className="text-[10px] h-4 px-1">{suggestion.relevanceScore}% match</Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">{suggestion.controlName}</p>
                                                        <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 italic">"{suggestion.rationale}"</p>
                                                    </div>
                                                    {clientControlId ? (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant={isSelected ? "secondary" : "default"}
                                                            className="h-7 text-xs"
                                                            onClick={() => {
                                                                if (!isSelected) toggleControl(clientControlId);
                                                            }}
                                                            disabled={isSelected}
                                                        >
                                                            {isSelected ? 'Applied' : 'Apply'}
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                                                            onClick={() => {
                                                                createControlMutation.mutate({
                                                                    clientId,
                                                                    name: suggestion.controlName,
                                                                    description: suggestion.rationale,
                                                                    code: suggestion.controlId
                                                                });
                                                            }}
                                                            disabled={createControlMutation.isLoading}
                                                        >
                                                            <Plus className="w-3 h-3 mr-1" />
                                                            Add
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-2">No specific recommendations found.</p>
                            )}
                        </div>
                    )}
                    <div className="border rounded-lg p-3 max-h-96 overflow-y-auto bg-secondary/30">
                        {controls && controls.length > 0 ? (
                            <div className="space-y-2">
                                {controls.map((item: any) => {
                                    const { clientControl, control } = item;
                                    const isSelected = !!formData.selectedControls[clientControl.id];
                                    const config = formData.selectedControls[clientControl.id];

                                    return (
                                        <div key={clientControl.id} className={`rounded border transition-colors ${isSelected ? 'bg-background border-blue-200' : 'hover:bg-accent border-transparent'}`}>
                                            <label className="flex items-start gap-2 p-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleControl(clientControl.id)}
                                                    className="rounded mt-1"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-mono text-muted-foreground">{control?.controlId || clientControl.controlId}</span>
                                                        <span className="text-sm font-medium">{control?.name || clientControl.customDescription}</span>
                                                    </div>
                                                </div>
                                            </label>

                                            {/* Configuration Section (Visible when selected) */}
                                            {isSelected && config && (
                                                <div className="px-3 pb-3 pt-0 pl-7 space-y-3 animate-in fade-in slide-in-from-top-1">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <Label className="text-xs text-muted-foreground mb-1.5 block">Effectiveness</Label>
                                                            <Select
                                                                value={config.effectiveness}
                                                                onValueChange={(val) => updateControlConfig(clientControl.id, 'effectiveness', val)}
                                                            >
                                                                <SelectTrigger className="h-8 text-sm">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="effective">Effective (100%)</SelectItem>
                                                                    <SelectItem value="partially_effective">Partially Effective (50%)</SelectItem>
                                                                    <SelectItem value="ineffective">Ineffective (0%)</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs text-muted-foreground mb-1.5 block">Notes</Label>
                                                            <Input
                                                                className="h-8 text-sm"
                                                                placeholder="Implementation details..."
                                                                value={config.implementationNotes}
                                                                onChange={(e) => updateControlConfig(clientControl.id, 'implementationNotes', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No controls available</p>
                        )}
                    </div>
                </div>
            )}

            {/* Implementation Details Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="owner">Treatment Owner</Label>
                    <Input
                        id="owner"
                        value={formData.owner}
                        onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                        placeholder="Person responsible"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                </div>
            </div>

            {/* Priority and Cost Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                        value={formData.priority}
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
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

                <div className="space-y-2">
                    <Label htmlFor="estimatedCost">Estimated Cost</Label>
                    <Input
                        id="estimatedCost"
                        value={formData.estimatedCost}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimatedCost: e.target.value }))}
                        placeholder="e.g., $5,000 or 40 hours"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {initialData ? 'Update Treatment' : 'Create Treatment'}
                </Button>
            </div>
        </form>
    );
}
