import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import {
    ShieldCheck,
    AlertTriangle,
    Activity,
    Lock,
    ArrowRight,
    CheckCircle2,
    Shield,
    FileText,
    Zap,
    BookOpen,
    Eye,
    LifeBuoy,
    Target,
    Loader2
} from "lucide-react";
import { useLocation } from "wouter";
import { useClientContext } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import NISTLayout from "./NISTLayout";

export default function NISTDashboard() {
    const { selectedClientId } = useClientContext();
    const [, setLocation] = useLocation();

    // Fetch NIST Tiers
    const { data: nistTiersData, isLoading: tiersLoading } = trpc.maturity.getNistTiers.useQuery(
        { clientId: selectedClientId || 0 },
        { enabled: !!selectedClientId }
    );

    // Fetch Overall Maturity assessments to get actual implementation progress
    const { data: assessments, isLoading: assessmentsLoading } = trpc.maturity.getAssessments.useQuery(
        { clientId: selectedClientId || 0, frameworkId: 'nist-csf-2' },
        { enabled: !!selectedClientId }
    );

    // Fetch Framework Data (Requirements) to calculate %
    const { data: frameworkData } = trpc.maturity.getFrameworkData.useQuery(
        { frameworkId: 'nist-csf-2' },
        { enabled: !!selectedClientId }
    );

    const scores = useMemo(() => {
        if (!assessments || !frameworkData) return { overall: 0, byFunction: {} as Record<string, number> };

        const total = frameworkData.requirements.length;
        const achieved = assessments.filter(a => a.isAchieved).length;
        const overall = total > 0 ? Math.round((achieved / total) * 100) : 0;

        const byFunction: Record<string, number> = {};
        frameworkData.categories.filter(c => !c.parentId).forEach(cat => {
            const catReqs = frameworkData.requirements.filter(r => r.categoryId === cat.id);
            const catAchieved = assessments.filter(a => a.isAchieved && catReqs.some(r => r.id === a.requirementId)).length;
            byFunction[cat.code] = catReqs.length > 0 ? Math.round((catAchieved / catReqs.length) * 100) : 0;
        });

        return { overall, byFunction };
    }, [assessments, frameworkData]);

    // Mock action items (in reality, pulling from failing assessments, open POAMs, or expired policies)
    const actionItems = useMemo(() => {
        if (!assessments || !frameworkData) return [];
        return assessments
            .filter(a => !a.isAchieved && (a.status === 'not_implemented' || a.status === 'partially_implemented'))
            .map(a => {
                const req = frameworkData.requirements.find(r => r.id === a.requirementId);
                return {
                    id: a.id,
                    title: req ? `${req.code} - ${req.title}` : 'Review pending control',
                    type: 'Assessment Action',
                    priority: 'High',
                    path: `/clients/${selectedClientId}/nist/assessment`
                };
            })
            .slice(0, 5); // Take top 5 for the primary queue
    }, [assessments, frameworkData]);

    const tiers = useMemo(() => {
        const result = {
            current: 'Tier 1',
            target: 'Tier 1',
            avgCurrent: 1,
            avgTarget: 1
        };

        if (nistTiersData && nistTiersData.length > 0) {
            const sumCurrent = nistTiersData.reduce((acc, t) => acc + (t.currentTier || 1), 0);
            const sumTarget = nistTiersData.reduce((acc, t) => acc + (t.targetTier || 1), 0);
            const avgC = Math.round(sumCurrent / nistTiersData.length);
            const avgT = Math.round(sumTarget / nistTiersData.length);

            result.avgCurrent = avgC;
            result.avgTarget = avgT;
            result.current = `Tier ${avgC}`;
            result.target = `Tier ${avgT}`;
        }

        return result;
    }, [nistTiersData]);

    const functions = [
        {
            title: "GOVERN",
            id: "GV",
            description: "Establish and monitor the organization's cybersecurity risk management strategy, roles, and policies.",
            icon: FileText,
            color: "from-blue-500 to-indigo-400",
            textColor: "text-blue-600",
            bgLight: "bg-blue-50",
            path: `/clients/${selectedClientId}/nist/assessment?function=govern`,
            progress: scores.byFunction['GV'] || 0
        },
        {
            title: "IDENTIFY",
            id: "ID",
            description: "Determine current cybersecurity risks to assets, systems, and data.",
            icon: Eye,
            color: "from-purple-500 to-violet-400",
            textColor: "text-purple-600",
            bgLight: "bg-purple-50",
            path: `/clients/${selectedClientId}/nist/assessment?function=identify`,
            progress: scores.byFunction['ID'] || 0
        },
        {
            title: "PROTECT",
            id: "PR",
            description: "Use safeguards to prevent or reduce the impact of potential cybersecurity events.",
            icon: ShieldCheck,
            color: "from-emerald-500 to-teal-400",
            textColor: "text-emerald-600",
            bgLight: "bg-emerald-50",
            path: `/clients/${selectedClientId}/nist/assessment?function=protect`,
            progress: scores.byFunction['PR'] || 0
        },
        {
            title: "DETECT",
            id: "DE",
            description: "Find and analyze possible cybersecurity attacks and compromises.",
            icon: Activity,
            color: "from-amber-500 to-orange-400",
            textColor: "text-amber-600",
            bgLight: "bg-amber-50",
            path: `/clients/${selectedClientId}/nist/assessment?function=detect`,
            progress: scores.byFunction['DE'] || 0
        },
        {
            title: "RESPOND",
            id: "RS",
            description: "Take action regarding a detected cybersecurity incident.",
            icon: Zap,
            color: "from-rose-500 to-red-400",
            textColor: "text-rose-600",
            bgLight: "bg-rose-50",
            path: `/clients/${selectedClientId}/nist/assessment?function=respond`,
            progress: scores.byFunction['RS'] || 0
        },
        {
            title: "RECOVER",
            id: "RC",
            description: "Restore assets and operations that were affected by a cybersecurity incident.",
            icon: LifeBuoy,
            color: "from-cyan-500 to-sky-400",
            textColor: "text-cyan-600",
            bgLight: "bg-cyan-50",
            path: `/clients/${selectedClientId}/nist/assessment?function=recover`,
            progress: scores.byFunction['RC'] || 0
        }
    ];

    if (tiersLoading || assessmentsLoading) {
        return (
            <NISTLayout fullWidth>
                <div className="flex items-center justify-center p-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </NISTLayout>
        );
    }

    return (
        <NISTLayout fullWidth>
            <div className="space-y-10 pb-20 animate-in fade-in duration-700">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-12 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />

                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                <Shield className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Unified Compliance Hub</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                                Command <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                                    Center
                                </span>
                            </h1>
                            <p className="text-lg text-slate-300 leading-relaxed max-w-lg">
                                Your central hub for cross-framework readiness, prioritised actions, and continuous monitoring.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Button
                                    onClick={() => setLocation(`/clients/${selectedClientId}/nist/assessment`)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                                >
                                    Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Score Card */}
                        <div className="hidden md:flex justify-center relative">
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-3xl w-full max-w-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-slate-200">Current Maturity</h3>
                                    <Badge variant="outline" className="border-blue-400 text-blue-300">{tiers.current}</Badge>
                                </div>
                                <div className="flex items-end gap-2 mb-2">
                                    <span className="text-5xl font-extrabold text-blue-400">{scores.overall}%</span>
                                    <span className="text-slate-400 mb-2">implemented</span>
                                </div>
                                <Progress value={scores.overall} className="h-3 bg-white/10 mb-6" />

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="text-xs text-slate-400 uppercase font-bold mb-1">Target</div>
                                        <div className="text-white font-bold flex items-center gap-2">
                                            <Target className="h-4 w-4 text-emerald-400" /> {tiers.target}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="text-xs text-slate-400 uppercase font-bold mb-1">Gap</div>
                                        <div className="text-white font-bold transition-colors">
                                            {tiers.avgTarget - tiers.avgCurrent > 0 ? (
                                                <span className="text-amber-400">+{tiers.avgTarget - tiers.avgCurrent} Tier Level</span>
                                            ) : (
                                                <span className="text-emerald-400 tracking-tighter uppercase text-[10px]">Target Met</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Queue */}
                <Card className="border-rose-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-2 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                    <CardHeader className="bg-gradient-to-r from-rose-50/80 to-white pb-6 border-b border-rose-100/50 relative z-10">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-2xl text-rose-950 flex items-center gap-2 mb-1">
                                    <div className="bg-rose-100 p-2 rounded-xl">
                                        <AlertTriangle className="w-6 h-6 text-rose-600" />
                                    </div>
                                    Needs Attention
                                </CardTitle>
                                <CardDescription className="text-rose-700/80 font-medium ml-12">Prioritized compliance tasks and failing controls across your ecosystem</CardDescription>
                            </div>
                            <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200 shadow-sm px-3 py-1 font-bold">{actionItems.length} Pending</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 relative z-10">
                        {actionItems.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 flex flex-col items-center bg-white">
                                <div className="bg-emerald-50 p-4 rounded-full mb-4 ring-8 ring-emerald-50/50">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                </div>
                                <p className="text-xl font-bold text-slate-900 mb-1">All caught up!</p>
                                <p className="text-slate-500">No critical actions required at this time.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-rose-100/50 bg-white">
                                {actionItems.map((item, idx) => (
                                    <div key={idx} className="p-5 hover:bg-rose-50/40 flex justify-between items-center transition-all group">
                                        <div className="flex items-center gap-5">
                                            <div className="bg-white border rounded-xl p-3 shadow-sm ring-1 ring-black/5 group-hover:border-rose-300 transition-colors">
                                                <Target className="w-5 h-5 text-rose-500" />
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-slate-900 text-base group-hover:text-rose-700">{item.title}</p>
                                                <p className="text-sm text-slate-500">{item.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant="outline" className="border-rose-200 text-rose-600 bg-rose-50/50 uppercase tracking-widest text-[10px]">{item.priority}</Badge>
                                            <Button size="sm" onClick={() => setLocation(item.path)} className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-200">Review</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* NIST Functions Grid */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 px-1">Posture by NIST CSF Function</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {functions.map((func, idx) => (
                            <Card key={idx} className="group overflow-hidden border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => setLocation(func.path)}>
                                <CardContent className="p-0">
                                    <div className={`h-1.5 bg-gradient-to-r ${func.color}`} />
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-xl ${func.bgLight} ${func.textColor}`}>
                                                <func.icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{func.progress}%</span>
                                            </div>
                                        </div>

                                        <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{func.title}</h2>
                                        <p className="text-sm text-slate-500 mb-6 line-clamp-2 h-10">
                                            {func.description}
                                        </p>

                                        <Progress value={func.progress} className="h-1.5 mb-4" />

                                        <div className="flex justify-between items-center text-xs font-medium text-slate-400">
                                            <span>Click to assess</span>
                                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform text-primary" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">The Compliance Command Center</h2>
                            <p className="text-slate-600 mb-4">
                                This unified dashboard maps your organization's internal compliance efforts to the six core functions of the NIST Cybersecurity Framework (CSF) 2.0: Govern, Identify, Protect, Detect, Respond, and Recover. Action items from your System Scoping (RMF) and Risk Management (800-30) activities automatically feed into this view.
                            </p>
                            <Button variant="outline" onClick={() => window.open('https://www.nist.gov/cyberframework', '_blank')}>
                                Learn More at NIST.gov
                            </Button>
                        </div>
                        <div className="flex-shrink-0 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    <span className="font-medium">Actionable Insights</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    <span className="font-medium">Cross-Framework Mapping</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    <span className="font-medium">Continuous Monitoring</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </NISTLayout>
    );
}
