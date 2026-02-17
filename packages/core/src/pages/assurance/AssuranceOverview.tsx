
import React from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import {
    Inbox,
    ClipboardCheck,
    LayoutDashboard,
    FileBarChart,
    Bell,
    ArrowRight,
    CheckCircle2,
    Shield,
    FileSearch,
    Archive,
    Target,
    Layers,
    Activity,
    TrendingUp
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function AssuranceOverview() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [, setLocation] = useLocation();

    const sections = [
        {
            title: "Evidence Library",
            headerTitle: "Centralized Evidence Repository",
            description: "Maintain a centralized repository of audit evidence including screenshots, logs, policies, certificates, and test results with automated tagging and control mapping.",
            icon: ClipboardCheck,
            color: "from-blue-500 to-cyan-400",
            textColor: "text-blue-600",
            bgLight: "bg-blue-50",
            path: `/clients/${clientId}/evidence`,
            benefits: [
                "Automated control mapping",
                "Evidence type classification",
                "Retention policy enforcement"
            ]
        },
        {
            title: "Evidence Intake Box",
            headerTitle: "MSP Client Collection",
            description: "Streamlined evidence collection portal for managed service providers to gather evidence from clients with automated organization and validation.",
            icon: Inbox,
            color: "from-purple-600 to-indigo-500",
            textColor: "text-purple-600",
            bgLight: "bg-purple-50",
            path: `/clients/${clientId}/intake`,
            benefits: [
                "Client upload portal",
                "Automated categorization",
                "Request tracking"
            ]
        },
        {
            title: "Board Summary",
            headerTitle: "Executive Reporting",
            description: "Generate executive-level compliance summaries for board presentations with key metrics, risk highlights, and certification status.",
            icon: LayoutDashboard,
            color: "from-emerald-500 to-teal-400",
            textColor: "text-emerald-600",
            bgLight: "bg-emerald-50",
            path: `/clients/${clientId}/board-summary`,
            benefits: [
                "Executive dashboards",
                "Risk heat maps",
                "Certification timeline"
            ]
        },
        {
            title: "Compliance Reports",
            headerTitle: "Audit Documentation",
            description: "Generate comprehensive compliance reports for auditors including control matrices, evidence indexes, and gap analysis summaries.",
            icon: FileBarChart,
            color: "from-orange-500 to-red-400",
            textColor: "text-orange-600",
            bgLight: "bg-orange-50",
            path: `/clients/${clientId}/reports`,
            benefits: [
                "Control effectiveness reports",
                "Evidence coverage matrices",
                "Gap analysis summaries"
            ]
        },
        {
            title: "Notifications & Alerts",
            headerTitle: "Deadline Management",
            description: "Stay informed of upcoming deadlines, evidence expiration, and compliance milestones with configurable notification workflows.",
            icon: Bell,
            color: "from-rose-500 to-pink-400",
            textColor: "text-rose-600",
            bgLight: "bg-rose-50",
            path: `/clients/${clientId}/notifications`,
            benefits: [
                "Evidence expiration alerts",
                "Deadline reminders",
                "Audit milestone tracking"
            ]
        },
        {
            title: "SAMM Maturity Assessment",
            headerTitle: "Software Assurance Model",
            description: "Assess and improve your software security maturity using the OWASP SAMM framework. Set targets, track progress, and link evidence to practices.",
            icon: Shield,
            color: "from-cyan-500 to-blue-600",
            textColor: "text-cyan-600",
            bgLight: "bg-cyan-50",
            path: `/clients/${clientId}/samm`,
            benefits: [
                "Practice-level maturity scores",
                "Target roadmap visualization",
                "Direct evidence linking"
            ]
        },
        {
            title: "Essential Eight",
            headerTitle: "Core Cyber Controls",
            description: "Assess maturity across eight prioritized mitigation strategies and generate improvement plans based on gaps.",
            icon: Shield,
            color: "from-emerald-500 to-cyan-500",
            textColor: "text-emerald-600",
            bgLight: "bg-emerald-50",
            path: `/clients/${clientId}/essential-eight`,
            benefits: [
                "Control-level maturity scores",
                "Target-driven improvement tasks",
                "Evidence-driven verification"
            ]
        },
        {
            title: "NIST CSF 2.0",
            headerTitle: "Cybersecurity Framework",
            description: "Assess your cybersecurity posture against the NIST CSF 2.0. Covering Govern, Identify, Protect, Detect, Respond, and Recover.",
            icon: Shield,
            color: "from-slate-600 to-slate-400",
            textColor: "text-slate-600",
            bgLight: "bg-slate-50",
            path: `/clients/${clientId}/nist-csf-2`,
            benefits: [
                "6 functions & 22 categories",
                "Maturity tier tracking",
                "Implementation guidance"
            ]
        },
        {
            title: "Zero Trust Maturity",
            headerTitle: "CISA ZTMM 2.0",
            description: "Evaluate your Zero Trust maturity across the five pillars: Identity, Devices, Networks, Applications, and Data.",
            icon: Target,
            color: "from-blue-600 to-indigo-500",
            textColor: "text-blue-600",
            bgLight: "bg-blue-50",
            path: `/clients/${clientId}/cisa-ztmm-2`,
            benefits: [
                "5 pillars of Zero Trust",
                "Automation level tracking",
                "Cross-cutting visibility"
            ]
        },
        {
            title: "CMMC 2.0 Maturity",
            headerTitle: "Defense Supply Chain",
            description: "Assess readiness for CMMC 2.0 certification. Track compliance across Level 1 (Foundational) and Level 2 (Advanced).",
            icon: Shield,
            color: "from-orange-600 to-amber-500",
            textColor: "text-orange-600",
            bgLight: "bg-orange-50",
            path: `/clients/${clientId}/cmmc-2`,
            benefits: [
                "Domain-based assessment",
                "FCI & CUI protection",
                "Certification readiness"
            ]
        },
        {
            title: "C2M2 V2.1 Maturity",
            headerTitle: "Energy & Infrastructure",
            description: "Evaluate cybersecurity maturity using the C2M2 V2.1 model. Tailored for energy sector organizations and critical infrastructure.",
            icon: Shield,
            color: "from-blue-700 to-cyan-600",
            textColor: "text-blue-700",
            bgLight: "bg-blue-50",
            path: `/clients/${clientId}/c2m2-2.1`,
            benefits: [
                "10 specialized domains",
                "MIL 1-3 progression",
                "Strategic resilience toolkit"
            ]
        },
        {
            title: "ISO 27001 Implementation",
            headerTitle: "Information Security Standard",
            description: "Manage your ISO 27001:2022 implementation. Track Annex A controls, link evidence, and prepare for certification.",
            icon: Shield,
            color: "from-blue-500 to-indigo-600",
            textColor: "text-blue-600",
            bgLight: "bg-blue-50",
            path: `/clients/${clientId}/assurance/iso-27001`,
            benefits: [
                "93 Annex A controls",
                "Domain-based grouping",
                "Certification readiness tracking"
            ]
        },
        {
            title: "Cloud Controls Matrix (CCM)",
            headerTitle: "Cloud Security Alliance",
            description: "Assess cloud security posture against the CSA CCM v4.0. Covering 17 domains of cloud security excellence.",
            icon: Shield,
            color: "from-sky-500 to-blue-500",
            textColor: "text-sky-600",
            bgLight: "bg-sky-50",
            path: `/clients/${clientId}/assurance/ccm`,
            benefits: [
                "197 control specifications",
                "Cloud-native security",
                "Shared responsibility mapping"
            ]
        }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-10 pb-20 px-6">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Assurance", href: `/clients/${clientId}/evidence` },
                        { label: "Overview & Guidance" },
                    ]}
                />

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-16 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />

                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                <Shield className="w-4 h-4 text-teal-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-teal-100">Evidence Excellence</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                                Assurance & <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                                    Evidence Management
                                </span>
                            </h1>
                            <p className="text-lg text-slate-300 leading-relaxed">
                                Transform evidence management from chaotic file folders into structured audit trails. Our platform helps you collect, organize, and present evidence with confidence.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>Audit Trail Ready</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>Control Mapping</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>Retention Policies</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:flex justify-center relative">
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-3xl rotate-3 hover:rotate-0 transition-transform duration-500">
                                <div className="grid grid-cols-2 gap-4">
                                    {[ClipboardCheck, FileSearch, Archive, Shield].map((Icon, i) => (
                                        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                                            <Icon className="w-8 h-8 text-teal-400" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-xl border border-white/10">
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full w-4/5 bg-teal-400 rounded-full" />
                                    </div>
                                    <p className="text-[10px] mt-2 text-teal-200 font-mono">EVIDENCE COVERAGE: 80%</p>
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

                {/* Evidence Types */}
                <div className="bg-gradient-to-br from-slate-50 to-teal-50 rounded-3xl p-12 border border-slate-200">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl font-extrabold tracking-tight">Evidence Types & Best Practices</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Different controls require different types of evidence. Understand what auditors expect for each category.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { title: "Screenshots", desc: "System configurations, access controls", icon: FileSearch },
                            { title: "Logs", desc: "Audit trails, access logs, change logs", icon: Archive },
                            { title: "Policies", desc: "Approved documents, procedures", icon: FileBarChart },
                            { title: "Certificates", desc: "Training, security certifications", icon: Shield }
                        ].map((item, i) => (
                            <div key={i} className="p-6 bg-white rounded-xl border border-slate-200 text-center">
                                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                                    <item.icon className="w-6 h-6 text-teal-600" />
                                </div>
                                <h3 className="font-bold mb-2">{item.title}</h3>
                                <p className="text-sm text-slate-600">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Why it Matters */}
                <div className="bg-slate-50 rounded-3xl p-12 mt-12 border border-slate-200 border-dashed">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl font-extrabold tracking-tight">Why Evidence Management Matters</h2>
                        <p className="text-muted-foreground">
                            Poor evidence management is the #1 reason for audit delays and findings. Organized evidence accelerates certification.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 mt-12 text-center italic">
                        <div className="p-6">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Faster Audits</h3>
                            <p className="text-slate-500 text-sm">"Pre-organized evidence reduced our SOC 2 audit from 2 weeks to 3 days. Auditors had everything they needed instantly."</p>
                        </div>
                        <div className="p-6 border-x border-slate-200">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Zero Findings</h3>
                            <p className="text-slate-500 text-sm">"Automated evidence mapping to controls eliminated 'evidence not provided' findings that plagued previous audits."</p>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Continuous Compliance</h3>
                            <p className="text-slate-500 text-sm">"Real-time evidence collection means we're always audit-ready, not scrambling when the auditor schedules."</p>
                        </div>
                    </div>
                </div>

                {/* Quick Start */}
                <Card className="border-2 border-dashed border-teal-300 bg-teal-50/50">
                    <CardContent className="p-8">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-teal-600 rounded-xl">
                                <ClipboardCheck className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">New to Evidence Management? Start Here</h3>
                                <p className="text-muted-foreground mb-4">
                                    If you're building your evidence management practice, follow this path:
                                </p>
                                <ol className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-teal-600 min-w-[20px]">1.</span>
                                        <span><strong>Define Evidence Types</strong> - Categorize evidence by type (screenshots, logs, policies, etc.)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-teal-600 min-w-[20px]">2.</span>
                                        <span><strong>Map to Controls</strong> - Link evidence to specific security controls</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-teal-600 min-w-[20px]">3.</span>
                                        <span><strong>Set Retention Policies</strong> - Configure how long to keep each evidence type</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-teal-600 min-w-[20px]">4.</span>
                                        <span><strong>Automate Collection</strong> - Set up workflows for continuous evidence gathering</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-teal-600 min-w-[20px]">5.</span>
                                        <span><strong>Generate Reports</strong> - Create evidence matrices for auditor review</span>
                                    </li>
                                </ol>
                                <div className="mt-6">
                                    <Button
                                        onClick={() => setLocation(`/clients/${clientId}/evidence`)}
                                        className="bg-teal-600 hover:bg-teal-700"
                                    >
                                        Start with Evidence Library
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Meta Maturity Features */}
                <div className="bg-slate-900 rounded-3xl p-12 mt-12 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-black">Meta Maturity Analytics</h2>
                            <p className="text-slate-400 font-medium">
                                Go beyond individual assessments with cross-framework intelligence and strategic simulation.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="p-2 bg-primary/20 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Roadmap Simulation</h3>
                                        <p className="text-sm text-slate-500">Model the impact of security investments before you commit resources.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <Layers className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Cross-Framework Mapping</h3>
                                        <p className="text-sm text-slate-500">Automatically correlate evidence across NIST, CISA, and CMMC to reduce audit fatigue.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                                        <Activity className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Peer Benchmarking</h3>
                                        <p className="text-sm text-slate-500">Compare your maturity levels against anonymous industry peer data.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <div className="p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <span className="text-xs font-black uppercase tracking-widest text-primary">Strategic Outlook</span>
                                    <Badge className="bg-primary/20 text-primary border-primary/30">Early Access</Badge>
                                </div>
                                <div className="space-y-6">
                                    {[70, 45, 90].map((w, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                                                <span>Scenario {i + 1}</span>
                                                <span>{w}% ROI</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full" style={{ width: `${w}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button className="w-full mt-8 bg-white text-slate-900 hover:bg-slate-100 font-bold py-6 rounded-xl">
                                    Request Features
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
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
