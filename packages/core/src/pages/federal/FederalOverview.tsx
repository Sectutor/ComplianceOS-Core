
import React from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import {
    Shield,
    FileText,
    Lock,
    ScrollText,
    Zap,
    ArrowRight,
    CheckCircle2,
    Building2,
    ClipboardList,
    ShieldCheck,
    Target
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function FederalOverview() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [, setLocation] = useLocation();

    const sections = [
        {
            title: "FIPS 199 Categorization",
            headerTitle: "System Impact Assessment",
            description: "Determine your system's security categorization based on the potential impact to Confidentiality, Integrity, and Availability using NIST FIPS 199 methodology.",
            icon: Lock,
            color: "from-blue-500 to-cyan-400",
            textColor: "text-blue-600",
            bgLight: "bg-blue-50",
            path: `/clients/${clientId}/federal/fips-199`,
            benefits: [
                "CIA triad impact analysis",
                "High Water Mark determination",
                "Automated control baseline selection"
            ]
        },
        {
            title: "System Security Plan (SSP)",
            headerTitle: "NIST 800-171 & 800-172",
            description: "Document your system's security controls, implementation details, and operational procedures required for CMMC Level 2 and DoD contractor compliance.",
            icon: FileText,
            color: "from-indigo-500 to-purple-400",
            textColor: "text-indigo-600",
            bgLight: "bg-indigo-50",
            path: `/clients/${clientId}/federal/ssp-171`,
            benefits: [
                "110 NIST 800-171 controls coverage",
                "Enhanced 800-172 requirements",
                "CMMC 2.0 alignment mapping"
            ]
        },
        {
            title: "Security Assessment Report (SAR)",
            headerTitle: "Control Testing Evidence",
            description: "Generate comprehensive assessment reports documenting the testing methodology, findings, and evidence for each implemented security control.",
            icon: ScrollText,
            color: "from-emerald-500 to-teal-400",
            textColor: "text-emerald-600",
            bgLight: "bg-emerald-50",
            path: `/clients/${clientId}/federal/sar-171`,
            benefits: [
                "DoD-compliant report format",
                "Finding severity classification",
                "Evidence attachment tracking"
            ]
        },
        {
            title: "Plan of Action & Milestones",
            headerTitle: "POA&M Remediation Tracking",
            description: "Track and manage remediation activities for identified control deficiencies with milestone-based progress monitoring and risk scoring.",
            icon: Zap,
            color: "from-orange-500 to-red-400",
            textColor: "text-orange-600",
            bgLight: "bg-orange-50",
            path: `/clients/${clientId}/federal/poam`,
            benefits: [
                "Weakness tracking by control",
                "Milestone-based remediation",
                "Risk-based prioritization"
            ]
        }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-10 pb-20 px-6">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Federal Compliance", href: `/clients/${clientId}/federal` },
                        { label: "Overview & Guidance" },
                    ]}
                />

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-16 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />

                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                <Building2 className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Defense Compliance</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                                Federal <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                                    Compliance Hub
                                </span>
                            </h1>
                            <p className="text-lg text-slate-300 leading-relaxed">
                                Navigate DoD cybersecurity requirements with confidence. Our NIST RMF-aligned platform streamlines DFARS, CMMC, and CUI protection compliance.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>DFARS 252.204-7012</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>CMMC 2.0 Ready</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>NIST 800-171 Rev 3</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:flex justify-center relative">
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-3xl rotate-3 hover:rotate-0 transition-transform duration-500">
                                <div className="grid grid-cols-2 gap-4">
                                    {[ShieldCheck, FileText, ScrollText, Zap].map((Icon, i) => (
                                        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                                            <Icon className="w-8 h-8 text-blue-400" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl border border-white/10">
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full w-4/5 bg-blue-400 rounded-full" />
                                    </div>
                                    <p className="text-[10px] mt-2 text-blue-200 font-mono">CMMC READINESS: 80%</p>
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

                {/* RMF Workflow */}
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-12 border border-slate-200">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl font-extrabold tracking-tight">NIST Risk Management Framework (RMF)</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Follow the 7-step NIST RMF process to achieve and maintain authorization to operate (ATO) for your information systems.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-7 gap-4 relative">
                        {/* Connector Line */}
                        <div className="hidden md:block absolute top-8 left-8 right-8 h-0.5 bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300" />

                        {[
                            { step: "1", title: "Prepare", desc: "Essential activities", icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-100" },
                            { step: "2", title: "Categorize", desc: "FIPS 199", icon: Lock, color: "text-indigo-600", bg: "bg-indigo-100" },
                            { step: "3", title: "Select", desc: "Control baseline", icon: Shield, color: "text-purple-600", bg: "bg-purple-100" },
                            { step: "4", title: "Implement", desc: "Deploy controls", icon: Zap, color: "text-pink-600", bg: "bg-pink-100" },
                            { step: "5", title: "Assess", desc: "Test controls", icon: ScrollText, color: "text-rose-600", bg: "bg-rose-100" },
                            { step: "6", title: "Authorize", desc: "ATO decision", icon: ShieldCheck, color: "text-orange-600", bg: "bg-orange-100" },
                            { step: "7", title: "Monitor", desc: "Continuous", icon: Target, color: "text-amber-600", bg: "bg-amber-100" }
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

                {/* Why it Matters Section */}
                <div className="bg-slate-50 rounded-3xl p-12 mt-12 border border-slate-200 border-dashed">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl font-extrabold tracking-tight">Why Federal Compliance Matters</h2>
                        <p className="text-muted-foreground">
                            Federal compliance isn't optional for DoD contractors—it's a prerequisite for doing business and protecting national security.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 mt-12 text-center italic">
                        <div className="p-6">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Win Contracts</h3>
                            <p className="text-slate-500 text-sm">"CMMC certification opened doors to $50M in DoD contracts we couldn't bid on before. The ROI was immediate."</p>
                        </div>
                        <div className="p-6 border-x border-slate-200">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Protect CUI</h3>
                            <p className="text-slate-500 text-sm">"Our SSP and SAR documentation proved to auditors that we take Controlled Unclassified Information protection seriously."</p>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Avoid Penalties</h3>
                            <p className="text-slate-500 text-sm">"DFARS non-compliance can result in contract termination and suspension from federal work. Prevention is everything."</p>
                        </div>
                    </div>
                </div>

                {/* Quick Start Guide */}
                <Card className="border-2 border-dashed border-blue-300 bg-blue-50/50">
                    <CardContent className="p-8">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-600 rounded-xl">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">New to Federal Compliance? Start Here</h3>
                                <p className="text-muted-foreground mb-4">
                                    If you're pursuing CMMC certification or DFARS compliance, follow this recommended path:
                                </p>
                                <ol className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-blue-600 min-w-[20px]">1.</span>
                                        <span><strong>Complete FIPS 199 Categorization</strong> - Determine your system impact level (Low/Moderate/High)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-blue-600 min-w-[20px]">2.</span>
                                        <span><strong>Build Your SSP</strong> - Document all 110 NIST 800-171 controls and implementation details</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-blue-600 min-w-[20px]">3.</span>
                                        <span><strong>Conduct Assessment</strong> - Test controls and generate your SAR with findings</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-blue-600 min-w-[20px]">4.</span>
                                        <span><strong>Create POA&M</strong> - Track remediation of any identified control deficiencies</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-blue-600 min-w-[20px]">5.</span>
                                        <span><strong>Engage C3PAO</strong> - Schedule your CMMC Level 2 certification assessment</span>
                                    </li>
                                </ol>
                                <div className="mt-6">
                                    <Button
                                        onClick={() => setLocation(`/clients/${clientId}/federal/fips-199`)}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        Start with FIPS 199
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
