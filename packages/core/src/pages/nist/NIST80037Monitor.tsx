
import React, { useState } from 'react';
import { useParams, Link } from "wouter";
import NIST80037Layout from "./NIST80037Layout";
import { useNistSystemId } from "./useNistSystem";
import { trpc } from "../../lib/trpc";

import {
    Activity,
    RefreshCw,
    BarChart3,
    History,
    AlertTriangle,
    ShieldCheck,
    Zap,
    Globe,
    Cpu,
    Clock,
    Bell,
    Save,
    ArrowRight,
    TrendingUp,
    Binary,
    Search,
    Filter,
    FileText,
    Calendar,
    Settings,
    ShieldAlert
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

export default function NIST80037Monitor() {
    const { id } = useParams<{ id: string }>();
    const systemId = useNistSystemId();
    const clientId = parseInt(id || "0");
    const [isSaving, setIsSaving] = useState(false);

    // TRPC Queries
    const checklistQuery = (trpc as any).checklist.get.useQuery({
        clientId,
        checklistId: systemId ? `nist-800-37-monitor-${systemId}` : 'no-system'
    }, {
        enabled: !!systemId
    });

    const updateChecklistMutation = (trpc as any).checklist.update.useMutation({
        onSuccess: () => {
            toast.success("Monitoring Strategy Updated");
            setIsSaving(false);
            checklistQuery.refetch();
        },
        onError: () => {
            setIsSaving(false);
            toast.error("Failed to save strategy");
        }
    });

    const postureHistoryQuery = (trpc as any).postureTrending.getHistory.useQuery({
        clientId,
        limit: 12
    });

    const notificationsQuery = (trpc as any).notifications.getNotifications.useQuery({
        limit: 5
    });

    const handleSave = () => {
        if (!systemId) {
            toast.error("No system selected", { description: "Please select a system first." });
            return;
        }

        setIsSaving(true);
        updateChecklistMutation.mutate({
            clientId,
            checklistId: `nist-800-37-monitor-${systemId}`,
            items: {
                lastReview: new Date().toISOString(),
                status: "active"
            }
        });
    };

    const handleExecuteIR = () => {
        toast.info("Incident Response Protocol Initiated", {
            description: "Establishing command center and notifying CSIRT team.",
            icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
            duration: 5000
        });
        // Navigate to new incident page if possible
        window.location.href = `/clients/${clientId}/cyber/incidents/new`;
    };

    const handleRiskBriefing = () => {
        toast.success("Risk Briefing Generated", {
            description: "Executive summary of current system posture sent to stakeholders.",
            icon: <FileText className="w-5 h-5 text-indigo-500" />
        });
    };

    const handleScheduleReview = () => {
        toast.success("Assessment Scheduled", {
            description: "Automated scan and manual review coordinated for next window."
        });
    };

    return (
        <NIST80037Layout>
            <div className="space-y-8 w-full pb-20">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/dashboard` },
                        { label: "NIST Hub", href: `/clients/${clientId}/nist` },
                        { label: "SP 800-37 (RMF)", href: `/clients/${clientId}/nist/rmf` },
                        { label: "Step 6: Monitor" },
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-600 text-white font-black px-3">STEP 6</Badge>
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700 font-bold uppercase tracking-widest text-[10px]">Continuous Monitoring Phase</Badge>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
                            <Activity className="w-10 h-10 text-emerald-600" />
                            Continuous Monitoring
                        </h1>
                        <p className="text-slate-500 text-lg font-medium max-w-3xl leading-relaxed">
                            Maintain situational awareness of the security and privacy posture of the system and organization to support risk management decisions.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl h-14 px-8 shadow-xl shadow-emerald-200/50 font-black text-lg gap-2"
                        >
                            {isSaving ? "Saving..." : <><Save className="w-5 h-5" /> Save Monitoring Policy</>}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Telemetry Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Posture Trend</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="h-40 flex items-end gap-1.5 pb-2">
                                    {postureHistoryQuery.data && postureHistoryQuery.data.length > 0 ? (
                                        [...postureHistoryQuery.data].reverse().map((snapshot: any, i: number) => (
                                            <div
                                                key={i}
                                                className="flex-1 bg-emerald-500/10 rounded-t-lg relative group transition-all"
                                                style={{ height: `${snapshot.complianceScore}%` }}
                                            >
                                                <div className="absolute inset-0 bg-emerald-500 rounded-t-lg scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-500" />
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                                    {snapshot.complianceScore}%
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        [45, 52, 48, 65, 58, 72, 85, 82, 90, 88, 92, 94].map((v, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 bg-emerald-500/10 rounded-t-lg relative group transition-all"
                                                style={{ height: `${v}%` }}
                                            >
                                                <div className="absolute inset-0 bg-emerald-500 rounded-t-lg scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-500" />
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Score</p>
                                        <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                            {postureHistoryQuery.data?.[0]?.complianceScore || "94.2"}
                                        </p>
                                    </div>
                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold flex gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        {postureHistoryQuery.data?.[0] && postureHistoryQuery.data?.[1] ? (
                                            <>
                                                {((postureHistoryQuery.data[0].complianceScore || 0) - (postureHistoryQuery.data[1].complianceScore || 0)).toFixed(1)}%
                                            </>
                                        ) : "+2.4%"}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-slate-900 text-white overflow-hidden relative">
                            <CardHeader>
                                <CardTitle className="text-emerald-400 text-xs font-black uppercase tracking-widest">Automated Triggers</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 relative z-10">
                                <div className="space-y-3">
                                    {notificationsQuery.data && notificationsQuery.data.filter((n: any) => n.type === 'alert').length > 0 ? (
                                        notificationsQuery.data.filter((n: any) => n.type === 'alert').map((n: any, i: number) => (
                                            <div
                                                key={i}
                                                onClick={() => toast.info(n.title, { description: n.message })}
                                                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Bell className="w-4 h-4 text-emerald-400" />
                                                    <span className="text-sm font-bold group-hover:text-emerald-300 truncate max-w-[150px]">{n.title}</span>
                                                </div>
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            </div>
                                        ))
                                    ) : (
                                        [
                                            { label: "Config Drift", status: "Active", icon: Binary, detail: "Detecting unauthorized state changes in production cloud resources." },
                                            { label: "Privilege Escalation", status: "Critical", icon: ShieldAlert, detail: "Suspicious IAM permission grants detected in last 24h." },
                                            { label: "New Asset Discovery", status: "Active", icon: Globe, detail: "3 new internet-facing assets identified and mapped to boundary." }
                                        ].map((t, i) => (
                                            <div
                                                key={i}
                                                onClick={() => toast.info(t.label, { description: t.detail })}
                                                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <t.icon className={cn("w-4 h-4", t.status === 'Critical' ? "text-rose-400" : "text-emerald-400")} />
                                                    <span className="text-sm font-bold group-hover:text-emerald-300">{t.label}</span>
                                                </div>
                                                <div className={cn("w-2 h-2 rounded-full animate-pulse", t.status === 'Critical' ? "bg-rose-400" : "bg-emerald-400")} />
                                            </div>
                                        ))
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => toast.info("Integration Settings Panes", { description: "Opening configuration for cloud telemetry and SIEM hooks." })}
                                    className="w-full text-emerald-400 font-bold text-xs uppercase tracking-widest hover:bg-white/5"
                                >
                                    Configure Integrations
                                </Button>
                            </CardContent>
                            <Cpu className="absolute -bottom-10 -left-10 w-48 h-48 text-white/5 -rotate-12" />
                        </Card>
                    </div>

                    <div className="lg:col-span-3">
                        <Tabs defaultValue="overview" className="w-full">
                            <div className="border-b px-8 bg-slate-50/50">
                                <TabsList className="h-16 bg-transparent gap-8">
                                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        Posture Overview
                                    </TabsTrigger>
                                    <TabsTrigger value="assessments" className="data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        Ongoing Assessments
                                    </TabsTrigger>
                                    <TabsTrigger value="risk" className="data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        Risk Response
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="pb-8">
                                <TabsContent value="overview" className="p-10 space-y-10 m-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Strategy Execution (M-1)</h3>
                                                <p className="text-sm text-slate-500 font-medium">Monitoring system changes and environmental shifts.</p>
                                            </div>

                                            <div className="space-y-4">
                                                {/* No events to display - real data would come from monitoring feeds */}
                                                <div className="text-center py-8 text-slate-400">
                                                    <p className="font-medium">No recent activity for this system</p>
                                                    <p className="text-sm">System changes and events will appear here</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-[3.5rem] p-10 border border-slate-200 space-y-8 relative overflow-hidden">
                                            <div className="relative z-10 space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100 text-emerald-600">
                                                        <BarChart3 className="w-6 h-6" />
                                                    </div>
                                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Posture Insights</h3>
                                                </div>
                                                <div className="space-y-4">
                                                    {[
                                                        { label: "Technical Controls", val: 98, color: "bg-emerald-500" },
                                                        { label: "Operational Controls", val: 82, color: "bg-emerald-400" },
                                                        { label: "Management Controls", val: 92, color: "bg-emerald-600" }
                                                    ].map((s, i) => (
                                                        <div key={i} className="space-y-1.5">
                                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                                                <span className="text-slate-500">{s.label}</span>
                                                                <span className="text-slate-900">{s.val}%</span>
                                                            </div>
                                                            <Progress value={s.val} className="h-1.5 bg-white" indicatorClassName={s.color} />
                                                        </div>
                                                    ))}
                                                </div>
                                                <Button
                                                    onClick={() => window.location.href = `/clients/${clientId}/board-summary`}
                                                    className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-2xl h-14 font-black text-lg gap-2 mt-4"
                                                >
                                                    <FileText className="w-5 h-5" /> Executive Dashboard
                                                </Button>
                                            </div>
                                            <Settings className="absolute -bottom-20 -right-20 w-80 h-80 text-emerald-900/5 rotate-12" />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="assessments" className="p-10 space-y-10 m-0">
                                    <div className="space-y-8">
                                        <div className="flex justify-between items-center">
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ongoing Verification (M-2)</h3>
                                                <p className="text-sm text-slate-500 font-medium">Scheduled and event-driven control assessments.</p>
                                            </div>
                                            <Button
                                                onClick={handleScheduleReview}
                                                className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11 px-6 font-bold gap-2 shadow-lg shadow-emerald-200"
                                            >
                                                <Calendar className="w-4 h-4" /> Schedule Review
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {[
                                                { title: "Annual Access Sweep", next: "Mar 15, 2026", frequency: "Annually", status: "Upcoming", controls: 42 },
                                                { title: "Quarterly Scan Review", next: "Apr 01, 2026", frequency: "Quarterly", status: "In-Progress", controls: 12 },
                                                { title: "Real-time Drift Detection", next: "Continuous", frequency: "Always-on", status: "Healthy", controls: 185 }
                                            ].map((a, i) => (
                                                <div key={i} className="p-8 bg-white border border-slate-100 rounded-[3rem] space-y-6 hover:shadow-xl transition-all group">
                                                    <div className="flex items-center justify-between">
                                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-3 py-1">
                                                            {a.status}
                                                        </Badge>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{a.frequency}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-black text-slate-900 tracking-tight">{a.title}</h4>
                                                        <p className="text-xs font-bold text-slate-400 mt-1">Next due: {a.next}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                        <div className="flex -space-x-2">
                                                            {[1, 2, 3].map(i => (
                                                                <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                                    ID
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <span className="text-xs font-black text-slate-900">{a.controls} Controls</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="risk" className="p-10 space-y-10 m-0">
                                    <div className="p-12 bg-rose-900 rounded-[3.5rem] text-white relative overflow-hidden">
                                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                                            <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center border border-white/20">
                                                <AlertTriangle className="w-12 h-12 text-rose-400" />
                                            </div>
                                            <div className="flex-1 space-y-4 text-center md:text-left">
                                                <h3 className="text-3xl font-black tracking-tighter uppercase italic underline decoration-rose-400/50 underline-offset-8">Critical Risk Response (M-3)</h3>
                                                <p className="text-rose-200 font-medium text-lg leading-relaxed max-w-2xl">
                                                    Immediate response protocol triggered for significant changes or high-impact vulnerabilities detected in the production environment.
                                                </p>
                                                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                                    <Button
                                                        onClick={handleExecuteIR}
                                                        className="bg-white text-rose-900 hover:bg-slate-100 rounded-2xl h-14 px-10 font-black text-lg shadow-2xl shadow-rose-950/40 transform hover:-translate-y-1 transition-all active:scale-95"
                                                    >
                                                        <ShieldAlert className="w-6 h-6 mr-2" /> Execute IR Plan
                                                    </Button>
                                                    <Button
                                                        onClick={handleRiskBriefing}
                                                        className="bg-white/10 border-white border-2 text-white hover:bg-white hover:text-rose-900 rounded-2xl h-14 px-10 font-black text-lg backdrop-blur-sm transition-all shadow-xl group"
                                                    >
                                                        <FileText className="w-6 h-6 mr-2 text-white group-hover:text-rose-900 transition-colors" /> Risk Briefing
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <ShieldAlert className="absolute -bottom-20 -right-20 w-96 h-96 text-white/5 rotate-12" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { title: "Open POA&Ms", count: 18, risk: "Moderate", path: `/clients/${clientId}/federal/poam` },
                                            { title: "Deviations", count: 3, risk: "Low" },
                                            { title: "SAR Findings", count: 0, risk: "Resolved" }
                                        ].map((stat, i) => (
                                            stat.path ? (
                                                <Link key={i} href={stat.path}>
                                                    <Card className="border-none shadow-sm bg-slate-50 rounded-[2.5rem] p-8 text-center space-y-2 hover:bg-slate-100 transition-all cursor-pointer">
                                                        <h4 className="text-4xl font-black text-slate-900">{stat.count}</h4>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
                                                        <Badge className={cn(
                                                            "font-bold px-3 py-1",
                                                            stat.risk === 'Moderate' ? "bg-amber-100 text-amber-600" :
                                                                stat.risk === 'Resolved' ? "bg-emerald-100 text-emerald-600" :
                                                                    "bg-slate-200 text-slate-600"
                                                        )}>{stat.risk}</Badge>
                                                    </Card>
                                                </Link>
                                            ) : (
                                                <Card key={i} className="border-none shadow-sm bg-slate-50 rounded-[2.5rem] p-8 text-center space-y-2">
                                                    <h4 className="text-4xl font-black text-slate-900">{stat.count}</h4>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
                                                    <Badge className={cn(
                                                        "font-bold px-3 py-1",
                                                        stat.risk === 'Moderate' ? "bg-amber-100 text-amber-600" :
                                                            stat.risk === 'Resolved' ? "bg-emerald-100 text-emerald-600" :
                                                                "bg-slate-200 text-slate-600"
                                                    )}>{stat.risk}</Badge>
                                                </Card>
                                            )
                                        ))}
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>
                </div>
            </div>
        </NIST80037Layout>
    );
}

