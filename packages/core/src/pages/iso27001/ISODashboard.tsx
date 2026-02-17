import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Progress } from "@complianceos/ui/ui/progress";
import { Badge } from "@complianceos/ui/ui/badge";
import { useLocation, useParams } from "wouter";
import {
    Shield,
    FileText,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    TrendingUp,
    Calendar,
    Users,
    Key,
    Lock
} from "lucide-react";

import { ISOLayout } from "./ISOLayout";

export default function ISODashboard() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [, setLocation] = useLocation();

    const modules = [
        {
            title: "Statement of Applicability",
            description: "Define your ISMS scope and Annex A control usage.",
            icon: CheckCircle2,
            path: `/clients/${clientId}/iso27001/soa`,
            progress: 78,
            status: "In Progress"
        },
        {
            title: "Risk Management",
            description: "ISO 27005 aligned risk assessment and treatment.",
            icon: Shield,
            path: `/clients/${clientId}/iso27001/risks`,
            progress: 45,
            status: "Needs Review"
        },
        {
            title: "Asset Register",
            description: "Classify and manage information assets and owners.",
            icon: Lock,
            path: `/clients/${clientId}/iso27001/assets`,
            progress: 92,
            status: "Active"
        },
        {
            title: "Internal Audit",
            description: "Plan and track ISO internal audit cycles.",
            icon: FileText,
            path: `/clients/${clientId}/iso27001/audit`,
            progress: 10,
            status: "Scheduled"
        }
    ];

    return (
        <ISOLayout clientId={clientId}>
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-12 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="space-y-4">
                            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 px-3 py-1">ISO 27001:2022 ISMS</Badge>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                                Security Management <br />
                                <span className="text-indigo-400">Command Center</span>
                            </h1>
                            <p className="text-slate-400 text-lg max-w-xl">
                                Continuous compliance monitoring for your Information Security Management System.
                            </p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl w-full md:w-80">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-medium text-slate-300">Total Readiness</span>
                                <span className="text-2xl font-bold text-indigo-400">68%</span>
                            </div>
                            <Progress value={68} className="h-2 bg-white/10" />
                            <div className="mt-4 flex gap-2">
                                <div className="flex-1 bg-white/5 rounded-lg p-3 text-center border border-white/5">
                                    <p className="text-[10px] text-slate-500 uppercase">Controls</p>
                                    <p className="font-bold text-emerald-400 text-lg">93/93</p>
                                </div>
                                <div className="flex-1 bg-white/5 rounded-lg p-3 text-center border border-white/5">
                                    <p className="text-[10px] text-slate-500 uppercase">Risks</p>
                                    <p className="font-bold text-amber-400 text-lg">12</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {modules.map((module, i) => (
                        <Card key={i} className="group hover:border-indigo-300 transition-all duration-300 shadow-sm hover:shadow-md border-slate-200">
                            <CardHeader className="space-y-1">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="p-2 bg-slate-50 rounded-lg text-slate-600 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                                        <module.icon className="h-5 w-5" />
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">{module.status}</Badge>
                                </div>
                                <CardTitle className="text-lg font-bold group-hover:text-indigo-600 transition-colors">{module.title}</CardTitle>
                                <CardDescription className="text-xs">{module.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                                        <span>Progress</span>
                                        <span>{module.progress}%</span>
                                    </div>
                                    <Progress value={module.progress} className="h-1" />
                                </div>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-between text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-2 h-auto text-sm font-bold group-hover:translate-x-1 transition-transform"
                                    onClick={() => setLocation(module.path)}
                                >
                                    Open Module <ArrowRight className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Recent Findings/Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4 mb-4">
                            <div>
                                <CardTitle className="text-xl">Compliance Timeline</CardTitle>
                                <CardDescription>Recent ISMS activities and evidence collections.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm">View All</Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[
                                { title: "Risk Treatment Updated", meta: "2 hours ago", author: "Sarah Jones", type: "Risk" },
                                { title: "Internal Audit Stage 1 Started", meta: "Yesterday", author: "Internal Auditor", type: "Audit" },
                                { title: "Evidence Collected: A.8.1", meta: "2 days ago", author: "System Task", type: "Evidence" },
                                { title: "Policy Review Completed", meta: "3 days ago", author: "Michael Chen", type: "Governance" }
                            ].map((activity, i) => (
                                <div key={i} className="flex items-start gap-4 group">
                                    <div className="mt-1 flex flex-col items-center">
                                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform shadow-[0_0_0_4px_rgba(79,70,229,0.1)]" />
                                        {i < 3 && <div className="w-px h-12 bg-slate-100 mt-1" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-xs">{activity.title}</h4>
                                            <span className="text-[10px] text-slate-400 font-medium">{activity.meta}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500">By {activity.author} • <span className="text-indigo-500 font-semibold">{activity.type}</span></p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-indigo-600 text-white shadow-xl shadow-indigo-100 overflow-hidden relative">
                        <TrendingUp className="absolute bottom-0 right-0 -mb-8 -mr-8 h-48 w-48 text-white/5 opacity-50" />
                        <CardHeader>
                            <CardTitle className="text-white">Certification Readiness</CardTitle>
                            <CardDescription className="text-indigo-100">Projected target: March 2026</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                                <h3 className="font-bold mb-3 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Next Steps
                                </h3>
                                <ul className="space-y-2 text-xs text-indigo-50">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-white rounded-full" /> Complete SoA Justifications
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-white rounded-full" /> Conduct Internal Audit
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-white rounded-full" /> Management Sign-off
                                    </li>
                                </ul>
                            </div>
                            <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-6 rounded-xl shadow-lg">
                                Run Readiness Report
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ISOLayout>
    );
}
