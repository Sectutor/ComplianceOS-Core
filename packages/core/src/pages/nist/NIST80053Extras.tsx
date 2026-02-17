
import React, { useState } from 'react';
import NIST80053Layout from './NIST80053Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import {
    Shield,
    Layers,
    Settings,
    Activity,
    ClipboardList,
    Cloud,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Plus,
    Building2,
    Info,
    ArrowRight,
    Search,
    Globe,
    History
} from "lucide-react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Input } from "@complianceos/ui/ui/input";
import { toast } from "sonner";

// --- BASELINES ---
export const Nist80053Baselines = () => {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [selectedLevel, setSelectedLevel] = useState<"low" | "moderate" | "high">("moderate");

    const baselines = {
        low: { controls: 171, families: 17, description: "Appropriate for systems where the loss of confidentiality, integrity, or availability is expected to have a limited adverse effect." },
        moderate: { controls: 325, families: 20, description: "Appropriate for systems where the loss of confidentiality, integrity, or availability is expected to have a serious adverse effect." },
        high: { controls: 421, families: 20, description: "Appropriate for systems where the loss of confidentiality, integrity, or availability is expected to have a severe or catastrophic adverse effect." }
    };

    return (
        <NIST80053Layout>
            <div className="space-y-6">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/dashboard` },
                        { label: "NIST Hub", href: `/clients/${clientId}/nist` },
                        { label: "800-53 Baselines" },
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            <Layers className="w-8 h-8 text-indigo-600" />
                            Security Control Baselines
                        </h1>
                        <p className="text-slate-500 mt-1 uppercase text-xs font-bold tracking-widest flex items-center gap-2">
                            NIST SP 800-53B Control Selection Criteria
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(Object.keys(baselines) as Array<keyof typeof baselines>).map((level) => (
                        <Card
                            key={level}
                            onClick={() => setSelectedLevel(level)}
                            className={`cursor-pointer transition-all border-2 rounded-[2.5rem] overflow-hidden ${selectedLevel === level ? "border-blue-500 shadow-2xl shadow-blue-500/10 scale-[1.02] ring-4 ring-blue-50" : "border-slate-100 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:border-slate-300"
                                }`}
                        >
                            <CardHeader className={`p-8 ${selectedLevel === level ? "bg-blue-50/50" : "bg-slate-50"}`}>
                                <div className="flex justify-between items-start">
                                    <Badge className={`uppercase text-[10px] font-black px-3 py-1 ${level === 'high' ? 'bg-rose-500' : level === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`}>
                                        {level} Impact
                                    </Badge>
                                    {selectedLevel === level && <CheckCircle2 className="w-6 h-6 text-blue-500" />}
                                </div>
                                <CardTitle className="text-2xl font-black mt-4 capitalize">{level} Baseline</CardTitle>
                                <CardDescription className="text-slate-500 font-medium leading-relaxed mt-2">
                                    {baselines[level].description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl text-center">
                                        <div className="text-2xl font-black text-slate-900">{baselines[level].controls}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controls</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl text-center">
                                        <div className="text-2xl font-black text-slate-900">{baselines[level].families}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Families</div>
                                    </div>
                                </div>
                                <Button
                                    className={`w-full rounded-2xl h-12 font-bold ${selectedLevel === level ? "bg-blue-600 shadow-lg shadow-blue-600/20" : "bg-slate-100 text-slate-600"
                                        }`}
                                >
                                    Select This Baseline
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                            <Info className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Requirement Tailoring</h3>
                            <p className="text-sm text-slate-500">Fine-tune your control selection based on specific organizational needs.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Scoping Considerations
                            </h4>
                            <div className="space-y-3">
                                {["Common Control Provider (CCP) Identification", "Public Access System Adjustments", "Scalability and Criticality Criteria"].map(item => (
                                    <div key={item} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <span className="text-sm font-medium text-slate-600">{item}</span>
                                        <Badge variant="outline" className="bg-white">Review</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                Environmental Factors
                            </h4>
                            <div className="space-y-3">
                                {["Cloud Service Model (SaaS/PaaS/IaaS)", "External Connection Security Plans", "Privacy Impact Assessments (PIA)"].map(item => (
                                    <div key={item} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <span className="text-sm font-medium text-slate-600">{item}</span>
                                        <Badge variant="outline" className="bg-white">Review</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </NIST80053Layout>
    );
};

// --- INHERITANCE ---
export const Nist80053Inheritance = () => {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const { data: inheritances, isLoading } = trpc.federal.getInheritances.useQuery({ clientId, packageId: 0 }); // Root inheritances
    const [search, setSearch] = useState("");

    return (
        <NIST80053Layout>
            <div className="space-y-6">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/dashboard` },
                        { label: "NIST Hub", href: `/clients/${clientId}/nist` },
                        { label: "Control Inheritance" },
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            <Settings className="w-8 h-8 text-emerald-600" />
                            Control Inheritance
                        </h1>
                        <p className="text-slate-500 mt-1 uppercase text-xs font-bold tracking-widest flex items-center gap-2">
                            Shared Responsibility & External Provider Mapping
                        </p>
                    </div>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg ring-4 ring-emerald-50">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Provider
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1 space-y-6">
                        <Card className="border-none shadow-sm rounded-[2.5rem] bg-slate-900 text-white p-8">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 mb-6 font-mono">Inheritance Health</h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span>Mapped Coverage</span>
                                        <span className="text-emerald-400">72%</span>
                                    </div>
                                    <Progress value={72} className="h-1.5 bg-white/10" />
                                </div>
                                <div className="pt-6 border-t border-white/10 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-emerald-400">
                                            <Cloud className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-black">AWS GovCloud</div>
                                            <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">128 Controls</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-blue-400">
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-black">Corporate HQ</div>
                                            <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">42 Controls</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="md:col-span-3 space-y-6">
                        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    className="pl-11 h-12 bg-slate-50 border-none rounded-2xl"
                                    placeholder="Search mapped controls..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="border-none hover:bg-transparent">
                                        <TableHead className="font-black text-[10px] uppercase text-slate-400 tracking-wider h-14 pl-8">Control ID</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-slate-400 tracking-wider h-14">Provider</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-slate-400 tracking-wider h-14">Status</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-slate-400 tracking-wider h-14">Last Verified</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-slate-400 tracking-wider h-14 pr-8 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[
                                        { id: "AC-1", provider: "AWS GovCloud", status: "Verified", date: "2024-01-15" },
                                        { id: "AC-2", provider: "Corporate HQ", status: "Partial", date: "2024-02-10" },
                                        { id: "AU-2", provider: "Splunk Cloud", status: "Verified", date: "2024-01-20" },
                                        { id: "SI-2", provider: "CrowdStrike", status: "Verified", date: "2023-12-05" },
                                    ].map((row) => (
                                        <TableRow key={row.id} className="border-slate-50 hover:bg-slate-50 transition-colors group">
                                            <TableCell className="pl-8 font-black text-blue-600 font-mono">{row.id}</TableCell>
                                            <TableCell className="font-bold text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="rounded-lg group-hover:bg-white">{row.provider}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={row.status === 'Verified' ? "bg-emerald-500" : "bg-amber-500"}>
                                                    {row.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-400 font-medium text-sm">{row.date}</TableCell>
                                            <TableCell className="pr-8 text-right">
                                                <Button size="icon" variant="ghost" className="rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600">
                                                    <ArrowRight className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </NIST80053Layout>
    );
};

// --- ASSESSMENTS ---
export const Nist80053AssessmentsList = () => {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const { data: assessments } = trpc.federal.getNist80053Assessments.useQuery({ clientId });

    return (
        <NIST80053Layout>
            <div className="space-y-6">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/dashboard` },
                        { label: "NIST Hub", href: `/clients/${clientId}/nist` },
                        { label: "Assessment Cycles" },
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            <ClipboardList className="w-8 h-8 text-blue-600" />
                            Assessment Cycles
                        </h1>
                        <p className="text-slate-500 mt-1 uppercase text-xs font-bold tracking-widest flex items-center gap-2">
                            Full Security Evaluation (A&A) Lifecycle Management
                        </p>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg ring-4 ring-blue-50">
                        <Plus className="w-4 h-4 mr-2" />
                        New Assessment
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="border-none shadow-2xl shadow-blue-500/10 rounded-[2.5rem] bg-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        <CardHeader className="p-8 pb-4">
                            <Badge className="bg-blue-600 text-white w-fit uppercase text-[10px] font-black px-3 py-1 mb-4">Current Cycle</Badge>
                            <CardTitle className="text-2xl font-black tracking-tight">FY24 Annual Assessment</CardTitle>
                            <CardDescription className="text-slate-500 font-medium">Moderate Baseline • FedRAMP Streamlined</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <span>Phase 4: Reporting</span>
                                    <span>84%</span>
                                </div>
                                <Progress value={84} className="h-2 bg-slate-100" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Due In</div>
                                    <div className="text-lg font-black text-slate-900">14 Days</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Assessor</div>
                                    <div className="text-lg font-black text-slate-900">3PAO</div>
                                </div>
                            </div>
                            <Button className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-black font-black text-white shadow-xl shadow-slate-900/20">
                                Open Dashboard
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="md:col-span-2 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-4 mb-2">History & Archive</h3>
                        {[
                            { title: "FY23 Continuous Monitoring", status: "Closed", date: "Jan 12, 2024", controls: 325, score: "96%", variant: "emerald" },
                            { title: "Cloud Migration Gap Analysis", status: "Closed", date: "Aug 05, 2023", controls: 120, score: "78%", variant: "blue" },
                            { title: "Initial Authorization Assessment", status: "Closed", date: "Jan 20, 2023", controls: 325, score: "92%", variant: "slate" },
                        ].map((item, idx) => (
                            <Card key={idx} className="border-none shadow-sm rounded-[2rem] bg-white group hover:shadow-xl transition-all cursor-pointer">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                                <History className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 tracking-tight">{item.title}</h4>
                                                <p className="text-xs text-slate-400 font-medium">Completed {item.date} • {item.controls} Controls Evaluated</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Score</div>
                                                <div className="text-lg font-black text-emerald-600">{item.score}</div>
                                            </div>
                                            <Badge variant="outline" className="rounded-xl h-8 px-4 opacity-40 group-hover:opacity-100 transition-opacity">Archived</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </NIST80053Layout>
    );
};

// --- MONITORING ---
export const Nist80053Monitoring = () => {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");

    return (
        <NIST80053Layout>
            <div className="space-y-6">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/dashboard` },
                        { label: "NIST Hub", href: `/clients/${clientId}/nist` },
                        { label: "Continuous Monitoring" },
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            <Activity className="w-8 h-8 text-rose-500" />
                            Continuous Monitoring
                        </h1>
                        <p className="text-slate-500 mt-1 uppercase text-xs font-bold tracking-widest flex items-center gap-2">
                            NIST SP 800-137 Information Security Continuous Monitoring (ISCM)
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl text-emerald-700 font-bold text-xs ring-1 ring-emerald-100">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            System Pulse: Healthy
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                <Shield className="w-5 h-5" />
                            </div>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase">Control Drift</Badge>
                        </div>
                        <div className="text-3xl font-black text-slate-900">0.4%</div>
                        <p className="text-slate-400 text-xs mt-1 font-medium">Last 30 days deviation</p>
                    </Card>
                    <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase">High Findings</Badge>
                        </div>
                        <div className="text-3xl font-black text-slate-900">12</div>
                        <p className="text-slate-400 text-xs mt-1 font-medium">Open vulnerabilities</p>
                    </Card>
                    <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                                <Clock className="w-5 h-5" />
                            </div>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase">Expiring Evidence</Badge>
                        </div>
                        <div className="text-3xl font-black text-slate-900">08</div>
                        <p className="text-slate-400 text-xs mt-1 font-medium">Renewal required within 7 days</p>
                    </Card>
                    <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                                <Activity className="w-5 h-5" />
                            </div>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase">Auto-Scan Coverage</Badge>
                        </div>
                        <div className="text-3xl font-black text-slate-900">64%</div>
                        <p className="text-slate-400 text-xs mt-1 font-medium">Integrated direct telemetry</p>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Active Monitor Streams</h3>
                            <Button variant="ghost" className="text-blue-600 font-bold text-xs uppercase tracking-widest">Configure Sensors</Button>
                        </div>
                        <div className="space-y-4">
                            {[
                                { name: "AWS Security Hub", status: "Active", latency: "Real-time", icon: Cloud, color: "text-sky-500" },
                                { name: "CrowdStrike Falcon", status: "Active", latency: "5m lag", icon: Shield, color: "text-rose-500" },
                                { name: "Qualys Vulnerability Scans", status: "Warning", latency: "Monthly", icon: AlertTriangle, color: "text-amber-500" },
                                { name: "Okta Logs (Audit)", status: "Active", latency: "5s lag", icon: Activity, color: "text-indigo-500" },
                            ].map((s, idx) => (
                                <div key={idx} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center ${s.color} shadow-sm`}>
                                            <s.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{s.name}</div>
                                            <div className="text-xs text-slate-400 font-medium">Connector Latency: {s.latency}</div>
                                        </div>
                                    </div>
                                    <Badge className={s.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}>{s.status}</Badge>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="border-none shadow-sm rounded-[2.5rem] bg-slate-900 text-white p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <h3 className="text-xl font-black tracking-tight">Systematic ConMon Status</h3>
                            <Badge className="bg-white/10 text-white border-none">Live Telemetry</Badge>
                        </div>
                        <div className="space-y-8 relative z-10">
                            <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500">
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-black text-rose-400">Policy Violation Detected</div>
                                        <div className="text-sm text-white/60">AC-2: AWS Account "Prod-DB" has no MFA enabled.</div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button className="flex-1 bg-rose-600 hover:bg-rose-700 rounded-xl font-bold h-10">Create Task</Button>
                                    <Button variant="ghost" className="flex-1 text-white/60 hover:text-white rounded-xl h-10">Ignore (Risk Accept)</Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-[1.5rem] bg-white/5 border border-white/10">
                                    <div className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mb-2">Total Controls</div>
                                    <div className="text-3xl font-black">325</div>
                                </div>
                                <div className="p-6 rounded-[1.5rem] bg-white/5 border border-white/10">
                                    <div className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mb-2">Verified</div>
                                    <div className="text-3xl font-black text-emerald-400">284</div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </NIST80053Layout>
    );
};
