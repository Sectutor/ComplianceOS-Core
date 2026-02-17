import React from 'react';
import { useLocation } from "wouter";
import { useClientContext } from "@/contexts/ClientContext";
import { Button } from "@complianceos/ui/ui/button";
import { Plus, Shield, CheckCircle, FileText, Users, AlertTriangle, Database } from "lucide-react";
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Loader2 } from "lucide-react";

export default function PrivacyDashboard({ fullWidth }: { fullWidth?: boolean }) {
    const { selectedClientId } = useClientContext();
    const clientId = selectedClientId || 0;
    const [, setLocation] = useLocation();

    const { data: stats, isLoading: statsLoading } = trpc.privacy.getPrivacyStats.useQuery({ clientId }, { enabled: !!clientId });
    const { data: dsars, isLoading: dsarLoading } = trpc.privacy.getDsarRequests.useQuery({ clientId }, { enabled: !!clientId });
    const { data: assessments } = trpc.privacy.listAssessments.useQuery({ clientId }, { enabled: !!clientId });

    // Calculate pending DSARs
    const pendingDsars = dsars?.filter(d => d.status !== 'Completed' && d.status !== 'Rejected').length || 0;

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy Dashboard</h1>
                    <p className="text-slate-500 text-lg">Central hub for privacy program operations and compliance intelligence.</p>
                </div>
            </div>

            {statsLoading ? (
                <div className="flex flex-col items-center justify-center p-24 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-[#3ABEF9]" />
                    <p className="text-slate-400 font-medium animate-pulse">Aggregating privacy insights...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-gradient-to-br from-white to-slate-50 overflow-hidden ring-1 ring-slate-200/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-[#1C4D8D]">PII Assets</CardTitle>
                            <div className="h-8 w-8 rounded-lg bg-sky-50 flex items-center justify-center text-[#3ABEF9]">
                                <Database className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 mb-1">{stats?.piiAssetCount || 0}</div>
                            <p className="text-xs font-medium text-slate-400">Personal data assets mapped</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-gradient-to-br from-white to-slate-50 overflow-hidden ring-1 ring-slate-200/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-[#1C4D8D]">Active DSARs</CardTitle>
                            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                                <Users className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 mb-1">{pendingDsars}</div>
                            <p className="text-xs font-medium text-slate-400">Requests requiring processing</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-gradient-to-br from-white to-slate-50 overflow-hidden ring-1 ring-slate-200/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-[#1C4D8D]">Impact Tasks</CardTitle>
                            <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                <CheckCircle className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 mb-1">{assessments?.filter((a: any) => a.status === 'in_progress').length || 0}</div>
                            <p className="text-xs font-medium text-slate-400">Open assessments in queue</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-gradient-to-br from-white to-slate-50 overflow-hidden ring-1 ring-slate-200/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-[#1C4D8D]">Health Score</CardTitle>
                            <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                                <Shield className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 mb-1">94%</div>
                            <p className="text-xs font-medium text-slate-400">Compliance health indicator</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="border-slate-200 shadow-xl shadow-slate-200/30 rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold text-slate-900">Recent DSAR Requests</CardTitle>
                            <Button variant="ghost" className="text-[#3ABEF9] hover:text-[#1C4D8D] font-bold" onClick={() => setLocation(`/clients/${clientId}/privacy/dsar`)}>View All</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {dsars && dsars.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {dsars.slice(0, 5).map(dsar => (
                                    <div
                                        key={dsar.id}
                                        className="flex items-center justify-between p-5 hover:bg-slate-50/80 transition-all cursor-pointer group"
                                        onClick={() => setLocation(`/clients/${clientId}/privacy/dsar/${dsar.id}`)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#3ABEF9]/10 group-hover:text-[#3ABEF9] transition-colors">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 group-hover:text-[#3ABEF9] transition-colors">{dsar.requestId}</p>
                                                <p className="text-xs font-medium text-slate-400">
                                                    Filed {dsar.requestDate ? new Date(dsar.requestDate).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className={`border-none font-bold uppercase text-[10px] tracking-wider px-2.5 py-1 ${dsar.status === 'New' ? 'bg-[#3ABEF9]/10 text-[#3ABEF9]' :
                                            dsar.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                            {dsar.status || 'Draft'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
                                <Users className="h-12 w-12 text-slate-200" />
                                <p className="text-slate-400 font-medium italic">No recent subject requests found.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-xl shadow-slate-200/30 rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold text-slate-900">Recent Assessments</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {assessments && assessments.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {assessments.slice(0, 5).map(assessment => (
                                    <div key={assessment.id} className="flex items-center justify-between p-5 hover:bg-slate-50/80 transition-all cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#1C4D8D]/10 group-hover:text-[#1C4D8D] transition-colors">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 group-hover:text-[#1C4D8D] transition-colors truncate max-w-[200px]">
                                                    {assessment.type.replace(/^(DPIA:|TIA:|BREACH:)\s*/, '')}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#3ABEF9]">
                                                        {assessment.type.split(':')[0]}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-300">•</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {new Date(assessment.updatedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className={`border-none font-bold uppercase text-[10px] tracking-widest px-2.5 py-1 ${assessment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            assessment.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                            {assessment.status === 'in_progress' ? 'Active' : assessment.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
                                <FileText className="h-12 w-12 text-slate-200" />
                                <p className="text-slate-400 font-medium italic">No recent compliance assessments found.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
