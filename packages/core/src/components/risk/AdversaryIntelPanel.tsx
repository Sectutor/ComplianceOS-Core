/**
 * Adversary Intelligence Panel
 * 
 * Premium feature providing live security news feeds and MITRE ATT&CK TTP browser.
 * Users can create risks directly from feed items or technique selections.
 */

import React, { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Link } from 'wouter';
import { Button } from '@complianceos/ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { Input } from '@complianceos/ui/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { ScrollArea } from '@complianceos/ui/ui/scroll-area';
import {
    Radar,
    Newspaper,
    Shield,
    AlertTriangle,
    ExternalLink,
    Plus,
    RefreshCw,
    Loader2,
    Search,
    Zap,
    Target,
    ChevronRight,
    Clock,
    Tag,
    BookOpen,
    Swords,
    ShieldCheck,
    TrendingUp,
    AlertCircle,
    Info,
    ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@complianceos/ui/ui/dialog';

interface AdversaryIntelPanelProps {
    clientId: number;
    onRiskCreated?: (risk: any) => void;
}

interface SecurityFeedItem {
    id: string;
    title: string;
    description: string;
    link: string;
    pubDate: string;
    source: string;
    sourceName: string;
    category?: string;
    severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
    cveIds?: string[];
    tags?: string[];
    relevanceScore?: number;
    impactedAssets?: { id: number; name: string; type: string }[];
    techStack?: string[];
}

interface MitreTechnique {
    id: string;
    name: string;
    description: string;
    tacticId: string;
    tacticName: string;
    url: string;
    mitigations: { id: string; name: string; description: string }[];
    platforms: string[];
    isSubtechnique: boolean;
}

interface MitreTactic {
    id: string;
    name: string;
    shortname: string;
    description: string;
}

export function AdversaryIntelPanel({ clientId, onRiskCreated }: AdversaryIntelPanelProps) {
    const [activeTab, setActiveTab] = useState('briefing');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTactic, setSelectedTactic] = useState<string | null>(null);
    const [selectedTechnique, setSelectedTechnique] = useState<MitreTechnique | null>(null);
    const [selectedFeedItem, setSelectedFeedItem] = useState<SecurityFeedItem | null>(null);
    const [createThreatDialog, setCreateThreatDialog] = useState<{ open: boolean; type: 'feed' | 'technique' }>({ open: false, type: 'feed' });
    const [sortBy, setSortBy] = useState<'date' | 'severity'>('date');

    const severityWeights: Record<string, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
        info: 0,
    };

    // Fetch security feeds
    const { data: feedsData, isLoading: feedsLoading, refetch: refetchFeeds } = trpc.adversaryIntel.getSecurityFeeds.useQuery(
        { limit: 100, clientId },
        { staleTime: 1000 * 60 * 5 } // 5 minutes
    );

    // Manual refresh mutation
    const refreshFeedsMutation = trpc.adversaryIntel.refreshFeeds.useMutation({
        onSuccess: () => {
            toast.success('Security feeds refreshed with latest intelligence');
            refetchFeeds();
        },
        onError: (err: any) => toast.error(`Failed to refresh feeds: ${err.message}`),
    });

    // Fetch MITRE data
    const { data: mitreData, isLoading: mitreLoading, refetch: refetchMitre } = trpc.adversaryIntel.getMitreData.useQuery(
        { clientId },
        { staleTime: 1000 * 60 * 60 } // 1 hour
    );

    // Search MITRE techniques
    const { data: searchResults } = trpc.adversaryIntel.searchTechniques.useQuery(
        { query: searchQuery, limit: 20, clientId },
        { enabled: searchQuery.length >= 2 && activeTab === 'mitre' }
    );

    // Fetch daily briefing
    const { data: briefing, isLoading: briefingLoading } = trpc.threatIntel.getDailyBriefing.useQuery(
        { clientId },
        { staleTime: 1000 * 60 * 30 } // 30 minutes
    );

    // Create threat mutation (add to threat library from intelligence)
    const createThreatMutation = trpc.risks.createThreat.useMutation({
        onSuccess: (data: any) => {
            toast.success('Threat created successfully from intelligence');
            setCreateThreatDialog({ open: false, type: 'feed' });
            setSelectedFeedItem(null);
            setSelectedTechnique(null);
            onRiskCreated?.(data);
        },
        onError: (err: any) => toast.error(`Failed to create threat: ${err.message}`),
    });

    // Filter and sort feeds
    const filteredFeeds = useMemo(() => {
        if (!feedsData?.items) return [];

        // Create a copy for sorting
        let result = [...feedsData.items];

        // Filter by search query
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            result = result.filter((item: SecurityFeedItem) =>
                item.title.toLowerCase().includes(lower) ||
                item.description.toLowerCase().includes(lower) ||
                item.tags?.some((t: string) => t.includes(lower)) ||
                item.cveIds?.some((c: string) => c.toLowerCase().includes(lower))
            );
        }

        // Sort by selected criteria
        if (sortBy === 'severity') {
            result.sort((a, b) => {
                const weightA = severityWeights[a.severity || 'info'] || 0;
                const weightB = severityWeights[b.severity || 'info'] || 0;
                if (weightA !== weightB) return weightB - weightA;
                // Secondary sort: most recent first
                return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
            });
        } else {
            // Default: Most recent first
            result.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        }

        return result;
    }, [feedsData?.items, searchQuery, sortBy]);

    // Filter techniques by selected tactic
    const filteredTechniques = useMemo(() => {
        if (!mitreData?.techniques) return [];

        let techniques = mitreData.techniques;

        if (selectedTactic) {
            techniques = techniques.filter((t: MitreTechnique) => t.tacticId === selectedTactic);
        }

        if (searchQuery && activeTab === 'mitre') {
            const lower = searchQuery.toLowerCase();
            techniques = techniques.filter((t: MitreTechnique) =>
                t.id.toLowerCase().includes(lower) ||
                t.name.toLowerCase().includes(lower)
            );
        }

        return techniques.slice(0, 50);
    }, [mitreData?.techniques, selectedTactic, searchQuery, activeTab]);

    const getSeverityColor = (severity?: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-600 text-white';
            case 'high': return 'bg-orange-500 text-white';
            case 'medium': return 'bg-yellow-500 text-black';
            case 'low': return 'bg-blue-500 text-white';
            default: return 'bg-slate-500 text-white';
        }
    };

    const getSeverityIcon = (severity?: string) => {
        switch (severity) {
            case 'critical':
            case 'high':
                return <AlertTriangle className="w-3 h-3" />;
            case 'medium':
                return <AlertCircle className="w-3 h-3" />;
            default:
                return <Info className="w-3 h-3" />;
        }
    };

    const handleCreateThreatFromFeed = () => {
        if (!selectedFeedItem) return;

        const severityToLikelihood: Record<string, string> = {
            critical: 'Almost Certain',
            high: 'Likely',
            medium: 'Possible',
            low: 'Unlikely',
            info: 'Rare',
        };

        createThreatMutation.mutate({
            clientId,
            threatId: `THREAT-INTEL-${Date.now()}`,
            name: selectedFeedItem.title.slice(0, 150),
            description: `**Source:** ${selectedFeedItem.sourceName}\n**Published:** ${new Date(selectedFeedItem.pubDate).toLocaleDateString()}\n\n${selectedFeedItem.description}\n\n[Original Article](${selectedFeedItem.link})`,
            category: 'Technical',
            source: 'External',
            intent: 'Deliberate',
            likelihood: severityToLikelihood[selectedFeedItem.severity || 'info'],
            potentialImpact: selectedFeedItem.cveIds?.length ? `Related CVEs: ${selectedFeedItem.cveIds.join(', ')}` : 'See threat description',
            status: 'active' as const,
        });
    };

    const handleCreateThreatFromTechnique = () => {
        if (!selectedTechnique) return;

        createThreatMutation.mutate({
            clientId,
            threatId: selectedTechnique.id,
            name: `[${selectedTechnique.id}] ${selectedTechnique.name}`,
            description: `**MITRE ATT&CK Technique**\n\n**ID:** ${selectedTechnique.id}\n**Tactic:** ${selectedTechnique.tacticName}\n**Platforms:** ${selectedTechnique.platforms.join(', ')}\n\n${selectedTechnique.description}\n\n**Recommended Mitigations:**\n${selectedTechnique.mitigations.map(m => `- ${m.id}: ${m.name}`).join('\n')}\n\n[View on MITRE ATT&CK](${selectedTechnique.url})`,
            category: 'Technical',
            source: 'External',
            intent: 'Deliberate',
            likelihood: 'Possible',
            potentialImpact: `Based on MITRE ATT&CK tactic: ${selectedTechnique.tacticName}`,
            status: 'active' as const,
        });
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        return 'Just now';
    };

    return (
        <Card className="border border-slate-200 shadow-xl bg-white text-slate-900 overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
                            <Radar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-900">Adversary Intelligence</CardTitle>
                            <CardDescription className="text-slate-500">
                                Live threat feeds & MITRE ATT&CK framework
                            </CardDescription>
                        </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-3 py-1">
                        <Zap className="w-3 h-3 mr-1" />
                        Premium
                    </Badge>
                </div>

                {/* Stats Bar */}
                <div className="flex gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Newspaper className="w-4 h-4 text-blue-500" />
                        <span className="text-slate-500">Feeds:</span>
                        <span className="font-semibold text-slate-900">{feedsData?.items?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-slate-500">Critical:</span>
                        <span className="font-semibold text-red-600">
                            {feedsData?.items?.filter((f: SecurityFeedItem) => f.severity === 'critical').length || 0}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-500" />
                        <span className="text-slate-500">Techniques:</span>
                        <span className="font-semibold text-slate-900">{mitreData?.techniques?.length || 0}</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="px-6 pt-4">
                        <TabsList className="bg-slate-50 border border-slate-200 p-1 w-full grid grid-cols-3">
                            <TabsTrigger
                                value="briefing"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white"
                            >
                                <Zap className="w-4 h-4 mr-2" />
                                Daily Briefing
                            </TabsTrigger>
                            <TabsTrigger
                                value="feeds"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
                            >
                                <Newspaper className="w-4 h-4 mr-2" />
                                Security Feeds
                            </TabsTrigger>
                            <TabsTrigger
                                value="mitre"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
                            >
                                <Swords className="w-4 h-4 mr-2" />
                                MITRE ATT&CK
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Daily Briefing Tab */}
                    <TabsContent value="briefing" className="m-0">
                        <ScrollArea className="h-[500px]">
                            {briefingLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                                    <span className="ml-2 text-slate-400">Analyzing latest threats...</span>
                                </div>
                            ) : !briefing ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No briefing data available</p>
                                </div>
                            ) : (
                                <div className="p-6 space-y-6">
                                    {/* Summary Stats Cards */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                            <div className="text-amber-800 text-xs font-semibold uppercase tracking-wider mb-1">New Vulns</div>
                                            <div className="text-3xl font-bold text-amber-900">{briefing.summary.newCriticalVulns}</div>
                                            <div className="text-[10px] text-amber-700 mt-1 flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                Critical Matches
                                            </div>
                                        </div>
                                        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                                            <div className="text-red-800 text-xs font-semibold uppercase tracking-wider mb-1">Urgent Threats</div>
                                            <div className="text-3xl font-bold text-red-900">{briefing.summary.urgentThreats}</div>
                                            <div className="text-[10px] text-red-700 mt-1 flex items-center gap-1">
                                                <Radar className="w-3 h-3" />
                                                High Priority
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                            <div className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-1">Assets Scanned</div>
                                            <div className="text-3xl font-bold text-slate-900">{briefing.summary.totalScanned}</div>
                                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Last 24 Hours
                                            </div>
                                        </div>
                                    </div>

                                    {/* Take Action Section */}
                                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white shadow-lg overflow-hidden relative">
                                        <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                                                    <Zap className="w-5 h-5 text-amber-400" />
                                                    Daily Action Required
                                                </h4>
                                                <p className="text-slate-300 text-sm max-w-md">
                                                    Review and resolve {briefing.summary.newCriticalVulns} new critical vulnerabilities discovered in your environment today.
                                                </p>
                                            </div>
                                            <Link href={`/clients/${clientId}/risks/vulnerability-workbench`}>
                                                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-lg shadow-amber-500/20">
                                                    Open Workbench
                                                    <ChevronRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Critical Vulns List */}
                                    {briefing.criticalVulns.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-red-500" />
                                                Impacted Internal Assets
                                            </h4>
                                            <div className="space-y-2">
                                                {briefing.criticalVulns.map((v: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white hover:border-red-200 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center text-red-600 font-bold text-xs">
                                                                !
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-semibold text-slate-900">{v.id}</div>
                                                                <div className="text-xs text-slate-500">{v.asset}</div>
                                                            </div>
                                                        </div>
                                                        <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                                                            {v.severity}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Urgent News List */}
                                    {briefing.urgentNews.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                <Newspaper className="w-4 h-4 text-orange-500" />
                                                Urgent Intelligence Alerts
                                            </h4>
                                            <div className="space-y-2">
                                                {briefing.urgentNews.map((n: any, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className="p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                                                        onClick={() => window.open(n.link, '_blank')}
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="text-sm font-semibold text-slate-900 leading-snug">{n.title}</div>
                                                            <ExternalLink className="w-3 h-3 text-slate-300 shrink-0" />
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tight">{n.source}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                    <div className="px-6 py-4 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder={activeTab === 'feeds' ? 'Search feeds, CVEs, tags...' : 'Search techniques (e.g., T1566, Phishing)...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                            />
                        </div>
                        {activeTab === 'feeds' && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setSortBy(prev => prev === 'date' ? 'severity' : 'date')}
                                className={`shrink-0 transition-all duration-200 ${sortBy === 'severity'
                                    ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                                    : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                                title={sortBy === 'severity' ? "Sorted by Criticality" : "Sorted by Date"}
                            >
                                <ArrowUpDown className={`w-4 h-4 ${sortBy === 'severity' ? 'rotate-180 transition-transform' : ''}`} />
                            </Button>
                        )}
                    </div>

                    {/* Security Feeds Tab */}
                    <TabsContent value="feeds" className="m-0">
                        <ScrollArea className="h-[500px]">
                            {feedsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                                    <span className="ml-2 text-slate-400">Loading security feeds...</span>
                                </div>
                            ) : filteredFeeds.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No feed items found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {filteredFeeds.map((item: SecurityFeedItem) => (
                                        <div
                                            key={item.id}
                                            className="p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                                            onClick={() => setSelectedFeedItem(item)}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <Badge className={`text-[10px] ${getSeverityColor(item.severity)}`}>
                                                            {getSeverityIcon(item.severity)}
                                                            <span className="ml-1">{item.severity?.toUpperCase() || 'INFO'}</span>
                                                        </Badge>
                                                        <span className="text-xs text-slate-500">{item.sourceName}</span>
                                                        <span className="text-xs text-slate-600">•</span>
                                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatTimeAgo(item.pubDate)}
                                                        </span>
                                                        {item.relevanceScore && item.relevanceScore > 10 && (
                                                            <>
                                                                <span className="text-xs text-slate-600">•</span>
                                                                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] flex items-center gap-1">
                                                                    <Zap className="w-3 h-3" />
                                                                    Relevant match
                                                                </Badge>
                                                            </>
                                                        )}
                                                    </div>
                                                    <h4 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                                        {item.title}
                                                    </h4>
                                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                                        {item.description}
                                                    </p>

                                                    {/* Impacted Assets Section */}
                                                    {item.impactedAssets && item.impactedAssets.length > 0 && (
                                                        <div className="mt-2 p-2 bg-red-50/50 rounded border border-red-100 flex items-start gap-2">
                                                            <Target className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                                            <div className="flex-1">
                                                                <p className="text-[10px] font-semibold text-red-800 uppercase tracking-wider mb-1">
                                                                    Impacted Infrastructure
                                                                </p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {item.impactedAssets.map((asset) => (
                                                                        <Badge
                                                                            key={asset.id}
                                                                            variant="outline"
                                                                            className="text-[10px] bg-white border-red-200 text-red-700 hover:bg-red-50"
                                                                        >
                                                                            {asset.name}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                        {item.cveIds?.slice(0, 3).map((cve: string) => (
                                                            <Badge key={cve} variant="outline" className="text-[10px] border-red-500/50 text-red-400">
                                                                {cve}
                                                            </Badge>
                                                        ))}
                                                        {item.tags?.slice(0, 3).map((tag: string) => (
                                                            <Badge key={tag} variant="outline" className="text-[10px] border-slate-200 text-slate-500">
                                                                <Tag className="w-2.5 h-2.5 mr-1" />
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                        {item.techStack?.map((tech: string) => (
                                                            <Badge key={tech} variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 font-mono">
                                                                #{tech}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedFeedItem(item);
                                                        setCreateThreatDialog({ open: true, type: 'feed' });
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Create Threat
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>

                        {/* Refresh Button */}
                        <div className="px-6 py-4 border-t border-slate-100">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refreshFeedsMutation.mutate({ clientId })}
                                disabled={refreshFeedsMutation.isPending}
                                className="w-full border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${refreshFeedsMutation.isPending ? 'animate-spin' : ''}`} />
                                {refreshFeedsMutation.isPending ? 'Refreshing...' : 'Refresh Feeds'}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* MITRE ATT&CK Tab */}
                    <TabsContent value="mitre" className="m-0">
                        <div className="flex">
                            {/* Tactics Sidebar */}
                            <div className="w-48 border-r border-slate-100 shrink-0">
                                <div className="p-3 border-b border-slate-100">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tactics</span>
                                </div>
                                <ScrollArea className="h-[440px]">
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => setSelectedTactic(null)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedTactic
                                                ? 'bg-purple-600 text-white shadow-sm'
                                                : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            All Techniques
                                        </button>
                                        {mitreData?.tactics?.map((tactic: MitreTactic) => (
                                            <button
                                                key={tactic.id}
                                                onClick={() => setSelectedTactic(tactic.id)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedTactic === tactic.id
                                                    ? 'bg-purple-600 text-white shadow-sm'
                                                    : 'text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <span className={`font-mono text-[10px] mr-1 ${selectedTactic === tactic.id ? 'text-purple-200' : 'text-slate-400'}`}>{tactic.id}</span>
                                                <br />
                                                {tactic.name}
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Techniques List */}
                            <div className="flex-1">
                                <ScrollArea className="h-[500px]">
                                    {mitreLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                                            <span className="ml-2 text-slate-400">Loading MITRE ATT&CK data...</span>
                                        </div>
                                    ) : filteredTechniques.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400">
                                            <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p>No techniques found</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {filteredTechniques.map((technique: MitreTechnique) => (
                                                <div
                                                    key={technique.id}
                                                    className="p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                                                    onClick={() => setSelectedTechnique(technique)}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-mono">
                                                                    {technique.id}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500">
                                                                    {technique.tacticName}
                                                                </Badge>
                                                                {technique.isSubtechnique && (
                                                                    <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600">
                                                                        Sub-technique
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <h4 className="font-medium text-slate-900 group-hover:text-purple-600 transition-colors">
                                                                {technique.name}
                                                            </h4>
                                                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                                                {technique.description.slice(0, 150)}...
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                {technique.platforms.slice(0, 3).map((platform: string) => (
                                                                    <Badge key={platform} variant="outline" className="text-[10px] border-white/20 text-slate-500">
                                                                        {platform}
                                                                    </Badge>
                                                                ))}
                                                                {technique.mitigations.length > 0 && (
                                                                    <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">
                                                                        <ShieldCheck className="w-2.5 h-2.5 mr-1" />
                                                                        {technique.mitigations.length} mitigations
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedTechnique(technique);
                                                                setCreateThreatDialog({ open: true, type: 'technique' });
                                                            }}
                                                        >
                                                            <Plus className="w-4 h-4 mr-1" />
                                                            Create Risk
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        </div>

                        {/* Refresh Button */}
                        <div className="px-6 py-4 border-t border-white/10">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetchMitre()}
                                className="w-full border-white/20 text-slate-300 hover:bg-white/5"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh MITRE Data
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>

            {/* Feed Item Detail Dialog */}
            <Dialog open={!!selectedFeedItem && !createThreatDialog.open} onOpenChange={(open) => !open && setSelectedFeedItem(null)}>
                <DialogContent className="max-w-2xl bg-white border-slate-200 text-slate-900">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${getSeverityColor(selectedFeedItem?.severity)}`}>
                                {selectedFeedItem?.severity?.toUpperCase() || 'INFO'}
                            </Badge>
                            <span className="text-sm text-slate-500">{selectedFeedItem?.sourceName}</span>
                        </div>
                        <DialogTitle className="text-xl text-slate-900">{selectedFeedItem?.title}</DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Published {selectedFeedItem?.pubDate && new Date(selectedFeedItem.pubDate).toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-slate-600">{selectedFeedItem?.description}</p>

                        {selectedFeedItem?.cveIds && selectedFeedItem.cveIds.length > 0 && (
                            <div>
                                <span className="text-xs font-semibold text-slate-500 uppercase">Related CVEs</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedFeedItem.cveIds.map((cve: string) => (
                                        <a
                                            key={cve}
                                            href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center"
                                        >
                                            <Badge variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                                                {cve}
                                                <ExternalLink className="w-3 h-3 ml-1" />
                                            </Badge>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedFeedItem?.tags && selectedFeedItem.tags.length > 0 && (
                            <div>
                                <span className="text-xs font-semibold text-slate-500 uppercase">Tags</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedFeedItem.tags.map((tag: string) => (
                                        <Badge key={tag} variant="outline" className="border-slate-200 text-slate-600">
                                            <Tag className="w-3 h-3 mr-1" />
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => window.open(selectedFeedItem?.link, '_blank')}
                            className="border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Read Full Article
                        </Button>
                        <Button
                            onClick={() => setCreateThreatDialog({ open: true, type: 'feed' })}
                            className="bg-gradient-to-r from-green-600 to-emerald-600"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Threat from This
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Technique Detail Dialog */}
            <Dialog open={!!selectedTechnique && !createThreatDialog.open} onOpenChange={(open) => !open && setSelectedTechnique(null)}>
                <DialogContent className="max-w-2xl bg-white border-slate-200 text-slate-900 max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-mono">
                                {selectedTechnique?.id}
                            </Badge>
                            <Badge variant="outline" className="border-slate-200 text-slate-500">
                                {selectedTechnique?.tacticName}
                            </Badge>
                        </div>
                        <DialogTitle className="text-xl">{selectedTechnique?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs font-semibold text-slate-500 uppercase">Description</span>
                            <p className="text-slate-600 mt-1 whitespace-pre-wrap text-sm">
                                {selectedTechnique?.description}
                            </p>
                        </div>

                        {selectedTechnique?.platforms && selectedTechnique.platforms.length > 0 && (
                            <div>
                                <span className="text-xs font-semibold text-slate-400 uppercase">Platforms</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedTechnique.platforms.map((platform: string) => (
                                        <Badge key={platform} variant="outline" className="border-blue-500/30 text-blue-400">
                                            {platform}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedTechnique?.mitigations && selectedTechnique.mitigations.length > 0 && (
                            <div>
                                <span className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    Mitigations ({selectedTechnique.mitigations.length})
                                </span>
                                <div className="space-y-2 mt-2">
                                    {selectedTechnique.mitigations.slice(0, 5).map((mitigation: { id: string; name: string; description: string }) => (
                                        <div key={mitigation.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className="bg-green-100 text-green-700 border-green-200 font-mono text-[10px]">
                                                    {mitigation.id}
                                                </Badge>
                                                <span className="font-medium text-sm text-slate-900">{mitigation.name}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2">{mitigation.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => window.open(selectedTechnique?.url, '_blank')}
                            className="border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on MITRE
                        </Button>
                        <Button
                            onClick={() => setCreateThreatDialog({ open: true, type: 'technique' })}
                            className="bg-gradient-to-r from-green-600 to-emerald-600"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Threat from This
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Risk Confirmation Dialog */}
            <Dialog open={createThreatDialog.open} onOpenChange={(open) => setCreateThreatDialog({ ...createThreatDialog, open })}>
                <DialogContent className="bg-white border-slate-200 text-slate-900">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <Plus className="w-5 h-5 text-green-600" />
                            Create Threat from Intelligence
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            This will create a new threat entry in your Threat Library based on the selected {createThreatDialog.type === 'feed' ? 'security alert' : 'MITRE ATT&CK technique'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        {createThreatDialog.type === 'feed' && selectedFeedItem && (
                            <>
                                <p className="font-medium text-slate-900">[Threat Intel] {selectedFeedItem.title.slice(0, 80)}</p>
                                <p className="text-sm text-slate-500 mt-1">From: {selectedFeedItem.sourceName}</p>
                            </>
                        )}
                        {createThreatDialog.type === 'technique' && selectedTechnique && (
                            <>
                                <p className="font-medium text-slate-900">[{selectedTechnique.id}] {selectedTechnique.name}</p>
                                <p className="text-sm text-slate-500 mt-1">Tactic: {selectedTechnique.tacticName}</p>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCreateThreatDialog({ open: false, type: 'feed' })}
                            className="border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={createThreatDialog.type === 'feed' ? handleCreateThreatFromFeed : handleCreateThreatFromTechnique}
                            disabled={createThreatMutation.isPending}
                            className="bg-gradient-to-r from-green-600 to-emerald-600"
                        >
                            {createThreatMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Threat
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

export default AdversaryIntelPanel;
