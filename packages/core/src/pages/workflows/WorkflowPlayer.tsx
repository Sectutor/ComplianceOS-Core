
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Circle,
    Disc,
    ExternalLink,
    ChevronRight,
    Info,
    Layers,
    FileText,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WORKFLOWS } from "@/lib/workflows/rmf-step-data";

export default function WorkflowPlayer() {
    const params = useParams();
    const [, navigate] = useLocation();
    const clientId = Number(params.id);
    const workflowId = params.workflowId || "";
    const workflow = WORKFLOWS[workflowId];

    const [currentStepIdx, setCurrentStepIdx] = useState(() => {
        try {
            const saved = localStorage.getItem(`workflow-progress-${clientId}-${workflowId}`);
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            return 0;
        }
    });

    React.useEffect(() => {
        try {
            localStorage.setItem(`workflow-progress-${clientId}-${workflowId}`, currentStepIdx.toString());
        } catch (e) {
            console.error("Failed to save progress", e);
        }
    }, [currentStepIdx, clientId, workflowId]);

    if (!workflow) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold">Workflow not found</h2>
                    <Button className="mt-4" onClick={() => navigate(`/clients/${clientId}/workflows`)}>Return to Hub</Button>
                </div>
            </DashboardLayout>
        );
    }

    const currentStep = workflow.steps[currentStepIdx];
    const totalSteps = workflow.steps.length;
    const progress = ((currentStepIdx + 1) / totalSteps) * 100;

    const handleNext = () => {
        if (currentStepIdx < totalSteps - 1) {
            setCurrentStepIdx(curr => curr + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        if (currentStepIdx > 0) {
            setCurrentStepIdx(curr => curr - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full -m-4 md:-m-6 bg-slate-50/50">
                {/* Playbook Header */}
                <header className="bg-white border-b border-slate-200 h-20 flex items-center px-8 justify-between shrink-0 sticky top-0 z-50 backdrop-blur-md bg-white/90">
                    <div className="flex items-center gap-6">
                        <Link href={`/clients/${clientId}/workflows`}>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 transition-colors">
                                <ArrowLeft className="h-5 w-5 text-slate-500" />
                            </Button>
                        </Link>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border-blue-100">Playbook Engine</Badge>
                                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">{workflow.title}</h1>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 ">
                                <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="text-xs font-bold text-slate-500">Step {currentStepIdx + 1} of {totalSteps}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="border-slate-200 font-bold hover:bg-slate-50">Save Progress</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-100">Complete Phase</Button>
                    </div>
                </header>

                <div className="flex flex-1 min-h-[calc(100vh-5rem-4rem)]">
                    {/* Sidebar Navigation */}
                    <aside className="w-80 bg-white border-r border-slate-200 p-6 hidden lg:block shrink-0 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 px-3 py-2 text-slate-400">
                                <Layers className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Lifecycle Stages</span>
                            </div>
                            <nav className="space-y-1">
                                {workflow.steps.map((step, idx) => {
                                    const isActive = idx === currentStepIdx;
                                    const isCompleted = idx < currentStepIdx;

                                    return (
                                        <button
                                            key={step.id}
                                            onClick={() => setCurrentStepIdx(idx)}
                                            className={cn(
                                                "w-full flex items-start gap-4 px-4 py-4 rounded-xl text-left transition-all duration-200 group",
                                                isActive ? "bg-blue-600 text-white shadow-xl shadow-blue-100" : "text-slate-500 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="mt-0.5">
                                                {isCompleted ? (
                                                    <CheckCircle2 className={cn("h-5 w-5", isActive ? "text-white" : "text-emerald-500")} />
                                                ) : isActive ? (
                                                    <Disc className="h-5 w-5 text-white animate-pulse" />
                                                ) : (
                                                    <Circle className="h-5 w-5 text-slate-200 group-hover:text-slate-300" />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className={cn("text-sm font-bold", isActive ? "text-white" : "text-slate-900")}>{step.title}</span>
                                                {!isCollapsed && <span className={cn("text-[10px] leading-relaxed line-clamp-1", isActive ? "text-blue-100" : "text-slate-400")}>{step.description}</span>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Execution Area */}
                    <main className="flex-1 p-8 lg:p-12 overflow-y-auto bg-[url('/grid.svg')]">
                        <div className="max-w-4xl mx-auto space-y-10">
                            {/* Content Card */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg">
                                            {currentStepIdx + 1}
                                        </div>
                                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">{currentStep.title}</h2>
                                    </div>
                                    <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-3xl">
                                        {currentStep.longDescription}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                                    {/* Actionable Tasks */}
                                    <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-200">
                                        <CardHeader className="bg-slate-50 border-b py-4">
                                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                Step Objectives & Education
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="divide-y divide-slate-100">
                                                {currentStep.tasks.map((task, i) => (
                                                    <div key={i} className="flex items-start gap-4 p-6 hover:bg-slate-50/50 transition-all group">
                                                        <div className="mt-1 flex-shrink-0">
                                                            <input type="checkbox" className="h-5 w-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-600 transition-all cursor-pointer shadow-sm" />
                                                        </div>
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="text-base font-black text-slate-900 leading-none group-hover:text-blue-600 transition-colors uppercase tracking-tight">{task.title}</span>
                                                            <span className="text-xs font-medium text-slate-500 leading-relaxed italic">{task.description}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Context & Tools */}
                                    <div className="space-y-6">
                                        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                                                <Layers size={120} />
                                            </div>
                                            <div className="relative z-10 space-y-4">
                                                <Badge className="bg-primary hover:bg-primary text-primary-foreground border-none text-[10px] font-black tracking-widest uppercase">What's Next?</Badge>
                                                {currentStepIdx < totalSteps - 1 ? (
                                                    <>
                                                        <h3 className="text-2xl font-black tracking-tight">{workflow.steps[currentStepIdx + 1].title}</h3>
                                                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                                            {workflow.steps[currentStepIdx + 1].description}
                                                        </p>
                                                        <Button
                                                            variant="secondary"
                                                            className="w-full mt-4 font-black rounded-xl h-12 bg-white text-slate-900 hover:bg-slate-100"
                                                            onClick={handleNext}
                                                        >
                                                            Preview Next Stage
                                                            <ArrowRight className="ml-2 h-4 w-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <h3 className="text-2xl font-black tracking-tight">Certification Ready</h3>
                                                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                                            You are at the final stage. Review your artifacts and prepare for authorization.
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {currentStep.link && (
                                            <Card className="border-blue-100 bg-blue-50/30 overflow-hidden group/card hover:border-blue-300 transition-all cursor-pointer" onClick={() => navigate(`/clients/${clientId}${currentStep.link}`)}>
                                                <CardHeader className="pb-2">
                                                    <div className="h-10 w-10 text-blue-600 mb-2">
                                                        <ExternalLink size={24} />
                                                    </div>
                                                    <CardTitle className="text-lg font-bold text-blue-900">Recommended Tool</CardTitle>
                                                    <CardDescription className="text-blue-700/70 font-medium">This phase is supported by the following integrated module.</CardDescription>
                                                </CardHeader>
                                                <CardContent className="pt-2">
                                                    <Button variant="link" className="p-0 text-blue-600 font-black h-auto gap-2 group-hover/card:translate-x-1 transition-transform">
                                                        {currentStep.linkLabel}
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {currentStep.artifacts && (
                                            <Card className="border-slate-200 shadow-sm">
                                                <CardHeader className="py-4">
                                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                        <FileText className="h-4 w-4" />
                                                        Required Artifacts
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    {currentStep.artifacts.map((art, i) => (
                                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border bg-white border-slate-100 hover:border-slate-300 transition-all">
                                                            <span className="text-xs font-bold text-slate-700">{art}</span>
                                                            <Badge variant="secondary" className="text-[9px] font-black tracking-tighter opacity-70">MISSING</Badge>
                                                        </div>
                                                    ))}
                                                </CardContent>
                                            </Card>
                                        )}

                                        <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl space-y-3">
                                            <div className="flex items-center gap-2 text-amber-600">
                                                <AlertCircle className="h-4 w-4" />
                                                <span className="text-xs font-black uppercase tracking-widest">Compliance Tip</span>
                                            </div>
                                            <p className="text-xs font-medium text-amber-800 leading-relaxed italic">
                                                "Remember that NIST RMF is iterative. Outputs from this step will be critical inputs for the upcoming security assessments."
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Footer */}
                            <div className="flex items-center justify-between pt-12 border-t border-slate-200 pb-20">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={handleBack}
                                    disabled={currentStepIdx === 0}
                                    className="h-14 px-8 border-slate-200 font-bold gap-2 text-slate-500 rounded-2xl"
                                >
                                    <ArrowLeft className="h-5 w-5" /> Previous Phase
                                </Button>
                                <Button
                                    size="lg"
                                    onClick={handleNext}
                                    className="h-14 px-10 bg-slate-900 hover:bg-black text-white font-bold gap-2 rounded-2xl shadow-2xl transition-all active:scale-95"
                                >
                                    {currentStepIdx === totalSteps - 1 ? "Finish Journey" : "Next Phase"}
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </DashboardLayout>
    );
}

// Fixed missing import for isCollapsed (using local state for MVP or just removing it)
const isCollapsed = false;
