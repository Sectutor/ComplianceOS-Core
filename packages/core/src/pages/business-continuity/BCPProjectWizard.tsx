
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Loader2, ArrowLeft, Calendar as CalendarIcon, Check, Users, Globe, Building } from "lucide-react";
import { toast } from "sonner";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@complianceos/ui/ui/popover";
import { Calendar } from "@complianceos/ui/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useClientContext } from "@/contexts/ClientContext";
import { StakeholderManager } from "@/components/business-continuity/StakeholderManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";

export default function BCPProjectWizard() {
    const { selectedClientId } = useClientContext();
    const [_, setLocation] = useLocation();

    const [step, setStep] = useState(1);
    const [projectId, setProjectId] = useState<number | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [scopeDescription, setScopeDescription] = useState("");
    const [geoScope, setGeoScope] = useState("Global");
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [targetDate, setTargetDate] = useState<Date | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createMutation = trpc.businessContinuity.projects.create.useMutation();

    const handleCreateProject = async () => {
        if (!title || !selectedClientId) {
            toast.error("Please fill in project title");
            return;
        }

        setIsSubmitting(true);
        try {
            const combinedScope = `[${geoScope}] ${scopeDescription}`;
            const project = await createMutation.mutateAsync({
                clientId: selectedClientId,
                title,
                scope: combinedScope,
                startDate: startDate?.toISOString(),
                targetDate: targetDate?.toISOString(),
            });
            toast.success("Project initialized");
            setProjectId(project.id);
            setStep(2);
        } catch (error) {
            console.error(error);
            toast.error("Failed to create project");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinish = () => {
        setLocation(`/clients/${selectedClientId}/business-continuity`); // Or project list
    };

    return (
        <DashboardLayout>
            <div className="p-8 max-w-5xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="pl-0 hover:bg-transparent" onClick={() => setLocation(`/clients/${selectedClientId}/business-continuity`)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">New BCP Cycle</h1>
                </div>

                {/* Stepper */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-4">
                        <StepIndicator current={step} number={1} title="Scope & Timeline" />
                        <div className="w-12 h-0.5 bg-muted" />
                        <StepIndicator current={step} number={2} title="Stakeholders" />
                        <div className="w-12 h-0.5 bg-muted" />
                        <StepIndicator current={step} number={3} title="Review" />
                    </div>
                </div>

                <div className="max-w-2xl mx-auto">
                    {step === 1 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Initiation</CardTitle>
                                <CardDescription>Define the boundaries and timeline for this BCP cycle.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Project Title <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. FY2026 Enterprise BCP Update"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Start Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Target Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !targetDate && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {targetDate ? format(targetDate, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={targetDate} onSelect={setTargetDate} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Geographic Scope</Label>
                                    <Select value={geoScope} onValueChange={setGeoScope}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Global">Global / All Locations</SelectItem>
                                            <SelectItem value="Regional">Regional (Multi-site)</SelectItem>
                                            <SelectItem value="Single Site">Single Site</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="scope">Scope Description</Label>
                                    <Textarea
                                        id="scope"
                                        placeholder="Detailed scope notes..."
                                        className="min-h-[100px]"
                                        value={scopeDescription}
                                        onChange={(e) => setScopeDescription(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Button onClick={handleCreateProject} disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Initialize Project
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {step === 2 && projectId && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Stakeholder Management</CardTitle>
                                <CardDescription>Assign owners and contributors to this project.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <StakeholderManager projectId={projectId} />
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="ghost">Back (Saved)</Button>
                                <Button onClick={() => setStep(3)}>Next Step</Button>
                            </CardFooter>
                        </Card>
                    )}

                    {step === 3 && (
                        <Card className="text-center py-12">
                            <CardContent className="space-y-6">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                                    <Check className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-bold">Project Setup Complete!</h2>
                                <p className="text-muted-foreground">
                                    Your BCP cycle "{title}" has been initialized.<br />
                                    Stakeholders have been notified (simulation).
                                </p>
                                <div className="flex justify-center gap-4 mt-6">
                                    <Button onClick={handleFinish} className="px-8">
                                        Go to Project Dashboard
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

function StepIndicator({ current, number, title }: { current: number, number: number, title: string }) {
    const isActive = current === number;
    const isCompleted = current > number;

    return (
        <div className="flex items-center gap-2">
            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                isActive ? "bg-primary text-primary-foreground" :
                    isCompleted ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
            )}>
                {isCompleted ? <Check className="w-4 h-4" /> : number}
            </div>
            <span className={cn("text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>{title}</span>
        </div>
    );
}
