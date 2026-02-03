
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Rocket, Zap, Database, ShieldCheck, ArrowRight, Play, Shield, AlertTriangle, Lock, Globe, Activity, Users, Briefcase, ShieldAlert, Building2, ClipboardCheck } from "lucide-react";
import { WORKFLOWS } from "@/lib/workflows/rmf-step-data";

export default function WorkflowsHub() {
    const params = useParams();
    const clientId = Number(params.id);

    const workflowIcons: Record<string, any> = {
        "nist-rmf": ShieldCheck,
        "iso-27001": Shield,
        "iso-27005": AlertTriangle,
        "gdpr": Lock,
        "nis2": Globe,
        "soc-2": ClipboardCheck,
        "tprm": Users,
        "bcp": Briefcase,
        "hipaa": ShieldAlert,
        "cmmc": Building2,
        "incident-response": Activity,
        "data-security": Database,
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8 w-full">
                <Breadcrumb items={[
                    { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                    { label: "Workflows & Playbooks" }
                ]} />

                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                            <Rocket className="h-10 w-10 text-blue-600" />
                            Workflows Hub
                        </h1>
                        <p className="text-slate-500 text-lg">Guided lifecycles to master compliance and security operations.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Object.values(WORKFLOWS).map((wf) => {
                        const Icon = workflowIcons[wf.id] || Zap;
                        const isPlaceholder = wf.steps.length < 2;

                        return (
                            <Card key={wf.id} className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-slate-200 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Icon size={120} />
                                </div>
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        {isPlaceholder ? (
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-500">Coming Soon</Badge>
                                        ) : (
                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Available</Badge>
                                        )}
                                    </div>
                                    <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors">{wf.title}</CardTitle>
                                    <CardDescription className="line-clamp-2 mt-2">{wf.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                    {i}
                                                </div>
                                            ))}
                                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                +{wf.steps.length - 4 > 0 ? wf.steps.length - 4 : 3}
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{wf.steps.length} Phases</span>
                                    </div>

                                    <Link href={`/clients/${clientId}/workflows/${wf.id}`}>
                                        <Button
                                            className="w-full bg-slate-900 group-hover:bg-blue-600 font-bold gap-2 h-12 transition-all"
                                            disabled={isPlaceholder}
                                        >
                                            {isPlaceholder ? "View Roadmap" : "Start Playbook"}
                                            <Play className="h-4 w-4 fill-current" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}
