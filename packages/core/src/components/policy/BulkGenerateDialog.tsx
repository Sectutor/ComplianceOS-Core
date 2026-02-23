import { useState, useMemo } from "react";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
    Sparkles,
    FileText,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronRight,
    Layers,
    ArrowLeft,
} from "lucide-react";

interface BulkGenerateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: number;
    clientName: string;
    onComplete: () => void;
}

type Step = "select" | "confirm" | "generating" | "complete";

interface GenerationResult {
    created: number;
    skipped: number;
    total: number;
    message: string;
}

export function BulkGenerateDialog({
    open,
    onOpenChange,
    clientId,
    clientName,
    onComplete,
}: BulkGenerateDialogProps) {
    const [step, setStep] = useState<Step>("select");
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<number>>(new Set());
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [progress, setProgress] = useState(0);

    // Fetch templates
    const { data: policyTemplates } = trpc.policyTemplates.list.useQuery();

    // Fetch existing policies for this client
    const { data: clientPolicies } = trpc.clientPolicies.list.useQuery(
        { clientId },
        { enabled: clientId > 0 }
    );

    // Get existing template IDs that already have a policy
    const existingTemplateIds = useMemo(() => {
        if (!clientPolicies) return new Set<number>();
        return new Set(
            clientPolicies
                .filter((p: any) => p.templateId)
                .map((p: any) => p.templateId as number)
        );
    }, [clientPolicies]);

    // Separate templates into available vs already generated
    const { availableTemplates, existingTemplates } = useMemo(() => {
        if (!policyTemplates) return { availableTemplates: [], existingTemplates: [] };
        const available = policyTemplates.filter((t: any) => !existingTemplateIds.has(t.id));
        const existing = policyTemplates.filter((t: any) => existingTemplateIds.has(t.id));
        return { availableTemplates: available, existingTemplates: existing };
    }, [policyTemplates, existingTemplateIds]);

    // Bulk generate mutation
    const bulkGenerateMutation = trpc.clientPolicies.generateBulk.useMutation({
        onSuccess: (data: any) => {
            setResult(data);
            setStep("complete");
            setProgress(100);
            onComplete();
        },
        onError: (error) => {
            toast.error(error.message || "Bulk generation failed");
            setStep("select");
            setProgress(0);
        },
    });

    const handleToggleTemplate = (id: number) => {
        setSelectedTemplateIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedTemplateIds.size === availableTemplates.length) {
            setSelectedTemplateIds(new Set());
        } else {
            setSelectedTemplateIds(new Set(availableTemplates.map((t: any) => t.id)));
        }
    };

    const handleGenerate = () => {
        setStep("generating");
        setProgress(15);

        // Animate progress while waiting for backend
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + Math.random() * 8;
            });
        }, 600);

        bulkGenerateMutation.mutate({
            clientId,
            companyName: clientName,
        });
    };

    const handleReset = () => {
        setStep("select");
        setResult(null);
        setProgress(0);
    };

    const handleClose = () => {
        handleReset();
        onOpenChange(false);
    };

    const selectedCount = selectedTemplateIds.size;
    const allSelected = selectedCount === availableTemplates.length && availableTemplates.length > 0;

    const getStepTitle = () => {
        switch (step) {
            case "select":
                return "Bulk Generate Policies";
            case "confirm":
                return "Confirm Generation";
            case "generating":
                return "Generating Policies...";
            case "complete":
                return "Generation Complete";
        }
    };

    const getStepDescription = () => {
        switch (step) {
            case "select":
                return `Select policy templates to generate for ${clientName}. Templates already in use are shown separately.`;
            case "confirm":
                return `Review your selection before generating ${selectedCount} policies.`;
            case "generating":
                return "AI is generating your policies from templates. This may take a moment.";
            case "complete":
                return "Your policies have been generated and are ready for review.";
        }
    };

    const footer = (
        <div className="flex justify-between items-center w-full">
            <div className="text-xs text-muted-foreground">
                {step === "select" && availableTemplates.length > 0 && (
                    <span>{selectedCount} of {availableTemplates.length} selected</span>
                )}
                {step === "confirm" && (
                    <span>{selectedCount} policies will be created</span>
                )}
            </div>
            <div className="flex gap-2">
                {step === "select" && (
                    <>
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            disabled={availableTemplates.length === 0}
                            onClick={() => {
                                if (selectedCount === 0) {
                                    // Auto-select all if none selected
                                    setSelectedTemplateIds(new Set(availableTemplates.map((t: any) => t.id)));
                                }
                                setStep("confirm");
                            }}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md"
                        >
                            <ChevronRight className="mr-1 h-4 w-4" />
                            Continue
                        </Button>
                    </>
                )}
                {step === "confirm" && (
                    <>
                        <Button variant="outline" onClick={() => setStep("select")}>
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back
                        </Button>
                        <Button
                            onClick={handleGenerate}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md"
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate {selectedCount} Policies
                        </Button>
                    </>
                )}
                {step === "complete" && (
                    <Button onClick={handleClose}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Done
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <EnhancedDialog
            open={open}
            onOpenChange={(o) => {
                if (!o) handleClose();
                else onOpenChange(o);
            }}
            title={getStepTitle()}
            description={getStepDescription()}
            size="lg"
            footer={step !== "generating" ? footer : undefined}
        >
            {/* ── Step 1: Select Templates ── */}
            {step === "select" && (
                <div className="space-y-4">
                    {/* Available Templates */}
                    {availableTemplates.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-purple-500" />
                                    Available Templates
                                    <Badge variant="secondary" className="text-xs">
                                        {availableTemplates.length}
                                    </Badge>
                                </h4>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSelectAll}
                                    className="text-xs"
                                >
                                    {allSelected ? "Deselect All" : "Select All"}
                                </Button>
                            </div>
                            <div className="grid gap-2 max-h-[350px] overflow-y-auto pr-2">
                                {availableTemplates.map((template: any) => (
                                    <div
                                        key={template.id}
                                        className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                      transition-all duration-200
                      ${selectedTemplateIds.has(template.id)
                                                ? "border-purple-300 bg-purple-50/70 ring-1 ring-purple-200"
                                                : "border-border hover:border-purple-200 hover:bg-purple-50/30"
                                            }
                    `}
                                        onClick={() => handleToggleTemplate(template.id)}
                                    >
                                        <Checkbox
                                            checked={selectedTemplateIds.has(template.id)}
                                            onCheckedChange={() => handleToggleTemplate(template.id)}
                                            className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                        />
                                        <div className="p-1.5 rounded-md bg-purple-100">
                                            <FileText className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{template.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {template.framework || "General"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="h-7 w-7 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-green-900">All Policies Generated</h3>
                            <p className="text-sm text-muted-foreground mt-1 max-w-md">
                                Every available template has already been used to create a policy for this client.
                            </p>
                        </div>
                    )}

                    {/* Already Existing Templates */}
                    {existingTemplates.length > 0 && (
                        <div className="pt-3 border-t">
                            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Already Generated
                                <Badge variant="outline" className="text-xs text-green-700 border-green-200 bg-green-50">
                                    {existingTemplates.length} policies
                                </Badge>
                            </h4>
                            <div className="grid gap-1.5 max-h-[120px] overflow-y-auto pr-2">
                                {existingTemplates.map((template: any) => (
                                    <div
                                        key={template.id}
                                        className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 opacity-60"
                                    >
                                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm truncate">{template.name}</p>
                                        </div>
                                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                                            Exists
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Step 2: Confirm ── */}
            {step === "confirm" && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Ready to Generate</h3>
                                <p className="text-sm text-muted-foreground">
                                    {selectedCount} policies for <strong>{clientName}</strong>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-center px-4 py-3 bg-white/80 rounded-lg border border-purple-100 flex-1">
                                <span className="text-2xl font-bold text-purple-700">{selectedCount}</span>
                                <span className="text-xs text-purple-600 font-medium">New Policies</span>
                            </div>
                            <div className="flex flex-col items-center px-4 py-3 bg-white/80 rounded-lg border border-purple-100 flex-1">
                                <span className="text-2xl font-bold text-green-700">{existingTemplates.length}</span>
                                <span className="text-xs text-green-600 font-medium">Already Exist</span>
                            </div>
                            <div className="flex flex-col items-center px-4 py-3 bg-white/80 rounded-lg border border-purple-100 flex-1">
                                <span className="text-2xl font-bold text-indigo-700">
                                    {selectedCount + existingTemplates.length}
                                </span>
                                <span className="text-xs text-indigo-600 font-medium">Total After</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-purple-500" />
                            Policies to Generate
                        </h4>
                        <div className="grid gap-1.5 max-h-[200px] overflow-y-auto pr-2">
                            {availableTemplates
                                .filter((t: any) => selectedTemplateIds.has(t.id))
                                .map((template: any) => (
                                    <div
                                        key={template.id}
                                        className="flex items-center gap-3 p-2.5 rounded-lg bg-purple-50/50 border border-purple-100"
                                    >
                                        <div className="p-1 rounded-md bg-purple-100">
                                            <FileText className="h-3.5 w-3.5 text-purple-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{template.name}</p>
                                        </div>
                                        <Badge variant="outline" className="text-xs text-purple-600 border-purple-200">
                                            {template.framework || "General"}
                                        </Badge>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-800">
                            Policies will be created as drafts with placeholders replaced using <strong>{clientName}</strong>.
                            You can edit and refine each policy individually afterward.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Step 3: Generating ── */}
            {step === "generating" && (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 h-20 w-20 bg-purple-200 rounded-full animate-ping opacity-20" />
                        <div className="relative h-20 w-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-xl shadow-purple-200">
                            <Loader2 className="h-10 w-10 text-white animate-spin" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold">Generating Policies</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">
                            Creating {selectedCount} policies from templates for <strong>{clientName}</strong>.
                            This usually takes a few seconds.
                        </p>
                    </div>
                    <div className="w-64 space-y-2">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
                    </div>
                </div>
            )}

            {/* ── Step 4: Complete ── */}
            {step === "complete" && result && (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 h-20 w-20 bg-green-200 rounded-full animate-ping opacity-20" />
                        <div className="relative h-20 w-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-green-200">
                            <CheckCircle2 className="h-10 w-10 text-white" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-green-900">Policies Generated Successfully</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">
                            {result.message}
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center px-5 py-3 bg-green-50 rounded-xl border border-green-200">
                            <span className="text-3xl font-bold text-green-700">{result.created}</span>
                            <span className="text-xs text-green-600 font-medium">Created</span>
                        </div>
                        <div className="flex flex-col items-center px-5 py-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-3xl font-bold text-slate-500">{result.skipped}</span>
                            <span className="text-xs text-slate-500 font-medium">Skipped</span>
                        </div>
                        <div className="flex flex-col items-center px-5 py-3 bg-indigo-50 rounded-xl border border-indigo-200">
                            <span className="text-3xl font-bold text-indigo-700">{result.total}</span>
                            <span className="text-xs text-indigo-600 font-medium">Total Templates</span>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        All new policies are saved as drafts. Open each policy to review and customize.
                    </p>
                </div>
            )}
        </EnhancedDialog>
    );
}

export default BulkGenerateDialog;
