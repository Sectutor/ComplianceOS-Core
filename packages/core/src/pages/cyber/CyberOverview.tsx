import React from 'react';
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
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
import { PageGuide } from "@/components/PageGuide";
import { cn } from "@/lib/utils";

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
            color: "from-[#3ABEF9] to-[#1C4D8D]",
            textColor: "text-[#3ABEF9]",
            bgLight: "bg-sky-50",
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
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header / Intro */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <PageGuide
                    title="NIS2 Implementation Hub"
                    description="Step-by-step guidance on achieving compliance with the EU NIS2 Directive."
                    rationale="The NIS2 Directive (EU 2022/2555) requires a high common level of cybersecurity across the Union."
                    howToUse={[
                        {
                            step: "Classify Status",
                            description: "Determine if you are an Essential or Important entity based on sector and size.",
                            targetId: "nis2-assessment-card"
                        },
                        {
                            step: "Implementation",
                            description: "Follow the 4-step implementation journey to close security gaps.",
                            targetId: "nis2-journey-button"
                        },
                        {
                            step: "Reporting Rules",
                            description: "Configure incident management for the mandatory 24-hour reporting window.",
                            targetId: "nis2-incident-card"
                        }
                    ]}
                    scenarios={[
                        {
                            title: "Pre-Deadline Compliance Internal Audit",
                            example: "The board wants to know if the organization is ready for the October 2024 NIS2 deadline.",
                            auditTip: "Use the 'Documentation' module to ensure all 10 minimum security measures required by Art. 21 are mapped to internal policies."
                        },
                        {
                            title: "24-Hour Notification Drill",
                            example: "The security team wants to test the incident notification workflow without notifying the actual CSIRT.",
                            auditTip: "Run a 'Mock Incident' in the Incident Management module. Document the timestamp of discovery vs simulated notification to prove compliance with Art. 23."
                        }
                    ]}
                />
            </div>

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#1C4D8D] p-12 md:p-20 text-white shadow-2xl shadow-sky-900/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-[#3ABEF9]/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />

                <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center space-x-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
                            <Globe className="w-4 h-4 text-[#3ABEF9]" />
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-sky-100">EU REGULATORY COMPLIANCE</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
                            The NIS2 <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3ABEF9] via-[#3ABEF9] to-emerald-400">
                                Directive.
                            </span>
                        </h1>
                        <p className="text-xl text-sky-100/70 leading-relaxed font-medium max-w-lg">
                            Navigate the complex landscape of EU cybersecurity regulation with integrated workflows and expert guidance.
                        </p>
                        <div className="flex flex-wrap gap-6 pt-4">
                            {[
                                { label: "Deadlines: Oct 2024", icon: AlertCircle },
                                { label: "Fines: Up to €10M", icon: AlertCircle },
                                { label: "18 Critical Sectors", icon: CheckCircle2 },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center space-x-2 text-sm font-bold text-sky-100/60 uppercase tracking-wider">
                                    <item.icon className="w-4 h-4 text-[#3ABEF9]" />
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="hidden lg:flex justify-center relative">
                        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-3xl rotate-3 hover:rotate-0 transition-all duration-700 group cursor-default">
                            <div className="grid md:grid-cols-2 gap-4">
                                {[
                                    { title: "Risk Management", desc: "Technical Measures", icon: ShieldCheck },
                                    { title: "Incident Reporting", desc: "24h Notification", icon: Activity },
                                    { title: "Supply Chain", desc: "Vendor Security", icon: Globe },
                                    { title: "Governance", desc: "Accountability", icon: ListTodo }
                                ].map((item, i) => (
                                    <div key={i} className="p-6 bg-white/10 rounded-2xl border border-white/10 text-center group-hover:bg-[#3ABEF9]/20 transition-colors">
                                        <item.icon className="w-8 h-8 text-[#3ABEF9] mx-auto mb-3" />
                                        <h3 className="font-black text-sm text-white mb-1">{item.title}</h3>
                                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-3 gap-8">
                {sections.map((section, idx) => (
                    <Card key={idx} className="group overflow-hidden border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white ring-1 ring-slate-200/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-sky-900/5">
                        <CardContent className="p-0" id={idx === 0 ? "nis2-assessment-card" : idx === 1 ? "nis2-incident-card" : "nis2-documentation-card"}>
                            <div className={`h-2 bg-gradient-to-r ${section.color}`} />
                            <div className="p-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`h-16 w-16 rounded-2xl ${section.bgLight} ${section.textColor} flex items-center justify-center shadow-inner`}>
                                        <section.icon className="w-8 h-8" />
                                    </div>
                                    <Badge variant="outline" className="font-black text-[10px] tracking-widest text-slate-400 uppercase border-slate-200 px-3 py-1 rounded-full">
                                        {section.headerTitle}
                                    </Badge>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-4">{section.title}</h2>
                                <p className="text-slate-500 mb-8 leading-relaxed font-medium text-sm">
                                    {section.description}
                                </p>
                                <div className="space-y-4 mb-10">
                                    {section.benefits.map((benefit, bIdx) => (
                                        <div key={bIdx} className="flex items-center text-xs font-bold text-slate-700 uppercase tracking-tight">
                                            <div className={cn("w-1.5 h-1.5 rounded-full mr-3 bg-gradient-to-r", section.color)} />
                                            {benefit}
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    onClick={() => setLocation(section.path)}
                                    className={cn(
                                        "w-full bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-900 font-bold py-6 rounded-2xl border border-slate-200 transition-all duration-300 flex items-center justify-between px-6"
                                    )}
                                >
                                    <span>Access Module</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Start Guide */}
            <Card className="border-none shadow-xl border-dashed border-sky-300 bg-sky-50 shadow-slate-200/50 rounded-[3rem] overflow-hidden">
                <CardContent className="p-12 md:p-16">
                    <div className="grid lg:grid-cols-2 gap-16">
                        <div className="space-y-8">
                            <div className="h-16 w-16 bg-[#3ABEF9] rounded-3xl flex items-center justify-center text-white shadow-lg shadow-sky-200">
                                <Globe className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-[#1C4D8D] mb-4">New to NIS2?</h3>
                                <p className="text-slate-600 text-lg font-medium leading-relaxed">
                                    If your organization is subject to NIS2, follow this standardized compliance trajectory to avoid sanctions and ensure business continuity.
                                </p>
                            </div>
                            <Button
                                id="nis2-journey-button"
                                onClick={() => setLocation(`/clients/${clientId}/cyber/assessment`)}
                                className="bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white font-bold h-14 px-10 rounded-2xl shadow-lg shadow-sky-200 transition-all active:scale-95"
                            >
                                Start Implementation Journey <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                        <div className="bg-white/50 backdrop-blur-sm rounded-[2.5rem] p-10 space-y-6 ring-1 ring-sky-100">
                            {[
                                { step: "01", title: "Determine Classification", desc: "Essential vs Important entity status." },
                                { step: "02", title: "Complete Assessment", desc: "Audit current security maturity levels." },
                                { step: "03", title: "Implement Measures", desc: "Deploy required technical controls." },
                                { step: "04", title: "Formalize Reporting", desc: "Configure 24-hour notification workflows." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-6 items-start">
                                    <div className="text-2xl font-black text-[#3ABEF9] opacity-30 mt-1">{item.step}</div>
                                    <div>
                                        <h4 className="font-black text-slate-900 uppercase tracking-wider">{item.title}</h4>
                                        <p className="text-slate-500 font-medium text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Why it Matters Section - Consistency */}
            <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-12 md:p-20 text-white mt-8 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(58,190,249,0.1),transparent)]" />
                <div className="relative z-10 text-center max-w-3xl mx-auto space-y-6">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">Beyond Compliance: <br /><span className="text-[#3ABEF9]">Systemic Integrity.</span></h2>
                    <p className="text-slate-400 text-lg font-medium leading-relaxed">
                        Cyber resilience is not just a regulatory hurdle; it's the foundation of trust in the digital age. Compliance ensures your organization remains a strong link in the global supply chain.
                    </p>

                    <div className="grid md:grid-cols-3 gap-12 mt-16 text-left border-t border-white/10 pt-16">
                        {[
                            { title: "Sanctions", desc: "Avoid fines of up to €10M or 2% of annual turnover." },
                            { title: "Security", desc: "Stronger supply chain and incident response capabilities." },
                            { title: "Market", desc: "Meet the growing customer demand for compliance proof." }
                        ].map((item, i) => (
                            <div key={i} className="space-y-3">
                                <div className="h-1 w-12 bg-[#3ABEF9] rounded-full" />
                                <h3 className="font-black text-xl">{item.title}</h3>
                                <p className="text-slate-500 text-sm font-medium italic">"{item.desc}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
