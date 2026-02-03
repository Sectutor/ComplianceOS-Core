import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Bug, Plus, Search, Filter, Flame, ArrowUpDown, ArrowUp, ArrowDown, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@complianceos/ui/ui/alert';
import { useClientContext } from '@/contexts/ClientContext';
import { trpc } from '@/lib/trpc';
import { Button } from '@complianceos/ui/ui/button';
import { Input } from '@complianceos/ui/ui/input';
import { AddVulnerabilityDialog } from '@/components/risk/AddVulnerabilityDialog';
import { Badge } from '@complianceos/ui/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@complianceos/ui/ui/tooltip';

import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

export default function RiskVulnerabilitiesPage() {
    const params = useParams();
    const routeClientId = params.id ? Number(params.id) : null;
    const { user, client: authClient } = useAuth();
    const [location, setLocation] = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Determine effective client ID
    const effectiveClientId = routeClientId || authClient?.id;

    const { data: fetchedClient, isLoading: loadingClientDetails } = trpc.clients.get.useQuery(
        { id: effectiveClientId || 0 },
        { enabled: !!effectiveClientId && !authClient }
    );

    const client = authClient || fetchedClient;
    const clientId = client?.id || 0;

    const { data: vulnerabilities, isLoading, refetch } = trpc.risks.getVulnerabilities.useQuery(
        { clientId: clientId },
        { enabled: !!clientId }
    );

    // Fetch live security feeds for matching
    const { data: securityFeeds } = trpc.adversaryIntel.getSecurityFeeds.useQuery(
        { limit: 200 },
        { staleTime: 1000 * 60 * 15 } // Match feeds for 15 minutes
    );

    // Create a map of CVEs to Feed Items for fast lookup
    const activeThreatsMap = React.useMemo(() => {
        const map = new Map<string, string[]>();
        if (securityFeeds?.items) {
            securityFeeds.items.forEach(item => {
                if (item.cveIds && item.cveIds.length > 0) {
                    item.cveIds.forEach(cve => {
                        const existing = map.get(cve) || [];
                        if (!existing.includes(item.title)) {
                            existing.push(item.title);
                            map.set(cve, existing);
                        }
                    });
                }
            });
        }
        return map;
    }, [securityFeeds]);

    const filteredVulns = React.useMemo(() => {
        let items = vulnerabilities?.filter(v =>
            v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.vulnerabilityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.cveId?.toLowerCase().includes(searchQuery.toLowerCase())
        ) || [];

        if (sortConfig !== null) {
            items.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Special handling for Severity
                if (sortConfig.key === 'severity') {
                    const severityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1, 'Info': 0 };
                    aValue = severityOrder[aValue as keyof typeof severityOrder] || -1;
                    bValue = severityOrder[bValue as keyof typeof severityOrder] || -1;
                }

                // Special handling for Affected Assets (array/string)
                if (sortConfig.key === 'affectedAssets') {
                    aValue = typeof a.affectedAssets === 'string' ? JSON.parse(a.affectedAssets).length : (a.affectedAssets as string[])?.length || 0;
                    bValue = typeof b.affectedAssets === 'string' ? JSON.parse(b.affectedAssets).length : (b.affectedAssets as string[])?.length || 0;
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
    }, [vulnerabilities, searchQuery, sortConfig]);

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
        setLocation(`/clients/${clientId}/risks/vulnerabilities/new`);
    };

    const handleEditVuln = (vuln: any) => {
        setLocation(`/clients/${clientId}/risks/vulnerabilities/${vuln.id}`);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 w-full max-w-full p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Vulnerability Management</h1>
                        <p className="text-muted-foreground mt-1">Track and manage vulnerabilities across your assets.</p>
                    </div>
                    <Button onClick={handleOpenAddDialog} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Record Vulnerability
                    </Button>
                </div>

                {/* Legend / Explanation for Live Threats */}
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Live Threat Integration Active</AlertTitle>
                    <AlertDescription className="text-blue-700 text-sm mt-1">
                        Vulnerabilities marked with the <Flame className="w-3 h-3 inline text-red-600 mx-1" /> icon match active security threats in the wild (CISA KEV, etc.). Prioritize remediation for these items immediately.
                    </AlertDescription>
                </Alert>

                <div className="flex gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search vulnerabilities..."
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
                                    <SortableHeader label="ID" sortKey="vulnerabilityId" />
                                    <SortableHeader label="Name" sortKey="name" />
                                    <SortableHeader label="Severity" sortKey="severity" />
                                    <SortableHeader label="CVSS" sortKey="cvssScore" />
                                    <SortableHeader label="Affected Assets" sortKey="affectedAssets" />
                                    <SortableHeader label="Status" sortKey="status" />
                                    <SortableHeader label="Discovery" sortKey="discoveryDate" />
                                    <SortableHeader label="Owner" sortKey="owner" />
                                    <SortableHeader label="Due Date" sortKey="dueDate" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr><td colSpan={9} className="p-8 text-center text-gray-500 bg-white">Loading vulnerabilities...</td></tr>
                                ) : filteredVulns.length === 0 ? (
                                    <tr><td colSpan={9} className="p-8 text-center text-gray-500 bg-white">No vulnerabilities found.</td></tr>
                                ) : (
                                    filteredVulns.map((vuln) => (
                                        <tr
                                            key={vuln.id}
                                            className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm cursor-pointer group"
                                            onDoubleClick={() => handleEditVuln(vuln)}
                                        >
                                            <td className="px-6 py-4 text-sm font-mono text-gray-500">{vuln.vulnerabilityId}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-black flex items-center gap-2">
                                                    {vuln.name}
                                                    {vuln.cveId && activeThreatsMap.has(vuln.cveId) && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Badge className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200 cursor-help p-1 h-6 w-6 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm">
                                                                    <Flame className="w-3.5 h-3.5 fill-red-500 animate-pulse" />
                                                                </Badge>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-[300px]">
                                                                <p className="font-semibold mb-1">Active Threats Detected:</p>
                                                                <ul className="list-disc list-inside text-xs space-y-1">
                                                                    {activeThreatsMap.get(vuln.cveId)?.slice(0, 3).map((threat, idx) => (
                                                                        <li key={idx}>{threat}</li>
                                                                    ))}
                                                                    {(activeThreatsMap.get(vuln.cveId)?.length || 0) > 3 && (
                                                                        <li>...and {(activeThreatsMap.get(vuln.cveId)?.length || 0) - 3} more</li>
                                                                    )}
                                                                </ul>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                                {vuln.cveId && <div className="text-xs text-gray-500">{vuln.cveId}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${vuln.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    vuln.severity === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                        vuln.severity === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                            'bg-green-50 text-green-700 border-green-200'
                                                    }`}>
                                                    {vuln.severity || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-800">
                                                {vuln.cvssScore}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate" title={typeof vuln.affectedAssets === 'string' ? JSON.parse(vuln.affectedAssets).join(', ') : (vuln.affectedAssets as string[])?.join(', ')}>
                                                {typeof vuln.affectedAssets === 'string' ? JSON.parse(vuln.affectedAssets).join(', ') : (vuln.affectedAssets as string[])?.join(', ') || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize border ${vuln.status === 'open' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    vuln.status === 'remediated' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        'bg-gray-50 text-gray-700 border-gray-200'
                                                    }`}>
                                                    {vuln.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {vuln.discoveryDate ? new Date(vuln.discoveryDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{vuln.owner || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {vuln.dueDate ? new Date(vuln.dueDate).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Vulnerability Editor Dialog removed since it's now a standalone page */}
        </DashboardLayout>
    );
}
