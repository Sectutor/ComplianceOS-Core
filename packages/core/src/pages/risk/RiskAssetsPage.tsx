import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Database, Search, ArrowLeft, Zap, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { AddAssetDialog } from '@/components/risk/AddAssetDialog';
import { Button } from '@complianceos/ui/ui/button';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Badge } from '@complianceos/ui/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@complianceos/ui/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@complianceos/ui/ui/dialog';
import { ExternalLink, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'wouter/use-browser-location';
import { PageGuide } from "@/components/PageGuide";
import { toast } from "sonner";


export default function RiskAssetsPage() {
    const params = useParams();
    const routeClientId = params.id ? Number(params.id) : null;
    const { user, client: authClient } = useAuth();

    // Determine effective client ID
    const effectiveClientId = routeClientId || authClient?.id;

    const { data: fetchedClient, isLoading: loadingClientDetails } = trpc.clients.get.useQuery(
        { id: effectiveClientId || 0 },
        { enabled: !!effectiveClientId && !authClient }
    );

    const client = authClient || fetchedClient;
    const clientId = client?.id || 0;

    const [location, setLocation] = useLocation();

    const { data: assets, isLoading: loadingAssets, refetch: refetchAssets } = trpc.risks.getAssets.useQuery(
        { clientId },
        { enabled: !!clientId }
    );
    const scanAllMutation = trpc.threatIntel.scanAllAssets.useMutation({
        onSuccess: (data) => {
            const total = data.results?.reduce((sum: number, r: any) => sum + (r.count || 0), 0) || 0;
            toast.success(`Scanned ${data.results?.length || 0} assets, found ${total} suggestions`);
            refetchAssets();
        },
        onError: (err) => toast.error(`Scan failed: ${err.message}`)
    });

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ label, sortKey }: { label: string, sortKey: string }) => {
        const isSorted = sortConfig?.key === sortKey;
        return (
            <th
                className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none group"
                onClick={() => handleSort(sortKey)}
            >
                <div className="flex items-center gap-2">
                    {label}
                    {isSorted ? (
                        sortConfig?.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                    )}
                </div>
            </th>
        );
    };

    const handleOpenAddDialog = () => {
        setLocation(`/clients/${clientId}/risks/assets/new`);
    };

    const handleEditAsset = (asset: any) => {
        setLocation(`/clients/${clientId}/risks/assets/${asset.id}`);
    };

    if (loadingClientDetails) return (
        <DashboardLayout>
            <div className="p-8 text-center text-muted-foreground">Loading client data...</div>
        </DashboardLayout>
    );

    if (!client) return (
        <DashboardLayout>
            <div className="p-8 text-center text-destructive">Client not found.</div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="space-y-6 w-full max-w-full p-6">
                <div className="mb-2">
                    <Breadcrumb
                        items={[
                            { label: "Clients", href: "/clients" },
                            { label: client?.name || "Client", href: `/clients/${clientId}` },
                            { label: "Risk Management", href: `/clients/${clientId}/risks` },
                            { label: "Asset Inventory", href: `/clients/${clientId}/risks/assets` },
                        ]}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 -ml-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setLocation(`/clients/${clientId}/risks`)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Risk Dashboard
                    </Button>
                </div>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Asset Inventory</h1>
                        <p className="text-muted-foreground mt-1">Manage your organization's assets and their valuations.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => scanAllMutation.mutate({ clientId })}
                            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 flex items-center gap-2 shadow-sm transition-colors"
                            disabled={scanAllMutation.isPending}
                            title="Scan all assets against NVD/KEV"
                        >
                            <Zap className="w-4 h-4" />
                            {scanAllMutation.isPending ? "Scanning..." : "Scan All Assets"}
                        </button>
                        <button
                            onClick={handleOpenAddDialog}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Asset
                        </button>
                        <PageGuide
                            title="Asset Inventory"
                            description="Maintain a complete registry of your organization’s critical information assets."
                            rationale="You cannot protect what you don't know you have. A comprehensive asset inventory is the starting point for all risk assessments."
                            howToUse={[
                                { step: "Add Assets", description: "Use the 'Add Asset' button to register hardware, software, data, or people." },
                                { step: "Value Assets", description: "Assign Confidentiality, Integrity, and Availability (CIA) scores to determine criticality." },
                                { step: "Identify Threats", description: "Click the lightning bolt icon to see active threats relevant to that asset's technology stack." }
                            ]}
                            integrations={[
                                { name: "Risk Assessment", description: "Assets selected here become the targets for risk scenarios." },
                                { name: "Threat Intelligence", description: "The system automatically matches asset technologies (e.g. 'Windows') to CVEs and threat feeds." }
                            ]}
                        />
                    </div>
                </div>

                <div className="bg-card rounded-xl border shadow-sm min-h-[400px]">
                    <AssetInventoryTable
                        assets={assets || []}
                        loading={loadingAssets}
                        onEdit={handleEditAsset}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        SortableHeader={SortableHeader}
                    />
                </div>

                {/* Asset Editor Dialog removed since it's now a standalone page */}
            </div>
        </DashboardLayout>
    );
}

