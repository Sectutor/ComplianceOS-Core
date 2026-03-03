import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import {
    Shield, Target, CheckCircle2, Info,
    ChevronRight, LayoutGrid, ClipboardCheck,
    TrendingUp, FileText, Plus, Check, ExternalLink, Trash2,
    Database, ShieldAlert, AlertTriangle, Lock, Eye, Zap,
    Share2, Users, Layers, ClipboardList, Activity
} from "lucide-react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageGuide } from "@/components/PageGuide";
import { toast } from "sonner";
import { FileLibraryPicker } from "@/components/FileLibraryPicker";
import { cn } from "@complianceos/ui/lib/utils";

interface MaturityAssessmentViewProps {
    frameworkId: string;
}

export default function MaturityAssessmentView({ frameworkId: initialFrameworkId }: MaturityAssessmentViewProps) {
    const { id, frameworkId: urlFrameworkId } = useParams<{ id: string, frameworkId?: string }>();
    const frameworkId = initialFrameworkId || urlFrameworkId || "";
    const clientId = parseInt(id || "0");
    const [_location, setLocation] = useLocation();

    // Category Icon Mapping 
    const categoryIcons: Record<string, any> = {
        // C2M2 / Generic Mapping
        "ASSET": Database,
        "THREAT": ShieldAlert,
        "RISK": AlertTriangle,
        "ACCESS": Lock,
        "SITUATION": Eye,
        "RESPONSE": Zap,
        "THIRD-PARTIES": Share2,
        "WORKFORCE": Users,
        "ARCHITECTURE": Layers,
        "PROGRAM": ClipboardList,

        // NIST CSF 2.0 Mapping
        "GV": Shield,        // Govern
        "ID": Target,        // Identify
        "PR": Lock,          // Protect
        "DE": Eye,           // Detect
        "RS": Zap,           // Respond
        "RC": Activity,      // Recover
    };

    // Category Color Mapping
    const categoryColors: Record<string, string> = {
        // NIST CSF 2.0 colors
        "GV": "#3ABEF9",     // Govern (Requested)
        "ID": "#60A5FA",     // Identify - Blue 400
        "PR": "#A78BFA",     // Protect - Violet 400
        "DE": "#FBBF24",     // Detect - Amber 400
        "RS": "#F87171",     // Respond - Red 400
        "RC": "#34D399",     // Recover - Emerald 400

        // C2M2 colors - Professional Multi-color palette
        "ASSET": "#3ABEF9",         // Sky Blue
        "THREAT": "#F87171",        // Red
        "RISK": "#FBBF24",          // Amber
        "ACCESS": "#A78BFA",        // Violet
        "SITUATION": "#60A5FA",      // Blue
        "RESPONSE": "#FB7185",      // Rose
        "THIRD-PARTIES": "#FB923C",  // Orange
        "WORKFORCE": "#2DD4BF",      // Teal
        "ARCHITECTURE": "#818CF8",  // Indigo
        "PROGRAM": "#34D399"        // Emerald
    };

    // State
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

    // Queries
    const { data: frameworks } = trpc.maturity.getFrameworks.useQuery();
    const { data: frameworkData, isLoading: loadingData } = trpc.maturity.getFrameworkData.useQuery({ frameworkId });
    const { data: assessments, refetch: refetchAssessments } = trpc.maturity.getAssessments.useQuery({ clientId, frameworkId });

    const activeFramework = useMemo(() =>
        frameworks?.find(f => f.id === frameworkId),
        [frameworks, frameworkId]
    );

    // Set first category as active on load
    useEffect(() => {
        if (frameworkData?.categories?.length && !activeCategoryId) {
            setActiveCategoryId(frameworkData.categories[0].id);
        }
    }, [frameworkData, activeCategoryId]);

    const activeCategory = useMemo(() =>
        frameworkData?.categories?.find(c => c.id === activeCategoryId),
        [frameworkData, activeCategoryId]
    );

    // Categories grouping logic
    const nestedCategories = useMemo(() => {
        if (!frameworkData?.categories) return [];

        // Robust helper to get parent ID handling camelCase/snake_case and nulls
        const getParentId = (c: any) => {
            const val = c.parentId !== undefined ? c.parentId : c.parent_id;
            // Treat 0, null, undefined, or empty string as "no parent"
            if (!val || val === 0 || val === '0' || val === 'null') return null;
            return val;
        };

        // Parents are those with no parent ID
        const parents = frameworkData.categories.filter(c => getParentId(c) === null);

        return parents.map(parent => ({
            ...parent,
            children: frameworkData.categories.filter(c => {
                const pId = getParentId(c);
                return pId !== null && (String(pId) === String(parent.id));
            })
        }));
    }, [frameworkData]);

    const filteredRequirements = useMemo(() => {
        if (!frameworkData || !activeCategoryId) return [];

        // Find if active category is a parent
        const parent = nestedCategories.find(p => p.id === activeCategoryId || String(p.id) === String(activeCategoryId));
        if (parent && parent.children.length > 0) {
            const childIds = parent.children.map(c => c.id);
            return frameworkData.requirements.filter(r =>
                r.categoryId === activeCategoryId ||
                String(r.categoryId) === String(activeCategoryId) ||
                childIds.includes(r.categoryId)
            );
        }

        return frameworkData.requirements.filter(r =>
            r.categoryId === activeCategoryId ||
            String(r.categoryId) === String(activeCategoryId)
        );
    }, [frameworkData, activeCategoryId, nestedCategories]);

    // Stats Calculation
    const stats = useMemo(() => {
        if (!frameworkData?.requirements || !assessments) return { achieved: 0, target: 0, total: 0 };
        const total = frameworkData.requirements.length;
        const achieved = assessments.filter(a => a.isAchieved).length;
        const target = assessments.filter(a => a.isTarget).length;
        return { achieved, target, total };
    }, [frameworkData, assessments]);

    if (loadingData || !activeFramework) {
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
                        { label: activeFramework.name, active: true }
                    ]}
                />

                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            <Shield className="w-10 h-10 text-primary" />
                            {activeFramework.name}
                        </h1>
                        <p className="text-slate-500 font-medium max-w-2xl">
                            {activeFramework.description}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <PageGuide
                            title={`${activeFramework.name} Guidance`}
                            description="Comprehensive maturity assessment and gap analysis."
                            moduleId={`maturity-${frameworkId}`}
                            isTrainingRequirement={true}
                            howToUse={[
                                {
                                    step: "Assess Performance",
                                    description: "Mark requirements as 'Achieved' or 'Not Achieved' to track current status.",
                                    targetId: "requirements-table"
                                },
                                {
                                    step: "Set Targets",
                                    description: "Identify gap items by marking them as 'Target' for remediation.",
                                    targetId: "requirements-table"
                                },
                                {
                                    step: "Build Roadmap",
                                    description: "Use the simulation tool to prioritize gaps based on business impact.",
                                    targetId: "btn-build-roadmap"
                                }
                            ]}
                            scenarios={[
                                {
                                    title: "Post-Audit Gap Update",
                                    example: "An external auditor found that 'Access Control A.5' is partially implemented. Scale back its level and set it as a target for next quarter.",
                                    auditTip: "Maturity assessments should show 'Continuous Improvement'. Avoid 100% achieved unless evidence is flawless."
                                }
                            ]}
                            resources={[
                                {
                                    name: "Framework Documentation",
                                    description: "Official source of truth for these requirements.",
                                    href: "https://compliance.intellfence.com/docs"
                                }
                            ]}
                        />
                        <Button
                            id="btn-build-roadmap"
                            variant="outline"
                            className="gap-2 border-primary text-primary hover:bg-primary/10"
                            onClick={() => setLocation(`/clients/${clientId}/maturity/simulation/${frameworkId}`)}
                        >
                            <TrendingUp className="w-4 h-4" />
                            Build Roadmap
                        </Button>
                    </div>
                </div>

                {/* Stats Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-blue-50 rounded-xl">
                                    <Target className="w-5 h-5 text-blue-600" />
                                </div>
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                                    Overall Progress
                                </Badge>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-900">{Math.round((stats.achieved / stats.total) * 100) || 0}%</span>
                                    <span className="text-sm font-bold text-slate-400">achieved</span>
                                </div>
                                <Progress value={(stats.achieved / stats.total) * 100} className="h-2 bg-slate-100" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-emerald-50 rounded-xl">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                </div>
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                                    Items Completed
                                </Badge>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-slate-900">{stats.achieved}</span>
                                <span className="text-sm font-bold text-slate-400">/ {stats.total} total</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-orange-50 rounded-xl">
                                    <TrendingUp className="w-5 h-5 text-orange-600" />
                                </div>
                                <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-100">
                                    Target Gap
                                </Badge>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-slate-900">{stats.target - stats.achieved > 0 ? stats.target - stats.achieved : 0}</span>
                                <span className="text-sm font-bold text-slate-400">remaining to target</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="col-span-12 lg:col-span-3 space-y-4">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-2">
                            <div className="p-4 border-b border-slate-100 mb-2">
                                <h3 className="font-bold text-slate-900">Categories</h3>
                                <p className="text-xs text-slate-500">Framework structure</p>
                            </div>
                            <div className="space-y-4 px-2">
                                {nestedCategories.map((parent) => {
                                    const isExactlyActive = activeCategoryId === parent.id;
                                    const hasActiveChild = parent.children.some(c => c.id === activeCategoryId);
                                    const parentActive = isExactlyActive || hasActiveChild;

                                    const parentReqs = frameworkData.requirements.filter(r =>
                                        r.categoryId === parent.id || parent.children.some(c => c.id === r.categoryId)
                                    );
                                    const parentAchieved = assessments?.filter(a => parentReqs.some(r => r.id === a.requirementId) && a.isAchieved).length || 0;
                                    const CategoryIcon = categoryIcons[parent.code] || Shield;

                                    return (
                                        <div key={parent.id} className="space-y-1">
                                            <button
                                                onClick={() => setActiveCategoryId(parent.id)}
                                                className={cn(
                                                    "w-full text-left p-2.5 rounded-2xl transition-all flex items-center justify-between group relative overflow-hidden mb-1",
                                                    isExactlyActive ? "shadow-xl shadow-slate-200/50 scale-[1.02]" :
                                                        hasActiveChild ? "bg-slate-50 border border-slate-100" : "hover:bg-slate-50"
                                                )}
                                                style={isExactlyActive ? {
                                                    backgroundColor: categoryColors[parent.code] || "#0f172a", // Default to slate-900 if no color mapped
                                                    color: "black"
                                                } : {}}
                                            >
                                                {isExactlyActive && (
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                                )}
                                                <div className="flex items-center gap-3.5">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all duration-300 border",
                                                        isExactlyActive
                                                            ? "bg-black/10 border-black/20 text-black shadow-inner"
                                                            : "bg-white border-slate-100 text-slate-400 group-hover:border-slate-200 group-hover:shadow-sm"
                                                    )}>
                                                        <CategoryIcon className={cn("w-5 h-5 mb-0.5", isExactlyActive ? "text-black" : "text-slate-400 group-hover:text-primary")} />
                                                        <span className="text-[7.5px] font-black uppercase tracking-tighter opacity-70">
                                                            {parent.code.length > 6 ? parent.code.substring(0, 5) + '..' : parent.code}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={cn(
                                                            "text-sm font-black leading-tight truncate",
                                                            isExactlyActive ? "text-black" : "text-slate-700"
                                                        )}>{parent.name}</span>
                                                        <span className={cn(
                                                            "text-[10px] font-bold mt-0.5",
                                                            isExactlyActive ? "text-black/60" : "text-slate-400"
                                                        )}>
                                                            {parentAchieved} / {parentReqs.length} met
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight className={cn(
                                                    "w-4 h-4 transition-transform duration-300",
                                                    isExactlyActive ? "text-black rotate-90" :
                                                        parentActive ? "rotate-90 text-primary" : "text-slate-200 group-hover:text-slate-400"
                                                )} />
                                            </button>

                                            {/* Children Categories */}
                                            {parent.children.length > 0 && parentActive && (
                                                <div className="ml-5 pl-4 border-l-2 border-slate-100 space-y-1 mt-1 pb-2">
                                                    {parent.children.map(child => {
                                                        const isChildActive = activeCategoryId === child.id;
                                                        const childReqs = frameworkData.requirements.filter(r => r.categoryId === child.id);
                                                        const childAchieved = assessments?.filter(a => childReqs.some(r => r.id === a.requirementId) && a.isAchieved).length || 0;

                                                        return (
                                                            <button
                                                                key={child.id}
                                                                onClick={() => setActiveCategoryId(child.id)}
                                                                className={cn(
                                                                    "w-full text-left p-2 rounded-xl transition-all flex items-center justify-between group",
                                                                    isChildActive ? "bg-slate-100 text-slate-900 font-bold shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                                                )}
                                                            >
                                                                <div className="flex flex-col overflow-hidden">
                                                                    <span className="text-xs truncate">{child.name}</span>
                                                                    <span className="text-[9px] font-medium opacity-70">
                                                                        {childAchieved}/{childReqs.length} met
                                                                    </span>
                                                                </div>
                                                                {isChildActive && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Main Assessment Area */}
                    <div className="col-span-12 lg:col-span-9 space-y-6">
                        {activeCategory && (() => {
                            const ActiveCategoryIcon = categoryIcons[activeCategory.code] || Shield;
                            return (
                                <div className="bg-white rounded-[2rem] p-8 border border-slate-200/60 shadow-sm mb-8">
                                    <div className="flex items-center gap-5 mb-4">
                                        <div
                                            className="p-4 rounded-[1.25rem] shadow-xl shadow-slate-200"
                                            style={{ backgroundColor: categoryColors[activeCategory.code] || "#0f172a" }}
                                        >
                                            <ActiveCategoryIcon className="w-8 h-8 text-black" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="text-[10px] font-black uppercase tracking-[0.2em] bg-primary/10 px-2 py-0.5 rounded"
                                                    style={{ color: categoryColors[activeCategory.code] || "var(--primary)" }}
                                                >
                                                    {activeCategory.code}
                                                </span>
                                            </div>
                                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{activeCategory.name}</h2>
                                        </div>
                                    </div>
                                    <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-3xl">
                                        {activeCategory.description}
                                    </p>
                                </div>
                            );
                        })()}

                        <div id="requirements-table" className="space-y-4">
                            {filteredRequirements.length === 0 && activeCategoryId && (
                                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                                    <Info className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-slate-400">Select a sub-category to view requirements</h3>
                                    <p className="text-slate-400 text-sm">This high-level function contains multiple sub-categories.</p>
                                </div>
                            )}
                            {filteredRequirements.map((req) => (
                                <RequirementCard
                                    key={req.id}
                                    requirement={req}
                                    clientId={clientId}
                                    frameworkId={frameworkId}
                                    assessment={assessments?.find(a => a.requirementId === req.id)}
                                    onUpdate={refetchAssessments}
                                    levels={activeFramework.levels as any}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function RequirementCard({ requirement, clientId, frameworkId, assessment, onUpdate, levels }: any) {
    const [isAchieved, setIsAchieved] = useState(assessment?.isAchieved || false);
    const [isTarget, setIsTarget] = useState(assessment?.isTarget || false);
    const [notes, setNotes] = useState(assessment?.notes || "");
    const [evidence, setEvidence] = useState<string[]>(assessment?.evidence || []);
    const [pickerOpen, setPickerOpen] = useState(false);

    // Mutation
    const updateMutation = trpc.maturity.updateAssessment.useMutation();

    // Sync state with props
    useEffect(() => {
        setIsAchieved(assessment?.isAchieved || false);
        setIsTarget(assessment?.isTarget || false);
        setNotes(assessment?.notes || "");
        setEvidence(assessment?.evidence || []);
    }, [assessment]);

    // Autosave logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (
                isAchieved !== assessment?.isAchieved ||
                isTarget !== assessment?.isTarget ||
                notes !== (assessment?.notes || "") ||
                JSON.stringify(evidence) !== JSON.stringify(assessment?.evidence || [])
            ) {
                updateMutation.mutate({
                    clientId,
                    frameworkId,
                    requirementId: requirement.id,
                    isAchieved,
                    isTarget,
                    notes,
                    evidence
                }, {
                    onSuccess: () => onUpdate()
                });
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [isAchieved, isTarget, notes, evidence]);

    const levelInfo = levels.find((l: any) => l.level === requirement.level);

    return (
        <Card className="rounded-3xl border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
            <CardContent className="p-0">
                <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-[10px] font-bold text-slate-400 border-slate-200 px-2 py-0 h-5">
                                    {requirement.code}
                                </Badge>
                                {levelInfo && (
                                    <Badge className={cn(
                                        "border-none text-[10px] font-black px-2 py-0 h-5 tracking-tight uppercase",
                                        requirement.level === 1 ? "bg-blue-50 text-blue-600" :
                                            requirement.level === 2 ? "bg-indigo-50 text-indigo-600" :
                                                "bg-purple-50 text-purple-600"
                                    )}>
                                        MIL {requirement.level}: {levelInfo.name}
                                    </Badge>
                                )}
                            </div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight">
                                {requirement.title}
                            </h3>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant={isTarget ? "default" : "outline"}
                                className={cn(
                                    "rounded-xl font-bold text-xs gap-2 transition-all",
                                    isTarget ? "bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-200" : "text-slate-400"
                                )}
                                onClick={() => setIsTarget(!isTarget)}
                            >
                                <Target className="w-3.5 h-3.5" />
                                {isTarget ? "Targeted" : "Set Target"}
                            </Button>
                            <Button
                                size="sm"
                                variant={isAchieved ? "default" : "outline"}
                                className={cn(
                                    "rounded-xl font-bold text-xs gap-2 transition-all",
                                    isAchieved ? "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200" : "text-slate-400"
                                )}
                                onClick={() => setIsAchieved(!isAchieved)}
                            >
                                {isAchieved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                {isAchieved ? "Achieved" : "Mark Achieved"}
                            </Button>
                        </div>
                    </div>

                    <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">
                        {requirement.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <FileText className="w-3 h-3" />
                                Implementation Notes
                            </label>
                            <textarea
                                className="w-full min-h-[100px] bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
                                placeholder="Describe how this requirement is met or any gaps..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <ClipboardCheck className="w-3 h-3" />
                                    Supporting Evidence
                                </label>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-[10px] font-black text-primary hover:bg-primary/5"
                                    onClick={() => setPickerOpen(true)}
                                >
                                    Add Evidence
                                </Button>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4 min-h-[100px] space-y-2">
                                {evidence.length > 0 ? (
                                    evidence.map((url, i) => (
                                        <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white border border-slate-100 shadow-sm group">
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-primary truncate"
                                            >
                                                <ExternalLink className="w-3 h-3 text-slate-400" />
                                                <span className="truncate max-w-[200px]">{url.split('/').pop()}</span>
                                            </a>
                                            <button
                                                type="button"
                                                className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                onClick={() => setEvidence(prev => prev.filter((_, idx) => idx !== i))}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full py-4 text-center">
                                        <p className="text-[11px] text-slate-400 font-medium">No evidence linked yet.</p>
                                        <Button
                                            variant="link"
                                            className="text-[10px] text-primary h-auto p-0"
                                            onClick={() => setPickerOpen(true)}
                                        >
                                            Browse Library
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {updateMutation.isLoading && (
                    <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saving...</span>
                    </div>
                )}

                <FileLibraryPicker
                    open={pickerOpen}
                    onOpenChange={setPickerOpen}
                    clientId={clientId}
                    onSelect={(file: any) => {
                        // Extract fileUrl from the object
                        if (file?.fileUrl) {
                            setEvidence(prev => [...prev, file.fileUrl]);
                        }
                    }}
                />
            </CardContent>
        </Card>
    );
}
