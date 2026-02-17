
import React, { useState, useEffect, useMemo, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    Shield, Target, TrendingUp, Info, ChevronRight, CheckCircle2,
    ListChecks, FileText, ExternalLink, Filter, Search, Award
} from "lucide-react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import { PageGuide } from "@/components/PageGuide";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@complianceos/ui/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";

type RequirementStatus = "unanswered" | "pass" | "fail" | "na";

export default function ASVSView() {
    const { id } = useParams<{ id: string }>();
    const [, setLocation] = useLocation();
    const clientId = parseInt(id || "0");

    // State
    const [activeCategoryCode, setActiveCategoryCode] = useState<string | null>(null);
    const [filterLevel, setFilterLevel] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Queries
    const { data: categories, isLoading: loadingCategories } = trpc.asvs.getCategories.useQuery();

    const pushGapsMutation = trpc.asvs.pushGapsToImplementation.useMutation({
        onSuccess: (data) => {
            toast.success(data.message, {
                action: {
                    label: "Go to Plan",
                    onClick: () => setLocation(`/clients/${clientId}/implementation/plan/${data.planId}`)
                }
            });
        },
        onError: (err) => {
            toast.error(`Failed to push gaps: ${err.message}`);
        }
    });

    const handlePushGaps = () => {
        pushGapsMutation.mutate({ clientId });
    };

    const { data: categoryData, refetch: refetchData, isLoading: loadingData } = trpc.asvs.getCategoryAssessment.useQuery(
        { clientId, categoryCode: activeCategoryCode || "" },
        { enabled: !!activeCategoryCode && !!clientId }
    );

    // Select first category on load
    useEffect(() => {
        if (categories && categories.length > 0 && !activeCategoryCode) {
            setActiveCategoryCode(categories[0].code);
        }
    }, [categories, activeCategoryCode]);

    const activeCategory = useMemo(() =>
        categories?.find(c => c.code === activeCategoryCode),
        [categories, activeCategoryCode]
    );

    // Local state for optimistic updates
    const [optimisticAssessments, setOptimisticAssessments] = useState<Record<string, any>>({});

    // Sync remote data to local state when it changes
    useEffect(() => {
        if (categoryData) {
            const initialMap: Record<string, any> = {};
            categoryData.forEach(item => {
                if (item.assessment) {
                    initialMap[item.requirementId] = item.assessment;
                }
            });
            setOptimisticAssessments(initialMap);
        }
    }, [categoryData]);

    const handleAssessmentUpdate = useCallback((reqId: string, status: string, notes: string) => {
        // Optimistically update local state
        setOptimisticAssessments(prev => ({
            ...prev,
            [reqId]: { ...prev[reqId], status, notes }
        }));
        // Then trigger refetch to ensure consistency eventually
        refetchData();
    }, [refetchData]);

    // Calculate completion stats for current category using optimistic data
    const stats = useMemo(() => {
        if (!categoryData) return { total: 0, completed: 0, pass: 0, fail: 0, na: 0, pending: 0, percent: 0 };
        const total = categoryData.length;

        let pass = 0;
        let fail = 0;
        let na = 0;
        let pending = 0;

        categoryData.forEach(item => {
            const assessment = optimisticAssessments[item.requirementId] || item.assessment;
            const status = assessment?.status || "unanswered";

            if (status === "pass") pass++;
            else if (status === "fail") fail++;
            else if (status === "na") na++;
            else pending++;
        });

        // Current calc for percentage: (Pass + N/A) / Total
        const passedForCalc = pass + na;

        return {
            total,
            pass,
            fail,
            na,
            pending,
            percent: total > 0 ? Math.round((passedForCalc / total) * 100) : 0
        };
    }, [categoryData, optimisticAssessments]);


    const filteredRequirements = useMemo(() => {
        if (!categoryData) return [];
        return categoryData.filter(req => {
            // Filter by Level
            if (filterLevel !== "all") {
                if (filterLevel === "1" && !req.level1) return false;
                if (filterLevel === "2" && !req.level2) return false;
                if (filterLevel === "3" && !req.level3) return false;
            }
            // Filter by Status
            if (statusFilter !== "all") {
                const assessment = optimisticAssessments[req.requirementId] || req.assessment;
                const status = assessment?.status || "unanswered";
                if (statusFilter === "pending" && status !== "unanswered") return false;
                if (statusFilter !== "pending" && status !== statusFilter) return false;
            }
            // Filter by Search
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return req.requirementId.toLowerCase().includes(q) ||
                    req.description.toLowerCase().includes(q) ||
                    req.chapterName?.toLowerCase().includes(q);
            }
            return true;
        });
    }, [categoryData, filterLevel, searchQuery, statusFilter, optimisticAssessments]);


    if (loadingCategories) {
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
                        { label: "OWASP ASVS 4.0", active: true }
                    ]}
                />

                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            <Shield className="w-10 h-10 text-primary" />
                            OWASP ASVS <span className="text-primary">v4.0.3</span>
                        </h1>
                        <p className="text-slate-500 font-medium max-w-2xl">
                            Application Security Verification Standard.
                            Validate your application's security controls against industry standards.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <PageGuide
                            title="ASVS Assessment Guide"
                            description="Use the Application Security Verification Standard (ASVS) to verify technical security controls."
                            rationale="ASVS provides a basis for testing web application technical security controls and also provides developers with a list of requirements for secure development."
                            howToUse={[
                                {
                                    step: "Select Level",
                                    description: "Filter requirements by assurance level (L1: Basic, L2: Standard, L3: Advanced)."
                                },
                                {
                                    step: "Assess",
                                    description: "Review each requirement and mark as Pass, Fail, or N/A. Add evidence for verification."
                                },
                                {
                                    step: "Track Progress",
                                    description: "Monitor compliance per category to identify weak areas in your application security."
                                }
                            ]}
                        />
                        <Button
                            variant="outline"
                            className="gap-2 border-primary text-primary hover:bg-primary/10"
                            onClick={handlePushGaps}
                            disabled={pushGapsMutation.isPending}
                        >
                            <TrendingUp className="w-4 h-4" />
                            {pushGapsMutation.isPending ? "Pushing..." : "Push Gaps to Implementation"}
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => window.open("https://github.com/OWASP/ASVS/tree/v4.0.3", "_blank")}
                        >
                            <ExternalLink className="w-4 h-4" />
                            ASVS Docs
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="col-span-12 lg:col-span-3 space-y-4">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-2">
                            <div className="p-4 border-b border-slate-100 mb-2">
                                <h3 className="font-bold text-slate-900">Categories</h3>
                                <p className="text-xs text-slate-500">Select a category to assess</p>
                            </div>
                            <div className="space-y-1 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                {categories?.map((cat) => {
                                    const isActive = activeCategoryCode === cat.code;
                                    return (
                                        <button
                                            key={cat.code}
                                            onClick={() => setActiveCategoryCode(cat.code)}
                                            className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between group ${isActive
                                                ? "bg-slate-900 text-white shadow-lg"
                                                : "hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                                                    }`}>
                                                    {cat.code}
                                                </div>
                                                <span className="text-sm font-bold truncate max-w-[180px]">{cat.name}</span>
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
                        {/* Verdict Dashboard */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button
                                onClick={() => setStatusFilter(statusFilter === "pass" ? "all" : "pass")}
                                className={`p-4 rounded-3xl border transition-all text-left group ${statusFilter === "pass"
                                    ? "bg-emerald-500 border-emerald-600 shadow-lg shadow-emerald-200"
                                    : "bg-white border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-2 rounded-xl ${statusFilter === "pass" ? "bg-white/20" : "bg-emerald-100"}`}>
                                        <CheckCircle2 className={`w-5 h-5 ${statusFilter === "pass" ? "text-white" : "text-emerald-600"}`} />
                                    </div>
                                    <span className={`text-2xl font-black ${statusFilter === "pass" ? "text-white" : "text-slate-900"}`}>{stats.pass}</span>
                                </div>
                                <p className={`text-xs font-bold uppercase tracking-wider ${statusFilter === "pass" ? "text-white/80" : "text-slate-400 group-hover:text-emerald-600"}`}>Pass</p>
                            </button>

                            <button
                                onClick={() => setStatusFilter(statusFilter === "fail" ? "all" : "fail")}
                                className={`p-4 rounded-3xl border transition-all text-left group ${statusFilter === "fail"
                                    ? "bg-red-500 border-red-600 shadow-lg shadow-red-200"
                                    : "bg-white border-slate-200 hover:border-red-200 hover:bg-red-50/30"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-2 rounded-xl ${statusFilter === "fail" ? "bg-white/20" : "bg-red-100"}`}>
                                        <Target className={`w-5 h-5 ${statusFilter === "fail" ? "text-white" : "text-red-600"}`} />
                                    </div>
                                    <span className={`text-2xl font-black ${statusFilter === "fail" ? "text-white" : "text-slate-900"}`}>{stats.fail}</span>
                                </div>
                                <p className={`text-xs font-bold uppercase tracking-wider ${statusFilter === "fail" ? "text-white/80" : "text-slate-400 group-hover:text-red-600"}`}>Fail</p>
                            </button>

                            <button
                                onClick={() => setStatusFilter(statusFilter === "na" ? "all" : "na")}
                                className={`p-4 rounded-3xl border transition-all text-left group ${statusFilter === "na"
                                    ? "bg-slate-700 border-slate-800 shadow-lg shadow-slate-200"
                                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-2 rounded-xl ${statusFilter === "na" ? "bg-white/20" : "bg-slate-100"}`}>
                                        <Info className={`w-5 h-5 ${statusFilter === "na" ? "text-white" : "text-slate-600"}`} />
                                    </div>
                                    <span className={`text-2xl font-black ${statusFilter === "na" ? "text-white" : "text-slate-900"}`}>{stats.na}</span>
                                </div>
                                <p className={`text-xs font-bold uppercase tracking-wider ${statusFilter === "na" ? "text-white/80" : "text-slate-400 group-hover:text-slate-600"}`}>N/A</p>
                            </button>

                            <button
                                onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
                                className={`p-4 rounded-3xl border transition-all text-left group ${statusFilter === "pending"
                                    ? "bg-primary border-primary shadow-lg shadow-primary/20"
                                    : "bg-white border-slate-200 hover:border-primary/30 hover:bg-primary/5"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-2 rounded-xl ${statusFilter === "pending" ? "bg-white/20" : "bg-blue-100"}`}>
                                        <ListChecks className={`w-5 h-5 ${statusFilter === "pending" ? "text-white" : "text-primary"}`} />
                                    </div>
                                    <span className={`text-2xl font-black ${statusFilter === "pending" ? "text-white" : "text-slate-900"}`}>{stats.pending}</span>
                                </div>
                                <p className={`text-xs font-bold uppercase tracking-wider ${statusFilter === "pending" ? "text-white/80" : "text-slate-400 group-hover:text-primary"}`}>Pending</p>
                            </button>
                        </div>

                        {activeCategory && (
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                {/* Header Stats */}
                                <div className="flex flex-col md:flex-row justify-between gap-6 pb-6 border-b border-slate-100">
                                    <div className="space-y-2 max-w-2xl">
                                        <Badge className="bg-primary/10 text-primary border-primary/20 font-black px-3 py-1">
                                            {activeCategory.code}
                                        </Badge>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{activeCategory.name}</h2>
                                        <p className="text-slate-500 font-medium leading-relaxed">
                                            {activeCategory.description}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="text-right">
                                            <span className="text-xs uppercase tracking-widest font-black text-slate-400 block mb-1">Compliance</span>
                                            <div className="flex items-center gap-3">
                                                {statusFilter !== "all" && (
                                                    <Badge
                                                        variant="outline"
                                                        className="cursor-pointer hover:bg-slate-100"
                                                        onClick={() => setStatusFilter("all")}
                                                    >
                                                        Filter: {statusFilter.toUpperCase()} ×
                                                    </Badge>
                                                )}
                                                <span className="text-4xl font-black text-primary">{stats.percent}%</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 text-xs font-bold text-slate-400">
                                            <span>{stats.pass} Passed</span>
                                            <span>/</span>
                                            <span>{stats.total} Total</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-2xl">
                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        <Search className="w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search requirements..."
                                            className="bg-transparent border-none outline-none text-sm font-medium w-full md:w-64"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <div className="flex items-center gap-2">
                                            <Target className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm font-bold text-slate-600">Level:</span>
                                        </div>
                                        <Select value={filterLevel} onValueChange={setFilterLevel}>
                                            <SelectTrigger className="w-[140px] bg-white border-slate-200">
                                                <SelectValue placeholder="Level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Levels</SelectItem>
                                                <SelectItem value="1">Level 1 (Basic)</SelectItem>
                                                <SelectItem value="2">Level 2 (Standard)</SelectItem>
                                                <SelectItem value="3">Level 3 (Advanced)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Requirements List */}
                                <div className="space-y-4">
                                    {loadingData ? (
                                        <div className="py-12 flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : filteredRequirements.length === 0 ? (
                                        <div className="py-12 text-center text-slate-400">
                                            <p>No requirements found matching your filters.</p>
                                        </div>
                                    ) : (
                                        filteredRequirements.map((item) => {
                                            return (
                                                <RequirementItem
                                                    key={item.requirementId}
                                                    data={item}
                                                    clientId={clientId}
                                                    onUpdate={handleAssessmentUpdate}
                                                />
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function RequirementItem({ data, clientId, onUpdate }: {
    data: any,
    clientId: number,
    onUpdate: (id: string, status: string, notes: string) => void
}) {
    const requirement = data;
    const assessment = data.assessment;
    const [status, setStatus] = useState<RequirementStatus>(assessment?.status || "unanswered");
    const [isExpanded, setIsExpanded] = useState(false);
    const [notes, setNotes] = useState(assessment?.notes || "");
    const [saving, setSaving] = useState(false);

    // Initial sync
    useEffect(() => {
        if (assessment) {
            setStatus(assessment.status || "unanswered");
            setNotes(assessment.notes || "");
        }
    }, [assessment]);

    const updateMutation = trpc.asvs.updateAssessment.useMutation({
        onSuccess: () => {
            onUpdate(requirement.requirementId, status, notes);
            setSaving(false);
        },
        onError: (err) => {
            toast.error(`Failed to update: ${err.message}`);
            setSaving(false);
        }
    });

    // Autosave effect with debounce
    useEffect(() => {
        // Skip if nothing changed from current remote state
        if (status === (assessment?.status || "unanswered") && notes === (assessment?.notes || "")) {
            return;
        }

        const timer = setTimeout(() => {
            setSaving(true);
            updateMutation.mutate({
                clientId,
                requirementId: requirement.requirementId,
                status,
                notes
            });
        }, 800);

        return () => clearTimeout(timer);
    }, [status, notes, clientId, requirement.requirementId, assessment]);

    const StatusBadge = ({ s }: { s: RequirementStatus }) => {
        switch (s) {
            case "pass": return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">Pass</Badge>;
            case "fail": return <Badge className="bg-red-500 hover:bg-red-600 text-white border-none">Fail</Badge>;
            case "na": return <Badge className="bg-slate-400 hover:bg-slate-500 text-white border-none">N/A</Badge>;
            default: return <Badge variant="outline" className="text-slate-400 border-slate-200">Pending</Badge>;
        }
    };

    return (
        <div className={`rounded-2xl border transition-all duration-300 ${isExpanded ? "border-primary bg-white shadow-lg ring-1 ring-primary/20" : "border-slate-100 bg-white hover:border-slate-200"}`}>
            <div className="p-5 flex items-start gap-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex flex-col items-center gap-2 min-w-[60px]">
                    <span className="text-xs font-black text-slate-400 font-mono">{requirement.requirementId}</span>
                    <div className="flex gap-0.5">
                        {requirement.level1 && <div className="w-1.5 h-1.5 rounded-full bg-slate-300" title="L1"></div>}
                        {requirement.level2 && <div className="w-1.5 h-1.5 rounded-full bg-slate-400" title="L2"></div>}
                        {requirement.level3 && <div className="w-1.5 h-1.5 rounded-full bg-slate-500" title="L3"></div>}
                    </div>
                </div>

                <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-slate-700 leading-relaxed pr-8">
                        {requirement.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                        {requirement.cwe && <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100">CWE-{requirement.cwe}</span>}
                        {requirement.nist && <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100">NIST {requirement.nist}</span>}
                    </div>
                </div>

                <div className="min-w-[80px] flex justify-end items-center gap-2">
                    {saving && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>}
                    <StatusBadge s={status} />
                </div>
            </div>

            {isExpanded && (
                <div className="px-5 pb-5 pt-0 border-t border-slate-50 mt-2 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Verdict</label>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant={status === "pass" ? "default" : "outline"}
                                    onClick={(e) => { e.stopPropagation(); setStatus("pass"); }}
                                    className={status === "pass" ? "bg-emerald-500 hover:bg-emerald-600 border-none" : "hover:text-emerald-600 hover:border-emerald-200"}
                                >
                                    Pass
                                </Button>
                                <Button
                                    size="sm"
                                    variant={status === "fail" ? "default" : "outline"}
                                    onClick={(e) => { e.stopPropagation(); setStatus("fail"); }}
                                    className={status === "fail" ? "bg-red-500 hover:bg-red-600 border-none" : "hover:text-red-600 hover:border-red-200"}
                                >
                                    Fail
                                </Button>
                                <Button
                                    size="sm"
                                    variant={status === "na" ? "default" : "outline"}
                                    onClick={(e) => { e.stopPropagation(); setStatus("na"); }}
                                >
                                    N/A
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Evidence & Notes</label>
                            <textarea
                                className="w-full h-20 rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                placeholder="Add implementation details or justification..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Add Tailwind Animation Utility for Slide In
// className="animate-in slide-in-from-top-2" requires tailwindcss-animate plugin which seems present given other files use it.
