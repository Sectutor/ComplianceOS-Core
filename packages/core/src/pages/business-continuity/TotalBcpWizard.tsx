
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Shield, Activity, AlertTriangle, Layers, CheckCircle, ArrowRight, ArrowLeft, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Steps: 
// 1. Governance & Scope
// 2. Process Identification
// 3. Business Impact Analysis (BIA)
// 4. Recovery Strategies
// 5. Plan Generation

export default function TotalBcpWizard() {
    const params = useParams();
    const clientId = parseInt(params.id || "0");
    const [location, setLocation] = useLocation();
    const [currentStep, setCurrentStep] = useState(1);

    const steps = [
        { id: 1, title: "Governance", icon: Shield, color: "text-blue-500", bg: "bg-blue-50" },
        { id: 2, title: "Inventory", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-50" },
        { id: 3, title: "Impact", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
        { id: 4, title: "Strategies", icon: Layers, color: "text-purple-500", bg: "bg-purple-50" },
        { id: 5, title: "Finalize", icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
    ];

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Business Continuity Wizard</h1>
                        <p className="text-muted-foreground mt-2">
                            Step-by-step guidance to build your organization's resilience profile.
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => setLocation(`/clients/${clientId}/business-continuity`)}>
                        Exit Wizard
                    </Button>
                </div>

                {/* Progress Tracker */}
                <div className="flex items-center justify-between relative px-2">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -z-10 -translate-y-1/2 mx-12"></div>
                    {steps.map((step) => (
                        <div key={step.id} className="flex flex-col items-center gap-2">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                                currentStep === step.id ? "bg-white border-primary shadow-md scale-110" :
                                    currentStep > step.id ? "bg-primary border-primary text-white" : "bg-slate-100 border-slate-200 text-slate-500"
                            )}>
                                {currentStep > step.id ? <CheckCircle className="w-6 h-6" /> : <step.icon className="w-5 h-5" />}
                            </div>
                            <span className={cn(
                                "text-xs font-semibold uppercase tracking-wider",
                                currentStep === step.id ? "text-primary" : "text-slate-500"
                            )}>
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <Card className="min-h-[500px] flex flex-col shadow-xl border-slate-200">
                    <CardHeader className="border-b bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", steps[currentStep - 1].bg)}>
                                {React.createElement(steps[currentStep - 1].icon, { className: cn("w-6 h-6", steps[currentStep - 1].color) })}
                            </div>
                            <div>
                                <CardTitle>Step {currentStep}: {steps[currentStep - 1].title}</CardTitle>
                                <CardDescription>Complete this section to advance your business continuity readiness.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 p-8">
                        {currentStep === 1 && <GovernanceStep clientId={clientId} />}
                        {currentStep === 2 && <InventoryStep clientId={clientId} />}
                        {currentStep === 3 && <ImpactStep clientId={clientId} />}
                        {currentStep === 4 && <StrategiesStep clientId={clientId} />}
                        {currentStep === 5 && <FinalizeStep clientId={clientId} />}
                    </CardContent>

                    <CardFooter className="border-t bg-slate-50/50 py-4 flex justify-between">
                        <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <Button onClick={handleNext} disabled={currentStep === steps.length}>
                            {currentStep === steps.length ? "Complete Wizard" : "Next Step"} <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </DashboardLayout>
    );
}

// --- Internal Step Components ---

function GovernanceStep({ clientId }: { clientId: number }) {
    const { data: program } = trpc.businessContinuity.getProgram.useQuery({ clientId });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Program Policy & Charter</h3>
                    <p className="text-sm text-muted-foreground">
                        Every resilient organization starts with a clear policy. Define your continuity program scope and commitment.
                    </p>
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Current Status</h4>
                        {program ? (
                            <Badge className="bg-emerald-500">Active: {program.programName}</Badge>
                        ) : (
                            <Badge variant="secondary">Not Initialized</Badge>
                        )}
                    </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
                    <Info className="w-12 h-12 text-blue-400 mb-4" />
                    <h4 className="font-semibold">Need help defining scope?</h4>
                    <p className="text-xs text-muted-foreground mt-2 max-w-[250px]">
                        The Governance module helps you set up teams, budgets, and compliance frameworks.
                    </p>
                    <Button variant="link" size="sm" className="mt-2">Go to Governance Module</Button>
                </div>
            </div>
        </div>
    );
}

