import React, { useState } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface PolicyRiskSuggestionProps {
    content: string;
    availableRisks: any[];
    linkedRisks: any[];
    onSuggest: (ids: number[]) => void;
}

export const PolicyRiskSuggestion = ({
    content,
    availableRisks,
    linkedRisks,
    onSuggest
}: PolicyRiskSuggestionProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleSuggest = async () => {
        if (!content || !availableRisks || availableRisks.length === 0) {
            toast.error("No policy content or risks available");
            return;
        }

        setIsLoading(true);
        try {
            // Get already linked risk IDs to exclude them
            const linkedRiskIds = new Set(linkedRisks?.map((item: any) => item.risk?.id).filter(Boolean) || []);

            // Filter available risks that aren't already linked
            const unlinkedRisks = availableRisks.filter((risk: any) => !linkedRiskIds.has(risk.id));

            if (unlinkedRisks.length === 0) {
                toast.info("All available risks are already linked");
                setIsLoading(false);
                return;
            }

            // Simple keyword matching for risk suggestion
            // Extract keywords from policy content (lowercase, remove HTML tags)
            const cleanContent = content.replace(/<[^>]*>/g, ' ').toLowerCase();
            const keywords = cleanContent.split(/\s+/).filter((word: string) => word.length > 4);

            // Score each risk based on keyword matches in title and description
            const scoredRisks = unlinkedRisks.map((risk: any) => {
                const riskText = `${risk.title || ''} ${risk.description || ''}`.toLowerCase();
                const score = keywords.reduce((total: number, keyword: string) => {
                    return total + (riskText.includes(keyword) ? 1 : 0);
                }, 0);
                return { risk, score };
            });

            // Sort by score and take top 5 matches
            const topRisks = scoredRisks
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map(item => item.risk.id);

            if (topRisks.length === 0) {
                toast.info("No matching risks found based on policy content");
            } else {
                onSuggest(topRisks);
                toast.success(`Found ${topRisks.length} suggested risk(s)`);
            }
        } catch (error: any) {
            console.error("Error suggesting risks:", error);
            toast.error("Failed to analyze policy for risk suggestions");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSuggest}
            disabled={isLoading}
            className="flex-1"
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Policy...
                </>
            ) : (
                <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Suggest Risks
                </>
            )}
        </Button>
    );
};
