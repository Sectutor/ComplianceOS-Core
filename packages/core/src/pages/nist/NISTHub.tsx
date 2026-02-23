import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import {
    Shield,
    Zap,
    BookOpen,
    Activity,
    Users,
    Truck,
    ArrowRight,
    ExternalLink,
    Lock,
    CheckCircle2,
    AlertCircle,
    LayoutGrid,
    Target
} from "lucide-react";
import { Link } from "wouter";
import { useClientContext } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import NISTEcosystemLayout from './NISTEcosystemLayout';

export default function NISTHub() {
    const { selectedClientId } = useClientContext();
    const clientId = selectedClientId || 0;

    // Fetch CSF Data for the Summary Card
    const { data: assessments } = trpc.maturity.getAssessments.useQuery(
        { clientId, frameworkId: 'nist-csf-2' },
        { enabled: !!clientId }
    );

    const { data: frameworkData } = trpc.maturity.getFrameworkData.useQuery(
        { frameworkId: 'nist-csf-2' },
        { enabled: !!clientId }
    );

    // Fetch RMF/FISMA Systems
    const { data: rmfSystems } = trpc.federal.listFismaSystems.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    // Fetch NIST 800-53 Controls and Assessments
    const { data: nist80053Controls } = trpc.controls.list.useQuery(
        { clientId, framework: 'nist-800-53' },
        { enabled: !!clientId }
    );

    const { data: nist80053Assessments } = trpc.maturity.getAssessments.useQuery(
        { clientId, frameworkId: 'nist-800-53' },
        { enabled: !!clientId }
    );

    // Fetch Risks
    const { data: risksData } = trpc.risks.list.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    // Fetch Evidence
    const { data: evidenceData } = trpc.evidence.list.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    // Calculate CSF progress
    const csfProgress = useMemo(() => {
        if (!assessments || !frameworkData) return 0;
        const total = frameworkData.requirements?.length || 0;
        const achieved = assessments.filter((a: any) => a.isAchieved).length;
        return total > 0 ? Math.round((achieved / total) * 100) : 0;
    }, [assessments, frameworkData]);

    // Use fallback progress values when data is not available
    // These will be connected to real queries when the backend is ready
    const rmfProgress = rmfSystems?.length ? Math.round(rmfSystems.reduce((acc: number, sys: any) => acc + (sys.progress || 0), 0) / rmfSystems.length) : 0;
    const controlProgress = nist80053Assessments?.length && nist80053Controls?.length
        ? Math.round((nist80053Assessments.filter((a: any) => a.complianceStatus === 'Compliant').length / nist80053Controls.length) * 100)
        : 0;
    const riskProgress = risksData?.items?.length
        ? Math.round((risksData.items.filter((r: any) => r.status === 'approved').length / risksData.items.length) * 100)
        : 0;
    const evidenceProgress = evidenceData?.length
        ? Math.round((evidenceData.filter((e: any) => e.status === 'verified').length / evidenceData.length) * 100)
        : 0;

    const standards = [
        {
            id: "csf",
            title: "Command Center",
            subtitle: "Unified Progress & Actions",
            description: "High-level readiness metrics mapped across the NIST Cybersecurity Framework 2.0 functions.",
            icon: Shield,
            status: "active",
            progress: csfProgress,
            link: `/clients/${selectedClientId}/nist/dashboard`,
            color: "text-blue-600",
            borderColor: "border-blue-200",
            bgColor: "bg-blue-50/50"
        },
        {
            id: "rmf",
            title: "Systems & Scoping",
            subtitle: "FISMA System Context",
            description: "Define boundaries, categorize data impact, and authorize systems through the Risk Management Framework.",
            icon: LayoutGrid,
            status: "active",
            progress: rmfProgress,
            link: `/clients/${selectedClientId}/nist/rmf`,
            color: "text-emerald-600",
            borderColor: "border-emerald-200",
            bgColor: "bg-emerald-50/50"
        },
        {
            id: "control",
            title: "Control Center",
            subtitle: "Cross-mapped Controls",
            description: "Manage internal controls and baselines mapped directly to the NIST SP 800-53 catalog.",
            icon: Lock,
            status: "active",
            progress: controlProgress,
            link: `/clients/${selectedClientId}/nist/800-53`,
            color: "text-indigo-600",
            borderColor: "border-indigo-200",
            bgColor: "bg-indigo-50/50"
        },
        {
            id: "ra",
            title: "Risk Management",
            subtitle: "Threats & Impact Modeling",
            description: "Identify and estimate risk likelihood and impact aligned with NIST SP 800-30.",
            icon: Target,
            status: "active",
            progress: riskProgress,
            link: `/clients/${selectedClientId}/nist/800-30`,
            color: "text-amber-600",
            borderColor: "border-amber-200",
            bgColor: "bg-amber-50/50"
        },
        {
            id: "evidence",
            title: "Evidence & Audits",
            subtitle: "Continuous Verification",
            description: "Centralized repository for documents, automated connector evidence, and audit logs.",
            icon: CheckCircle2,
            status: "active",
            progress: evidenceProgress,
            link: `/clients/${selectedClientId}/evidence`,
            color: "text-rose-600",
            borderColor: "border-rose-200",
            bgColor: "bg-rose-50/50"
        },
        {
            id: "org",
            title: "Strategy & Governance",
            subtitle: "Executive Alignment",
            description: "Link cybersecurity strategy directly to your business mission and organizational goals.",
            icon: Users,
            status: "active",
            progress: csfProgress,
            link: `/clients/${selectedClientId}/governance`,
            color: "text-purple-600",
            borderColor: "border-purple-200",
            bgColor: "bg-purple-50/50"
        }
    ];

    return (
        <NISTEcosystemLayout standard="hub">
            <div className="space-y-8 w-full px-4 sm:px-6 lg:px-8 pb-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-primary/10 text-primary border-none font-black text-xs px-3">Official NIST Frameworks</Badge>
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700 font-bold bg-emerald-50/50">Unified Ecosystem</Badge>
                        </div>
                        <h1 className="text-5xl font-black tracking-tight text-slate-900">
                            NIST Compliance <span className="text-primary italic">Hub</span>
                        </h1>
                        <p className="text-slate-500 text-lg font-medium max-w-2xl">
                            The centralized management center for all your NIST-based compliance assessments, risk modeling, and control oversight.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {standards.map((standard) => (
                        <Card
                            key={standard.id}
                            className={cn(
                                "flex flex-col border transition-all duration-300 group hover:shadow-2xl hover:shadow-primary/10 rounded-[2.5rem] overflow-hidden",
                                standard.status === 'placeholder' ? "opacity-60 grayscale border-slate-100" : standard.borderColor
                            )}
                        >
                            <CardHeader className={cn("pb-6", standard.bgColor)}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={cn("p-4 rounded-2xl bg-white shadow-sm transition-transform group-hover:scale-110 duration-500", standard.color)}>
                                        <standard.icon className="h-8 w-8" />
                                    </div>
                                    <Badge variant={standard.status === 'active' ? "default" : "secondary"}>
                                        {standard.status === 'active' ? 'Available' : 'Coming Soon'}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{standard.title}</h2>
                                    <p className={cn("text-xs font-black uppercase tracking-widest", standard.color)}>{standard.subtitle}</p>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-6 flex-1 space-y-6">
                                <p className="text-slate-500 font-medium leading-relaxed">
                                    {standard.description}
                                </p>

                                {standard.status === 'active' && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                                            <span>Readiness Score</span>
                                            <span>{standard.progress}%</span>
                                        </div>
                                        <Progress value={standard.progress} className="h-1.5" />
                                    </div>
                                )}

                                {standard.status === 'placeholder' && (
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Zap className="h-4 w-4" />
                                        <span className="text-xs font-medium italic">Integration pending configuration...</span>
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="pb-8 px-6">
                                {standard.status === 'active' ? (
                                    <Link href={standard.link} className="w-full">
                                        <Button className="w-full bg-slate-900 hover:bg-primary transition-all duration-300 shadow-md h-12 rounded-xl text-white font-bold">
                                            Open Standard <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button disabled variant="secondary" className="w-full bg-slate-100 text-slate-400 h-12 rounded-xl">
                                        Unavailable
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {/* Ecosystem Connectivity Tip */}
                <div className="bg-primary/5 rounded-[3rem] p-8 border border-primary/20 flex flex-col md:flex-row items-center gap-8 shadow-sm">
                    <div className="p-6 bg-primary rounded-[2rem] shadow-xl shadow-primary/20 shrink-0">
                        <Shield className="h-10 w-10 text-white" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Ecosystem Intelligence Integration</h3>
                        <p className="text-slate-600 max-w-4xl text-sm leading-relaxed font-medium">
                            NIST Special Publications are designed to be used in tandem. While the **CSF** provides the high-level roadmap,
                            implementing **800-37 (RMF)** operationalizes those goals, and **800-53** provides the technical controls.
                            Our **Tight Integration** layer ensures that evidence collected in one standard automatically informs readiness in the others.
                        </p>
                    </div>
                </div>
            </div>
        </NISTEcosystemLayout>
    );
}

