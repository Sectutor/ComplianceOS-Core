
import React from 'react';
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { AlertTriangle, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Hammer, Check } from "lucide-react";
import { PlaybookSuggestionCard } from "@/components/gap-analysis/PlaybookSuggestionCard";
import { Slot } from "@/registry";
import { SlotNames } from "@/registry/slotNames";

interface Control {
    id: number;
    controlId: string;
    domain?: string;
    name: string;
    description?: string;
    framework?: string;
    implementationGuidance?: string;
}

interface AssessmentResponse {
    id: number;
    controlId: string;
    currentStatus?: string;
    targetStatus?: string;
    notes?: string;
    priorityScore?: number | null;
    priorityReason?: string | null;
}

interface GapAnalysisControlCardProps {
    control: Control;
    response?: AssessmentResponse;
    selected: boolean;
    onSelect: (checked: boolean) => void;
    onUpdate: (field: string, value: string) => void;
    onRaiseRisk: () => void;
}

export function GapAnalysisControlCard({
    control,
    response,
    selected,
    onSelect,
    onUpdate,
    onRaiseRisk
}: GapAnalysisControlCardProps) {
    const currentStatus = response?.currentStatus;

    // AI Assist Logic removed - now handled via Slot

    const [taskCreated, setTaskCreated] = React.useState(false);
    const [riskCreated, setRiskCreated] = React.useState(false);
    const createTaskMutation = trpc.governance.create.useMutation();

    const handleCreateTask = async () => {
        try {
            await createTaskMutation.mutateAsync({
                clientId: 3, // TODO: Pass from context
                title: `Remediate Gap: ${control.controlId} - ${control.name}`,
                description: response?.notes || `Implement control ${control.controlId}.`,
                priority: (response?.priorityScore || 0) > 80 ? 'critical' : (response?.priorityScore || 0) > 50 ? 'high' : 'medium',
                type: 'control_implementation',
                entityType: 'control',
                entityId: control.id
            });
            toast.success("Task created in Governance Workbench");
            setTaskCreated(true);
        } catch (error) {
            console.error(error);
            toast.error("Failed to create task");
        }
    };

    const handleRaiseRiskWrapper = () => {
        onRaiseRisk();
        setRiskCreated(true);
    };

    // Removed direct useAskQuestion hook usage

    // Helper to get response for a control
    const getResponse = (controlId: string) => response; // simplified for local ref
    const targetStatus = response?.targetStatus;

    // Gap logic: If target is "required" and current is not "implemented"
    const hasGap = targetStatus === 'required' && currentStatus !== 'implemented';

    return (
        <Card className={`transition-all ${hasGap ? 'border-orange-200 bg-orange-50/10' : ''}`}>
            <CardContent className="p-6">
                <div className="grid grid-cols-12 gap-6">
                    {/* Control Details */}
                    <div className="col-span-12 lg:col-span-5 space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Checkbox
                                checked={selected}
                                onCheckedChange={(checked) => onSelect(checked as boolean)}
                            />
                            <Badge variant="secondary" className="font-mono text-xs">{control.controlId}</Badge>
                            {control.domain && <span className="text-xs text-muted-foreground">{control.domain}</span>}
                        </div>
                        <h3 className="font-semibold">{control.name}</h3>
                        <p className="text-sm text-muted-foreground">{control.description}</p>

                        {control.implementationGuidance && (
                            <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                                    {control.framework?.includes('800-171') ? 'Assessment Objectives (800-171A)' : 'Implementation Guidance'}
                                </p>
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{control.implementationGuidance}</p>
                            </div>
                        )}
                    </div>

                    {/* Assessment Inputs */}
                    <div className="col-span-12 lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Current State</label>
                                <Select
                                    value={currentStatus || ""}
                                    onValueChange={(val) => onUpdate('currentStatus', val)}
                                >
                                    <SelectTrigger
                                        className={cn(
                                            "transition-all font-medium",
                                            currentStatus === 'implemented' && "bg-[var(--success-bg)] text-[var(--success-foreground)] border-[var(--success-foreground)]/20",
                                            currentStatus === 'partially_implemented' && "bg-[var(--evaluation-bg)] text-[var(--evaluation-foreground)] border-[var(--evaluation-foreground)]/20",
                                            currentStatus === 'not_implemented' && "bg-[var(--error-bg)] text-[var(--error-foreground)] border-[var(--error-foreground)]/20",
                                            currentStatus === 'not_applicable' && "bg-[var(--info-bg)] text-[var(--info-foreground)] border-[var(--info-foreground)]/20"
                                        )}
                                    >
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="not_implemented">Not Implemented</SelectItem>
                                        <SelectItem value="partially_implemented">Partially Implemented</SelectItem>
                                        <SelectItem value="implemented">Implemented</SelectItem>
                                        <SelectItem value="not_applicable">Not Applicable</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Target State</label>
                                <Select
                                    value={targetStatus || ""}
                                    onValueChange={(val) => onUpdate('targetStatus', val)}
                                >
                                    <SelectTrigger
                                        className={cn(
                                            "transition-all font-medium",
                                            targetStatus === 'required' && "bg-[var(--info-bg)] text-[var(--info-foreground)] border-[var(--info-foreground)]/20",
                                            targetStatus === 'not_required' && "bg-slate-100 text-slate-600 border-slate-200"
                                        )}
                                    >
                                        <SelectValue placeholder="Select Target" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="required">Required</SelectItem>
                                        <SelectItem value="not_required">Not Required</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5 relative">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-muted-foreground">Notes / Remediation</label>
                                <div className="flex gap-2">
                                    <Slot
                                        name={SlotNames.GAP_ANALYSIS_AI_BUTTON}
                                        props={{
                                            clientId: 3, // TODO: Pass client Id in props or context
                                            controlId: control.id,
                                            controlName: control.name,
                                            description: control.description,
                                            framework: control.framework,
                                            currentStatus: currentStatus,
                                            notes: response?.notes,
                                            onUpdate: (newNotes: string) => onUpdate('notes', newNotes)
                                        }}
                                    />
                                </div>
                            </div>
                            <Textarea
                                placeholder="Add implementation notes, evidence links, or questions..."
                                className="h-[108px] resize-none"
                                value={response?.notes || ""}
                                onChange={(e) => onUpdate('notes', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {hasGap && (
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm text-orange-800 bg-orange-50/80 p-3 rounded-xl border border-orange-200 shadow-sm">
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="bg-orange-200/50 p-1.5 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                                </div>
                                <div className="space-y-0.5">
                                    <span className="font-bold text-orange-900 block sm:inline mr-2">Gap Identified:</span>
                                    <span className="text-orange-700">Current state does not meet target requirement.</span>
                                </div>
                                {response?.priorityScore !== null && response?.priorityScore !== undefined && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-orange-200 shadow-sm">
                                        <div className={`w-2 h-2 rounded-full ${response.priorityScore >= 80 ? 'bg-red-500' :
                                            response.priorityScore >= 60 ? 'bg-orange-500' :
                                                response.priorityScore >= 40 ? 'bg-yellow-500' :
                                                    'bg-green-500'}`} />
                                        <span className="text-[11px] font-bold text-slate-700">Priority Score: {response.priorityScore}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={taskCreated}
                                    className={cn(
                                        "h-9 px-4 font-bold transition-all shadow-sm",
                                        taskCreated
                                            ? "border-green-200 bg-green-50 text-green-700"
                                            : "border-blue-200 bg-white hover:bg-blue-600 hover:text-white hover:border-blue-600 text-blue-700"
                                    )}
                                    onClick={() => handleCreateTask()}
                                >
                                    {taskCreated ? <Check className="w-3.5 h-3.5 mr-2" /> : <Hammer className="w-3.5 h-3.5 mr-2" />}
                                    {taskCreated ? "Task Created" : "Create Task"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={riskCreated}
                                    className={cn(
                                        "h-9 px-4 font-bold transition-all shadow-sm",
                                        riskCreated
                                            ? "border-green-200 bg-green-50 text-green-700"
                                            : "border-orange-200 bg-white hover:bg-orange-600 hover:text-white hover:border-orange-600 text-orange-700"
                                    )}
                                    onClick={handleRaiseRiskWrapper}
                                >
                                    {riskCreated ? <Check className="w-3.5 h-3.5 mr-2" /> : <AlertTriangle className="w-3.5 h-3.5 mr-2" />}
                                    {riskCreated ? "Risk Raised" : "Raise Risk"}
                                </Button>
                            </div>
                        </div>
                        {response?.priorityReason && (
                            <div className="text-xs text-purple-700 bg-purple-50 p-2 rounded border border-purple-200 flex items-start gap-2">
                                <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                <span><strong>AI Reason:</strong> {response.priorityReason}</span>
                            </div>
                        )}

                        {/* Playbook Suggestions */}
                        <PlaybookSuggestionCard
                            controlId={control.controlId}
                            controlName={control.name}
                            category={control.domain}
                            framework={control.framework}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
