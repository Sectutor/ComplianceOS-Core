import { useState } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Badge } from "@complianceos/ui/ui/badge";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, XCircle, Info, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface EvidenceAnalysisButtonProps {
    evidenceId: number;
    controlName?: string;
    controlDescription?: string;
}

interface AnalysisResult {
    isCompliant: boolean;
    reasoning: string;
    keyFindings: string[];
    confidence: string;
}

export default function EvidenceAnalysisButton({
    evidenceId,
    controlName,
    controlDescription
}: EvidenceAnalysisButtonProps) {
    const [open, setOpen] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [provider, setProvider] = useState<string>("");

    const analyzeMutation = trpc.evidence.analyze.useMutation({
        onSuccess: (data) => {
            setResult(data.analysis);
            setProvider(`${data.provider}/${data.model}`);
        },
        onError: (error) => {
            toast.error(error.message || "Analysis failed");
        },
    });

    const handleAnalyze = () => {
        setResult(null);
        analyzeMutation.mutate({
            evidenceId,
            controlName,
            controlDescription,
        });
    };

    const getAssessmentIcon = (assessment: string) => {
        switch (assessment) {
            case "SUFFICIENT":
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "PARTIALLY_SUFFICIENT":
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case "INSUFFICIENT":
                return <XCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Info className="h-5 w-5 text-muted-foreground" />;
        }
    };

    const getAssessmentColor = (assessment: string) => {
        switch (assessment) {
            case "SUFFICIENT":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
            case "PARTIALLY_SUFFICIENT":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
            case "INSUFFICIENT":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getConfidenceBadge = (confidence: string) => {
        const variant = confidence === "HIGH" ? "default" : confidence === "MEDIUM" ? "secondary" : "outline";
        return <Badge variant={variant}>{confidence} Confidence</Badge>;
    };

    return (
        <EnhancedDialog
            open={open}
            onOpenChange={setOpen}
            trigger={
                <Button variant="outline" size="sm" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI Analyze
                </Button>
            }
            title={
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Evidence Analysis
                </div>
            }
            description="Use AI to assess if this evidence meets the control requirements."
            size="sm"
        >
            <div className="space-y-4">
                <div className="bg-muted p-3 rounded-md text-sm">
                    <p className="font-medium mb-1">Checking against Control:</p>
                    <p className="text-muted-foreground">{controlDescription}</p>
                </div>

                {!result ? (
                    <div className="py-8 text-center space-y-4">
                        {analyzeMutation.isPending ? (
                            <>
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                <p className="text-sm text-muted-foreground">Analyzing document content...</p>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    This will extract text from the file and compare it against the control description to determine compliance.
                                </p>
                                <Button onClick={handleAnalyze} className="w-full">
                                    Start Analysis
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className={`p-4 rounded-lg border ${result.isCompliant ? 'bg-green-50 border-green-200 dark:bg-green-900/20' : 'bg-red-50 border-red-200 dark:bg-red-900/20'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                {result.isCompliant ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                )}
                                <h4 className={`font-semibold ${result.isCompliant ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                                    {result.isCompliant ? 'Complaint Evidence' : 'Non-Compliant Evidence'}
                                </h4>
                            </div>
                            <p className="text-sm opacity-90">{result.reasoning}</p>
                        </div>

                        <div>
                            <h5 className="text-sm font-medium mb-2">Detailed Findings</h5>
                            <ul className="space-y-2">
                                {result.keyFindings.map((finding, i) => (
                                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                        {finding}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
                                Reset Analysis
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </EnhancedDialog>
    );
}
