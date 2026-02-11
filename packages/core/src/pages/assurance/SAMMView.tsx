import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Shield, Target, TrendingUp, BookOpen, AlertCircle, CheckCircle2, Info, ChevronDown, ChevronUp, ArrowRight, ListChecks, ExternalLink } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import { SAMM_OFFICIAL_CONTENT } from "./SAMM_CONTENT";
import { PageGuide } from "@/components/PageGuide";

const SAMM_STRUCTURE = [
    {
        function: "Governance",
        practices: [
            { id: "SM", name: "Strategy & Metrics", description: "Establish and maintain a strategy for software security." },
            { id: "PC", name: "Policy & Compliance", description: "Manage compliance with internal policies and external regulations." },
            { id: "EG", name: "Education & Guidance", description: "Build security knowledge and skills across the organization." },
        ],
    },
    {
        function: "Design",
        practices: [
            { id: "TA", name: "Threat Assessment", description: "Identify and understand software-related threats." },
            { id: "SR", name: "Security Requirements", description: "Specify security requirements for software development." },
            { id: "SA", name: "Security Architecture", description: "Design security into software and its environment." },
        ],
    },
    {
        function: "Implementation",
        practices: [
            { id: "SB", name: "Secure Build", description: "Establish a secure software build process." },
            { id: "SD", name: "Secure Deployment", description: "Ensure the security of software deployment." },
            { id: "DM", name: "Defect Management", description: "Manage security defects effectively." },
        ],
    },
    {
        function: "Verification",
        practices: [
            { id: "AR", name: "Architecture Review", description: "Verify the security of software architecture." },
            { id: "ST", name: "Security Testing", description: "Perform security testing throughout the lifecycle." },
            { id: "ER", name: "Requirements Driven Verification", description: "Verify software against security requirements." },
        ],
    },
    {
        function: "Operations",
        practices: [
            { id: "IM", name: "Incident Management", description: "Respond to and manage security incidents." },
            { id: "EM", name: "Environment Management", description: "Manage the security of the operating environment." },
            { id: "OM", name: "Operational Management", description: "Maintain security during software operations." },
        ],
    },
];

const MATURITY_LEVELS = [
    { level: 0, label: "Level 0", description: "Practice not implemented." },
    { level: 1, label: "Level 1", description: "Initial understanding and ad hoc implementation." },
    { level: 2, label: "Level 2", description: "Structured and efficient practice across the organization." },
    { level: 3, label: "Level 3", description: "Optimized and continuously improving practice." },
];

