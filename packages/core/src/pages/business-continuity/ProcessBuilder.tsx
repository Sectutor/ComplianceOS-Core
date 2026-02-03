
import React, { useState } from 'react';
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader2, ArrowLeft, Check, GitGraph, Clock, Building, Save, Info, ChevronRight, Activity, ShieldAlert, Trash2 } from "lucide-react";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { ResourceDependencyEditor } from "@/components/business-continuity/ResourceDependencyEditor";

export default function ProcessBuilder() {
    const [location, setLocation] = useLocation();
    const [match, params] = useRoute("/clients/:clientId/business-continuity/processes/:action");
    const clientId = params?.clientId ? parseInt(params.clientId) : 0;
    const processId = params?.action && params.action !== 'new' ? parseInt(params.action) : undefined;
    const isNew = !processId;

    const { data: processes } = trpc.businessContinuity.processes.list.useQuery({ clientId }, { enabled: !!clientId });
    const { data: existingProcess, isLoading: isLoadingProcess, refetch: refetchProcess } = trpc.businessContinuity.processes.get.useQuery(
        { id: processId!, clientId },
        { enabled: !!processId && !!clientId }
    );

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        department: "",
        ownerId: undefined as number | undefined,
        parentId: undefined as number | undefined,
        description: "",
        criticalityTier: "Tier 2",
        rto: "24h",
        rpo: "4h",
        mtpd: "72h",
        upstreamDependencies: [] as number[],
        downstreamDependencies: [] as number[],
    });

    // Populate form if editing
    React.useEffect(() => {
        if (existingProcess && !isNew) {
            setFormData({
                name: existingProcess.name,
                department: existingProcess.department || "",
                ownerId: existingProcess.ownerId || undefined,
                parentId: existingProcess.parentId || undefined,
                description: existingProcess.description || "",
                criticalityTier: existingProcess.criticalityTier || "Tier 2",
                rto: existingProcess.rto || "24h",
                rpo: existingProcess.rpo || "4h",
                mtpd: existingProcess.mtpd || "72h",
                upstreamDependencies: [], // Dependencies editing is separate or TODO
                downstreamDependencies: [],
            });
        }
    }, [existingProcess, isNew]);

    const createMutation = trpc.businessContinuity.processes.create.useMutation({
        onSuccess: () => {
            toast.success("Process definition saved successfully");
            setLocation(`/clients/${clientId}/business-continuity/processes`);
        },
        onError: (err) => toast.error(`Error: ${err.message}`)
    });

    const updateMutation = trpc.businessContinuity.processes.update.useMutation({
        onSuccess: () => {
            toast.success("Process updated successfully");
            setLocation(`/clients/${clientId}/business-continuity/processes`);
        },
        onError: (err) => toast.error(`Error: ${err.message}`)
    });

    const deleteMutation = trpc.businessContinuity.processes.delete.useMutation({
        onSuccess: () => {
            toast.success("Process deleted successfully");
            setLocation(`/clients/${clientId}/business-continuity/processes`);
        },
        onError: (err) => toast.error(`Delete Error: ${err.message}`)
    });

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this process? This action cannot be undone.")) return;

        try {
            await deleteMutation.mutateAsync({ 
                id: processId!,
                clientId
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (isNew) {
                await createMutation.mutateAsync({
                    clientId,
                    name: formData.name,
                    department: formData.department,
                    description: formData.description,
                    criticalityTier: formData.criticalityTier,
                    rto: formData.rto,
                    rpo: formData.rpo,
                    mtpd: formData.mtpd,
                    parentId: formData.parentId,
                });
            } else {
                await updateMutation.mutateAsync({
                    id: processId!,
                    clientId,
                    name: formData.name,
                    department: formData.department,
                    description: formData.description,
                    criticalityTier: formData.criticalityTier,
                    rto: formData.rto,
                    rpo: formData.rpo,
                    mtpd: formData.mtpd,
                    parentId: formData.parentId,
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        { id: 1, title: "Core Definition", description: "Identity & Ownership", icon: Building },
        { id: 2, title: "Recovery Metrics", description: "RTO, RPO & MTPD", icon: Clock },
        { id: 3, title: "Dependencies", description: "Upstream & Downstream", icon: GitGraph },
    ];

    return (
        <DashboardLayout>
            <div className="min-h-[calc(100vh-4rem)] bg-background p-6 lg:p-10">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="pl-0 hover:pl-2 transition-all text-muted-foreground mb-2"
                                onClick={() => setLocation(`/clients/${clientId}/business-continuity/processes`)}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Registry
                            </Button>
                            <div className="flex items-center justify-between min-w-[300px]">
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                        {isNew ? "Design Business Process" : "Edit Process"}
                                    </h1>
                                    <p className="text-muted-foreground mt-1 text-lg">
                                        Define the operational parameters and resilience requirements.
                                    </p>
                                </div>
                                {!isNew && (
                                    <Button variant="destructive" size="sm" onClick={handleDelete} className="ml-4 gap-2">
                                        <Trash2 className="h-4 w-4" /> Delete
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Left Sidebar - Stepper */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-card rounded-2xl shadow-sm border p-6">
                                <nav aria-label="Progress">
                                    <ol role="list" className="overflow-hidden">
                                        {steps.map((currentStep, stepIdx) => (
                                            <li key={currentStep.id} className={cn(stepIdx !== steps.length - 1 ? "pb-10" : "", "relative")}>
                                                {stepIdx !== steps.length - 1 ? (
                                                    <div className={cn(
                                                        "absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5",
                                                        step > currentStep.id ? "bg-primary" : "bg-muted"
                                                    )} aria-hidden="true" />
                                                ) : null}
                                                <div className="group relative flex items-start cursor-pointer" onClick={() => step > currentStep.id && setStep(currentStep.id)}>
                                                    <span className="flex h-9 items-center">
                                                        <span className={cn(
                                                            "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-200",
                                                            step > currentStep.id ? "bg-primary border-primary" :
                                                                step === currentStep.id ? "border-primary bg-card" : "border-muted bg-card"
                                                        )}>
                                                            {step > currentStep.id ? (
                                                                <Check className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
                                                            ) : (
                                                                <currentStep.icon className={cn("h-4 w-4", step === currentStep.id ? "text-primary" : "text-muted-foreground")} />
                                                            )}
                                                        </span>
                                                    </span>
                                                    <span className="ml-4 flex min-w-0 flex-col">
                                                        <span className={cn("text-sm font-semibold tracking-wide", step === currentStep.id ? "text-primary" : "text-muted-foreground")}>{currentStep.title}</span>
                                                        <span className="text-sm text-muted-foreground">{currentStep.description}</span>
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                </nav>
                            </div>

                            {/* Dynamic Context Help Card */}
                            <AnimatePresence mode="wait">
                                {step === 2 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="bg-accent/10 rounded-2xl p-6 border border-accent/20"
                                    >
                                        <div className="flex items-center gap-2 mb-4">
                                            <Activity className="h-5 w-5 text-accent" />
                                            <h3 className="font-semibold text-foreground">Advisor Tips</h3>
                                        </div>
                                        <div className="space-y-4 text-sm text-muted-foreground">
                                            <div>
                                                <strong className="block mb-1 text-foreground">RTO (Recovery Time Objective)</strong>
                                                <p>Maximum allowed downtime. e.g. An e-commerce site might have RTO = 1 hour.</p>
                                            </div>
                                            <div>
                                                <strong className="block mb-1 text-foreground">RPO (Recovery Point Objective)</strong>
                                                <p>Maximum data loss allowed. e.g. Losing 24h of emails might be acceptable, but 0 banking transactions.</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Right Content - Form Wizard */}
                        <div className="lg:col-span-8">
                            <Card className="border shadow-sm bg-card overflow-hidden h-full">
                                <CardContent className="p-8">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={step}
                                            initial={{ x: 20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: -20, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="min-h-[400px]"
                                        >
                                            {step === 1 && (
                                                <div className="space-y-6">
                                                    <div className="grid gap-6 md:grid-cols-2">
                                                        <div className="space-y-2">
                                                            <Label className="text-base">Process Name</Label>
                                                            <Input
                                                                className="h-12 bg-background"
                                                                placeholder="e.g. Employee Payroll"
                                                                value={formData.name}
                                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-base">Department</Label>
                                                            <Input
                                                                className="h-12 bg-background"
                                                                placeholder="e.g. HR / Finance"
                                                                value={formData.department}
                                                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-base">Criticality Tier</Label>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {["Tier 1 (Mission Critical)", "Tier 2 (Business Critical)", "Tier 3 (Operational)", "Tier 4 (Non-Critical)"].map((tier) => (
                                                                <div
                                                                    key={tier}
                                                                    className={cn(
                                                                        "cursor-pointer rounded-lg border p-4 transition-all hover:border-primary",
                                                                        formData.criticalityTier === tier.split(' ')[0] + ' ' + tier.split(' ')[1]
                                                                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                                            : "bg-background"
                                                                    )}
                                                                    onClick={() => setFormData({ ...formData, criticalityTier: tier.split(' ')[0] + ' ' + tier.split(' ')[1] })}
                                                                >
                                                                    <div className="font-medium text-foreground">{tier}</div>
                                                                    <div className="text-xs text-muted-foreground mt-1">
                                                                        {tier.includes("Tier 1") ? "Must recover < 4hrs. Customer facing." :
                                                                            tier.includes("Tier 2") ? "Recover < 24hrs. Internal dependencies." :
                                                                                tier.includes("Tier 3") ? "Recover < 72hrs. Manual workarounds exist." : "Deferrable."}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-base">Parent Process (Optional)</Label>
                                                        <Select
                                                            value={formData.parentId ? formData.parentId.toString() : "none"}
                                                            onValueChange={(val) => setFormData({ ...formData, parentId: val === "none" ? undefined : parseInt(val) })}
                                                        >
                                                            <SelectTrigger className="h-12 bg-background">
                                                                <SelectValue placeholder="Select parent process..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">No Parent (Top Level)</SelectItem>
                                                                {processes?.filter(p => p.id !== undefined).map((p) => (
                                                                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <p className="text-xs text-muted-foreground">Select if this is a sub-process of a larger function.</p>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-base">Description</Label>
                                                        <Textarea
                                                            className="min-h-[120px] bg-background resize-none"
                                                            placeholder="Describe the objective, inputs, and outputs of this process..."
                                                            value={formData.description}
                                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {step === 2 && (
                                                <div className="space-y-8">
                                                    <div className="grid gap-6 md:grid-cols-3">
                                                        <div className="p-4 rounded-xl border bg-background space-y-3">
                                                            <div className="flex items-center gap-2 text-primary font-semibold">
                                                                <Clock className="w-5 h-5" /> RTO
                                                            </div>
                                                            <Input
                                                                className="h-10"
                                                                value={formData.rto}
                                                                onChange={e => setFormData({ ...formData, rto: e.target.value })}
                                                            />
                                                            <p className="text-xs text-muted-foreground">Recovery Time Objective</p>
                                                        </div>
                                                        <div className="p-4 rounded-xl border bg-background space-y-3">
                                                            <div className="flex items-center gap-2 text-primary font-semibold">
                                                                <Activity className="w-5 h-5" /> RPO
                                                            </div>
                                                            <Input
                                                                className="h-10"
                                                                value={formData.rpo}
                                                                onChange={e => setFormData({ ...formData, rpo: e.target.value })}
                                                            />
                                                            <p className="text-xs text-muted-foreground">Recovery Point Objective</p>
                                                        </div>
                                                        <div className="p-4 rounded-xl border bg-background space-y-3">
                                                            <div className="flex items-center gap-2 text-destructive font-semibold">
                                                                <ShieldAlert className="w-5 h-5" /> MTPD
                                                            </div>
                                                            <Input
                                                                className="h-10"
                                                                value={formData.mtpd}
                                                                onChange={e => setFormData({ ...formData, mtpd: e.target.value })}
                                                            />
                                                            <p className="text-xs text-muted-foreground">Max Tolerable Period</p>
                                                        </div>
                                                    </div>

                                                    {/* Visual Timeline (Static representation for aesthetic) */}
                                                    <div className="mt-8 pt-8 border-t relative">
                                                        <Label className="mb-4 block">Recovery Timeline Visualization</Label>
                                                        <div className="h-2 bg-muted rounded-full w-full relative">
                                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-destructive rounded-full border-4 border-background shadow-sm" title="Disaster"></div>
                                                            <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-4 h-4 bg-primary/70 rounded-full border-4 border-background shadow-sm" title="RPO"></div>
                                                            <div className="absolute left-[40%] top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-4 border-background shadow-sm" title="RTO"></div>
                                                            <div className="absolute left-[80%] top-1/2 -translate-y-1/2 w-4 h-4 bg-destructive rounded-full border-4 border-background shadow-sm" title="MTPD"></div>
                                                        </div>
                                                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                                            <span>Incident</span>
                                                            <span className="pl-12">RPO ({formData.rpo})</span>
                                                            <span className="pl-8">RTO ({formData.rto})</span>
                                                            <span>MTPD ({formData.mtpd})</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {step === 3 && (
                                                <div className="py-6">
                                                    {isNew ? (
                                                        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50">
                                                            <Save className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                                            <h3 className="text-lg font-semibold">Save Required</h3>
                                                            <p className="text-muted-foreground mb-6">Please save the initial process definition before mapping dependencies.</p>
                                                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Save & Continue
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <ResourceDependencyEditor
                                                            processId={processId!}
                                                            dependencies={(existingProcess?.dependencies as any[]) || []}
                                                            onUpdate={refetchProcess}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Action Footer */}
                                    <div className="flex justify-between items-center mt-12 pt-6 border-t">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setStep(s => Math.max(1, s - 1))}
                                            disabled={step === 1}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                        </Button>

                                        {step < 3 ? (
                                            <Button
                                                onClick={() => setStep(s => s + 1)}
                                                className="px-8 shadow-md"
                                            >
                                                Next Step
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting}
                                                className="px-8 shadow-md bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                <Save className="mr-2 h-4 w-4" /> Complete Setup
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
