import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import {
    Activity,
    ArrowRight,
    CheckCircle2,
    Circle,
    Play,
    Shield,
    Lock,
    Eye,
    Zap,
    LayoutDashboard,
    ClipboardList,
    FileCheck,
    Settings,
    Info,
    Server,
    ChevronsUpDown,
    Plus
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import { useParams, Link, useLocation } from "wouter";
import NIST80037Layout from "./NIST80037Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { cn } from "@/lib/utils";
import { RMF_SYSTEMS } from './nistConstants';
import { useNistSystemId } from "./useNistSystem";

export default function NIST80037Dashboard() {
    const { id } = useParams<{ id: string }>();
    const [location, setLocation] = useLocation();
    const clientId = parseInt(id || "0");

    const activeSystemId = useNistSystemId();

    const systems = RMF_SYSTEMS;
    const currentSystem = activeSystemId ? systems.find(s => s.id === activeSystemId) || systems[0] : systems[0];

    const steps = [
        {
            number: "0",
            title: "Prepare",
            description: "Essential activities to prepare the organization to manage security and privacy risks.",
            icon: Play,
            status: currentSystem.progress >= 5 ? "completed" : "active",
            link: activeSystemId ? `/clients/${clientId}/nist/rmf/prepare?systemId=${activeSystemId}` : `/clients/${clientId}/nist/rmf/systems`
        },
        {
            number: "1",
            title: "Categorize",
            description: "Categorize the system and the information processed based on impact analysis.",
            icon: Settings,
            status: currentSystem.progress >= 20 ? "completed" : (currentSystem.progress >= 5 ? "active" : "pending"),
            link: activeSystemId ? `/clients/${clientId}/nist/rmf/categorize?systemId=${activeSystemId}` : `/clients/${clientId}/nist/rmf/systems`
        },
        {
            number: "2",
            title: "Select",
            description: "Select an initial set of controls for the system and tailor as needed.",
            icon: Shield,
            status: currentSystem.progress >= 40 ? "completed" : (currentSystem.progress >= 20 ? "active" : "pending"),
            link: activeSystemId ? `/clients/${clientId}/nist/rmf/select?systemId=${activeSystemId}` : `/clients/${clientId}/nist/rmf/systems`
        },
        {
            number: "3",
            title: "Implement",
            description: "Implement the controls and describe how they are employed within the system.",
            icon: Lock,
            status: currentSystem.progress >= 60 ? "completed" : (currentSystem.progress >= 40 ? "active" : "pending"),
            link: activeSystemId ? `/clients/${clientId}/nist/rmf/implement?systemId=${activeSystemId}` : `/clients/${clientId}/nist/rmf/systems`
        },
        {
            number: "4",
            title: "Assess",
            description: "Assess the controls to determine if they are implemented correctly and producing desired results.",
            icon: ClipboardList,
            status: currentSystem.progress >= 80 ? "completed" : (currentSystem.progress >= 60 ? "active" : "pending"),
            link: activeSystemId ? `/clients/${clientId}/nist/rmf/assess?systemId=${activeSystemId}` : `/clients/${clientId}/nist/rmf/systems`
        },
        {
            number: "5",
            title: "Authorize",
            description: "Authorize system operation based on a determination of risk to organizational operations.",
            icon: FileCheck,
            status: currentSystem.progress >= 100 ? "completed" : (currentSystem.progress >= 80 ? "active" : "pending"),
            link: activeSystemId ? `/clients/${clientId}/nist/rmf/authorize?systemId=${activeSystemId}` : `/clients/${clientId}/nist/rmf/systems`
        },
        {
            number: "6",
            title: "Monitor",
            description: "Monitor the system and associated controls on an ongoing basis.",
            icon: Eye,
            status: currentSystem.progress >= 100 ? "active" : "pending",
            link: activeSystemId ? `/clients/${clientId}/nist/rmf/monitor?systemId=${activeSystemId}` : `/clients/${clientId}/nist/rmf/systems`
        }
    ];

    return (
        <NIST80037Layout>
            <div className="space-y-8 max-w-5xl">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/dashboard` },
                        { label: "NIST Hub", href: `/clients/${clientId}/nist` },
                        { label: "SP 800-37 (RMF)" },
                    ]}
                />


                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
                            <Activity className="w-10 h-10 text-emerald-600" />
                            Risk Management Framework
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg font-medium max-w-2xl">
                            Operationalize the 7-step NIST SP 800-37 lifecycle to manage system security and privacy risks.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl h-12 px-6 shadow-lg shadow-emerald-200/50 font-bold">
                            Generate RMF Report
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/50 backdrop-blur-sm overflow-hidden border-l-4 border-l-emerald-500">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">Current Progress</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-end justify-between">
                                <span className="text-5xl font-black text-slate-900 tracking-tighter">{currentSystem.progress}<span className="text-slate-300 text-3xl font-bold ml-1">/100</span></span>
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1 font-bold">
                                    {currentSystem.progress === 100 ? "Authorization Active" : `Step ${Math.floor(currentSystem.progress / 15)} In Progress`}
                                </Badge>
                            </div>
                            <Progress value={currentSystem.progress} className="h-3 bg-slate-100" indicatorClassName="bg-emerald-500" />
                            <div className="grid grid-cols-3 gap-4 pt-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400">Total Controls</p>
                                    <p className="text-xl font-bold text-slate-900">{currentSystem.total}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400">Assessed</p>
                                    <p className="text-xl font-bold text-slate-900">{currentSystem.assessed}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400">Days to ATO</p>
                                    <p className={cn("text-xl font-bold", currentSystem.days === 0 ? "text-emerald-500" : "text-rose-500")}>
                                        {currentSystem.days === 0 ? "DONE" : currentSystem.days}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-slate-900 text-white relative overflow-hidden group">
                        <Zap className="absolute top-4 right-4 h-6 w-6 text-emerald-400 opacity-20 group-hover:opacity-100 transition-opacity" />
                        <CardHeader>
                            <CardTitle className="text-emerald-400 text-xs font-black uppercase tracking-widest">AI Readiness</CardTitle>
                            <CardDescription className="text-white/60 font-medium">System Authorization readiness is automatically calculated based on evidence and control status.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {currentSystem.ai.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                        <span className="text-sm font-medium">{item}</span>
                                    </div>
                                ))}
                                {currentSystem.progress < 100 && (
                                    <div className="flex items-center gap-3 text-white/40">
                                        <Circle className="w-5 h-5" />
                                        <span className="text-sm font-medium">Remaining Controls pending assessment</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <LayoutDashboard className="w-6 h-6 text-indigo-500" />
                        RMF Lifecycle Steps
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {steps.map((step) => (
                            <Link key={step.number} href={step.link}>
                                <div className={cn(
                                    "group p-6 rounded-[2.5rem] border transition-all duration-300 cursor-pointer h-full relative overflow-hidden",
                                    step.status === 'completed' ? "bg-emerald-50/30 border-emerald-100 hover:shadow-emerald-500/10" :
                                        step.status === 'active' ? "bg-white border-indigo-200 shadow-xl shadow-indigo-500/10 scale-[1.02]" :
                                            "bg-white border-slate-100 hover:border-slate-200 hover:shadow-lg"
                                )}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                                            step.status === 'completed' ? "bg-emerald-500 text-white" :
                                                step.status === 'active' ? "bg-indigo-600 text-white shadow-indigo-500/40" :
                                                    "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 transition-colors"
                                        )}>
                                            <step.icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-4xl font-black text-slate-100 group-hover:text-slate-200 transition-colors absolute -right-2 -top-2 scale-150 rotate-12 -z-10">{step.number}</span>
                                        {step.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 mb-2">{step.title}</h3>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-3">
                                        {step.description}
                                    </p>
                                    <div className="mt-8 flex items-center text-xs font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-600 transition-colors">
                                        Exploration {step.title}
                                        <ArrowRight className="ml-2 w-3 h-3" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </NIST80037Layout>
    );
}

