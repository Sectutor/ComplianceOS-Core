import React, { useState } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface GapAnalysisAIButtonProps {
    clientId: number;
    controlId: string;
    controlName: string;
    description?: string;
    framework?: string;
    currentStatus?: string;
    notes?: string;
    onUpdate: (notes: string) => void;
}

export const GapAnalysisAIButton = ({
    clientId,
    controlId,
    controlName,
    description,
    framework,
    currentStatus,
    notes,
    onUpdate
}: GapAnalysisAIButtonProps) => {
    const [aiLoading, setAiLoading] = useState(false);
    const askQuestionMutation = trpc.advisor.askQuestion.useMutation();

    const handleAiAssist = async () => {
        setAiLoading(true);
        try {
            const result = await askQuestionMutation.mutateAsync({
                clientId: clientId || 3, // Fallback for now matching original code
                question: `Suggest a remediation plan for control ${controlId}: ${controlName}`,
                context: {
                    type: 'gapanalysis',
                    id: controlId,
                    data: {
                        controlName,
                        description,
                        framework,
                        currentStatus,
                        notes
                    }
                }
            });

            if (result?.answer) {
                onUpdate((notes ? notes + '\n\n' : '') + '--- AI Remediation Plan ---\n' + result.answer);
                toast.success("AI Remediation suggested!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate AI suggestion");
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            className="h-5 px-2 text-[10px] text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            onClick={handleAiAssist}
            disabled={aiLoading}
        >
            {aiLoading ? (
                <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Thinking...
                </>
            ) : (
                <>
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Assist
                </>
            )}
        </Button>
    );
};
