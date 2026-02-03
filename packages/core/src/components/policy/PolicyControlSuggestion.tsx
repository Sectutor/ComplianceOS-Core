import React, { useState } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface PolicyControlSuggestionProps {
    content: string;
    availableControls: any[];
    linkedControls: any[];
    onSuggest: (ids: number[]) => void;
}

export const PolicyControlSuggestion = ({
    content,
    availableControls,
    linkedControls,
    onSuggest
}: PolicyControlSuggestionProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleSuggest = async () => {
        if (!content || !availableControls || (availableControls as any[]).length === 0) {
            toast.error("No policy content or controls available");
            return;
        }

        setIsLoading(true);
        try {
            // Get already linked control IDs to exclude them
            const linkedControlIds = new Set(linkedControls?.map((item: any) => item.clientControl?.id).filter(Boolean) || []);

            // Filter available controls that aren't already linked
            const unlinkedControls = (availableControls as any[]).filter((item: any) =>
                item?.clientControl && !linkedControlIds.has(item.clientControl.id)
            );

            if (unlinkedControls.length === 0) {
                toast.info("All available controls are already linked");
                setIsLoading(false);
                return;
            }

            // Simple keyword matching for control suggestion
            // Extract keywords from policy content (lowercase, remove HTML tags)
            const cleanContent = content.replace(/<[^>]*>/g, ' ').toLowerCase();
            const keywords = cleanContent.split(/\s+/).filter((word: string) => word.length > 4);

            // Score each control based on keyword matches in control ID and name
            const scoredControls = unlinkedControls.map((item: any) => {
                const controlText = `${item.clientControl.clientControlId || ''} ${item.control?.name || ''} ${item.control?.description || ''}`.toLowerCase();
                const score = keywords.reduce((total: number, keyword: string) => {
                    return total + (controlText.includes(keyword) ? 1 : 0);
                }, 0);
                return { item, score };
            });

            // Sort by score and take top 5 matches
            const topControls = scoredControls
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map(item => item.item.clientControl.id);

            if (topControls.length === 0) {
                toast.info("No matching controls found based on policy content");
            } else {
                onSuggest(topControls);
                toast.success(`Found ${topControls.length} suggested control(s)`);
            }
        } catch (error: any) {
            console.error("Error suggesting controls:", error);
            toast.error("Failed to analyze policy for control suggestions");
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
                    AI Suggest Controls
                </>
            )}
        </Button>
    );
};
