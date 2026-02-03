
import React from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import {
    BookOpen,
    Sparkles,
    Link,
    ClipboardCheck,
    Star,
    Calendar,
    ArrowRight,
    CheckCircle2,
    Target,
    FileSearch
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function ComplianceOverview() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [, setLocation] = useLocation();

    const sections = [
        {
            title: "Knowledge Base",
            headerTitle: "Centralized Documentation",
            description: "Maintain a centralized repository of compliance documentation, policies, procedures, and institutional knowledge for easy access and reference.",
            icon: BookOpen,
            color: "from-blue-500 to-cyan-400",
            textColor: "text-blue-600",
            bgLight: "bg-blue-50",
            path: `/clients/${clientId}/knowledge-base`,
            benefits: [
                "Document version control",
                "Full-text search",
                "Category organization"
            ]
        },
        {
            title: "AI Questionnaires",
            headerTitle: "Automated Gap Analysis",
            description: "Leverage AI-powered questionnaires to conduct automated gap analyses across frameworks, identifying control deficiencies and remediation priorities.",
            icon: Sparkles,
            color: "from-purple-600 to-indigo-500",
            textColor: "text-purple-600",
            bgLight: "bg-purple-50",
            path: `/clients/${clientId}/questionnaires`,
            benefits: [
                "AI-powered gap detection",
                "Framework-specific questions",
                "Automated scoring"
            ]
        },
        {
            title: "Framework Mappings",
            headerTitle: "Control Crosswalks",
            description: "Map controls across multiple frameworks (ISO 27001, SOC 2, NIST, HIPAA) to eliminate redundant work and demonstrate multi-framework compliance.",
            icon: Link,
            color: "from-emerald-500 to-teal-400",
            textColor: "text-emerald-600",
            bgLight: "bg-emerald-50",
            path: `/clients/${clientId}/mappings`,
            benefits: [
                "Multi-framework alignment",
                "Shared evidence mapping",
                "Compliance efficiency"
            ]
        },
        {
            title: "Coverage Analysis",
            headerTitle: "Implementation Tracking",
            description: "Track control implementation coverage across frameworks with visual dashboards showing completion percentages and gap identification.",
            icon: ClipboardCheck,
            color: "from-orange-500 to-red-400",
            textColor: "text-orange-600",
            bgLight: "bg-orange-50",
            path: `/clients/${clientId}/coverage`,
            benefits: [
                "Coverage percentage tracking",
                "Gap visualization",
                "Priority recommendations"
            ]
        },
        {
            title: "Audit Readiness Wizard",
            headerTitle: "Certification Preparation",
            description: "Guided wizard to prepare for certification audits (ISO 27001, SOC 2, etc.) with pre-audit checklists and evidence validation.",
            icon: Star,
            color: "from-rose-500 to-pink-400",
            textColor: "text-rose-600",
            bgLight: "bg-rose-50",
            path: `/clients/${clientId}/readiness/wizard`,
            benefits: [
                "Pre-audit checklists",
                "Evidence validation",
                "Readiness scoring"
            ]
        },
        {
            title: "Remediation Roadmap",
            headerTitle: "Gap Closure Planning",
            description: "Plan and track remediation activities for identified gaps with milestone-based roadmaps and progress monitoring.",
            icon: Calendar,
            color: "from-indigo-500 to-blue-400",
            textColor: "text-indigo-600",
            bgLight: "bg-indigo-50",
            path: `/clients/${clientId}/readiness/roadmap`,
            benefits: [
                "Milestone tracking",
                "Resource allocation",
                "Progress visualization"
            ]
        }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-10 pb-20 px-6">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Compliance", href: `/clients/${clientId}/compliance` },
                        { label: "Overview & Guidance" },
                    ]}
                />

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-16 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />

                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                <Star className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-amber-100">Audit Excellence</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                                Compliance & <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                                    Audit Readiness
                                </span>
                            </h1>
                            <p className="text-lg text-slate-300 leading-relaxed">
                                Transform audit preparation from stressful scrambles into structured processes. Our platform helps you maintain continuous audit readiness through automated gap analysis and evidence management.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>ISO 27001 Ready</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>SOC 2 Prepared</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>Multi-Framework</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:flex justify-center relative">
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-3xl rotate-3 hover:rotate-0 transition-transform duration-500">
                                <div className="grid grid-cols-2 gap-4">
                                    {[Star, Sparkles, ClipboardCheck, Target].map((Icon, i) => (
                                        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                                            <Icon className="w-8 h-8 text-amber-400" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl border border-white/10">
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full w-4/5 bg-amber-400 rounded-full" />
                                    </div>
                                    <p className="text-[10px] mt-2 text-amber-200 font-mono">AUDIT READINESS: 80%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                    {sections.map((section, idx) => (
                        <Card key={idx} className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]">
                            <CardContent className="p-0">
                                <div className={`h-2 bg-gradient-to-r ${section.color}`} />
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-4 rounded-2xl ${section.bgLight} ${section.textColor}`}>
                                            <section.icon className="w-8 h-8" />
                                        </div>
                                        <Badge variant="outline" className="font-mono text-[10px] opacity-70">
                                            {section.headerTitle}
                                        </Badge>
                                    </div>
                                    <h2 className="text-2xl font-bold mb-3">{section.title}</h2>
                                    <p className="text-muted-foreground mb-6 leading-relaxed">
                                        {section.description}
                                    </p>
                                    <div className="space-y-3 mb-8">
                                        {section.benefits.map((benefit, bIdx) => (
                                            <div key={bIdx} className="flex items-center text-sm font-medium">
                                                <div className={`w-1.5 h-1.5 rounded-full mr-3 bg-gradient-to-r ${section.color}`} />
                                                {benefit}
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        onClick={() => setLocation(section.path)}
                                        className={`w-full bg-gradient-to-r ${section.color} hover:opacity-90 transition-opacity text-white font-bold py-6 rounded-xl`}
                                    >
                                        Access Module
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Audit Preparation Workflow */}
                <div className="bg-gradient-to-br from-slate-50 to-amber-50 rounded-3xl p-12 border border-slate-200">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl font-extrabold tracking-tight">Audit Preparation Workflow</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Maintain continuous audit readiness through structured gap analysis, remediation, and evidence management.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-5 gap-6 relative">
                        <div className="hidden md:block absolute top-8 left-12 right-12 h-0.5 bg-gradient-to-r from-blue-300 via-amber-300 to-emerald-300" />

                        {[
                            { step: "1", title: "Assess", desc: "Gap analysis", icon: Sparkles, color: "text-blue-600", bg: "bg-blue-100" },
                            { step: "2", title: "Map", desc: "Framework alignment", icon: Link, color: "text-purple-600", bg: "bg-purple-100" },
                            { step: "3", title: "Remediate", desc: "Close gaps", icon: Calendar, color: "text-amber-600", bg: "bg-amber-100" },
                            { step: "4", title: "Validate", desc: "Evidence review", icon: ClipboardCheck, color: "text-orange-600", bg: "bg-orange-100" },
                            { step: "5", title: "Certify", desc: "Audit success", icon: Star, color: "text-emerald-600", bg: "bg-emerald-100" }
                        ].map((item, i) => (
                            <div key={i} className="relative flex flex-col items-center text-center">
                                <div className={`w-16 h-16 rounded-full ${item.bg} flex items-center justify-center mb-4 shadow-lg z-10 border-4 border-white`}>
                                    <item.icon className={`w-8 h-8 ${item.color}`} />
                                </div>
                                <div className={`text-xs font-bold uppercase tracking-wider ${item.color} mb-2`}>
                                    Step {item.step}
                                </div>
                                <div className="font-bold mb-1 text-slate-900">{item.title}</div>
                                <div className="text-xs text-slate-600 leading-snug">{item.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Why it Matters */}
                <div className="bg-slate-50 rounded-3xl p-12 mt-12 border border-slate-200 border-dashed">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl font-extrabold tracking-tight">Why Audit Readiness Matters</h2>
                        <p className="text-muted-foreground">
                            Organizations with continuous audit readiness programs reduce certification costs by 40% and audit duration by 60%.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 mt-12 text-center italic">
                        <div className="p-6">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Pass Audits Faster</h3>
                            <p className="text-slate-500 text-sm">"Our ISO 27001 audit took 3 days instead of 2 weeks because evidence was pre-organized and validated."</p>
                        </div>
                        <div className="p-6 border-x border-slate-200">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Reduce Costs</h3>
                            <p className="text-slate-500 text-sm">"Continuous readiness eliminated last-minute consultant fees and reduced our annual audit costs by $50K."</p>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Win Business</h3>
                            <p className="text-slate-500 text-sm">"SOC 2 Type II certification unlocked enterprise deals worth $5M that required third-party attestation."</p>
                        </div>
                    </div>
                </div>

                {/* Quick Start */}
                <Card className="border-2 border-dashed border-amber-300 bg-amber-50/50">
                    <CardContent className="p-8">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-amber-600 rounded-xl">
                                <Star className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">New to Audit Preparation? Start Here</h3>
                                <p className="text-muted-foreground mb-4">
                                    If you're preparing for your first certification audit, follow this path:
                                </p>
                                <ol className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-amber-600 min-w-[20px]">1.</span>
                                        <span><strong>Run AI Gap Analysis</strong> - Use automated questionnaires to identify control gaps</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-amber-600 min-w-[20px]">2.</span>
                                        <span><strong>Review Framework Mappings</strong> - Understand how controls map across frameworks</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-amber-600 min-w-[20px]">3.</span>
                                        <span><strong>Check Coverage</strong> - Visualize implementation status and prioritize gaps</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-amber-600 min-w-[20px]">4.</span>
                                        <span><strong>Build Remediation Roadmap</strong> - Plan gap closure with milestones</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-amber-600 min-w-[20px]">5.</span>
                                        <span><strong>Use Readiness Wizard</strong> - Complete pre-audit checklist and validate evidence</span>
                                    </li>
                                </ol>
                                <div className="mt-6">
                                    <Button
                                        onClick={() => setLocation(`/clients/${clientId}/questionnaires`)}
                                        className="bg-amber-600 hover:bg-amber-700"
                                    >
                                        Start with AI Gap Analysis
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

function Badge({ children, variant, className }: any) {
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${className} border`}>
            {children}
        </span>
    );
}
