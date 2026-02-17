
import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Label } from "@complianceos/ui/ui/label";
import {
    Layers,
    ArrowRight,
    CheckCircle2,
    Circle,
    ArrowLeft,
    FileText,
    Shield,
    Activity,
    Lock,
    Search
} from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import { NIST_RMF_WORKFLOW } from "@/lib/workflows/rmf-step-data";
import { Separator } from "@complianceos/ui/ui/separator";

export default function RmfWorkflowPage() {
    const { id, workflowId } = useParams<{ id: string; workflowId: string }>();
    const clientId = parseInt(id || "0");
    const rmfWorkflowId = parseInt(workflowId || "0");
    const utils = trpc.useUtils();

    // Fetch workflow data
    const { data: workflows } = trpc.federal.listRmfWorkflows.useQuery({ clientId });
    const workflow = workflows?.find((w: any) => w.id === rmfWorkflowId);

    const [selectedStepId, setSelectedStepId] = useState<string>("prepare");

    // Find index of selected step
    const currentStepIndex = NIST_RMF_WORKFLOW.steps.findIndex(s => s.id === selectedStepId);
    const currentStepData = NIST_RMF_WORKFLOW.steps[currentStepIndex];

    const updateStepMutation = trpc.federal.updateRmfStep.useMutation({
        onSuccess: () => {
            toast.success("Step status updated");
            utils.federal.listRmfWorkflows.invalidate({ clientId });
        },
        onError: (err) => {
            toast.error("Failed to update step: " + err.message);
        }
    });

    const handleStatusChange = (status: string) => {
        // Steps are 1-indexed in DB
        updateStepMutation.mutate({
            clientId,
            id: rmfWorkflowId,
            step: currentStepIndex + 1,
            status
        });
    };

    if (!workflow) return null;

    const getStepStatus = (index: number) => {
        const stepNum = index + 1;
        return (workflow.stepStatus as any)?.[stepNum] || 'not_started';
    };

    return (
        <DashboardLayout>
            <div className="pl-6 pr-6 py-8 md:pl-20 md:pr-8 space-y-8">
                <Breadcrumb items={[
                    { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                    { label: "Federal Compliance", href: `/clients/${clientId}/federal` },
                    { label: "RMF Workflows", href: `/clients/${clientId}/federal/rmf` },
                    { label: workflow.systemName }
                ]} />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Layers className="h-8 w-8 text-blue-600" />
                            {workflow.systemName}
                        </h1>
                        <p className="text-slate-500 text-lg">NIST Risk Management Framework Authorization Cycle</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/clients/${clientId}/federal/rmf`}>
                            <Button variant="ghost" className="rounded-xl gap-2 text-slate-500 hover:text-slate-900">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Workflows
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Steps */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">RMF Lifecycle</CardTitle>
                            </CardHeader>
                            <div className="p-2">
                                {NIST_RMF_WORKFLOW.steps.map((step, index) => {
                                    const status = getStepStatus(index);
                                    const isActive = step.id === selectedStepId;

                                    let statusColor = "bg-slate-200";
                                    if (status === 'completed') statusColor = "bg-emerald-500";
                                    else if (status === 'in_progress') statusColor = "bg-blue-500";

                                    return (
                                        <button
                                            key={step.id}
                                            onClick={() => setSelectedStepId(step.id)}
                                            className={`w-full text-left p-3 rounded-xl mb-1 flex items-start gap-3 transition-all ${isActive ? "bg-blue-50 text-blue-700 shadow-sm" : "hover:bg-slate-50 text-slate-600"
                                                }`}
                                        >
                                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${statusColor}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold">{step.title}</div>
                                                <div className="text-xs opacity-70 break-words leading-relaxed">{step.description}</div>
                                            </div>
                                            {status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700 border-blue-100">
                                            Step {currentStepIndex + 1} of 7
                                        </Badge>
                                        <CardTitle className="text-2xl font-black text-slate-900">
                                            {currentStepData.title}
                                        </CardTitle>
                                        <CardDescription className="text-base mt-2 max-w-2xl">
                                            {currentStepData.longDescription}
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-col gap-2 min-w-[150px]">
                                        <Label className="text-xs font-bold uppercase text-slate-400">Step Status</Label>
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                variant={getStepStatus(currentStepIndex) === 'not_started' ? "default" : "outline"}
                                                className={`flex-1 rounded-l-xl ${getStepStatus(currentStepIndex) === 'not_started' ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : ''}`}
                                                onClick={() => handleStatusChange('not_started')}
                                            >
                                                Todo
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={getStepStatus(currentStepIndex) === 'in_progress' ? "default" : "outline"}
                                                className={`flex-1 rounded-none ${getStepStatus(currentStepIndex) === 'in_progress' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                                onClick={() => handleStatusChange('in_progress')}
                                            >
                                                Active
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={getStepStatus(currentStepIndex) === 'completed' ? "default" : "outline"}
                                                className={`flex-1 rounded-r-xl ${getStepStatus(currentStepIndex) === 'completed' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                                                onClick={() => handleStatusChange('completed')}
                                            >
                                                Done
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <Separator />
                            <CardContent className="p-8">
                                <div className="space-y-8">
                                    {/* Key Tasks */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-blue-500" />
                                            Key Activities
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {currentStepData.tasks.map((task, i) => (
                                                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <h4 className="font-bold text-slate-900 mb-1">{task.title}</h4>
                                                    <p className="text-sm text-slate-500 leading-relaxed">{task.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Area */}
                                    <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-6 text-white">
                                        <h3 className="text-lg font-bold mb-2">Ready to execute?</h3>
                                        <p className="text-blue-200 mb-6 text-sm">
                                            Launch the dedicated tools for this phase of the RMF lifecycle.
                                        </p>

                                        {currentStepData.id === 'assess' ? (
                                            <div className="flex gap-4">
                                                <Link href={`/clients/${clientId}/federal/assessment-80053?rmfWorkflowId=${rmfWorkflowId}`}>
                                                    <Button className="bg-white text-slate-900 hover:bg-blue-50 font-bold rounded-xl h-11">
                                                        <Shield className="w-4 h-4 mr-2" />
                                                        Open Security Assessment
                                                    </Button>
                                                </Link>
                                                <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white rounded-xl h-11">
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    Generate SAR
                                                </Button>
                                            </div>
                                        ) : currentStepData.id === 'categorize' ? (
                                            <div className="flex gap-4">
                                                <Button className="bg-white text-slate-900 hover:bg-blue-50 font-bold rounded-xl h-11">
                                                    <Activity className="w-4 h-4 mr-2" />
                                                    FIPS 199 Analysis
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button className="bg-white text-slate-900 hover:bg-blue-50 font-bold rounded-xl h-11">
                                                Launch {currentStepData.title} Tool
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
