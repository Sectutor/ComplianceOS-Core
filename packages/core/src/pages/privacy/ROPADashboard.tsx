import React, { useState } from 'react';
import { useClientContext } from "@/contexts/ClientContext";
import { Button } from "@complianceos/ui/ui/button";
import {
    Plus, Database, ArrowRight, Loader2, ChevronDown, ChevronUp,
    Building2, Clock, Shield, GitBranch, FileText, AlertTriangle, Edit2, Trash2
} from "lucide-react";
import { trpc } from '@/lib/trpc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Badge } from "@complianceos/ui/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Separator } from "@complianceos/ui/ui/separator";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@complianceos/ui/ui/alert-dialog";

const CRITICALITY_TIERS = [
    { value: "tier1", label: "Tier 1 – Critical (< 4 hrs impact)" },
    { value: "tier2", label: "Tier 2 – Important (< 24 hrs impact)" },
    { value: "tier3", label: "Tier 3 – Normal (< 7 days impact)" },
    { value: "tier4", label: "Tier 4 – Low (> 7 days impact)" },
];

const DEPARTMENTS = [
    "Legal & Compliance", "Finance", "Human Resources", "IT & Security",
    "Marketing", "Sales", "Operations", "Customer Support",
    "Research & Development", "Management", "Procurement", "Other"
];

const TIME_OPTIONS = [
    "15 minutes", "30 minutes", "1 hour", "2 hours", "4 hours",
    "8 hours", "12 hours", "24 hours", "48 hours", "72 hours",
    "1 week", "2 weeks", "1 month"
];

const CRITICALITY_COLOR: Record<string, string> = {
    tier1: "bg-red-100 text-red-700 border-red-200",
    tier2: "bg-orange-100 text-orange-700 border-orange-200",
    tier3: "bg-yellow-100 text-yellow-700 border-yellow-200",
    tier4: "bg-green-100 text-green-700 border-green-200",
};

const CRITICALITY_LABEL: Record<string, string> = {
    tier1: "T1 – Critical",
    tier2: "T2 – Important",
    tier3: "T3 – Normal",
    tier4: "T4 – Low",
};

interface ProcessFormState {
    name: string;
    description: string;
    department: string;
    criticalityTier: string;
    rto: string;
    rpo: string;
    mtpd: string;
    parentId: string;
}

interface Process {
    id: number;
    name: string;
    description?: string;
    department?: string;
    criticalityTier?: string;
    rto?: string;
    rpo?: string;
    mtpd?: string;
    parentId?: number;
}

const DEFAULT_FORM: ProcessFormState = {
    name: "",
    description: "",
    department: "",
    criticalityTier: "",
    rto: "",
    rpo: "",
    mtpd: "",
    parentId: "",
};

