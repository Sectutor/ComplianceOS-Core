import React, { PropsWithChildren } from "react";
import NISTEcosystemLayout from "./NISTEcosystemLayout";
import { useLocation, Link, useParams } from "wouter";
import { cn } from "@/lib/utils";
import { Play, Settings, Shield, Lock, ClipboardList, FileCheck, Eye, CheckCircle2 } from "lucide-react";
import { useNistSystemId } from "./useNistSystem";

interface NIST80037LayoutProps extends PropsWithChildren {
    showJourneyStepper?: boolean;
}

const STEPS = [
    { id: "prepare", number: 0, title: "Prepare", icon: Play, path: "prepare" },
    { id: "categorize", number: 1, title: "Categorize", icon: Settings, path: "categorize" },
    { id: "select", number: 2, title: "Select Controls", icon: Shield, path: "select" },
    { id: "implement", number: 3, title: "Implement", icon: Lock, path: "implement" },
    { id: "assess", number: 4, title: "Assess", icon: ClipboardList, path: "assess" },
    { id: "authorize", number: 5, title: "Authorize", icon: FileCheck, path: "authorize" },
    { id: "monitor", number: 6, title: "Monitor", icon: Eye, path: "monitor" }
];

export default function NIST80037Layout({ children, showJourneyStepper = true }: NIST80037LayoutProps) {
    const [location] = useLocation();
    const { id: clientId } = useParams<{ id: string }>();
    const systemId = useNistSystemId();

    const activeStepIndex = STEPS.findIndex(step => location.includes(`/rmf/${step.path}`));
    const isDashboard = location.endsWith('/rmf') || location.endsWith('/rmf/');

    if (!showJourneyStepper || isDashboard) {
        return (
            <NISTEcosystemLayout standard="rmf">
                {children}
            </NISTEcosystemLayout>
        );
    }

    return (
        <NISTEcosystemLayout standard="rmf" fullWidth>
            <div className="flex pb-8 mt-4 mx-4 md:mx-8 min-h-screen relative">
                {/* Unified Compliance Journey Left Stepper */}
                <div className="w-80 shrink-0 border-r border-slate-200 bg-slate-50/50 rounded-bl-3xl p-6 hidden lg:block relative">
                    <div className="mb-8">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Compliance Journey</h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">Guided standard workflow</p>
                    </div>

                    <div className="space-y-6 relative sticky top-8">
                        {/* Connecting Line */}
                        <div className="absolute left-[1.15rem] top-4 bottom-8 w-0.5 bg-slate-200 -z-10" />

                        {STEPS.map((step, idx) => {
                            const isActive = activeStepIndex === idx;
                            const isPast = activeStepIndex > idx;
                            const query = systemId ? `?systemId=${systemId}` : "";
                            const href = `/clients/${clientId}/nist/rmf/${step.path}${query}`;

                            return (
                                <Link key={step.id} href={href}>
                                    <div className={cn(
                                        "flex gap-4 group cursor-pointer transition-all",
                                        isActive ? "opacity-100" : "opacity-60 hover:opacity-100"
                                    )}>
                                        <div className="relative shrink-0 mt-0.5">
                                            <div className={cn(
                                                "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors z-10",
                                                isActive ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200" :
                                                    isPast ? "bg-emerald-50 border-emerald-500 text-emerald-600" :
                                                        "bg-white border-slate-300 text-slate-400 group-hover:border-indigo-400"
                                            )}>
                                                {isPast ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-4 h-4" />}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className={cn(
                                                "text-sm font-black transition-colors",
                                                isActive ? "text-indigo-900" :
                                                    isPast ? "text-emerald-900" : "text-slate-600"
                                            )}>
                                                Phase {step.number}: {step.title}
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                {isActive ? "In Progress" : isPast ? "Completed" : "Pending"}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 px-8 lg:px-12 py-6 relative">
                    {children}
                </div>
            </div>
        </NISTEcosystemLayout>
    );
}
