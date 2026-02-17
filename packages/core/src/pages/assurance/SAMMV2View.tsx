import React, { useState, useEffect, useMemo, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    Shield, Target, TrendingUp, CheckCircle2, Info,
    ArrowRight, ListChecks, ExternalLink, Activity,
    Layers, Rocket, ClipboardCheck, FileText, ChevronRight,
    Trash2
} from "lucide-react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import { PageGuide } from "@/components/PageGuide";
import { FileLibraryPicker } from "@/components/FileLibraryPicker";

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
    const { data: practices, isLoading: loadingPractices, error: practicesError } = trpc.sammV2.getPractices.useQuery({ clientId });
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

    // Debug / Error state
    useEffect(() => {
        console.log('[SAMMV2View] Loading State:', {
            loadingPractices,
            hasPractices: !!practices,
            practicesCount: practices?.length,
            error: practicesError
        });
    }, [loadingPractices, practices, practicesError]);

    if (practicesError) {
        return (
            <DashboardLayout>
                <div className="flex h-screen items-center justify-center flex-col gap-4 text-center">
                    <h2 className="text-xl font-bold text-red-600">API Error</h2>
                    <p className="text-slate-500 max-w-md">{practicesError.message}</p>
                    <p className="text-xs text-slate-400 font-mono bg-slate-100 p-2 rounded">{JSON.stringify(practicesError.shape?.message || practicesError)}</p>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </DashboardLayout>
        );
    }

    if (!loadingPractices && (!practices || practices.length === 0)) {
        return (
            <DashboardLayout>
                <div className="flex h-screen items-center justify-center flex-col gap-4">
                    <h2 className="text-xl font-bold text-slate-900">Unable to load SAMM Practices</h2>
                    <p className="text-slate-500">The database appears to be empty or the API is failing.</p>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </DashboardLayout>
        );
    }

    if (loadingPractices) {
        return (
            <DashboardLayout>
                <div className="flex h-screen items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    const businessFunctionScore = overallScore?.businessFunctions?.[activeFunction];

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
                        <Button
                            variant="outline"
                            className="gap-2 border-primary text-primary hover:bg-primary/10"
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
                            disabled={generatePlanMutation.isLoading}
                        >
                            <TrendingUp className="w-4 h-4" />
                            Build Roadmap
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => window.open("https://owaspsamm.org/", "_blank")}
                        >
                            <ExternalLink className="w-4 h-4" />
                            SAMM Docs
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="col-span-12 lg:col-span-3 space-y-4">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-2">
                            <div className="p-4 border-b border-slate-100 mb-2">
                                <h3 className="font-bold text-slate-900">Business Functions</h3>
                                <p className="text-xs text-slate-500">Global AppSec strategy</p>
                            </div>
                            <div className="grid grid-cols-5 gap-1 p-1 mb-2">
                                {BUSINESS_FUNCTIONS.map((f) => {
                                    const Icon = f.icon;
                                    const isActive = activeFunction === f.id;
                                    return (
                                        <button
                                            key={f.id}
                                            onClick={() => setActiveFunction(f.id)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${isActive
                                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                                }`}
                                            title={f.name}
                                        >
                                            <Icon className="w-4 h-4" />
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
                                            className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between group ${isActive
                                                ? "bg-slate-900 text-white shadow-lg"
                                                : "hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                                                    }`}>
                                                    {p.practiceId.split('-').pop()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold truncate max-w-[150px]">{p.practiceName}</span>
                                                </div>
                                            </div>
                                            {isActive && <ChevronRight className="w-4 h-4 text-primary" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-span-12 lg:col-span-9 space-y-6">
                        {/* Stats Dashboard */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-3xl border border-slate-200 bg-white text-left group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 rounded-xl bg-blue-100">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span className="text-2xl font-black text-slate-900">{(overallScore?.overallScore || 0).toFixed(1)}</span>
                                </div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Maturity</p>
                            </div>

                            <div className="p-4 rounded-3xl border border-slate-200 bg-white text-left group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 rounded-xl bg-purple-100">
                                        <Target className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <span className="text-2xl font-black text-slate-900">{(businessFunctionScore?.score || 0).toFixed(1)}</span>
                                </div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{activeFunction} Score</p>
                            </div>

                            <div className="p-4 rounded-3xl border border-slate-200 bg-white text-left group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 rounded-xl bg-emerald-100">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <span className="text-2xl font-black text-slate-900">
                                        {assessments?.length || 0}
                                    </span>
                                </div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Streams Assessed</p>
                            </div>

                            <div className="p-4 rounded-3xl border border-slate-200 bg-white text-left group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 rounded-xl bg-orange-100">
                                        <Activity className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <span className="text-2xl font-black text-slate-900">
                                        {30 - (assessments?.length || 0)}
                                    </span>
                                </div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Streams Pending</p>
                            </div>
                        </div>

                        {activePractice && (
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <PracticeAssessment
                                    practice={activePractice}
                                    clientId={clientId}
                                    onUpdate={refetchAssessments}
                                    existingAssessments={assessments?.filter(a => a.practiceId === activePracticeId) || []}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

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
        setMaturityA(streamA?.maturityLevel || 0);
    }, [streamA?.maturityLevel]);

    useEffect(() => {
        setMaturityB(streamB?.maturityLevel || 0);
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
        <div className="space-y-8">
            {/* Practice Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-2">
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-black px-3 py-1">
                        {practice.businessFunction}
                    </Badge>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{practice.practiceName}</h2>
                    <p className="text-slate-500 font-medium leading-relaxed max-w-2xl">
                        {practice.description}
                    </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-6 px-8">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Practice Maturity</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-primary">{score.toFixed(1)}</span>
                            <span className="text-xs text-slate-400 font-bold">/ 3.0</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Streams Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="pt-6 border-t border-slate-100">
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
        </div>
    );
}

function StreamCard({ streamId, name, description, active, onClick, maturity }: any) {
    return (
        <button
            onClick={onClick}
            className={`relative p-5 rounded-3xl border transition-all text-left overflow-hidden group ${active
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-slate-100 bg-white hover:border-slate-200"
                }`}
        >
            <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className={`${active ? "border-primary text-primary" : "text-slate-400 border-slate-200"} font-black text-[10px]`}>
                    Stream {streamId}
                </Badge>
                <div className="flex items-center gap-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= maturity ? "bg-primary" : "bg-slate-200"}`}></div>
                    ))}
                </div>
            </div>
            <h4 className={`text-lg font-black mb-1 ${active ? "text-slate-900" : "text-slate-700"}`}>{name}</h4>
            <p className="text-[11px] text-slate-500 font-medium line-clamp-1">{description}</p>
        </button>
    );
}

function StreamAssessmentPanel({ clientId, practiceId, streamId, streamName, onUpdate, assessment, onMaturityChange }: any) {
    const { data: questions, isLoading } = trpc.sammV2.getStreamQuestions.useQuery(
        { practiceId, streamId },
        { enabled: !!practiceId }
    );

    const [localAnswers, setLocalAnswers] = useState<Record<string, boolean>>(assessment?.assessmentAnswers || {});
    const [localQuality, setLocalQuality] = useState<Record<string, Record<string, boolean>>>(assessment?.qualityCriteria || {});
    const [localLevelNotes, setLocalLevelNotes] = useState<Record<string, string>>(assessment?.levelNotes || {});
    const [notes, setNotes] = useState(assessment?.notes || "");
    const [target, setTarget] = useState(assessment?.targetLevel || 1);
    const [localCriteriaNotes, setLocalCriteriaNotes] = useState<Record<string, Record<string, string>>>(assessment?.criteriaNotes || {});
    const [linkedEvidence, setLinkedEvidence] = useState<string[]>(assessment?.evidence || []);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [openNoteKeys, setOpenNoteKeys] = useState<Record<string, boolean>>({});
    const [newEvidenceUrl, setNewEvidenceUrl] = useState("");
    const [saving, setSaving] = useState(false);

    // Sync with prop when props change
    useEffect(() => {
        if (assessment) {
            setLocalAnswers(assessment.assessmentAnswers || {});
            setLocalQuality(assessment.qualityCriteria || {});
            setLocalLevelNotes(assessment.levelNotes || {});
            setNotes(assessment.notes || "");
            setTarget(assessment.targetLevel || 1);
            setLocalCriteriaNotes(assessment.criteriaNotes || {});
            setLinkedEvidence(assessment.evidence || []);
        }
    }, [assessment, streamId]);

    const updateMutation = trpc.sammV2.updateStreamAssessment.useMutation({
        onSuccess: () => {
            onUpdate();
            setSaving(false);
        },
        onError: async (err: any) => {
            const msg = String(err?.message || '');
            toast.error(msg);
            setSaving(false);
        }
    });

    // Autosave logic
    useEffect(() => {
        // Skip if nothing changed from current remote state
        if (JSON.stringify(localAnswers) === JSON.stringify(assessment?.assessmentAnswers || {}) &&
            JSON.stringify(localQuality) === JSON.stringify(assessment?.qualityCriteria || {}) &&
            notes === (assessment?.notes || "") &&
            target === (assessment?.targetLevel || 1) &&
            JSON.stringify(localCriteriaNotes) === JSON.stringify(assessment?.criteriaNotes || {}) &&
            JSON.stringify(linkedEvidence) === JSON.stringify(assessment?.evidence || [])) {
            return;
        }

        const timer = setTimeout(() => {
            setSaving(true);
            updateMutation.mutate({
                clientId,
                practiceId,
                streamId,
                maturityLevel: calculatedMaturity,
                targetLevel: target,
                assessmentAnswers: localAnswers,
                qualityCriteria: localQuality,
                levelNotes: localLevelNotes,
                notes,
                criteriaNotes: localCriteriaNotes,
                evidence: linkedEvidence
            });
        }, 1500); // 1.5s debounce for heavier SAMM data

        return () => clearTimeout(timer);
    }, [localAnswers, localQuality, notes, target, localCriteriaNotes, linkedEvidence]);

    const handleToggleAnswer = (level: number, value: boolean) => {
        setLocalAnswers(prev => ({ ...prev, [String(level)]: value }));
    };

    const handleToggleQuality = (level: number, index: number, value: boolean) => {
        setLocalQuality(prev => ({
            ...prev,
            [level]: { ...(prev[level] || {}), [index]: value }
        }));
    };

    const calculatedMaturity = useMemo(() => {
        let max = 0;
        if (localAnswers["1"]) max = 1; else return 0;
        if (localAnswers["2"]) max = 2; else return 1;
        if (localAnswers["3"]) max = 3; else return 2;
        return max;
    }, [localAnswers]);

    useEffect(() => {
        if (onMaturityChange) onMaturityChange(calculatedMaturity);
    }, [calculatedMaturity, onMaturityChange]);

    if (isLoading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-slate-800">
                        {streamName}
                    </h3>
                    {saving && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>}
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Roadmap Target</span>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {[1, 2, 3].map(i => (
                            <button
                                key={i}
                                onClick={() => setTarget(i)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${target === i ? "bg-white shadow-sm text-primary" : "text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                L{i}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {questions?.map((q: any) => {
                    const isAchieved = localAnswers[String(q.level)];
                    const isTarget = q.level === target;

                    return (
                        <div key={q.id} className={`rounded-3xl border transition-all duration-300 ${isAchieved ? "border-primary/30 bg-white shadow-sm ring-1 ring-primary/10" : "border-slate-100 bg-white"}`}>
                            <div className="p-8">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isAchieved ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}`}>
                                                L{q.level}
                                            </div>
                                            {isTarget && (
                                                <Badge className="bg-emerald-500 text-white border-none gap-1 font-bold text-[10px]">
                                                    <Target className="w-3 h-3" /> Target
                                                </Badge>
                                            )}
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 leading-tight">
                                            {q.question}
                                        </h4>
                                    </div>

                                    <Button
                                        variant={isAchieved ? "default" : "outline"}
                                        className={`rounded-2xl h-14 px-8 transition-all font-black ${isAchieved
                                            ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                            : "hover:border-primary hover:text-primary"
                                            }`}
                                        onClick={() => handleToggleAnswer(q.level, !isAchieved)}
                                    >
                                        {isAchieved ? "Achieved" : "Mark Achieved"}
                                    </Button>
                                </div>

                                <div className="grid lg:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-[#0ea5e9] flex items-center gap-2">
                                            <ListChecks className="w-3.5 h-3.5" />
                                            Quality Criteria
                                        </h5>
                                        <div className="space-y-2">
                                            {q.qualityCriteria?.map((criterion: string, idx: number) => {
                                                const isChecked = localQuality[q.level]?.[idx];
                                                const noteKey = `${q.level}-${idx}`;
                                                const noteValue = (localCriteriaNotes?.[q.level]?.[criterion]) || "";
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleToggleQuality(q.level, idx, !isChecked)}
                                                        className={`flex gap-3 items-start p-3 rounded-2xl transition-all cursor-pointer border ${isChecked
                                                            ? "bg-sky-50/50 border-sky-100"
                                                            : "bg-white border-slate-50 hover:border-slate-100"
                                                            }`}
                                                    >
                                                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-all ${isChecked ? "bg-sky-500 text-white shadow-sm" : "bg-slate-100 text-slate-300"}`}>
                                                            <CheckCircle2 className="w-3 h-3" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <span className={`text-[13px] font-medium leading-relaxed ${isChecked ? "text-slate-800" : "text-slate-500"}`}>
                                                                    {criterion}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    className="text-slate-300 hover:text-slate-500"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setOpenNoteKeys(prev => ({ ...prev, [noteKey]: !prev[noteKey] }));
                                                                    }}
                                                                >
                                                                    < ChevronRight className={`w-3.5 h-3.5 transition-transform ${openNoteKeys[noteKey] ? "rotate-90" : ""}`} />
                                                                </button>
                                                            </div>
                                                            {openNoteKeys[noteKey] && (
                                                                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                                                    <textarea
                                                                        value={noteValue}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
                                                                            setLocalCriteriaNotes(prev => ({
                                                                                ...prev,
                                                                                [q.level]: { ...(prev[q.level] || {}), [criterion]: val }
                                                                            }));
                                                                        }}
                                                                        placeholder="Implementation notes..."
                                                                        className="w-full p-2 rounded-xl border border-slate-100 text-xs text-slate-700 bg-white outline-none focus:ring-1 focus:ring-primary/20"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-slate-50 p-6 rounded-2xl space-y-3">
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Benefits</h5>
                                            <p className="text-xs text-slate-600 font-medium italic leading-relaxed">
                                                "{q.benefits}"
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Linked Evidence</h5>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 text-[10px] font-black text-primary hover:bg-primary/5"
                                                    onClick={() => setPickerOpen(true)}
                                                >
                                                    Add Evidence
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {linkedEvidence.length > 0 ? (
                                                    linkedEvidence.map((url, i) => (
                                                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 group">
                                                            <a href={url} target="_blank" rel="noreferrer" className="text-[10px] font-medium text-primary truncate max-w-[150px] flex items-center gap-2">
                                                                <ExternalLink className="w-3 h-3 text-slate-400" />
                                                                {url.split('/').pop()}
                                                            </a>
                                                            <button
                                                                type="button"
                                                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => setLinkedEvidence(prev => prev.filter((_, idx) => idx !== i))}
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-[11px] text-slate-400 font-medium">No evidence linked yet.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* General Assessment Notes */}
            <div className="pt-8 border-t border-slate-50">
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    General Assessment Notes
                </h4>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Capture overall implementation findings, gaps, or internal discussions for this stream..."
                    className="w-full min-h-[120px] p-4 rounded-3xl bg-slate-50 border-none text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                />
            </div>

            <FileLibraryPicker
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                clientId={clientId}
                onSelect={(file: any) => {
                    if (file?.fileUrl) {
                        setLinkedEvidence(prev => [...prev, file.fileUrl]);
                    }
                    setPickerOpen(false);
                }}
            />
        </div>
    );
}
