import React, { useState, useEffect, useMemo, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import {
    Shield, Target, TrendingUp, BookOpen, AlertCircle,
    CheckCircle2, Info, ChevronDown, ChevronUp, ArrowRight,
    ListChecks, ExternalLink, Activity, Layers, BarChart3,
    ClipboardCheck, FileText, Settings, Rocket, HelpCircle
} from "lucide-react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import { PageGuide } from "@/components/PageGuide";

// Constants for SAMM Business Functions
const BUSINESS_FUNCTIONS = [
    { id: "Governance", name: "Governance", color: "blue", icon: Shield },
    { id: "Design", name: "Design", color: "purple", icon: Layers },
    { id: "Implementation", name: "Implementation", color: "orange", icon: Rocket },
    { id: "Verification", name: "Verification", color: "emerald", icon: ClipboardCheck },
    { id: "Operations", name: "Operations", color: "amber", icon: Activity },
];

export default function SAMMV2View() {
    const { id } = useParams<{ id: string }>();
    const [, setLocation] = useLocation();
    const clientId = parseInt(id || "0");

    // State
    const [activePracticeId, setActivePracticeId] = useState<string | null>(null);
    const [activeFunction, setActiveFunction] = useState<string>("Governance");

    // Queries
    const { data: practices, isLoading: loadingPractices } = trpc.sammV2.getPractices.useQuery({ clientId });
    const { data: assessments, refetch: refetchAssessments } = trpc.sammV2.getAssessments.useQuery({ clientId });
    const { data: overallScore } = trpc.sammV2.calculateOverallScore.useQuery({ clientId });
    const generatePlanMutation = trpc.sammV2.generateImprovementPlan.useMutation();

    // Select first practice of initial function on load
    useEffect(() => {
        if (practices && !activePracticeId) {
            const firstPractice = practices.find(p => p.businessFunction === "Governance");
            if (firstPractice) setActivePracticeId(firstPractice.practiceId);
        }
    }, [practices, activePracticeId]);

    const activePractice = useMemo(() =>
        practices?.find(p => p.practiceId === activePracticeId),
        [practices, activePracticeId]
    );

    // Filtered practices for the current business function
    const filteredPractices = useMemo(() =>
        practices?.filter(p => p.businessFunction === activeFunction) || [],
        [practices, activeFunction]
    );

    if (loadingPractices) {
        return (
            <DashboardLayout>
                <div className="flex h-screen items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-6 pb-12">
                <Breadcrumb
                    items={[
                        { label: "Assurance", href: `/clients/${clientId}/assurance` },
                        { label: "OWASP SAMM v2", active: true }
                    ]}
                />

                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            <Shield className="w-10 h-10 text-primary" />
                            OWASP SAMM <span className="text-primary">v2</span>
                        </h1>
                        <p className="text-slate-500 font-medium max-w-2xl">
                            Comprehensive Software Assurance Maturity Model assessment.
                            Measure your AppSec program across 15 practices and 30 maturity streams.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <PageGuide
                            title="SAMM Assessment Guide"
                            description="A comprehensive guide to performing OWASP SAMM v2 assessments using the stream-based model."
                            rationale="SAMM v2's stream-based model ensures a balanced approach between having the right processes (Stream A) and actually measuring their effectiveness (Stream B). This diagnostic balance prevents 'flying blind' in your security program."
                            howToUse={[
                                {
                                    step: "Stream A vs. Stream B",
                                    description: "Stream A focuses on policies and tools. Stream B focuses on verification and metrics. Your practice score is the average of both."
                                },
                                {
                                    step: "Diagnostic Balance",
                                    description: "Identify gaps where you have tools (Stream A) but no data (Stream B). Bring both into balance for true maturity."
                                },
                                {
                                    step: "Achieve Your Goals",
                                    description: "Set targets for each stream and use the 'Build Roadmap' feature to generate a tactical task list."
                                }
                            ]}
                        />
                        <Button variant="outline" className="gap-2">
                            <BarChart3 className="w-4 h-4" />
                            View Benchmarks
                        </Button>
                        <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                            <ClipboardCheck className="w-4 h-4" />
                            Export Report
                        </Button>
                    </div>
                </div>

                {/* Global Score Panel */}
                <Card className="border-none bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <TrendingUp className="w-48 h-48" />
                    </div>
                    <CardContent className="p-8 flex flex-col md:flex-row items-center gap-12 relative z-10">
                        <div className="flex flex-col items-center gap-2">
                            <div className="relative w-40 h-40 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth="12"
                                        fill="transparent"
                                    />
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        stroke="#0ea5e9"
                                        strokeWidth="12"
                                        fill="transparent"
                                        strokeDasharray={440}
                                        strokeDashoffset={440 - (440 * (overallScore?.overallScore || 0) / 3)}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-5xl font-black text-white">{(overallScore?.overallScore || 0).toFixed(1)}</span>
                                    <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Maturity Level</span>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-white/10 text-sky-400 border-white/20 px-3 py-1">
                                Target: {overallScore?.overallTarget?.toFixed(1) || "1.5"}
                            </Badge>
                        </div>

                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-6 w-full">
                            {BUSINESS_FUNCTIONS.map((f) => {
                                const fScore = overallScore?.businessFunctions?.[f.id];
                                return (
                                    <div key={f.id} className="space-y-2 group cursor-pointer" onClick={() => setActiveFunction(f.id)}>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-bold uppercase tracking-wider ${activeFunction === f.id ? 'text-white' : 'text-slate-400'}`}>
                                                {f.name}
                                            </span>
                                            <span className="text-lg font-bold">{(fScore?.score || 0).toFixed(1)}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-sky-500 transition-all duration-700 ${activeFunction === f.id ? 'opacity-100 shadow-[0_0_8px_rgba(14,165,233,0.5)]' : 'opacity-40'}`}
                                                style={{ width: `${(fScore?.score || 0) / 3 * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] text-slate-400">Target: {fScore?.target?.toFixed(1) || "1.0"}</span>
                                            <f.icon className={`w-3 h-3 ${activeFunction === f.id ? 'text-sky-400' : 'text-slate-500'}`} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-12 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-2">
                            <div className="grid grid-cols-5 gap-1 mb-4">
                                {BUSINESS_FUNCTIONS.map((f) => {
                                    const Icon = f.icon;
                                    const isActive = activeFunction === f.id;
                                    return (
                                        <button
                                            key={f.id}
                                            onClick={() => setActiveFunction(f.id)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${isActive
                                                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                                }`}
                                            title={f.name}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="space-y-1">
                                {filteredPractices.map((p) => {
                                    const isActive = activePracticeId === p.practiceId;
                                    const pScore = assessments?.filter(a => a.practiceId === p.practiceId) || [];
                                    const streamsCompleted = pScore.length;

                                    return (
                                        <button
                                            key={p.practiceId}
                                            onClick={() => setActivePracticeId(p.practiceId)}
                                            className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group ${isActive
                                                ? "bg-slate-900 text-white shadow-xl"
                                                : "hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                                                    }`}>
                                                    {p.practiceId}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold truncate max-w-[150px]">{p.practiceName}</span>
                                                    <span className={`text-[10px] uppercase tracking-widest font-bold ${isActive ? "text-slate-400" : "text-slate-400"
                                                        }`}>
                                                        {streamsCompleted}/2 Streams
                                                    </span>
                                                </div>
                                            </div>
                                            {isActive && <ChevronRight className="w-4 h-4 text-primary" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Improvement Plan CTA */}
                        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-none shadow-none p-6 rounded-3xl">
                            <div className="flex flex-col space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <Target className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-emerald-900">Need an action plan?</h4>
                                    <p className="text-xs text-emerald-700/80 leading-relaxed font-medium">
                                        Generate a customized implementation plan based on your current gaps.
                                    </p>
                                </div>
                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 py-6 font-black"
                                    disabled={generatePlanMutation.isLoading}
                                    onClick={() => {
                                        toast.promise(generatePlanMutation.mutateAsync({ clientId }), {
                                            loading: "Building your security roadmap...",
                                            success: (res) => {
                                                setLocation(`/clients/${clientId}/implementation/kanban/${res.planId}`);
                                                return `Generated plan with ${res.taskCount} tasks!`;
                                            },
                                            error: (err) => `Failed to generate plan: ${err.message}`
                                        });
                                    }}
                                >
                                    {generatePlanMutation.isLoading ? "Building..." : "Build Roadmap"}
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* Main Assessment Area */}
                    <div className="col-span-12 lg:col-span-8 xl:col-span-9">
                        {activePractice ? (
                            <PracticeAssessment
                                practice={activePractice}
                                clientId={clientId}
                                onUpdate={refetchAssessments}
                                existingAssessments={assessments?.filter(a => a.practiceId === activePracticeId) || []}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center space-y-4 p-12 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center animate-pulse">
                                    <Info className="w-8 h-8 text-slate-400" />
                                </div>
                                <p className="text-slate-400 font-medium">Select a practice to begin assessment</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

// Sub-component for individual practice assessment
function PracticeAssessment({ practice, clientId, onUpdate, existingAssessments }: {
    practice: any,
    clientId: number,
    onUpdate: () => void,
    existingAssessments: any[]
}) {
    const [activeStream, setActiveStream] = useState<"A" | "B">("A");

    const streamA = existingAssessments?.find(a => a.streamId === "A");
    const streamB = existingAssessments?.find(a => a.streamId === "B");

    const [maturityA, setMaturityA] = useState(streamA?.maturityLevel || 0);
    const [maturityB, setMaturityB] = useState(streamB?.maturityLevel || 0);

    // Sync state when props change
    useEffect(() => {
        if (streamA) setMaturityA(streamA.maturityLevel);
    }, [streamA?.maturityLevel]);

    useEffect(() => {
        if (streamB) setMaturityB(streamB.maturityLevel);
    }, [streamB?.maturityLevel]);

    const handleMaturityChange = useCallback((newLevel: number) => {
        if (activeStream === "A") {
            setMaturityA(newLevel);
        } else {
            setMaturityB(newLevel);
        }
    }, [activeStream]);

    const score = (maturityA + maturityB) / 2;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Practice Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-2 max-w-2xl">
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-black px-3 py-1">
                        {practice.businessFunction}
                    </Badge>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">{practice.practiceName}</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        {practice.description}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-8 px-10">
                    <div className="flex flex-col items-center">
                        <span className="text-xs uppercase tracking-widest font-black text-slate-400 mb-1">Maturity</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-primary">{score.toFixed(1)}</span>
                            <span className="text-sm text-slate-400 font-bold">/ 3.0</span>
                        </div>
                    </div>
                    <div className="h-10 w-px bg-slate-100"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-xs uppercase tracking-widest font-black text-slate-400 mb-1">Status</span>
                        <Badge variant={score > 1.5 ? "success" : score > 0.5 ? "warning" : "default"} className="font-bold text-sm px-3 py-1">
                            {score === 3 ? "Optimized" : score >= 2 ? "Managed" : score >= 1 ? "Defined" : "Initial"}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Streams Tabs */}
            <div className="grid grid-cols-2 gap-6">
                <StreamCard
                    streamId="A"
                    name={practice.streamAName}
                    description={practice.streamADescription}
                    active={activeStream === "A"}
                    onClick={() => setActiveStream("A")}
                    maturity={maturityA}
                />
                <StreamCard
                    streamId="B"
                    name={practice.streamBName}
                    description={practice.streamBDescription}
                    active={activeStream === "B"}
                    onClick={() => setActiveStream("B")}
                    maturity={maturityB}
                />
            </div>

            {/* Stream Assessment Area */}
            <StreamAssessmentPanel
                clientId={clientId}
                practiceId={practice.practiceId}
                streamId={activeStream}
                streamName={activeStream === "A" ? practice.streamAName : practice.streamBName}
                onUpdate={onUpdate}
                assessment={activeStream === "A" ? streamA : streamB}
                onMaturityChange={handleMaturityChange}
            />
        </div>
    );
}

function StreamCard({ streamId, name, description, active, onClick, maturity }: any) {
    return (
        <button
            onClick={onClick}
            className={`relative p-6 rounded-3xl border transition-all text-left overflow-hidden group ${active
                ? "border-primary bg-primary/5 shadow-inner"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                }`}
        >
            {active && (
                <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-primary/10 rounded-full blur-2xl"></div>
            )}
            <div className="flex items-center justify-between mb-3 relative z-10">
                <Badge variant="outline" className={`${active ? "border-primary text-primary" : "text-slate-400 border-slate-200"} font-black px-2`}>
                    Stream {streamId}
                </Badge>
                <div className="flex items-center gap-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i <= maturity ? "bg-primary" : "bg-slate-200"}`}></div>
                    ))}
                </div>
            </div>
            <h4 className={`text-xl font-black mb-1 relative z-10 ${active ? "text-slate-900" : "text-slate-700"}`}>{name}</h4>
            <p className="text-xs text-slate-500 font-medium line-clamp-2 relative z-10">{description}</p>

            {active && (
                <div className="absolute bottom-4 right-4 animate-bounce">
                    <ArrowRight className="w-4 h-4 text-primary" />
                </div>
            )}
        </button>
    );
}

function StreamAssessmentPanel({ clientId, practiceId, streamId, streamName, onUpdate, assessment, onMaturityChange }: any) {
    const { data: questions, isLoading } = trpc.sammV2.getStreamQuestions.useQuery(
        { practiceId, streamId },
        { enabled: !!practiceId }
    );
    const [localAnswers, setLocalAnswers] = useState<Record<string, boolean>>(assessment?.assessmentAnswers || {});
    // ... other states unchanged ...
    const [localQuality, setLocalQuality] = useState<Record<string, Record<string, boolean>>>(assessment?.qualityCriteria || {});
    const [localLevelNotes, setLocalLevelNotes] = useState<Record<string, string>>(assessment?.levelNotes || {});
    const [notes, setNotes] = useState(assessment?.notes || "");
    const [target, setTarget] = useState(assessment?.targetLevel || 1);

    // Sync with prop when props change
    useEffect(() => {
        setLocalAnswers(assessment?.assessmentAnswers || {});
        // ...
        setLocalQuality(assessment?.qualityCriteria || {});
        setLocalLevelNotes(assessment?.levelNotes || {});
        setNotes(assessment?.notes || "");
        setTarget(assessment?.targetLevel || 1);
    }, [assessment, streamId]);

    // ... updateMutation unchanged ...

    const updateMutation = trpc.sammV2.updateStreamAssessment.useMutation({
        onSuccess: () => {
            onUpdate();
            toast.success(`Stream ${streamId} updated`);
        }
    });

    const handleToggleAnswer = (level: number, value: boolean) => {
        const key = String(level); // Force string key
        setLocalAnswers(prev => ({ ...prev, [key]: value }));
    };

    const handleToggleQuality = (level: number, index: number, value: boolean) => {
        setLocalQuality(prev => ({
            ...prev,
            [level]: { ...(prev[level] || {}), [index]: value }
        }));
    };

    // Robust calculation logic
    const calculatedMaturity = useMemo(() => {
        let max = 0;
        // Check levels sequentially, handling string/number key ambiguity
        if (localAnswers["1"] || localAnswers[1]) max = 1; else return 0;
        if (localAnswers["2"] || localAnswers[2]) max = 2; else return 1;
        if (localAnswers["3"] || localAnswers[3]) max = 3; else return 2;
        return max;
    }, [localAnswers]);

    // Report maturity change
    useEffect(() => {
        if (onMaturityChange) {
            onMaturityChange(calculatedMaturity);
        }
    }, [calculatedMaturity, onMaturityChange]);

    // ... JSX ...


    const saveAssessment = () => {
        updateMutation.mutate({
            clientId,
            practiceId,
            streamId,
            maturityLevel: calculatedMaturity,
            targetLevel: target,
            assessmentAnswers: localAnswers,
            qualityCriteria: localQuality,
            levelNotes: localLevelNotes,
            notes
        });
    };

    if (isLoading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <ClipboardCheck className="w-6 h-6 text-primary" />
                    Stream {streamId} Assessment
                </h3>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Target Level</span>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {[1, 2, 3].map(i => (
                            <button
                                key={i}
                                onClick={() => setTarget(i)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${target === i ? "bg-white shadow-sm text-primary" : "text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                L{i}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid gap-8">
                {questions?.map((q: any) => {
                    const isAchieved = localAnswers[q.level];
                    const isTarget = q.level === target;

                    return (
                        <Card key={q.id} className={`border-none shadow-none overflow-hidden rounded-3xl transition-all ${isAchieved ? "bg-white ring-2 ring-primary/20" : "bg-white border border-slate-100"
                            }`}>
                            <div className="grid md:grid-cols-12">
                                <div className={`md:col-span-1 p-4 flex flex-col items-center justify-center border-r border-slate-50 transition-colors ${isAchieved ? "bg-primary text-white" : "bg-slate-50 text-slate-400"
                                    }`}>
                                    <span className="text-sm font-black italic">LVL</span>
                                    <span className="text-3xl font-black">{q.level}</span>
                                </div>

                                <div className="md:col-span-11 p-8">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className={`${isAchieved ? "border-primary/30 text-primary bg-primary/5" : "text-slate-400"}`}>
                                                    Level {q.level}
                                                </Badge>
                                                {isTarget && (
                                                    <Badge className="bg-emerald-500 text-white border-none gap-1 font-bold">
                                                        <Target className="w-3 h-3" /> Target
                                                    </Badge>
                                                )}
                                            </div>
                                            <h4 className="text-xl font-bold text-slate-900 leading-tight">
                                                {q.question}
                                            </h4>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant={isAchieved ? "default" : "outline"}
                                                className={`rounded-2xl h-20 px-10 transition-all font-black text-lg ${isAchieved
                                                    ? "bg-primary hover:bg-primary/90 scale-105 shadow-xl shadow-primary/20"
                                                    : "hover:border-primary hover:text-primary"
                                                    }`}
                                                onClick={() => handleToggleAnswer(q.level, !isAchieved)}
                                            >
                                                {isAchieved ? (
                                                    <div className="flex flex-col items-center">
                                                        <CheckCircle2 className="w-6 h-6 mb-1" />
                                                        <span>Achieved</span>
                                                    </div>
                                                ) : "Mark Achieved"}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Criteria & Quality */}
                                    <div className="grid lg:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-[#0284c7] flex items-center gap-2">
                                                <ListChecks className="w-3.5 h-3.5" />
                                                Activity & Criteria
                                            </h5>
                                            <div className="space-y-3">
                                                {q.qualityCriteria?.map((criterion: string, idx: number) => {
                                                    const isChecked = localQuality[q.level]?.[idx];
                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={() => handleToggleQuality(q.level, idx, !isChecked)}
                                                            className={`flex gap-4 items-start p-4 rounded-2xl transition-all cursor-pointer border ${isChecked
                                                                ? "bg-sky-50/50 border-sky-100"
                                                                : "bg-white border-slate-100 hover:border-slate-200"
                                                                }`}
                                                        >
                                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all ${isChecked ? "bg-sky-500 text-white shadow-md shadow-sky-500/20" : "bg-slate-100 text-slate-300"
                                                                }`}>
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </div>
                                                            <span className={`text-sm font-medium leading-relaxed ${isChecked ? "text-slate-800" : "text-slate-500"}`}>
                                                                {criterion}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                    <Rocket className="w-3.5 h-3.5 text-orange-500" />
                                                    Expected Benefits
                                                </h5>
                                                <p className="text-sm text-slate-600 font-medium italic leading-relaxed">
                                                    "{q.benefits}"
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                    <FileText className="w-3.5 h-3.5 text-primary" />
                                                    Suggested Evidence
                                                </h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {q.suggestedEvidence?.map((item: string, idx: number) => (
                                                        <Badge key={idx} variant="secondary" className="bg-white border-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg shadow-sm">
                                                            {item}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Level-specific Notes */}
                                    <div className="mt-10 -mx-8 -mb-8">
                                        <div className="px-8 py-3 bg-slate-50 border-t border-b border-slate-100 flex items-center justify-between">
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <FileText className="w-3.5 h-3.5" />
                                                Implementation Findings & Evidence (Level {q.level})
                                            </h5>
                                        </div>
                                        <textarea
                                            value={localLevelNotes[q.level] || ""}
                                            onChange={(e) => setLocalLevelNotes(prev => ({ ...prev, [q.level]: e.target.value }))}
                                            placeholder={`Document how your organization satisfies the requirements for Level ${q.level}...`}
                                            className="w-full min-h-[100px] p-8 bg-white text-sm text-slate-600 placeholder:text-slate-300 transition-all outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Notes Area */}
            <Card className="rounded-3xl border-none bg-white p-8 space-y-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Info className="w-5 h-5 text-primary" />
                        Assessment Notes & Evidence
                    </h4>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-primary font-bold"
                        onClick={() => window.open("https://owaspsamm.org/model/", "_blank")}
                    >
                        <ExternalLink className="w-4 h-4" />
                        SAMM Docs
                    </Button>
                </div>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add supporting evidence, notes on gaps, or internal discussions here..."
                    className="w-full min-h-[150px] p-6 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
                />
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                    <Button
                        variant="outline"
                        className="px-8 rounded-xl font-bold h-12"
                        onClick={() => {
                            setLocalAnswers(assessment?.assessmentAnswers || {});
                            setLocalQuality(assessment?.qualityCriteria || {});
                            setLocalLevelNotes(assessment?.levelNotes || {});
                            setNotes(assessment?.notes || "");
                        }}
                    >
                        Reset Changes
                    </Button>
                    <Button
                        className="px-10 rounded-xl font-black h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                        onClick={saveAssessment}
                        disabled={updateMutation.isLoading}
                    >
                        {updateMutation.isLoading ? "Saving..." : "Save Assessment"}
                    </Button>
                </div>
            </Card>
        </div>
    );
}

function ChevronRight(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/1999/xlink"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9 18l6-6-6-6" />
        </svg>
    );
}
