import React, { useState } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAskQuestion } from "@/hooks/useAdvisor";

interface RiskReportGenerateAllButtonProps {
    clientId: number;
    sections: {
        field: string;
        name: string;
        prompt: string;
    }[];
    onGenerateSection: (field: string, text: string) => void;
}

export const RiskReportGenerateAllButton = ({
    clientId,
    sections,
    onGenerateSection
}: RiskReportGenerateAllButtonProps) => {
    const { askAsync, isLoading } = useAskQuestion();
    const [generating, setGenerating] = useState(false);

    const handleGenerateAll = async () => {
        setGenerating(true);
        let successCount = 0;
        let failCount = 0;

        for (const section of sections) {
            try {
                const response = await askAsync({
                    clientId: clientId || 0,
                    question: section.prompt
                });

                onGenerateSection(section.field, response.answer);
                successCount++;
                toast.success(`${section.name} generated`);
            } catch (error) {
                failCount++;
                console.error(`Failed to generate ${section.name}:`, error);
            }
        }

        setGenerating(false);

        if (failCount === 0) {
            toast.success(`All sections generated successfully!`);
        } else {
            toast.warning(`Generated ${successCount} sections, ${failCount} failed`);
        }
    };

    return (
        <Button
            variant="default"
            onClick={handleGenerateAll}
            disabled={generating || isLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
            <Sparkles className="w-4 h-4 mr-2" />
            {generating ? 'Generating All...' : 'Generate All with AI'}
        </Button>
    );
};
