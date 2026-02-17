
import React, { useState } from 'react';
import { useParams } from "wouter";
import NIST80030Layout from "./NIST80030Layout";
import {
    BarChart3,
    Scale,
    Zap,
    AlertTriangle,
    Target,
    Shield,
    Eye,
    Activity,
    Building2,
    Users,
    Globe,
    TrendingUp,
    Save,
    ArrowRight,
    FileText,
    Lock,
    EarOff,
    RotateCcw,
    Database,
    Network,
    HardDrive,
    Landmark
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

export default function NIST80030ImpactAnalysis() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Impact Analysis Saved", {
                description: "Magnitude of harm and impact factors have been updated.",
            });
        }, 1500);
    };

    const impactCategories = [
        { label: "Confidentiality", val: 85, color: "bg-indigo-500", icon: Lock },
        { label: "Integrity", val: 92, color: "bg-emerald-500", icon: Shield },
        { label: "Availability", val: 65, color: "bg-amber-500", icon: Activity }
    ];

    return (
        <NIST80030Layout>
            <div className="space-y-8 max-w-5xl pb-20">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/dashboard` },
                        { label: "NIST Hub", href: `/clients/${clientId}/nist` },
                        { label: "SP 800-30", href: `/clients/${clientId}/nist/800-30` },
                        { label: "Impact Analysis" },
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-600 text-white font-black px-3 tracking-widest uppercase text-[10px]">Step 3</Badge>
                            <Badge variant="outline" className="border-indigo-200 text-indigo-700 font-bold uppercase tracking-widest text-[10px]">Harm Determination</Badge>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
                            <BarChart3 className="w-10 h-10 text-indigo-600" />
                            Impact Analysis
                        </h1>
                        <p className="text-slate-500 text-lg font-medium max-w-3xl leading-relaxed">
                            Determine the magnitude of harm that could result from the unauthorized disclosure, modification, or destruction of information.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" className="rounded-2xl h-14 px-6 font-bold border-2 border-slate-100 hover:bg-slate-50 text-slate-600 gap-2">
                            Impact Criteria
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 px-8 shadow-xl shadow-indigo-200/50 font-black text-lg gap-2"
                        >
                            {isSaving ? "Saving..." : <><Save className="w-5 h-5" /> Save Analysis</>}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* CIA Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Impact Summary (CIA)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-4">
                                {impactCategories.map((cat, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <cat.icon className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-black text-slate-700">{cat.label}</span>
                                            </div>
                                            <Badge variant="secondary" className="font-black text-[10px]">{cat.val > 80 ? "Critical" : cat.val > 60 ? "High" : "Moderate"}</Badge>
                                        </div>
                                        <Progress value={cat.val} className="h-1.5 bg-slate-100" indicatorClassName={cat.color} />
                                    </div>
                                ))}
                                <div className="pt-6 border-t">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Affected Entities</p>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge className="bg-slate-900 text-white rounded-lg">Assets</Badge>
                                        <Badge className="bg-slate-900 text-white rounded-lg">Operations</Badge>
                                        <Badge className="bg-slate-100 text-slate-600 border-none rounded-lg">Individuals</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-indigo-900 text-white overflow-hidden relative">
                            <CardHeader>
                                <CardTitle className="text-indigo-400 text-xs font-black uppercase tracking-widest">Economic Harm Predictor</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 relative z-10">
                                <div className="text-center py-4">
                                    <p className="text-4xl font-black tracking-tighter">$2.4M</p>
                                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em] mt-1">Est. Daily Impact</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-indigo-300">Revenue Loss</span>
                                        <span className="font-bold">65%</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-indigo-300">Legal/Fines</span>
                                        <span className="font-bold">25%</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-indigo-300">Brand Equity</span>
                                        <span className="font-bold">10%</span>
                                    </div>
                                </div>
                            </CardContent>
                            <Zap className="absolute -bottom-10 -left-10 w-48 h-48 text-white/5 -rotate-12" />
                        </Card>
                    </div>

                    <Card className="lg:col-span-3 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[2.5rem] overflow-hidden">
                        <Tabs defaultValue="magnitude" className="w-full">
                            <div className="border-b px-8 bg-slate-50/50">
                                <TabsList className="h-16 bg-transparent gap-8">
                                    <TabsTrigger value="magnitude" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        Magnitude of Harm
                                    </TabsTrigger>
                                    <TabsTrigger value="factors" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        Impact Factors
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="h-[650px]">
                                <TabsContent value="magnitude" className="p-10 space-y-12 m-0">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Impact Determination (T-3)</h3>
                                        <p className="text-sm text-slate-500 font-medium">Assessing the overall magnitude of harm across multiple domains.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {[
                                            { domain: "Business Operations", icon: Building2, magnitude: "High", desc: "Significant degradation in mission capability.", color: "text-amber-500", bg: "bg-amber-50" },
                                            { domain: "Corporate Assets", icon: HardDrive, magnitude: "Critical", desc: "Total loss or compromise of primary data center.", color: "text-rose-500", bg: "bg-rose-50" },
                                            { domain: "Personnel Safety", icon: Users, magnitude: "Low", desc: "Minor inconvenience to staff, no safety risk.", color: "text-emerald-500", bg: "bg-emerald-50" },
                                            { domain: "National Interests", icon: Globe, magnitude: "Moderate", desc: "Potential impact on regional infrastructure.", color: "text-indigo-500", bg: "bg-indigo-50" }
                                        ].map((item, i) => (
                                            <div key={i} className="p-8 bg-white border border-slate-100 rounded-[3rem] space-y-6 hover:shadow-xl transition-all group relative overflow-hidden">
                                                <div className="flex items-center justify-between relative z-10">
                                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", item.bg, item.color)}>
                                                        <item.icon className="w-7 h-7" />
                                                    </div>
                                                    <Badge variant="outline" className={cn("font-black px-4 py-1", item.color, `border-${item.color.split('-')[1]}-200`)}>
                                                        {item.magnitude}
                                                    </Badge>
                                                </div>
                                                <div className="relative z-10">
                                                    <h4 className="text-xl font-black text-slate-900 tracking-tight">{item.domain}</h4>
                                                    <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">{item.desc}</p>
                                                </div>
                                                <div className="pt-4 flex items-center gap-2 relative z-10">
                                                    <Button variant="ghost" className="p-0 h-auto font-black text-[10px] uppercase tracking-widest text-indigo-600 hover:bg-transparent">
                                                        Edit Rational <ArrowRight className="w-3 h-3 ml-1" />
                                                    </Button>
                                                </div>
                                                <item.icon className="absolute -bottom-10 -right-10 w-40 h-40 text-slate-900/5 rotate-12" />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-10 bg-indigo-50 border border-indigo-100 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-10">
                                        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-200 shrink-0">
                                            <Scale className="w-10 h-10" />
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="text-2xl font-black text-indigo-950 italic">Harm Weighting Algorithm</h4>
                                            <p className="text-indigo-700 text-sm font-medium leading-relaxed max-w-xl">
                                                Our AI weighted impact model aggregates these scores into a single residual impact value, adjusted for current control coverage and threat relevance.
                                            </p>
                                            <Button className="bg-indigo-950 text-white rounded-xl px-6 h-10 text-xs font-black uppercase tracking-widest">
                                                Adjust Weights
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="factors" className="p-10 space-y-8 m-0">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Contributing Factors</h3>
                                        <p className="text-sm text-slate-500 font-medium">Environmental and technical factors that amplify or diminish impact.</p>
                                    </div>

                                    <div className="space-y-6">
                                        {[
                                            { factor: "Data Volume", level: "Extremely High", desc: "Over 500TB of PII and protected health information.", status: "Amplifier" },
                                            { factor: "Public Visibility", level: "High", desc: "Frequent media coverage and active consumer base.", status: "Amplifier" },
                                            { factor: "Redundancy Level", level: "High", desc: "Multi-region failover significantly reduces availability risk.", status: "Dampener" }
                                        ].map((f, i) => (
                                            <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between">
                                                <div className="flex items-center gap-6">
                                                    <div className={cn(
                                                        "w-3 h-3 rounded-full",
                                                        f.status === 'Amplifier' ? "bg-rose-500" : "bg-emerald-500"
                                                    )} />
                                                    <div>
                                                        <h4 className="text-lg font-black text-slate-900 leading-tight">{f.factor}</h4>
                                                        <p className="text-xs text-slate-500 mt-1">{f.desc}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge className={cn(
                                                        "font-black text-[10px] px-3 py-1",
                                                        f.status === 'Amplifier' ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                                                    )}>{f.level}</Badge>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{f.status}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Card className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                                                <RotateCcw className="w-8 h-8 text-indigo-400" />
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-xl font-black uppercase tracking-tight">Synchronize with Risk Register</h4>
                                                <p className="text-indigo-200 text-sm font-medium">Push these impact determinations to the centralized organization risk repository.</p>
                                            </div>
                                            <Button className="ml-auto bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-xl h-12 px-8">
                                                Sync Now
                                            </Button>
                                        </div>
                                    </Card>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>
                    </Card>
                </div>
            </div>
        </NIST80030Layout>
    );
}

// Ensure unique content for the placeholder if it's imported elsewhere
export const NIST80030ImpactAnalysisPlaceholder = () => (
    <div className="p-8">Placeholder for Impact Analysis</div>
);

