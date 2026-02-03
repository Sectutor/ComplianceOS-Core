
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@complianceos/ui/ui/dialog";
import { Label } from "@complianceos/ui/ui/label";
import { Input } from "@complianceos/ui/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { ShieldCheck, Calendar, User, Building, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface CertificationTrackerProps {
    clientId: number;
    frameworkId: number;
    frameworkName: string;
}

export const CertificationTracker = ({ clientId, frameworkId, frameworkName }: CertificationTrackerProps) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [auditFirm, setAuditFirm] = useState("");
    const [auditorName, setAuditorName] = useState("");
    const [startDate, setStartDate] = useState("");

    const utils = trpc.useContext();
    const { data: audits, isLoading } = trpc.audit.list.useQuery({ clientId });
    const { data: readiness } = trpc.audit.getReadinessStats.useQuery({ planId: clientId, frameworkId });

    const createMutation = trpc.audit.create.useMutation({
        onSuccess: () => {
            utils.audit.list.invalidate();
            setIsCreateOpen(false);
            toast.success("Audit Scheduled");
        }
    });

    const handleCreate = () => {
        createMutation.mutate({
            clientId,
            frameworkId,
            auditFirm,
            auditorName,
            startDate,
            stage: 'stage_1'
        });
    };

    const activeAudit = audits?.[0]; // Show latest

    return (
        <Card className="border-green-200 bg-green-50/30">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-green-700" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-green-900">Audit & Certification</CardTitle>
                            <CardDescription>Track your external audit journey for {frameworkName}</CardDescription>
                        </div>
                    </div>
                    {activeAudit && (
                        <Badge className={`${activeAudit.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
                            } text-white capitalize`}>
                            {activeAudit.status.replace('_', ' ')}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-sm text-slate-500">Loading audit status...</div>
                ) : !activeAudit ? (
                    <div className="text-center py-6">
                        <p className="text-slate-600 mb-4">No active audits found.</p>
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-green-700 hover:bg-green-800 text-white">
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Schedule Audit
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Schedule Certification Audit</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Audit Firm</Label>
                                        <Input
                                            placeholder="e.g. A-LIGN, Coalfire"
                                            value={auditFirm}
                                            onChange={(e) => setAuditFirm(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Lead Auditor</Label>
                                        <Input
                                            placeholder="Auditor Name"
                                            value={auditorName}
                                            onChange={(e) => setAuditorName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Start Date</Label>
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>
                                    <Button onClick={handleCreate} disabled={createMutation.isLoading}>
                                        {createMutation.isLoading ? "Scheduling..." : "Confirm Schedule"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white rounded border border-green-100">
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Building className="w-3 h-3" /> Firm
                                </span>
                                <p className="font-medium text-slate-900">{activeAudit.auditFirm || "N/A"}</p>
                            </div>
                            <div className="p-3 bg-white rounded border-green-100 border">
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Date
                                </span>
                                <p className="font-medium text-slate-900">
                                    {activeAudit.startDate ? new Date(activeAudit.startDate).toLocaleDateString() : "TBD"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4">
                            <h4 className="text-sm font-semibold mb-2 text-green-900">Audit Readiness Checklist</h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    {readiness?.scopeDefined ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Circle className="w-4 h-4 text-slate-300" />
                                    )}
                                    <span>Scope Defined</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    {readiness?.riskAssessment ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Circle className="w-4 h-4 text-slate-300" />
                                    )}
                                    <span>Risk Assessment Completed</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    {(readiness?.evidencePercentage || 0) > 80 ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-amber-500" />
                                    )}
                                    <span>Evidence Collection ({readiness?.evidencePercentage || 0}%)</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    {readiness?.internalAudit ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Clock className="w-4 h-4 text-slate-400" />
                                    )}
                                    <span>Internal Audit Review</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button variant="outline" size="sm" className="text-green-700 border-green-200 hover:bg-green-50">
                                View Audit Details
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
