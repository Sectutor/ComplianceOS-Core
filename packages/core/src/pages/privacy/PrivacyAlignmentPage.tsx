import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import {
    CheckCircle2, Shield, Lock, FileKey, Server, Users, BookOpen, Scale,
    Globe, Database, Activity, LayoutDashboard, Eye, FileText, UserCheck, AlertTriangle,
    FileCheck2, ShieldAlert
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { cn } from '@/lib/utils';
import { Button } from '@complianceos/ui/ui/button';

import { regulations } from '@/data/regulations';
import { Link, useParams } from 'wouter';
import { useClientContext } from '@/contexts/ClientContext';


export default function PrivacyAlignmentPage() {
    const { clientId } = useParams<{ clientId: string }>();
    const { selectedClientId } = useClientContext();

    // Filter for privacy regulations only
    const privacyFrameworks = regulations.filter(r => r.type === 'Privacy');

    // Helper for icons (mapping IDs to lucide icons)
    const getFrameworkIcon = (id: string) => {
        switch (id) {
            case 'iso27701': return Shield;
            case 'gdpr':
            case 'uk-gdpr': return Globe;
            case 'ccpa':
            case 'vcdpa':
            case 'cpa':
            case 'ctdpa':
            case 'ucpa': return Scale;
            case 'hipaa': return Activity;
            case 'pipeda':
            case 'lgpd': return Lock;
            default: return FileText;
        }
    };

    // Helper for clause icons (mapping IDs to lucide icons)
    const getClauseIcon = (frameworkId: string, clauseId: string) => {
        switch (frameworkId) {
            case 'iso27701':
                switch (clauseId) {
                    case 'pims': return Shield;
                    case 'controllers': return Users;
                    case 'processors': return Server;
                    default: return FileText;
                }
            case 'hipaa':
                switch (clauseId) {
                    case 'privacy': return Eye;
                    case 'security': return Lock;
                    case 'breach': return AlertTriangle;
                    default: return FileText;
                }
            case 'gdpr':
                switch (clauseId) {
                    case 'principles': return Scale;
                    case 'rights': return UserCheck;
                    default: return FileText;
                }
            case 'ccpa':
                switch (clauseId) {
                    case 'consumer-rights': return FileKey;
                    default: return FileText;
                }
            default: return FileText;
        }
    };

    // Helper for clause colors
    const getClauseColor = (frameworkId: string, clauseId: string) => {
        switch (frameworkId) {
            case 'iso27701':
                switch (clauseId) {
                    case 'pims': return 'text-blue-600';
                    case 'controllers': return 'text-indigo-600';
                    case 'processors': return 'text-purple-600';
                    default: return 'text-gray-600';
                }
            case 'hipaa':
                switch (clauseId) {
                    case 'privacy': return 'text-teal-600';
                    case 'security': return 'text-slate-700';
                    case 'breach': return 'text-red-600';
                    default: return 'text-gray-600';
                }
            case 'gdpr':
                switch (clauseId) {
                    case 'principles': return 'text-blue-600';
                    case 'rights': return 'text-green-600';
                    default: return 'text-gray-600';
                }
            case 'ccpa':
                switch (clauseId) {
                    case 'consumer-rights': return 'text-orange-600';
                    default: return 'text-gray-600';
                }
            default: return 'text-gray-600';
        }
    };

    // Helper for clause background colors
    const getClauseBgColor = (frameworkId: string, clauseId: string) => {
        switch (frameworkId) {
            case 'iso27701':
                switch (clauseId) {
                    case 'pims': return 'bg-blue-50';
                    case 'controllers': return 'bg-indigo-50';
                    case 'processors': return 'bg-purple-50';
                    default: return 'bg-gray-50';
                }
            case 'hipaa':
                switch (clauseId) {
                    case 'privacy': return 'bg-teal-50';
                    case 'security': return 'bg-slate-100';
                    case 'breach': return 'bg-red-50';
                    default: return 'bg-gray-50';
                }
            case 'gdpr':
                switch (clauseId) {
                    case 'principles': return 'bg-blue-50';
                    case 'rights': return 'bg-green-50';
                    default: return 'bg-gray-50';
                }
            case 'ccpa':
                switch (clauseId) {
                    case 'consumer-rights': return 'bg-orange-50';
                    default: return 'bg-gray-50';
                }
            default: return 'bg-gray-50';
        }
    };


    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <div className="w-full space-y-12">
                {/* Header */}
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 text-white mb-4">
                        <Shield className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        Privacy Compliance Alignment
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Comprehensive alignment with Global Privacy Standards and Regulations
                    </p>
                </div>

                {/* Framework Tabs */}
                <Tabs defaultValue="iso27701" className="space-y-10">
                    <div className="flex justify-center">
                        <TabsList className="h-auto p-1.5 bg-[#1C4D8D] rounded-2xl shadow-2xl flex-wrap justify-center overflow-x-auto border border-white/10">
                            {privacyFrameworks.map(fw => {
                                const Icon = getFrameworkIcon(fw.id);
                                return (
                                    <TabsTrigger
                                        key={fw.id}
                                        value={fw.id}
                                        className="gap-2 px-8 py-3.5 text-sm font-bold data-[state=active]:bg-[#3ABEF9] data-[state=active]:text-white text-white/80 hover:bg-[#3ABEF9] hover:text-white rounded-xl transition-all duration-300"
                                    >
                                        <Icon className="h-4.5 w-4.5" />
                                        {fw.name}
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </div>

                    {privacyFrameworks.map(fw => {
                        const Icon = getFrameworkIcon(fw.id);
                        return (
                            <TabsContent key={fw.id} value={fw.id} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Framework Description Card */}
                                <Card className="border-2 border-slate-300 bg-white shadow-lg overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Icon className="w-32 h-32" />
                                    </div>
                                    <CardHeader className="bg-gradient-to-r from-slate-100 to-gray-50 border-b">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-slate-800 rounded-xl text-white shadow-md">
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-2xl font-bold">{fw.name} Compliance</CardTitle>
                                                    <CardDescription className="text-base mt-1">
                                                        {fw.description}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Link href={`/clients/${clientId}/privacy/assessments/${fw.id}`}>
                                                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex gap-3 group">
                                                    <Activity className="w-5 h-5 group-hover:animate-pulse" />
                                                    Start Compliance Assessment
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardHeader>
                                </Card>

                                {/* Areas Tabs */}
                                <Tabs defaultValue={fw.articles[0]?.id} className="space-y-8">
                                    <TabsList className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 h-auto bg-transparent p-0">
                                        {fw.articles.slice(0, 10).map(article => {
                                            const ClauseIcon = getClauseIcon(fw.id, article.id);
                                            return (
                                                <TabsTrigger
                                                    key={article.id}
                                                    value={article.id}
                                                    className="h-auto py-5 px-4 flex flex-col items-center gap-3 border border-slate-200 bg-white data-[state=active]:bg-[#1C4D8D] data-[state=active]:text-white data-[state=active]:border-[#1C4D8D] rounded-2xl transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 group/article"
                                                >
                                                    <div className={cn("p-2.5 rounded-xl group-data-[state=active]/article:bg-white/10 transition-colors", getClauseBgColor(fw.id, article.id))}>
                                                        <ClauseIcon className={cn("h-6 w-6", getClauseColor(fw.id, article.id), "group-data-[state=active]/article:text-white")} />
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] opacity-60 mb-1 block">Article {article.numericId}</span>
                                                        <span className="text-sm font-bold line-clamp-1">{article.title}</span>
                                                    </div>
                                                </TabsTrigger>
                                            );
                                        })}
                                    </TabsList>

                                    {fw.articles.map(article => {
                                        const ClauseIcon = getClauseIcon(fw.id, article.id);
                                        const colorClass = getClauseColor(fw.id, article.id);
                                        const bgColorClass = getClauseBgColor(fw.id, article.id);

                                        return (
                                            <TabsContent key={article.id} value={article.id} className="animate-in fade-in zoom-in-95 duration-300">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                    <Card className="border-none bg-white shadow-xl rounded-2xl overflow-hidden ring-1 ring-slate-200">
                                                        <div className={cn("h-2", colorClass.replace('text', 'bg'))} />
                                                        <CardHeader>
                                                            <div className="flex items-center gap-4 mb-4">
                                                                <div className={cn("p-4 rounded-2xl shadow-inner", bgColorClass)}>
                                                                    <ClauseIcon className={cn("h-8 w-8", colorClass)} />
                                                                </div>
                                                                <div>
                                                                    <Badge variant="outline" className="mb-1 uppercase tracking-widest text-[10px] font-black border-slate-300">
                                                                        Regulatory Requirement
                                                                    </Badge>
                                                                    <CardTitle className="text-2xl font-bold tracking-tight">{article.title}</CardTitle>
                                                                </div>
                                                            </div>
                                                            <CardDescription className="text-base leading-relaxed p-4 bg-slate-50 rounded-xl italic border-l-4 border-slate-300">
                                                                {article.description}
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="space-y-6">
                                                            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                                                                <BookOpen className="h-5 w-5 text-slate-400" />
                                                                Key Obligations
                                                            </h4>
                                                            <ul className="space-y-4">
                                                                {(article.subArticles || []).map((req, idx) => (
                                                                    <li key={idx} className="flex items-start gap-4 group">
                                                                        <div className={cn("mt-1 p-1 rounded-full", bgColorClass)}>
                                                                            <CheckCircle2 className={cn("h-4 w-4", colorClass)} />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <p className="font-bold text-slate-800 leading-tight">{req.title}</p>
                                                                            <p className="text-sm text-slate-500 leading-relaxed">{req.description}</p>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </CardContent>
                                                    </Card>

                                                    <Card className="border-none bg-slate-900 text-white shadow-2xl rounded-2xl overflow-hidden">
                                                        <CardHeader className="pb-4">
                                                            <CardTitle className="text-2xl font-bold flex items-center gap-3">
                                                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                                                    <LayoutDashboard className="h-6 w-6 text-blue-400" />
                                                                </div>
                                                                Platform Implementation
                                                            </CardTitle>
                                                            <CardDescription className="text-slate-400">
                                                                ComplianceOS technical and organizational controls to address this requirement.
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="space-y-4 pt-4">
                                                            {/* Dynamic implementation details Based on standard */}
                                                            <div className="space-y-4">
                                                                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-default group">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <h5 className="font-bold text-blue-400 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                                            <FileCheck2 className="h-4 w-4" />
                                                                            Integrated Audit Trails
                                                                        </h5>
                                                                        <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-none">Active</Badge>
                                                                    </div>
                                                                    <p className="text-sm text-slate-400 leading-relaxed">Tamper-proof logging across all data processing activities with cryptographic verification.</p>
                                                                </div>
                                                                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-default group">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <h5 className="font-bold text-blue-400 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                                            <ShieldAlert className="h-4 w-4" />
                                                                            DPIA Engine
                                                                        </h5>
                                                                        <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-none">Ready</Badge>
                                                                    </div>
                                                                    <p className="text-sm text-slate-400 leading-relaxed">Automated triggers for High-Risk processing assessments based on your Data Inventory.</p>
                                                                </div>
                                                                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-default group">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <h5 className="font-bold text-blue-400 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                                            <Lock className="h-4 w-4" />
                                                                            Access Governance
                                                                        </h5>
                                                                        <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-none">Review</Badge>
                                                                    </div>
                                                                    <p className="text-sm text-slate-400 leading-relaxed">RBAC controls and quarterly access reviews implemented through the Identity module.</p>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </TabsContent>
                                        );
                                    })}
                                </Tabs>
                            </TabsContent>
                        );
                    })}
                </Tabs>

                {/* Strategic Value Card */}
                <Card className="border-2 border-slate-300 bg-gradient-to-br from-slate-100 to-gray-200 shadow-lg mt-12">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Scale className="w-6 h-6 text-slate-700" />
                            Strategic Value
                        </CardTitle>
                        <CardDescription>
                            Unified privacy management across global jurisdictions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <Shield className="w-5 h-5 text-slate-700" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">Global Compliance</h4>
                                        <p className="text-xs text-muted-foreground">Map data once, satisfy GDPR, CCPA, and ISO requirements</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <UserCheck className="w-5 h-5 text-slate-700" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">Trust Center</h4>
                                        <p className="text-xs text-muted-foreground">Build customer trust with transparent privacy practices</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <Server className="w-5 h-5 text-slate-700" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">Risk Reduction</h4>
                                        <p className="text-xs text-muted-foreground">Minimize breach impact with proactive controls</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <Scale className="w-5 h-5 text-slate-700" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">Audit Ready</h4>
                                        <p className="text-xs text-muted-foreground">Instant reporting for regulators and auditors</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
