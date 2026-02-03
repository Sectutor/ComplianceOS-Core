
import React from 'react';
import CyberLayout from "./CyberLayout";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    ShieldCheck,
    AlertTriangle,
    Activity,
    Lock,
    ArrowRight,
    CheckCircle2,
    Shield,
    BarChart3,
    FileText,
    Server,
    Zap,
    BookOpen
} from "lucide-react";
import { useLocation } from "wouter";
import { useClientContext } from "@/contexts/ClientContext";
import { cn } from "@/lib/utils";

export default function CyberDashboard() {
    const { selectedClientId } = useClientContext();
    const [, setLocation] = useLocation();

    const sections = [
        {
            title: "NIS2 Assessment",
            headerTitle: "Article 21 Compliance",
            description: "Conduct a comprehensive gap analysis against the 10 key measures of the NIS2 Directive.",
            icon: ShieldCheck,
            color: "from-emerald-500 to-teal-400",
            textColor: "text-emerald-600",
            bgLight: "bg-emerald-50",
            path: `/clients/${selectedClientId}/cyber/assessment`,
            benefits: [
                "Automated gap analysis",
                "Compliance scoring",
                "Actionable remediation plan"
            ]
        },
        {
            title: "Risk Management",
            headerTitle: "Cyber Risk Framework",
            description: "Identify, assess, and mitigate risks to network and information systems security.",
            icon: AlertTriangle,
            color: "from-amber-500 to-orange-400",
            textColor: "text-amber-600",
            bgLight: "bg-amber-50",
            path: `/clients/${selectedClientId}/risks/dashboard`,
            benefits: [
                "Risk Register & Matrix",
                "Threat modeling",
                "Treatment planning"
            ]
        },
        {
            title: "Business Continuity",
            headerTitle: "Article 21 (c)",
            description: "Ensure continuity of essential services with BIA, recovery plans, and crisis management.",
            icon: Activity,
            color: "from-purple-500 to-violet-400",
            textColor: "text-purple-600",
            bgLight: "bg-purple-50",
            path: `/clients/${selectedClientId}/business-continuity`,
            benefits: [
                "Business Impact Analysis",
                "Disaster Recovery Plans",
                "Crisis Management"
            ]
        },
        {
            title: "Incident Reporting",
            headerTitle: "Article 23 Notifications",
            description: "Streamlined workflow for reporting significant incidents to the CSIRT within strict 24h/72h deadlines.",
            icon: Zap, // Changed Icon to distinguish
            color: "from-rose-500 to-red-400",
            textColor: "text-rose-600",
            bgLight: "bg-rose-50",
            path: `/clients/${selectedClientId}/cyber/incidents`,
            benefits: [
                "24h Early Warning wizard",
                "72h Incident Notification",
                "Root cause analysis log"
            ]
        },
        {
            title: "Supply Chain Security",
            headerTitle: "Vendor Risk Management",
            description: "Manage risks stemming from your relationships with suppliers and service providers.",
            icon: Lock,
            color: "from-blue-500 to-cyan-400",
            textColor: "text-blue-600",
            bgLight: "bg-blue-50",
            path: `/clients/${selectedClientId}/vendors/overview`,
            benefits: [
                "Certifications tracking"
            ]
        },
        {
            title: "Documentation & Evidence",
            headerTitle: "Article 21 Compliance",
            description: "Centralized repository for policies, procedures, and evidence required for NIS2 audits.",
            icon: FileText,
            color: "from-slate-500 to-gray-400",
            textColor: "text-slate-600",
            bgLight: "bg-slate-50",
            path: `/clients/${selectedClientId}/cyber/documents`,
            benefits: [
                "Policy management",
                "Evidence collection",
                "Audit trail"
            ]
        }
    ];

    return (
        <CyberLayout>
            <div className="space-y-10 pb-20">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-16 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />

                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                <Shield className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Cyber Resilience Act</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                                Unified <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                                    Cyber Resilience
                                </span>
                            </h1>
                            <p className="text-lg text-slate-300 leading-relaxed">
                                Achieve NIS2 compliance with a holistic approach. Manage assessments, risks, incidents, and supply chain security in one integrated workspace.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>NIS2 Compliant</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>ISO 27001 Aligned</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>DORA Ready</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:flex justify-center relative">
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-3xl rotate-3 hover:rotate-0 transition-transform duration-500">
                                <div className="grid grid-cols-2 gap-4">
                                    {[Server, Activity, Lock, Zap].map((Icon, i) => (
                                        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                                            <Icon className="w-8 h-8 text-emerald-400" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl border border-white/10">
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full w-3/4 bg-emerald-400 rounded-full" />
                                    </div>
                                    <p className="text-[10px] mt-2 text-emerald-200 font-mono">RESILIENCE SCORE: GOOD</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* NIS2 Guide Callout */}
                <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100 -mt-6">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex gap-4 items-center">
                            <div className="p-3 bg-emerald-100 rounded-xl hidden sm:block">
                                <BookOpen className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-emerald-900 text-lg">NIS2 Implementation Guide</h3>
                                <p className="text-emerald-700/80 max-w-2xl">
                                    Step-by-step guidance on achieving compliance with the EU NIS2 Directive requirements.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setLocation(`/clients/${selectedClientId}/cyber/overview`)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold whitespace-nowrap"
                        >
                            View Guide <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>

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

                {/* Why it Matters Section */}
                <div className="bg-slate-50 rounded-3xl p-12 mt-12 border border-slate-200 border-dashed">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl font-extrabold tracking-tight">Why Cyber Resilience Matters</h2>
                        <p className="text-muted-foreground">
                            NIS2 ensures a high common level of cybersecurity across the Union, enhancing protection for critical infrastructure.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 mt-12 text-center italic">
                        <div className="p-6">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Business Continuity</h3>
                            <p className="text-slate-500 text-sm">"Ensuring essential services continue to operate even during severe cyber incidents."</p>
                        </div>
                        <div className="p-6 border-x border-slate-200">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Avoid Sanctions</h3>
                            <p className="text-slate-500 text-sm">"NIS2 introduces strict fines for non-compliance, up to €10M or 2% of total turnover."</p>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Supply Chain Trust</h3>
                            <p className="text-slate-500 text-sm">"Securing the supply chain is critical to preventing cascading attacks."</p>
                        </div>
                    </div>
                </div>
            </div>
        </CyberLayout>
    );
}
