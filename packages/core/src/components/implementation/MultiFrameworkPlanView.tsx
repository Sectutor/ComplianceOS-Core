import { cn } from "@/lib/utils";
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Badge } from "@complianceos/ui/ui/badge";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Separator } from "@complianceos/ui/ui/separator";
import { CheckCircle2, Circle, ArrowLeft, MoreHorizontal, Calendar, Clock, BarChart3, ListFilter } from "lucide-react";
import { trpc } from '@/lib/trpc';
import { Link } from 'wouter';
import { Progress } from "@complianceos/ui/ui/progress";
import { toast } from 'sonner';
import { KanbanBoard } from '../project/KanbanBoard';
import { FrameworkViewRouter } from './frameworks/FrameworkViewRouter';
import { LayoutGrid, List, Wand2, Sparkles, CheckSquare, Loader2 } from 'lucide-react';
import { HarmonizationAnalyzer } from '@/components/harmonization/HarmonizationAnalyzer';
import { CertificationTracker } from '@/components/audit/CertificationTracker';
import { PageGuide } from "@/components/PageGuide";
import DashboardLayout from '@/components/DashboardLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@complianceos/ui/ui/dialog";
import { Label } from "@complianceos/ui/ui/label";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Plus } from "lucide-react";
import { TaskDetailSheet } from './TaskDetailSheet';

interface MultiFrameworkPlanViewProps {
    planId: number;
    clientId: number;
}

