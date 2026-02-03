import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Switch } from "@complianceos/ui/ui/switch";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Badge } from "@complianceos/ui/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Loader2, Plus, Trash2, Edit, Play, CheckCircle2, XCircle, Monitor, Network, ServerCog, Cpu, ShieldAlert, FileText, Briefcase } from "lucide-react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@complianceos/ui/ui/alert-dialog";

const FEATURES = [
    { id: 'general_advisor', name: 'General AI Advisor', description: 'Chat and general Q&A', icon: Monitor },
    { id: 'risk_analysis', name: 'Risk Analysis', description: 'Auto-triage and risk scoring', icon: ShieldAlert },
    { id: 'policy_generation', name: 'Policy Drafting', description: 'Drafting and tailoring policies', icon: FileText },
    { id: 'tech_suggestion', name: 'Technology Suggestions', description: 'Recommending controls/tools', icon: ServerCog },
    { id: 'implementation_plan', name: 'Implementation Planning', description: 'Generating step-by-step plans', icon: Briefcase },
    { id: 'explain_mapping', name: 'Regulation Mapping', description: 'Explaining compliance mapping', icon: Network },
    { id: 'vendor_mitigation', name: 'Vendor Mitigation', description: 'Vendor risk remediation plans', icon: Cpu },
];