export default function ROPADashboard() {
    const { selectedClientId } = useClientContext();
    const clientId = selectedClientId || 0;
    const [location, setLocation] = useLocation();
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingProcess, setEditingProcess] = useState<Process | null>(null);
    const [processToDelete, setProcessToDelete] = useState<Process | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [form, setForm] = useState<ProcessFormState>(DEFAULT_FORM);

    // Data Flow Dialog State
    const [flowsOpen, setFlowsOpen] = useState(false);
    const [flowsProcess, setFlowsProcess] = useState<Process | null>(null);
    const [flowAssetId, setFlowAssetId] = useState<string>("");
    const [flowDataElements, setFlowDataElements] = useState("");
    const [flowInteractionType, setFlowInteractionType] = useState("");
    const [flowLegalBasis, setFlowLegalBasis] = useState("");
    const [flowPurpose, setFlowPurpose] = useState("");
    const [flowDataSubjectType, setFlowDataSubjectType] = useState("");
    const [flowRecipients, setFlowRecipients] = useState("");
    const [flowIsCrossBorder, setFlowIsCrossBorder] = useState(false);
    const [flowTransferMechanism, setFlowTransferMechanism] = useState("");
    const [flowRetentionPeriod, setFlowRetentionPeriod] = useState("");

    const utils = trpc.useUtils();
    const { data: processes, isLoading } = trpc.businessContinuity.processes.list.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const createProcessMutation = trpc.businessContinuity.processes.create.useMutation({
        onSuccess: (data) => {
            toast.success(`Business process "${data.name}" created successfully`);
            setCreateOpen(false);
            setForm(DEFAULT_FORM);
            setShowAdvanced(false);
            utils.businessContinuity.processes.list.invalidate();
        },
        onError: (err) => toast.error(`Error: ${err.message}`)
    });

    const updateProcessMutation = trpc.businessContinuity.processes.update.useMutation({
        onSuccess: () => {
            toast.success("Business process updated successfully");
            setEditOpen(false);
            setEditingProcess(null);
            setForm(DEFAULT_FORM);
            setShowAdvanced(false);
            utils.businessContinuity.processes.list.invalidate();
        },
        onError: (err) => toast.error(`Error: ${err.message}`)
    });

    const deleteProcessMutation = trpc.businessContinuity.processes.delete.useMutation({
        onSuccess: () => {
            toast.success("Business process deleted successfully");
            setProcessToDelete(null);
            utils.businessContinuity.processes.list.invalidate();
        },
        onError: (err) => toast.error(`Error: ${err.message}`)
    });

    // Data Flow queries and mutations
    const { data: processFlows } = trpc.privacy.getProcessDataFlows.useQuery(
        { processId: flowsProcess?.id || 0 },
        { enabled: !!flowsProcess?.id }
    );

    const { data: allAssets } = trpc.privacy.getInventory.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const addFlowMutation = trpc.privacy.addProcessDataFlow.useMutation({
        onSuccess: () => {
            toast.success("Data flow added successfully");
            resetFlowForm();
            utils.privacy.getProcessDataFlows.invalidate({ processId: flowsProcess?.id });
        },
        onError: (err) => toast.error(`Error: ${err.message}`)
    });

    const deleteFlowMutation = trpc.privacy.deleteProcessDataFlow.useMutation({
        onSuccess: () => {
            toast.success("Data flow removed");
            utils.privacy.getProcessDataFlows.invalidate({ processId: flowsProcess?.id });
        },
        onError: (err) => toast.error(`Error: ${err.message}`)
    });

    const resetFlowForm = () => {
        setFlowAssetId("");
        setFlowDataElements("");
        setFlowInteractionType("");
        setFlowLegalBasis("");
        setFlowPurpose("");
        setFlowDataSubjectType("");
        setFlowRecipients("");
        setFlowIsCrossBorder(false);
        setFlowTransferMechanism("");
        setFlowRetentionPeriod("");
    };

    const setField = (key: keyof ProcessFormState, value: string) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const handleOpenEdit = (process: Process) => {
        setEditingProcess(process);
        const hasRecoveryData = !!(process.rto || process.rpo || process.mtpd);
        setShowAdvanced(hasRecoveryData);
        setForm({
            name: process.name || "",
            description: process.description || "",
            department: process.department || "",
            criticalityTier: process.criticalityTier || "",
            rto: process.rto || "",
            rpo: process.rpo || "",
            mtpd: process.mtpd || "",
            parentId: process.parentId !== undefined && process.parentId !== null ? String(process.parentId) : "",
        });
        setEditOpen(true);
    };

    const handleOpenFlows = (process: Process) => {
        setFlowsProcess(process);
        setFlowsOpen(true);
        resetFlowForm();
    };

    const handleAddFlow = () => {
        if (!flowAssetId) return toast.error("Please select a data asset");
        addFlowMutation.mutate({
            clientId,
            processId: flowsProcess?.id || 0,
            assetId: Number(flowAssetId),
            dataElements: flowDataElements || undefined,
            interactionType: flowInteractionType || undefined,
            legalBasis: flowLegalBasis || undefined,
            purpose: flowPurpose || undefined,
            dataSubjectType: flowDataSubjectType || undefined,
            recipients: flowRecipients || undefined,
            isCrossBorder: flowIsCrossBorder || undefined,
            transferMechanism: flowTransferMechanism || undefined,
            retentionPeriod: flowRetentionPeriod || undefined
        });
    };

    const handleCreate = () => {
        if (!form.name.trim()) return toast.error("Process name is required");
        createProcessMutation.mutate({
            clientId,
            name: form.name.trim(),
            description: form.description || undefined,
            department: form.department || undefined,
            criticalityTier: form.criticalityTier || undefined,
            rto: form.rto || undefined,
            rpo: form.rpo || undefined,
            mtpd: form.mtpd || undefined,
            parentId: (form.parentId && form.parentId !== 'none') ? Number(form.parentId) : undefined,
        });
    };

    const handleUpdate = () => {
        if (!form.name.trim() || !editingProcess) return toast.error("Process name is required");
        updateProcessMutation.mutate({
            id: editingProcess.id,
            clientId,
            name: form.name.trim(),
            description: form.description || undefined,
            department: form.department || undefined,
            criticalityTier: form.criticalityTier || undefined,
            rto: form.rto || undefined,
            rpo: form.rpo || undefined,
            mtpd: form.mtpd || undefined,
            parentId: (form.parentId && form.parentId !== 'none') ? Number(form.parentId) : undefined,
        });
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Records of Processing Activities (ROPA)
                    </h1>
                    <p className="text-slate-500 text-lg">
                        Maintain a comprehensive inventory of your business processes and their data flows (Article 30).
                    </p>
                </div>
                <Button
                    onClick={() => setCreateOpen(true)}
                    className="bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-sky-100 transition-all active:scale-95"
                >
                    <Plus className="mr-2 h-5 w-5" /> Add Business Process
                </Button>
            </div>

            {/* Process Table */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-24 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-[#3ABEF9]" />
                    <p className="text-slate-400 font-medium animate-pulse">Loading ROPA registry...</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-0">
                                <TableHead className="font-bold text-slate-700 h-14">Process Name</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Department</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Criticality</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">RTO</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">RPO</TableHead>
                                <TableHead className="text-right font-bold text-slate-700 h-14 px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {processes && processes.length > 0 ? (
                                processes.map((proc: Process, idx: number) => (
                                    <TableRow
                                        key={proc.id}
                                        className="hover:bg-slate-50/80 transition-colors group border-b border-slate-100 last:border-0"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center text-[#3ABEF9] font-bold">
                                                    {proc.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{proc.name}</p>
                                                    {proc.description && (
                                                        <p className="text-xs text-slate-400 truncate max-w-[220px]" title={proc.description}>
                                                            {proc.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge className="bg-slate-100 text-slate-600 border-none font-bold uppercase text-[10px] tracking-wider px-2.5 py-1">
                                                {proc.department || 'General'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            {proc.criticalityTier ? (
                                                <Badge className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border ${CRITICALITY_COLOR[proc.criticalityTier] || 'bg-slate-100 text-slate-600'}`}>
                                                    {CRITICALITY_LABEL[proc.criticalityTier] || proc.criticalityTier}
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-300 text-sm italic">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4 text-slate-600 text-sm">
                                            {proc.rto || <span className="text-slate-300 italic">—</span>}
                                        </TableCell>
                                        <TableCell className="py-4 text-slate-600 text-sm">
                                            {proc.rpo || <span className="text-slate-300 italic">—</span>}
                                        </TableCell>
                                        <TableCell className="text-right py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-sky-50"
                                                    onClick={() => handleOpenEdit(proc)}
                                                >
                                                    <Edit2 className="h-4 w-4 text-[#3ABEF9]" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-red-50"
                                                    onClick={() => setProcessToDelete(proc)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-[#3ABEF9] hover:text-[#1C4D8D] hover:bg-sky-50 font-bold rounded-lg transition-all"
                                                    onClick={() => handleOpenFlows(proc)}
                                                >
                                                    Configure Flows <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-72 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="p-6 bg-slate-50 rounded-2xl">
                                                <Database className="h-12 w-12 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900 text-lg">No processes found</p>
                                                <p className="max-w-xs mx-auto">
                                                    Start by defining your business processes to begin mapping data flows.
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => setCreateOpen(true)}
                                                className="border-slate-200 hover:bg-slate-50 font-bold rounded-xl"
                                            >
                                                Initialize ROPA Registry
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Add Business Process Dialog */}
            <EnhancedDialog
                open={createOpen}
                onOpenChange={(open) => {
                    setCreateOpen(open);
                    if (!open) {
                        setForm(DEFAULT_FORM);
                        setShowAdvanced(false);
                    }
                }}
                title="Add Business Process"
                description="Define a new processing activity to map data flows against for GDPR Article 30 compliance."
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={() => setCreateOpen(false)}
                            className="rounded-xl border-slate-200 font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={createProcessMutation.isPending}
                            className="bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white font-bold h-11 px-6 rounded-xl"
                        >
                            {createProcessMutation.isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                            ) : (
                                <><Plus className="mr-2 h-4 w-4" /> Create Process</>
                            )}
                        </Button>
                    </div>
                }
            >
                <div className="grid gap-5 py-2">
                    {/* --- Core Info --- */}
                    <div className="grid gap-2">
                        <Label className="text-slate-700 font-semibold flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                            Process Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            value={form.name}
                            onChange={e => setField("name", e.target.value)}
                            placeholder="e.g. Employee Onboarding, Marketing Analytics"
                            className="h-11 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-slate-700 font-semibold flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            Department
                        </Label>
                        <Select value={form.department} onValueChange={(v) => setField("department", v)}>
                            <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-[#3ABEF9]">
                                <SelectValue placeholder="Select department..." />
                            </SelectTrigger>
                            <SelectContent>
                                {DEPARTMENTS.map(d => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-slate-700 font-semibold flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5 text-slate-400" />
                            Criticality Tier
                        </Label>
                        <Select value={form.criticalityTier} onValueChange={(v) => setField("criticalityTier", v)}>
                            <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-[#3ABEF9]">
                                <SelectValue placeholder="Select criticality..." />
                            </SelectTrigger>
                            <SelectContent>
                                {CRITICALITY_TIERS.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-slate-700 font-semibold flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                            Description / Purpose
                        </Label>
                        <Textarea
                            value={form.description}
                            onChange={e => setField("description", e.target.value)}
                            placeholder="Describe this processing activity, its purpose and legal basis under GDPR..."
                            className="rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20 resize-none min-h-[80px]"
                        />
                    </div>

                    {/* --- Advanced Toggle --- */}
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(prev => !prev)}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#3ABEF9] transition-colors w-fit"
                    >
                        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {showAdvanced ? "Hide" : "Show"} Recovery Objectives &amp; Advanced Settings
                    </button>

                    {showAdvanced && (
                        <div className="grid gap-5 p-4 bg-slate-50/70 rounded-xl border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recovery Objectives (BIA)</p>

                            {/* RTO / RPO / MTPD */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="grid gap-2">
                                    <Label className="text-slate-700 font-semibold text-sm flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                        RTO
                                    </Label>
                                    <Select value={form.rto} onValueChange={(v) => setField("rto", v)}>
                                        <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                                            <SelectValue placeholder="Recover by..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIME_OPTIONS.map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-slate-400">Recovery Time Objective</p>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-slate-700 font-semibold text-sm flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                        RPO
                                    </Label>
                                    <Select value={form.rpo} onValueChange={(v) => setField("rpo", v)}>
                                        <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                                            <SelectValue placeholder="Data back to..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIME_OPTIONS.map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-slate-400">Recovery Point Objective</p>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-slate-700 font-semibold text-sm flex items-center gap-1">
                                        <AlertTriangle className="h-3.5 w-3.5 text-slate-400" />
                                        MTPD
                                    </Label>
                                    <Select value={form.mtpd} onValueChange={(v) => setField("mtpd", v)}>
                                        <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                                            <SelectValue placeholder="Max downtime..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIME_OPTIONS.map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-slate-400">Max Tolerable Period of Disruption</p>
                                </div>
                            </div>

                            <Separator />

                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Organisation</p>



                            {processes && processes.length > 0 && (
                                <div className="grid gap-2">
                                    <Label className="text-slate-700 font-semibold text-sm flex items-center gap-1.5">
                                        <GitBranch className="h-3.5 w-3.5 text-slate-400" />
                                        Parent Process (for sub-processes)
                                    </Label>
                                    <Select value={form.parentId} onValueChange={(v) => setField("parentId", v)}>
                                        <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                                            <SelectValue placeholder="None (top-level)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None (top-level)</SelectItem>
                                            {processes.map((p: Process) => (
                                                <SelectItem key={p.id} value={String(p.id)}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </EnhancedDialog>

            {/* Edit Business Process Dialog */}
            <EnhancedDialog
                open={editOpen}
                onOpenChange={(open) => {
                    setEditOpen(open);
                    if (!open) {
                        setEditingProcess(null);
                        setForm(DEFAULT_FORM);
                        setShowAdvanced(false);
                    }
                }}
                title="Edit Business Process"
                description="Update the processing activity details for GDPR Article 30 compliance."
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={() => setEditOpen(false)}
                            className="rounded-xl border-slate-200 font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={updateProcessMutation.isPending}
                            className="bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white font-bold h-11 px-6 rounded-xl"
                        >
                            {updateProcessMutation.isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                            ) : (
                                <><FileText className="mr-2 h-4 w-4" /> Save Changes</>
                            )}
                        </Button>
                    </div>
                }
            >
                <div className="grid gap-5 py-2">
                    {/* --- Core Info --- */}
                    <div className="grid gap-2">
                        <Label className="text-slate-700 font-semibold flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                            Process Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            value={form.name}
                            onChange={e => setField("name", e.target.value)}
                            placeholder="e.g. Employee Onboarding, Marketing Analytics"
                            className="h-11 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-slate-700 font-semibold flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            Department
                        </Label>
                        <Select value={form.department} onValueChange={(v) => setField("department", v)}>
                            <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-[#3ABEF9]">
                                <SelectValue placeholder="Select department..." />
                            </SelectTrigger>
                            <SelectContent>
                                {DEPARTMENTS.map(d => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-slate-700 font-semibold flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5 text-slate-400" />
                            Criticality Tier
                        </Label>
                        <Select value={form.criticalityTier} onValueChange={(v) => setField("criticalityTier", v)}>
                            <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-[#3ABEF9]">
                                <SelectValue placeholder="Select criticality..." />
                            </SelectTrigger>
                            <SelectContent>
                                {CRITICALITY_TIERS.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-slate-700 font-semibold flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                            Description / Purpose
                        </Label>
                        <Textarea
                            value={form.description}
                            onChange={e => setField("description", e.target.value)}
                            placeholder="Describe this processing activity, its purpose and legal basis under GDPR..."
                            className="rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20 resize-none min-h-[80px]"
                        />
                    </div>

                    {/* --- Advanced Toggle --- */}
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(prev => !prev)}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#3ABEF9] transition-colors w-fit"
                    >
                        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {showAdvanced ? "Hide" : "Show"} Recovery Objectives &amp; Advanced Settings
                    </button>

                    {showAdvanced && (
                        <div className="grid gap-5 p-4 bg-slate-50/70 rounded-xl border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recovery Objectives (BIA)</p>

                            {/* RTO / RPO / MTPD */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="grid gap-2">
                                    <Label className="text-slate-700 font-semibold text-sm flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                        RTO
                                    </Label>
                                    <Select value={form.rto} onValueChange={(v) => setField("rto", v)}>
                                        <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                                            <SelectValue placeholder="Recover by..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIME_OPTIONS.map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-slate-400">Recovery Time Objective</p>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-slate-700 font-semibold text-sm flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                        RPO
                                    </Label>
                                    <Select value={form.rpo} onValueChange={(v) => setField("rpo", v)}>
                                        <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                                            <SelectValue placeholder="Data back to..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIME_OPTIONS.map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-slate-400">Recovery Point Objective</p>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-slate-700 font-semibold text-sm flex items-center gap-1">
                                        <AlertTriangle className="h-3.5 w-3.5 text-slate-400" />
                                        MTPD
                                    </Label>
                                    <Select value={form.mtpd} onValueChange={(v) => setField("mtpd", v)}>
                                        <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                                            <SelectValue placeholder="Max downtime..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIME_OPTIONS.map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-slate-400">Max Tolerable Period of Disruption</p>
                                </div>
                            </div>

                            <Separator />

                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Organisation</p>

                            {processes && processes.length > 0 && (
                                <div className="grid gap-2">
                                    <Label className="text-slate-700 font-semibold text-sm flex items-center gap-1.5">
                                        <GitBranch className="h-3.5 w-3.5 text-slate-400" />
                                        Parent Process (for sub-processes)
                                    </Label>
                                    <Select value={form.parentId} onValueChange={(v) => setField("parentId", v)}>
                                        <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                                            <SelectValue placeholder="None (top-level)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None (top-level)</SelectItem>
                                            {processes
                                                .filter((p: Process) => p.id !== editingProcess?.id)
                                                .map((p: Process) => (
                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </EnhancedDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!processToDelete} onOpenChange={(open) => !open && setProcessToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Delete Business Process?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <b>{processToDelete?.name}</b>? This action cannot be undone.
                            This processing activity will be removed from your ROPA registry.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => processToDelete && deleteProcessMutation.mutate({ id: processToDelete.id, clientId })}
                            disabled={deleteProcessMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 rounded-xl"
                        >
                            {deleteProcessMutation.isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
                            ) : (
                                <><Trash2 className="mr-2 h-4 w-4" /> Delete Process</>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Data Flows Management Dialog */}
            <EnhancedDialog
                open={flowsOpen}
                onOpenChange={(open) => {
                    setFlowsOpen(open);
                    if (!open) {
                        setFlowsProcess(null);
                        resetFlowForm();
                    }
                }}
                title={`Data Flows: ${flowsProcess?.name || ''}`}
                description="Link personal data assets to this processing activity and define the flow details."
                footer={
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setFlowsOpen(false)}
                            className="rounded-xl"
                        >
                            Close
                        </Button>
                        <Button
                            onClick={handleAddFlow}
                            disabled={addFlowMutation.isPending || !flowAssetId}
                            className="bg-[#3ABEF9] hover:bg-[#1C4D8D] rounded-xl"
                        >
                            {addFlowMutation.isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                            ) : (
                                <><Plus className="mr-2 h-4 w-4" /> Add Data Flow</>
                            )}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    {/* Existing Data Flows */}
                    {processFlows && processFlows.length > 0 && (
                        <div className="space-y-3">
                            <p className="font-semibold text-sm text-slate-700">Linked Data Assets</p>
                            <div className="max-h-48 overflow-y-auto space-y-2">
                                {processFlows.map((item: any) => (
                                    <div key={item.flow.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{item.assetName || 'Unknown Asset'}</p>
                                            <p className="text-xs text-slate-500">
                                                {item.flow.dataElements || 'No data elements specified'}
                                                {item.flow.interactionType && ` • ${item.flow.interactionType}`}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteFlowMutation.mutate({ flowId: item.flow.id, clientId })}
                                            disabled={deleteFlowMutation.isPending}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add New Data Flow Form */}
                    <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="font-semibold text-sm text-slate-700">Add New Data Flow</p>

                        <div className="grid gap-3">
                            <div className="grid gap-2">
                                <Label className="text-slate-700 font-semibold text-sm">Data Asset *</Label>
                                <Select value={flowAssetId} onValueChange={setFlowAssetId}>
                                    <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                                        <SelectValue placeholder="Select a personal data asset..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allAssets?.map((asset: any) => (
                                            <SelectItem key={asset.id} value={String(asset.id)}>
                                                {asset.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label className="text-slate-700 font-semibold text-sm">Interaction Type</Label>
                                    <Select value={flowInteractionType} onValueChange={setFlowInteractionType}>
                                        <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Read">Read</SelectItem>
                                            <SelectItem value="Write">Write</SelectItem>
                                            <SelectItem value="Process">Process</SelectItem>
                                            <SelectItem value="Store">Store</SelectItem>
                                            <SelectItem value="Transmit">Transmit</SelectItem>
                                            <SelectItem value="Delete">Delete</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-slate-700 font-semibold text-sm">Legal Basis</Label>
                                    <Select value={flowLegalBasis} onValueChange={setFlowLegalBasis}>
                                        <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Consent">Consent</SelectItem>
                                            <SelectItem value="Contract">Contract</SelectItem>
                                            <SelectItem value="Legal Obligation">Legal Obligation</SelectItem>
                                            <SelectItem value="Vital Interests">Vital Interests</SelectItem>
                                            <SelectItem value="Public Task">Public Task</SelectItem>
                                            <SelectItem value="Legitimate Interests">Legitimate Interests</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-slate-700 font-semibold text-sm">Data Elements</Label>
                                <Input
                                    value={flowDataElements}
                                    onChange={(e) => setFlowDataElements(e.target.value)}
                                    placeholder="e.g., Name, Email, Phone, Address..."
                                    className="rounded-lg border-slate-200 text-sm"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-slate-700 font-semibold text-sm">Purpose</Label>
                                <Input
                                    value={flowPurpose}
                                    onChange={(e) => setFlowPurpose(e.target.value)}
                                    placeholder="Why is this data processed?"
                                    className="rounded-lg border-slate-200 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label className="text-slate-700 font-semibold text-sm">Data Subjects</Label>
                                    <Input
                                        value={flowDataSubjectType}
                                        onChange={(e) => setFlowDataSubjectType(e.target.value)}
                                        placeholder="e.g., Employees, Customers..."
                                        className="rounded-lg border-slate-200 text-sm"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-slate-700 font-semibold text-sm">Recipients</Label>
                                    <Input
                                        value={flowRecipients}
                                        onChange={(e) => setFlowRecipients(e.target.value)}
                                        placeholder="Who receives this data?"
                                        className="rounded-lg border-slate-200 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label className="text-slate-700 font-semibold text-sm">Retention Period</Label>
                                    <Input
                                        value={flowRetentionPeriod}
                                        onChange={(e) => setFlowRetentionPeriod(e.target.value)}
                                        placeholder="e.g., 7 years, 1 year..."
                                        className="rounded-lg border-slate-200 text-sm"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-slate-700 font-semibold text-sm">Transfer Mechanism</Label>
                                    <Select value={flowTransferMechanism} onValueChange={setFlowTransferMechanism}>
                                        <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SCCs">Standard Contractual Clauses</SelectItem>
                                            <SelectItem value="BCRs">Binding Corporate Rules</SelectItem>
                                            <SelectItem value="Adequacy">Adequacy Decision</SelectItem>
                                            <SelectItem value="None">No Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="crossBorder"
                                    checked={flowIsCrossBorder}
                                    onChange={(e) => setFlowIsCrossBorder(e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-[#3ABEF9] focus:ring-[#3ABEF9]"
                                />
                                <Label htmlFor="crossBorder" className="text-sm font-medium text-slate-700 cursor-pointer">
                                    Cross-border transfer outside EEA
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Quick Link to Data Inventory */}
                    <Button
                        variant="outline"
                        onClick={() => {
                            setFlowsOpen(false);
                            setLocation(`/clients/${clientId}/privacy/inventory`);
                        }}
                        className="w-full rounded-xl border-slate-200 hover:bg-slate-50"
                    >
                        <Database className="mr-2 h-4 w-4" />
                        Manage Data Assets in Inventory
                    </Button>
                </div>
            </EnhancedDialog>
        </div>
    );
}
