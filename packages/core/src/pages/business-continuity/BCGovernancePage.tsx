
import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Label } from "@complianceos/ui/ui/label";
import { Badge } from "@complianceos/ui/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { ArrowLeft, Save, Plus, Trash2, Users, FileText, DollarSign, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function BCGovernancePage() {
    const params = useParams();
    const clientId = parseInt(params.clientId || "0");
    const [_location, setLocation] = useLocation();

    // Fetch Program Data
    const { data: program, isLoading, refetch } = trpc.businessContinuity.program.get.useQuery({ clientId }, { enabled: !!clientId });
    const { data: committee } = trpc.businessContinuity.program.committee.list.useQuery({ programId: program?.id || 0 }, { enabled: !!program?.id });
    const { data: users } = trpc.users.list.useQuery();

    // Mutations
    const upsertProgram = trpc.businessContinuity.program.upsert.useMutation({
        onSuccess: () => {
            toast.success("Program details saved.");
            refetch();
        }
    });

    const addMember = trpc.businessContinuity.program.committee.add.useMutation({
        onSuccess: () => {
            toast.success("Member added.");
            refetch();
            setNewMember({ userId: "", role: "", responsibilities: "" });
        }
    });

    const removeMember = trpc.businessContinuity.program.committee.remove.useMutation({
        onSuccess: () => toast.success("Member removed.")
    });

    // Local State
    const [formData, setFormData] = useState({
        programName: "",
        scopeDescription: "",
        policyStatement: "",
        budgetAllocated: "",
        status: "draft",
        programManagerId: "",
        executiveSponsorId: ""
    });

    const [newMember, setNewMember] = useState({ userId: "", role: "", responsibilities: "" });

    // Load data into state
    useEffect(() => {
        if (program) {
            setFormData({
                programName: program.programName || "",
                scopeDescription: program.scopeDescription || "",
                policyStatement: program.policyStatement || "",
                budgetAllocated: program.budgetAllocated || "",
                status: program.status || "draft",
                programManagerId: program.programManagerId?.toString() || "",
                executiveSponsorId: program.executiveSponsorId?.toString() || ""
            });
        }
    }, [program]);

    const handleSave = () => {
        upsertProgram.mutate({
            ...formData,
            clientId,
            id: program?.id,
            programManagerId: formData.programManagerId ? parseInt(formData.programManagerId) : undefined,
            executiveSponsorId: formData.executiveSponsorId ? parseInt(formData.executiveSponsorId) : undefined,
            status: formData.status as any
        });
    };

    if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-1">
                        <div className="mb-2">
                            <Breadcrumb
                                items={[
                                    { label: "Clients", href: "/clients" },
                                    { label: "Business Continuity", href: `/clients/${clientId}/business-continuity` },
                                    { label: "Governance & Scope", href: `/clients/${clientId}/business-continuity/governance` },
                                ]}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 -ml-3 text-muted-foreground hover:text-foreground"
                                onClick={() => setLocation(`/clients/${clientId}/business-continuity`)}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to BC Dashboard
                            </Button>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">BCM Governance & Scope</h1>
                        <p className="text-muted-foreground">Establish the framework, scope, and leadership for the Business Continuity Program.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={formData.status === 'active' ? 'default' : 'secondary'} className="capitalize text-sm h-8 px-3">
                            {formData.status}
                        </Badge>
                        <Button onClick={handleSave}>
                            <Save className="w-4 h-4 mr-2" /> Save Changes
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="charter" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
                        <TabsTrigger value="charter">1. Charter & Scope</TabsTrigger>
                        <TabsTrigger value="committee">2. BCP Committee</TabsTrigger>
                        <TabsTrigger value="approval">3. Approval & Budget</TabsTrigger>
                    </TabsList>

                    {/* CHARTER CONTENT */}
                    <TabsContent value="charter" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Program Definition</CardTitle>
                                <CardDescription>Define the boundaries and objectives of the BCM program.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Program Name</Label>
                                    <Input value={formData.programName} onChange={e => setFormData({ ...formData, programName: e.target.value })} placeholder="e.g. 2024 Global BCM Program" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Scope Statement</Label>
                                    <Textarea className="min-h-[150px]" value={formData.scopeDescription} onChange={e => setFormData({ ...formData, scopeDescription: e.target.value })}
                                        placeholder="Identify business units, locations, and assets covered by this program. Explicitly list exclusions." />
                                    <p className="text-xs text-muted-foreground">Tip: Align this with ISO 22301 Context of Organization.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>BC Policy Statement</Label>
                                    <Textarea className="min-h-[200px]" value={formData.policyStatement} onChange={e => setFormData({ ...formData, policyStatement: e.target.value })}
                                        placeholder="Statement of intent and direction by top management..." />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* COMMITTEE CONTENT */}
                    <TabsContent value="committee" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> BCP Committee / Team</CardTitle>
                                <CardDescription>Assignable roles for program oversight and execution.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Program Manager</Label>
                                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={formData.programManagerId} onChange={e => setFormData({ ...formData, programManagerId: e.target.value })}>
                                            <option value="">Select User...</option>
                                            {users?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Executive Sponsor</Label>
                                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={formData.executiveSponsorId} onChange={e => setFormData({ ...formData, executiveSponsorId: e.target.value })}>
                                            <option value="">Select User...</option>
                                            {users?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Label className="mb-2 block">Committee Members</Label>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Responsibilities</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {committee?.map((m: any) => (
                                                <TableRow key={m.id}>
                                                    <TableCell>{m.user?.name}</TableCell>
                                                    <TableCell>{m.role}</TableCell>
                                                    <TableCell>{m.responsibilities}</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="sm" onClick={() => removeMember.mutate({ id: m.id })}>
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow>
                                                <TableCell>
                                                    <select className="w-full bg-transparent p-1 text-sm border-b"
                                                        value={newMember.userId} onChange={e => setNewMember({ ...newMember, userId: e.target.value })}>
                                                        <option value="">Select User...</option>
                                                        {users?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                    </select>
                                                </TableCell>
                                                <TableCell>
                                                    <Input className="h-8" placeholder="e.g. IT Rep" value={newMember.role} onChange={e => setNewMember({ ...newMember, role: e.target.value })} />
                                                </TableCell>
                                                <TableCell>
                                                    <Input className="h-8" placeholder="Tasks..." value={newMember.responsibilities} onChange={e => setNewMember({ ...newMember, responsibilities: e.target.value })} />
                                                </TableCell>
                                                <TableCell>
                                                    <Button size="sm" onClick={() => {
                                                        if (!newMember.userId || !newMember.role) return;
                                                        addMember.mutate({
                                                            programId: program!.id,
                                                            userId: parseInt(newMember.userId),
                                                            role: newMember.role,
                                                            responsibilities: newMember.responsibilities
                                                        });
                                                    }} disabled={!program?.id || !newMember.userId}>
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                    {!program?.id && <p className="text-sm text-yellow-600 mt-2">Save the program first to add committee members.</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* APPROVAL & BUDGET */}
                    <TabsContent value="approval" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" /> Budget & Resources</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label>Allocated Budget</Label>
                                    <Input value={formData.budgetAllocated} onChange={e => setFormData({ ...formData, budgetAllocated: e.target.value })} placeholder="e.g. $50,000 / year" />
                                    <p className="text-muted-foreground text-sm">Include personnel time, software licenses, and training costs.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-green-600 border-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Executive Sign-off</CardTitle>
                                <CardDescription>Formal approval to initiate or renew the BCN Program.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm">
                                    By setting the status to <strong>Active</strong>, the Executive Sponsor confirms that resources are allocated and the Scope/Policy is approved.
                                </p>
                                <div className="flex items-center gap-4">
                                    <Label>Program Status:</Label>
                                    <select className="flex h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm font-medium"
                                        value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="draft">Draft (Planning)</option>
                                        <option value="approved">Approved</option>
                                        <option value="active">Active (Live)</option>
                                    </select>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
