import React from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, Circle, Disc, Save, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@complianceos/ui/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface WizardLayoutProps {
    currentStep: number;
    totalSteps: number;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    onNext?: () => void;
    onBack?: () => void;
    onStepClick?: (step: number) => void;
    isNextDisabled?: boolean;
    isLoading?: boolean;
    clientId: number;
    pageGuide?: React.ReactNode;
}

const STEPS = [
    { id: 1, title: "Scope", description: "Boundaries" },
    { id: 2, title: "Stakeholders", description: "People" },
    { id: 3, title: "Documentation", description: "Evidence" },
    { id: 4, title: "Context", description: "Environment" },
    { id: 5, title: "Expectations", description: "Goals" },
    { id: 6, title: "Questionnaire", description: "Self-Assessment" },
    { id: 7, title: "Summary", description: "Review" },
];

export function WizardLayout({
    currentStep,
    totalSteps = 6,
    title,
    subtitle,
    children,
    onNext,
    onBack,
    onStepClick,
    isNextDisabled,
    isLoading,
    clientId,
    standardName = "ISO 27001", // Default for backward compatibility
    pageGuide
}: WizardLayoutProps & { standardName?: string }) {
    const progress = (currentStep / totalSteps) * 100;

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Immersive Header */}
            <header className="h-16 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-indigo-100/50 fixed top-0 w-full z-50 transition-all duration-300">
                <div className="flex items-center gap-6">
                    <Link href={`/clients/${clientId}/compliance`}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-slate-200" />
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm shadow-indigo-200">
                            <ShieldCheck className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-slate-800 tracking-tight">{standardName} Discovery & Scoping</h1>
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-24 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-indigo-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                    />
                                </div>
                                <span className="text-[10px] font-medium text-slate-500">{Math.round(progress)}% Complete</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {pageGuide}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 animate-pulse">
                            <Save className="h-3.5 w-3.5" />
                            <span>Saving progress...</span>
                        </div>
                    )}
                    <Link href={`/clients/${clientId}/compliance`}>
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 text-xs font-medium">
                            Save & Exit
                        </Button>
                    </Link>
                </div>
            </header>

            <div className="flex-1 flex pt-16">
                {/* Modern Sidebar Stepper */}
                <div className="w-72 bg-white border-r border-indigo-50/50 hidden lg:flex flex-col shrink-0 fixed h-full z-40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.02)]">
                    <div className="p-8 space-y-8 overflow-y-auto">
                        <div className="space-y-1">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Discovery Steps</h3>
                            <div className="relative">
                                {/* Connector Line */}
                                <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-slate-100" />

                                <div className="space-y-6 relative">
                                    {STEPS.map((step) => {
                                        const isActive = step.id === currentStep;
                                        const isCompleted = step.id < currentStep;

                                        return (
                                            <div
                                                key={step.id}
                                                className={cn(
                                                    "group flex gap-4 relative transition-all duration-200",
                                                    onStepClick && "cursor-pointer hover:bg-slate-50/80 p-1 -m-1 rounded-lg"
                                                )}
                                                onClick={() => onStepClick?.(step.id)}
                                            >
                                                <div className={cn(
                                                    "h-10 w-10 rounded-full border-[3px] flex items-center justify-center shrink-0 z-10 transition-all duration-300 bg-white",
                                                    isActive ? "border-indigo-600 shadow-md shadow-indigo-100 scale-110" :
                                                        isCompleted ? "border-emerald-500 bg-emerald-50" : "border-slate-200 group-hover:border-slate-300"
                                                )}>
                                                    {isCompleted ? (
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                    ) : isActive ? (
                                                        <span className="text-sm font-bold text-indigo-700">{step.id}</span>
                                                    ) : (
                                                        <span className="text-sm font-medium text-slate-400 group-hover:text-slate-500">{step.id}</span>
                                                    )}
                                                </div>
                                                <div className={cn("pt-1 transition-all duration-300", isActive ? "translate-x-1" : "")}>
                                                    <div className={cn(
                                                        "text-sm font-bold transition-colors mb-0.5",
                                                        isActive ? "text-indigo-900" : isCompleted ? "text-slate-700 group-hover:text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                                                    )}>
                                                        {step.title}
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-medium group-hover:text-slate-500">
                                                        {step.description}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <main className="flex-1 lg:ml-72 flex flex-col relative overflow-hidden bg-slate-50/50">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-soft-light"></div>

                    {/* Floating Orbs for Premium Feel */}
                    <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute top-40 -left-20 w-72 h-72 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-8 md:p-12 relative z-10">
                        <div className="mb-10">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={`header-${currentStep}`}
                            >
                                <h2 className="text-3xl font-bold text-slate-900 tracking-tight lg:text-4xl mb-3">{title}</h2>
                                {subtitle && <p className="text-lg text-slate-500 leading-relaxed max-w-2xl font-normal">{subtitle}</p>}
                            </motion.div>
                        </div>

                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20, scale: 0.98 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -20, scale: 0.98 }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} // smooth apple-like ease
                                className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 min-h-[500px]"
                            >
                                {children}
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation Footer */}
                        <div className="mt-10 flex items-center justify-between">
                            <Button
                                variant="ghost"
                                onClick={onBack}
                                disabled={currentStep === 1 || isLoading}
                                className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 h-11 px-6 text-sm font-medium"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>

                            <Button
                                onClick={onNext}
                                disabled={isNextDisabled || isLoading}
                                className={cn(
                                    "min-w-[140px] h-11 px-6 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 text-sm font-semibold tracking-wide",
                                    currentStep === totalSteps ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
                                )}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Savings...</span>
                                    </span>
                                ) : currentStep === totalSteps ? (
                                    "Complete Discovery"
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Next Component
                                        <ArrowLeft className="h-4 w-4 rotate-180" />
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