function InventoryStep({ clientId }: { clientId: number }) {
    const { data: processes, refetch } = trpc.businessContinuity.processes.getProcessesWithBiaStatus.useQuery({ clientId });
    const generateBia = trpc.businessContinuity.generateBiaDraft.useMutation({
        onSuccess: () => {
            toast.success("BIA Assessment initialized");
            refetch();
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Process Registry</h3>
                    <p className="text-sm text-muted-foreground">
                        Register all core business functions and trigger impact assessments.
                    </p>
                </div>
                <Badge variant="outline">{processes?.length || 0} Processes</Badge>
            </div>

            <div className="grid gap-3 mt-4">
                {processes?.map(p => (
                    <div key={p.id} className="p-4 border rounded-lg flex items-center justify-between bg-white hover:border-blue-200 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs",
                                p.criticalityTier?.includes("1") ? "bg-red-100 text-red-600" :
                                    p.criticalityTier?.includes("2") ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                            )}>
                                {p.criticalityTier?.split(" ")[0] || "T?"}
                            </div>
                            <div>
                                <div className="font-semibold text-slate-900">{p.name}</div>
                                <div className="text-xs text-muted-foreground">{p.department || "General"}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {p.hasBia ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 px-3 py-1">
                                    <CheckCircle className="w-3 h-3 mr-1.5" /> BIA {p.biaStatus}
                                </Badge>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                    onClick={() => generateBia.mutate({ 
                                        processId: p.id,
                                        clientId
                                    })}
                                    disabled={generateBia.isLoading}
                                >
                                    {generateBia.isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Activity className="w-3 h-3 mr-1.5" />}
                                    Assess BIA
                                </Button>
                            )}
                        </div>
                    </div>
                ))}

                {(!processes || processes.length === 0) && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50/50">
                        <p className="text-muted-foreground italic">No processes found in the registry.</p>
                        <Button variant="outline" size="sm" className="mt-4">Go to Process Registry</Button>
                    </div>
                )}
            </div>
        </div>
    );
}

function ImpactStep({ clientId }: { clientId: number }) {
    const { data: bias } = trpc.businessContinuity.bia.list.useQuery({ clientId });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Business Impact Analysis (BIA)</h3>
                    <p className="text-sm text-muted-foreground">
                        Determine MTPD and RTO/RPOs for each critical process.
                    </p>
                </div>
                <Badge variant="outline">{bias?.filter(b => b.status === "approved").length || 0} / {bias?.length || 0} Approved</Badge>
            </div>

            <div className="grid gap-3 mt-4">
                {bias?.map(b => (
                    <div key={b.id} className="p-4 border rounded-lg flex items-center justify-between bg-white hover:border-amber-200 transition-all">
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-amber-500" />
                            <div>
                                <div className="font-semibold">{b.title}</div>
                                <div className="text-xs text-muted-foreground">Process: {b.processName}</div>
                            </div>
                        </div>
                        <Badge className={cn(
                            "px-3 py-1",
                            b.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                            {b.status}
                        </Badge>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StrategiesStep({ clientId }: { clientId: number }) {
    const { data: strategies } = trpc.businessContinuity.strategies.list.useQuery({ clientId });

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Recovery Strategies</h3>
            <p className="text-sm text-muted-foreground">
                How will you recover? Define technology, people, and facility strategies to meet your RTO targets.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {strategies?.slice(0, 4).map(s => (
                    <div key={s.id} className="p-4 border rounded-lg hover:border-purple-200 hover:bg-purple-50/10 transition-colors">
                        <h4 className="font-medium flex items-center gap-2">
                            <Layers className="w-4 h-4 text-purple-500" /> {s.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FinalizeStep({ clientId }: { clientId: number }) {
    const { data: metrics } = trpc.businessContinuity.getDashboardMetrics.useQuery({ clientId });
    const [planId, setPlanId] = useState<number | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const createPlan = trpc.businessContinuity.plans.create.useMutation({
        onSuccess: (data) => {
            setPlanId(data[0].id);
            toast.success("Recovery Plan finalized!");
        }
    });

    const exportDoc = trpc.businessContinuity.plans.exportDocx.useMutation({
        onSuccess: (data) => {
            const link = document.createElement('a');
            link.href = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${data.base64}`;
            link.download = data.filename;
            link.click();
            toast.success("Document exported successfully");
        }
    });

    const handleFinalize = () => {
        setIsGenerating(true);
        createPlan.mutate({
            clientId,
            title: `Comprehensive BCP - ${new Date().toLocaleDateString()}`,
            version: "1.0",
            status: "approved",
            content: "{}" // Simplified for now
        });
    };

    return (
        <div className="space-y-8 text-center py-12">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-inner">
                {createPlan.isLoading ? <Loader2 className="w-12 h-12 animate-spin" /> : <CheckCircle className="w-12 h-12" />}
            </div>

            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Resilience Score: {metrics?.readinessScore || 0}%</h2>
                <p className="text-muted-foreground max-w-[500px] mx-auto">
                    {metrics?.readinessScore && metrics.readinessScore > 70
                        ? "Your organization has a highly mature continuity profile. You are ready to generate your official BCP."
                        : "Your continuity profile is still developing. You can generate a draft BCP now or continue refining your BIAs."}
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
                {!planId ? (
                    <Button size="lg" className="bg-green-600 hover:bg-green-700" onClick={handleFinalize} disabled={createPlan.isLoading}>
                        {createPlan.isLoading ? "Finalizing..." : "Finalize & Approve Plan"}
                    </Button>
                ) : (
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => exportDoc.mutate({ id: planId })} disabled={exportDoc.isLoading}>
                        {exportDoc.isLoading ? "Exporting..." : "Download Official BCP (DOCX)"}
                    </Button>
                )}
                <Button size="lg" variant="outline">
                    View Plan Analytics
                </Button>
            </div>
        </div>
    );
}
