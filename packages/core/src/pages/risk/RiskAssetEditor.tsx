import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@complianceos/ui/ui/button';
import { Label } from '@complianceos/ui/ui/label';
import { Input } from '@complianceos/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { Textarea } from '@complianceos/ui/ui/textarea';
import { trpc } from '@/lib/trpc';
import { Database, Loader2, Save, ArrowLeft, Calendar, Shield, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import { Separator } from '@complianceos/ui/ui/separator';
import DashboardLayout from '@/components/DashboardLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import ThreatIntelPanel from '@/components/risk/ThreatIntelPanel';

const ASSET_TYPES = [
    'Hardware',
    'Software',
    'Information / Data',
    'People / Roles',
    'Service',
    'Intangible / Reputation',
    'Site / Facility'
];

export default function RiskAssetEditor() {
    const [location, setLocation] = useLocation();
    const [_, params] = useRoute('/clients/:clientId/risks/assets/:assetId');
    const clientId = params?.clientId ? parseInt(params.clientId) : 0;
    const assetIdParam = params?.assetId;
    const isNew = assetIdParam === 'new';
    const dbId = !isNew && assetIdParam ? parseInt(assetIdParam) : null;

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');

    const [formData, setFormData] = useState({
        name: '',
        type: 'Hardware',
        owner: '',
        location: '',
        status: 'active',
        acquisitionDate: '',
        lastReviewDate: '',
        valuationC: 3,
        valuationI: 3,
        valuationA: 3,
        description: '',
        // Technical identifiers for threat matching
        vendor: '',
        productName: '',
        version: '',
        technologies: [] as string[],
    });

    // Queries
    const { data: client } = trpc.clients.get.useQuery({ id: clientId }, { enabled: !!clientId });

    // Fetch existing asset if editing
    const { data: assets, isLoading: isLoadingAsset } = trpc.risks.getAssets.useQuery(
        { clientId },
        {
            enabled: !!dbId && !!clientId
        }
    );

    const existingAsset = assets?.find(a => a.id === dbId);

    // Initial Data Load
    useEffect(() => {
        if (existingAsset) {
            setFormData({
                name: existingAsset.name || '',
                type: existingAsset.type || 'Hardware',
                owner: existingAsset.owner || '',
                location: existingAsset.location || '',
                status: existingAsset.status || 'active',
                acquisitionDate: existingAsset.acquisitionDate ? new Date(existingAsset.acquisitionDate).toISOString().split('T')[0] : '',
                lastReviewDate: existingAsset.lastReviewDate ? new Date(existingAsset.lastReviewDate).toISOString().split('T')[0] : '',
                valuationC: existingAsset.valuationC || 3,
                valuationI: existingAsset.valuationI || 3,
                valuationA: existingAsset.valuationA || 3,
                description: existingAsset.description || '',
                vendor: existingAsset.vendor || '',
                productName: existingAsset.productName || '',
                version: existingAsset.version || '',
                technologies: (existingAsset.technologies as string[]) || [],
            });
        }
    }, [existingAsset]);

    // Mutations
    const createMutation = trpc.risks.createAsset.useMutation({
        onSuccess: () => {
            toast.success('Asset added successfully');
            setLocation(`/clients/${clientId}/risks/assets`);
        },
        onError: (err) => toast.error(`Failed to add: ${err.message}`)
    });

    const updateMutation = trpc.risks.updateAsset.useMutation({
        onSuccess: () => {
            toast.success('Asset updated successfully');
            setLocation(`/clients/${clientId}/risks/assets`);
        },
        onError: (err) => toast.error(`Failed to update: ${err.message}`)
    });

    const handleSubmit = async () => {
        if (!formData.name) {
            toast.error("Asset name is required");
            return;
        }

        setLoading(true);
        try {
            const commonData = {
                name: formData.name,
                type: formData.type,
                owner: formData.owner,
                location: formData.location,
                status: formData.status as any,
                acquisitionDate: formData.acquisitionDate || undefined,
                lastReviewDate: formData.lastReviewDate || undefined,
                valuationC: formData.valuationC,
                valuationI: formData.valuationI,
                valuationA: formData.valuationA,
                description: formData.description,
                // Technical identifiers for NVD matching
                vendor: formData.vendor || undefined,
                productName: formData.productName || undefined,
                version: formData.version || undefined,
                technologies: formData.technologies.length > 0 ? formData.technologies : undefined,
            };

            if (dbId) {
                await updateMutation.mutateAsync({
                    id: dbId,
                    ...commonData,
                });
            } else {
                await createMutation.mutateAsync({
                    clientId,
                    ...commonData,
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (isLoadingAsset && !isNew) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <DashboardLayout>
            <div className="w-full max-w-full px-8 py-8 pb-20">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Breadcrumb
                        items={[
                            { label: "Clients", href: "/clients" },
                            { label: client?.name || "Client", href: `/clients/${clientId}` },
                            { label: "Asset Inventory", href: `/clients/${clientId}/risks/assets` },
                            { label: isNew ? "Add Asset" : formData.name || "Edit Asset" },
                        ]}
                    />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setLocation(`/clients/${clientId}/risks/assets`)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Database className="w-6 h-6 text-[#1C4D8D]" />
                                {isNew ? 'Add to Asset Inventory' : 'Edit Asset'}
                            </h1>
                            <p className="text-muted-foreground">{isNew ? 'Define a new organization asset' : `Managing asset: ${formData.name}`}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setLocation(`/clients/${clientId}/risks/assets`)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading} className="bg-[#1C4D8D] hover:bg-[#1C4D8D]/90">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <Save className="w-4 h-4 mr-2" />
                            {isNew ? 'Add Asset' : 'Save Changes'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-1 space-y-1">
                        <nav className="flex flex-col space-y-1 sticky top-8">
                            {[
                                { id: 'basic', label: 'Basic Info', icon: Info, desc: 'Core Details' },
                                { id: 'valuation', label: 'CIA Valuation', icon: Shield, desc: 'Security Rating' },
                                { id: 'lifecycle', label: 'Lifecycle & Status', icon: Calendar, desc: 'Operations' },
                                // Only show Threat Intel tab for Software/Hardware assets (not new)
                                ...(!isNew && ['Software', 'Hardware'].includes(formData.type)
                                    ? [{ id: 'threatIntel', label: 'Threat Intel', icon: AlertTriangle, desc: 'Vulnerabilities' }]
                                    : []),
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

                    {/* Main Content Form */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Basic Info Section */}
                        <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Asset Identification</CardTitle>
                                    <CardDescription>Enter the core details of the asset.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Asset Name *</Label>
                                            <Input
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g. Primary Customer DB"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Asset Type</Label>
                                            <Select
                                                value={formData.type}
                                                onValueChange={v => setFormData({ ...formData, type: v })}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {ASSET_TYPES.map(t => (
                                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Owner / Department</Label>
                                            <Input
                                                value={formData.owner}
                                                onChange={e => setFormData({ ...formData, owner: e.target.value })}
                                                placeholder="e.g. Engineering, HR"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Location / Environment</Label>
                                            <Input
                                                value={formData.location}
                                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                                placeholder="e.g. AWS us-east-1, Office HQ"
                                            />
                                        </div>
                                    </div>

                                    {/* Technical Identifiers for Threat Intelligence */}
                                    <div className="pt-4 border-t">
                                        <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                                            <Shield className="w-4 h-4" />
                                            Technical Identifiers (for NVD Scanning)
                                        </Label>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Adding vendor and product details enables more accurate vulnerability matching.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label>Vendor</Label>
                                                <Input
                                                    value={formData.vendor}
                                                    onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                                                    placeholder="e.g. Microsoft, Apache, Oracle"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Product Name</Label>
                                                <Input
                                                    value={formData.productName}
                                                    onChange={e => setFormData({ ...formData, productName: e.target.value })}
                                                    placeholder="e.g. SQL Server, Tomcat, MySQL"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Version</Label>
                                                <Input
                                                    value={formData.version}
                                                    onChange={e => setFormData({ ...formData, version: e.target.value })}
                                                    placeholder="e.g. 2019, 9.0.50, 8.0"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-3 space-y-2">
                                            <Label>Technologies (comma-separated)</Label>
                                            <Input
                                                value={formData.technologies.join(', ')}
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                                                })}
                                                placeholder="e.g. nodejs, postgresql, docker, react"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Purpose and scope of this asset..."
                                            className="min-h-[120px]"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Valuation Section */}
                        <div className={activeTab === 'valuation' ? 'block' : 'hidden'}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>CIA Security Valuation</CardTitle>
                                    <CardDescription>Rate the importance of Confidentiality, Integrity, and Availability (1-5).</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {[
                                            { id: 'valuationC', label: 'Confidentiality', color: 'text-red-600', desc: 'Protection against unauthorized access.' },
                                            { id: 'valuationI', label: 'Integrity', color: 'text-green-600', desc: 'Protection against unauthorized changes.' },
                                            { id: 'valuationA', label: 'Availability', color: 'text-blue-600', desc: 'Accessibility when required.' },
                                        ].map((field) => (
                                            <div key={field.id} className="space-y-4">
                                                <div className="flex flex-col gap-1">
                                                    <Label className={`font-bold text-base ${field.color}`}>{field.label}</Label>
                                                    <p className="text-xs text-muted-foreground leading-tight">{field.desc}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Input
                                                        type="number"
                                                        min="1" max="5"
                                                        className="w-20 text-center font-bold text-lg"
                                                        value={formData[field.id as keyof typeof formData] as number}
                                                        onChange={e => {
                                                            const val = parseInt(e.target.value) || 1;
                                                            const clamped = Math.max(1, Math.min(5, val));
                                                            setFormData({ ...formData, [field.id]: clamped });
                                                        }}
                                                    />
                                                    <span className="text-sm font-medium text-slate-400">/ 5</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm dark:bg-gray-950 dark:border-gray-700">
                                        <div className="flex gap-3">
                                            <Info className="w-5 h-5 text-gray-900 shrink-0 dark:text-gray-100" />
                                            <div className="text-sm text-gray-900 dark:text-gray-100">
                                                <p className="font-bold mb-2">Scoring Guide (1-5)</p>
                                                <ul className="list-disc list-inside space-y-1 text-sm">
                                                    <li><span className="font-semibold">1 - Minimal:</span> Negligible impact.</li>
                                                    <li><span className="font-semibold">2 - Low:</span> Minor impact.</li>
                                                    <li><span className="font-semibold">3 - Moderate:</span> Serious impact.</li>
                                                    <li><span className="font-semibold">4 - High:</span> Significant impact.</li>
                                                    <li><span className="font-semibold">5 - Critical:</span> Catastrophic impact.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Lifecycle Section */}
                        <div className={activeTab === 'lifecycle' ? 'block' : 'hidden'}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Lifecycle & Compliance</CardTitle>
                                    <CardDescription>Track the operational status and review schedule.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label>Operational Status</Label>
                                            <Select
                                                value={formData.status}
                                                onValueChange={v => setFormData({ ...formData, status: v })}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="archived">Archived</SelectItem>
                                                    <SelectItem value="disposed">Disposed</SelectItem>
                                                    <SelectItem value="under review">Under Review</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Acquisition Date</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                                <Input
                                                    type="date"
                                                    className="pl-9"
                                                    value={formData.acquisitionDate}
                                                    onChange={e => setFormData({ ...formData, acquisitionDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Next Review Date</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                                <Input
                                                    type="date"
                                                    className="pl-9"
                                                    value={formData.lastReviewDate}
                                                    onChange={e => setFormData({ ...formData, lastReviewDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Threat Intel Section (only for existing assets) */}
                        {!isNew && dbId && (
                            <div className={activeTab === 'threatIntel' ? 'block' : 'hidden'}>
                                <ThreatIntelPanel
                                    clientId={clientId}
                                    assetId={dbId}
                                    assetName={formData.name}
                                    assetVendor={formData.vendor}
                                    assetProduct={formData.productName}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
