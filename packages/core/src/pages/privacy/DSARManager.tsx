import React, { useState } from 'react';
import { useClientContext } from "@/contexts/ClientContext";
import { Button } from "@complianceos/ui/ui/button";
import { Plus, Users, Loader2 } from "lucide-react";
import { trpc } from '@/lib/trpc';
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export default function DSARManager() {
    const { selectedClientId } = useClientContext();
    const clientId = selectedClientId || 0;
    const [createOpen, setCreateOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        requestType: "Access",
        subjectEmail: "",
        subjectName: "",
        dueDate: "",
        priority: "medium",
        submissionMethod: "manual"
    });

    const utils = trpc.useUtils();
    const { data: requests, isLoading } = trpc.privacy.getDsarRequests.useQuery({ clientId }, { enabled: !!clientId });

    const createMutation = trpc.privacy.createDsarRequest.useMutation({
        onSuccess: () => {
            toast.success("DSAR logged successfully");
            setCreateOpen(false);
            setFormData({
                requestType: "Access",
                subjectEmail: "",
                subjectName: "",
                dueDate: "",
                priority: "medium",
                submissionMethod: "manual"
            });
            utils.privacy.getDsarRequests.invalidate();
            utils.privacy.getPrivacyStats.invalidate();
        },
        onError: (err) => {
            toast.error(`Failed to log request: ${err.message}`);
        }
    });

    const handleCreate = () => {
        if (!formData.subjectEmail) {
            toast.error("Subject email is required");
            return;
        }

        createMutation.mutate({
            clientId,
            requestType: formData.requestType,
            subjectEmail: formData.subjectEmail,
            subjectName: formData.subjectName,
            dueDate: formData.dueDate,
            priority: formData.priority,
            submissionMethod: formData.submissionMethod
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Data Subject Access Requests (DSAR)</h1>
                    <p className="text-slate-500 text-lg">Manage and track data subject requests (access, deletion, rectification).</p>
                </div>
                <Button
                    onClick={() => setCreateOpen(true)}
                    className="bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-sky-100 transition-all active:scale-95"
                >
                    <Plus className="mr-2 h-5 w-5" /> Log Request
                </Button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-24 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-[#3ABEF9]" />
                    <p className="text-slate-400 font-medium animate-pulse">Loading request registry...</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-0">
                                <TableHead className="font-bold text-slate-700 h-14">Request ID</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Type</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Subject</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Status</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Date Filed</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Priority</TableHead>
                                <TableHead className="text-right font-bold text-slate-700 h-14 px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests && requests.length > 0 ? (
                                requests.map((req, idx) => (
                                    <TableRow
                                        key={req.id}
                                        className="hover:bg-slate-50/80 transition-colors group border-b border-slate-100 last:border-0"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <TableCell className="py-5 font-bold text-slate-900">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center text-[#3ABEF9] font-bold group-hover:scale-110 transition-transform">
                                                    <Users className="h-5 w-5" />
                                                </div>
                                                {req.requestId}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider px-2.5 py-1">
                                                {req.requestType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900">{req.subjectName || 'Anonymous'}</span>
                                                <span className="text-xs text-slate-500">{req.subjectEmail}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Badge className={cn(
                                                "border-none font-bold uppercase text-[10px] tracking-wider px-2.5 py-1",
                                                req.status === 'Completed' ? "bg-emerald-100 text-emerald-700" :
                                                    req.status === 'New' ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"
                                            )}>
                                                {req.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-5 text-slate-500 font-medium tabular-nums">
                                            {new Date(req.requestDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Badge className={cn(
                                                "border-none font-bold uppercase text-[10px] tracking-wider px-2.5 py-1",
                                                req.priority === 'high' ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
                                            )}>
                                                {req.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right py-5 px-6">
                                            <Link href={`/clients/${clientId}/privacy/dsar/${req.id}`}>
                                                <Button variant="ghost" size="sm" className="text-[#3ABEF9] hover:text-[#1C4D8D] hover:bg-sky-50 font-bold rounded-lg transition-all">
                                                    Manage Case
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-72 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="p-6 bg-slate-50 rounded-2xl">
                                                <Users className="h-12 w-12 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900 text-lg">No requests pending</p>
                                                <p className="max-w-xs mx-auto">Logged requests from data subjects will appear here for processing.</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => setCreateOpen(true)}
                                                className="border-slate-200 hover:bg-slate-50 font-bold rounded-xl"
                                            >
                                                Log Initial Request
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            <EnhancedDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                title="Log DSAR Request"
                description="Manually record a request received via email, form, or phone."
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleCreate}
                            disabled={createMutation.isLoading}
                            className="bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white font-bold h-11 px-6 rounded-xl"
                        >
                            {createMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Log Request
                        </Button>
                    </div>
                }
            >
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2.5">
                            <Label className="text-slate-700 font-bold">Request Type</Label>
                            <Select
                                value={formData.requestType}
                                onValueChange={(val) => setFormData({ ...formData, requestType: val })}
                            >
                                <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Access">Right of Access</SelectItem>
                                    <SelectItem value="Erasure">Right to Erasure (Forget)</SelectItem>
                                    <SelectItem value="Rectification">Right to Rectification</SelectItem>
                                    <SelectItem value="Portability">Data Portability</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2.5">
                            <Label className="text-slate-700 font-bold">Priority Level</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(val) => setFormData({ ...formData, priority: val })}
                            >
                                <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2.5">
                        <Label className="text-slate-700 font-bold">Subject Name</Label>
                        <Input
                            value={formData.subjectName}
                            onChange={e => setFormData({ ...formData, subjectName: e.target.value })}
                            placeholder="e.g. John Smith"
                            className="h-12 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                        />
                    </div>

                    <div className="grid gap-2.5">
                        <Label className="text-slate-700 font-bold">Subject Email</Label>
                        <Input
                            type="email"
                            value={formData.subjectEmail}
                            onChange={e => setFormData({ ...formData, subjectEmail: e.target.value })}
                            placeholder="john@example.com"
                            className="h-12 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                        />
                    </div>

                    <div className="grid gap-2.5">
                        <Label className="text-slate-700 font-bold">Regulatory Due Date</Label>
                        <Input
                            type="date"
                            value={formData.dueDate}
                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            className="h-12 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                        />
                    </div>
                </div>
            </EnhancedDialog>
        </div>
    );
}
