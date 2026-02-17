import React, { useState } from 'react';
import { useClientContext } from "@/contexts/ClientContext";
import { Button } from "@complianceos/ui/ui/button";
import { Plus, Database, Settings, Loader2, ArrowRight } from "lucide-react";
import { trpc } from '@/lib/trpc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Badge } from "@complianceos/ui/ui/badge";
import { toast } from "sonner";

export default function ROPADashboard() {
    const { selectedClientId } = useClientContext();
    const clientId = selectedClientId || 0;
    const [createOpen, setCreateOpen] = useState(false);
    const [processName, setProcessName] = useState("");
    const [processDesc, setProcessDesc] = useState("");
    const [processDept, setProcessDept] = useState("");

    const utils = trpc.useUtils();
    const { data: processes, isLoading } = trpc.businessContinuity.processes.list.useQuery({ clientId }, { enabled: !!clientId });

    const createProcessMutation = trpc.businessContinuity.processes.create.useMutation({
        onSuccess: () => {
            toast.success("Process created successfully");
            setCreateOpen(false);
            setProcessName("");
            setProcessDesc("");
            setProcessDept("");
            utils.businessContinuity.processes.list.invalidate();
        },
        onError: (err) => toast.error(`Error: ${err.message}`)
    });

    const handleCreate = () => {
        if (!processName) return toast.error("Name required");
        createProcessMutation.mutate({
            clientId,
            name: processName,
            description: processDesc,
            department: processDept
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Records of Processing Activities (ROPA)</h1>
                    <p className="text-slate-500 text-lg">Maintain a comprehensive inventory of your business processes and their data flows (Article 30).</p>
                </div>
                <Button
                    onClick={() => setCreateOpen(true)}
                    className="bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-sky-100 transition-all active:scale-95"
                >
                    <Plus className="mr-2 h-5 w-5" /> Add Process
                </Button>
            </div>

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
                                <TableHead className="font-bold text-slate-700 h-14">Description</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Department</TableHead>
                                <TableHead className="text-right font-bold text-slate-700 h-14 px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {processes && processes.length > 0 ? (
                                processes.map((proc, idx) => (
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
                                                <span className="font-semibold text-slate-900">{proc.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-500 max-w-sm truncate py-4" title={proc.description || ''}>
                                            {proc.description || <span className="text-slate-300 italic">No description</span>}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge className="bg-slate-100 text-slate-600 border-none font-bold uppercase text-[10px] tracking-wider px-2.5 py-1">
                                                {proc.department || 'General'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right py-4 px-6">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-[#3ABEF9] hover:text-[#1C4D8D] hover:bg-sky-50 font-bold rounded-lg transition-all"
                                                onClick={() => toast.info(`Data Flow mapping for ${proc.name} coming soon`)}
                                            >
                                                Configure Flows <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-72 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="p-6 bg-slate-50 rounded-2xl">
                                                <Database className="h-12 w-12 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900 text-lg">No processes found</p>
                                                <p className="max-w-xs mx-auto">Start by defining your business processes to begin mapping data flows.</p>
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

            <EnhancedDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                title="Add Business Process"
                description="Define a new process (e.g., Payroll, Marketing Analysis) to map data flows against."
                primaryAction={{
                    label: createProcessMutation.isPending ? "Creating..." : "Create Process",
                    onClick: handleCreate,
                    disabled: createProcessMutation.isPending,
                    className: "bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white font-bold h-11 px-6 rounded-xl"
                }}
            >
                <div className="grid gap-6 py-4">
                    <div className="grid gap-2.5">
                        <Label className="text-slate-700 font-bold">Process Name</Label>
                        <Input
                            value={processName}
                            onChange={e => setProcessName(e.target.value)}
                            placeholder="e.g. Employee Onboarding"
                            className="h-12 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                        />
                    </div>
                    <div className="grid gap-2.5">
                        <Label className="text-slate-700 font-bold">Department</Label>
                        <Input
                            value={processDept}
                            onChange={e => setProcessDept(e.target.value)}
                            placeholder="e.g. HR"
                            className="h-12 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                        />
                    </div>
                    <div className="grid gap-2.5">
                        <Label className="text-slate-700 font-bold">Description</Label>
                        <Input
                            value={processDesc}
                            onChange={e => setProcessDesc(e.target.value)}
                            placeholder="Brief description of the activity and purpose"
                            className="h-12 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                        />
                    </div>
                </div>
            </EnhancedDialog>
        </div>
    );
}
