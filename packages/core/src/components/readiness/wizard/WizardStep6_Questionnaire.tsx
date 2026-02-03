import React, { useState } from "react";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@complianceos/ui/ui/radio-group";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Info, CheckCircle2, Circle } from "lucide-react";
import { READINESS_STANDARDS } from "@/data/readiness-standards";

interface WizardStepProps {
    data: any; // { questions: { "1.1": { answer: "yes", comment: "..." } } }
    onChange: (d: any) => void;
    standardId: string;
}

export function WizardStep6_Questionnaire({ data, onChange, standardId }: WizardStepProps) {
    const config = READINESS_STANDARDS[standardId] || READINESS_STANDARDS["ISO27001"];
    const sections = config.questionnaire || [];

    const handleAnswerChange = (questionId: string, answer: string) => {
        const currentData = data || {};
        const questions = currentData.questions || {};
        onChange({
            ...currentData,
            questions: {
                ...questions,
                [questionId]: {
                    ...(questions[questionId] || {}),
                    answer
                }
            }
        });
    };

    const handleCommentChange = (questionId: string, comment: string) => {
        const currentData = data || {};
        const questions = currentData.questions || {};
        onChange({
            ...currentData,
            questions: {
                ...questions,
                [questionId]: {
                    ...(questions[questionId] || {}),
                    comment
                }
            }
        });
    };

    const getProgress = () => {
        if (!data?.questions) return 0;
        const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0);
        const answeredQuestions = Object.values(data.questions).filter((q: any) => !!q.answer).length;
        return Math.round((answeredQuestions / totalQuestions) * 100);
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex gap-3 text-indigo-900 mb-6">
                <Info className="h-5 w-5 shrink-0 text-indigo-600 mt-0.5" />
                <div className="text-sm">
                    <p className="font-semibold mb-1">Self-Assessment Questionnaire</p>
                    <p className="opacity-90 leading-relaxed">
                        This questionnaire assesses your preparedness for {config.name} certification.
                        Answer "Yes" if fully implemented, or "No" if not or only partially.
                        Provide comments/evidence for each.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                        <div className="h-2 w-32 bg-indigo-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${getProgress()}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-indigo-700">{getProgress()}% Complete</span>
                    </div>
                </div>
            </div>

            <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-12">
                    {sections.map((section) => (
                        <div key={section.id} className="space-y-4">
                            <div className="border-l-4 border-indigo-500 pl-4 py-1">
                                <h3 className="text-lg font-bold text-slate-800">{section.title}</h3>
                                <p className="text-sm text-slate-500">{section.description}</p>
                            </div>

                            <div className="space-y-6">
                                {section.questions.map((q) => {
                                    const saved = data?.questions?.[q.id] || {};
                                    return (
                                        <Card key={q.id} className="border-slate-200 overflow-hidden shadow-sm hover:border-indigo-200 transition-colors">
                                            <CardContent className="p-5">
                                                <div className="flex flex-col gap-4">
                                                    <div className="flex gap-3">
                                                        <span className="shrink-0 font-mono text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded h-fit">
                                                            {q.id}
                                                        </span>
                                                        <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                                            {q.text}
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row gap-6 mt-2">
                                                        <RadioGroup
                                                            value={saved.answer || ""}
                                                            onValueChange={(val) => handleAnswerChange(q.id, val)}
                                                            className="flex gap-4"
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="yes" id={`q-${q.id}-yes`} />
                                                                <Label htmlFor={`q-${q.id}-yes`} className="text-sm cursor-pointer">Yes</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="no" id={`q-${q.id}-no`} />
                                                                <Label htmlFor={`q-${q.id}-no`} className="text-sm cursor-pointer">No</Label>
                                                            </div>
                                                        </RadioGroup>

                                                        <div className="flex-1">
                                                            <Textarea
                                                                placeholder="Comments / Evidence..."
                                                                value={saved.comment || ""}
                                                                onChange={(e) => handleCommentChange(q.id, e.target.value)}
                                                                className="min-h-[60px] text-sm bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
