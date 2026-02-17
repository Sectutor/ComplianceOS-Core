import React, { useState, useEffect } from 'react';
import { useClientContext } from "@/contexts/ClientContext";
import { PrivacyLayout } from "./PrivacyLayout";
import { Button } from "@complianceos/ui/ui/button";
import { ArrowLeft, Save, AlertTriangle, CheckCircle, HelpCircle, Loader2 } from "lucide-react";
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { useLocation } from "wouter";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { toast } from "sonner";
import { Separator } from "@complianceos/ui/ui/separator";

export default function DPIAQuestionnaire() {
    const { selectedClientId } = useClientContext();
    const clientId = selectedClientId || 0;
    const [location, setLocation] = useLocation();

    // Parse query params manually since wouter doesn't have useSearchParams
    const searchParams = new URLSearchParams(window.location.search);
    const templateIdStr = searchParams.get('templateId');
    const templateId = templateIdStr ? parseInt(templateIdStr) : null;

    const { data: templates, isLoading: templatesLoading } = trpc.privacyEnhancements.dpiaTemplates.list.useQuery({ clientId }, { enabled: !!clientId });
    const selectedTemplate = templates?.find(t => t.id === templateId);

    const [responses, setResponses] = useState<Record<string, any>>({});
    const [projectTitle, setProjectTitle] = useState("");
    const [projectDesc, setProjectDesc] = useState("");

    useEffect(() => {
        if (selectedTemplate) {
            setProjectTitle(`${selectedTemplate.name} - ${new Date().toLocaleDateString()}`);
        }
    }, [selectedTemplate]);

    // Mutation to save assessment
    const saveMutation = trpc.privacy.saveAssessment.useMutation({
        onSuccess: () => {
            toast.success("DPIA saved successfully");
            setLocation(`/clients/${clientId}/privacy/dpia`);
        },
        onError: (err) => toast.error(`Failed to save: ${err.message}`)
    });

    const handleSave = () => {
        if (!selectedTemplate) return;
        if (!projectTitle) return toast.error("Please provide an assessment title");

        saveMutation.mutate({
            clientId,
            // We use a unique type string to allow multiple assessments of the same template
            type: `DPIA: ${projectTitle}`,
            responses: {
                projectDescription: projectDesc,
                answers: responses,
                templateVersion: selectedTemplate.version,
                templateId: selectedTemplate.id,
                templateName: selectedTemplate.name
            },
            riskLevel: "To Be Determined",
            recommendations: "Pending Review"
        });
    };

    if (templatesLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-24 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-[#3ABEF9]" />
                <p className="text-slate-400 font-medium animate-pulse">Loading assessment template...</p>
            </div>
        );
    }

    if (!selectedTemplate) {
        return (
            <div className="p-12 text-center space-y-4 animate-in fade-in duration-500">
                <div className="mx-auto h-20 w-20 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                    <AlertTriangle className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900">Template Not Found</h2>
                    <p className="text-slate-500 max-w-sm mx-auto">The requested assessment template could not be loaded or doesn't exist.</p>
                </div>
                <Button
                    variant="link"
                    onClick={() => setLocation(`/clients/${clientId}/privacy/dpia`)}
                    className="text-[#3ABEF9] font-bold"
                >
                    Return to DPIA Dashboard
                </Button>
            </div>
        );
    }

    const content = selectedTemplate.templateContent as any; // Type assertion

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-5xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLocation(`/clients/${clientId}/privacy/dpia`)}
                        className="h-11 w-11 rounded-xl hover:bg-slate-100 text-slate-500"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="space-y-0.5">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Initialize Assessment</h1>
                        <p className="text-slate-500 text-lg">Questionnaire: {selectedTemplate.name}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={handleSave}
                        disabled={saveMutation.isLoading}
                        className="bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-sky-100 transition-all active:scale-95"
                    >
                        {saveMutation.isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                        Finalize & Save
                    </Button>
                </div>
            </div>

            <div className="grid gap-8 max-w-5xl mx-auto w-full pb-20">
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden ring-1 ring-slate-200/50">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-xl font-bold text-slate-900">Core Assessment Details</CardTitle>
                        <CardDescription className="text-slate-500">Define the organizational scope and title for this DPIA project.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2.5">
                            <Label className="text-slate-700 font-bold">Assessment Instance Title</Label>
                            <Input
                                value={projectTitle}
                                onChange={e => setProjectTitle(e.target.value)}
                                placeholder="e.g. Q4 2024 CRM Integration Impact Assessment"
                                className="h-12 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                            />
                            <p className="text-xs text-slate-400">Provide a descriptive name to distinguish this assessment from others using the same template.</p>
                        </div>
                        <div className="space-y-2.5">
                            <Label className="text-slate-700 font-bold">Scope & Processing Context</Label>
                            <Textarea
                                className="min-h-[120px] rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20 p-4"
                                placeholder="Describe the nature, scope, context and purposes of the data processing activity..."
                                value={projectDesc}
                                onChange={e => setProjectDesc(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden ring-1 ring-slate-200/50">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-xl font-bold text-slate-900">Assessment Questionnaire</CardTitle>
                        <CardDescription className="text-slate-500">Respond to the screening questions to determine privacy risks.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-8">
                        {content?.screeningQuestions?.map((q: any) => (
                            <div key={q.id} className="space-y-4 group">
                                <Label className="flex items-start gap-3 text-lg font-bold text-slate-800 leading-snug">
                                    <div className="mt-1 h-5 w-5 rounded-full bg-sky-50 flex items-center justify-center text-[#3ABEF9] text-[10px] shrink-0 border border-sky-100">
                                        ?
                                    </div>
                                    <span className="flex-1">
                                        {q.question}
                                        {q.required && <span className="text-rose-500 ml-1 font-black">*</span>}
                                    </span>
                                </Label>
                                {q.description && (
                                    <div className="ml-8 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-500 italic">
                                        {q.description}
                                    </div>
                                )}

                                <div className="ml-8">
                                    {q.type === 'text' && (
                                        <Input
                                            value={responses[q.id] || ''}
                                            onChange={e => setResponses({ ...responses, [q.id]: e.target.value })}
                                            className="h-12 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                                            placeholder="Provide detailed response..."
                                        />
                                    )}

                                    {q.type === 'boolean' && (
                                        <Select
                                            value={responses[q.id]}
                                            onValueChange={val => setResponses({ ...responses, [q.id]: val })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                                <SelectValue placeholder="Select binary response..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="yes" className="font-medium text-emerald-600">Yes / Affirmative</SelectItem>
                                                <SelectItem value="no" className="font-medium text-slate-600">No / Negative</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}

                                    {q.type === 'select' && (
                                        <Select
                                            value={responses[q.id]}
                                            onValueChange={val => setResponses({ ...responses, [q.id]: val })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                                <SelectValue placeholder="Select from available options..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {q.options?.map((opt: string) => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                                <Separator className="mt-8 opacity-50" />
                            </div>
                        ))}
                        {(!content?.screeningQuestions || content.screeningQuestions.length === 0) && (
                            <div className="text-center py-12 text-slate-400 font-medium italic">
                                No questions are defined in this template configuration.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {content?.riskFactors && content.riskFactors.length > 0 && (
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-[#1C4D8D] text-white overflow-hidden overflow-hidden ring-1 ring-white/10">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <AlertTriangle className="h-6 w-6 text-amber-400" />
                                Identified Risk Catalysts
                            </CardTitle>
                            <CardDescription className="text-white/60">Key factors that may increase the overall risk profile based on this template.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="grid gap-3">
                                {content.riskFactors.map((r: any, idx: number) => (
                                    <div key={idx} className="p-4 bg-white/10 rounded-xl border border-white/10 flex gap-4 items-start">
                                        <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
                                            {idx + 1}
                                        </div>
                                        <div className="space-y-1">
                                            <span className="font-bold text-white block">{r.factor}</span>
                                            {r.description && <span className="text-xs text-white/50 leading-relaxed block">{r.description}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
