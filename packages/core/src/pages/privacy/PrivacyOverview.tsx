
import React from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import {
    Shield,
    FileText,
    Globe,
    AlertTriangle,
    Scale,
    Database,
    ArrowRight,
    CheckCircle2,
    Lock,
    Zap,
    Users,
    Activity
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function PrivacyOverview() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [, setLocation] = useLocation();

    const sections = [
        {
            title: "ROPA & Data Inventory",
            headerTitle: "Article 30 Compliance",
            description: "The blueprint of your entire privacy program. Track what data you collect, where it goes, and why you have it.",
            icon: Database,
            color: "from-blue-500 to-cyan-400",
            textColor: "text-blue-600",
            bgLight: "bg-blue-50",
            path: `/clients/${clientId}/privacy/ropa`,
            benefits: [
                "Full visibility into data silos",
                "Automated Article 30 report generation",
                "Visual data flow mapping"
            ]
        },
        {
            title: "DPI Assessment (DPIA)",
            headerTitle: "Article 35 Risk Management",
            description: "Proactively identify and mitigate privacy risks for high-impact processing operations using our guided EDPB framework.",
            icon: Scale,
            color: "from-purple-600 to-indigo-500",
            textColor: "text-purple-600",
            bgLight: "bg-purple-50",
            path: `/clients/${clientId}/privacy/dpia`,
            benefits: [
                "Guided risk identification wizard",
                "Mitigation tracking & workflow",
                "Privacy-by-Design documentation"
            ]
        },
        {
            title: "International Transfers",
            headerTitle: "Schrems II & Chapter V",
            description: "Manage cross-border data flows with integrated adequacy checks and automated Transfer Impact Assessments (TIA).",
            icon: Globe,
            color: "from-emerald-500 to-teal-400",
            textColor: "text-emerald-600",
            bgLight: "bg-emerald-50",
            path: `/clients/${clientId}/privacy/transfers`,
            benefits: [
                "Live country adequacy tracking",
                "6-Step TIA methodology execution",
                "Supplementary measure validation"
            ]
        },
        {
            title: "Data Breach Register",
            headerTitle: "Rapid Incident Response",
            description: "Centralized logging for incidents with automated risk scoring and 72-hour notification clock management.",
            icon: AlertTriangle,
            color: "from-rose-500 to-orange-400",
            textColor: "text-rose-600",
            bgLight: "bg-rose-50",
            path: `/clients/${clientId}/privacy/breaches`,
            benefits: [
                "Notification requirement analysis",
                "Internal accountability logs",
                "Post-mortem documentation"
            ]
        }
    ];

    return (
        <div className="space-y-10 pb-20">
            <Breadcrumb
                items={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Privacy Hub", href: `/clients/${clientId}/privacy` },
                    { label: "Overview & Guidance" },
                ]}
            />

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-16 text-white shadow-2xl">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />

                <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                            <Shield className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-cyan-100">Privacy Masterclass</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                            Integrated <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                                Privacy Governance
                            </span>
                        </h1>
                        <p className="text-lg text-slate-300 leading-relaxed">
                            Managing global privacy compliance isn't just about checkboxes—its about accountability.
                            Our suite unifies ROPA, Risk, Transfers, and Breaches into a single interactive ecosystem.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <div className="flex items-center space-x-2 text-sm text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>GDPR Ready</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>ISO 27701 Aligned</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Schrems II Validated</span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:flex justify-center relative">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-3xl rotate-3 hover:rotate-0 transition-transform duration-500">
                            <div className="grid grid-cols-2 gap-4">
                                {[Lock, Activity, Users, Zap].map((Icon, i) => (
                                    <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                                        <Icon className="w-8 h-8 text-cyan-400" />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-xl border border-white/10">
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-3/4 bg-cyan-400 rounded-full" />
                                </div>
                                <p className="text-[10px] mt-2 text-cyan-200 font-mono">ENCRYPTION ENGINE ACTIVE</p>
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

            {/* Why it Matters Section */}
            <div className="bg-slate-50 rounded-3xl p-12 mt-12 border border-slate-200 border-dashed">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-extrabold tracking-tight">Why Governance Matters</h2>
                    <p className="text-muted-foreground">
                        Privacy isn't just a legal cost—it's a competitive advantage that builds brand equity and technical resilience.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 mt-12 text-center italic">
                    <div className="p-6">
                        <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Build Trust</h3>
                        <p className="text-slate-500 text-sm">"Our partners expect us to handle their data with the highest care. Transparency is the only currency."</p>
                    </div>
                    <div className="p-6 border-x border-slate-200">
                        <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Mitigate Fines</h3>
                        <p className="text-slate-500 text-sm">"The ability to produce a ROPA or DPIA within minutes during a DPA request can save millions in non-compliance penalties."</p>
                    </div>
                    <div className="p-6">
                        <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Scale Global</h3>
                        <p className="text-slate-500 text-sm">"Using integrated TIAs allows us to open new markets in minutes without being stuck in 6-month legal reviews."</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Badge({ children, variant, className }: any) {
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${className} border`}>
            {children}
        </span>
    );
}
