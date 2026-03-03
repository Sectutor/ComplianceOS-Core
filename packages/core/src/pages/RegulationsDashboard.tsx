import React, { useState, useMemo } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { regulations } from "@/data/regulations";
import { frameworks } from "@/data/frameworks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@complianceos/ui/ui/select";
import { ArrowRight, Scale, Shield, Target, Rocket, Activity, AlertCircle, Search, ChevronDown, ChevronRight as ChevronRightIcon, FileText, ClipboardCheck, LayoutList, Database, FileCheck } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useClientContext } from "@/contexts/ClientContext";

import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { CircularProgress } from "@complianceos/ui/ui/circular-progress";
import { PageGuide } from "@/components/PageGuide";

function RegulationLogo({ logo, name }: { logo?: string; name: string }) {
    const [error, setError] = useState(false);

    if (logo && !error) {
        return (
            <div className="h-12 w-16 min-w-[4rem] rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow overflow-hidden">
                <img
                    src={logo}
                    alt={name}
                    className="w-full h-full object-contain p-1"
                    onError={() => setError(true)}
                />
            </div>
        );
    }

    return (
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-primary shadow-sm group-hover:shadow-md transition-shadow">
            <Scale className="h-6 w-6 text-primary drop-shadow-sm" />
        </div>
    );
}

