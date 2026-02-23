
import { useState } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Wand2, Sparkles, Loader2 } from "lucide-react";

interface AiRewriteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRewrite: (instruction: string) => void;
    isPending: boolean;
}

export function AiRewriteDialog({ open, onOpenChange, onRewrite, isPending }: AiRewriteDialogProps) {
    const [instruction, setInstruction] = useState("");

    const handleSubmit = () => {
        onRewrite(instruction);
    };

    const predefinedPrompts = [
        "Improve clarity, tone, and formatting.",
        "Make the language more formal and precise.",
        "Summarize the key points in a bulleted list.",
        "Expand on the roles and responsibilities section.",
        "Add a table for version history."
    ];

    return (
        <EnhancedDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Rewrite with AI"
            description="Provide instructions for the AI to rewrite or improve the policy content."
            size="md"
            footer={
                <div className="flex justify-end gap-2 w-full">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!instruction.trim() || isPending}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Rewriting...
                            </>
                        ) : (
                            <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Rewrite Policy
                            </>
                        )}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Instructions for AI</Label>
                    <Textarea
                        placeholder="e.g. 'Add a section on data retention' or 'Simplify the language for non-technical employees'"
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        rows={5}
                        className="resize-none"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Quick Prompts</Label>
                    <div className="flex flex-wrap gap-2">
                        {predefinedPrompts.map((prompt, i) => (
                            <Button
                                key={i}
                                variant="outline"
                                size="sm"
                                className={`text-xs h-auto py-1 px-2 whitespace-normal text-left ${instruction.includes(prompt) ? "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:text-purple-900" : ""}`}
                                onClick={() => {
                                    setInstruction(prev => {
                                        if (!prev.trim()) return prompt;
                                        if (prev.includes(prompt)) return prev;
                                        return prev + "\n" + prompt;
                                    });
                                }}
                            >
                                <Sparkles className="mr-1 h-3 w-3 text-purple-500 shrink-0" />
                                {prompt}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-xs text-blue-800">
                    <strong>Note:</strong> The AI will process the entire content of the policy based on your instructions.
                </div>
            </div>
        </EnhancedDialog >
    );
}
