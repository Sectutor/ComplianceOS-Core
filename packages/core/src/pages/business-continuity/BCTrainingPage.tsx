
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
import { ArrowLeft, Plus, Calendar, User, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function BCTrainingPage() {
    const [, setLocation] = useLocation();
    const [match, params] = useRoute("/clients/:clientId/business-continuity/training");
    const clientId = params?.clientId ? parseInt(params.clientId) : 0;

    const { data: records, refetch } = trpc.businessContinuity.program.training.list.useQuery({ clientId }, { enabled: !!clientId });
    const { data: users } = trpc.users.list.useQuery({ clientId }, { enabled: !!clientId }); // Assuming users.list exists or similar

    const addRecord = trpc.businessContinuity.program.training.add.useMutation({
        onSuccess: () => {
            toast.success("Training record and certification logged");
            setDialogOpen(false);
            refetch();
            setFormData({ userId: "", trainingType: "awareness", completionDate: new Date().toISOString().split('T')[0], notes: "" });
        }
    });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        userId: "",
        trainingType: "awareness",
        completionDate: new Date().toISOString().split('T')[0],
        notes: ""
    });

    const handleSave = () => {
        if (!formData.userId) return toast.error("Select a user");
        addRecord.mutate({
            clientId,
            userId: parseInt(formData.userId),
            trainingType: formData.trainingType,
            completionDate: formData.completionDate,
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
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">BCP Training & Awareness</h1>
                        <p className="text-muted-foreground">Track staff training, role-specific certifications, and awareness campaigns.</p>
                    </div>
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Log Training
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Training Records</CardTitle>
                        <CardDescription>History of completed BCP training modules.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Staff Member</TableHead>
                                    <TableHead>Training Type</TableHead>
                                    <TableHead>Completion Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records?.map((rec: any) => (
                                    <TableRow key={rec.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            {rec.user?.name || "Unknown User"}
                                        </TableCell>
                                        <TableCell className="capitalize">{rec.trainingType.replace('_', ' ')}</TableCell>
                                        <TableCell>{new Date(rec.completionDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Completed
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{rec.notes}</TableCell>
                                    </TableRow>
                                ))}
                                {(!records || records.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            No training records found.
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
                            <DialogTitle>Log Training Record</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Staff Member</Label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    value={formData.userId}
                                    onChange={e => setFormData({ ...formData, userId: e.target.value })}
                                >
                                    <option value="">Select User...</option>
                                    {users?.map((u: any) => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Training Type</Label>
                                <Select value={formData.trainingType} onValueChange={v => setFormData({ ...formData, trainingType: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="awareness">General Awareness</SelectItem>
                                        <SelectItem value="role_based">Role-Based Training</SelectItem>
                                        <SelectItem value="incident_response">Incident Response Simulation</SelectItem>
                                        <SelectItem value="crisis_management">Crisis Management Certification</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Completion Date</Label>
                                <Input type="date" value={formData.completionDate} onChange={e => setFormData({ ...formData, completionDate: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Notes / Score</Label>
                                <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="e.g. Scored 100% on quiz" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave}>Log Training</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
