import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

interface ProgressiveSection {
    id: string;
    title: string;
    description?: string;
    helpText?: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
    badge?: React.ReactNode;
}

interface ProgressiveFormProps {
    sections: ProgressiveSection[];
    expandedByDefault?: boolean;
}

export function ProgressiveForm({ sections, expandedByDefault = false }: ProgressiveFormProps) {
    const [openSections, setOpenSections] = useState<Set<string>>(
        new Set(sections.filter(s => s.defaultOpen || expandedByDefault).map(s => s.id))
    );

    const toggleSection = (id: string) => {
        const newOpen = new Set(openSections);
        if (newOpen.has(id)) {
            newOpen.delete(id);
        } else {
            newOpen.add(id);
        }
        setOpenSections(newOpen);
    };

    const expandAll = () => setOpenSections(new Set(sections.map(s => s.id)));
    const collapseAll = () => setOpenSections(new Set());

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={expandAll}>
                    Expand All
                </Button>
                <Button variant="ghost" size="sm" onClick={collapseAll}>
                    Collapse All
                </Button>
            </div>

            {sections.map((section, index) => (
                <Collapsible
                    key={section.id}
                    open={openSections.has(section.id)}
                    onOpenChange={() => toggleSection(section.id)}
                >
                    <div className="border rounded-lg overflow-hidden">
                        <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-gray-900 dark:text-gray-100">{section.title}</h3>
                                            {section.badge}
                                            {section.helpText && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        {section.helpText}
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                        {section.description && (
                                            <p className="text-sm text-muted-foreground">{section.description}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {openSections.has(section.id) ? (
                                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="p-4 border-t">
                                {section.children}
                            </div>
                        </CollapsibleContent>
                    </div>
                </Collapsible>
            ))}
        </div>
    );
}

// Utility hook for progressive disclosure logic
export function useProgressiveDisclosure(initialStep: number = 0, totalSteps: number) {
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

    const goToStep = (step: number) => {
        if (step >= 0 && step < totalSteps) {
            setCurrentStep(step);
        }
    };

    const completeStep = (step: number) => {
        setCompletedSteps(prev => new Set([...prev, step]));
    };

    const nextStep = () => {
        completeStep(currentStep);
        goToStep(currentStep + 1);
    };

    const prevStep = () => {
        goToStep(currentStep - 1);
    };

    const isStepComplete = (step: number) => completedSteps.has(step);
    const isStepAccessible = (step: number) => step <= currentStep || isStepComplete(step);

    return {
        currentStep,
        completedSteps,
        goToStep,
        completeStep,
        nextStep,
        prevStep,
        isStepComplete,
        isStepAccessible,
        isFirstStep: currentStep === 0,
        isLastStep: currentStep === totalSteps - 1,
        progress: Math.round((completedSteps.size / totalSteps) * 100)
    };
}

export default ProgressiveForm;

