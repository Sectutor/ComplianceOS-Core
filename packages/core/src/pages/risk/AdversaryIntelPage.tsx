/**
 * Adversary Intelligence Page
 * 
 * Premium feature providing live threat intelligence from security feeds
 * and MITRE ATT&CK framework integration for risk management.
 */

import React from 'react';
import { useParams, Link } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { AdversaryIntelPanel } from '@/components/risk/AdversaryIntelPanel';
import { PageGuide } from '@/components/PageGuide';
import { Button } from '@complianceos/ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import {
    Radar,
    ArrowLeft,
    Shield,
    Zap,
    Target,
    Newspaper,
    TrendingUp,
    BarChart3,
    AlertTriangle,
    Lightbulb,
    ExternalLink
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function AdversaryIntelPage() {
    const params = useParams();
    const clientId = parseInt(params.id || '0');

    // Fetch client info
    const { data: client } = trpc.clients.get.useQuery(
        { id: clientId },
        { enabled: !!clientId }
    );

    // Fetch summary stats
    const { data: summary } = trpc.adversaryIntel.getSummary.useQuery(
        undefined,
        { staleTime: 1000 * 60 * 5 }
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/clients/${clientId}/risks/overview`}>
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Risk Management
                            </Button>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-4 py-1.5 text-sm">
                            <Zap className="w-4 h-4 mr-1.5" />
                            Premium Feature
                        </Badge>
                        <PageGuide
                            title="Adversary Intelligence"
                            description="Live threat feeds and MITRE ATT&CK integration."
                            rationale="Proactive risk management requires knowing what adversaries are doing now."
                            howToUse={[
                                { step: "Browse Feeds", description: "Review the latest CISA and news items daily." },
                                { step: "Create Risks", description: "Click 'Create Risk' on any feed item to instantly start an assessment." },
                                { step: "Explore MITRE", description: "Use the matrix to understand specific tactics (e.g., Phishing) and their mitigations." }
                            ]}
                            integrations={[
                                { name: "Risk Register", description: "One-click conversion of intelligence into tracked risks." },
                                { name: "Vulnerabilities", description: "Cross-reference CISA KEVs with your asset inventory." }
                            ]}
                        />
                    </div>
                </div>

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 text-white">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>

                    <div className="relative z-10 flex items-start justify-between">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/30">
                                    <Radar className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold">Adversary Intelligence</h1>
                                    <p className="text-slate-300 mt-1">Live threat feeds & MITRE ATT&CK framework</p>
                                </div>
                            </div>
                            <p className="text-slate-300 leading-relaxed mb-6">
                                Stay ahead of emerging threats with real-time security intelligence from
                                <span className="text-blue-400"> CISA</span>,
                                <span className="text-green-400"> The Hacker News</span>, and
                                <span className="text-orange-400"> Bleeping Computer</span>.
                                Browse the complete MITRE ATT&CK framework to understand adversary tactics
                                and create targeted risks directly from threat intelligence.
                            </p>
                            <div className="flex items-center gap-4">
                                <a
                                    href="https://attack.mitre.org/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    <Target className="w-4 h-4" />
                                    MITRE ATT&CK Website
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                                <a
                                    href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                                >
                                    <Shield className="w-4 h-4" />
                                    CISA KEV Catalog
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        {summary && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[140px]">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                        <Newspaper className="w-3 h-3" />
                                        Feed Items
                                    </div>
                                    <div className="text-2xl font-bold">{summary.feedItems}</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[140px]">
                                    <div className="flex items-center gap-2 text-red-400 text-xs mb-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Critical
                                    </div>
                                    <div className="text-2xl font-bold text-red-400">{summary.criticalItems}</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[140px]">
                                    <div className="flex items-center gap-2 text-purple-400 text-xs mb-1">
                                        <Target className="w-3 h-3" />
                                        Techniques
                                    </div>
                                    <div className="text-2xl font-bold">{summary.techniques}</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[140px]">
                                    <div className="flex items-center gap-2 text-cyan-400 text-xs mb-1">
                                        <BarChart3 className="w-3 h-3" />
                                        Tactics
                                    </div>
                                    <div className="text-2xl font-bold">{summary.tactics}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Tags */}
                {summary?.topTags && summary.topTags.length > 0 && (
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                Trending Threats
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {summary.topTags.map((item) => (
                                    <Badge
                                        key={item.tag}
                                        variant="outline"
                                        className="border-slate-300 text-slate-600 px-3 py-1"
                                    >
                                        {item.tag}
                                        <span className="ml-1.5 text-xs bg-slate-100 px-1.5 rounded-full">
                                            {item.count}
                                        </span>
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Recent CVEs */}
                {summary?.recentCves && summary.recentCves.length > 0 && (
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                CVEs in Recent News
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {summary.recentCves.map((cve) => (
                                    <a
                                        key={cve}
                                        href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Badge
                                            className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                                        >
                                            {cve}
                                            <ExternalLink className="w-3 h-3 ml-1" />
                                        </Badge>
                                    </a>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Intelligence Panel */}
                <AdversaryIntelPanel
                    clientId={clientId}
                    onRiskCreated={(risk) => {
                        console.log('Risk created:', risk);
                    }}
                />

                {/* Usage Tips */}
                <Card className="border-blue-100 bg-blue-50/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-800">
                            <Lightbulb className="w-4 h-4" />
                            How to Use Adversary Intelligence
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-700">
                            <div className="flex gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                <p>Browse live security feeds to stay aware of emerging threats and vulnerabilities affecting your industry.</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                <p>Explore MITRE ATT&CK techniques to understand how adversaries operate and what defenses to prioritize.</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                <p>Click "Create Risk" on any item to instantly add it to your Risk Register with pre-filled details.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

export default AdversaryIntelPage;
