import React from 'react';
import { useClientContext } from "@/contexts/ClientContext";
import { Button } from "@complianceos/ui/ui/button";
import { Plus, FileText, Play, Loader2, Clock } from "lucide-react";
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { cn } from "@/lib/utils";

export default function DPIAManager() {
    const { selectedClientId } = useClientContext();
    const clientId = selectedClientId || 0;
    const [location, setLocation] = useLocation();

    // Fetch templates
    const { data: templates, isLoading: templatesLoading } = trpc.privacyEnhancements.dpiaTemplates.list.useQuery({ clientId }, { enabled: !!clientId });

    // Fetch past assessments
    const { data: pastAssessments, isLoading: assessmentsLoading } = trpc.privacy.listAssessments.useQuery({
        clientId,
        typePrefix: "DPIA:"
    }, { enabled: !!clientId });

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">DPIA Manager</h1>
                    <p className="text-slate-500 text-lg">Conduct and manage Data Protection Impact Assessments (DPIAs).</p>
                </div>
            </div>

            {/* Templates Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#1C4D8D] flex items-center gap-3">
                        <div className="h-10 w-10 bg-sky-50 rounded-xl flex items-center justify-center text-[#3ABEF9]">
                            <FileText className="h-5 w-5" />
                        </div>
                        Available Templates
                    </h2>
                    <Button
                        variant="outline"
                        onClick={() => toast.info("Template creation wizard coming next.")}
                        className="border-slate-200 hover:bg-slate-50 font-bold rounded-xl h-10 px-6"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Create Template
                    </Button>
                </div>

                {templatesLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-[#3ABEF9]" /></div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {templates && templates.length > 0 ? (
                            templates.map(t => (
                                <Card key={t.id} className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-slate-200 bg-white rounded-2xl overflow-hidden ring-1 ring-slate-200/50">
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-[#3ABEF9] transition-colors">{t.name}</CardTitle>
                                        </div>
                                        <CardDescription className="text-slate-500 text-sm leading-relaxed line-clamp-2">{t.description || 'No description provided.'}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <span>Current Usage: {t.usageCount || 0}</span>
                                            <span>Revision: {t.version || '1.0'}</span>
                                        </div>
                                        <Button
                                            className="w-full bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white font-bold h-11 rounded-xl shadow-lg shadow-sky-100 transition-all active:scale-95"
                                            onClick={() => setLocation(`/clients/${clientId}/privacy/dpia/new?templateId=${t.id}`)}
                                        >
                                            <Play className="mr-2 h-4 w-4 fill-current" /> Initialize Assessment
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full h-48 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
                                <p className="text-slate-400 font-medium">No specialized DPIA templates found.</p>
                                <Button
                                    variant="secondary"
                                    onClick={() => toast.info("Template creation wizard coming next.")}
                                    className="bg-white border-slate-200 hover:bg-slate-50 font-bold rounded-xl"
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Create Custom Template
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* Past Assessments Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                        <Clock className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Assessment History</h2>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-0">
                                <TableHead className="font-bold text-slate-700 h-14">Assessment Name</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Risk Level</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Status</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Last Updated</TableHead>
                                <TableHead className="text-right font-bold text-slate-700 h-14 px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assessmentsLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-[#3ABEF9]" />
                                            <span className="text-sm font-medium text-slate-400">Loading history...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : pastAssessments && pastAssessments.length > 0 ? (
                                pastAssessments.map((a, idx) => (
                                    <TableRow
                                        key={a.id}
                                        className="hover:bg-slate-50/80 transition-colors group border-b border-slate-100 last:border-0"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <TableCell className="py-5 font-bold text-slate-900">{a.type.replace("DPIA: ", "")}</TableCell>
                                        <TableCell className="py-5">
                                            <Badge className={cn(
                                                "border-none font-bold uppercase text-[10px] tracking-wider px-2.5 py-1",
                                                a.score && parseFloat(a.score) > 70 ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                                            )}>
                                                {a.score ? `Risk Score: ${a.score}` : 'Evaluation Pending'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Badge className={cn(
                                                "border-none font-bold uppercase text-[10px] tracking-wider px-2.5 py-1",
                                                a.status === 'completed' ? "bg-green-100 text-green-700" : "bg-[#1C4D8D]/10 text-[#1C4D8D]"
                                            )}>
                                                {a.status || 'Not Started'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-5 text-slate-500 font-medium">{new Date(a.updatedAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right py-5 px-6">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-[#3ABEF9] hover:text-[#1C4D8D] hover:bg-sky-50 font-bold rounded-lg transition-all"
                                                onClick={() => setLocation(`/clients/${clientId}/privacy/dpia/${a.id}/questionnaire`)}
                                            >
                                                View Review
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <p className="font-bold text-slate-900">No Assessment History</p>
                                            <p className="max-w-xs mx-auto">Initialize your first Data Protection Impact Assessment using the templates above.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </section>
        </div>
    );
}
