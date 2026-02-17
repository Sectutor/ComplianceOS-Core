
import React, { useState } from 'react';
import { useParams } from "wouter";
import NIST80030Layout from "./NIST80030Layout";
import {
    ShieldAlert,
    Skull,
    CloudLightning,
    Activity,
    Search,
    Plus,
    AlertTriangle,
    Globe,
    Cpu,
    Zap,
    ArrowRight,
    Save,
    Users,
    Ghost,
    ZapOff,
    MonitorOff,
    Lock,
    Eye,
    History,
    FileCheck,
    Briefcase,
    Target,
    Network
} from "lucide-react";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Badge } from "@complianceos/ui/ui/badge";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Progress } from "@complianceos/ui/ui/progress";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NIST80030ThreatModeling() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Threat Profile Saved", {
                description: "Threat sources and events have been updated in the risk assessment.",
            });
        }, 1500);
    };

    const threatSources = [
        { type: "Adversarial", icon: Skull, count: 8, color: "rose" },
        { type: "Accidental", icon: Ghost, count: 12, color: "amber" },
        { type: "Structural", icon: ZapOff, count: 5, color: "indigo" },
        { type: "Environmental", icon: CloudLightning, count: 3, color: "emerald" }
    ];

    return (
        <NIST80030Layout>
            <div className="space-y-8 max-w-5xl pb-20">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/dashboard` },
                        { label: "NIST Hub", href: `/clients/${clientId}/nist` },
                        { label: "SP 800-30", href: `/clients/${clientId}/nist/800-30` },
                        { label: "Threat Modeling" },
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-rose-600 text-white font-black px-3 tracking-widest uppercase text-[10px]">Step 2</Badge>
                            <Badge variant="outline" className="border-rose-200 text-rose-700 font-bold uppercase tracking-widest text-[10px]">Threat Profiling</Badge>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
                            <ShieldAlert className="w-10 h-10 text-rose-600" />
                            Threat Modeling
                        </h1>
                        <p className="text-slate-500 text-lg font-medium max-w-3xl leading-relaxed">
                            Identify and characterize threat sources and events that could adversely impact organizational operations and assets.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" className="rounded-2xl h-14 px-6 font-bold border-2 border-slate-100 hover:bg-slate-50 text-slate-600 gap-2">
                            Threat Library
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-rose-600 hover:bg-rose-700 rounded-2xl h-14 px-8 shadow-xl shadow-rose-200/50 font-black text-lg gap-2"
                        >
                            {isSaving ? "Saving..." : <><Save className="w-5 h-5" /> Save Analysis</>}
                        </Button>
                    </div>
                </div>

                {/* Threat Source Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {threatSources.map((source, i) => (
                        <Card key={i} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden group cursor-pointer hover:shadow-xl transition-all">
                            <CardContent className="p-8">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110",
                                    source.color === 'rose' ? "bg-rose-50 text-rose-600" :
                                        source.color === 'amber' ? "bg-amber-50 text-amber-600" :
                                            source.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                                                "bg-emerald-50 text-emerald-600"
                                )}>
                                    <source.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">{source.type}</h3>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{source.count} Profiles Active</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Intelligence & Sources */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-slate-900 text-white overflow-hidden relative">
                            <CardHeader className="relative z-10 pb-2">
                                <CardTitle className="text-rose-400 text-xs font-black uppercase tracking-widest">Adversarial Intelligence</CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10 space-y-6">
                                <div className="space-y-4">
                                    {[
                                        { actor: "APT-28 / Fancy Bear", capability: "Advanced", motive: "Espionage" },
                                        { actor: "Nation State: East Asia", capability: "Moderate", motive: "IP Theft" },
                                        { actor: "Hacktivist Collective", capability: "Low", motive: "Disruption" }
                                    ].map((actor, i) => (
                                        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-sm">{actor.actor}</span>
                                                <Badge className="bg-rose-500/20 text-rose-400 border-none font-black text-[10px]">{actor.capability}</Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                <Target className="w-3 h-3" /> Motive: {actor.motive}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button className="w-full bg-rose-600 hover:bg-rose-700 font-bold h-12 rounded-xl">
                                    Refresh Intelligence
                                </Button>
                            </CardContent>
                            <Skull className="absolute -bottom-10 -left-10 w-48 h-48 text-white/5 -rotate-12" />
                        </Card>

                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white">
                            <CardHeader>
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Threat Event Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                    <span className="text-sm font-bold text-slate-600">Total Scenarios</span>
                                    <Badge variant="secondary" className="font-black bg-white">24</Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                    <span className="text-sm font-bold text-slate-600">High Likelihood</span>
                                    <Badge variant="secondary" className="font-black bg-rose-50 text-rose-600">6</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Scenarios & Events */}
                    <Card className="lg:col-span-2 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[2.5rem] overflow-hidden">
                        <Tabs defaultValue="events" className="w-full">
                            <div className="border-b px-8 bg-slate-50/50">
                                <TabsList className="h-16 bg-transparent gap-8">
                                    <TabsTrigger value="events" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-rose-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        Threat Events
                                    </TabsTrigger>
                                    <TabsTrigger value="scenarios" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-rose-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        Threat Scenarios
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="h-[600px]">
                                <TabsContent value="events" className="p-10 space-y-8 m-0">
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight tracking-tight">Identify Threat Events (T-2)</h3>
                                            <p className="text-sm text-slate-500 font-medium">Characterize potential threat events based on the identified sources.</p>
                                        </div>
                                        <Button className="bg-rose-600 hover:bg-rose-700 rounded-xl font-bold h-10 px-4 gap-2">
                                            <Plus className="w-4 h-4" /> Add Event
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { id: "TE-01", event: "SQL Injection on Public API", source: "Adversarial", relevance: "Confirmed", likelihood: "High" },
                                            { id: "TE-02", event: "Unauthorized Access via Phishing", source: "Adversarial", relevance: "Confirmed", likelihood: "Moderate" },
                                            { id: "TE-03", event: "Admin Error in DB Configuration", source: "Accidental", relevance: "Potential", likelihood: "Low" },
                                            { id: "TE-04", event: "Regional Power Grid Failure", source: "Environmental", relevance: "Potential", likelihood: "Low" }
                                        ].map((te, i) => (
                                            <div key={i} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] flex items-center justify-between hover:shadow-lg transition-all group">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-rose-600 group-hover:text-white transition-all">
                                                        <span className="font-black text-xs uppercase">{te.id.split('-')[1]}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-black text-slate-900 leading-tight">{te.event}</h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <Badge variant="outline" className="text-[9px] font-black tracking-widest border-slate-100">{te.source}</Badge>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{te.relevance}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Likelihood</p>
                                                        <p className={cn(
                                                            "font-black text-xs",
                                                            te.likelihood === 'High' ? "text-rose-500" :
                                                                te.likelihood === 'Moderate' ? "text-amber-500" : "text-emerald-500"
                                                        )}>{te.likelihood}</p>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-slate-200 hover:text-rose-600">
                                                        <ArrowRight className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="scenarios" className="p-10 space-y-10 m-0">
                                    <div className="p-10 bg-indigo-900 rounded-[3.5rem] text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
                                        <div className="relative z-10 w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center border border-white/20">
                                            <Network className="w-12 h-12 text-indigo-400" />
                                        </div>
                                        <div className="relative z-10 space-y-4">
                                            <h3 className="text-3xl font-black tracking-tighter uppercase italic">Threat Scenario Builder</h3>
                                            <p className="text-indigo-200 font-medium max-w-xl text-lg leading-relaxed">
                                                Build complex scenarios by linking threat sources, events, and target assets to determine likelihood of initiation.
                                            </p>
                                            <Button className="bg-white text-indigo-900 hover:bg-slate-100 rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs">
                                                Launch Scenario Editor
                                            </Button>
                                        </div>
                                        <MonitorOff className="absolute -bottom-20 -right-20 w-80 h-80 text-white/5 rotate-12" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <Card className="bg-slate-50 border-none rounded-[3rem] p-8 space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-indigo-100 text-indigo-500 shadow-sm">
                                                    <Zap className="w-6 h-6" />
                                                </div>
                                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">AI Scenario Generation</h4>
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium font-serif leading-relaxed italic">
                                                "Analyzed your cloud asset inventory. Generating 4 potential attack paths based on misconfigured S3 permissions and exposed API keys."
                                            </p>
                                            <Button className="w-full bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-100 rounded-xl h-12 font-bold text-xs uppercase tracking-widest">
                                                Review Predicted Paths
                                            </Button>
                                        </Card>

                                        <Card className="bg-slate-50 border-none rounded-[3rem] p-8 space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-rose-100 text-rose-500 shadow-sm">
                                                    <Skull className="w-6 h-6" />
                                                </div>
                                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Actor Mapping</h4>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-slate-500">MAPPED SCENARIOS</span>
                                                    <span className="font-black text-slate-900">14</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-slate-500">UNIDENTIFIED SOURCES</span>
                                                    <span className="font-black text-rose-600">3</span>
                                                </div>
                                                <Progress value={80} className="h-1 bg-white" indicatorClassName="bg-rose-500" />
                                            </div>
                                        </Card>
                                    </div>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>
                    </Card>
                </div>
            </div>
        </NIST80030Layout>
    );
}

