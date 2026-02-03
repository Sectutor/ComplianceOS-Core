import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AlertTriangle, Plus, Search, ArrowLeft, Globe, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useClientContext } from '@/contexts/ClientContext';
import { trpc } from '@/lib/trpc';
import { Button } from '@complianceos/ui/ui/button';
import { Input } from '@complianceos/ui/ui/input';
import { AddThreatDialog } from '@/components/risk/AddThreatDialog';
import { Breadcrumb } from '@/components/Breadcrumb';

import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';


export default function RiskThreatsPage() {
    const params = useParams();
    const routeClientId = params.id ? Number(params.id) : null;
    const { user } = useAuth();
    const [location, setLocation] = useLocation();
    const [searchQuery, setSearchQuery] = useState('');

    // Use Client Context for reliable state
    const { selectedClientId } = useClientContext();
    const effectiveClientId = routeClientId || selectedClientId;

    const { data: client, isLoading: loadingClientDetails } = trpc.clients.get.useQuery(
        { id: effectiveClientId || 0 },
        { enabled: !!effectiveClientId }
    );

    const clientId = client?.id || 0;

    const { data: threats, isLoading, refetch } = trpc.risks.getThreats.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    // Fetch Global Threat Intelligence Summary
    const { data: intelSummary } = trpc.adversaryIntel.getSummary.useQuery(
        undefined,
        { staleTime: 1000 * 60 * 30 }
    );

    const trendingTags = intelSummary?.topTags || [];
    const isTrending = (category: string) => {
        if (!category) return false;
        return trendingTags.some(t => category.toLowerCase().includes(t.tag.toLowerCase()));
    };

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

    const sortedThreats = React.useMemo(() => {
        let items = threats?.filter(t =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.threatId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.category?.toLowerCase().includes(searchQuery.toLowerCase())
        ) || [];

        if (sortConfig !== null) {
            items.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Default handling for strings to be case-insensitive
                if (typeof aValue === 'string') {
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
    }, [threats, searchQuery, sortConfig]);

    const handleOpenAddDialog = () => {
        setLocation(`/clients/${clientId}/risks/threats/new`);
    };

    const handleEditThreat = (threat: any) => {
        setLocation(`/clients/${clientId}/risks/threats/${threat.id}`);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 w-full max-w-full p-6">
                <div className="mb-2">
                    <Breadcrumb
                        items={[
                            { label: "Clients", href: "/clients" },
                            { label: client?.name || "Client", href: `/clients/${clientId}` },
                            { label: "Risk Management", href: `/clients/${clientId}/risks` },
                            { label: "Threat Library", href: `/clients/${clientId}/risks/threats` },
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
                        <h1 className="text-2xl font-bold tracking-tight">Threat Library</h1>
                        <p className="text-muted-foreground mt-1">Manage standard threat scenarios and categories.</p>
                    </div>
                    <Button onClick={handleOpenAddDialog} className="bg-orange-600 hover:bg-orange-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Record Threat
                    </Button>
                </div>

                {/* Global Threat Landscape Summary */}
                {intelSummary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-0">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-blue-400" />
                                    Global Threat Landscape
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-8">
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase tracking-wider">Active Critical Alerts</p>
                                        <p className="text-3xl font-bold text-red-500">{intelSummary.criticalItems}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase tracking-wider">Total Feed Items</p>
                                        <p className="text-3xl font-bold text-blue-400">{intelSummary.feedItems}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase tracking-wider">Recent CVEs</p>
                                        <p className="text-3xl font-bold text-amber-500">{intelSummary.recentCves.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-600">
                                    <TrendingUp className="w-4 h-4" />
                                    Trending Threat Categories
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {trendingTags.slice(0, 8).map(tag => (
                                        <Badge key={tag.tag} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                                            {tag.tag}
                                            <span className="ml-1.5 text-xs text-slate-400">({tag.count})</span>
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="flex gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search threats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-[#1C4D8D]">
                                    <SortableHeader label="ID" sortKey="threatId" />
                                    <SortableHeader label="Threat Name" sortKey="name" />
                                    <SortableHeader label="Category" sortKey="category" />
                                    <SortableHeader label="Source/Actor" sortKey="source" />
                                    <SortableHeader label="Likelihood" sortKey="likelihood" />
                                    <SortableHeader label="Impact" sortKey="potentialImpact" />
                                    <SortableHeader label="Status" sortKey="status" />
                                    <SortableHeader label="Owner" sortKey="owner" />
                                    <SortableHeader label="Last Review" sortKey="lastReviewDate" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr><td colSpan={9} className="p-8 text-center text-gray-500 bg-white">Loading threats...</td></tr>
                                ) : sortedThreats.length === 0 ? (
                                    <tr><td colSpan={9} className="p-8 text-center text-gray-500 bg-white">No threats found.</td></tr>
                                ) : (
                                    sortedThreats.map((threat) => (
                                        <tr
                                            key={threat.id}
                                            className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm cursor-pointer group"
                                            onDoubleClick={() => handleEditThreat(threat)}
                                        >
                                            <td className="px-6 py-4 text-sm font-mono text-gray-500">{threat.threatId}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-black">{threat.name}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-[200px]" title={threat.description || ''}>{threat.description}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                        {threat.category}
                                                    </span>
                                                    {isTrending(threat.category) && (
                                                        <Badge className="bg-red-100 text-red-600 border-red-200 hover:bg-red-100 h-5 text-[10px] px-1.5">
                                                            Trending
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {threat.source} <span className="text-gray-400 text-xs">({threat.intent})</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {threat.likelihood}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate" title={threat.potentialImpact || ''}>
                                                {threat.potentialImpact || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize border ${threat.status === 'active' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                    threat.status === 'monitored' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        'bg-gray-50 text-gray-700 border-gray-200'
                                                    }`}>
                                                    {threat.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{threat.owner || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {threat.lastReviewDate ? new Date(threat.lastReviewDate).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Threat Editor Dialog removed since it's now a standalone page */}
        </DashboardLayout>
    );
}
