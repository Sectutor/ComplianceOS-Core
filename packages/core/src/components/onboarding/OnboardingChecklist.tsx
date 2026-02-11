import { CheckCircle2, Circle, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Progress } from "@complianceos/ui/ui/progress";
import { Button } from "@complianceos/ui/ui/button";
import { useLocation } from "wouter";

interface OnboardingChecklistProps {
    stats: any;
    role?: string;
}

export function OnboardingChecklist({ stats, role }: OnboardingChecklistProps) {
    const [, setLocation] = useLocation();

    const isAdmin = role === 'admin' || role === 'owner' || role === 'super_admin';

    const userItems = [
        {
            id: "org",
            title: "Create your first Organization",
            description: "Setup your company workspace to start tracking compliance.",
            isComplete: (stats?.overview?.totalClients || 0) > 0,
            action: () => setLocation("/clients/new"),
            actionLabel: "Create Organization"
        },
        {
            id: "framework",
            title: "Select Compliance Frameworks",
            description: "Choose ISO 27001 or SOC 2 to populate your control library.",
            isComplete: (stats?.overview?.totalControls || 0) > 0,
            action: () => {
                if ((stats?.overview?.totalClients || 0) > 0 && stats?.clientsOverview?.[0]) {
                    setLocation(`/clients/${stats.clientsOverview[0].id}`);
                } else {
                    setLocation("/clients/new");
                }
            },
            actionLabel: "Configure Frameworks"
        },
        {
            id: "policy",
            title: "Generate AI Policies",
            description: "Use our LLM engine to create audit-ready security policies.",
            isComplete: (stats?.overview?.totalPolicies || 0) > 0,
            action: () => setLocation("/policy-templates"),
            actionLabel: "Explore Policies"
        },
        {
            id: "evidence",
            title: "Link Evidence to Controls",
            description: "Start collecting proof of compliance for your audits.",
            isComplete: (stats?.overview?.totalEvidence || 0) > 0,
            action: () => setLocation("/evidence"),
            actionLabel: "Track Evidence"
        }
    ];

    const adminItems = [
        {
            id: "llm",
            title: "Configure AI Assistant (LLM Keys)",
            description: "Provide API keys for OpenAI or Anthropic to power AI features.",
            isComplete: (stats?.overview?.totalLLMProviders || 0) > 0,
            action: () => setLocation("/settings/llm"),
            actionLabel: "System Settings"
        },
        {
            id: "master_controls",
            title: "Initialize Master Control Library",
            description: "Verify that ISO 27001 and SOC 2 frameworks are loaded.",
            isComplete: (stats?.overview?.totalControls || 0) > 0,
            action: () => setLocation("/controls"),
            actionLabel: "Control Library"
        },
        {
            id: "first_client",
            title: "Setup Your First Client Workspace",
            description: "Create a managed workspace for an organization.",
            isComplete: (stats?.overview?.totalClients || 0) > 0,
            action: () => setLocation("/clients/new"),
            actionLabel: "Onboard Client"
        },
        {
            id: "users",
            title: "Invite Your Security Team",
            description: "Grant access to other admins or client collaborators.",
            isComplete: (stats?.overview?.totalUsers || 0) > 1,
            action: () => setLocation("/admin/users"),
            actionLabel: "Team Management"
        }
    ];

    const items = isAdmin ? adminItems : userItems;

    const completedCount = items.filter(i => i.isComplete).length;
    const totalCount = items.length;
    const progress = (completedCount / totalCount) * 100;
    const isAllComplete = completedCount === totalCount;

    if (isAllComplete) {
        return (
            <Card className="border-green-200 bg-green-50/50 shadow-md">
                <CardContent className="pt-6 pb-6 text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Sparkles className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="text-xl text-green-900 mb-2">Onboarding Complete!</CardTitle>
                    <CardDescription className="text-green-700">
                        You've completed the initial setup. Your dashboard is now active with live compliance data.
                    </CardDescription>
                    <Button
                        className="mt-4 bg-green-600 hover:bg-green-700 text-white border-none"
                        onClick={() => setLocation("/dashboard")}
                    >
                        View Full Dashboard
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-primary/20 shadow-lg bg-gradient-to-br from-white to-primary/5">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Quick Start Guide
                        </CardTitle>
                        <CardDescription>Follow these steps to launch your compliance program.</CardDescription>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
                        <p className="text-xs text-muted-foreground">{completedCount} of {totalCount} done</p>
                    </div>
                </div>
                <Progress value={progress} className="h-2 mt-4 bg-primary/10" />
            </CardHeader>
            <CardContent className="space-y-4">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${item.isComplete
                            ? "bg-green-50/50 border-green-100/50 opacity-80"
                            : "bg-white border-slate-100 hover:border-primary/30 hover:shadow-md group cursor-pointer"
                            }`}
                        onClick={() => !item.isComplete && item.action()}
                    >
                        <div className="mt-1">
                            {item.isComplete ? (
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            ) : (
                                <Circle className="h-6 w-6 text-slate-300 group-hover:text-primary transition-colors" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className={`font-semibold transition-colors ${item.isComplete ? "text-green-900 line-through opacity-60" : "text-slate-900 group-hover:text-primary"
                                }`}>
                                {item.title}
                            </h4>
                            <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                            {!item.isComplete && (
                                <div className="mt-3 flex items-center text-xs font-bold text-primary uppercase tracking-wider">
                                    Go to {item.actionLabel.split(' ')[0]}
                                    <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-1" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
