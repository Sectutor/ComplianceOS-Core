
import React from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import {
    Shield,
    Search,
    Building2,
    ShieldAlert,
    FileCheck,
    Activity,
    ArrowRight,
    CheckCircle2,
    Globe,
    Users,
    FileText
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function VendorOverview() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [, setLocation] = useLocation();

    const sections = [
        {
            title: "Vendor Discovery",
            headerTitle: "Third-Party Identification",
            description: "Identify and catalog all third-party vendors, suppliers, and service providers with access to your data or systems.",
            icon: Search,
            color: "from-blue-500 to-cyan-400",
            textColor: "text-blue-600",
            bgLight: "bg-blue-50",
            path: `/clients/${clientId}/vendors/discovery`,
            benefits: [
                "Automated vendor discovery",
                "Shadow IT detection",
                "Relationship mapping"
            ]
        },
        {
            title: "Vendor Profiling",
            headerTitle: "Risk Tiering & Classification",
            description: "Assess vendor criticality based on data access, business impact, and regulatory requirements to determine appropriate due diligence levels.",
            icon: Building2,
            color: "from-purple-600 to-indigo-500",
            textColor: "text-purple-600",
            bgLight: "bg-purple-50",
            path: `/clients/${clientId}/vendors/all`,
            benefits: [
                "4-tier risk classification",
                "Data access assessment",
                "Business impact scoring"
            ]
        },
        {
            title: "Security Reviews",
            headerTitle: "SIG & CAIQ Questionnaires",
            description: "Send standardized security questionnaires (SIG, CAIQ, custom) to vendors and track response completion and risk findings.",
            icon: ShieldAlert,
            color: "from-orange-500 to-red-400",
            textColor: "text-orange-600",
            bgLight: "bg-orange-50",
            path: `/clients/${clientId}/vendors/reviews`,
            benefits: [
                "SIG Lite & Standard templates",
                "CAIQ v4 questionnaires",
                "Automated gap analysis"
            ]
        },
        {
            title: "Risk Analysis",
            headerTitle: "Findings & Remediation",
            description: "Analyze vendor security posture, identify gaps, and track remediation of identified risks through structured workflows.",
            icon: FileCheck,
            color: "from-rose-500 to-pink-400",
            textColor: "text-rose-600",
            bgLight: "bg-rose-50",
            path: `/clients/${clientId}/vendors/reviews`,
            benefits: [
                "Risk scoring methodology",
                "Gap remediation tracking",
                "Vendor comparison reports"
            ]
        },
        {
            title: "Continuous Monitoring",
            headerTitle: "Performance & Renewal",
            description: "Monitor vendor performance, track contract renewals, and maintain ongoing visibility into third-party risk posture.",
            icon: Activity,
            color: "from-emerald-500 to-teal-400",
            textColor: "text-emerald-600",
            bgLight: "bg-emerald-50",
            path: `/clients/${clientId}/vendors/overview`,
            benefits: [
                "Contract renewal alerts",
                "Performance KPI tracking",
                "Breach notification monitoring"
            ]
        },
        {
            title: "DPA Management",
            headerTitle: "GDPR Article 28 Compliance",
            description: "Manage Data Processing Agreements (DPAs) with vendors processing personal data, ensuring GDPR Article 28 compliance.",
            icon: FileText,
            color: "from-indigo-500 to-blue-400",
            textColor: "text-indigo-600",
            bgLight: "bg-indigo-50",
            path: `/clients/${clientId}/vendors/dpa-templates`,
            benefits: [
                "DPA template library",
                "Subprocessor registers",
                "SCCs & TIA integration"
            ]
        }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-10 pb-20 px-6">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Vendor Risk", href: `/clients/${clientId}/vendors/overview` },
                        { label: "Overview & Guidance" },
                    ]}
                />

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-16 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />

                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                <Globe className="w-4 h-4 text-purple-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-purple-100">Third-Party Risk</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                                Vendor Risk <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                                    Management
                                </span>
                            </h1>
                            <p className="text-lg text-slate-300 leading-relaxed">
                                Manage your entire vendor ecosystem from discovery to termination. Our TPRM platform helps you assess, monitor, and mitigate third-party risks at scale.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>ISO 27001 A.15 Aligned</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>SOC 2 CC9.2 Ready</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>GDPR Article 28</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:flex justify-center relative">
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-3xl rotate-3 hover:rotate-0 transition-transform duration-500">
                                <div className="grid grid-cols-2 gap-4">
                                    {[Search, Building2, ShieldAlert, Activity].map((Icon, i) => (
                                        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                                            <Icon className="w-8 h-8 text-purple-400" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl border border-white/10">
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full w-3/4 bg-purple-400 rounded-full" />
                                    </div>
                                    <p className="text-[10px] mt-2 text-purple-200 font-mono">VENDOR COVERAGE: 75%</p>
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

                {/* TPRM Lifecycle */}
                <div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-3xl p-12 border border-slate-200">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl font-extrabold tracking-tight">The Vendor Lifecycle</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Manage vendors through every stage from initial discovery to contract termination with structured risk oversight.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-5 gap-6 relative">
                        {/* Connector Line */}
                        <div className="hidden md:block absolute top-8 left-12 right-12 h-0.5 bg-gradient-to-r from-blue-300 via-purple-300 to-emerald-300" />

                        {[
                            { step: "1", title: "Discover", desc: "Identify vendors", icon: Search, color: "text-blue-600", bg: "bg-blue-100" },
                            { step: "2", title: "Profile", desc: "Assess criticality", icon: Building2, color: "text-purple-600", bg: "bg-purple-100" },
                            { step: "3", title: "Assess", desc: "Security review", icon: ShieldAlert, color: "text-orange-600", bg: "bg-orange-100" },
                            { step: "4", title: "Analyze", desc: "Risk findings", icon: FileCheck, color: "text-rose-600", bg: "bg-rose-100" },
                            { step: "5", title: "Monitor", desc: "Continuous", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-100" }
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
                        <h2 className="text-3xl font-extrabold tracking-tight">Why Vendor Risk Management Matters</h2>
                        <p className="text-muted-foreground">
                            Third-party breaches account for over 60% of data incidents. Effective TPRM is your first line of defense.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 mt-12 text-center italic">
                        <div className="p-6">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Prevent Supply Chain Attacks</h3>
                            <p className="text-slate-500 text-sm">"Our vendor assessment program caught a critical vulnerability before it became the next SolarWinds-scale incident."</p>
                        </div>
                        <div className="p-6 border-x border-slate-200">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Meet Compliance</h3>
                            <p className="text-slate-500 text-sm">"ISO 27001 Annex A.15 and SOC 2 CC9.2 both require vendor risk management. Our TPRM program satisfied both."</p>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Build Trust</h3>
                            <p className="text-slate-500 text-sm">"Enterprise customers now ask for our vendor risk reports during procurement. It's a competitive differentiator."</p>
                        </div>
                    </div>
                </div>

                {/* Quick Start Guide */}
                <Card className="border-2 border-dashed border-purple-300 bg-purple-50/50">
                    <CardContent className="p-8">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-purple-600 rounded-xl">
                                <Globe className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">New to Vendor Risk Management? Start Here</h3>
                                <p className="text-muted-foreground mb-4">
                                    If you're building your TPRM program from scratch, follow this recommended path:
                                </p>
                                <ol className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-purple-600 min-w-[20px]">1.</span>
                                        <span><strong>Discover Vendors</strong> - Import your vendor list or use automated discovery tools</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-purple-600 min-w-[20px]">2.</span>
                                        <span><strong>Classify by Tier</strong> - Assign Critical/High/Medium/Low tiers based on data access and business impact</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-purple-600 min-w-[20px]">3.</span>
                                        <span><strong>Send Questionnaires</strong> - Use SIG Lite for low-risk, SIG Standard for high-risk vendors</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-purple-600 min-w-[20px]">4.</span>
                                        <span><strong>Review Responses</strong> - Analyze findings and create remediation plans for gaps</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-purple-600 min-w-[20px]">5.</span>
                                        <span><strong>Set Monitoring</strong> - Configure alerts for contract renewals and security incidents</span>
                                    </li>
                                </ol>
                                <div className="mt-6">
                                    <Button
                                        onClick={() => setLocation(`/clients/${clientId}/vendors/discovery`)}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        Start Vendor Discovery
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
