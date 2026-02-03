
import React from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import {
    Shield,
    Database,
    FileText,
    Activity,
    Users,
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock,
    Zap
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function BusinessContinuityOverview() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [, setLocation] = useLocation();

    const sections = [
        {
            title: "Business Processes",
            headerTitle: "Critical Function Mapping",
            description: "Identify and document all critical business processes, their dependencies, and resource requirements for continuity planning.",
            icon: Database,
            color: "from-blue-500 to-cyan-400",
            textColor: "text-blue-600",
            bgLight: "bg-blue-50",
            path: `/clients/${clientId}/business-continuity/processes`,
            benefits: [
                "Process dependency mapping",
                "Resource identification",
                "Recovery priority ranking"
            ]
        },
        {
            title: "Business Impact Analysis",
            headerTitle: "RTO & RPO Definition",
            description: "Assess the impact of disruptions to determine Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO) for each process.",
            icon: FileText,
            color: "from-purple-600 to-indigo-500",
            textColor: "text-purple-600",
            bgLight: "bg-purple-50",
            path: `/clients/${clientId}/business-continuity/bia`,
            benefits: [
                "Financial impact analysis",
                "RTO/RPO calculations",
                "Maximum tolerable downtime"
            ]
        },
        {
            title: "Recovery Strategies",
            headerTitle: "Continuity Solutions",
            description: "Define recovery strategies for critical processes including alternate sites, backup systems, and workaround procedures.",
            icon: Shield,
            color: "from-emerald-500 to-teal-400",
            textColor: "text-emerald-600",
            bgLight: "bg-emerald-50",
            path: `/clients/${clientId}/business-continuity/strategies`,
            benefits: [
                "Hot/warm/cold site planning",
                "Technology recovery options",
                "Manual workaround procedures"
            ]
        },
        {
            title: "Recovery Plans",
            headerTitle: "Detailed Procedures",
            description: "Document step-by-step recovery procedures, roles, and responsibilities for restoring critical business operations.",
            icon: FileText,
            color: "from-orange-500 to-red-400",
            textColor: "text-orange-600",
            bgLight: "bg-orange-50",
            path: `/clients/${clientId}/business-continuity/plans`,
            benefits: [
                "Step-by-step procedures",
                "Role assignments",
                "Contact information"
            ]
        },
        {
            title: "Disruptive Scenarios",
            headerTitle: "Threat Modeling",
            description: "Identify potential disruption scenarios (natural disasters, cyber attacks, pandemics) and plan appropriate responses.",
            icon: AlertTriangle,
            color: "from-rose-500 to-pink-400",
            textColor: "text-rose-600",
            bgLight: "bg-rose-50",
            path: `/clients/${clientId}/business-continuity/scenarios`,
            benefits: [
                "Scenario-based planning",
                "Tabletop exercise templates",
                "Response playbooks"
            ]
        },
        {
            title: "Call Tree",
            headerTitle: "Emergency Communications",
            description: "Maintain emergency contact hierarchies and communication protocols for incident response and business continuity activation.",
            icon: Users,
            color: "from-indigo-500 to-blue-400",
            textColor: "text-indigo-600",
            bgLight: "bg-indigo-50",
            path: `/clients/${clientId}/business-continuity/call-tree`,
            benefits: [
                "Escalation hierarchies",
                "Contact verification",
                "Notification templates"
            ]
        }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-10 pb-20 px-6">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Business Continuity", href: `/clients/${clientId}/business-continuity` },
                        { label: "Overview & Guidance" },
                    ]}
                />

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-16 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />

                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                <Activity className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Resilience Planning</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                                Business <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                                    Continuity
                                </span>
                            </h1>
                            <p className="text-lg text-slate-300 leading-relaxed">
                                Ensure your organization can withstand and recover from disruptions. Our ISO 22301-aligned platform helps you build resilience through structured BIA, recovery strategies, and testing.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>ISO 22301 Aligned</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>NIST SP 800-34</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>BCI Good Practice</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:flex justify-center relative">
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-3xl rotate-3 hover:rotate-0 transition-transform duration-500">
                                <div className="grid grid-cols-2 gap-4">
                                    {[Database, Shield, AlertTriangle, Users].map((Icon, i) => (
                                        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                                            <Icon className="w-8 h-8 text-emerald-400" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl border border-white/10">
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full w-4/5 bg-emerald-400 rounded-full" />
                                    </div>
                                    <p className="text-[10px] mt-2 text-emerald-200 font-mono">BC READINESS: 80%</p>
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

                {/* BC/DR Lifecycle */}
                <div className="bg-gradient-to-br from-slate-50 to-emerald-50 rounded-3xl p-12 border border-slate-200">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl font-extrabold tracking-tight">BC/DR Lifecycle</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Build organizational resilience through a structured approach to business continuity and disaster recovery planning.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-5 gap-6 relative">
                        <div className="hidden md:block absolute top-8 left-12 right-12 h-0.5 bg-gradient-to-r from-blue-300 via-emerald-300 to-orange-300" />

                        {[
                            { step: "1", title: "Analyze", desc: "BIA & dependencies", icon: Database, color: "text-blue-600", bg: "bg-blue-100" },
                            { step: "2", title: "Strategize", desc: "Recovery options", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-100" },
                            { step: "3", title: "Plan", desc: "Document procedures", icon: FileText, color: "text-purple-600", bg: "bg-purple-100" },
                            { step: "4", title: "Test", desc: "Exercises & drills", icon: Zap, color: "text-orange-600", bg: "bg-orange-100" },
                            { step: "5", title: "Maintain", desc: "Review & update", icon: Activity, color: "text-indigo-600", bg: "bg-indigo-100" }
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
                        <h2 className="text-3xl font-extrabold tracking-tight">Why Business Continuity Matters</h2>
                        <p className="text-muted-foreground">
                            Organizations without BC/DR plans face 40% higher downtime costs and 60% longer recovery times during incidents.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 mt-12 text-center italic">
                        <div className="p-6">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Minimize Downtime</h3>
                            <p className="text-slate-500 text-sm">"Our BCP reduced recovery time from 72 hours to 4 hours, saving $2M in lost revenue during a datacenter outage."</p>
                        </div>
                        <div className="p-6 border-x border-slate-200">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Meet Requirements</h3>
                            <p className="text-slate-500 text-sm">"ISO 22301 certification opened doors to enterprise contracts that require proven business continuity capabilities."</p>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-slate-900 not-italic mb-2 text-lg">Protect Reputation</h3>
                            <p className="text-slate-500 text-sm">"When competitors went dark during the pandemic, our BC plan kept us operational and won customer trust."</p>
                        </div>
                    </div>
                </div>

                {/* Quick Start */}
                <Card className="border-2 border-dashed border-emerald-300 bg-emerald-50/50">
                    <CardContent className="p-8">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-emerald-600 rounded-xl">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">New to Business Continuity? Start Here</h3>
                                <p className="text-muted-foreground mb-4">
                                    If you're building your BC/DR program from scratch, follow this path:
                                </p>
                                <ol className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-emerald-600 min-w-[20px]">1.</span>
                                        <span><strong>Map Business Processes</strong> - Identify critical functions and dependencies</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-emerald-600 min-w-[20px]">2.</span>
                                        <span><strong>Conduct BIA</strong> - Determine RTO/RPO for each critical process</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-emerald-600 min-w-[20px]">3.</span>
                                        <span><strong>Define Strategies</strong> - Select recovery options (hot site, backup systems, etc.)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-emerald-600 min-w-[20px]">4.</span>
                                        <span><strong>Document Plans</strong> - Write step-by-step recovery procedures</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-emerald-600 min-w-[20px]">5.</span>
                                        <span><strong>Test Annually</strong> - Run tabletop exercises and update plans</span>
                                    </li>
                                </ol>
                                <div className="mt-6">
                                    <Button
                                        onClick={() => setLocation(`/clients/${clientId}/business-continuity/processes`)}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        Start with Process Mapping
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
