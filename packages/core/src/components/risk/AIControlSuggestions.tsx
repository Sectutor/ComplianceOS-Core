import React, { useState } from 'react';
import { trpc } from '../../lib/trpc';
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Sparkles, Loader2, Plus, Info } from 'lucide-react';
import { Badge } from "@complianceos/ui/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@complianceos/ui/ui/tooltip";

interface AIControlSuggestionsProps {
    clientId: number;
    threat: string;
    vulnerability: string;
    onAddControl: (controlId: number) => void;
    selectedControlIds: number[];
}

export function AIControlSuggestions({ clientId, threat, vulnerability, onAddControl, selectedControlIds }: AIControlSuggestionsProps) {
    const [suggestions, setSuggestions] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const suggestMutation = trpc.risks.suggestControls.useMutation();

    const handleSuggest = async () => {
        if (!threat || !vulnerability) return;

        setIsLoading(true);
        try {
            const result = await suggestMutation.mutateAsync({
                clientId,
                threat,
                vulnerability
            });
            setSuggestions(result.suggestions);
        } catch (error) {
            console.error("Failed to get suggestions", error);
        } finally {
            setIsLoading(false);
        }
    };

    if ((!threat || !vulnerability) && !suggestions) return null;

    return (
        <div className="mb-6">
            {!suggestions && !isLoading && (
                <Button
                    variant="outline"
                    onClick={handleSuggest}
                    className="w-full border-dashed border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 h-12"
                    disabled={!threat || !vulnerability}
                >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Suggest Controls based on Threat & Vulnerability
                </Button>
            )}

            {isLoading && (
                <div className="flex items-center justify-center p-4 bg-purple-50/50 rounded-md border border-purple-100">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-600 mr-2" />
                    <span className="text-sm text-purple-700 font-medium">Analyzing risk context...</span>
                </div>
            )}

            {suggestions && (
                <Card className="border-purple-200 bg-purple-50/30">
                    <CardContent className="pt-4 pb-2 px-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="flex items-center text-sm font-semibold text-purple-900">
                                <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                                Recommended Controls
                            </h4>
                            <Button variant="ghost" size="sm" onClick={() => setSuggestions(null)} className="h-6 text-xs text-purple-500">
                                Close
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {suggestions.map((suggestion: any) => {
                                const details = suggestion.details;
                                const isSelected = selectedControlIds.includes(details.clientControl.id);

                                return (
                                    <div key={suggestion.clientControlId} className="bg-white border border-purple-100 rounded p-3 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] px-1.5 py-0 h-5">
                                                    Score: {suggestion.relevance}/10
                                                </Badge>
                                                <span className="font-semibold text-sm text-slate-800">
                                                    {details.control?.controlId || details.clientControl.clientControlId}
                                                </span>
                                                <span className="text-sm text-slate-600 truncate max-w-[200px] sm:max-w-xs block">
                                                    {details.control?.name || details.clientControl.customDescription}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-0 leading-relaxed">
                                                <span className="font-medium text-purple-700">Why: </span>
                                                {suggestion.reasoning}
                                            </p>
                                        </div>

                                        <Button
                                            size="sm"
                                            variant={isSelected ? "secondary" : "default"}
                                            className={isSelected ? "bg-green-100 text-green-700 hover:bg-green-200 border-none" : "bg-purple-600 hover:bg-purple-700 h-8"}
                                            onClick={() => !isSelected && onAddControl(details.clientControl.id)}
                                            disabled={isSelected}
                                        >
                                            {isSelected ? "Added" : (
                                                <>
                                                    <Plus className="w-3 h-3 mr-1" /> Add
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                );
                            })}

                            {suggestions.length === 0 && (
                                <p className="text-center text-sm text-slate-500 py-2">No specific recommendations found.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
