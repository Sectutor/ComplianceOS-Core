
import React from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    Shield,
    Database,
    Flame,
    Activity,
    Target,
    ArrowRight,
    CheckCircle2,
    TrendingUp,
    Eye,
    BarChart3,
    AlertTriangle,
    Bug,
    Stethoscope,
    Radar,
    Zap
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function RiskOverview() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [, setLocation] = useLocation();

    const sections = [
        {
            title: "Risk Register",
            headerTitle: "ISO 27005 Clause 8.2",
            description: "Your central repository for all identified risks. Track risk ownership, status, and treatment decisions in one unified view.",
            icon: Shield,
            color: "from-blue-500 to-cyan-400",
            textColor: "text-blue-600",
            bgLight: "bg-blue-50",
            path: `/clients/${clientId}/risks/register`,
            benefits: [
                "Centralized risk tracking and ownership",
                "Real-time risk status monitoring",
                "Audit-ready documentation"
            ]
        },
        {
            title: "Assets",
            headerTitle: "Foundation of Risk Assessment",
            description: "Catalog your critical information assets and assign CIA (Confidentiality, Integrity, Availability) valuations to prioritize protection efforts.",
            icon: Database,
            color: "from-emerald-500 to-teal-400",
            textColor: "text-emerald-600",
            bgLight: "bg-emerald-50",
            path: `/clients/${clientId}/risks/assets`,
            benefits: [
                "CIA triad valuation framework",
                "Asset criticality classification",
                "Data flow visualization"
            ]
        },
        {
            title: "Threats & Vulnerabilities",
            headerTitle: "Threat Intelligence Library",
            description: "Maintain a comprehensive library of threat actors, attack vectors, and known vulnerabilities that could impact your organization.",
            icon: Flame,
            color: "from-orange-500 to-red-400",
            textColor: "text-orange-600",
            bgLight: "bg-orange-50",
            path: `/clients/${clientId}/risks/threats`,
            benefits: [
                "MITRE ATT&CK framework integration",
                "CVE vulnerability tracking",
                "Threat actor profiling"
            ]
        },
        {
            title: "Adversary Intelligence",
            headerTitle: "Premium Feature",
            description: "Live threat feeds from CISA, security news, and a complete MITRE ATT&CK browser. Create risks directly from real-world threat intelligence.",
            icon: Radar,
            color: "from-red-600 to-orange-500",
            textColor: "text-red-600",
            bgLight: "bg-red-50",
            path: `/clients/${clientId}/risks/adversary-intel`,
            benefits: [
                "Live security news feeds",
                "MITRE ATT&CK TTP browser",
                "One-click risk creation from threats"
            ],
            isPremium: true
        },
        {
            title: "Risk Assessments",
            headerTitle: "ISO 27005 Risk Analysis",
            description: "Conduct structured risk assessments by combining assets, threats, and vulnerabilities. Calculate inherent and residual risk using likelihood × impact matrices.",
            icon: Activity,
            color: "from-purple-600 to-indigo-500",
            textColor: "text-purple-600",
            bgLight: "bg-purple-50",
            path: `/clients/${clientId}/risks/assessments`,
            benefits: [
                "Guided assessment workflow",
                "Automated risk scoring (5×5 matrix)",
                "Inherent vs residual risk tracking"
            ]
        },
        {
            title: "Treatment Plan",
            headerTitle: "Risk Mitigation Strategy",
            description: "Define your risk treatment approach: Accept, Mitigate, Transfer, or Avoid. Link controls to risks and track implementation progress.",
            icon: Stethoscope,
            color: "from-rose-500 to-pink-400",
            textColor: "text-rose-600",
            bgLight: "bg-rose-50",
            path: `/clients/${clientId}/risks/treatment-plan`,
            benefits: [
                "4 treatment options (TARA framework)",
                "Control effectiveness tracking",
                "Residual risk calculation"
            ]
        },
        {
            title: "Risk Framework",
            headerTitle: "Methodology & Governance",
            description: "Establish your risk appetite, tolerance levels, and assessment methodology. Define your organization's risk management framework.",
            icon: Target,
            color: "from-indigo-500 to-blue-400",
            textColor: "text-indigo-600",
            bgLight: "bg-indigo-50",
            path: `/clients/${clientId}/risks/framework`,
            benefits: [
                "Risk appetite statement builder",
                "Custom likelihood/impact scales",
                "Review frequency configuration"
            ]
        }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-10 pb-20 px-6">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Risk Management", href: `/clients/${clientId}/risks` },
                        { label: "Overview & Guidance" },
                    ]}
                />

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-16 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />

                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                <Shield className="w-4 h-4 text-orange-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-orange-100">Risk Intelligence</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                                Integrated <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
                                    Risk Management
                                </span>
                            </h1>
                            <p className="text-lg text-slate-300 leading-relaxed">
                                Transform uncertainty into informed decisions. Our ISO 27005-aligned framework helps you identify, assess, treat, and monitor information security risks with precision.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>ISO 27005 Aligned</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>NIST RMF Compatible</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>FAIR Framework Ready</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:flex justify-center relative">
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-3xl rotate-3 hover:rotate-0 transition-transform duration-500">
                                <div className="grid grid-cols-2 gap-4">
                                    {[AlertTriangle, Eye, TrendingUp, BarChart3].map((Icon, i) => (
                                        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                                            <Icon className="w-8 h-8 text-orange-400" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl border border-white/10">
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full w-2/3 bg-orange-400 rounded-full" />
                                    </div>
                                    <p className="text-[10px] mt-2 text-orange-200 font-mono">RISK REDUCTION: 67%</p>
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
                                        {section.isPremium ? (
                                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 font-semibold">
                                                <Zap className="w-3 h-3 mr-1" />
                                                Premium
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="font-mono text-[10px] opacity-70">
                                                {section.headerTitle}
                                            </Badge>
                                        )}
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

                {/* Risk Management Workflow */}
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-12 border border-slate-200">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl font-extrabold tracking-tight">The Risk Management Lifecycle</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Follow this proven methodology to build a comprehensive risk management program aligned with ISO 27005 and NIST RMF.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-5 gap-6 relative">
                        {/* Connector Line */}
                        <div className="hidden md:block absolute top-8 left-12 right-12 h-0.5 bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300" />

                        {[
                            {
                                step: "1",
                                title: "Establish Context",
                                desc: "Define assets and set risk criteria",
                                icon: Database,
                                color: "text-blue-600",
                                bg: "bg-blue-100"
                            },
                            {
                                step: "2",
                                title: "Identify Risks",
                                desc: "Catalog threats and vulnerabilities",
                                icon: Flame,
                                color: "text-orange-600",
                                bg: "bg-orange-100"
                            },
                            {
                                step: "3",
                                title: "Analyze Risks",
                                desc: "Assess likelihood and impact",
                                icon: Activity,
                                color: "text-purple-600",
                                bg: "bg-purple-100"
                            },
                            {
                                step: "4",
                                title: "Treat Risks",
                                desc: "Implement controls and mitigations",
                                icon: Stethoscope,
                                color: "text-rose-600",
                                bg: "bg-rose-100"
                            },
                            {
                                step: "5",
                                title: "Monitor & Review",
                                desc: "Track KRIs and residual risk",
                                icon: BarChart3,
                                color: "text-indigo-600",
                                bg: "bg-indigo-100"
                            }
                        ].map((item, i) => (
                            <div key={i} className="relative flex flex-col items-center text-center">
                                <div className={`w-16 h-16 rounded-full ${item.bg} flex items-center justify-center mb-4 shadow-lg z-10 border-4 border-white`}>
                                    <item.icon className={`w-8 h-8 ${item.color}`} />
                                </div>
                                <div className={`text-xs font-bold uppercase tracking-wider ${item.color} mb-2`}>
                                    Step {item.step}
                                </div>
                                <div className="font-bold mb-2 text-slate-900">{item.title}</div>
                                <div className="text-xs text-slate-600 leading-snug">{item.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Why it Matters Section */}
                <div className="bg-slate-50 rounded-3xl p-12 mt-12 border border-slate-200 border-dashed">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl font-extrabold tracking-tight">Why Risk Management Matters</h2>
                        <p className="text-muted-foreground">
                            Effective risk management isn't just about compliance—it's about making informed decisions that protect your business and enable growth.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 mt-12 text-center italic">
                        <div className="p-6">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Prevent Breaches</h3>
                            <p className="text-slate-500 text-sm">"Proactive risk assessment helped us identify and patch a critical vulnerability before it was exploited. The ROI was immediate."</p>
                        </div>
                        <div className="p-6 border-x border-slate-200">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Enable Business</h3>
                            <p className="text-slate-500 text-sm">"Understanding our risk appetite allowed us to pursue new markets confidently, knowing exactly what safeguards we needed."</p>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Demonstrate Due Care</h3>
                            <p className="text-slate-500 text-sm">"Our documented risk register and treatment plans satisfied auditors and gave our board complete visibility into our security posture."</p>
                        </div>
                    </div>
                </div>

                {/* Quick Start Guide */}
                <Card className="border-2 border-dashed border-blue-300 bg-blue-50/50">
                    <CardContent className="p-8">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-600 rounded-xl">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">New to Risk Management? Start Here</h3>
                                <p className="text-muted-foreground mb-4">
                                    If you're building your risk program from scratch, follow this recommended path:
                                </p>
                                <ol className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-blue-600 min-w-[20px]">1.</span>
                                        <span><strong>Define your Risk Framework</strong> - Set risk appetite and establish your assessment methodology</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-blue-600 min-w-[20px]">2.</span>
                                        <span><strong>Catalog Assets</strong> - Identify and value your critical information assets (start with top 10)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-blue-600 min-w-[20px]">3.</span>
                                        <span><strong>Build Threat Library</strong> - Import common threats from MITRE ATT&CK or use our templates</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-blue-600 min-w-[20px]">4.</span>
                                        <span><strong>Conduct Assessments</strong> - Run your first risk assessment using the guided wizard</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-blue-600 min-w-[20px]">5.</span>
                                        <span><strong>Define Treatments</strong> - Link controls to high-priority risks and track implementation</span>
                                    </li>
                                </ol>
                                <div className="mt-6">
                                    <Button
                                        onClick={() => setLocation(`/clients/${clientId}/risks/framework`)}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        Start with Risk Framework
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