export default function MultiFrameworkPlanView({ planId, clientId }: MultiFrameworkPlanViewProps) {
    const [activeTab, setActiveTab] = useState<string>("Plan");
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [addTaskOpen, setAddTaskOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        pdca: 'Plan'
    });
    const utils = trpc.useContext();

    const getPhaseStyle = (phase: string) => {
        if (phase === 'Plan') return "bg-blue-50 text-blue-800 hover:bg-blue-100 data-[state=active]:bg-blue-200 data-[state=active]:text-blue-900 border-blue-200";
        if (phase === 'Do') return "bg-amber-50 text-amber-800 hover:bg-amber-100 data-[state=active]:bg-amber-200 data-[state=active]:text-amber-900 border-amber-200";
        if (phase === 'Check') return "bg-violet-50 text-violet-800 hover:bg-violet-100 data-[state=active]:bg-violet-200 data-[state=active]:text-violet-900 border-violet-200";
        if (phase === 'Act') return "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 data-[state=active]:bg-emerald-200 data-[state=active]:text-emerald-900 border-emerald-200";
        return "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200";
    };

    const autoAssignMutation = trpc.implementation.autoAssignPdca.useMutation({
        onSuccess: (data: any) => {
            utils.implementation.getPlan.invalidate();
            toast.success(`Lifecycle Orchestrated`, {
                description: `Decomposed requirements into ${data.updatedCount} PDCA tasks.`
            });
        },
        onError: (error: any) => {
            toast.error(`Orchestration Failed`, {
                description: error.message || "An unexpected error occurred."
            });
        }
    });

    const createTaskMutation = trpc.implementation.createTask.useMutation({
        onSuccess: () => {
            utils.implementation.getPlan.invalidate();
            setAddTaskOpen(false);
            setNewTask({ title: '', description: '', priority: 'medium', pdca: activeTab === 'framework' ? 'Plan' : activeTab });
            toast.success("Task created successfully");
        },
        onError: (error: any) => {
            toast.error("Failed to create task", {
                description: error.message
            });
        }
    });

    const { data: plan, isLoading } = trpc.implementation.getPlan.useQuery({
        planId
    }, { enabled: !!planId });

    const frameworkId = plan?.frameworkId || 0;

    // Fetch real phases from the database
    const { data: dbPhases, isLoading: loadingPhases } = trpc.implementation.getFrameworkPhases.useQuery(
        { frameworkId },
        { enabled: !!frameworkId }
    );

    if (isLoading || loadingPhases) {
        return <div className="p-10 text-center">Loading plan details...</div>;
    }

    if (!plan) {
        return <div className="p-10 text-center">Plan not found</div>;
    }

    // Determine phase status based on tasks
    const getPhaseStatus = (phaseName: string) => {
        const phaseTasks = plan.tasks?.filter((t: any) => t.pdca === phaseName) || [];
        if (phaseTasks.length === 0) return 'upcoming';

        const completedCount = phaseTasks.filter((t: any) => t.status === 'completed' || t.status === 'done').length;
        if (completedCount === phaseTasks.length) return 'completed';

        const inProgressCount = phaseTasks.filter((t: any) => t.status === 'in_progress').length;
        if (inProgressCount > 0 || completedCount > 0) return 'current';

        return 'upcoming';
    };

    // Map DB phases with status
    const phases = (dbPhases || []).map(p => ({
        ...p,
        status: getPhaseStatus(p.name)
    }));

    // Fallback if no phases found in DB (safety check)
    const displayPhases = phases.length > 0 ? phases : [
        { id: 1, name: 'Plan', status: getPhaseStatus('Plan'), description: "Establish context, scope, and risk assessment." },
        { id: 2, name: 'Do', status: getPhaseStatus('Do'), description: "Implement risk treatment and controls." },
        { id: 3, name: 'Check', status: getPhaseStatus('Check'), description: "Monitor, measure, analyze, and evaluate." },
        { id: 4, name: 'Act', status: getPhaseStatus('Act'), description: "Corrective actions and continual improvement." }
    ];

    const getPhaseIcon = (status: string) => {
        if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
        if (status === 'current') return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
        return <Circle className="w-4 h-4 text-slate-300" />;
    };

    // Filter tasks by active tab (Phase)
    const currentTasks = plan.tasks?.filter((t: any) => t.pdca === activeTab) || [];
    const completedTasks = currentTasks.filter((t: any) => t.status === 'completed' || t.status === 'done').length;
    const progress = currentTasks.length > 0 ? (completedTasks / currentTasks.length) * 100 : 0;

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-white">
                {/* Navigation Header */}
                <div className="border-b bg-white/50 backdrop-blur-md px-8 py-4 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-6">
                        <Link href={`/clients/${clientId}/implementation`}>
                            <div className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-xs font-bold uppercase tracking-widest">Back to Plans</span>
                            </div>
                        </Link>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{plan.title}</h1>
                                <Badge className="bg-indigo-500 text-white border-0 shadow-sm shadow-indigo-200">
                                    {plan.framework?.shortCode || "FW"}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] h-4 bg-slate-50 text-slate-500 border-slate-200 capitalize">
                                    {plan.status}
                                </Badge>
                                <span className="text-[11px] text-slate-400 font-medium">{plan.framework?.name} Implementation</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <PageGuide
                            title="PDCA Plan Manager"
                            description="Manage the full lifecycle of your implementation plan using PDCA methodology."
                            rationale="PDCA (Plan-Do-Check-Act) ensures continuous improvement and strict control over compliance activities."
                            howToUse={[
                                { step: "Plan", description: "Define objectives and assess risks." },
                                { step: "Do", description: "Execute tasks and implement controls." },
                                { step: "Check", description: "Monitor results and gather evidence." },
                                { step: "Act", description: "Optimize and address non-conformities." },
                                { step: "Orchestrate", description: "Use the 'Orchestrate AI Lifecycle' button to auto-generate tasks." }
                            ]}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-500 font-bold text-xs"
                            onClick={() => {
                                const newTitle = window.prompt("Update plan title:", plan.title);
                                if (newTitle && newTitle !== plan.title) toast.info("Pending title update...");
                            }}
                        >
                            Plan Details
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 shadow-sm">
                            <MoreHorizontal className="w-4 h-4 text-slate-600" />
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-8 max-w-[1500px] mx-auto w-full font-sans">
                    <div className="grid grid-cols-12 gap-10 items-start">
                        {/* Left Panel: Methodology & Tasks */}
                        <div className="col-span-12 lg:col-span-9 space-y-8">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 mb-6">
                                    <TabsList className="bg-white/60 backdrop-blur-sm border border-slate-100 p-1 h-auto gap-2 rounded-xl shadow-sm">
                                        {['Plan', 'Do', 'Check', 'Act'].map(phase => (
                                            <TabsTrigger
                                                key={phase}
                                                value={phase}
                                                className={cn(
                                                    "rounded-full px-3 py-1.5 h-auto text-xs font-bold tracking-wide transition-all flex items-center gap-2 border shadow-sm",
                                                    getPhaseStyle(phase)
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    getPhaseStatus(phase) === 'completed' ? "bg-emerald-500" :
                                                        getPhaseStatus(phase) === 'current' ? "bg-indigo-500 animate-pulse" : "bg-slate-200"
                                                )} />
                                                {phase}
                                            </TabsTrigger>
                                        ))}
                                        <TabsTrigger
                                            value="framework"
                                            className="rounded-full px-3 py-1.5 h-auto text-xs font-bold tracking-wide transition-all flex items-center gap-2 ml-2 border bg-slate-50 text-slate-700 hover:bg-slate-100 data-[state=active]:bg-slate-200 data-[state=active]:text-slate-900"
                                        >
                                            <LayoutGrid className="w-4 h-4 text-indigo-500" />
                                            Methodology Board
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setNewTask(prev => ({ ...prev, pdca: activeTab === 'framework' ? 'Plan' : activeTab }));
                                                setAddTaskOpen(true);
                                            }}
                                            className="font-bold h-8 text-[11px] border-slate-200"
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-2" />
                                            Manual Add
                                        </Button>
                                        <Button
                                            variant="soft"
                                            size="sm"
                                            onClick={() => autoAssignMutation.mutate({ planId })}
                                            disabled={autoAssignMutation.isPending}
                                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold h-8 text-[11px]"
                                        >
                                            {autoAssignMutation.isPending ? (
                                                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                            ) : (
                                                <Wand2 className="w-3.5 h-3.5 mr-2" />
                                            )}
                                            {autoAssignMutation.isPending ? "Orchestrating..." : "Orchestrate AI Lifecycle"}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                            <ListFilter className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {activeTab !== "framework" ? (
                                    <TabsContent value={activeTab} className="mt-0 animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* Phase Summary Card */}
                                            <Card className="md:col-span-1 border-slate-200 shadow-sm bg-slate-50/30">
                                                <CardHeader>
                                                    <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest">Phase Intelligence</CardTitle>
                                                    <CardDescription className="text-xs font-medium text-slate-600 line-clamp-3 leading-relaxed">
                                                        {displayPhases.find(p => p.name === activeTab)?.description || "Standard PDCA methodology phase."}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-6">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-end">
                                                            <span className="text-3xl font-black text-slate-900 tabular-nums">{Math.round(progress)}%</span>
                                                            <span className="text-xs font-bold text-slate-400 uppercase">{completedTasks}/{currentTasks.length} Completed</span>
                                                        </div>
                                                        <Progress value={progress} className="h-2 bg-slate-100" indicatorClassName="bg-indigo-600" />
                                                    </div>

                                                    <div className="p-4 bg-white rounded-xl border border-slate-100 space-y-3 shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Sparkles className="w-4 h-4 text-amber-500" />
                                                            <span className="text-xs font-bold text-slate-900">AI Readiness Probe</span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                                            This phase focuses on the foundation of your ISMS. Complete the risk assessment tasks to unlock the next phase of implementation.
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* Task List */}
                                            <Card className="md:col-span-2 border-slate-200 shadow-sm overflow-hidden">
                                                <ScrollArea className="h-[550px]">
                                                    <div className="divide-y divide-slate-100">
                                                        {currentTasks.length === 0 ? (
                                                            <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                                                                <div className="p-4 bg-slate-50 rounded-full">
                                                                    <List className="w-8 h-8 text-slate-300" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <h4 className="font-bold text-slate-900">No Tasks Assigned</h4>
                                                                    <p className="text-sm text-slate-500">Add tasks manually or use the Smart Sync tool.</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            currentTasks.map((task: any) => (
                                                                <div key={task.id} onClick={() => { setSelectedTask(task); setSheetOpen(true); }} className="p-5 hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                                                    <div className="flex items-start gap-4">
                                                                        <div className="mt-1">
                                                                            {task.status === 'completed' || task.status === 'done' ? (
                                                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                                            ) : (
                                                                                <Circle className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 space-y-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <h4 className={cn("font-bold text-sm text-slate-900", (task.status === 'completed' || task.status === 'done') && "text-slate-400 line-through")}>
                                                                                    {task.title}
                                                                                </h4>
                                                                                <Badge variant="outline" className="text-[10px] h-4 border-slate-200 text-slate-400 capitalize bg-white">
                                                                                    {task.priority}
                                                                                </Badge>
                                                                            </div>
                                                                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                                                                {task.description}
                                                                            </p>

                                                                            {/* Subtask Indicator */}
                                                                            {task.subtasks && task.subtasks.length > 0 && (
                                                                                <div className="flex items-center gap-1.5 mt-2.5">
                                                                                    <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-500">
                                                                                        <CheckSquare className="w-3 h-3 text-slate-400" />
                                                                                        <span>
                                                                                            {task.subtasks.filter((st: any) => st.completed).length}/{task.subtasks.length}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <span className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer">Todo list</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </ScrollArea>
                                            </Card>
                                        </div>
                                    </TabsContent>
                                ) : (
                                    <TabsContent value="framework" className="mt-0 animate-in fade-in zoom-in-95 duration-500">
                                        <FrameworkViewRouter
                                            planId={planId}
                                            frameworkName={plan?.framework?.name || plan?.linkedFramework || ""}
                                            tasks={plan?.tasks || []}
                                            phases={displayPhases}
                                            isLoading={isLoading}
                                            frameworkId={frameworkId}
                                        />
                                    </TabsContent>
                                )}
                            </Tabs>
                        </div>

                        {/* Right Panel: Sidecar Widgets */}
                        <div className="col-span-12 lg:col-span-3 space-y-8">
                            {/* Harmonization Widget */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Optimization</h3>
                                <HarmonizationAnalyzer
                                    planId={planId}
                                    frameworkId={plan.frameworkId || 0}
                                    planTitle={plan.title}
                                />
                            </div>

                            {/* Audit Readiness */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Governance</h3>
                                <CertificationTracker
                                    clientId={planId}
                                    frameworkId={plan.frameworkId || 0}
                                    frameworkName={plan.framework?.name || "Compliance Framework"}
                                />
                            </div>

                            {/* Quick Metrics */}
                            <Card className="border-slate-100 shadow-sm overflow-hidden bg-slate-50/20">
                                <div className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-500">Resource Output</span>
                                        <BarChart3 className="w-3 h-3 text-slate-400" />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400 font-medium">Est. Effort</span>
                                            <span className="font-bold text-slate-900">{plan.tasks?.reduce((acc: number, t: any) => acc + (t.estimatedHours || 0), 0)} hrs</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400 font-medium">Team Load</span>
                                            <span className="font-bold text-slate-900">3 Experts</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* AI Insights Card */}
                            <Card className="border-indigo-100 bg-indigo-50/20 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-black text-indigo-900 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3" />
                                        STRATEGY PROBE
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-[11px] text-indigo-800/80 leading-relaxed font-medium">
                                        Based on your progress in the <strong>{activeTab}</strong> phase, the AI suggests focusing on automated evidence collection for logic-based controls.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>


                <TaskDetailSheet
                    task={selectedTask}
                    open={sheetOpen}
                    onOpenChange={setSheetOpen}
                    onUpdate={() => {
                        utils.implementation.getPlan.invalidate();
                    }}
                />

                <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add Manual Task</DialogTitle>
                            <DialogDescription>
                                Add a specific work item to your {newTask.pdca} phase.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Task Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Conduct internal vulnerability scan"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Detailed steps or requirements..."
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>PDCA Phase</Label>
                                    <Select
                                        value={newTask.pdca}
                                        onValueChange={(val) => setNewTask({ ...newTask, pdca: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select phase" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Plan">Plan</SelectItem>
                                            <SelectItem value="Do">Do</SelectItem>
                                            <SelectItem value="Check">Check</SelectItem>
                                            <SelectItem value="Act">Act</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Priority</Label>
                                    <Select
                                        value={newTask.priority}
                                        onValueChange={(val) => setNewTask({ ...newTask, priority: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAddTaskOpen(false)}>Cancel</Button>
                            <Button
                                onClick={() => createTaskMutation.mutate({
                                    planId,
                                    clientId,
                                    ...newTask
                                })}
                                disabled={!newTask.title || createTaskMutation.isPending}
                            >
                                {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
