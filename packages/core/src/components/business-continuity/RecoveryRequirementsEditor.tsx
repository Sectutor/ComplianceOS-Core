import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Loader2, Plus, Trash2, Save, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@complianceos/ui/ui/table";

interface Props {
    biaId: number;
}

const RTO_OPTIONS = ["0-1 hour", "1-4 hours", "4-24 hours", "1-3 days", "3-7 days", "> 1 week"];
const RPO_OPTIONS = ["0 (Real-time)", "1 hour", "4 hours", "24 hours", "> 24 hours"];
const MTPD_OPTIONS = ["< 4 hours", "24 hours", "3 days", "1 week", "2 weeks", "> 1 month"];

export function RecoveryRequirementsEditor({ biaId }: Props) {
    const { data: objectives, refetch } = trpc.businessContinuity.bia.getRecoveryObjectives.useQuery({ biaId });
    const saveMutation = trpc.businessContinuity.bia.saveRecoveryObjective.useMutation();

    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [activity, setActivity] = useState("");
    const [criticality, setCriticality] = useState("High");
    const [rto, setRto] = useState("4-24 hours");
    const [rpo, setRpo] = useState("24 hours");
    const [mtpd, setMtpd] = useState("3 days");
    const [dependencies, setDependencies] = useState("");
    const [resources, setResources] = useState("");

    const handleSave = async () => {
        if (!activity) {
            toast.error("Activity Name is required");
            return;
        }

        try {
            await saveMutation.mutateAsync({
                biaId,
                activity,
                criticality,
                rto,
                rpo,
                mtpd,
                dependencies,
                resources
            });
            toast.success("Recovery requirements saved");
            setIsAdding(false);
            resetForm();
            refetch();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save");
        }
    };

    const resetForm = () => {
        setActivityName("");
        setCriticality("High");
        setRto("4-24 hours");
        setRpo("24 hours");
        setMtpd("3 days");
        setDependencies("");
        setResources("");
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        Recovery Objectives & Dependencies
                    </CardTitle>
                    <CardDescription>
                        Define the critical activities within this process and their specific recovery requirements (RTO/RPO) and dependencies.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!isAdding && (
                        <div className="flex justify-end mb-4">
                            <Button onClick={() => setIsAdding(true)}>
                                <Plus className="w-4 h-4 mr-2" /> Add Critical Activity
                            </Button>
                        </div>
                    )}

                    {isAdding && (
                        <div className="border rounded-lg p-4 bg-muted/30 space-y-4 mb-6">
                            <div className="space-y-2">
                                <Label>Critical Activity Name</Label>
                                <Input
                                    placeholder="e.g. Process Payroll Batch"
                                    value={activityName}
                                    onChange={(e) => setActivityName(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Criticality</Label>
                                    <Select value={criticality} onValueChange={setCriticality}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Critical">Critical</SelectItem>
                                            <SelectItem value="High">High</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="Low">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>RTO (Target Time)</Label>
                                    <Select value={rto} onValueChange={setRto}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {RTO_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>RPO (Data Loss)</Label>
                                    <Select value={rpo} onValueChange={setRpo}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {RPO_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>MTPD (Max Outage)</Label>
                                    <Select value={mtpd} onValueChange={setMtpd}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {MTPD_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Dependencies (Upstream/Downstream)</Label>
                                    <Textarea
                                        placeholder="Internal apps, vendors, other depts..."
                                        value={dependencies}
                                        onChange={(e) => setDependencies(e.target.value)}
                                        className="min-h-[80px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Required Resources</Label>
                                    <Textarea
                                        placeholder="Staff count, laptops, office space..."
                                        value={resources}
                                        onChange={(e) => setResources(e.target.value)}
                                        className="min-h-[80px]"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                                    {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Save Activity
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                    <TableHead className="text-white font-semibold py-4">Activity</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Criticality</TableHead>
                                    <TableHead className="text-white font-semibold py-4">RTO / RPO</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Dependencies</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Resources</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {objectives?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-6 text-gray-500 bg-white">
                                            No critical activities defined yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {objectives?.map((obj) => (
                                    <TableRow key={obj.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                                        <TableCell className="font-medium text-black py-4">{obj.activity}</TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant={obj.criticality === 'Critical' ? 'destructive' : 'secondary'}>
                                                {obj.criticality}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="text-sm text-black">RTO: <b>{obj.rto}</b></div>
                                            <div className="text-xs text-gray-500">RPO: {obj.rpo}</div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-gray-600 py-4" title={obj.dependencies || ""}>
                                            {obj.dependencies || "-"}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-gray-600 py-4" title={obj.resources || ""}>
                                            {obj.resources || "-"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
