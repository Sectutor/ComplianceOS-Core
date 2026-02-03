
import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Progress } from "@complianceos/ui/ui/progress";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { CheckCircle2, Circle, Clock, ArrowRight, Wand2, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Badge } from "@complianceos/ui/ui/badge";

// --- Helpers & Subcomponents Extracted to Module Scope ---

const calculateProgress = (taskList: any[]) => {
    if (taskList.length === 0) return 0;
    const completed = taskList.filter(t => t.status === 'completed' || t.status === 'done').length;
    return Math.round((completed / taskList.length) * 100);
};

const getNistFunctionLabel = (code: string) => {
    const map: Record<string, string> = {
        'GV': 'GOVERN',
        'ID': 'IDENTIFY',
        'PR': 'PROTECT',
        'DE': 'DETECT',
        'RS': 'RESPOND',
        'RC': 'RECOVER'
    };
    return map[code] || code;
};

const getNistBadgeColor = (code: string) => {
    const map: Record<string, string> = {
        'GV': 'bg-blue-100 text-blue-800 border-blue-200',
        'ID': 'bg-purple-100 text-purple-800 border-purple-200',
        'PR': 'bg-orange-100 text-orange-800 border-orange-200',
        'DE': 'bg-cyan-100 text-cyan-800 border-cyan-200',
        'RS': 'bg-red-100 text-red-800 border-red-200',
        'RC': 'bg-green-100 text-green-800 border-green-200'
    };
    return map[code] || 'bg-slate-100 text-slate-800';
};

interface UnifiedPDCAViewProps {
    planId: number;
    frameworkName: string;
    tasks: any[];
    phases: any[];
    isLoading: boolean;
    frameworkId?: number;
}

