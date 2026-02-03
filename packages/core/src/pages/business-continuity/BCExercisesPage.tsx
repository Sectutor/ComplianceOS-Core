
import React, { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Badge } from "@complianceos/ui/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@complianceos/ui/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { ArrowLeft, Plus, Calendar, FlaskConical, FileCheck } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function BCExercisesPage() {
    const [, setLocation] = useLocation();
    const [match, params] = useRoute("/clients/:clientId/business-continuity/exercises");
    const clientId = params?.clientId ? parseInt(params.clientId) : 0;

    const { data: exercises, refetch } = trpc.businessContinuity.exercises.listAll.useQuery({ clientId }, { enabled: !!clientId });
    const { data: plans } = trpc.businessContinuity.plans.list.useQuery({ clientId }, { enabled: !!clientId });

    const createExercise = trpc.businessContinuity.exercises.create.useMutation({
        onSuccess: () => {
            toast.success("Exercise scheduled/logged");
            setDialogOpen(false);
            refetch();
            setFormData({ planId: "", title: "", type: "Tabletop", date: new Date().toISOString().split('T')[0], status: "Scheduled", notes: "" });
        }
    });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        planId: "",
        title: "",
        type: "Tabletop",
        date: new Date().toISOString().split('T')[0],
        status: "Scheduled",
        notes: ""
    });

    const handleSave = () => {
        if (!formData.planId) return toast.error("Select a plan to test");
        if (!formData.title) return toast.error("Enter a title");

        createExercise.mutate({
            clientId,
            planId: parseInt(formData.planId),
            title: formData.title,
            type: formData.type,
            date: formData.date,
            status: formData.status,
            notes: formData.notes
        });
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent" onClick={() => setLocation(`/clients/${clientId}/business-continuity/dashboard`)}>
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                            </Button>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">BCP Exercises & Testing</h1>
                        <p className="text-muted-foreground">Schedule and review exercises (drills, tabletops, simulations) to validate plans.</p>
                    </div>
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Schedule Exercise
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Exercise Log</CardTitle>
                        <CardDescription>History of all BCP exercises across different plans.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Target Plan</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {exercises?.map((ex: any) => (
                                    <TableRow key={ex.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <FlaskConical className="w-4 h-4 text-orange-500" />
                                            {ex.title}
                                        </TableCell>
                                        <TableCell>{ex.planTitle}</TableCell>
                                        <TableCell><Badge variant="outline">{ex.type}</Badge></TableCell>
                                        <TableCell>{new Date(ex.startDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={ex.status === 'Completed' ? 'default' : 'secondary'} className="capitalize">{ex.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!exercises || exercises.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            No exercises logged.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Schedule New Exercise</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Target Plan</Label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    value={formData.planId}
                                    onChange={e => setFormData({ ...formData, planId: e.target.value })}
                                >
                                    <option value="">Select Plan...</option>
                                    {plans?.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.title} (v{p.version})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Exercise Title</Label>
                                <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Q4 Ransomware Simulation" />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Walkthrough">Walkthrough</SelectItem>
                                        <SelectItem value="Tabletop">Tabletop</SelectItem>
                                        <SelectItem value="Drill">Drill</SelectItem>
                                        <SelectItem value="Full Scale">Full Scale</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Scheduled">Scheduled</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                            <SelectItem value="Review Pending">Review Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Objectives..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave}>Schedule</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