function AssetInventoryTable({
    assets,
    loading,
    onEdit,
    sortConfig,
    onSort,
    SortableHeader
}: {
    assets: any[],
    loading: boolean,
    onEdit: (asset: any) => void,
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null,
    onSort: (key: string) => void,
    SortableHeader: React.FC<{ label: string, sortKey: string }>
}) {
    const [selectedAssetForThreats, setSelectedAssetForThreats] = useState<any>(null);
    const [_, setLocation] = useLocation();

    // Fetch security feeds for asset matching
    const { data: securityFeeds } = trpc.adversaryIntel.getSecurityFeeds.useQuery(
        { limit: 200 },
        { staleTime: 1000 * 60 * 15 }
    );

    const getAssetThreats = (asset: any) => {
        if (!securityFeeds?.items) return [];
        const techTerms = [
            asset.name,
            asset.vendor,
            asset.productName,
            asset.type,
            ...(asset.technologies || [])
        ].filter(Boolean).map(t => t.toLowerCase());

        return securityFeeds.items.filter(item => {
            if (!item.techStack) return false;
            return item.techStack.some((threatTech: string) => {
                const lowerThreatTech = threatTech.toLowerCase();
                return techTerms.some(term => term.includes(lowerThreatTech) || lowerThreatTech.includes(term));
            });
        });
    };

    const sortedAssets = React.useMemo(() => {
        if (!assets) return [];
        let items = [...assets];

        if (sortConfig !== null) {
            items.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Special handling for Active Threats
                if (sortConfig.key === 'activeThreats') {
                    aValue = getAssetThreats(a).length;
                    bValue = getAssetThreats(b).length;
                }
                // Special handling for Associated Risks
                else if (sortConfig.key === 'riskCount') {
                    aValue = a.riskCount || 0;
                    bValue = b.riskCount || 0;
                }
                else if (sortConfig.key === 'vulnerabilityCount') {
                    aValue = a.vulnerabilityCount || 0;
                    bValue = b.vulnerabilityCount || 0;
                }
                else if (sortConfig.key === 'suggestionCount') {
                    aValue = a.suggestionCount || 0;
                    bValue = b.suggestionCount || 0;
                }
                // Special handling for CIA Valuation
                else if (sortConfig.key === 'ciaValuation') {
                    // Summing up values, assuming Low=1, Medium=2, High=3 logic if they were numbers, but they seem to be numbers 1-3 usually?
                    // Or maybe just generic numbers. The usage shows `asset.valuationC`
                    const valA = (Number(a.valuationC) || 0) + (Number(a.valuationI) || 0) + (Number(a.valuationA) || 0);
                    const valB = (Number(b.valuationC) || 0) + (Number(b.valuationI) || 0) + (Number(b.valuationA) || 0);
                    aValue = valA;
                    bValue = valB;
                }
                // Default handling for strings to be case-insensitive
                else if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue?.toLowerCase() || '';
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return items;
    }, [assets, sortConfig, securityFeeds]);

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading assets...</div>;
    if (assets.length === 0) return (
        <div className="p-12 text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No Assets Found</h3>
            <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                Start by adding assets to your inventory to begin risk assessment.
            </p>
        </div>
    );

    return (
        <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-[#1C4D8D]">
                            <SortableHeader label="Asset ID" sortKey="id" />
                            <SortableHeader label="Asset Name" sortKey="name" />
                            <SortableHeader label="Type/Category" sortKey="type" />
                            <SortableHeader label="Description" sortKey="description" />
                            <SortableHeader label="Active Threats" sortKey="activeThreats" />
                            <SortableHeader label="CIA" sortKey="ciaValuation" />
                            <SortableHeader label="Owner" sortKey="owner" />
                            <SortableHeader label="Location" sortKey="location" />
                            <SortableHeader label="Status" sortKey="status" />
                            <SortableHeader label="Risks" sortKey="riskCount" />
                            <SortableHeader label="Vulnerabilities" sortKey="vulnerabilityCount" />
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAssets.map((asset) => (
                            <tr
                                key={asset.id}
                                className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm cursor-pointer group"
                                onDoubleClick={() => onEdit(asset)}
                            >
                                <td className="px-6 py-4 text-sm font-mono text-gray-500">#{asset.id}</td>
                                <td className="px-6 py-4 text-sm font-medium text-black">{asset.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{asset.type}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={asset.description}>{asset.description || '-'}</td>
                                
                                {/* Moved Columns */}
                                <td className="px-6 py-4 text-sm">
                                    {(() => {
                                        const activeThreats = getAssetThreats(asset);
                                        if (activeThreats.length > 0) {
                                            return (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Badge
                                                            className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200 cursor-pointer flex w-fit items-center gap-1 transition-transform active:scale-95"
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Prevent row click
                                                                setSelectedAssetForThreats(asset);
                                                            }}
                                                        >
                                                            <Zap className="w-3 h-3 fill-red-700" />
                                                            {activeThreats.length} Active
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-[300px]">
                                                        <p className="font-semibold mb-1">Click to view details</p>
                                                        <ul className="list-disc list-inside text-xs space-y-1">
                                                            {activeThreats.slice(0, 3).map((t, idx) => (
                                                                <li key={idx} className="line-clamp-1">{t.title}</li>
                                                            ))}
                                                        </ul>
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        }
                                        return <span className="text-gray-400 text-xs">-</span>;
                                    })()}
                                </td>
                                <td className="px-6 py-4 flex gap-1 items-center h-full">
                                    <span className="px-1.5 py-0.5 bg-white text-xs rounded border border-gray-300 text-gray-700" title="Confidentiality">C:{asset.valuationC}</span>
                                    <span className="px-1.5 py-0.5 bg-white text-xs rounded border border-gray-300 text-gray-700" title="Integrity">I:{asset.valuationI}</span>
                                    <span className="px-1.5 py-0.5 bg-white text-xs rounded border border-gray-300 text-gray-700" title="Availability">A:{asset.valuationA}</span>
                                </td>

                                <td className="px-6 py-4 text-sm text-gray-600">{asset.owner || '-'}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{asset.location || '-'}</td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${asset.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                                        asset.status === 'archived' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                            'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                        {asset.status ? asset.status.charAt(0).toUpperCase() + asset.status.slice(1) : 'Active'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${asset.riskCount > 0 ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                        {asset.riskCount || 0} Risks
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${asset.vulnerabilityCount > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                        {asset.vulnerabilityCount || 0} Vulns
                                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                </table>
            </div>


            <Dialog open={!!selectedAssetForThreats} onOpenChange={(open) => !open && setSelectedAssetForThreats(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-red-600" />
                            Active Threat Intelligence
                        </DialogTitle>
                        <DialogDescription>
                            The following active threats match the technology stack of <strong>{selectedAssetForThreats?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {selectedAssetForThreats && getAssetThreats(selectedAssetForThreats).map((threat, idx) => (
                            <div key={idx} className="p-4 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-sm text-slate-900">{threat.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{new Date(threat.pubDate).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span className="font-medium text-slate-700">{threat.sourceName}</span>
                                            {threat.severity && (
                                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] uppercase font-bold ${threat.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                                    threat.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {threat.severity}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 line-clamp-2 mt-2">{threat.description}</p>
                                    </div>
                                    <div className="flex flex-col gap-2 min-w-[120px]">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full text-xs h-8"
                                            onClick={() => window.open(threat.link, '_blank')}
                                        >
                                            <ExternalLink className="w-3 h-3 mr-2" />
                                            View Source
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="w-full text-xs h-8 bg-red-600 hover:bg-red-700"
                                            onClick={() => {
                                                // Create a new risk with pre-filled data
                                                // We can use query params or state, but since the add dialog is a route, 
                                                // we might need to pass data differently or just navigate to the list and open dialog?
                                                // For now, let's navigate to the risk creation page with query params if possible, 
                                                // or just the generic new risk page.
                                                // Ideally: /clients/Id/risks/new?title=...

                                                const params = new URLSearchParams();
                                                params.set('title', `Risk: ${threat.title.slice(0, 50)}...`);
                                                params.set('description', `Derived from active threat: ${threat.title}\n\nSource: ${threat.sourceName}\nLink: ${threat.link}\n\n${threat.description}`);
                                                params.set('assetId', selectedAssetForThreats.id);

                                                // Assuming we can pass state or params. 
                                                // If the route doesn't support params yet, it will just open the empty form, which is still a "work on it" step.
                                                // We'll trust the user to fill it or future improvements to read params.
                                                // Navigate to Risk Register with query params to auto-open the wizard
                                                setLocation(`/clients/${selectedAssetForThreats.clientId}/risks/register?${params.toString()}`);
                                            }}
                                        >
                                            <ShieldAlert className="w-3 h-3 mr-2" />
                                            Create Risk
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedAssetForThreats(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
