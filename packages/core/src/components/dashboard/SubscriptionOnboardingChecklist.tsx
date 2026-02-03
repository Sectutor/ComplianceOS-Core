import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { CheckCircle2, Circle, ArrowRight, ShieldCheck, Users, Settings, FileText, LayoutGrid } from "lucide-react";
import { Button } from "@complianceos/ui/ui/button";
import { Progress } from "@complianceos/ui/ui/progress";
import { Link } from "wouter";

interface ChecklistItem {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    link: string;
    icon: any;
}

interface SubscriptionOnboardingChecklistProps {
    clientId: number;
    stats: {
        hasFrameworks: boolean;
        hasUsers: boolean;
        hasControls: boolean;
        hasPolicies: boolean;
        hasEvidence: boolean;
    };
}

export function SubscriptionOnboardingChecklist({ clientId, stats }: SubscriptionOnboardingChecklistProps) {
    const steps: ChecklistItem[] = [
        {
            id: "framework",
            title: "Select Frameworks",
            description: "Choose standards like ISO 27001 or SOC 2 to set your baseline.",
            completed: stats.hasFrameworks,
            link: `/clients/${clientId}/settings`,
            icon: LayoutGrid
        },
        {
            id: "users",
            title: "Invite Your Team",
            description: "Compliance is a team sport. Add your coworkers.",
            completed: stats.hasUsers,
            link: `/clients/${clientId}/people`,
            icon: Users
        },
        {
            id: "controls",
            title: "Assign Controls",
            description: "Select which security controls apply to your organization.",
            completed: stats.hasControls,
            link: `/clients/${clientId}/controls`,
            icon: Settings
        },
        {
            id: "policies",
            title: "Draft First Policy",
            description: "Use our AI templates to document your security procedures.",
            completed: stats.hasPolicies,
            link: `/clients/${clientId}/policies`,
            icon: FileText
        },
        {
            id: "evidence",
            title: "Collect Evidence",
            description: "Upload your first evidence file to verify a control.",
            completed: stats.hasEvidence,
            link: `/clients/${clientId}/evidence`,
            icon: ShieldCheck
        }
    ];

    const completedCount = steps.filter(s => s.completed).length;
    const progress = Math.round((completedCount / steps.length) * 100);

    return (
        <Card className="border-emerald-100 shadow-lg bg-emerald-50/30 overflow-hidden">
            <div className="h-1.5 w-full bg-emerald-500" />
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold text-slate-900">Phase 1: Launch</CardTitle>
                        <CardDescription className="text-emerald-700 font-medium">
                            Complete these 5 steps to establish your compliance baseline.
                        </CardDescription>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black text-emerald-600">{progress}%</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Complete</p>
                    </div>
                </div>
                <Progress value={progress} className="h-2 bg-emerald-100 mt-2" />
            </CardHeader>
            <CardContent className="space-y-3">
                {steps.map((step) => (
                    <Link key={step.id} href={step.link}>
                        <div
                            className={`flex items-start gap-4 p-3 rounded-lg border transition-all cursor-pointer group ${step.completed
                                    ? "bg-white border-emerald-100 opacity-75"
                                    : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm"
                                }`}
                        >
                            <div className={`mt-1 rounded-full p-1 ${step.completed ? "text-emerald-500" : "text-slate-300"}`}>
                                {step.completed ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                    <Circle className="h-5 w-5" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-bold ${step.completed ? "text-slate-500 line-through" : "text-slate-900"}`}>
                                    {step.title}
                                </h4>
                                <p className="text-xs text-slate-500 line-clamp-1 group-hover:line-clamp-none transition-all">
                                    {step.description}
                                </p>
                            </div>
                            <ArrowRight className={`h-4 w-4 mt-1 transition-transform group-hover:translate-x-1 ${step.completed ? "text-slate-300" : "text-slate-400"
                                }`} />
                        </div>
                    </Link>
                ))}

                {progress === 100 && (
                    <div className="mt-4 p-4 bg-emerald-600 rounded-xl text-white text-center shadow-lg animate-in zoom-in-95 duration-500">
                        <h4 className="font-bold flex items-center justify-center gap-2">
                            <ShieldCheck className="h-5 w-5" />
                            Baseline Achieved!
                        </h4>
                        <p className="text-xs text-emerald-100 mt-1">
                            You've completed Phase 1. Ready to optimize your risks?
                        </p>
                        <Link href={`/clients/${clientId}/risk/assessments`}>
                            <Button size="sm" variant="secondary" className="mt-3 w-full font-bold">
                                Unlock Phase 2: Optimize
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
