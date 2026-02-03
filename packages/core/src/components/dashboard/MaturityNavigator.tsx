import { Card, CardContent } from "@complianceos/ui/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Rocket, ShieldCheck, Zap } from "lucide-react";

interface MaturityNavigatorProps {
    currentPhase: 1 | 2 | 3;
    phase1Progress: number; // 0-100
    phase2Progress?: number; // 0-100
    phase3Progress?: number; // 0-100
    onPhaseClick?: (phase: 1 | 2 | 3) => void;
}

export function MaturityNavigator({ 
    currentPhase, 
    phase1Progress, 
    phase2Progress = 0, 
    phase3Progress = 0,
    onPhaseClick 
}: MaturityNavigatorProps) {
    
    const phases = [
        {
            id: 1,
            title: "Launch",
            subtitle: "Establish Baseline",
            icon: Rocket,
            progress: phase1Progress,
            color: "text-blue-500",
            bg: "bg-blue-500",
            border: "border-blue-200"
        },
        {
            id: 2,
            title: "Optimize",
            subtitle: "Manage Risk & Gaps",
            icon: Zap,
            progress: phase2Progress,
            color: "text-teal-500",
            bg: "bg-teal-500",
            border: "border-teal-200"
        },
        {
            id: 3,
            title: "Scale",
            subtitle: "Continuous Assurance",
            icon: ShieldCheck,
            progress: phase3Progress,
            color: "text-emerald-500",
            bg: "bg-emerald-500",
            border: "border-emerald-200"
        }
    ];

    return (
        <Card className="border-none shadow-sm bg-slate-50/50 mb-6">
            <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {phases.map((phase, index) => {
                        const isActive = currentPhase === phase.id;
                        const isCompleted = phase.progress === 100;
                        return (
                            <div 
                                key={phase.id} 
                                className={cn(
                                    "flex-1 w-full relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                                    isActive ? "bg-white shadow-md border-primary/20 ring-1 ring-primary/10" : "bg-white/50 border-transparent hover:bg-white hover:border-slate-200"
                                )}
                                onClick={() => onPhaseClick?.(phase.id as 1 | 2 | 3)}
                            >
                                {/* Connector Line (Desktop) */}
                                {index < phases.length - 1 && (
                                    <div className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 w-8 h-0.5 bg-slate-200 z-0" />
                                )}

                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors",
                                    isActive ? `${phase.bg} text-white` : isCompleted ? `${phase.color} bg-white border-2 ${phase.border}` : "bg-slate-100 text-slate-400"
                                )}>
                                    {isCompleted && !isActive ? (
                                        <CheckCircle2 className="h-6 w-6" />
                                    ) : (
                                        <phase.icon className="h-5 w-5" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 z-10">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={cn("text-sm font-bold", isActive ? "text-slate-900" : "text-slate-500")}>
                                            Phase {phase.id}: {phase.title}
                                        </span>
                                        {isActive && (
                                            <span className={cn("text-xs font-bold", phase.color)}>{phase.progress}%</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{phase.subtitle}</p>
                                    
                                    {/* Progress Bar for Active Phase */}
                                    {isActive && (
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                                            <div 
                                                className={cn("h-full transition-all duration-500", phase.bg)} 
                                                style={{ width: `${phase.progress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
