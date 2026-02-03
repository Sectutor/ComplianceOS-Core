import React, { useState } from "react";
import Markdown from "react-markdown";
import {
    CheckCircle2,
    Users,
    FileText,
    Globe,
    Target,
    Shield,
    ChevronRight,
    MapPin,
    Cpu,
    ExternalLink,
    Sparkles,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { Badge } from "@complianceos/ui/ui/badge";
import { Separator } from "@complianceos/ui/ui/separator";
import { Button } from "@complianceos/ui/ui/button";
import { toast } from "sonner";

interface WizardStep7_SummaryProps {
    data: {
        scope: any;
        stakeholders: any;
        existingPolicies: any;
        context: any;
        expectations: any;
        questionnaireData: any;
        scopingReport?: string;
    };
    standardId: string;
    onUpdate: (data: any) => void;
    onEditStep: (step: number) => void;
}

export function WizardStep7_Summary({ data, standardId, onUpdate, onEditStep }: WizardStep7_SummaryProps) {
    const { scope, stakeholders, existingPolicies, context, expectations, questionnaireData } = data;

    const sections = [
        {
            id: "scope",
            step: 1,
            title: "Discovery Scope",
            icon: Globe,
            color: "text-blue-600",
            bg: "bg-blue-50",
            content: [
                { label: "Organization Boundaries", value: scope?.orgBoundaries },
                { label: "Key Locations", value: scope?.locations },
                { label: "Technology Stack", value: scope?.technologies },
            ]
        },
        {
            id: "stakeholders",
            step: 2,
            title: "Project Stakeholders",
            icon: Users,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            content: [
                { label: "Security Lead", value: stakeholders?.securityLead },
                { label: "Executive Sponsor", value: stakeholders?.executiveSponsor },
                { label: "IT / DevOps", value: stakeholders?.itLead },
            ]
        },
        {
            id: "context",
            step: 4,
            title: "Business Environment",
            icon: Cpu,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            content: [
                { label: "Critical Assets", value: context?.criticalAssets },
                { label: "Legal Requirements", value: context?.legalRequirements },
                { label: "Risk Appetite", value: context?.riskAppetite },
            ]
        },
        {
            id: "expectations",
            step: 5,
            title: "Assessment Goals",
            icon: Target,
            color: "text-amber-600",
            bg: "bg-amber-50",
            content: [
                { label: "Target Maturity", value: expectations?.targetMaturity },
                { label: "Primary Objective", value: expectations?.primaryObjective },
                { label: "Timeline", value: expectations?.timeline },
            ]
        },
        {
            id: "questionnaire",
            step: 6,
            title: "Readiness Assessment",
            icon: Shield,
            color: "text-rose-600",
            bg: "bg-rose-50",
            content: [
                { label: "Questions Answered", value: `${Object.keys(questionnaireData?.questions || {}).length} responses` },
                { label: "Affirmative Controls", value: `${Object.values(questionnaireData?.questions || {}).filter((q: any) => q.answer === 'yes').length} "Yes" answers` },
            ]
        }
    ];

    const policyList = Object.entries(existingPolicies || {})
        .filter(([_, value]) => value === true)
        .map(([key, _]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));

    const [report, setReport] = useState(data.scopingReport || "");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateReport = async () => {
        setIsGenerating(true);
        setReport("");
        let fullReport = "";
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/ai/generate-stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    feature: 'scoping_report',
                    standardId,
                    data
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to generate report (${response.status})`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) return;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const payload = JSON.parse(line.slice(6));
                            if (payload.text) {
                                const newText = payload.text;
                                setReport(prev => prev + newText);
                                fullReport += newText;
                            }
                        } catch (e) {
                            // Ignore parse errors for partial chunks
                        }
                    }
                }
            }

            // Save the persistence
            onUpdate({ ...data, scopingReport: fullReport });
        } catch (error) {
            toast.error("Failed to generate AI report");
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-10 py-2">
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Readiness Blueprint</h3>
                    <p className="text-slate-500 text-sm font-medium">Comprehensive discovery summary for {standardId}</p>
                </div>
                <Badge variant="outline" className="px-3 py-1 bg-white border-indigo-100 text-indigo-700 font-bold uppercase tracking-wider text-[10px]">
                    Draft Proposal
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {sections.map((section) => (
                    <div key={section.id} className="group p-6 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
                        <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 -mr-8 -mt-8 rounded-full", section.bg)} />

                        <div className="flex items-start justify-between mb-6 relative z-10">
                            <div className="flex items-start gap-4">
                                <div className={cn("p-3 rounded-xl", section.bg)}>
                                    <section.icon className={cn("h-5 w-5", section.color)} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{section.title}</h4>
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Context Data</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditStep(section.step)}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                            >
                                <Sparkles className="h-4 w-4" /> {/* Use Sparkles or a different Edit icon if available, but Sparkles is already imported */}
                            </Button>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {section.content.map((item, idx) => (
                                <div key={idx} className="flex flex-col gap-1">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{item.label}</span>
                                    <span className="text-sm font-medium text-slate-700 italic">
                                        {item.value || <span className="text-slate-300">Not specified</span>}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-8 rounded-2xl border border-indigo-50 bg-indigo-50/30">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="font-bold text-slate-900">Documentary Inventory</h4>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3">
                            {policyList.length} Items Found
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditStep(3)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                        >
                            <Sparkles className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {policyList.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {policyList.map((policy, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-indigo-100/50 shadow-sm group hover:border-indigo-400 transition-colors">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span className="text-xs font-bold text-slate-700 truncate">{policy}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl">
                        <p className="text-slate-400 text-sm font-medium italic">No existing documentation noted during discovery</p>
                    </div>
                )}
            </div>

            {/* AI Executive Report Section */}
            <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-indigo-50 flex items-center justify-between bg-indigo-50/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg shadow-md shadow-indigo-200">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">Executive Scoping Report</h4>
                            <p className="text-xs text-slate-500 font-medium">AI-generated summary for stakeholders</p>
                        </div>
                    </div>

                    {!report && !isGenerating && (
                        <Button
                            onClick={handleGenerateReport}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 border-0"
                            size="sm"
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Report
                        </Button>
                    )}
                </div>

                {(report || isGenerating) && (
                    <div className="p-8 min-h-[200px] bg-slate-50/50">
                        {report ? (
                            <div className="prose prose-sm prose-indigo max-w-none bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                                <Markdown>{report}</Markdown>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-3" />
                                <p className="text-slate-600 font-medium">Analyzing discovery data...</p>
                                <p className="text-xs text-slate-400">Drafting executive summary for {standardId}</p>
                            </div>
                        )}

                        {/* Regenerate Action */}
                        {!isGenerating && report && (
                            <div className="flex justify-end mt-4">
                                <Button
                                    onClick={handleGenerateReport}
                                    variant="outline"
                                    size="sm"
                                    className="text-slate-500 hover:text-slate-700 hover:bg-white"
                                >
                                    <Sparkles className="h-3 w-3 mr-2" />
                                    Regenerate
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-3xl opacity-50 -mr-32 -mt-32 rounded-full" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-left">
                        <h4 className="text-xl font-bold tracking-tight">Ready to baseline?</h4>
                        <p className="text-slate-400 text-sm font-medium max-w-md">
                            Confirming this setup will initialize the {standardId} control framework and auto-map your existing evidence.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                            <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Ready for Implementation
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
