import React, { useState } from 'react';
import { useClientContext } from "@/contexts/ClientContext";
import { Button } from "@complianceos/ui/ui/button";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
import { trpc } from '@/lib/trpc';
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { toast } from "sonner";
import { Badge } from "@complianceos/ui/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function DataBreachRegister() {
    const { selectedClientId } = useClientContext();
    const clientId = selectedClientId || 0;
    const [location, setLocation] = useLocation();
    const [createOpen, setCreateOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        occurredAt: "",
        severity: "low",
        description: ""
    });

    const utils = trpc.useUtils();
    const { data: breaches, isLoading } = (trpc.privacy as any).listAssessments.useQuery({
        clientId,
        typePrefix: "BREACH:"
    }, { enabled: !!clientId });

    const createMutation = (trpc.privacy as any).saveAssessment.useMutation({
        onSuccess: () => {
            toast.success("Breach Logged");
            setCreateOpen(false);
            setFormData({ title: "", occurredAt: "", severity: "low", description: "" });
            (utils.privacy as any).listAssessments.invalidate();
        },
        onError: (err: any) => toast.error(`Failed: ${err.message}`)
    });

    const handleCreate = () => {
        if (!formData.title || !formData.occurredAt) {
            toast.error("Title and Date are required");
            return;
        }

        createMutation.mutate({
            clientId,
            type: `BREACH: ${formData.title}`,
            responses: {
                occurredAt: formData.occurredAt,
                severity: formData.severity,
                description: formData.description,
                loggedAt: new Date().toISOString()
            },
            status: "in_progress", // "Open" investigation
            score: 0
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Data Breach Register</h1>
                    <p className="text-slate-500 text-lg">Log and manage data breaches and security incidents for regulatory compliance.</p>
                </div>
                <Button
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-rose-100 transition-all active:scale-95"
                    onClick={() => setCreateOpen(true)}
                >
                    <Plus className="mr-2 h-5 w-5" /> Report Incident
                </Button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-0">
                            <TableHead className="font-bold text-slate-700 h-14">Incident Title</TableHead>
                            <TableHead className="font-bold text-slate-700 h-14">Severity</TableHead>
                            <TableHead className="font-bold text-slate-700 h-14">Occurred On</TableHead>
                            <TableHead className="font-bold text-slate-700 h-14">Status</TableHead>
                            <TableHead className="text-right font-bold text-slate-700 h-14 px-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-10 w-10 animate-spin text-[#3ABEF9]" />
                                        <span className="text-sm font-medium text-slate-400">Loading incident history...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : breaches && breaches.length > 0 ? (
                            (breaches as any[]).map((b, idx) => (
                                <TableRow
                                    key={b.id}
                                    className="hover:bg-slate-50/80 transition-colors group border-b border-slate-100 last:border-0"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <TableCell className="py-5 font-bold text-slate-900">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-bold group-hover:scale-110 transition-transform">
                                                <AlertTriangle className="h-5 w-5" />
                                            </div>
                                            {b.type.replace("BREACH: ", "")}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <Badge className={cn(
                                            "border-none font-bold uppercase text-[10px] tracking-wider px-2.5 py-1",
                                            (b.responses as any)?.severity === 'critical' || (b.responses as any)?.severity === 'high'
                                                ? "bg-rose-100 text-rose-700"
                                                : "bg-[#1C4D8D]/10 text-[#1C4D8D]"
                                        )}>
                                            {(b.responses as any)?.severity?.toUpperCase() || 'UNKNOWN'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-5 text-slate-500 font-medium tabular-nums">
                                        {(b.responses as any)?.occurredAt || 'N/A'}
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <Badge className="bg-slate-100 text-slate-600 border-none font-bold uppercase text-[10px] tracking-wider px-2.5 py-1">
                                            {b.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right py-5 px-6">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-[#3ABEF9] hover:text-[#1C4D8D] hover:bg-sky-50 font-bold rounded-lg transition-all"
                                            onClick={() => {
                                                toast.info("Incident detail view coming soon - ID: " + b.id);
                                                setLocation(`/clients/${clientId}/privacy/breaches`);
                                            }}
                                        >
                                            Manage Review
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-72 text-center text-slate-400">
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <div className="p-6 bg-slate-50 rounded-2xl">
                                            <AlertTriangle className="h-12 w-12 text-slate-300" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-slate-900 text-lg">Clean Register</p>
                                            <p className="max-w-xs mx-auto">No security incidents have been logged yet. Continuous monitoring is active.</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <EnhancedDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                title="Report Security Incident"
                description="Log a new data breach or security incident for investigation."
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleCreate}
                            disabled={createMutation.isLoading}
                        >
                            {createMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Log Incident
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Incident Title</Label>
                        <Input
                            placeholder="e.g. Lost Laptop, Unauth Access"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date Occurred</Label>
                            <Input
                                type="date"
                                value={formData.occurredAt}
                                onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Severity</Label>
                            <Select
                                value={formData.severity}
                                onValueChange={(val) => setFormData({ ...formData, severity: val })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            placeholder="What happened? Who is affected?"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>
            </EnhancedDialog>
        </div>
    );
}
