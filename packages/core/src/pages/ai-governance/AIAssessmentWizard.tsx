
import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@complianceos/ui/ui/button';
import { Label } from '@complianceos/ui/ui/label';
import { Textarea } from '@complianceos/ui/ui/textarea';
import { Slider } from '@complianceos/ui/ui/slider';
import { Card, CardContent } from '@complianceos/ui/ui/card';
import { toast } from 'sonner';
import { Shield, AlertTriangle, Scale, Lock, ChevronRight, ChevronLeft } from 'lucide-react';

interface AIAssessmentWizardProps {
    aiSystemId: number;
    onComplete: () => void;
}

const steps = [
    { title: "Safety & Reliability", icon: Shield, color: "text-blue-500", key: "safetyImpact" },
    { title: "Bias & Fairness", icon: Scale, color: "text-purple-500", key: "biasImpact" },
    { title: "Privacy & Data", icon: Lock, color: "text-emerald-500", key: "privacyImpact" },
    { title: "Security & Robustness", icon: AlertTriangle, color: "text-orange-500", key: "securityImpact" }
];

export const AIAssessmentWizard = ({ aiSystemId, onComplete }: AIAssessmentWizardProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        safetyImpact: '',
        biasImpact: '',
        privacyImpact: '',
        securityImpact: '',
        overallRiskScore: 50,
        recommendations: ''
    });

    const addAssessment = trpc.ai.systems.addImpactAssessment.useMutation({
        onSuccess: () => {
            toast.success("Impact Assessment submitted successfully");
            onComplete();
        }
    });

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        } else {
            addAssessment.mutate({
                aiSystemId,
                ...formData
            });
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    const StepIcon = currentStep < steps.length ? steps[currentStep].icon : ChevronRight;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                {steps.map((s, idx) => (
                    <div key={idx} className="flex items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors ${idx <= currentStep ? 'bg-primary border-primary text-white' : 'border-muted text-muted-foreground'
                            }`}>
                            {idx < currentStep ? '✓' : idx + 1}
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`h-0.5 w-12 mx-2 ${idx < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                        )}
                    </div>
                ))}
            </div>

            {currentStep < steps.length ? (
                <Card className="border-muted/30 shadow-sm animate-in slide-in-from-right-4 duration-300">
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-xl bg-opacity-10 bg-current ${steps[currentStep].color}`}>
                                <StepIcon className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold">{steps[currentStep].title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground italic">
                            How does this AI system address {steps[currentStep].title.toLowerCase()}? List known risks and mitigation strategies.
                        </p>
                        <Textarea
                            placeholder="Enter your assessment details here..."
                            className="min-h-[150px] text-base leading-relaxed"
                            value={(formData as any)[steps[currentStep].key]}
                            onChange={(e) => setFormData({ ...formData, [steps[currentStep].key]: e.target.value })}
                        />
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-muted/30 shadow-sm animate-in slide-in-from-right-4 duration-300">
                    <CardContent className="pt-6 space-y-6">
                        <h3 className="text-xl font-bold">Final Review & recommendations</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <Label>Self-Assessed Overall Risk Score</Label>
                                <span className="font-bold text-primary">{formData.overallRiskScore} / 100</span>
                            </div>
                            <Slider
                                value={[formData.overallRiskScore]}
                                max={100}
                                step={1}
                                onValueChange={([val]) => setFormData({ ...formData, overallRiskScore: val })}
                                className="py-4"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Key Recommendations (MANAGE 1.1)</Label>
                            <Textarea
                                placeholder="State any immediate actions or required human-in-the-loop controls..."
                                className="min-h-[100px]"
                                value={formData.recommendations}
                                onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button onClick={handleNext} disabled={addAssessment.isPending}>
                    {currentStep < steps.length ? "Next Section" : "Submit Assessment"}
                    {currentStep < steps.length && <ChevronRight className="h-4 w-4 ml-2" />}
                </Button>
            </div>
        </div>
    );
};
