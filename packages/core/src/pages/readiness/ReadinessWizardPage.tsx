import React, { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { WizardLayout } from "@/components/readiness/WizardLayout";
import { WizardStep1_Scope } from "@/components/readiness/wizard/WizardStep1_Scope";
import { WizardStep2_Stakeholders } from "@/components/readiness/wizard/WizardStep2_Stakeholders";
import { WizardStep3_Docs } from "@/components/readiness/wizard/WizardStep3_Docs";
import { WizardStep4_Context } from "@/components/readiness/wizard/WizardStep4_Context";
import { WizardStep5_Expectations } from "@/components/readiness/wizard/WizardStep5_Expectations";
import { WizardStep6_Questionnaire } from "@/components/readiness/wizard/WizardStep6_Questionnaire";
import { WizardStep7_Summary } from "@/components/readiness/wizard/WizardStep7_Summary";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { READINESS_STANDARDS } from "@/data/readiness-standards";

export default function ReadinessWizardPage() {
    const [match, params] = useRoute("/clients/:clientId/readiness/wizard/:standardId?");
    const [, navigate] = useLocation();
    const clientId = parseInt(params?.clientId || "0");
    const routeStandardId = params?.standardId || "ISO27001";

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        scope: {},
        stakeholders: {},
        existingPolicies: {},
        context: {},
        expectations: {},
        questionnaireData: {},
        scopingReport: ""
    });
    const [standardId, setStandardId] = useState(routeStandardId);

    useEffect(() => {
        if (params?.standardId && params.standardId !== standardId) {
            setStandardId(params.standardId);
        }
    }, [params?.standardId]);

    // Load existing state
    const { data: serverState, isLoading } = trpc.readiness.getState.useQuery(
        { clientId, standardId: routeStandardId },
        {
            enabled: !!clientId,
        }
    );

    useEffect(() => {
        if (serverState) {
            setCurrentStep(serverState.currentStep || 1);
            setFormData({
                scope: (serverState.scopeDetails as any) || {},
                stakeholders: (serverState.stakeholders as any) || {},
                existingPolicies: (serverState.existingPolicies as any) || {},
                context: (serverState.businessContext as any) || {},
                expectations: (serverState.maturityExpectations as any) || {},
                questionnaireData: (serverState.questionnaireData as any) || {},
                scopingReport: serverState.scopingReport || ""
            });
            // if (serverState.standardId) setStandardId(serverState.standardId);
        }
    }, [serverState]);

    const mutation = trpc.readiness.createOrUpdate.useMutation({
        onSuccess: () => {
            // toast.success("Progress saved");
        },
        onError: (err) => {
            toast.error("Error saving progress", { description: err.message });
        }
    });

    const baselineMutation = trpc.readiness.baseline.useMutation({
        onSuccess: (data) => {
            toast.success(`${data.framework} Framework Initialized!`, { description: "Discovery setup is now mapped to your workspace." });
        },
        onError: (err) => {
            toast.error("Failed to initialize framework", { description: err.message });
        }
    });

    const handleDataChange = (stepKey: keyof typeof formData, newData: any) => {
        setFormData(prev => ({ ...prev, [stepKey]: newData }));
    };

    const handleNext = async () => {
        // Save without blocking UI transitions if possible, or use the layout's loading state gracefully
        // We use mutateAsync to ensure data is saved before moving, but we rely on the layout's internal transition for smoothness
        await mutation.mutateAsync({
            clientId,
            standardId,
            step: currentStep === 7 ? 7 : currentStep + 1,
            data: {
                scope: formData.scope,
                stakeholders: formData.stakeholders,
                existingPolicies: formData.existingPolicies,
                context: formData.context,
                expectations: formData.expectations,
                questionnaireData: formData.questionnaireData,
                scopingReport: formData.scopingReport
            }
        });

        if (currentStep < 7) {
            setCurrentStep(curr => curr + 1);
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // Final Step - Baseline
            try {
                await baselineMutation.mutateAsync({ clientId, standardId });
                toast.success("Discovery Setup Complete!", { description: "Redirecting to Dashboard..." });
                navigate(`/clients/${clientId}/compliance`);
            } catch (e) {
                // Error handled by mutation onError
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(curr => curr - 1);
        }
    };

    const handleStepClick = (step: number) => {
        if (isLoading) return;
        setCurrentStep(step);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getStepContent = () => {
        switch (currentStep) {
            case 1:
                return <WizardStep1_Scope
                    data={formData.scope}
                    onChange={(d) => handleDataChange("scope", d)}
                    standardId={standardId}
                />;
            case 2:

                return <WizardStep2_Stakeholders
                    data={formData.stakeholders}
                    onChange={(d) => handleDataChange("stakeholders", d)}
                    standardId={standardId}
                />;
            case 3:
                return <WizardStep3_Docs
                    data={formData.existingPolicies}
                    onChange={(d) => handleDataChange("existingPolicies", d)}
                    standardId={standardId}
                />;
            case 4:
                return <WizardStep4_Context
                    data={formData.context}
                    onChange={(d) => handleDataChange("context", d)}
                />;
            case 5:
                return <WizardStep5_Expectations
                    data={formData.expectations}
                    onChange={(d) => handleDataChange("expectations", d)}
                />;
            case 6:
                return <WizardStep6_Questionnaire
                    data={formData.questionnaireData}
                    onChange={(d) => handleDataChange("questionnaireData", d)}
                    standardId={standardId}
                />;
            case 7:
                return <WizardStep7_Summary
                    data={formData}
                    standardId={standardId}
                    onEditStep={handleStepClick}
                    onUpdate={(d) => {
                        setFormData(prev => ({ ...prev, scopingReport: d.scopingReport }));
                        // Auto-save on report generation
                        mutation.mutateAsync({
                            clientId,
                            standardId,
                            step: 7,
                            data: {
                                scope: formData.scope,
                                stakeholders: formData.stakeholders,
                                existingPolicies: formData.existingPolicies,
                                context: formData.context,
                                expectations: formData.expectations,
                                questionnaireData: formData.questionnaireData,
                                scopingReport: d.scopingReport
                            }
                        });
                    }}
                />;
            default: return null;
        }
    };

    const standardConfig = READINESS_STANDARDS[standardId] || READINESS_STANDARDS["ISO27001"];

    const titles = [
        standardConfig.steps.scope.title,
        standardConfig.steps.stakeholders.title,
        "Gather Existing Documentation",
        "Understand Business Context",
        "Clarify Maturity Expectations",
        "Readiness Questionnaire",
        "Discovery Summary & Review"
    ];

    const subtitles = [
        standardConfig.steps.scope.subtitle,
        standardConfig.steps.stakeholders.subtitle,
        "Do you have existing policies or evidence? Collect what exists - don't aim for perfection yet.",
        "Define the environment your security system operates in (Cloud, On-prem, Hybrid).",
        "Set your goals for this discovery assessment. What is the target compliance level?",
        "Answer the foundational requirements questions for this framework.",
        "Review everything we've gathered. Confirm the scope and business context to finalize your setup."
    ];

    if (isLoading) return (
        <DashboardLayout>
            <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC]">
                <div className="h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium animate-pulse">Loading assessment state...</p>
            </div>
        </DashboardLayout>
    );
    return (
        <DashboardLayout>
            <WizardLayout
                currentStep={currentStep}
                totalSteps={7}
                title={titles[currentStep - 1]}
                subtitle={subtitles[currentStep - 1]}
                onNext={handleNext}
                onBack={handleBack}
                onStepClick={handleStepClick}
                isLoading={mutation.isPending}
                clientId={clientId}
                embedded={true}
                standardName={standardId.replace('ISO', 'ISO ').replace('SOC', 'SOC ').replace('NIST', 'NIST ')}
            >
                {getStepContent()}
            </WizardLayout>
        </DashboardLayout>
    );
}
