
import { useState } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";

export interface TailoringQuestion {
    id: string;
    question: string;
    type: 'boolean' | 'text' | 'select' | 'number';
    defaultValue: any;
    options?: string[];
    placeholder?: string;
}

export function TailoringQuestionsEditor({
    initialQuestions = [],
    name = "tailoringQuestions",
    policyName,
    industry
}: {
    initialQuestions?: any[],
    name?: string,
    policyName?: string,
    industry?: string
}) {
    const [questions, setQuestions] = useState<any[]>(initialQuestions);
    const suggestMutation = trpc.policyTemplates.suggestQuestions.useMutation();

    const addQuestion = () => {
        setQuestions([...questions, {
            id: `q_${Date.now()}`,
            question: "New Question",
            type: "boolean",
            defaultValue: false
        }]);
    };

    const handleSuggest = async () => {
        // If policyName is not passed as prop, try to find it in the DOM (for create form)
        const effectivePolicyName = policyName || (document.getElementById('name') as HTMLInputElement)?.value;

        if (!effectivePolicyName) {
            toast.error("Please enter a policy name first");
            return;
        }

        const toastId = toast.loading("Generating tailoring questions...");

        try {
            const result = await suggestMutation.mutateAsync({
                policyName: effectivePolicyName,
                industry: industry || 'General',
                existingQuestions: questions.map(q => q.question)
            });

            if (result && result.length > 0) {
                const newQs = result.map((q: any) => ({
                    id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    question: q.question,
                    type: q.type,
                    options: q.options || [],
                    defaultValue: q.type === 'boolean' ? false : ''
                }));
                setQuestions(prev => [...prev, ...newQs]);
                toast.success(`Added ${newQs.length} suggested questions`, { id: toastId });
            } else {
                toast.info("No new questions suggested", { id: toastId });
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate suggestions", { id: toastId });
        }
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, updates: Partial<any>) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], ...updates };
        setQuestions(newQuestions);
    };

    return (
        <div className="space-y-4">
            <input type="hidden" name={name} value={JSON.stringify(questions)} />

            <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Tailoring Questionnaire
                </Label>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleSuggest}
                        disabled={suggestMutation.isPending}
                        className="h-8 text-xs"
                    >
                        {suggestMutation.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Wand2 className="mr-2 h-3 w-3" />}
                        Suggest with AI
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addQuestion}
                        className="h-8 border-dashed border-2 hover:border-primary hover:text-primary transition-all rounded-lg"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Question
                    </Button>
                </div>
            </div>

            <div className="grid gap-3">
                {questions.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-xl bg-slate-50 text-muted-foreground text-sm">
                        No dynamic questions defined yet.
                        <button type="button" onClick={addQuestion} className="text-primary font-medium ml-1 hover:underline">
                            Add your first question
                        </button>
                    </div>
                ) : (
                    questions.map((q, index) => (
                        <Card key={index} className="border-2 shadow-none hover:border-primary/30 transition-all duration-300 relative group bg-white/50 backdrop-blur-sm">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeQuestion(index)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>

                            <CardContent className="p-4 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                    <div className="md:col-span-8 flex flex-col gap-1.5">
                                        <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1">Question Text</Label>
                                        <Input
                                            placeholder="e.g. Does the organization use multi-factor authentication?"
                                            value={q.question}
                                            onChange={(e) => updateQuestion(index, { question: e.target.value })}
                                            className="h-9 border-slate-200 transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div className="md:col-span-4 flex flex-col gap-1.5">
                                        <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1">Input Type</Label>
                                        <Select
                                            value={q.type}
                                            onValueChange={(val: any) => updateQuestion(index, { type: val, defaultValue: val === 'boolean' ? false : (val === 'number' ? 0 : '') })}
                                        >
                                            <SelectTrigger className="h-9 border-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="boolean">Yes / No Switch</SelectItem>
                                                <SelectItem value="text">Text Input</SelectItem>
                                                <SelectItem value="number">Number Field</SelectItem>
                                                <SelectItem value="select">Dropdown Menu</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                    <div className="md:col-span-4 flex flex-col gap-1.5">
                                        <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1">Variable ID (Use in text)</Label>
                                        <Input
                                            placeholder="e.g. uses_mfa"
                                            value={q.id}
                                            onChange={(e) => updateQuestion(index, { id: e.target.value.toLowerCase().replace(/[^\w]/g, '_') })}
                                            className="h-8 text-xs font-mono bg-slate-50/50 border-slate-200"
                                        />
                                    </div>

                                    {q.type === 'select' ? (
                                        <div className="md:col-span-8 flex flex-col gap-1.5">
                                            <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1">Options (comma separated)</Label>
                                            <Input
                                                placeholder="Option 1, Option 2, Option 3"
                                                value={q.options?.join(', ') || ''}
                                                onChange={(e) => updateQuestion(index, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                                className="h-8 text-xs border-slate-200"
                                            />
                                        </div>
                                    ) : q.type === 'boolean' ? (
                                        <div className="md:col-span-8 flex flex-col gap-1.5 h-8 justify-center">
                                            <p className="text-[10px] text-slate-400 italic">Default value: {q.defaultValue ? 'Yes' : 'No'}</p>
                                        </div>
                                    ) : (
                                        <div className="md:col-span-8 flex flex-col gap-1.5">
                                            <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1">Default / Placeholder</Label>
                                            <Input
                                                placeholder="Enter default value..."
                                                value={q.defaultValue}
                                                onChange={(e) => updateQuestion(index, { defaultValue: e.target.value })}
                                                className="h-8 text-xs border-slate-200"
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
