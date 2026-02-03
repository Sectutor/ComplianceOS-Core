
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Switch } from "@complianceos/ui/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Check, ChevronRight, Loader2, Wand2, BookOpen } from "lucide-react";
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

interface FrameworkSelectorWizardProps {
    clientId: number;
    onCancel: () => void;
}

const FRAMEWORKS = [
    { id: 'ISO27001', name: 'ISO 27001:2022', description: 'Information Security Management System (ISMS)', icon: '🛡️' },
    { id: 'SOC2', name: 'SOC 2 Type II', description: 'Service Organization Control for Service Providers', icon: '☁️' },
    { id: 'GDPR', name: 'GDPR', description: 'General Data Protection Regulation', icon: '🇪🇺' },
    { id: 'NISTCSF', name: 'NIST CSF 2.0', description: 'Comprehensive Cybersecurity Framework', icon: '🇺🇸' },
    { id: 'HIPAA', name: 'HIPAA', description: 'Healthcare Privacy and Security Compliance', icon: '🏥' },
    { id: 'PCIDSS', name: 'PCI DSS 4.0', description: 'Payment Card Industry Security Standard', icon: '💳' },
    { id: 'DORA', name: 'DORA', description: 'Digital Operational Resilience Act (EU Finance)', icon: '🏛️' },
];

export default function FrameworkSelectorWizard({ clientId, onCancel }: FrameworkSelectorWizardProps) {
    const [, setLocation] = useLocation();
    const [step, setStep] = useState(1);
    const [selectedFramework, setSelectedFramework] = useState<string>('');
    const [context, setContext] = useState('');
    const [useAi, setUseAi] = useState(false);

    // Mutations
    const createPlanMutation = trpc.compliancePlanning.generatePlan.useMutation({
        onSuccess: (data) => {
            toast.success(`Plan Created: ${data.framework}`, { description: `Generated ${data.taskCount} tasks.` });
            setLocation(`/clients/${clientId}/implementation/kanban/${data.planId}`);
        },
        onError: (err) => {
            toast.error("Failed to create plan", { description: err.message });
        }
    });

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSubmit = () => {
        if (!selectedFramework) return;

        createPlanMutation.mutate({
            clientId,
            framework: selectedFramework,
            useAi,
            context: useAi ? context : undefined
        });
    };

    return (
        <div className="max-w-3xl mx-auto py-10">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {step > s ? <Check className="w-4 h-4" /> : s}
                        </div>
                        {s < 3 && (
                            <div className={`w-16 h-1 mx-2 rounded ${step > s ? 'bg-blue-600' : 'bg-slate-100'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            <Card className="shadow-lg border-slate-200">
                <CardHeader>
                    <CardTitle>
                        {step === 1 && "Select Framework"}
                        {step === 2 && "Configuration"}
                        {step === 3 && "Review & Generate"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && "Choose the compliance framework you want to implement."}
                        {step === 2 && "Customize how the plan should be generated."}
                        {step === 3 && "Review your choices and generate the implementation plan."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="min-h-[300px]">
                    {step === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {FRAMEWORKS.map((fw) => (
                                <div
                                    key={fw.id}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-blue-300 ${selectedFramework === fw.id
                                        ? 'border-blue-600 bg-blue-50/50'
                                        : 'border-slate-100 bg-white'
                                        }`}
                                    onClick={() => setSelectedFramework(fw.id)}
                                >
                                    <div className="text-3xl mb-3">{fw.icon}</div>
                                    <h3 className="font-semibold text-slate-900">{fw.name}</h3>
                                    <p className="text-sm text-slate-500 mt-1">{fw.description}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-4 p-4 border rounded-lg bg-slate-50">
                                <div className="p-2 bg-white rounded-md shadow-sm">
                                    {useAi ? <Wand2 className="w-6 h-6 text-purple-600" /> : <BookOpen className="w-6 h-6 text-blue-600" />}
                                </div>
                                <div className="flex-1">
                                    <Label htmlFor="ai-mode" className="text-base font-medium">AI-Assisted Generation</Label>
                                    <p className="text-sm text-slate-500">
                                        {useAi
                                            ? "AI will tailor the plan to your specific context."
                                            : "Use the standard, best-practice template for this framework."}
                                    </p>
                                </div>
                                <Switch
                                    id="ai-mode"
                                    checked={useAi}
                                    onCheckedChange={setUseAi}
                                />
                            </div>

                            {useAi && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <Label>Organization Context</Label>
                                    <Textarea
                                        placeholder="Describe your organization (e.g., SaaS B2B, 50 employees, AWS hosted, remote first...)"
                                        value={context}
                                        onChange={(e) => setContext(e.target.value)}
                                        className="h-32"
                                    />
                                    <p className="text-xs text-slate-400">
                                        The AI will use this to prioritize tasks and estimate durations more accurately.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-6 rounded-lg text-center border border-slate-100">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                                    {FRAMEWORKS.find(f => f.id === selectedFramework)?.name}
                                </h3>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                                    {useAi ? "✨ Tailored AI Plan" : "📋 Standard Template"}
                                </div>

                                {useAi && context && (
                                    <div className="text-left bg-white p-4 rounded border text-sm text-slate-600 max-w-md mx-auto">
                                        <strong>Context:</strong> {context}
                                    </div>
                                )}
                            </div>

                            <div className="text-center text-slate-500 text-sm">
                                Click specific "Generate Plan" to create your roadmap. This may take a few seconds.
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between border-t border-slate-100 pt-6">
                    <Button variant="ghost" onClick={step === 1 ? onCancel : handleBack}>
                        {step === 1 ? "Cancel" : "Back"}
                    </Button>

                    {step < 3 ? (
                        <Button
                            onClick={handleNext}
                            disabled={!selectedFramework}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Next <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={createPlanMutation.isLoading}
                            className="bg-green-600 hover:bg-green-700 min-w-[140px]"
                        >
                            {createPlanMutation.isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Wand2 className="w-4 h-4 mr-2" />
                            )}
                            Generate Plan
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
