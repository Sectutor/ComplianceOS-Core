import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    FileText, CheckCircle2, Clock, AlertCircle,
    Sparkles, Inbox, Search, Filter, MoreHorizontal,
    Users, Building2, ArrowUpRight, Palette
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@complianceos/ui/ui/table";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@complianceos/ui/ui/dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { Plus, Trash2, Edit, Save, Globe, Lock, Share } from "lucide-react";
import { toast } from "sonner";
import { PremiumSlot } from "@/components/PremiumSlot";
import { useClientContext } from "@/contexts/ClientContext";

export default function AdvisorWorkbench() {
    const [, setLocation] = useLocation();
    const { selectedClientId, planTier } = useClientContext();
    const { data: allIntakeItems, isLoading } = trpc.intake.listAll.useQuery();
    const { data: clients, refetch: refetchClients } = trpc.clients.list.useQuery();
    const utils = trpc.useUtils();
    const isPremium = planTier === 'pro' || planTier === 'enterprise';
    const updateMutation = trpc.clients.updateContactInfo.useMutation();
    const updateBrandingMutation = trpc.clients.update.useMutation({
        onSuccess: () => {
            setBrandingClient(null);
            refetchClients();
            utils.clients.get.invalidate();
            toast.success("Branding updated successfully");
        },
        onError: (err) => {
            toast.error("Failed to update branding: " + err.message);
        }
    });

    const [brandingClient, setBrandingClient] = useState<any>(null);
    const [brandingForm, setBrandingForm] = useState({
        brandPrimaryColor: "",
        brandSecondaryColor: "",
        portalTitle: ""
    });

    const openBranding = (client: any) => {
        setBrandingClient(client);
        setBrandingForm({
            brandPrimaryColor: client.brandPrimaryColor || "#4f46e5",
            brandSecondaryColor: client.brandSecondaryColor || "#eef2ff",
            portalTitle: client.portalTitle || client.name
        });
    };

    const saveBranding = () => {
        if (!brandingClient) return;
        updateBrandingMutation.mutate({
            id: brandingClient.id,
            ...brandingForm
        });
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <PremiumSlot
                    featureId="advisor_workbench"
                    title="Advisor Workbench"
                    description="AI-powered centralized triage, multi-client branding, and proactive compliance suggestions."
                    isPremiumEnabled={isPremium}
                >
                    <Tabs defaultValue="dashboard" className="w-full">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-3">
                                    <Sparkles className="h-8 w-8 text-indigo-600" />
                                    Advisor Workbench
                                    <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none px-3 py-1 text-[10px] font-bold tracking-widest shadow-lg shadow-indigo-200 uppercase">
                                        Premium
                                    </Badge>
                                </h1>
                                <p className="text-muted-foreground mt-1 text-lg">
                                    Centralized Evidence Triage. Manage intake items across all managed clients.
                                </p>
                            </div>
                            <TabsList>
                                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                                <TabsTrigger value="library">My Library</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="dashboard" className="space-y-8">
                            <div className="flex justify-end gap-4">
                                <Card className="px-6 py-2 bg-slate-50 border-slate-200">
                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Active Clients</div>
                                    <div className="text-2xl font-bold text-slate-900">12</div>
                                </Card>
                                <Card className="px-6 py-2 bg-indigo-50 border-indigo-100">
                                    <div className="text-xs text-indigo-500 uppercase font-bold tracking-wider">Pending Triage</div>
                                    <div className="text-2xl font-bold text-indigo-700">{allIntakeItems?.filter(i => i.status === 'pending').length || 0}</div>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Global Intake Queue */}
                                <Card className="shadow-lg border-slate-200 lg:col-span-2">
                                    <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>Global Intake Queue</CardTitle>
                                            <CardDescription>Review and map evidence for all clients.</CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm">
                                                <Search className="h-4 w-4 mr-2" /> Search
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50/30">
                                                    <TableHead className="w-[150px]">Client</TableHead>
                                                    <TableHead>File Name</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>AI Suggestion</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {isLoading ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-20 text-slate-400 italic">
                                                            Loading global queue...
                                                        </TableCell>
                                                    </TableRow>
                                                ) : allIntakeItems?.map((item) => (
                                                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Building2 className="h-4 w-4 text-slate-400" />
                                                                <span className="font-semibold text-slate-700 truncate max-w-[120px]">{item.clientName}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-slate-400" />
                                                                <span className="truncate max-w-[150px]">{item.filename}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={item.status === 'mapped' ? 'success' : item.status === 'classified' ? 'secondary' : 'outline'}
                                                                className="capitalize"
                                                            >
                                                                {item.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1 text-sm text-slate-600">
                                                                <Sparkles className="h-3 w-3 text-amber-500" />
                                                                {item.classification || "Pending AI"}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 text-indigo-600 hover:bg-indigo-50"
                                                                onClick={() => setLocation(`/clients/${item.clientId}/intake`)}
                                                            >
                                                                Triage <ArrowUpRight className="h-3 w-3 ml-1" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                {/* Proactive AI Suggestions Panel */}
                                <Card className="shadow-lg border-indigo-100 bg-indigo-50/10">
                                    <CardHeader className="bg-white/50 border-b border-indigo-100">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-5 w-5 text-indigo-600" />
                                            <CardTitle className="text-indigo-900">Proactive AI Suggestions</CardTitle>
                                        </div>
                                        <CardDescription>Automated drift detection & optimizations</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-4">
                                        <ProactiveSuggestionsPanel />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Client Portfolio Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <Users className="h-6 w-6 text-indigo-600" />
                                        Client Portfolio Management
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {clients?.filter(c => c.serviceModel !== 'subscription').map(client => (
                                        <Card key={client.id} className="border-slate-200 hover:shadow-md transition-shadow">
                                            <CardHeader className="pb-2">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <CardTitle className="text-lg">{client.name}</CardTitle>
                                                        <CardDescription>{client.industry}</CardDescription>
                                                    </div>
                                                    <Badge variant={client.serviceModel === 'managed' ? 'success' : 'secondary'}>
                                                        {client.serviceModel}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Weekly Focus</label>
                                                    <textarea
                                                        className="w-full min-h-[80px] text-sm p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                                                        placeholder="Set the goal for this week..."
                                                        defaultValue={client.weeklyFocus || ''}
                                                        onBlur={(e) => {
                                                            updateMutation.mutate({
                                                                clientId: client.id,
                                                                weeklyFocus: e.target.value
                                                            });
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500">Compliance Score</span>
                                                    <span className="font-bold text-indigo-600">{client.targetComplianceScore || 0}%</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 text-slate-600"
                                                        onClick={() => openBranding(client)}
                                                        size="sm"
                                                    >
                                                        <Palette className="w-4 h-4 mr-2" /> Branding
                                                    </Button>
                                                    <Button
                                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                                                        size="sm"
                                                        onClick={() => setLocation(`/clients/${client.id}`)}
                                                    >
                                                        Workspace <ArrowUpRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="library">
                            <TemplateLibrary />
                        </TabsContent>
                    </Tabs>
                </PremiumSlot>
            </div>

            {/* Branding Dialog */}
            <Dialog open={!!brandingClient} onOpenChange={(o) => !o && setBrandingClient(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Client Branding: {brandingClient?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label>Portal Title</Label>
                            <Input
                                value={brandingForm.portalTitle}
                                onChange={e => setBrandingForm({ ...brandingForm, portalTitle: e.target.value })}
                                placeholder="Compliance Portal"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Primary Color</Label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        className="h-9 w-12 rounded-lg border-2 border-slate-200 p-0.5 cursor-pointer bg-white transition-all hover:scale-105"
                                        value={brandingForm.brandPrimaryColor?.startsWith('#') ? brandingForm.brandPrimaryColor : `#${brandingForm.brandPrimaryColor || '4f46e5'}`}
                                        onChange={e => setBrandingForm({ ...brandingForm, brandPrimaryColor: e.target.value })}
                                    />
                                    <Input
                                        value={brandingForm.brandPrimaryColor}
                                        onChange={e => setBrandingForm({ ...brandingForm, brandPrimaryColor: e.target.value })}
                                        placeholder="#4f46e5"
                                        className="font-mono text-xs"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Secondary Color</Label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        className="h-9 w-12 rounded-lg border-2 border-slate-200 p-0.5 cursor-pointer bg-white transition-all hover:scale-105"
                                        value={brandingForm.brandSecondaryColor?.startsWith('#') ? brandingForm.brandSecondaryColor : `#${brandingForm.brandSecondaryColor || 'eef2ff'}`}
                                        onChange={e => setBrandingForm({ ...brandingForm, brandSecondaryColor: e.target.value })}
                                    />
                                    <Input
                                        value={brandingForm.brandSecondaryColor}
                                        onChange={e => setBrandingForm({ ...brandingForm, brandSecondaryColor: e.target.value })}
                                        placeholder="#eef2ff"
                                        className="font-mono text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Visual Preview */}
                        <div className="mt-6 p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                            <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-3 block">Live Preview</Label>
                            <div className="flex gap-4 items-start">
                                {/* Mini Sidebar Preview */}
                                <div
                                    className="w-24 rounded-lg overflow-hidden shadow-lg border border-slate-200 transition-all duration-300"
                                    style={{
                                        backgroundColor: brandingForm.brandPrimaryColor?.startsWith('#') ? brandingForm.brandPrimaryColor : `#${brandingForm.brandPrimaryColor || '4f46e5'}`
                                    }}
                                >
                                    <div className="p-2 border-b border-white/10">
                                        <div className="h-1.5 w-12 bg-white/20 rounded mb-1" />
                                        <div className="h-3 w-16 bg-white rounded-sm" style={{ backgroundColor: brandingForm.brandSecondaryColor?.startsWith('#') ? brandingForm.brandSecondaryColor : `#${brandingForm.brandSecondaryColor || 'ffffff'}` }} />
                                    </div>
                                    <div className="p-2 space-y-1.5">
                                        <div className="h-2 w-full bg-white/10 rounded" />
                                        <div className="h-2 w-[80%] bg-white/10 rounded" />
                                        <div className="h-2 w-[90%] bg-white/20 rounded" />
                                        <div className="h-2 w-[70%] bg-white/10 rounded" />
                                    </div>
                                </div>

                                {/* Mini UI Preview */}
                                <div className="flex-1 space-y-2">
                                    <div className="text-sm font-bold truncate">
                                        {brandingForm.portalTitle || brandingClient?.name}
                                    </div>
                                    <div className="flex gap-2">
                                        <div
                                            className="h-6 w-16 rounded text-[8px] flex items-center justify-center font-bold text-white shadow-sm"
                                            style={{ backgroundColor: brandingForm.brandPrimaryColor?.startsWith('#') ? brandingForm.brandPrimaryColor : `#${brandingForm.brandPrimaryColor || '4f46e5'}` }}
                                        >
                                            PRIMARY
                                        </div>
                                        <div
                                            className="h-6 w-16 rounded text-[8px] flex items-center justify-center font-bold border"
                                            style={{
                                                backgroundColor: brandingForm.brandSecondaryColor?.startsWith('#') ? brandingForm.brandSecondaryColor : `#${brandingForm.brandSecondaryColor || 'eef2ff'}`,
                                                color: brandingForm.brandPrimaryColor?.startsWith('#') ? brandingForm.brandPrimaryColor : `#${brandingForm.brandPrimaryColor || '4f46e5'}`,
                                                borderColor: brandingForm.brandPrimaryColor?.startsWith('#') ? brandingForm.brandPrimaryColor : `#${brandingForm.brandPrimaryColor || '4f46e5'}`
                                            }}
                                        >
                                            SECONDARY
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={saveBranding}>Save Branding</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

function ProactiveSuggestionsPanel() {
    const { data: suggestions, isLoading } = trpc.proactiveAdvisor.listAllSuggestions.useQuery();
    const applyMutation = trpc.proactiveAdvisor.applyRecommendation.useMutation();

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }

    if (!suggestions || suggestions.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400">
                No active suggestions. System is healthy.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {suggestions.map((s) => (
                <div key={s.id} className="p-3 bg-white rounded-lg border border-indigo-100 shadow-sm space-y-2 hover:border-indigo-300 transition-colors">
                    <div className="flex items-start justify-between">
                        <Badge
                            variant={s.severity === 'high' ? 'destructive' : s.severity === 'medium' ? 'warning' : 'secondary'}
                            className="text-[10px] uppercase font-bold px-1.5 py-0"
                        >
                            {s.severity}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{s.clientName}</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-slate-900">{s.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{s.description}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 text-xs text-indigo-600 hover:bg-indigo-50 border border-indigo-50"
                        onClick={() => {
                            applyMutation.mutate({
                                clientId: s.clientId || 0,
                                suggestionId: s.id,
                                action: s.recommendedAction
                            });
                        }}
                    >
                        Apply Fix
                    </Button>
                </div>
            ))}
        </div>
    );
}

function TemplateLibrary() {
    const { data: templates, refetch } = trpc.policyTemplates.list.useQuery();
    const createMutation = trpc.policyTemplates.create.useMutation({ onSuccess: () => refetch() });
    const deleteMutation = trpc.policyTemplates.delete.useMutation({ onSuccess: () => refetch() });
    const deployMutation = trpc.policyTemplates.deploy.useMutation();
    const { data: clients } = trpc.clients.list.useQuery();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: "", content: "", isPublic: false });

    // Deployment state
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [selectedClients, setSelectedClients] = useState<number[]>([]);
    const [isDeployOpen, setIsDeployOpen] = useState(false);

    const handleCreate = () => {
        createMutation.mutate(newTemplate);
        setIsCreateOpen(false);
        setNewTemplate({ name: "", content: "", isPublic: false });
    };

    const handleDeploy = () => {
        if (!selectedTemplate || selectedClients.length === 0) return;
        deployMutation.mutate({ templateId: selectedTemplate, clientIds: selectedClients });
        setIsDeployOpen(false);
        setSelectedClients([]);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Consultant Template Library</CardTitle>
                    <CardDescription>Manage your private policy templates and deploys them to clients.</CardDescription>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> New Template</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create New Template</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Template Name</Label>
                                <Input value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Default Content (Markdown)</Label>
                                <Textarea className="min-h-[200px]" value={newTemplate.content} onChange={e => setNewTemplate({ ...newTemplate, content: e.target.value })} />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="public" checked={newTemplate.isPublic} onCheckedChange={(c) => setNewTemplate({ ...newTemplate, isPublic: !!c })} />
                                <Label htmlFor="public">Make Public (Share with other consultants)</Label>
                            </div>
                        </div>
                        <DialogFooter><Button onClick={handleCreate}>Create Template</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Template Name</TableHead>
                            <TableHead>Visibility</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {templates?.map(t => (
                            <TableRow key={t.id}>
                                <TableCell className="font-medium">{t.name}</TableCell>
                                <TableCell>
                                    {t.isPublic ? <Badge variant="secondary"><Globe className="w-3 h-3 mr-1" /> Public</Badge> : <Badge variant="outline"><Lock className="w-3 h-3 mr-1" /> Private</Badge>}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => { setSelectedTemplate(t.templateId); setIsDeployOpen(true); }}>
                                        <Share className="w-3 h-3 mr-1" /> Deploy
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: t.id })}>
                                        <Trash2 className="w-3 h-3 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <Dialog open={isDeployOpen} onOpenChange={setIsDeployOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Deploy Template to Clients</DialogTitle></DialogHeader>
                        <div className="py-4 space-y-2 max-h-[60vh] overflow-y-auto">
                            <Label>Select Target Clients</Label>
                            {clients?.map(c => (
                                <div key={c.id} className="flex items-center space-x-2 border p-2 rounded hover:bg-slate-50">
                                    <Checkbox
                                        checked={selectedClients.includes(c.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) setSelectedClients([...selectedClients, c.id]);
                                            else setSelectedClients(selectedClients.filter(id => id !== c.id));
                                        }}
                                    />
                                    <span>{c.name}</span>
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button onClick={handleDeploy} disabled={selectedClients.length === 0}>
                                {deployMutation.isLoading ? "Deploying..." : `Deploy to ${selectedClients.length} Clients`}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
