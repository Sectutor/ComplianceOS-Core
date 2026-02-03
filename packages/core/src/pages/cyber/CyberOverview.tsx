
import React from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import {
    ShieldCheck,
    ListTodo,
    Activity,
    FileText,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Globe
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function CyberOverview() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [, setLocation] = useLocation();

    const sections = [
        {
            title: "NIS2 Assessment",
            headerTitle: "EU Directive Compliance",
            description: "Evaluate your organization's compliance with the NIS2 Directive, including entity classification and cybersecurity requirements.",
            icon: ShieldCheck,
            color: "from-blue-500 to-cyan-400",
            textColor: "text-blue-600",
            bgLight: "bg-blue-50",
            path: `/clients/${clientId}/cyber/assessment`,
            benefits: [
                "Essential vs Important entity classification",
                "Cybersecurity measures checklist",
                "Supply chain security assessment"
            ]
        },
        {
            title: "Incident Management",
            headerTitle: "24-Hour Reporting",
            description: "Manage cybersecurity incidents with automated 24-hour notification workflows and structured incident response procedures.",
            icon: Activity,
            color: "from-orange-500 to-red-400",
            textColor: "text-orange-600",
            bgLight: "bg-orange-50",
            path: `/clients/${clientId}/cyber/incidents`,
            benefits: [
                "24-hour notification clock",
                "CSIRT coordination",
                "Post-incident reporting"
            ]
        },
        {
            title: "Documentation",
            headerTitle: "Policies & Procedures",
            description: "Maintain required cybersecurity policies, procedures, and documentation to demonstrate NIS2 compliance.",
            icon: FileText,
            color: "from-purple-600 to-indigo-500",
            textColor: "text-purple-600",
            bgLight: "bg-purple-50",
            path: `/clients/${clientId}/cyber/documents`,
            benefits: [
                "Policy template library",
                "Version control",
                "Approval workflows"
            ]
        }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-10 pb-20 px-6">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Cyber Resilience", href: `/clients/${clientId}/cyber` },
                        { label: "Overview & Guidance" },
                    ]}
                />

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-16 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />

                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                <Globe className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-cyan-100">NIS2 Directive</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                                Cyber <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                                    Resilience
                                </span>
                            </h1>
                            <p className="text-lg text-slate-300 leading-relaxed">
                                Navigate the EU's NIS2 Directive with confidence. Our platform helps you classify your entity, implement required measures, and manage incident reporting obligations.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>NIS2 Directive (EU) 2022/2555</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>Enforcement: Oct 2024</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>18 Critical Sectors</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:flex justify-center relative">
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-3xl rotate-3 hover:rotate-0 transition-transform duration-500">
                                <div className="grid grid-cols-2 gap-4">
                                    {[ShieldCheck, Activity, FileText, AlertCircle].map((Icon, i) => (
                                        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                                            <Icon className="w-8 h-8 text-cyan-400" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border border-white/10">
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full w-3/5 bg-cyan-400 rounded-full" />
                                    </div>
                                    <p className="text-[10px] mt-2 text-cyan-200 font-mono">NIS2 READINESS: 60%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="grid md:grid-cols-3 gap-8">
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

                {/* NIS2 Requirements */}
                <div className="bg-gradient-to-br from-slate-50 to-cyan-50 rounded-3xl p-12 border border-slate-200">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl font-extrabold tracking-tight">NIS2 Key Requirements</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            The NIS2 Directive introduces mandatory cybersecurity measures for essential and important entities across 18 sectors.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { title: "Risk Management", desc: "Implement appropriate security measures", icon: ShieldCheck },
                            { title: "Incident Reporting", desc: "24-hour notification to CSIRT", icon: Activity },
                            { title: "Supply Chain", desc: "Assess third-party risks", icon: Globe },
                            { title: "Governance", desc: "Management accountability", icon: ListTodo }
                        ].map((item, i) => (
                            <div key={i} className="p-6 bg-white rounded-xl border border-slate-200 text-center">
                                <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center mx-auto mb-4">
                                    <item.icon className="w-6 h-6 text-cyan-600" />
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
                        <h2 className="text-3xl font-extrabold tracking-tight">Why NIS2 Compliance Matters</h2>
                        <p className="text-muted-foreground">
                            Non-compliance can result in fines up to €10M or 2% of global turnover for essential entities.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 mt-12 text-center italic">
                        <div className="p-6">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Avoid Penalties</h3>
                            <p className="text-slate-500 text-sm">"NIS2 enforcement started October 2024. Early compliance saved us from potential multi-million euro fines."</p>
                        </div>
                        <div className="p-6 border-x border-slate-200">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Improve Security</h3>
                            <p className="text-slate-500 text-sm">"NIS2 requirements forced us to strengthen supply chain security and incident response capabilities."</p>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Market Access</h3>
                            <p className="text-slate-500 text-sm">"EU customers now require NIS2 compliance proof. It's become a competitive requirement, not just regulatory."</p>
                        </div>
                    </div>
                </div>

                {/* Quick Start */}
                <Card className="border-2 border-dashed border-cyan-300 bg-cyan-50/50">
                    <CardContent className="p-8">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-cyan-600 rounded-xl">
                                <Globe className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">New to NIS2? Start Here</h3>
                                <p className="text-muted-foreground mb-4">
                                    If you're subject to NIS2, follow this compliance path:
                                </p>
                                <ol className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-cyan-600 min-w-[20px]">1.</span>
                                        <span><strong>Determine Classification</strong> - Are you an Essential or Important entity?</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-cyan-600 min-w-[20px]">2.</span>
                                        <span><strong>Complete Assessment</strong> - Evaluate current cybersecurity measures</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-cyan-600 min-w-[20px]">3.</span>
                                        <span><strong>Implement Measures</strong> - Deploy required security controls</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-cyan-600 min-w-[20px]">4.</span>
                                        <span><strong>Setup Incident Response</strong> - Configure 24-hour reporting workflows</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-cyan-600 min-w-[20px]">5.</span>
                                        <span><strong>Register with Authority</strong> - Notify your national CSIRT</span>
                                    </li>
                                </ol>
                                <div className="mt-6">
                                    <Button
                                        onClick={() => setLocation(`/clients/${clientId}/cyber/assessment`)}
                                        className="bg-cyan-600 hover:bg-cyan-700"
                                    >
                                        Start NIS2 Assessment
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
