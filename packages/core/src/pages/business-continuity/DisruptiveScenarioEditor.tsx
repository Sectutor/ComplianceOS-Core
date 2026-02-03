import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@complianceos/ui/ui/button';
import { Label } from '@complianceos/ui/ui/label';
import { Input } from '@complianceos/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { Textarea } from '@complianceos/ui/ui/textarea';
import { trpc } from '@/lib/trpc';
import { Loader2, Save, ArrowLeft, Info, Shield, AlertTriangle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import DashboardLayout from '@/components/DashboardLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Plus, X, Search } from 'lucide-react';

function RiskIntegrationPanel({ scenarioId, clientId }: { scenarioId: number | null, clientId: number }) {
    const utils = trpc.useContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const { data: linkedRisks } = trpc.businessContinuity.scenarios.listRisks.useQuery(
        { scenarioId: scenarioId! },
        { enabled: !!scenarioId }
    );

    const { data: allRisks } = trpc.risks.getAll.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const addRiskMutation = trpc.businessContinuity.scenarios.addRisk.useMutation({
        onSuccess: () => {
            utils.businessContinuity.scenarios.listRisks.invalidate({ scenarioId: scenarioId! });
            toast.success("Risk linked to scenario");
        }
    });

    const removeRiskMutation = trpc.businessContinuity.scenarios.removeRisk.useMutation({
        onSuccess: () => {
            utils.businessContinuity.scenarios.listRisks.invalidate({ scenarioId: scenarioId! });
            toast.success("Risk unlinked");
        }
    });

    const handleAddRisk = (riskId: number) => {
        if (!scenarioId) return;
        addRiskMutation.mutate({
            scenarioId,
            riskId
        });
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        if (!term) {
            setSearchResults([]);
            return;
        }
        if (allRisks) {
            const filtered = allRisks.filter(r =>
                ((r.title || '').toLowerCase().includes(term.toLowerCase()) ||
                    (r.description || '').toLowerCase().includes(term.toLowerCase())) &&
                !linkedRisks?.some(lr => lr.id === r.id)
            );
            setSearchResults(filtered);
        }
    };

    if (!scenarioId) return <div className="text-center p-8 text-slate-500">Please save the scenario first to link risks.</div>;

    return (
        <Card className="w-full max-w-none">
            <CardHeader>
                <CardTitle>Risk Register Integration</CardTitle>
                <CardDescription>Link identified risks that contribute to or are realized by this disruptive scenario.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Search & Add */}
                <div className="space-y-2">
                    <Label>Link Existing Risk</Label>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Risk Register..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    {searchResults.length > 0 && (
                        <div className="border rounded-md mt-2 max-h-40 overflow-y-auto bg-white shadow-sm">
                            {searchResults.map(risk => (
                                <div key={risk.id} className="flex justify-between items-center p-2 hover:bg-slate-50 border-b last:border-0 text-sm">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{risk.title}</span>
                                        <span className="text-xs text-slate-500 truncate max-w-[300px]">{risk.description}</span>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => handleAddRisk(risk.id)}>
                                        <Plus className="w-4 h-4 mr-1" /> Link
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Linked Risks List */}
                <div className="space-y-2 pt-4">
                    <h4 className="text-sm font-semibold text-slate-900">Linked Risks ({linkedRisks?.length || 0})</h4>
                    {linkedRisks?.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No risks linked yet.</p>
                    ) : (
                        <div className="grid gap-3">
                            {linkedRisks?.map(risk => (
                                <div key={risk.linkId} className="flex justify-between items-center p-3 rounded-lg border bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                        <div>
                                            <p className="font-medium text-sm text-slate-900">{risk.title}</p>
                                            <p className="text-xs text-slate-500">{risk.inherentRiskScore ? `Risk Score: ${risk.inherentRiskScore}` : 'Unscored'}</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                                        onClick={() => removeRiskMutation.mutate({ linkId: risk.linkId })}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </CardContent>
        </Card>
    );
}

export default function DisruptiveScenarioEditor() {
    const [location, setLocation] = useLocation();
    const [_, params] = useRoute('/clients/:clientId/business-continuity/scenarios/:scenarioId');
    const clientId = params?.clientId ? parseInt(params.clientId) : 0;
    const scenarioIdParam = params?.scenarioId;
    const isNew = scenarioIdParam === 'new';
    const dbId = !isNew && scenarioIdParam ? parseInt(scenarioIdParam) : null;

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        likelihood: 'medium',
        potentialImpact: '',
        mitigationStrategies: '',
    });

    const { data: client } = trpc.clients.get.useQuery({ id: clientId }, { enabled: !!clientId });

    // Fetch existing scenario if editing
    // NOTE: We might need a 'get' procedure or just 'list' and find. 
    // Since we only have 'list' currently, let's use list and find for now. 
    // Ideally we would add a 'get' procedure, but 'list' is cached so it's fine for small lists.
    const { data: scenarios, isLoading: isLoadingScenarios } = trpc.businessContinuity.scenarios.list.useQuery(
        { clientId },
        { enabled: !!dbId && !!clientId }
    );

    const existingScenario = scenarios?.find(s => s.id === dbId);

    useEffect(() => {
        if (existingScenario) {
            setFormData({
                title: existingScenario.title,
                description: existingScenario.description,
                likelihood: existingScenario.likelihood || 'medium',
                potentialImpact: existingScenario.potentialImpact || '',
                mitigationStrategies: existingScenario.mitigationStrategies || '',
            });
        }
    }, [existingScenario]);

    const createMutation = trpc.businessContinuity.scenarios.create.useMutation({
        onSuccess: () => {
            toast.success('Scenario created successfully');
            setLocation(`/clients/${clientId}/business-continuity/scenarios`);
        },
        onError: (err) => toast.error(`Failed to create: ${err.message}`)
    });

    // We don't have an update mutation yet in the router snippet I saw.
    // I need to add an 'update' procedure to the router.
    // For now I'll implement the UI assuming I will add the router update next.
    const updateMutation = trpc.businessContinuity.scenarios.update.useMutation({
        onSuccess: () => {
            toast.success('Scenario updated successfully');
            setLocation(`/clients/${clientId}/business-continuity/scenarios`);
        },
        onError: (err) => toast.error(`Failed to update: ${err.message}`)
    });


    const handleSubmit = async () => {
        if (!formData.title || !formData.description) {
            toast.error("Title and Description are required");
            return;
        }

        setLoading(true);
        try {
            if (dbId) {
                await updateMutation.mutateAsync({
                    id: dbId,
                    ...formData
                });
            } else {
                await createMutation.mutateAsync({
                    clientId,
                    ...formData
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (isLoadingScenarios && !isNew) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <DashboardLayout>
            <div className="w-full max-w-none py-8 px-6 pb-20">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Breadcrumb
                        items={[
                            { label: "Clients", href: "/clients" },
                            { label: client?.name || "Client", href: `/clients/${clientId}` },
                            { label: "Business Continuity", href: `/clients/${clientId}/business-continuity` },
                            { label: "Scenarios", href: `/clients/${clientId}/business-continuity/scenarios` },
                            { label: isNew ? "New Scenario" : formData.title || "Edit Scenario" },
                        ]}
                    />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setLocation(`/clients/${clientId}/business-continuity/scenarios`)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Zap className="w-6 h-6 text-[#1C4D8D]" />
                                {isNew ? 'Define New Scenario' : 'Edit Scenario'}
                            </h1>
                            <p className="text-muted-foreground">{isNew ? 'Describe a potential disruptive event' : `Managing scenario: ${formData.title}`}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setLocation(`/clients/${clientId}/business-continuity/scenarios`)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading} className="bg-[#1C4D8D] hover:bg-[#1C4D8D]/90">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <Save className="w-4 h-4 mr-2" />
                            {isNew ? 'Create Scenario' : 'Save Changes'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-1 space-y-1">
                        <nav className="flex flex-col space-y-1 sticky top-8">
                            {[
                                { id: 'general', label: 'General Info', icon: Info, desc: 'Basic Info' },
                                { id: 'impact', label: 'Impact Analysis', icon: Shield, desc: 'Consequences' },
                                { id: 'mitigation', label: 'Mitigation Strategies', icon: Shield, desc: 'Controls & Plans' },
                                { id: 'risks', label: 'Risk Integration', icon: AlertTriangle, desc: 'Linked Risk Register' },
                            ].map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveTab(section.id)}
                                    className={`group flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === section.id
                                        ? 'bg-[#1C4D8D] text-white shadow-md ring-1 ring-[#1C4D8D]'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-transparent'
                                        }`}
                                >
                                    <div className={`p-2 rounded-md transition-colors ${activeTab === section.id
                                        ? 'bg-white/20'
                                        : 'bg-slate-100 group-hover:bg-white border border-slate-200 group-hover:border-slate-300'
                                        }`}
                                    >
                                        <section.icon className={`w-4 h-4 ${activeTab === section.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
                                    </div>
                                    <div>
                                        <span className="block">{section.label}</span>
                                        <span className={`text-[10px] font-normal ${activeTab === section.id ? 'text-blue-100' : 'text-slate-400 group-hover:text-slate-500'}`}>
                                            {section.desc}
                                        </span>
                                    </div>
                                    {activeTab === section.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-8">

                        {/* General Info */}
                        <div className={activeTab === 'general' ? 'block' : 'hidden'}>
                            <Card className="w-full max-w-none">
                                <CardHeader>
                                    <CardTitle>Scenario Details</CardTitle>
                                    <CardDescription>Core information about the disruptive event.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Scenario Title <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g. Data Center Power Failure"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Likelihood</Label>
                                        <Select value={formData.likelihood} onValueChange={(v) => setFormData({ ...formData, likelihood: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Description <span className="text-red-500">*</span></Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Detailed description of the event trigger, scope, and immediate effects..."
                                            className="min-h-[150px]"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Impact Analysis */}
                        <div className={activeTab === 'impact' ? 'block' : 'hidden'}>
                            <Card className="w-full max-w-none">
                                <CardHeader>
                                    <CardTitle>Impact Analysis</CardTitle>
                                    <CardDescription>Analyze the potential consequences of this scenario.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Potential Business Impact</Label>
                                        <Textarea
                                            value={formData.potentialImpact}
                                            onChange={e => setFormData({ ...formData, potentialImpact: e.target.value })}
                                            placeholder="Operational, Financial, Reputational, and Legal impacts..."
                                            className="min-h-[200px]"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Mitigation */}
                        <div className={activeTab === 'mitigation' ? 'block' : 'hidden'}>
                            <Card className="w-full max-w-none">
                                <CardHeader>
                                    <CardTitle>Mitigation Strategies</CardTitle>
                                    <CardDescription>Controls and plans to reduce likelihood or impact.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Mitigation Strategies</Label>
                                        <Textarea
                                            value={formData.mitigationStrategies}
                                            onChange={e => setFormData({ ...formData, mitigationStrategies: e.target.value })}
                                            placeholder="Preventative controls, recovery strategies, and response plans..."
                                            className="min-h-[200px]"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Risk Integration */}
                        <div className={activeTab === 'risks' ? 'block' : 'hidden'}>
                            <RiskIntegrationPanel
                                scenarioId={dbId}
                                clientId={clientId}
                            />
                        </div>

                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