export default function LLMSettings() {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        provider: "openai",
        model: "",
        apiKey: "",
        baseUrl: "",
        priority: "0",
        isEnabled: true,
        supportsEmbeddings: false
    });

    // Test State
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    const [providerToDelete, setProviderToDelete] = useState<any>(null);

    const utils = trpc.useUtils();
    const { data: providers, isLoading } = trpc.llm.list.useQuery();
    const { data: routes } = trpc.llm.getRoutes.useQuery();

    const setRouteMutation = trpc.llm.setRoute.useMutation({
        onSuccess: () => {
            toast.success("Routing rule updated");
            utils.llm.getRoutes.invalidate();
        },
        onError: (err) => toast.error(err.message)
    });

    const createMutation = trpc.llm.create.useMutation({
        onSuccess: () => {
            toast.success("Provider added successfully");
            setIsAddOpen(false);
            resetForm();
            utils.llm.list.invalidate();
        },
        onError: (err) => toast.error(err.message)
    });

    const updateMutation = trpc.llm.update.useMutation({
        onSuccess: () => {
            toast.success("Provider updated");
            setIsAddOpen(false);
            setEditingId(null);
            resetForm();
            utils.llm.list.invalidate();
        },
        onError: (err) => toast.error(err.message)
    });

    const deleteMutation = trpc.llm.delete.useMutation({
        onSuccess: () => {
            toast.success("Provider deleted");
            setProviderToDelete(null);
            utils.llm.list.invalidate();
        },
        onError: (err) => toast.error(err.message)
    });

    const testMutation = trpc.llm.test.useMutation({
        onSuccess: (result) => {
            setTestResult({
                success: !!result,
                message: result ? "Connection successful!" : "Connection failed (empty response)"
            });
        },
        onError: (err) => {
            setTestResult({ success: false, message: err.message });
        }
    });

    const [lastIndexStats, setLastIndexStats] = useState<any>(null);
    const reindexMutation = trpc.advisor.reindexContent.useMutation({
        onSuccess: (res) => {
            toast.success("Indexing completed successfully");
            setLastIndexStats(res.stats);
        },
        onError: (err) => toast.error("Indexing failed: " + err.message)
    });

    const resetForm = () => {
        setFormData({
            name: "",
            provider: "openai",
            model: "",
            apiKey: "",
            baseUrl: "",
            priority: "0",
            isEnabled: true,
            supportsEmbeddings: false
        });
        setTestResult(null);
    };

    const handleEdit = (provider: any) => {
        setFormData({
            name: provider.name,
            provider: provider.provider,
            model: provider.model,
            apiKey: "", // Don't fill API key for security, user must re-enter if changing
            baseUrl: provider.baseUrl || "",
            priority: provider.priority.toString(),
            isEnabled: provider.isEnabled,
            supportsEmbeddings: provider.supportsEmbeddings || false
        });
        setEditingId(provider.id);
        setIsAddOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: formData.name,
            provider: formData.provider,
            model: formData.model,
            apiKey: formData.apiKey,
            baseUrl: formData.baseUrl || undefined,
            priority: parseInt(formData.priority),
            isEnabled: formData.isEnabled,
            supportsEmbeddings: formData.supportsEmbeddings
        };

        if (editingId) {
            // If editing, apiKey is optional
            if (!payload.apiKey) delete (payload as any).apiKey;
            updateMutation.mutate({ id: editingId, ...payload });
        } else {
            if (!payload.apiKey) {
                toast.error("API Key is required");
                return;
            }
            createMutation.mutate(payload as any);
        }
    };

    const handleTest = async () => {
        if (!formData.apiKey && !editingId) {
            toast.error("Enter an API Key to test");
            return;
        }
        // Note: Test endpoint expects apiKey. If editing and field is empty, we can't test unless we handle it backend side.
        // For now, only test if key provided.
        if (!formData.apiKey) {
            toast.error("Please re-enter API Key to test connection");
            return;
        }

        setIsTesting(true);
        setTestResult(null);
        testMutation.mutate({
            apiKey: formData.apiKey,
            baseUrl: formData.baseUrl || undefined,
            model: formData.model
        }, {
            onSettled: () => setIsTesting(false)
        });
    };

    return (
        <DashboardLayout>
            <div className="container py-6 max-w-5xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">AI & LLM Settings</h1>
                        <p className="text-muted-foreground mt-1">
                            Configure and prioritize the AI models used for policy generation and analysis.
                        </p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsAddOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Provider
                    </Button>
                </div>

                <EnhancedDialog
                    open={isAddOpen}
                    onOpenChange={(open) => { setIsAddOpen(open); if (!open) { setEditingId(null); resetForm(); } }}
                    title={editingId ? "Edit Provider" : "Add LLM Provider"}
                    description="Add a new AI provider using your own API key. Keys are encrypted at rest."
                    footer={
                        <div className="flex justify-end gap-2 w-full">
                            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button
                                onClick={(e) => {
                                    const form = document.getElementById('llm-provider-form') as HTMLFormElement;
                                    if (form) form.requestSubmit();
                                }}
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {editingId ? "Save Changes" : "Create Provider"}
                            </Button>
                        </div>
                    }
                    size="lg"
                >
                    <form id="llm-provider-form" onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-semibold text-foreground/80">Name</Label>
                                <Input
                                    placeholder="My OpenAI"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="border-2 border-slate-300 bg-slate-50 focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold text-foreground/80">Provider Type</Label>
                                <Select
                                    value={formData.provider}
                                    onValueChange={v => setFormData({ ...formData, provider: v })}
                                >
                                    <SelectTrigger className="border-2 border-slate-300 bg-slate-50 focus:ring-2 focus:ring-primary/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="openai">OpenAI</SelectItem>
                                        <SelectItem value="anthropic">Anthropic</SelectItem>
                                        <SelectItem value="gemini">Gemini (Google)</SelectItem>
                                        <SelectItem value="deepseek">DeepSeek</SelectItem>
                                        <SelectItem value="qwen">Qwen / Gwen</SelectItem>
                                        <SelectItem value="openrouter">OpenRouter</SelectItem>
                                        <SelectItem value="custom">Custom (OpenAI Compat)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-semibold text-foreground/80">Model Name</Label>
                            <Input
                                placeholder="e.g. gpt-4, deepseek-coder, gemini-1.5-flash"
                                value={formData.model}
                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                                required
                                className="border-2 border-slate-300 bg-slate-50 focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-semibold text-foreground/80">API Key {editingId && "(Leave blank to keep unchanged)"}</Label>
                            <Input
                                type="password"
                                placeholder="sk-..."
                                value={formData.apiKey}
                                onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                                className="border-2 border-slate-300 bg-slate-50 focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-semibold text-foreground/80">Base URL (Optional)</Label>
                            <Input
                                placeholder="e.g. https://api.deepseek.com/v1"
                                value={formData.baseUrl}
                                onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
                                className="border-2 border-slate-300 bg-slate-50 focus:ring-2 focus:ring-primary/20"
                            />
                            <p className="text-[10px] text-muted-foreground">Required for DeepSeek, Custom, or Local LLMs.</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="space-y-2 flex-1">
                                <Label className="font-semibold text-foreground/80">Priority (Higher = Preferred)</Label>
                                <Input
                                    type="number"
                                    value={formData.priority}
                                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                    className="border-2 border-slate-300 bg-slate-50 focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-6">
                                <Switch
                                    id="enabled"
                                    checked={formData.isEnabled}
                                    onCheckedChange={c => setFormData({ ...formData, isEnabled: c })}
                                />
                                <Label htmlFor="enabled">Enabled</Label>
                            </div>
                            <div className="flex items-center space-x-2 pt-6">
                                <Switch
                                    id="embeddings"
                                    checked={formData.supportsEmbeddings}
                                    onCheckedChange={c => setFormData({ ...formData, supportsEmbeddings: c })}
                                />
                                <Label htmlFor="embeddings">Embeddings</Label>
                            </div>
                        </div>

                        {/* Test Connection Section */}
                        <div className="pt-2 border-t flex items-center justify-between">
                            <Button type="button" variant="outline" size="sm" onClick={handleTest} disabled={isTesting}>
                                {isTesting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Play className="mr-2 h-3 w-3" />}
                                Test Connection
                            </Button>
                            {testResult && (
                                <span className={`text-xs flex items-center ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                                    {testResult.success ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                    {testResult.message}
                                </span>
                            )}
                        </div>
                    </form>
                </EnhancedDialog>

                <Tabs defaultValue="providers" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="providers">LLM Providers</TabsTrigger>
                        <TabsTrigger value="routing">Dynamic Routing</TabsTrigger>
                        <TabsTrigger value="indexing">Data & Indexing</TabsTrigger>
                    </TabsList>

                    <TabsContent value="providers">
                        {isLoading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {providers?.map((provider) => (
                                    <Card key={provider.id} className={!provider.isEnabled ? "opacity-60 bg-muted/30" : ""}>
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {provider.priority}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold flex items-center gap-2">
                                                        {provider.name}
                                                        {provider.isEnabled ? (
                                                            <Badge variant="default" className="text-[10px] h-5">Active</Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-[10px] h-5">Disabled</Badge>
                                                        )}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <span className="capitalize">{provider.provider}</span>
                                                        <span>•</span>
                                                        <span className="font-mono text-xs">{provider.model}</span>
                                                        {provider.baseUrl && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-xs truncate max-w-[200px]">{provider.baseUrl}</span>
                                                            </>
                                                        )}
                                                        {provider.supportsEmbeddings && (
                                                            <>
                                                                <span>•</span>
                                                                <Badge variant="outline" className="text-[10px] h-4 px-1 bg-blue-50 text-blue-700 border-blue-200">Embeddings</Badge>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(provider)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => setProviderToDelete(provider)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {providers?.length === 0 && (
                                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                        <p className="text-muted-foreground">No AI providers configured.</p>
                                        <Button variant="link" onClick={() => setIsAddOpen(true)}>Add your first provider</Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="routing" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Feature Routing Rules</CardTitle>
                                <CardDescription>Configure which AI model handles each specific task. Leave "Default" to use the highest priority allowed provider.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {FEATURES.map(feature => {
                                        // Find current route rule
                                        const currentRule = routes?.find(r => r.feature === feature.id);
                                        const FeatureIcon = feature.icon;

                                        return (
                                            <div key={feature.id} className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                                                        <FeatureIcon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold">{feature.name}</h4>
                                                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                                                    </div>
                                                </div>
                                                <div className="w-[300px]">
                                                    <Select
                                                        value={currentRule?.providerId ? currentRule.providerId.toString() : "default"}
                                                        onValueChange={(val) => {
                                                            const providerId = val === "default" ? null : parseInt(val);
                                                            setRouteMutation.mutate({ feature: feature.id, providerId });
                                                        }}
                                                        disabled={setRouteMutation.isPending}
                                                    >
                                                        <SelectTrigger className="bg-white">
                                                            <SelectValue placeholder="Default (Highest Priority)" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="default">Default Provider (Highest Priority)</SelectItem>
                                                            {providers?.filter(p => p.isEnabled).map(provider => (
                                                                <SelectItem key={provider.id} value={provider.id.toString()}>
                                                                    {provider.name} ({provider.model})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="indexing" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Knowledge Base Indexing</CardTitle>
                                <CardDescription>Manage the vector index used for RAG (Retrieval-Augmented Generation). Re-index content if AI responses seem outdated.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="border rounded-lg p-4 bg-slate-50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                            <h4 className="font-semibold">Policies</h4>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">Index all generated policies for context-aware drafting.</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => reindexMutation.mutate({ type: 'policies' })}
                                            disabled={reindexMutation.isPending}
                                        >
                                            {reindexMutation.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Play className="mr-2 h-3 w-3" />}
                                            Re-index Policies
                                        </Button>
                                    </div>

                                    <div className="border rounded-lg p-4 bg-slate-50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Briefcase className="h-5 w-5 text-green-600" />
                                            <h4 className="font-semibold">Evidence</h4>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">Index uploaded evidence summaries for verification.</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => reindexMutation.mutate({ type: 'evidence' })}
                                            disabled={reindexMutation.isPending}
                                        >
                                            {reindexMutation.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Play className="mr-2 h-3 w-3" />}
                                            Re-index Evidence
                                        </Button>
                                    </div>

                                    <div className="border rounded-lg p-4 bg-slate-50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShieldAlert className="h-5 w-5 text-red-600" />
                                            <h4 className="font-semibold">Full System</h4>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">Complete re-index of all knowledge base items.</p>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => reindexMutation.mutate({ type: 'all' })}
                                            disabled={reindexMutation.isPending}
                                        >
                                            {reindexMutation.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Play className="mr-2 h-3 w-3" />}
                                            Re-index Everything
                                        </Button>
                                    </div>
                                </div>
                                {lastIndexStats && (
                                    <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md text-sm border border-green-200 flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Last Run: Indexed {lastIndexStats.policies} policies and {lastIndexStats.evidence} evidence items. ({lastIndexStats.errors} errors)
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <AlertDialog open={!!providerToDelete} onOpenChange={(open) => !open && setProviderToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the provider <b>{providerToDelete?.name}</b>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => {
                                    if (providerToDelete) {
                                        deleteMutation.mutate({ id: providerToDelete.id });
                                    }
                                }}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? "Deleting..." : "Delete Provider"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}
