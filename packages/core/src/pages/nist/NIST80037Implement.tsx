import React, { useState, useEffect } from 'react';
import { trpc } from '../../lib/trpc';
import { useParams, useLocation, Link } from "wouter";
import NIST80037Layout from "./NIST80037Layout";
import { useNistSystemId } from "./useNistSystem";
import {
    Hammer,
    ClipboardList,
    FileText,
    Layers,
    Zap,
    CheckCircle2,
    Clock,
    AlertCircle,
    Cloud,
    Code2,
    Terminal,
    Save,
    ArrowRight,
    Lock,
    Eye,
    ShieldCheck,
    History,
    FileCheck,
    Cpu,
    Plus,
    Camera,
    ListChecks,
    Search,
    ExternalLink
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

export default function NIST80037Implement() {
    const { id } = useParams<{ id: string }>();
    const systemId = useNistSystemId();
    const clientId = parseInt(id || "0");
    const [isSaving, setIsSaving] = useState(false);

    // Dynamic State
    const [controls, setControls] = useState([
        { id: "AC-2", title: "Account Management", status: "Implemented", type: "Technical", description: "Configured AWS IAM with role-based access control and MFA session enforcement." },
        { id: "AU-6", title: "Audit Record Review", status: "Partially Implemented", type: "Operational", description: "Splunk dashboards configured; weekly review formal procedure still in draft." },
        { id: "IA-2", title: "Identification and Authentication", status: "Implemented", type: "Technical", description: "Okta integration finalized with SAML 2.0 and mandatory FIDO2 hardware keys." },
        { id: "CP-2", title: "Contingency Plan", status: "Planned", type: "Operational", description: "BIA completed. Full contingency plan drafting scheduled for Q3." }
    ]);

    const [families, setFamilies] = useState([
        { name: "Access Control", progress: 85, color: "bg-indigo-500" },
        { name: "Audit & Accountability", progress: 42, color: "bg-emerald-500" },
        { name: "Configuration Management", progress: 60, color: "bg-amber-500" },
        { name: "Identification & Auth", progress: 95, color: "bg-rose-500" }
    ]);

    // Reset local state when systemId changes
    useEffect(() => {
        setControls([
            { id: "AC-2", title: "Account Management", status: "Implemented", type: "Technical", description: "Configured AWS IAM with role-based access control and MFA session enforcement." },
            { id: "AU-6", title: "Audit Record Review", status: "Partially Implemented", type: "Operational", description: "Splunk dashboards configured; weekly review formal procedure still in draft." },
            { id: "IA-2", title: "Identification and Authentication", status: "Implemented", type: "Technical", description: "Okta integration finalized with SAML 2.0 and mandatory FIDO2 hardware keys." },
            { id: "CP-2", title: "Contingency Plan", status: "Planned", type: "Operational", description: "BIA completed. Full contingency plan drafting scheduled for Q3." }
        ]);
        setFamilies([
            { name: "Access Control", progress: 85, color: "bg-indigo-500" },
            { name: "Audit & Accountability", progress: 42, color: "bg-emerald-500" },
            { name: "Configuration Management", progress: 60, color: "bg-amber-500" },
            { name: "Identification & Auth", progress: 95, color: "bg-rose-500" }
        ]);
    }, [systemId]);

    // TRPC - Using any casting due to persistent stale type inference for these specific routers
    const { data: checklistData } = (trpc as any).checklist.get.useQuery({
        clientId,
        checklistId: systemId ? `nist-800-37-implement-${systemId}` : 'no-system'
    }, {
        enabled: !!systemId
    });

    const { data: activeIntegrations } = (trpc as any).integrations.listActive.useQuery({ clientId });
    const { data: evidenceData } = (trpc as any).evidence.list.useQuery({ clientId });

    const updateChecklistMutation = (trpc as any).checklist.update.useMutation();

    useEffect(() => {
        if (checklistData?.items) {
            if (checklistData.items.controls) {
                setControls(checklistData.items.controls as any);
            }
            if (checklistData.items.families) {
                setFamilies(checklistData.items.families as any);
            }
        }
    }, [checklistData]);

    const handleSave = async () => {
        if (!systemId) {
            toast.error("No system selected", { description: "Please select a system first." });
            return;
        }
        
        setIsSaving(true);
        try {
            await updateChecklistMutation.mutateAsync({
                clientId,
                checklistId: `nist-800-37-implement-${systemId}`,
                items: { controls, families }
            });
            toast.success("Implementation Progress Saved", {
                description: "Control implementation status and SSP updates recorded.",
            });
        } catch (error) {
            toast.error("Failed to save implementation data");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateStatus = (id: string) => {
        const statuses = ["Planned", "Partially Implemented", "Implemented"];
        setControls(prev => prev.map(c => {
            if (c.id === id) {
                const currentIndex = statuses.indexOf(c.status);
                const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                return { ...c, status: nextStatus };
            }
            return c;
        }));
    };

    const handleSyncCloud = () => {
        toast.info("Syncing Tech Stack", {
            description: "Fetching technical evidence from Terraform Cloud and AWS CloudTrail...",
        });
        setTimeout(() => {
            toast.success("Sync Complete", {
                description: "3 new implementation markers identified for AC-2 and IA-2.",
            });
        }, 2000);
    };


    // Calc overall progress
    const implementedCount = controls.filter(c => c.status === "Implemented").length;
    const partialCount = controls.filter(c => c.status === "Partially Implemented").length;
    const totalCount = controls.length;
    const progressPercent = Math.round(((implementedCount + partialCount * 0.5) / totalCount) * 100);

    return (
        <NIST80037Layout>
            <div className="space-y-8 max-w-5xl pb-20">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/dashboard` },
                        { label: "NIST Hub", href: `/clients/${clientId}/nist` },
                        { label: "SP 800-37 (RMF)", href: `/clients/${clientId}/nist/rmf` },
                        { label: "Step 3: Implement" },
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-600 text-white font-black px-3">STEP 3</Badge>
                            <Badge variant="outline" className="border-indigo-200 text-indigo-700 font-bold uppercase tracking-widest text-[10px]">Implementation Phase</Badge>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
                            <Hammer className="w-10 h-10 text-indigo-600" />
                            Control Implementation
                        </h1>
                        <p className="text-slate-500 text-lg font-medium max-w-3xl leading-relaxed">
                            Implement the controls in the security and privacy plans for the system and the organization.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setLocation(`/clients/${clientId}/evidence`)}
                            className="rounded-2xl h-14 px-6 font-bold border-2 border-slate-200 hover:bg-slate-50 text-slate-700 gap-2 shadow-sm"
                        >
                            <Layers className="w-5 h-5 text-indigo-600" /> Evidence Repo
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 px-8 shadow-xl shadow-indigo-200/50 font-black text-lg gap-2"
                        >
                            {isSaving ? "Saving..." : <><Save className="w-5 h-5" /> Save Implementation</>}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Progress Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Overall Implementation</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="text-center py-6">
                                    <div className="inline-flex items-center justify-center relative w-32 h-32">
                                        <svg className="w-32 h-32 transform -rotate-90">
                                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                                            <circle
                                                cx="64" cy="64" r="58"
                                                stroke="currentColor" strokeWidth="12" fill="transparent"
                                                strokeDasharray={364.4}
                                                strokeDashoffset={364.4 * (1 - progressPercent / 100)}
                                                className="text-indigo-600 transition-all duration-1000"
                                            />
                                        </svg>
                                        <span className="absolute text-3xl font-black text-slate-900">{progressPercent}%</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 mt-4 uppercase tracking-widest">{implementedCount} of {totalCount} Controls</p>
                                </div>
                                <div className="space-y-4 pt-4 border-t">
                                    {families.map((f, i) => (
                                        <div key={i} className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                                <span className="text-slate-500">{f.name}</span>
                                                <span className="text-slate-900">{f.progress}%</span>
                                            </div>
                                            <Progress value={f.progress} className="h-1 bg-slate-100" indicatorClassName={f.color} />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-slate-900 text-white">
                            <CardHeader>
                                <CardTitle className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Tech Stack Integration</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {activeIntegrations?.length ? activeIntegrations.map((integration: any, idx: number) => (
                                    <div
                                        key={idx}
                                        onClick={() => toast.success(`${integration.provider.toUpperCase()} Integration Healthy`, {
                                            description: `Last synced: ${integration.updatedAt ? new Date(integration.updatedAt).toLocaleString() : 'Just now'}`
                                        })}
                                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 clickable group transition-all hover:bg-white/10 cursor-pointer"
                                    >
                                        {integration.provider === 'aws' ? <Cloud className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" /> : <Terminal className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />}
                                        <div>
                                            <p className="text-sm font-bold capitalize">{integration.provider} Environment</p>
                                            <p className="text-[10px] text-slate-500 uppercase font-black">{integration.isEnabled ? 'Active' : 'Disconnected'}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-4 bg-white/5 rounded-xl border border-white/10 border-dashed">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No active integrations</p>
                                        <Button
                                            variant="link"
                                            onClick={() => setLocation(`/clients/${clientId}/integrations`)}
                                            className="text-indigo-400 text-[10px] font-black uppercase p-0 h-auto mt-1"
                                        >
                                            Connect Now <ArrowRight className="ml-1 w-3 h-3" />
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="lg:col-span-3 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[2.5rem] overflow-hidden">
                        <Tabs defaultValue="implementation" className="w-full">
                            <div className="border-b px-8 bg-slate-50/50">
                                <TabsList className="h-16 bg-transparent gap-8">
                                    <TabsTrigger value="implementation" className="data-[state=active]:bg-transparent data-[state=active]:text-indigo-700 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        Control Execution
                                    </TabsTrigger>
                                    <TabsTrigger value="ssp" className="data-[state=active]:bg-transparent data-[state=active]:text-indigo-700 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        SSP Documentation
                                    </TabsTrigger>
                                    <TabsTrigger value="evidence" className="data-[state=active]:bg-transparent data-[state=active]:text-indigo-700 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">
                                        Technical Evidence
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="h-[900px]">
                                <TabsContent value="implementation" className="p-10 space-y-8 m-0">
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Implement Controls (I-1)</h3>
                                            <p className="text-sm text-slate-500 font-medium">Configure and deploy the security controls selected in the previous step.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => toast.info("Implementation History", { description: "Viewing implementation audit trail for the last 30 days..." })}
                                                className="rounded-xl h-10 font-bold text-xs uppercase tracking-widest gap-2"
                                            >
                                                <History className="w-4 h-4" /> Change Log
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {(controls as any[]).map((control, i) => (
                                            <div key={i} className="p-8 bg-white border rounded-[3rem] hover:shadow-xl transition-all group relative overflow-hidden">
                                                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className={cn(
                                                            "w-20 h-20 rounded-[2rem] flex items-center justify-center border-2 transition-all",
                                                            control.status === 'Implemented' ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                                                                control.status === 'Partially Implemented' ? "bg-amber-50 border-amber-200 text-amber-600" :
                                                                    "bg-slate-50 border-slate-200 text-slate-400"
                                                        )}>
                                                            <span className="font-black text-2xl tracking-tighter">{control.id}</span>
                                                        </div>
                                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest py-1 border-slate-100">{control.type}</Badge>
                                                    </div>
                                                    <div className="flex-1 space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-2xl font-black text-slate-900 tracking-tight">{control.title}</h4>
                                                            <Badge className={cn(
                                                                "font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest",
                                                                control.status === 'Implemented' ? "bg-emerald-500 text-white" :
                                                                    control.status === 'Partially Implemented' ? "bg-amber-500 text-white" :
                                                                        "bg-indigo-600 text-white"
                                                            )}>{control.status}</Badge>
                                                        </div>
                                                        <p className="text-slate-500 font-medium leading-relaxed font-serif italic text-lg opacity-80">
                                                            "{control.description}"
                                                        </p>
                                                        <div className="flex gap-3 pt-2">
                                                            <Button
                                                                onClick={() => handleUpdateStatus(control.id)}
                                                                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-widest gap-2"
                                                            >
                                                                Update Status
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => toast.info(`Requirement for ${control.id}`, { description: `Standard requirement for NIST ${control.id} implementation...` })}
                                                                className="rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-widest gap-2 border-2 border-slate-200 hover:bg-slate-50"
                                                            >
                                                                Review Requirement
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="ssp" className="p-10 space-y-10 m-0">
                                    <div className="p-10 bg-indigo-900 rounded-[3.5rem] text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
                                        <div className="relative z-10 w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center border border-white/20">
                                            <FileCheck className="w-12 h-12 text-indigo-400" />
                                        </div>
                                        <div className="relative z-10 space-y-4 text-center md:text-left">
                                            <h3 className="text-3xl font-black tracking-tighter">System Security Plan (SSP) Draft (I-2)</h3>
                                            <p className="text-indigo-200 font-medium max-w-xl text-lg leading-relaxed">
                                                Control implementation details are automatically mapped to your SSP. Ensure all technical configurations are documented for the upcoming assessment.
                                            </p>
                                            <div className="flex gap-4 pt-2">
                                                <Link href={`/clients/${clientId}/federal/ssp`}>
                                                    <Button
                                                        className="bg-white text-indigo-900 hover:bg-indigo-50 rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs gap-2 shadow-lg shadow-indigo-900/20"
                                                    >
                                                        <ExternalLink className="w-4 h-4" /> Open SSP Editor
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                        <Layers className="absolute -bottom-20 -right-20 w-80 h-80 text-white/5 rotate-12" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-indigo-100 text-indigo-500">
                                                    <Cpu className="w-6 h-6" />
                                                </div>
                                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Technical Spec Sync</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <p className="text-sm text-slate-500 font-medium">Auto-generate implementation descriptions from cloud configuration scripts.</p>
                                                <Button
                                                    onClick={handleSyncCloud}
                                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-black uppercase tracking-widest text-xs gap-2 shadow-md shadow-indigo-200"
                                                >
                                                    <Code2 className="w-4 h-4" /> Sync from Terraform / CloudFormation
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-emerald-100 text-emerald-500">
                                                    <ShieldCheck className="w-6 h-6" />
                                                </div>
                                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Compliance Advisor</h4>
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium">AI analysis confirms implementation narrative meets FedRAMP Moderate verbosity requirements.</p>
                                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest">
                                                <CheckCircle2 className="w-4 h-4" /> Ready for Review
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="evidence" className="p-10 space-y-8 m-0">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { title: "Configuration Snapshots", count: evidenceData?.filter((e: any) => e.type === 'snapshot' || e.type === 'api').length || 0, icon: Camera },
                                            { title: "Test Results", count: evidenceData?.filter((e: any) => e.status === 'verified').length || 0, icon: ListChecks },
                                            { title: "Policy Artifacts", count: evidenceData?.filter((e: any) => e.type === 'policy').length || 0, icon: FileText }
                                        ].map((box, i) => (
                                            <div
                                                key={i}
                                                onClick={() => setLocation(`/clients/${clientId}/evidence`)}
                                                className="p-8 bg-white border rounded-[2.5rem] flex flex-col items-center text-center space-y-4 hover:shadow-lg transition-all cursor-pointer group"
                                            >
                                                <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <box.icon className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-slate-900">{box.title}</h4>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{box.count} Artifacts Linked</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-10 border-2 border-dashed border-slate-200 rounded-[3.5rem] bg-slate-50/50 text-center space-y-6">
                                        <div className="w-20 h-20 bg-white rounded-[2rem] border border-slate-200 flex items-center justify-center mx-auto text-slate-300 shadow-sm">
                                            <Layers className="w-10 h-10" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black text-slate-700">Link Technical Evidence</h3>
                                            <p className="text-slate-500 font-medium max-w-sm mx-auto">Upload screenshots, scripts, or policy documents to support your implementation narrative.</p>
                                        </div>
                                        <Button
                                            onClick={() => toast.info("Attach Evidence", { description: "Opening file picker for artifact upload..." })}
                                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 px-10 font-black text-lg gap-3"
                                        >
                                            <Plus className="w-6 h-6" /> Attach Evidence
                                        </Button>
                                    </div>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>
                    </Card>
                </div>
            </div>
        </NIST80037Layout>
    );
}