export const UnifiedPDCAView = ({ planId, frameworkName, tasks, phases, isLoading, frameworkId }: UnifiedPDCAViewProps) => {
    const utils = trpc.useContext();

    // Fetch baseline requirements for this framework
    const { data: requirements, isLoading: loadingReqs } = trpc.implementation.getFrameworkRequirements.useQuery(
        { frameworkId: frameworkId || 0 },
        { enabled: !!frameworkId }
    );

    const seedBaselineMutation = trpc.implementation.seedBaselineTasks.useMutation({
        onSuccess: () => {
            utils.implementation.getPlan.invalidate();
            toast.success(`${frameworkName} baseline seeded!`, {
                icon: <Sparkles className="w-4 h-4 text-emerald-500" />
            });
        },
        onError: (err: any) => {
            toast.error("Failed to seed baseline", {
                description: err.message
            });
        }
    });

    const pdcaData = useMemo(() => {
        const mapping: Record<string, { tasks: any[], requirements: any[], description: string }> = {
            Plan: { tasks: [], requirements: [], description: "" },
            Do: { tasks: [], requirements: [], description: "" },
            Check: { tasks: [], requirements: [], description: "" },
            Act: { tasks: [], requirements: [], description: "" }
        };

        if (phases) {
            phases.forEach(p => {
                if (mapping[p.name]) {
                    mapping[p.name].description = p.description || "";
                }
            });
        }

        // 1. Map actual tasks
        if (tasks) {
            tasks.forEach(task => {
                const phase = (task.pdca && mapping[task.pdca]) ? task.pdca : 'Plan';
                mapping[phase].tasks.push(task);
            });
        }

        // 2. Map standard requirements (placeholders)
        if (requirements) {
            requirements.forEach((req: any) => {
                const phaseName = req.phase?.name;
                if (phaseName && mapping[phaseName]) {
                    const isCovered = tasks?.some(t =>
                        t.title === req.requirement.title ||
                        (t.description && t.description.includes(req.requirement.identifier))
                    );
                    if (!isCovered) {
                        mapping[phaseName].requirements.push(req.requirement);
                    }
                }
            });
        }

        return mapping;
    }, [tasks, requirements, phases]);

    const calculateProgress = (taskList: any[]) => {
        if (taskList.length === 0) return 0;
        const completed = taskList.filter(t => t.status === 'completed' || t.status === 'done').length;
        return Math.round((completed / taskList.length) * 100);
    };

    const updateStatusMutation = trpc.implementation.updateTaskStatus.useMutation({
        onSuccess: () => {
            utils.implementation.getPlan.invalidate();
        },
        onError: (err: any) => {
            toast.error("Failed to update task", { description: err.message });
        }
    });

    const toggleTaskStatus = (taskId: number, currentStatus: string) => {
        const nextStatus = (currentStatus === 'done' || currentStatus === 'completed') ? 'todo' : 'done';
        updateStatusMutation.mutate({ taskId, status: nextStatus as any });
    };

    // PDCAQuadrant uses the toggleTaskStatus from prop, but since we are extracting it, we need to pass it or defining it outside is harder because of mutation.
    // Actually, best practice is to define it outside and pass handlers.
    // But since I can't easily change the functional component structure to pass strict props without defining interface, I will keep PDCAQuadrant inside but fix simple helpers.
    // WAIT, the user error is "getNistBadgeColor is not defined".
    // I will extract the helpers to module scope (bottom of file or top) so they are globally available in module.


    if (isLoading || loadingReqs) return (
        <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-sm font-medium">Standardizing methodology view...</p>
        </div>
    );

    const isISO = frameworkName.includes('ISO');
    const isSOC2 = frameworkName.includes('SOC');
    const isGDPR = frameworkName.includes('GDPR');

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                <div className="absolute left-0 bottom-0 w-48 h-48 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
                                {isISO && <ShieldAlert className="w-5 h-5 text-indigo-300" />}
                                {isSOC2 && <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
                                {isGDPR && <Sparkles className="w-5 h-5 text-amber-300" />}
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">{frameworkName} ISMS Lifecycle</h3>
                                <p className="text-indigo-200/60 text-xs font-medium uppercase tracking-widest">Unified PDCA Methodology Architecture</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex -space-x-2">
                            {['P', 'D', 'C', 'A'].map((step, i) => (
                                <div key={step} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black" style={{ zIndex: 4 - i }}>
                                    {step}
                                </div>
                            ))}
                        </div>
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-lg"
                            onClick={() => seedBaselineMutation.mutate({ planId, frameworkId: frameworkId || 0 })}
                            disabled={seedBaselineMutation.isPending || !frameworkId}
                        >
                            {seedBaselineMutation.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin text-indigo-500" />
                            ) : (
                                <Wand2 className="w-3.5 h-3.5 mr-2" />
                            )}
                            {seedBaselineMutation.isPending ? "Seeding..." : "Baseline Reset"}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative px-1">
                <PDCAQuadrant
                    step="1"
                    title="PLAN"
                    description={pdcaData.Plan.description || "Establish objectives and context."}
                    data={pdcaData.Plan}
                    colorClass="#3b82f6" // Blue
                    icon={Clock}
                    toggleTaskStatus={toggleTaskStatus}
                    frameworkName={frameworkName}
                />
                <PDCAQuadrant
                    step="2"
                    title="DO"
                    description={pdcaData.Do.description || "Implement treatment and controls."}
                    data={pdcaData.Do}
                    colorClass="#f59e0b" // Amber
                    icon={ArrowRight}
                    toggleTaskStatus={toggleTaskStatus}
                    frameworkName={frameworkName}
                />
                <PDCAQuadrant
                    step="3"
                    title="CHECK"
                    description={pdcaData.Check.description || "Monitor and evaluate performance."}
                    data={pdcaData.Check}
                    colorClass="#8b5cf6" // Violet
                    icon={ShieldAlert}
                    toggleTaskStatus={toggleTaskStatus}
                    frameworkName={frameworkName}
                />
                <PDCAQuadrant
                    step="4"
                    title="ACT"
                    description={pdcaData.Act.description || "Improve and react to findings."}
                    data={pdcaData.Act}
                    colorClass="#10b981" // Emerald
                    icon={CheckCircle2}
                    toggleTaskStatus={toggleTaskStatus}
                    frameworkName={frameworkName}
                />
            </div>

            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                <div className="p-1.5 bg-amber-100 rounded-lg shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                    <h4 className="text-xs font-black text-amber-900 flex items-center gap-2">
                        Professional Governance Note
                    </h4>
                    <p className="text-[11px] text-amber-800/70 leading-relaxed mt-1">
                        This view integrates framework-specific requirements (e.g., GDPR Articles or SOC 2 Criteria) into the standardized ISO-based PDCA lifecycle.
                        This ensures cross-framework harmonization and consistent audit readiness across your entire compliance program.
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- Subcomponents ---

const PDCAQuadrant = ({ title, description, data, colorClass, icon: Icon, step, toggleTaskStatus, frameworkName }: any) => {
    const progress = calculateProgress(data.tasks);

    return (
        <Card className="h-full min-h-[650px] border-t-4 shadow-sm hover:shadow-md transition-all duration-300 bg-white group" style={{ borderTopColor: colorClass }}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: colorClass }}>
                                {step}
                            </span>
                            <CardTitle className="text-base font-bold text-slate-800">
                                {title}
                            </CardTitle>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-500 font-medium max-w-[200px]">
                            {description}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-xl font-black tabular-nums" style={{ color: colorClass }}>{progress}%</span>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-200 text-slate-400 capitalize bg-slate-50/50">
                            {data.tasks.filter((t: any) => t.status === 'completed' || t.status === 'done').length}/{data.tasks.length} Done
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-5 flex-1 flex flex-col">
                <Progress value={progress} className="h-1.5 rounded-full overflow-hidden bg-slate-100" style={{ '--progress-color': colorClass } as any} />

                <div className="space-y-4 flex-1 flex flex-col">
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Current Implementation</span>
                            {data.tasks.length > 0 && <Icon className="w-3 h-3 opacity-20" style={{ color: colorClass }} />}
                        </div>
                        <ScrollArea className="h-[450px] -mr-2 pr-3">
                            <div className="space-y-1.5">
                                {data.tasks.map((task: any) => (
                                    <div
                                        key={task.id}
                                        onClick={() => toggleTaskStatus(task.id, task.status)}
                                        className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer group/task"
                                    >
                                        <div className="mt-0.5 shrink-0">
                                            {task.status === 'completed' || task.status === 'done' ? (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            ) : task.status === 'in_progress' ? (
                                                <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                            ) : (
                                                <Circle className="w-3.5 h-3.5 text-slate-300 group-hover/task:text-indigo-400 transition-colors" />
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1 overflow-hidden w-full">
                                            <span className={cn("text-[11px] font-bold text-slate-700 leading-tight block mb-1", (task.status === 'completed' || task.status === 'done') && "text-slate-400 line-through")}>
                                                {task.title}
                                            </span>

                                            {/* NIST Badges */}
                                            {frameworkName.includes('NIST') && (
                                                <div className="flex flex-wrap gap-1 mt-0.5 mb-1.5">
                                                    {task.tags?.find((t: string) => t.startsWith('NIST-')) && (
                                                        <Badge variant="outline" className={cn(
                                                            "text-[8px] h-3.5 px-1 border rounded-sm font-bold",
                                                            getNistBadgeColor((task.tags.find((t: string) => t.startsWith('NIST-')) || "").split('-')[1])
                                                        )}>
                                                            {getNistFunctionLabel((task.tags.find((t: string) => t.startsWith('NIST-')) || "").split('-')[1])}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}

                                            {task.description && (
                                                <p className="text-[10px] text-slate-500 leading-tight line-clamp-2 italic">
                                                    {task.description.replace(/\*\*/g, '')}
                                                </p>
                                            )}

                                            {task.tags && task.tags.length > 0 && !frameworkName.includes('NIST') && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {task.tags.slice(0, 2).map((tag: string) => (
                                                        <span key={tag} className="text-[8px] px-1 bg-white border border-slate-100 rounded text-slate-400">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {data.tasks.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-24 text-center border-2 border-dashed border-slate-50 rounded-xl bg-slate-25">
                                        <Circle className="w-5 h-5 text-slate-200 mb-2" />
                                        <p className="text-[10px] text-slate-400 font-medium">No tasks assigned to<br />this phase yet.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {data.requirements.length > 0 && (
                        <div className="pt-2 border-t border-slate-50">
                            <div className="flex items-center gap-1.5 mb-2.5">
                                <ShieldAlert className="w-3 h-3 text-amber-500" />
                                <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter">Missing Standard Baseline ({data.requirements.length})</span>
                            </div>
                            <div className="grid grid-cols-1 gap-1.5">
                                {data.requirements.slice(0, 2).map((req: any) => (
                                    <div key={req.identifier} className="flex items-center justify-between p-1.5 rounded-md bg-amber-50/30 border border-amber-100/50 group/req">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-amber-200 text-amber-700 bg-white">
                                                {req.identifier}
                                            </Badge>
                                            <span className="text-[10px] text-amber-800 font-medium truncate">
                                                {req.title}
                                            </span>
                                        </div>
                                        <ArrowRight className="w-2.5 h-2.5 text-amber-300 group-hover/req:translate-x-0.5 transition-transform" />
                                    </div>
                                ))}
                                {data.requirements.length > 2 && (
                                    <p className="text-[9px] text-amber-500 text-center font-bold italic mt-1">+ {data.requirements.length - 2} more requirements missing</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
