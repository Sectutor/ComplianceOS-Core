
import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from "wouter";
import NIST80030Layout from "./NIST80030Layout";
import { trpc } from "../../lib/trpc";
import { useNistSystemId } from "./useNistSystem";
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
    Network,
    Trash2,
    Pencil,
    X
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@complianceos/ui/ui/dialog";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const THREAT_SOURCE_TYPES = ["Adversarial", "Accidental", "Structural", "Environmental"] as const;
const CAPABILITY_LEVELS = ["Very High", "High", "Moderate", "Low", "Very Low"] as const;
const LIKELIHOOD_LEVELS = ["Very High", "High", "Moderate", "Low", "Very Low"] as const;
const RELEVANCE_LEVELS = ["Confirmed", "Expected", "Predicted", "Possible", "N/A"] as const;

const typeIcons: Record<string, any> = {
    Adversarial: Skull,
    Accidental: Ghost,
    Structural: ZapOff,
    Environmental: CloudLightning,
};

const typeColors: Record<string, string> = {
    Adversarial: "rose",
    Accidental: "amber",
    Structural: "indigo",
    Environmental: "emerald",
};

export default function NIST80030ThreatModeling() {
    const { id } = useParams<{ id: string }>();
    const systemId = useNistSystemId();
    const clientId = parseInt(id || "0");
    const fismaSystemId = systemId;
    const utils = trpc.useUtils();

    // Queries
    const { data: threatSources = [], isLoading: loadingSources } = trpc.nist80030.listThreatSources.useQuery({ clientId, fismaSystemId });
    const { data: threatEvents = [], isLoading: loadingEvents } = trpc.nist80030.listThreatEvents.useQuery({ clientId, fismaSystemId });

    // Mutations
    const saveSourceMutation = trpc.nist80030.saveThreatSource.useMutation({
        onSuccess: () => {
            utils.nist80030.listThreatSources.invalidate({ clientId, fismaSystemId });
            setSourceDialogOpen(false);
            toast.success("Threat source saved");
        },
        onError: (err: any) => toast.error(`Failed to save: ${err.message}`)
    });

    const deleteSourceMutation = trpc.nist80030.deleteThreatSource.useMutation({
        onSuccess: () => {
            utils.nist80030.listThreatSources.invalidate({ clientId });
            toast.success("Threat source deleted");
        }
    });

    const saveEventMutation = trpc.nist80030.saveThreatEvent.useMutation({
        onSuccess: () => {
            utils.nist80030.listThreatEvents.invalidate({ clientId, fismaSystemId });
            setEventDialogOpen(false);
            toast.success("Threat event saved");
        },
        onError: (err: any) => toast.error(`Failed to save: ${err.message}`)
    });

    const deleteEventMutation = trpc.nist80030.deleteThreatEvent.useMutation({
        onSuccess: () => {
            utils.nist80030.listThreatEvents.invalidate({ clientId });
            toast.success("Threat event deleted");
        }
    });

    // Dialog states
    const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
    const [eventDialogOpen, setEventDialogOpen] = useState(false);
    const [editingSource, setEditingSource] = useState<any>(null);
    const [editingEvent, setEditingEvent] = useState<any>(null);

    // Form state for source
    const [sourceForm, setSourceForm] = useState({
        type: "Adversarial" as string,
        name: "",
        description: "",
        capability: "Moderate",
        intent: "Moderate",
        targeting: "Moderate",
        motive: "",
    });

    // Form state for event
    const [eventForm, setEventForm] = useState({
        name: "",
        description: "",
        sourceType: "Adversarial" as string,
        relevance: "Confirmed",
        likelihood: "Moderate",
        vulnerabilitiesPredispositions: "",
        targetedAssets: "",
    });

    // Search
    const [searchQuery, setSearchQuery] = useState("");

    // Computed stats
    const sourceCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        THREAT_SOURCE_TYPES.forEach(t => counts[t] = 0);
        threatSources.forEach((s: any) => {
            counts[s.type] = (counts[s.type] || 0) + 1;
        });
        return counts;
    }, [threatSources]);

    const highLikelihoodCount = useMemo(() =>
        threatEvents.filter((e: any) => e.likelihood === "High" || e.likelihood === "Very High").length,
        [threatEvents]);

    const filteredEvents = useMemo(() => {
        if (!searchQuery) return threatEvents;
        const q = searchQuery.toLowerCase();
        return threatEvents.filter((e: any) =>
            e.name?.toLowerCase().includes(q) ||
            e.eventId?.toLowerCase().includes(q) ||
            e.sourceType?.toLowerCase().includes(q)
        );
    }, [threatEvents, searchQuery]);

    // Source dialog handlers
    const openNewSource = () => {
        setEditingSource(null);
        setSourceForm({ type: "Adversarial", name: "", description: "", capability: "Moderate", intent: "Moderate", targeting: "Moderate", motive: "" });
        setSourceDialogOpen(true);
    };

    const openEditSource = (source: any) => {
        setEditingSource(source);
        setSourceForm({
            type: source.type || "Adversarial",
            name: source.name || "",
            description: source.description || "",
            capability: source.capability || "Moderate",
            intent: source.intent || "Moderate",
            targeting: source.targeting || "Moderate",
            motive: source.motive || "",
        });
        setSourceDialogOpen(true);
    };

    const handleSaveSource = () => {
        if (!sourceForm.name.trim()) { toast.error("Name is required"); return; }
        saveSourceMutation.mutate({
            ...sourceForm,
            clientId,
            fismaSystemId,
            id: editingSource?.id
        });
    };

    // Event dialog handlers
    const openNewEvent = () => {
        setEditingEvent(null);
        setEventForm({ name: "", description: "", sourceType: "Adversarial", relevance: "Confirmed", likelihood: "Moderate", vulnerabilitiesPredispositions: "", targetedAssets: "" });
        setEventDialogOpen(true);
    };

    const openEditEvent = (event: any) => {
        setEditingEvent(event);
        setEventForm({
            name: event.name || "",
            description: event.description || "",
            sourceType: event.sourceType || "Adversarial",
            relevance: event.relevance || "Confirmed",
            likelihood: event.likelihood || "Moderate",
            vulnerabilitiesPredispositions: event.vulnerabilitiesPredispositions || "",
            targetedAssets: event.targetedAssets || "",
        });
        setEventDialogOpen(true);
    };

    const handleSaveEvent = () => {
        if (!eventForm.name.trim()) { toast.error("Event name is required"); return; }
        saveEventMutation.mutate({
            ...eventForm,
            clientId,
            fismaSystemId,
            id: editingEvent?.id
        });
    };

    // Reset state when systemId changes
    useEffect(() => {
        setSourceDialogOpen(false);
        setEventDialogOpen(false);
        setEditingSource(null);
        setEditingEvent(null);
        setSourceForm({ type: "Adversarial", name: "", description: "", capability: "Moderate", intent: "Moderate", targeting: "Moderate", motive: "" });
        setEventForm({ name: "", description: "", sourceType: "Adversarial", relevance: "Confirmed", likelihood: "Moderate", vulnerabilitiesPredispositions: "", targetedAssets: "" });
        setSearchQuery("");
        utils.nist80030.listThreatSources.invalidate({ clientId, fismaSystemId });
        utils.nist80030.listThreatEvents.invalidate({ clientId, fismaSystemId });
    }, [systemId, clientId, fismaSystemId, utils]);

    return (
        <NIST80030Layout>
            <div className="space-y-8 w-full px-4 sm:px-6 lg:px-8 pb-20">
                {/* Sticky Header */}
                <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 border-b border-slate-100">
                    <Breadcrumb
                        items={[
                            { label: "Dashboard", href: `/dashboard` },
                            { label: "NIST Hub", href: `/clients/${clientId}/nist` },
                            { label: "SP 800-30", href: `/clients/${clientId}/nist/800-30` },
                            { label: "Threat Modeling" },
                        ]}
                    />
                </div>

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
                        <Button onClick={openNewSource} variant="outline" className="rounded-2xl h-14 px-6 font-bold border-2 border-slate-100 hover:bg-slate-50 text-slate-600 gap-2">
                            <Plus className="w-4 h-4" /> Add Source
                        </Button>
                        <Button onClick={openNewEvent} className="bg-rose-600 hover:bg-rose-700 rounded-2xl h-14 px-8 shadow-xl shadow-rose-200/50 font-black text-lg gap-2">
                            <Plus className="w-5 h-5" /> Add Threat Event
                        </Button>
                    </div>
                </div>

                {/* Threat Source Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {THREAT_SOURCE_TYPES.map((sourceType, i) => {
                        const Icon = typeIcons[sourceType];
                        const color = typeColors[sourceType];
                        return (
                            <Card key={i} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden group cursor-pointer hover:shadow-xl transition-all" onClick={() => { setSourceForm(f => ({ ...f, type: sourceType })); openNewSource(); }}>
                                <CardContent className="p-8">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110",
                                        color === 'rose' ? "bg-rose-50 text-rose-600" :
                                            color === 'amber' ? "bg-amber-50 text-amber-600" :
                                                color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                                                    "bg-emerald-50 text-emerald-600"
                                    )}>
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">{sourceType}</h3>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{sourceCounts[sourceType]} Profiles Active</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 2xl:grid-cols-5 gap-8">
                    {/* Left: Intelligence & Sources */}
                    <div className="lg:col-span-1 2xl:col-span-1 space-y-6 lg:sticky lg:top-24 lg:self-start">
                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-slate-900 text-white overflow-hidden relative">
                            <CardHeader className="relative z-10 pb-2">
                                <CardTitle className="text-rose-400 text-xs font-black uppercase tracking-widest">Threat Sources</CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10 space-y-4">
                                {loadingSources ? (
                                    <div className="animate-pulse space-y-3">
                                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/10 rounded-2xl" />)}
                                    </div>
                                ) : threatSources.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400">
                                        <p className="font-medium text-sm">No sources yet</p>
                                        <p className="text-xs mt-1">Click "Add Source" to create one</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                                        {threatSources.map((source: any, i: number) => (
                                            <div key={source.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2 group/item hover:bg-white/10 transition-colors">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-sm truncate flex-1">{source.name}</span>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:text-white" onClick={() => openEditSource(source)}>
                                                            <Pencil className="w-3 h-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:text-rose-400" onClick={() => deleteSourceMutation.mutate({ clientId, id: source.id })}>
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-rose-500/20 text-rose-400 border-none font-black text-[10px]">{source.capability || 'Unknown'}</Badge>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{source.type}</span>
                                                </div>
                                                {source.motive && (
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        <Target className="w-3 h-3" /> Motive: {source.motive}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <Button onClick={openNewSource} className="w-full bg-rose-600 hover:bg-rose-700 font-bold h-12 rounded-xl gap-2">
                                    <Plus className="w-4 h-4" /> New Source
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
                                    <span className="text-sm font-bold text-slate-600">Total Events</span>
                                    <Badge variant="secondary" className="font-black bg-white">{threatEvents.length}</Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                    <span className="text-sm font-bold text-slate-600">High Likelihood</span>
                                    <Badge variant="secondary" className="font-black bg-rose-50 text-rose-600">{highLikelihoodCount}</Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                    <span className="text-sm font-bold text-slate-600">Sources</span>
                                    <Badge variant="secondary" className="font-black bg-white">{threatSources.length}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Events & Scenarios */}
                    <Card className="lg:col-span-3 2xl:col-span-4 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[2.5rem] overflow-hidden">
                        <Tabs defaultValue="events" className="w-full">
                            <div className="border-b px-8 bg-slate-50/50">
                                <TabsList className="h-16 bg-transparent gap-8">
                                    <TabsTrigger value="events" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-rose-600 data-[state=active]:shadow-lg data-[state=active]:shadow-rose-100 data-[state=active]:text-rose-700 rounded-t-lg font-bold text-xs uppercase tracking-widest px-6 py-3 transition-all -mb-[2px]">
                                        Threat Events ({threatEvents.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="scenarios" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-rose-600 data-[state=active]:shadow-lg data-[state=active]:shadow-rose-100 data-[state=active]:text-rose-700 rounded-t-lg font-bold text-xs uppercase tracking-widest px-6 py-3 transition-all -mb-[2px]">
                                        Threat Scenarios
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="events" className="p-10 space-y-8 m-0">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Identify Threat Events (T-2)</h3>
                                        <p className="text-sm text-slate-500 font-medium">Characterize potential threat events based on the identified sources.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                placeholder="Search events..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10 rounded-xl w-64"
                                            />
                                        </div>
                                        <Button onClick={openNewEvent} className="bg-rose-600 hover:bg-rose-700 rounded-xl font-bold h-10 px-4 gap-2">
                                            <Plus className="w-4 h-4" /> Add Event
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {loadingEvents ? (
                                        <div className="animate-pulse space-y-4">
                                            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-50 rounded-[2.5rem]" />)}
                                        </div>
                                    ) : filteredEvents.length === 0 ? (
                                        <div className="text-center py-16 text-slate-400">
                                            <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                                            <p className="font-bold text-lg">No threat events yet</p>
                                            <p className="text-sm mt-1">Create your first threat event to start the risk assessment</p>
                                            <Button onClick={openNewEvent} className="mt-4 bg-rose-600 hover:bg-rose-700 rounded-xl font-bold gap-2">
                                                <Plus className="w-4 h-4" /> Add Threat Event
                                            </Button>
                                        </div>
                                    ) : (
                                        filteredEvents.map((te: any) => (
                                            <div key={te.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] flex items-center justify-between hover:shadow-lg transition-all group">
                                                <div className="flex items-center gap-5 flex-1 min-w-0">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-rose-600 group-hover:text-white transition-all shrink-0">
                                                        <span className="font-black text-xs uppercase">{te.eventId?.split('-')[1] || '#'}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-lg font-black text-slate-900 leading-tight truncate">{te.name}</h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <Badge variant="outline" className="text-[9px] font-black tracking-widest border-slate-100">{te.sourceType}</Badge>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{te.relevance}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Likelihood</p>
                                                        <p className={cn(
                                                            "font-black text-xs",
                                                            te.likelihood === 'Very High' || te.likelihood === 'High' ? "text-rose-500" :
                                                                te.likelihood === 'Moderate' ? "text-amber-500" : "text-emerald-500"
                                                        )}>{te.likelihood}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-slate-300 hover:text-rose-600" onClick={() => openEditEvent(te)}>
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-slate-300 hover:text-rose-600" onClick={() => deleteEventMutation.mutate({ clientId, id: te.id })}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
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
                                            "Based on your {threatSources.length} threat sources and {threatEvents.length} events, AI can generate attack paths aligned to your asset inventory."
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
                                                <span className="font-black text-slate-900">{threatEvents.length}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-slate-500">THREAT SOURCES</span>
                                                <span className="font-black text-slate-900">{threatSources.length}</span>
                                            </div>
                                            <Progress value={threatSources.length > 0 ? Math.min((threatEvents.length / Math.max(threatSources.length, 1)) * 25, 100) : 0} className="h-1 bg-white" indicatorClassName="bg-rose-500" />
                                        </div>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </div>
            </div>

            {/* Source Dialog */}
            <Dialog open={sourceDialogOpen} onOpenChange={setSourceDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-black">{editingSource ? 'Edit' : 'New'} Threat Source</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="font-bold">Source Type</Label>
                            <Select value={sourceForm.type} onValueChange={(v) => setSourceForm(f => ({ ...f, type: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {THREAT_SOURCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Name *</Label>
                            <Input value={sourceForm.name} onChange={(e) => setSourceForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., APT-28 / Fancy Bear" />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Description</Label>
                            <Textarea value={sourceForm.description} onChange={(e) => setSourceForm(f => ({ ...f, description: e.target.value }))} placeholder="Description of the threat source..." rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold">Capability</Label>
                                <Select value={sourceForm.capability} onValueChange={(v) => setSourceForm(f => ({ ...f, capability: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CAPABILITY_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Intent</Label>
                                <Select value={sourceForm.intent} onValueChange={(v) => setSourceForm(f => ({ ...f, intent: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CAPABILITY_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Motive</Label>
                            <Input value={sourceForm.motive} onChange={(e) => setSourceForm(f => ({ ...f, motive: e.target.value }))} placeholder="e.g., Espionage, IP Theft, Disruption" />
                        </div>
                        <Button onClick={handleSaveSource} disabled={saveSourceMutation.isPending} className="w-full bg-rose-600 hover:bg-rose-700 rounded-xl h-12 font-bold">
                            {saveSourceMutation.isPending ? "Saving..." : (editingSource ? "Update Source" : "Create Source")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Event Dialog */}
            <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-black">{editingEvent ? 'Edit' : 'New'} Threat Event</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="font-bold">Event Name *</Label>
                            <Input value={eventForm.name} onChange={(e) => setEventForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., SQL Injection on Public API" />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Description</Label>
                            <Textarea value={eventForm.description} onChange={(e) => setEventForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the threat event..." rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold">Source Type</Label>
                                <Select value={eventForm.sourceType} onValueChange={(v) => setEventForm(f => ({ ...f, sourceType: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {THREAT_SOURCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Relevance</Label>
                                <Select value={eventForm.relevance} onValueChange={(v) => setEventForm(f => ({ ...f, relevance: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {RELEVANCE_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Likelihood</Label>
                            <Select value={eventForm.likelihood} onValueChange={(v) => setEventForm(f => ({ ...f, likelihood: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {LIKELIHOOD_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Targeted Assets</Label>
                            <Input value={eventForm.targetedAssets} onChange={(e) => setEventForm(f => ({ ...f, targetedAssets: e.target.value }))} placeholder="e.g., Public API, Customer DB" />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Vulnerabilities / Predispositions</Label>
                            <Textarea value={eventForm.vulnerabilitiesPredispositions} onChange={(e) => setEventForm(f => ({ ...f, vulnerabilitiesPredispositions: e.target.value }))} placeholder="Known vulnerabilities or conditions that increase susceptibility..." rows={2} />
                        </div>
                        <Button onClick={handleSaveEvent} disabled={saveEventMutation.isPending} className="w-full bg-rose-600 hover:bg-rose-700 rounded-xl h-12 font-bold">
                            {saveEventMutation.isPending ? "Saving..." : (editingEvent ? "Update Event" : "Create Event")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </NIST80030Layout>
    );
}
