
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, useLocation } from "wouter";
import { PageGuide } from "@/components/PageGuide";
import { Button } from "@complianceos/ui/ui/button";
import { Plus, Loader2, ArrowRight, FileText, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Card } from "@complianceos/ui/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";

export default function GapAnalysisList() {
    const params = useParams();
    const [_, setLocation] = useLocation();
    const clientId = Number(params.id);

    const { data: rawAssessments, isLoading, error } = trpc.gapAnalysis.list.useQuery({ clientId });

    // Safe unwrapper (copied from util or just inline)
    const safeUnwrap = (data: any) => {
        if (data && typeof data === 'object' && 'json' in data && Array.isArray(data.json)) {
            return data.json;
        }
        return data;
    };

    const assessments = safeUnwrap(rawAssessments) || [];

    if (error) {
        // With Safe Transformer, error might not be thrown for transform fail, but check anyway.
        // If error is strictly transform error, we might have fixed it. 
        // If it's network error, show it.
        return (
            <DashboardLayout>
                <div className="p-8 text-red-500">
                    Error loading assessments: {error.message}
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 w-full max-w-full p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gap Analysis</h1>
                        <p className="text-muted-foreground mt-1">Assess your compliance posture against major frameworks.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setLocation(`/clients/${clientId}/gap-analysis/new`)} className="bg-primary hover:bg-primary/90" id="gap-new-analysis">
                            <Plus className="w-4 h-4 mr-2" />
                            New Analysis
                        </Button>
                        <PageGuide
                            title="Gap Analysis"
                            description="Identify where your current controls fall short of regulatory requirements."
                            rationale="Closing compliance gaps is the core of any security program. This tool helps you transform audit findings into remediation plans."
                            howToUse={[
                                {
                                    step: "Start New Analysis",
                                    description: "Create an assessment against a library framework (ISO, NIST, etc) to find what's missing.",
                                    targetId: "gap-new-analysis"
                                },
                                {
                                    step: "Review Status",
                                    description: "Track progress of each domain and focus on 'In Progress' or 'Draft' assessments.",
                                    targetId: "gap-assessments-list"
                                },
                                {
                                    step: "Remediate Gaps",
                                    description: "Open an assessment to generate remediation tasks for your IT and security teams."
                                }
                            ]}
                            integrations={[
                                { name: "Roadmap Builder", description: "Convert identified gaps directly into a multi-month strategic roadmap." },
                                { name: "Evidence Vault", description: "Link existing evidence to automatically verify control implementation." }
                            ]}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {assessments && assessments.length > 0 ? (
                            <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white" id="gap-assessments-list">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                            <TableHead className="text-white font-semibold py-4">Assessment Name</TableHead>
                                            <TableHead className="text-white font-semibold py-4">Framework</TableHead>
                                            <TableHead className="text-white font-semibold py-4">Status</TableHead>
                                            <TableHead className="text-white font-semibold py-4">Created Date</TableHead>
                                            <TableHead className="text-right text-white font-semibold py-4">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assessments.map((assessment: any) => (
                                            <TableRow key={assessment.id} className="bg-white border-b border-slate-200 cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group" onClick={() => setLocation(`/clients/${clientId}/gap-analysis/${assessment.id}`)}>
                                                <TableCell className="font-medium py-4">
                                                    <div className="flex items-center gap-2 text-black">
                                                        <FileText className="w-4 h-4 text-blue-500" />
                                                        {assessment.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Badge variant="outline" className="bg-white border-gray-300 text-gray-700">{assessment.framework}</Badge>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <StatusBadge status={assessment.status} />
                                                </TableCell>
                                                <TableCell className="text-gray-500 py-4">
                                                    {new Date(assessment.createdAt!).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <Button variant="ghost" size="sm" className="hover:bg-[#1C4D8D]/10 hover:text-[#1C4D8D] transition-colors duration-200" onClick={(e) => { e.stopPropagation(); setLocation(`/clients/${clientId}/gap-analysis/${assessment.id}`); }}>
                                                        Open <ArrowRight className="w-4 h-4 ml-1" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <EmptyState onCreate={() => setLocation(`/clients/${clientId}/gap-analysis/new`)} />
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function StatusBadge({ status }: { status: string | null }) {
    if (!status) return null;
    const styles: Record<string, string> = {
        'draft': 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200',
        'in_progress': 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
        'completed': 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200',
    };
    const labels: Record<string, string> = {
        'draft': 'Draft',
        'in_progress': 'In Progress',
        'completed': 'Completed',
    };
    return <Badge className={`${styles[status] || styles['draft']} font-normal border shadow-sm`}>{labels[status] || status}</Badge>;
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed rounded-lg bg-slate-50/50">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Gap Analyses Yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
                Start your first assessment to identify compliance gaps and build a remediation plan.
            </p>
            <Button onClick={onCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Start First Assessment
            </Button>
        </div>
    );
}
