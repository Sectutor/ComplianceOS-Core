
import React from 'react';
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export interface PhaseStatus {
    id: string;
    name: string;
    status: 'completed' | 'current' | 'upcoming';
    date?: string;
}

interface PhasedTimelineProps {
    phases: PhaseStatus[];
    className?: string;
}

export const PhasedTimeline = ({ phases, className }: PhasedTimelineProps) => {
    return (
        <div className={cn("w-full py-4", className)}>
            <div className="relative flex items-center justify-between">
                {/* Connecting Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10" />

                {phases.map((phase, index) => {
                    const isCompleted = phase.status === 'completed';
                    const isCurrent = phase.status === 'current';

                    return (
                        <div key={phase.id} className="flex flex-col items-center bg-white px-2 z-10">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                isCompleted ? "bg-green-50 border-green-500 text-green-600" :
                                    isCurrent ? "bg-blue-50 border-blue-600 text-blue-600 ring-4 ring-blue-50" :
                                        "bg-white border-slate-200 text-slate-300"
                            )}>
                                {isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                ) : isCurrent ? (
                                    <Clock className="w-4 h-4 animate-pulse" />
                                ) : (
                                    <Circle className="w-4 h-4" />
                                )}
                            </div>
                            <div className="mt-2 text-center">
                                <span className={cn(
                                    "text-sm font-medium block",
                                    isCurrent ? "text-slate-900" : "text-slate-500"
                                )}>
                                    {phase.name}
                                </span>
                                {phase.date && (
                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                        {phase.date}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