export default function SAMMView() {
    const { id } = useParams<{ id: string }>();
    const [, setLocation] = useLocation();
    const clientId = parseInt(id || "0");
    const [expandedPractices, setExpandedPractices] = useState<string[]>([]);

    const togglePractice = (id: string) => {
        setExpandedPractices(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const { data: maturityData, refetch } = trpc.samm.getMaturity.useQuery({ clientId });
    const [localScores, setLocalScores] = useState<any[]>([]);

    useEffect(() => {
        if (maturityData) {
            setLocalScores(maturityData);
        }
    }, [maturityData]);

    const updateMutation = trpc.samm.updateMaturity.useMutation({
        onSuccess: () => {
            toast.success("Maturity level saved successfully");
            refetch();
        },
        onError: (err) => {
            toast.error("Failed to save maturity level: " + err.message);
            // Revert on error if necessary, but for now we just show toast
        }
    });

    const generatePlanMutation = trpc.samm.generateImprovementPlan.useMutation({
        onSuccess: (data) => {
            toast.success("Improvement Plan Created", {
                description: `Generated ${data.taskCount} tasks for ${data.gaps} practices with gaps.`
            });
            setLocation(`/clients/${clientId}/implementation/kanban/${data.planId}`);
        },
        onError: (err) => {
            toast.error("Failed to generate plan: " + err.message);
        }
    });

    const getPracticeScore = (practiceId: string) => {
        return localScores?.find(s => s.practiceId === practiceId) || { maturityLevel: 0, targetLevel: 1, notes: "" };
    };

    const handleUpdate = (practiceId: string, updates: any) => {
        // Optimistic update
        setLocalScores(prev => {
            const existing = prev.find(s => s.practiceId === practiceId);
            if (existing) {
                return prev.map(s => s.practiceId === practiceId ? { ...s, ...updates } : s);
            }
            return [...prev, { practiceId, clientId, ...updates, maturityLevel: updates.maturityLevel ?? 0, targetLevel: updates.targetLevel ?? 1 }];
        });

        updateMutation.mutate({
            clientId,
            practiceId,
            ...updates
        });
    };

    const calculateOverallMaturity = () => {
        if (!localScores || localScores.length === 0) return 0;
        const sum = localScores.reduce((acc, curr) => acc + (curr.maturityLevel || 0), 0);
        return (sum / (SAMM_STRUCTURE.flatMap(f => f.practices).length * 3)) * 100;
    };

    const calculateGaps = () => {
        if (!localScores || localScores.length === 0) return 0;
        return localScores.filter(s => s.maturityLevel < s.targetLevel).length;
    };

    const hasGaps = calculateGaps() > 0;

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-20 px-6">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Assurance", href: `/clients/${clientId}/assurance` },
                        { label: "SAMM Maturity" },
                    ]}
                />

                <div className="flex justify-between items-end">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-extrabold tracking-tight">OWASP SAMM Maturity</h1>
                            <PageGuide
                                title="OWASP SAMM Assessment"
                                description="Measure and improve your software assurance maturity across 15 security practices organized into 5 business functions."
                                rationale="SAMM provides a structured framework to assess your current security capabilities and create a roadmap for improvement."
                                howToUse={[
                                    { step: "Select Function", description: "Choose from Governance, Design, Implementation, Verification, or Operations." },
                                    { step: "Rate Current State", description: "For each practice, select your current maturity level (0-3)." },
                                    { step: "Set Target", description: "Define your target maturity level based on business needs." },
                                    { step: "Review Roadmap", description: "Expand practices to see criteria, next steps, and implementation links." }
                                ]}
                                integrations={[
                                    { name: "Risk Register", description: "Practice scores inform risk assessment priorities." },
                                    { name: "Implementation", description: "Jump directly to related modules to execute improvements." },
                                    { name: "AI Advisor", description: "Get personalized recommendations based on your evidence library." }
                                ]}
                            />
                        </div>
                        <p className="text-muted-foreground mt-2">Assess your organization's software assurance maturity level.</p>
                    </div>
                    <div className="text-right space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Overall Maturity Score</p>
                        <div className="flex items-center gap-4">
                            <Progress value={calculateOverallMaturity()} className="h-4 w-48" />
                            <span className="text-2xl font-bold">{Math.round(calculateOverallMaturity())}%</span>
                        </div>
                    </div>
                </div>

                {/* Generate Improvement Plan CTA */}
                {hasGaps && (
                    <Card className="border-2 border-[#0284c7]/20 bg-gradient-to-r from-[#0284c7]/5 to-emerald-500/5">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-[#0284c7]/10">
                                            <Target className="w-5 h-5 text-[#0284c7]" />
                                        </div>
                                        <h3 className="text-lg font-bold">Ready to Improve?</h3>
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                                            {calculateGaps()} {calculateGaps() === 1 ? 'Gap' : 'Gaps'} Identified
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                            {localScores.length} of 15 practices assessed
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground ml-12">
                                        Generate a tactical implementation plan with tasks for each <strong>assessed</strong> practice below target level.
                                        Tasks will be organized in the PDCA framework and ready to assign to your team.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => generatePlanMutation.mutate({ clientId })}
                                    disabled={generatePlanMutation.isPending}
                                    className="bg-[#0284c7] hover:bg-[#0369a1] text-white px-8 py-6 rounded-xl font-bold shadow-lg shadow-[#0284c7]/20"
                                >
                                    {generatePlanMutation.isPending ? (
                                        <>
                                            <span className="animate-spin mr-2">⚙️</span>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRight className="w-5 h-5 mr-2" />
                                            Generate Improvement Plan
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Tabs defaultValue="Governance" className="w-full">
                            <TabsList className="grid grid-cols-5 w-full bg-slate-200/30 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
                                {SAMM_STRUCTURE.map(f => (
                                    <TabsTrigger
                                        key={f.function}
                                        value={f.function}
                                        className="rounded-xl py-3 px-4 transition-all duration-200 font-bold text-slate-500 
                                                   hover:text-[#0284c7] hover:bg-[#0284c7]/5
                                                   data-[state=active]:bg-[#0284c7] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]"
                                    >
                                        {f.function}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {SAMM_STRUCTURE.map(f => (
                                <TabsContent key={f.function} value={f.function} className="mt-8 space-y-8">
                                    {f.practices.map(p => {
                                        const score = getPracticeScore(p.id);
                                        const official = SAMM_OFFICIAL_CONTENT[p.id];
                                        const isExpanded = expandedPractices.includes(p.id);
                                        const currentLevelDetail = official?.levels.find(l => l.level === score.maturityLevel);

                                        return (
                                            <Card key={p.id} className={`overflow-hidden transition-all duration-300 border-l-4 ${isExpanded ? "border-l-[#0284c7] shadow-xl" : "border-l-transparent hover:border-l-slate-300"}`}>
                                                <CardHeader className="flex flex-row items-center justify-between bg-slate-50/40 py-6">
                                                    <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => togglePractice(p.id)}>
                                                        <div className={`p-3 rounded-xl ${isExpanded ? "bg-[#0284c7] text-white" : "bg-slate-100 text-slate-500"}`}>
                                                            <Badge variant="outline" className="font-mono border-0 p-0 text-inherit">{p.id}</Badge>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <CardTitle className="text-xl font-bold">{p.name}</CardTitle>
                                                                {official && (
                                                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] py-0 px-2 font-black uppercase">
                                                                        Strategic
                                                                    </Badge>
                                                                )}
                                                                {official?.relatedPath && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-6 px-2 text-[10px] font-black uppercase text-primary hover:bg-primary/5 border border-primary/10"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (clientId) {
                                                                                setLocation(`/clients/${clientId}${official.relatedPath}`);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <ExternalLink className="w-3 h-3 mr-1" />
                                                                        Jump to {official.relatedModule || "Module"}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <CardDescription className="text-slate-500 font-medium">
                                                                {p.description}
                                                                {official && (
                                                                    <span className="block mt-1 text-[11px] text-primary/70 italic font-bold">
                                                                        Impact: {official.businessImpact}
                                                                    </span>
                                                                )}
                                                            </CardDescription>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => togglePractice(p.id)} className="rounded-full hover:bg-slate-100">
                                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                                                    </Button>
                                                </CardHeader>
                                                <CardContent className="p-8 space-y-10">
                                                    <div className="grid md:grid-cols-2 gap-12">
                                                        <div className="space-y-6">
                                                            <label className="text-xs uppercase tracking-widest font-black text-slate-400 flex items-center gap-2">
                                                                <TrendingUp className="w-4 h-4 text-primary" />
                                                                Current Maturity
                                                            </label>
                                                            <div className="grid grid-cols-4 gap-2">
                                                                {[0, 1, 2, 3].map(level => (
                                                                    <Button
                                                                        key={level}
                                                                        variant={score.maturityLevel === level ? "default" : "outline"}
                                                                        onClick={() => handleUpdate(p.id, { maturityLevel: level })}
                                                                        className={`h-14 rounded-xl font-bold transition-all ${score.maturityLevel === level ? "bg-[#0284c7] scale-105 shadow-md" : "hover:border-[#0284c7] hover:text-[#0284c7]"}`}
                                                                    >
                                                                        L{level}
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 min-h-[80px]">
                                                                <p className="text-sm font-semibold text-slate-700 mb-1">Status Summary</p>
                                                                <p className="text-sm text-slate-500 leading-relaxed italic">
                                                                    {currentLevelDetail?.description || "Assessment pending..."}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-6">
                                                            <label className="text-xs uppercase tracking-widest font-black text-slate-400 flex items-center gap-2">
                                                                <Target className="w-4 h-4 text-emerald-600" />
                                                                Target Posture
                                                            </label>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {[1, 2, 3].map(level => (
                                                                    <Button
                                                                        key={level}
                                                                        variant={score.targetLevel === level ? "secondary" : "outline"}
                                                                        className={`h-14 rounded-xl font-bold transition-all ${score.targetLevel === level ? "bg-emerald-50 text-emerald-700 border-emerald-200 scale-105 shadow-sm" : ""}`}
                                                                        onClick={() => handleUpdate(p.id, { targetLevel: level })}
                                                                    >
                                                                        Target {level}
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                            <div className="flex flex-col justify-center items-center p-4 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
                                                                <div className="flex -space-x-2">
                                                                    {[1, 2, 3].map(i => (
                                                                        <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold ${i <= score.targetLevel ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                                                                            {i}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Strategic Gap: {Math.max(0, score.targetLevel - score.maturityLevel)} Levels</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isExpanded && official && (
                                                        <div className="pt-8 border-t border-slate-100 flex flex-col gap-10 animate-in fade-in slide-in-from-top-4">
                                                            <div className="grid lg:grid-cols-3 gap-8">
                                                                <div className="lg:col-span-2 space-y-8">
                                                                    <div>
                                                                        <h4 className="text-lg font-bold flex items-center gap-2 mb-4 text-[#0284c7]">
                                                                            <ListChecks className="w-5 h-5" />
                                                                            Level {score.maturityLevel} Criteria
                                                                        </h4>
                                                                        <ul className="grid md:grid-cols-2 gap-3">
                                                                            {currentLevelDetail?.criteria.map((c, i) => (
                                                                                <li key={i} className="flex gap-3 text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                                                                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${score.maturityLevel > 0 ? "text-emerald-500" : "text-slate-300"}`} />
                                                                                    {c}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>

                                                                    <div className="bg-[#0284c7]/5 p-6 rounded-2xl border border-[#0284c7]/10">
                                                                        <h4 className="text-lg font-bold flex items-center gap-2 mb-4 text-[#0284c7]">
                                                                            <ArrowRight className="w-5 h-5" />
                                                                            Roadmap: Achieving Level {Math.min(3, score.maturityLevel + 1)}
                                                                        </h4>
                                                                        <div className="space-y-3">
                                                                            {currentLevelDetail?.nextSteps.map((s, i) => (
                                                                                <div key={i} className="flex gap-4 items-start bg-white p-4 rounded-xl shadow-sm border border-[#0284c7]/5 group hover:border-[#0284c7]/20 transition-colors">
                                                                                    <span className="bg-[#0284c7] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                                                                        {i + 1}
                                                                                    </span>
                                                                                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{s}</p>
                                                                                </div>
                                                                            ))}

                                                                            {official.relatedPath && (
                                                                                <Button
                                                                                    className="w-full mt-4 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl py-6 font-bold shadow-lg shadow-[#0284c7]/20 group"
                                                                                    onClick={() => {
                                                                                        if (clientId) {
                                                                                            setLocation(`/clients/${clientId}${official.relatedPath}`);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <span className="flex items-center gap-2">
                                                                                        Proceed to {official.relatedModule} Implementation
                                                                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                                                    </span>
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-6">
                                                                    <Card className="bg-slate-50 border-slate-200 shadow-none">
                                                                        <CardHeader className="pb-3">
                                                                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-600 uppercase tracking-tighter">
                                                                                <Info className="w-4 h-4" />
                                                                                Why it matters
                                                                            </CardTitle>
                                                                        </CardHeader>
                                                                        <CardContent className="space-y-4">
                                                                            <p className="text-sm text-slate-500 leading-relaxed">
                                                                                {official.fullDescription}
                                                                            </p>
                                                                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                                                                <p className="text-xs font-black text-primary uppercase mb-2">Business Impact</p>
                                                                                <p className="text-sm font-bold text-slate-700 italic">
                                                                                    "{official.businessImpact}"
                                                                                </p>
                                                                            </div>

                                                                            {official.standardLinks && (
                                                                                <div className="pt-4 border-t border-slate-200/60">
                                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Implementation & Verification Standards</p>
                                                                                    <div className="space-y-2">
                                                                                        {official.standardLinks.map((link, idx) => (
                                                                                            <a
                                                                                                key={idx}
                                                                                                href={link.url}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 hover:border-primary/30 hover:shadow-sm transition-all group"
                                                                                            >
                                                                                                <span className="text-[11px] font-bold text-slate-600 group-hover:text-primary transition-colors">{link.name}</span>
                                                                                                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-primary transition-colors" />
                                                                                            </a>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </CardContent>
                                                                    </Card>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>

                    <div className="space-y-6">
                        <Card className="bg-slate-900 text-white shadow-xl overflow-hidden border-0">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Shield className="w-24 h-24" />
                            </div>
                            <CardContent className="p-8 space-y-6 relative z-10">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <BookOpen className="w-6 h-6 text-teal-400" />
                                    AI Advisor Guidance
                                </h2>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    Select a practice to receive AI-powered recommendations based on your current security posture and evidence library.
                                </p>
                                <div className="bg-white/10 p-6 rounded-2xl border border-white/10 italic text-slate-400 text-sm">
                                    "To reach Level 2 in Practice Strategy & Metrics, consider formalizing security requirements within your development lifecycle and establishing key performance indicators (KPIs)."
                                </div>
                                <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white py-6 rounded-xl font-bold">
                                    Generate Full Roadmap
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="w-5 h-5 text-primary" />
                                    Maturity Guidelines
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {MATURITY_LEVELS.map(l => (
                                    <div key={l.level} className="flex gap-4">
                                        <div className="min-w-[40px] h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                            L{l.level}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{l.label}</p>
                                            <p className="text-xs text-muted-foreground">{l.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
