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
    ArrowUpDown,
    Bookmark,
    BookmarkCheck,
    Users,
    Moon,
    Sun,
    Filter,
    Bell,
    Settings,
    FileText
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

interface MitreGroup {
    id: string;
    name: string;
    alias: string[];
    description: string;
    url: string;
    techniques: string[];
    software: string[];
    created: string;
    modified: string;
}

interface CveInfo {
    id: string;
    cvssScore: number | null;
    cvssVector: string | null;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'none';
    description: string;
    published: string;
    affectedProducts: string[];
}

export function AdversaryIntelPanel({ clientId, onRiskCreated }: AdversaryIntelPanelProps) {
    // URL validation helper
    const isValidUrl = (url: string): boolean => {
        if (!url) return true; // Allow empty
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };
    const [activeTab, setActiveTab] = useState('briefing');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTactic, setSelectedTactic] = useState<string | null>(null);
    const [selectedTechnique, setSelectedTechnique] = useState<MitreTechnique | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<MitreGroup | null>(null);
    const [selectedFeedItem, setSelectedFeedItem] = useState<SecurityFeedItem | null>(null);
    const [createThreatDialog, setCreateThreatDialog] = useState<{ open: boolean; type: 'feed' | 'technique' | 'group' }>({ open: false, type: 'feed' });
    const [sortBy, setSortBy] = useState<'date' | 'severity'>('date');
    const [darkMode, setDarkMode] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
    const [alertSettingsOpen, setAlertSettingsOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<string | null>(null);

    // Category options for filtering
    const categories = ['all', 'ransomware', 'phishing', 'malware', 'vulnerability', 'exploit', 'apt', 'data breach', 'zero-day', 'ddos', 'supply chain'];

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

    // Fetch MITRE Groups
    const { data: mitreGroupsData, isLoading: groupsLoading } = trpc.adversaryIntel.getMitreGroups.useQuery(
        { clientId },
        { staleTime: 1000 * 60 * 60 * 24 } // 24 hours
    );

    // Fetch CVE info when CVEs are available
    const { data: cveData } = trpc.adversaryIntel.getCveInfos.useQuery(
        { cveIds: feedsData?.items?.flatMap((f: SecurityFeedItem) => f.cveIds || []) || [] },
        { enabled: !!(feedsData?.items?.length && feedsData.items.some((f: SecurityFeedItem) => f.cveIds?.length)) }
    );

    // Fetch alert settings
    const { data: alertSettings, refetch: refetchAlertSettings } = trpc.adversaryIntel.getAlertSettings.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    // Save alert settings mutation
    const saveAlertSettingsMutation = trpc.adversaryIntel.saveAlertSettings.useMutation({
        onSuccess: () => {
            toast.success('Alert settings saved');
            refetchAlertSettings();
        },
        onError: (err: any) => toast.error(`Failed to save settings: ${err.message}`),
    });

    // Test alert settings mutation
    const testAlertMutation = trpc.adversaryIntel.testAlertSettings.useMutation({
        onSuccess: (results) => {
            const succeeded = results.filter((r: any) => r.success).length;
            const failed = results.filter((r: any) => !r.success).length;
            if (succeeded > 0) {
                toast.success(`Test alert sent via ${succeeded} channel(s)`);
            }
            if (failed > 0) {
                toast.error(`${failed} channel(s) failed`);
            }
        },
        onError: (err: any) => toast.error(`Test failed: ${err.message}`),
    });

    // Generate report mutation
    const generateReportMutation = trpc.adversaryIntel.generateReport.useMutation({
        onSuccess: (data) => {
            setGeneratedReport(data);
            toast.success('Report generated');
        },
        onError: (err: any) => toast.error(`Failed to generate report: ${err.message}`),
    });

    // Toggle bookmark function
    const toggleBookmark = (id: string) => {
        setBookmarks(prev => {
            const newBookmarks = new Set(prev);
            if (newBookmarks.has(id)) {
                newBookmarks.delete(id);
                toast.info('Removed from favorites');
            } else {
                newBookmarks.add(id);
                toast.success('Added to favorites');
            }
            return newBookmarks;
        });
    };

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

        // Filter by category
        if (categoryFilter && categoryFilter !== 'all') {
            result = result.filter((item: SecurityFeedItem) =>
                item.tags?.some((t: string) => t.toLowerCase().includes(categoryFilter.toLowerCase()))
            );
        }

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
    }, [feedsData?.items, searchQuery, sortBy, categoryFilter]);

    // Get bookmarked items
    const bookmarkedFeeds = useMemo(() => {
        if (!feedsData?.items) return [];
        return feedsData.items.filter((item: SecurityFeedItem) => bookmarks.has(item.id));
    }, [feedsData?.items, bookmarks]);

    // Filter groups by search
    const filteredGroups = useMemo(() => {
        if (!mitreGroupsData?.groups) return [];
        let groups = mitreGroupsData.groups;
        if (searchQuery && activeTab === 'groups') {
            const lower = searchQuery.toLowerCase();
            groups = groups.filter((g: MitreGroup) =>
                g.name.toLowerCase().includes(lower) ||
                g.alias.some((a: string) => a.toLowerCase().includes(lower))
            );
        }
        return groups.slice(0, 50);
    }, [mitreGroupsData?.groups, searchQuery, activeTab]);

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
                    <div className="px-6 pt-4 flex items-center justify-between gap-4">
                        <TabsList className="bg-slate-50 border border-slate-200 p-1 grid grid-cols-6">
                            <TabsTrigger
                                value="briefing"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white"
                            >
                                <Zap className="w-4 h-4 mr-2" />
                                Briefing
                            </TabsTrigger>
                            <TabsTrigger
                                value="feeds"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
                            >
                                <Newspaper className="w-4 h-4 mr-2" />
                                Feeds
                            </TabsTrigger>
                            <TabsTrigger
                                value="iocs"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-orange-600 data-[state=active]:text-white"
                            >
                                <Target className="w-4 h-4 mr-2" />
                                IOCs
                            </TabsTrigger>
                            <TabsTrigger
                                value="mitre"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
                            >
                                <Swords className="w-4 h-4 mr-2" />
                                Techniques
                            </TabsTrigger>
                            <TabsTrigger
                                value="groups"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-rose-600 data-[state=active]:text-white"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Groups
                            </TabsTrigger>
                            <TabsTrigger
                                value="bookmarks"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-teal-600 data-[state=active]:text-white"
                            >
                                <BookmarkCheck className="w-4 h-4 mr-2" />
                                Saved
                            </TabsTrigger>
                        </TabsList>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDarkMode(!darkMode)}
                            className="shrink-0"
                            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setAlertSettingsOpen(true)}
                            className="shrink-0 relative"
                            title="Alert Settings"
                        >
                            <Bell className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setReportOpen(true)}
                            className="shrink-0"
                            title="Generate Threat Report"
                        >
                            <FileText className="w-4 h-4" />
                        </Button>
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
                    <div className="px-6 py-4 flex gap-2 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder={activeTab === 'feeds' ? 'Search feeds, CVEs, tags...' : activeTab === 'groups' ? 'Search threat groups...' : 'Search techniques (e.g., T1566, Phishing)...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                            />
                        </div>
                        {activeTab === 'feeds' && (
                            <>
                                <div className="relative">
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="h-10 px-3 pr-8 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>
                                                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                    <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
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
                            </>
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
                                            className="p-4 hover:bg-slate-50 transition-colors group cursor-pointer relative"
                                            onClick={() => setSelectedFeedItem(item)}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity ${bookmarks.has(item.id) ? 'opacity-100' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleBookmark(item.id);
                                                }}
                                                title={bookmarks.has(item.id) ? 'Remove from favorites' : 'Add to favorites'}
                                            >
                                                {bookmarks.has(item.id) ? (
                                                    <BookmarkCheck className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                ) : (
                                                    <Bookmark className="w-4 h-4 text-slate-400" />
                                                )}
                                            </Button>
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
                                                        {item.cveIds?.slice(0, 3).map((cve: string) => {
                                                            const cveInfo = cveData?.[cve];
                                                            return (
                                                                <a
                                                                    key={cve}
                                                                    href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="inline-flex items-center gap-1"
                                                                >
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`text-[10px] cursor-pointer transition-colors ${cveInfo?.cvssScore && cveInfo.cvssScore >= 9.0 ? 'bg-red-100 border-red-500 text-red-700 hover:bg-red-200' :
                                                                            cveInfo?.cvssScore && cveInfo.cvssScore >= 7.0 ? 'bg-orange-100 border-orange-500 text-orange-700 hover:bg-orange-200' :
                                                                                cveInfo?.cvssScore && cveInfo.cvssScore >= 4.0 ? 'bg-yellow-100 border-yellow-500 text-yellow-700 hover:bg-yellow-200' :
                                                                                    'border-red-500/50 text-red-400 hover:bg-red-50'
                                                                            }`}
                                                                    >
                                                                        {cve}
                                                                        {cveInfo?.cvssScore && (
                                                                            <span className="ml-1 font-bold">
                                                                                {cveInfo.cvssScore.toFixed(1)}
                                                                            </span>
                                                                        )}
                                                                    </Badge>
                                                                </a>
                                                            );
                                                        })}
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

                    {/* Threat Groups Tab */}
                    <TabsContent value="groups" className="m-0">
                        <ScrollArea className="h-[600px]">
                            {groupsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-red-400" />
                                    <span className="ml-2 text-slate-400">Loading threat groups...</span>
                                </div>
                            ) : filteredGroups.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No threat groups found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {filteredGroups.map((group: MitreGroup) => (
                                        <div
                                            key={group.id}
                                            className="p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                                            onClick={() => setSelectedGroup(group)}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <Badge className="bg-red-100 text-red-700 border-red-200 font-mono">
                                                            {group.id}
                                                        </Badge>
                                                        {group.alias && group.alias.length > 0 && (
                                                            <span className="text-xs text-slate-500">
                                                                aka {group.alias.slice(0, 2).join(', ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="font-semibold text-slate-900 group-hover:text-red-600 transition-colors">
                                                        {group.name}
                                                    </h4>
                                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                                        {group.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                        <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500">
                                                            <Target className="w-3 h-3 mr-1" />
                                                            {group.techniques.length} techniques
                                                        </Badge>
                                                        {group.software && group.software.length > 0 && (
                                                            <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500">
                                                                <Swords className="w-3 h-3 mr-1" />
                                                                {group.software.length} tools
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedGroup(group);
                                                        setCreateThreatDialog({ open: true, type: 'group' });
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Track
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    {/* IOCs Tab */}
                    <TabsContent value="iocs" className="m-0">
                        <div className="p-4 border-b border-slate-100">
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-2 flex-1">
                                    <Input
                                        placeholder="Search IOCs..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="max-w-sm"
                                    />
                                    <select
                                        className="border border-slate-200 rounded-md px-3 py-2 text-sm"
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                    >
                                        <option value="all">All Types</option>
                                        <option value="ip">IP</option>
                                        <option value="domain">Domain</option>
                                        <option value="hash">Hash</option>
                                        <option value="url">URL</option>
                                        <option value="email">Email</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            // Trigger export - this would open a dialog
                                            toast.info('Export feature - use exportIocs API');
                                        }}
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Export
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            // Trigger bulk import - this would open a dialog
                                            toast.info('Import feature - use bulkImportIocs API');
                                        }}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add IOC
                                    </Button>
                                </div>
                            </div>
                            <div className="text-sm text-slate-500">
                                <span className="font-semibold text-slate-900">{feedsData?.items?.length || 0}</span> IOCs from feeds +
                                <span className="font-semibold text-slate-900"> 0</span> manually added
                            </div>
                        </div>
                        <ScrollArea className="h-[500px]">
                            <div className="p-4 text-center text-slate-400">
                                <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>IOC Management</p>
                                <p className="text-xs mt-2">Extract, track, and export Indicators of Compromise</p>
                                {/**
                                 * TODO: Once tRPC client is regenerated, add:
                                 * const { data: iocStats } = trpc.adversaryIntel.getIocStats.useQuery({ clientId });
                                 * And use iocStats?.byType to display actual counts
                                 */}
                                <div className="mt-4 grid grid-cols-2 gap-4 max-w-md mx-auto">
                                    <div className="p-3 bg-slate-50 rounded-lg text-left">
                                        <div className="text-lg font-bold text-slate-900">-</div>
                                        <div className="text-xs text-slate-500">IP Addresses</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg text-left">
                                        <div className="text-lg font-bold text-slate-900">-</div>
                                        <div className="text-xs text-slate-500">Domains</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg text-left">
                                        <div className="text-lg font-bold text-slate-900">-</div>
                                        <div className="text-xs text-slate-500">Hashes</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg text-left">
                                        <div className="text-lg font-bold text-slate-900">-</div>
                                        <div className="text-xs text-slate-500">URLs</div>
                                    </div>
                                </div>
                                <p className="text-xs mt-4 text-slate-400">
                                    Enable IOC extraction from threat feeds to see statistics
                                </p>
                                <Button
                                    className="mt-4 bg-gradient-to-r from-red-600 to-orange-600"
                                    onClick={() => toast.info('Full IOC management coming soon')}
                                >
                                    <Zap className="w-4 h-4 mr-2" />
                                    Enable IOC Management
                                </Button>
                            </div>
                        </ScrollArea>
                    </TabsContent>

                {/* Bookmarks Tab */}
                <TabsContent value="bookmarks" className="m-0">
                    <ScrollArea className="h-[600px]">
                        {bookmarkedFeeds.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No saved items</p>
                                <p className="text-xs mt-2">Click the bookmark icon on any feed item to save it here</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {bookmarkedFeeds.map((item: SecurityFeedItem) => (
                                    <div
                                        key={item.id}
                                        className="p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                                        onClick={() => setSelectedFeedItem(item)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <Badge className={`text-[10px] ${getSeverityColor(item.severity)}`}>
                                                        {item.severity?.toUpperCase() || 'INFO'}
                                                    </Badge>
                                                    <span className="text-xs text-slate-500">{item.sourceName}</span>
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatTimeAgo(item.pubDate)}
                                                    </span>
                                                </div>
                                                <h4 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                                    {item.title}
                                                </h4>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleBookmark(item.id);
                                                }}
                                            >
                                                <BookmarkCheck className="w-4 h-4 text-amber-500 fill-amber-500" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </CardContent>

            {/* Feed Item Detail Dialog */ }
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

    {/* Technique Detail Dialog */ }
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

    {/* Create Risk Confirmation Dialog */ }
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

    {/* Alert Settings Dialog */ }
    <Dialog open={alertSettingsOpen} onOpenChange={setAlertSettingsOpen}>
        <DialogContent className="max-w-lg">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Threat Alert Settings
                </DialogTitle>
                <DialogDescription>
                    Configure real-time alerts for critical threat intelligence.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
                {/* Channel Configuration */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Alert Channels</h4>

                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={alertSettings?.webhookEnabled || false}
                            onChange={(e) => {
                                saveAlertSettingsMutation.mutate({
                                    clientId,
                                    webhookEnabled: e.target.checked
                                });
                            }}
                            className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">Webhook Notifications</span>
                    </label>

                    {alertSettings?.webhookEnabled && (
                        <Input
                            placeholder="https://your-webhook-url.com/alerts"
                            value={alertSettings?.webhookUrl || ''}
                            onChange={(e) => {
                                const url = e.target.value;
                                if (url && !isValidUrl(url)) {
                                    toast.error('Invalid URL format');
                                    return;
                                }
                                saveAlertSettingsMutation.mutate({
                                    clientId,
                                    webhookUrl: url
                                });
                            }}
                            className="mt-2"
                        />
                    )}

                    <label className="flex items-center gap-3 mt-3">
                        <input
                            type="checkbox"
                            checked={alertSettings?.slackEnabled || false}
                            onChange={(e) => {
                                saveAlertSettingsMutation.mutate({
                                    clientId,
                                    slackEnabled: e.target.checked
                                });
                            }}
                            className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">Slack Notifications</span>
                    </label>

                    {alertSettings?.slackEnabled && (
                        <Input
                            placeholder="https://hooks.slack.com/services/..."
                            value={alertSettings?.slackWebhookUrl || ''}
                            onChange={(e) => {
                                const url = e.target.value;
                                if (url && !isValidUrl(url)) {
                                    toast.error('Invalid URL format');
                                    return;
                                }
                                saveAlertSettingsMutation.mutate({
                                    clientId,
                                    slackWebhookUrl: url
                                });
                            }}
                            className="mt-2"
                        />
                    )}
                </div>

                {/* Alert Triggers */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Alert Triggers</h4>

                    <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={alertSettings?.alertOnCritical ?? true}
                                onChange={(e) => saveAlertSettingsMutation.mutate({ clientId, alertOnCritical: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm">Critical Severity</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={alertSettings?.alertOnHigh ?? true}
                                onChange={(e) => saveAlertSettingsMutation.mutate({ clientId, alertOnHigh: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm">High Severity</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={alertSettings?.alertOnMedium ?? false}
                                onChange={(e) => saveAlertSettingsMutation.mutate({ clientId, alertOnMedium: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm">Medium Severity</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={alertSettings?.alertOnNewCve ?? true}
                                onChange={(e) => saveAlertSettingsMutation.mutate({ clientId, alertOnNewCve: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm">New CVEs</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={alertSettings?.alertOnZeroDay ?? true}
                                onChange={(e) => saveAlertSettingsMutation.mutate({ clientId, alertOnZeroDay: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm">Zero-Day</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={alertSettings?.alertOnRansomware ?? true}
                                onChange={(e) => saveAlertSettingsMutation.mutate({ clientId, alertOnRansomware: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm">Ransomware</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={alertSettings?.alertOnApt ?? true}
                                onChange={(e) => saveAlertSettingsMutation.mutate({ clientId, alertOnApt: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm">APT Activity</span>
                        </label>
                    </div>
                </div>

                {/* CVSS Threshold */}
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold">CVSS Score Threshold</h4>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">Alert on CVSS ≥</span>
                        <select
                            value={alertSettings?.cvssThreshold ?? 7}
                            onChange={(e) => saveAlertSettingsMutation.mutate({ clientId, cvssThreshold: parseInt(e.target.value) })}
                            className="px-3 py-1.5 rounded border border-slate-200 text-sm"
                        >
                            <option value={9}>9.0 (Critical)</option>
                            <option value={7}>7.0 (High)</option>
                            <option value={4}>4.0 (Medium)</option>
                            <option value={0}>All (0+)</option>
                        </select>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button
                    variant="outline"
                    onClick={() => testAlertMutation.mutate({ clientId })}
                    disabled={testAlertMutation.isPending}
                >
                    {testAlertMutation.isPending ? 'Testing...' : 'Test Configuration'}
                </Button>
                <Button onClick={() => setAlertSettingsOpen(false)}>
                    Done
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Report Generation Dialog */ }
    <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Generate Threat Intelligence Report
                </DialogTitle>
                <DialogDescription>
                    Create a comprehensive threat intelligence report with your selected data
                </DialogDescription>
            </DialogHeader>

            {generatedReport ? (
                <div className="flex flex-col gap-4">
                    <div className="border rounded-lg overflow-hidden">
                        <iframe
                            srcDoc={generatedReport}
                            className="w-full h-[500px]"
                            title="Threat Report Preview"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                const printWindow = window.open('', '_blank');
                                if (printWindow) {
                                    printWindow.document.write(generatedReport);
                                    printWindow.document.close();
                                    printWindow.print();
                                }
                            }}
                        >
                            Print / Save as PDF
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setGeneratedReport(null)}
                        >
                            Generate New Report
                        </Button>
                        <Button onClick={() => setReportOpen(false)}>
                            Close
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                defaultChecked
                                className="w-4 h-4 rounded"
                                id="includeFeeds"
                            />
                            <span>Threat Intelligence Feeds</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                defaultChecked
                                className="w-4 h-4 rounded"
                                id="includeMitre"
                            />
                            <span>MITRE ATT&CK Techniques</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                defaultChecked
                                className="w-4 h-4 rounded"
                                id="includeGroups"
                            />
                            <span>Threat Actor Groups</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                defaultChecked
                                className="w-4 h-4 rounded"
                                id="includeCves"
                            />
                            <span>CVE Vulnerabilities</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                defaultChecked
                                className="w-4 h-4 rounded"
                                id="includeBriefing"
                            />
                            <span>Daily Briefing</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded"
                                id="includeBookmarks"
                            />
                            <span>Bookmarked Items</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button onClick={() => setReportOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                const options = {
                                    includeFeeds: (document.getElementById('includeFeeds') as HTMLInputElement)?.checked ?? true,
                                    includeMitre: (document.getElementById('includeMitre') as HTMLInputElement)?.checked ?? true,
                                    includeGroups: (document.getElementById('includeGroups') as HTMLInputElement)?.checked ?? true,
                                    includeCves: (document.getElementById('includeCves') as HTMLInputElement)?.checked ?? true,
                                    includeBriefing: (document.getElementById('includeBriefing') as HTMLInputElement)?.checked ?? true,
                                    includeBookmarks: (document.getElementById('includeBookmarks') as HTMLInputElement)?.checked ?? false,
                                };
                                generateReportMutation.mutate({ clientId, ...options });
                            }}
                            disabled={generateReportMutation.isPending}
                        >
                            {generateReportMutation.isPending ? 'Generating...' : 'Generate Report'}
                        </Button>
                    </div>
                </div>
            )}
        </DialogContent>
    </Dialog>
        </Card >
    );
}

export default AdversaryIntelPanel;
