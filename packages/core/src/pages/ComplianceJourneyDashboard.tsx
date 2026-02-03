import React, { useState } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@complianceos/ui/ui/button";
import { Progress } from "@complianceos/ui/ui/progress";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    Flag,
    ClipboardCheck,
    Briefcase,
    ArrowRight,
    Lock,
    CheckCircle2,
    ShieldCheck,
    Map,
    Play,
    Loader2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { cn } from "@/lib/utils";

export default function ComplianceJourneyDashboard() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [_location, setLocation] = useLocation();

    // Real Data from TRPC
    const { data: readinessData, isLoading: readinessLoading } = trpc.readiness.list.useQuery({ clientId });
    const { data: frameworkStats, isLoading: statsLoading } = trpc.compliance.frameworkStats.list.useQuery({ clientId });

    // Calculate Readiness Score (Phase 1)
    // Based on the current step of the latest assessment (out of 6 steps)
    const latestAssessment = readinessData?.[0];
    const readinessScore = latestAssessment
        ? Math.round(((latestAssessment.currentStep || 1) / 6) * 100)
        : 0;

    // Calculate Evidence Progress (Phase 2)
    // Based on the average percentage across all frameworks
    const totalPercentage = frameworkStats?.reduce((acc, curr) => acc + curr.percentage, 0) || 0;
    const evidenceProgress = frameworkStats?.length ? Math.round(totalPercentage / frameworkStats.length) : 0;


    // Unlock Logic
    const isEvidenceUnlocked = readinessScore >= 40;
    const isAuditUnlocked = readinessScore >= 80 && evidenceProgress >= 80;

    const stages = [
        {
            id: 'readiness',
            level: 1,
            title: "Readiness Assessment",
            subtitle: "Phase 1: Discovery",
            description: "Identify gaps against frameworks like SOC 2 & ISO 27001.",
            icon: Flag,
            path: `/clients/${clientId}/readiness/wizard`,
            color: "text-blue-600",
            bgGradient: "from-blue-50 to-indigo-50",
            borderColor: "border-blue-200",
            shadowColor: "shadow-blue-100",
            buttonText: "Start Assessment",
            progress: readinessScore,
            status: readinessScore >= 80 ? 'completed' : 'in-progress',
            locked: false
        },
        {
            id: 'evidence',
            level: 2,
            title: "Evidence Collection",
            subtitle: "Phase 2: Implementation",
            description: "Connect integrations and upload proof of compliance.",
            icon: ClipboardCheck,
            path: `/clients/${clientId}/evidence`,
            color: "text-purple-600",
            bgGradient: "from-purple-50 to-fuchsia-50",
            borderColor: "border-purple-200",
            shadowColor: "shadow-purple-100",
            buttonText: "Collect Evidence",
            progress: evidenceProgress,
            status: isEvidenceUnlocked ? 'in-progress' : 'locked',
            locked: !isEvidenceUnlocked
        },
        {
            id: 'audit',
            level: 3,
            title: "Audit Preparation",
            subtitle: "Phase 3: Certification",
            description: "Collaborate with auditors in the Audit Room.",
            icon: Briefcase,
            path: `/clients/${clientId}/audit-hub`,
            color: "text-emerald-600",
            bgGradient: "from-emerald-50 to-teal-50",
            borderColor: "border-emerald-200",
            shadowColor: "shadow-emerald-100",
            buttonText: "Enter Audit Hub",
            progress: 0,
            status: isAuditUnlocked ? 'ready' : 'locked',
            locked: !isAuditUnlocked
        }
    ];

    // Calculate overall journey percentage
    const overallProgress = Math.round((readinessScore * 0.3) + (evidenceProgress * 0.7)); // Weighted

    if (readinessLoading || statsLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            </DashboardLayout>
        );
    }


    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-50/50 pb-20">
                {/* Header / Hero */}
                <div className="bg-white border-b border-slate-200 px-8 py-10">
                    <div className="max-w-7xl mx-auto">
                        <Breadcrumb
                            items={[
                                { label: "Dashboard", href: "/dashboard" },
                                { label: "Client Journey" },
                            ]}
                            className="mb-6"
                        />
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                                        <Map className="w-6 h-6" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Compliance Journey</h1>
                                </div>
                                <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
                                    Your roadmap to certification. Complete each phase to unlock the next level.
                                    We've gamified the process to keep it organized and efficient.
                                </p>
                            </div>

                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 min-w-[280px]">
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm font-medium mb-2">
                                        <span className="text-slate-700">Total Progress</span>
                                        <span className="text-indigo-600 font-bold">{overallProgress}%</span>
                                    </div>
                                    <Progress value={overallProgress} className="h-3" />
                                </div>
                                <ShieldCheck className="w-8 h-8 text-slate-300" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-8 py-12">
                    {/* Journey Map */}
                    <div className="relative">
                        {/* Connecting Line (Behind cards) */}
                        <div className="hidden lg:block absolute top-[140px] left-0 w-full h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-emerald-200 -z-0 rounded-full opacity-50" />

                        <div className="grid lg:grid-cols-3 gap-8">
                            {stages.map((stage, index) => {
                                const isLocked = stage.locked;
                                const isCompleted = stage.status === 'completed';

                                return (
                                    <div key={stage.id} className="relative group z-10">
                                        {/* Level Badge */}
                                        <div className={cn(
                                            "absolute -top-3 left-8 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm z-20 transition-all",
                                            isLocked ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-white text-slate-800 border-slate-200 group-hover:border-indigo-200 group-hover:scale-105"
                                        )}>
                                            Level {stage.level}
                                        </div>

                                        <div className={cn(
                                            "h-full flex flex-col p-1 rounded-2xl transition-all duration-500",
                                            isLocked ? "bg-slate-100" : `bg-gradient-to-br ${stage.bgGradient} hover:shadow-xl hover:shadow-indigo-100 hover:-translate-y-1`
                                        )}>
                                            <div className="h-full bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl p-6 flex flex-col">

                                                {/* Header Icon Area */}
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className={cn(
                                                        "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-white transition-transform group-hover:rotate-3",
                                                        isLocked ? "bg-slate-100 text-slate-400" : `bg-white ${stage.color}`
                                                    )}>
                                                        <stage.icon className="w-7 h-7" />
                                                    </div>

                                                    {isCompleted ? (
                                                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 gap-1 pl-1 pr-2">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                                                        </Badge>
                                                    ) : isLocked ? (
                                                        <div className="bg-slate-100 p-2 rounded-full">
                                                            <Lock className="w-4 h-4 text-slate-400" />
                                                        </div>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 animate-pulse">
                                                            Active
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Text Content */}
                                                <div className="mb-6">
                                                    <h3 className={cn("text-xs font-bold uppercase tracking-widest mb-1", isLocked ? "text-slate-400" : "text-slate-500")}>
                                                        {stage.subtitle}
                                                    </h3>
                                                    <h2 className={cn("text-xl font-bold mb-3", isLocked ? "text-slate-400" : "text-slate-900")}>
                                                        {stage.title}
                                                    </h2>
                                                    <p className={cn("text-sm leading-relaxed", isLocked ? "text-slate-400" : "text-slate-600")}>
                                                        {stage.description}
                                                    </p>
                                                </div>

                                                {/* Progress & Action */}
                                                <div className="mt-auto space-y-4">
                                                    {!isLocked && (
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-xs font-medium text-slate-600">
                                                                <span>Progress</span>
                                                                <span>{stage.progress}%</span>
                                                            </div>
                                                            <Progress value={stage.progress} className="h-2" />
                                                        </div>
                                                    )}

                                                    {isLocked ? (
                                                        <Button disabled className="w-full bg-slate-100 text-slate-400 border border-slate-200">
                                                            <Lock className="w-4 h-4 mr-2" /> Locked
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            onClick={() => setLocation(stage.path)}
                                                            className={cn(
                                                                "w-full transition-all group-hover:scale-[1.02]",
                                                                isCompleted ? "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                                                            )}
                                                        >
                                                            {stage.buttonText}
                                                            {!isCompleted && <Play className="w-4 h-4 ml-2 fill-current" />}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-16 grid md:grid-cols-3 gap-6 opacity-80">
                        <div className="p-4 border border-dashed border-slate-300 rounded-xl flex gap-4 items-start">
                            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">1</div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-900">Linear Progression</h4>
                                <p className="text-xs text-slate-500 mt-1">Completing one phase unlocks the next, preventing context switching.</p>
                            </div>
                        </div>
                        <div className="p-4 border border-dashed border-slate-300 rounded-xl flex gap-4 items-start">
                            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">2</div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-900">Evidence Gating</h4>
                                <p className="text-xs text-slate-500 mt-1">Evidence collection only starts after you define your controls.</p>
                            </div>
                        </div>
                        <div className="p-4 border border-dashed border-slate-300 rounded-xl flex gap-4 items-start">
                            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">3</div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-900">Audit Ready</h4>
                                <p className="text-xs text-slate-500 mt-1">The Audit Hub opens only when you are 80% ready, saving auditor fees.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