export default function RegulationsDashboard() {
    const [location, setLocation] = useLocation();
    const params = useParams<{ id: string }>();
    const generateReport = trpc.regulations.generateReport.useMutation();
    const { selectedClientId } = useClientContext();

    // Prefer URL param, then context, then fallback
    const clientId = params.id ? parseInt(params.id) : (selectedClientId || 1);

    // Fetch Stats for progress
    const { data: stats } = trpc.compliance.frameworkStats.list.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const getStats = (regName: string) => {
        if (!stats || !Array.isArray(stats)) return { percentage: 0 };
        // Fuzzy match: check if name matches or is contained
        const exact = stats.find(s => s.framework === regName);
        if (exact) return exact;

        return stats.find(s => regName.includes(s.framework) || s.framework.includes(regName)) || { percentage: 0 };
    };

    const getProgressColor = (percentage: number) => {
        if (percentage === 0) return "text-slate-200";
        if (percentage < 30) return "text-red-500";
        if (percentage < 70) return "text-amber-500";
        return "text-emerald-500";
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <Breadcrumb items={[{ label: "Compliance Obligations" }]} />

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold">Compliance Obligations</h1>
                        <p className="text-muted-foreground">Manage your mandatory regulatory requirements distinct from voluntary frameworks.</p>
                    </div>
                    <div className="flex gap-2">
                        <PageGuide
                            title="Compliance Obligations"
                            description="Manage mandatory regulatory requirements and statutory obligations."
                            rationale="Regulatory compliance is not optional. Unlike voluntary frameworks, these are legal requirements based on your jurisdiction and industry. This dashboard helps you track the 'must-haves' to avoid legal and financial penalties."
                            howToUse={[
                                {
                                    step: "Gap Analysis",
                                    description: "Download a comprehensive report showing exactly where you stand against legal requirements.",
                                    targetId: "reg-gap-analysis-btn"
                                },
                                {
                                    step: "Domain Links",
                                    description: "Quickly navigate to Risk, Controls, or Implementation to address specific gaps.",
                                    targetId: "reg-quick-links"
                                },
                                {
                                    step: "Track Mandates",
                                    description: "Monitor progress of GDPR, HIPAA, or other mandatory regulations relevant to your business.",
                                    targetId: "reg-grid-container"
                                }
                            ]}
                            scenarios={[
                                {
                                    title: "Responding to a Legal Inquiry",
                                    example: "Your legal department asks for a status update on GDPR compliance for a new region.",
                                    auditTip: "Use 'Download Gap Analysis'. It produces an executive-ready PDF that shows exactly which regulatory articles are implemented and where the remaining risks lie."
                                },
                                {
                                    title: "Prioritizing Mandatory Work",
                                    example: "You have limited resources and need to decide between working on SOC 2 (voluntary) or HIPAA (mandatory).",
                                    auditTip: "Mandatory regulations in this dashboard usually carry higher legal risk. Focus on any regulation in the 'Red' (<30%) zone here first before voluntary standards."
                                }
                            ]}
                            integrations={[
                                { name: "Internal Controls", description: "Satisfying a regulation automatically updates linked internal controls." },
                                { name: "Risk Register", description: "Regulatory failures are flagged as high-impact risks." }
                            ]}
                        />
                        <Button
                            id="reg-gap-analysis-btn"
                            onClick={async (e) => {
                                e.stopPropagation();
                                toast.promise(generateReport.mutateAsync({ clientId }), {
                                    loading: 'Generating Report...',
                                    success: (data) => {
                                        const link = document.createElement('a');
                                        link.href = `data:application/pdf;base64,${data.pdfBase64}`;
                                        link.download = data.filename;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        return 'Report downloaded successfully';
                                    },
                                    error: 'Failed to generate report'
                                });
                            }}
                        >
                            Download Gap Analysis
                        </Button>
                    </div>
                </div>

                <div id="reg-quick-links" className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                    <Card
                        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white border border-white/40 bg-white/60 backdrop-blur-xl shadow-premium rounded-2xl group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        onClick={() => setLocation(`/clients/${clientId}/roadmap`)}
                    >
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                            <Rocket className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-800 tracking-tight">Compliance Roadmap</p>
                            <p className="text-xs font-medium text-slate-500">Strategic milestones</p>
                        </div>
                    </Card>

                    <Card
                        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white border border-white/40 bg-white/60 backdrop-blur-xl shadow-premium rounded-2xl group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        onClick={() => setLocation(`/clients/${clientId}/risks`)}
                    >
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform duration-300">
                            <Target className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-800 tracking-tight">Risk Register</p>
                            <p className="text-xs font-medium text-slate-500">High-impact threats</p>
                        </div>
                    </Card>

                    <Card
                        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white border border-white/40 bg-white/60 backdrop-blur-xl shadow-premium rounded-2xl group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        onClick={() => setLocation(`/clients/${clientId}/controls`)}
                    >
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                            <Shield className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-800 tracking-tight">Internal Controls</p>
                            <p className="text-xs font-medium text-slate-500">Satisfying obligations</p>
                        </div>
                    </Card>

                    <Card
                        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white border border-white/40 bg-white/60 backdrop-blur-xl shadow-premium rounded-2xl group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        onClick={() => setLocation(`/clients/${clientId}/implementation`)}
                    >
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-800 tracking-tight">Implementation</p>
                            <p className="text-xs font-medium text-slate-500">Remediation progress</p>
                        </div>
                    </Card>
                </div>

                <div id="reg-grid-container" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Regulations */}
                    {regulations.map((reg) => {
                        const regStats = getStats(reg.name);
                        const progressColor = getProgressColor(regStats.percentage);

                        return (
                            <Card key={reg.id} className="group hover:border-white/60 bg-white/60 backdrop-blur-xl border border-white/40 shadow-premium transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden rounded-3xl relative" onClick={() => setLocation(`/clients/${clientId}/compliance-obligations/${reg.id}`)}>
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                <div className="p-6 flex h-full gap-6 relative z-10">
                                    {/* Left Side: Info */}
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <div className="flex items-start justify-between mb-4">
                                            <RegulationLogo logo={reg.logo} name={reg.name} />
                                            <Badge variant="secondary" className="bg-white border border-slate-200 text-slate-700 font-semibold shadow-sm hover:bg-slate-50 px-3 py-1 text-xs uppercase tracking-wider">{reg.type}</Badge>
                                        </div>

                                        <div className="mb-auto">
                                            <h3 className="font-black text-xl text-slate-900 group-hover:text-primary transition-colors leading-tight mb-2 tracking-tight">
                                                {reg.name}
                                            </h3>
                                            <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                                {reg.description}
                                            </p>
                                        </div>

                                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
                                            View Details <ArrowRight className="ml-1.5 h-4 w-4" />
                                        </div>
                                    </div>

                                    {/* Right Side: Progress */}
                                    <div className="flex flex-col items-center justify-center border-l dashed border-slate-200/50 pl-6 min-w-[120px]">
                                        <CircularProgress
                                            value={regStats.percentage}
                                            size={100}
                                            strokeWidth={10}
                                            color={progressColor}
                                        />
                                        <span className={`mt-3 text-xs font-black uppercase tracking-wider ${regStats.percentage > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                                            {regStats.percentage > 0 ? `${regStats.percentage}% Done` : 'Not Started'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}

                    {/* Standard Frameworks & Obligatory Certifications */}
                    {frameworks.filter(f => f.isObligation).map((fw) => {
                        const fwStats = getStats(fw.name);
                        const progressColor = getProgressColor(fwStats.percentage);

                        return (
                            <Card key={fw.id} className="group hover:border-white/60 bg-white/60 backdrop-blur-xl border border-white/40 shadow-premium transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden rounded-3xl relative" onClick={() => setLocation(`/clients/${clientId}/compliance-obligations/${fw.id}`)}>
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                <div className="p-6 flex h-full gap-6 relative z-10">
                                    {/* Left Side: Info */}
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <div className="flex items-start justify-between mb-4">
                                            <RegulationLogo logo={fw.logo} name={fw.name} />
                                            <Badge variant="secondary" className="bg-blue-50 border border-blue-200 text-blue-700 font-semibold shadow-sm hover:bg-blue-50 px-3 py-1 text-xs uppercase tracking-wider">{fw.type}</Badge>
                                        </div>

                                        <div className="mb-auto">
                                            <h3 className="font-black text-xl text-slate-900 group-hover:text-primary transition-colors leading-tight mb-2 tracking-tight">
                                                {fw.name}
                                            </h3>
                                            <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                                {fw.description}
                                            </p>
                                        </div>

                                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
                                            View Details <ArrowRight className="ml-1.5 h-4 w-4" />
                                        </div>
                                    </div>

                                    {/* Right Side: Progress */}
                                    <div className="flex flex-col items-center justify-center border-l dashed border-slate-200/50 pl-6 min-w-[120px]">
                                        <CircularProgress
                                            value={fwStats.percentage}
                                            size={100}
                                            strokeWidth={10}
                                            color={progressColor}
                                        />
                                        <span className={`mt-3 text-xs font-black uppercase tracking-wider ${fwStats.percentage > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                                            {fwStats.percentage > 0 ? `${fwStats.percentage}% Done` : 'Not Started'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}
