import React, { useState } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAskQuestion } from "@/hooks/useAdvisor";

interface RiskReportAIButtonProps {
    clientId: number;
    sectionField: string;
    sectionName: string;
    prompt: string;
    onGenerate: (text: string) => void;
}

export const RiskReportAIButton = ({
    clientId,
    sectionField,
    sectionName,
    prompt,
    onGenerate
}: RiskReportAIButtonProps) => {
    const { askAsync, isLoading } = useAskQuestion();
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const response = await askAsync({
                clientId: clientId || 0,
                question: prompt
            });

            onGenerate(response.answer);
            toast.success(`${sectionName} generated successfully`);
        } catch (error) {
            toast.error("Failed to generate AI suggestion");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleGenerate}
            disabled={generating || isLoading}
            className="h-7 text-xs"
        >
            <Sparkles className="w-3 h-3 mr-1" />
            {generating ? 'Generating...' : 'AI Suggest'}
        </Button>
    );
};
