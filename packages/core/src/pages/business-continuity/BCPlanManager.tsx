
import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeft, Save, History, PlayCircle, FileText, GitBranch, Loader2, Printer, Siren } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@complianceos/ui/ui/table";
import { Dialog, DialogMiddleware, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@complianceos/ui/ui/dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Label } from "@complianceos/ui/ui/label";

import {
    PlanDetailsTab,
    PlanStrategiesTab,
    PlanActivitiesTab,
    PlanContactsTab
} from "@/components/business-continuity/plans/PlanTabs";
import { PlanPrintView } from "@/components/business-continuity/plans/PlanPrintView";
import { generatePlanDocument } from "@/components/business-continuity/plans/generatePlanDoc";
import { BcPlanCommunications, BcPlanLogistics } from "@/components/business-continuity/plans/BcPlanComponents";
import { PlanIntroductionEditor, PlanActivationEditor, PlanAppendicesEditor } from "@/components/business-continuity/plans/BCPlanExtensions";

export default function BCPlanManager() {
    const [, setLocation] = useLocation();
    const [match, params] = useRoute("/clients/:clientId/business-continuity/plans/:planId");

    if (!match || !params) return null;

    const clientId = parseInt(params.clientId);
    const planId = parseInt(params.planId);

    const [activeTab, setActiveTab] = useState("overview");

    // Queries
    const { data: plan, refetch: refetchPlan } = trpc.businessContinuity.plans.get.useQuery({ id: planId, clientId });
    const { data: versions, refetch: refetchVersions } = trpc.businessContinuity.plans.getVersions.useQuery({ planId, clientId });
    const { data: exercises, refetch: refetchExercises } = trpc.businessContinuity.exercises.list.useQuery({ planId, clientId });
    const { data: changeLog } = trpc.businessContinuity.plans.getChangeLog.useQuery({ planId, clientId });
    const { data: planContacts, refetch: refetchContacts } = trpc.businessContinuity.plans.contacts.list.useQuery({ planId });

    // Resource Queries for Editing
    const { data: strategies } = trpc.businessContinuity.strategies.list.useQuery({ clientId });
    const { data: scenarios } = trpc.businessContinuity.scenarios.list.useQuery({ clientId });
    const { data: bias } = trpc.businessContinuity.bia.list.useQuery({ clientId });
    const { data: availableUsers } = trpc.businessContinuity.stakeholders.searchCandidates.useQuery({});

    // Mutations
    const updatePlan = trpc.businessContinuity.plans.update.useMutation({
        onSuccess: () => {
            toast.success("Plan updated");
            refetchPlan();
        }
    });

    const createVersion = trpc.businessContinuity.plans.createVersion.useMutation({
        onSuccess: () => {
            toast.success("New version created");
            refetchVersions();
            setVersionDialogOpen(false);
        }
    });

    const createExercise = trpc.businessContinuity.exercises.create.useMutation({
        onSuccess: () => {
            toast.success("Exercise logged");
            refetchExercises();
            setExerciseDialogOpen(false);
        }
    });

    const addContact = trpc.businessContinuity.plans.contacts.add.useMutation({
        onSuccess: () => {
            toast.success("Contact added");
            refetchContacts();
        }
    });

    const removeContact = trpc.businessContinuity.plans.contacts.remove.useMutation({
        onSuccess: () => {
            toast.success("Contact removed");
            refetchContacts();
        }
    });

    // Local State for Edit Mode
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>(null);

    // Initialize form data when entering edit mode
    React.useEffect(() => {
        if (plan && !formData) {
            setFormData({
                title: plan.title,
                version: plan.version,
                department: (plan.content as any)?.metadata?.department || "", // Legacy/Fallback
                selectedStrategyIds: plan.strategies?.map((s: any) => s.id) || [],
                selectedScenarioIds: plan.scenarios?.map((s: any) => s.id) || [],
                selectedBiaIds: plan.bias?.map((b: any) => b.id) || [],
            });
        }
    }, [plan, formData]);

    const handleSave = async () => {
        if (!formData) return;

        // Reconstruct content JSON for PDF/Snapshot compatibility (minimal metadata only)
        const content = JSON.stringify({
            metadata: {
                department: formData.department,
                generatedAt: new Date().toISOString()
            }
        }, null, 2);

        await updatePlan.mutateAsync({
            id: planId,
            clientId,
            title: formData.title,
            version: formData.version,
            content,
            biaIds: formData.selectedBiaIds,
            strategyIds: formData.selectedStrategyIds,
            scenarioIds: formData.selectedScenarioIds,
        });
        setIsEditing(false);
    };

    // Dialog States
    const [versionDialogOpen, setVersionDialogOpen] = useState(false);
    const [newVersion, setNewVersion] = useState("");
    const [changeSummary, setChangeSummary] = useState("");

    const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
    const [exerciseData, setExerciseData] = useState({ title: "", type: "Tabletop", date: new Date().toISOString().split('T')[0], status: "Completed", notes: "" });

    // Crisis Mode State
    const [crisisModeOpen, setCrisisModeOpen] = useState(false);

    // Print Handler
    const handlePrint = () => {
        // We trigger a print on a hidden iframe or just the window logic
        // For simplicity in this iteration, we can open a new window or use CSS print media
        // on the current window if we rendered the layout correctly. 
        // Best approach for SPA: Render the print view in a hidden div, and use @media print to hide everything else.
        window.print();
    };

    // Export Logic - Using new backend endpoint
    const exportDocxMutation = trpc.businessContinuity.plans.exportDocx.useMutation({
        onSuccess: (data) => {
            // Convert base64 to blob and download
            const binaryString = atob(data.base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = data.filename;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("Document downloaded!");
        },
        onError: (error) => {
            toast.error(`Export failed: ${error.message}`);
        }
    });

    const handleExportDocx = () => {
        toast.info("Generating Word Document...");
        exportDocxMutation.mutate({ id: planId, clientId });
    };


    if (!plan) return <div className="p-8"><Loader2 className="animate-spin" /> Loading Plan...</div>;

    return (
        <DashboardLayout>
            {/* Print View (Hidden on Screen, Visible on Print) */}
            <div className="hidden print:block print:absolute print:top-0 print:left-0 print:w-full print:bg-white print:z-[9999]">
                {plan && <PlanPrintView plan={plan} />}
            </div>

            {/* Crisis Mode Dialog */}
            <Dialog open={crisisModeOpen} onOpenChange={setCrisisModeOpen}>
                <DialogContent className="max-w-[95vw] h-[95vh] overflow-y-auto bg-slate-50 p-0">
                    <div className="p-0">
                        <div className="bg-red-600 text-white p-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Siren className="w-6 h-6 animate-pulse" />
                                CRISIS MODE ACTIVATED
                            </h2>
                            <Button variant="secondary" size="sm" onClick={() => setCrisisModeOpen(false)}>
                                Deactivate & Close
                            </Button>
                        </div>
                        {plan && <PlanPrintView plan={plan} isCrisisMode={true} />}
                    </div>
                </DialogContent>
            </Dialog>

            <div className="min-h-[calc(100vh-4rem)] bg-background p-6 lg:p-10 print:hidden">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent" onClick={() => setLocation(`/clients/${clientId}/business-continuity/plans`)}>
                                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Plans
                                </Button>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                                {plan?.title}
                                <Badge variant="outline" className="text-base font-normal">v{plan?.version}</Badge>
                                <Badge variant={plan?.status === 'approved' ? 'default' : 'secondary'} className="capitalize">{plan?.status}</Badge>
                            </h1>
                            <p className="text-muted-foreground">Manage plan details, strategies, and version history.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={handlePrint}>
                                <Printer className="w-4 h-4 mr-2" />
                                Export PDF
                            </Button>
                            <Button variant="outline" onClick={handleExportDocx} disabled={exportDocxMutation.isPending}>
                                <FileText className="w-4 h-4 mr-2" />
                                {exportDocxMutation.isPending ? 'Generating...' : 'Export DOCX'}
                            </Button>
                            <Button variant="destructive" className="gap-2" onClick={() => setCrisisModeOpen(true)}>
                                <Siren className="w-4 h-4" />
                                Activate Crisis Mode
                            </Button>
                            {!isEditing ? (
                                <Button onClick={() => setIsEditing(true)}>Edit Plan</Button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button onClick={handleSave}>
                                        <Save className="w-4 h-4 mr-2" /> Save Changes
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent overflow-x-auto flex-nowrap">
                        <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 py-3 shrink-0">Overview</TabsTrigger>
                        <TabsTrigger value="intro" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 py-3 shrink-0">1. Introduction</TabsTrigger>
                        <TabsTrigger value="roles" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 py-3 shrink-0">2. Roles</TabsTrigger>
                        <TabsTrigger value="activation" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 py-3 shrink-0">3. Activation</TabsTrigger>
                        <TabsTrigger value="strategies" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 py-3 shrink-0">4. Playbooks</TabsTrigger>
                        <TabsTrigger value="logistics" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 py-3 shrink-0">Logistics</TabsTrigger>
                        <TabsTrigger value="appendices" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 py-3 shrink-0">Appendices</TabsTrigger>
                        <TabsTrigger value="exercises" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 py-3 shrink-0">Exercises</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Main Info */}
                            <Card className="md:col-span-2">
                                <CardHeader><CardTitle>Plan Details</CardTitle></CardHeader>
                                <CardContent>
                                    {isEditing ? (
                                        <PlanDetailsTab
                                            formData={formData}
                                            setFormData={setFormData}
                                            onNext={() => setActiveTab('intro')}
                                        />
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground block">Title</span>
                                                    <span className="font-medium">{plan.title}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">Current Version</span>
                                                    <span className="font-medium">{plan.version}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">Department/Scope</span>
                                                    <span className="font-medium">{(plan.content as any)?.metadata?.department || "N/A"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">Status</span>
                                                    <span className="capitalize">{plan.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Recent Activity */}
                            <Card>
                                <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {changeLog?.slice(0, 5).map(log => (
                                            <div key={log.id} className="text-sm border-b pb-2 last:border-0">
                                                <div className="font-medium">{log.action}</div>
                                                <div className="text-muted-foreground text-xs">{new Date(log.createdAt).toLocaleString()}</div>
                                                <div className="text-xs mt-1">{log.details}</div>
                                            </div>
                                        ))}
                                        {(!changeLog || changeLog.length === 0) && <div className="text-muted-foreground text-sm">No activity recorded.</div>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="intro" className="mt-6">
                        <PlanIntroductionEditor planId={planId} clientId={clientId} />
                    </TabsContent>

                    <TabsContent value="activation" className="mt-6 space-y-6">
                        <PlanActivationEditor planId={planId} clientId={clientId} />
                        <BcPlanCommunications planId={planId} clientId={clientId} />
                    </TabsContent>

                    <TabsContent value="appendices" className="mt-6">
                        <PlanAppendicesEditor planId={planId} clientId={clientId} />
                    </TabsContent>

                    {/* Roles / Contacts */}
                    <TabsContent value="roles" className="mt-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Plan Contacts</CardTitle>
                                {isEditing && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button size="sm">Add Contact</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add Contact to Plan</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>User</Label>
                                                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" id="user-select">
                                                        <option value="">Select user...</option>
                                                        {availableUsers?.map(u => (
                                                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Role</Label>
                                                    <Input id="role-input" placeholder="e.g. Plan Coordinator" />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={() => {
                                                    const userId = (document.getElementById('user-select') as HTMLSelectElement)?.value;
                                                    const role = (document.getElementById('role-input') as HTMLInputElement)?.value;
                                                    if (userId && role) {
                                                        addContact.mutate({ planId, clientId, userId: parseInt(userId), role });
                                                    }
                                                }}>Add Contact</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Primary</TableHead>
                                            {isEditing && <TableHead>Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {planContacts?.map((c: any) => (
                                            <TableRow key={c.id}>
                                                <TableCell>{c.userName || 'N/A'}</TableCell>
                                                <TableCell>{c.role}</TableCell>
                                                <TableCell>{c.userEmail || 'N/A'}</TableCell>
                                                <TableCell>{c.isPrimary && <Badge>Primary</Badge>}</TableCell>
                                                {isEditing && (
                                                    <TableCell>
                                                        <Button size="sm" variant="ghost" onClick={() => removeContact.mutate({ id: c.id, clientId })}>Remove</Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                        {(!planContacts?.length) && <TableRow><TableCell colSpan={isEditing ? 5 : 4} className="text-center text-muted-foreground">No contacts assigned.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Strategies & Scope Edit Tab */}
                    <TabsContent value="strategies" className="mt-6">
                        <Card>
                            <CardContent className="pt-6">
                                {isEditing ? (
                                    <div className="space-y-8">
                                        <PlanStrategiesTab
                                            formData={formData}
                                            toggleStrategy={(id) => {
                                                const current = formData.selectedStrategyIds;
                                                const updated = current.includes(id) ? current.filter((x: number) => x !== id) : [...current, id];
                                                setFormData({ ...formData, selectedStrategyIds: updated });
                                            }}
                                            toggleScenario={(id) => {
                                                const current = formData.selectedScenarioIds;
                                                const updated = current.includes(id) ? current.filter((x: number) => x !== id) : [...current, id];
                                                setFormData({ ...formData, selectedScenarioIds: updated });
                                            }}
                                            strategies={strategies || []}
                                            scenarios={scenarios || []}
                                            onBack={() => { }}
                                            onNext={() => { }}
                                        />
                                        <div className="border-t pt-8">
                                            <PlanActivitiesTab
                                                formData={formData}
                                                toggleBia={(id) => {
                                                    const current = formData.selectedBiaIds;
                                                    const updated = current.includes(id) ? current.filter((x: number) => x !== id) : [...current, id];
                                                    setFormData({ ...formData, selectedBiaIds: updated });
                                                }}
                                                bias={bias || []}
                                                onBack={() => { }}
                                                onNext={() => { }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-semibold mb-2">Attached Strategies</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {plan.strategies?.map((s: any) => (
                                                    <Badge key={s.id} variant="secondary">{s.title}</Badge>
                                                ))}
                                                {(!plan.strategies?.length) && <span className="text-muted-foreground">None</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-2">Addressed Scenarios</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {plan.scenarios?.map((s: any) => (
                                                    <Badge key={s.id} variant="outline">{s.title}</Badge>
                                                ))}
                                                {(!plan.scenarios?.length) && <span className="text-muted-foreground">None</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-2">Included BIAs</h3>
                                            <ul className="list-disc pl-5">
                                                {plan.bias?.map((b: any) => (
                                                    <li key={b.id}>{b.title}</li>
                                                ))}
                                                {(!plan.bias?.length) && <span className="text-muted-foreground">None</span>}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Communications Tab */}
                    <TabsContent value="comms" className="mt-6 space-y-6">
                        <BcPlanCommunications planId={parseInt(planId!)} clientId={clientId} />
                    </TabsContent>

                    {/* Logistics Tab */}
                    <TabsContent value="logistics" className="mt-6 space-y-6">
                        <BcPlanLogistics planId={parseInt(planId!)} clientId={clientId} />
                    </TabsContent>

                    {/* Governance Tab */}
                    <TabsContent value="governance" className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Versions */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg">Version History</CardTitle>
                                    <Dialog open={versionDialogOpen} onOpenChange={setVersionDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="outline"><GitBranch className="w-4 h-4 mr-2" /> Snapshot Version</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Create New Version</DialogTitle>
                                                <DialogDescription>Create a read-only snapshot of the current plan state.</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Version Number</Label>
                                                    <Input placeholder="e.g. 1.2" value={newVersion} onChange={e => setNewVersion(e.target.value)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Change Summary</Label>
                                                    <Textarea placeholder="What changed?" value={changeSummary} onChange={e => setChangeSummary(e.target.value)} />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={() => createVersion.mutateAsync({ planId, clientId, version: newVersion, changeSummary })} disabled={createVersion.isPending}>
                                                    {createVersion.isPending && <Loader2 className="animate-spin mr-2 w-4 h-4" />} Create Snapshot
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Version</TableHead><TableHead>Date</TableHead><TableHead>Summary</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {versions?.map(v => (
                                                <TableRow key={v.id}>
                                                    <TableCell className="font-medium">{v.version}</TableCell>
                                                    <TableCell>{new Date(v.createdAt).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">{v.changeSummary}</TableCell>
                                                </TableRow>
                                            ))}
                                            {(!versions?.length) && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No versions saved.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Full Change Log */}
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Full Audit Log</CardTitle></CardHeader>
                                <CardContent className="max-h-[400px] overflow-y-auto">
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>User</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {changeLog?.map(log => (
                                                <TableRow key={log.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{log.action}</div>
                                                        <div className="text-xs text-muted-foreground">{log.details}</div>
                                                    </TableCell>
                                                    <TableCell>{log.userName || 'System'}</TableCell>
                                                    <TableCell className="text-xs">{new Date(log.createdAt).toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Exercises Tab */}
                    <TabsContent value="exercises" className="mt-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Plan Exercises</CardTitle>
                                    <CardDescription>Record tabletop exercises, simulations, and tests.</CardDescription>
                                </div>
                                <Dialog open={exerciseDialogOpen} onOpenChange={setExerciseDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button><PlayCircle className="w-4 h-4 mr-2" /> Log Exercise</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Log Plan Exercise</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Title</Label>
                                                <Input placeholder="e.g. Q1 Tabletop" value={exerciseData.title} onChange={e => setExerciseData({ ...exerciseData, title: e.target.value })} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Type</Label>
                                                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={exerciseData.type} onChange={e => setExerciseData({ ...exerciseData, type: e.target.value })}>
                                                        <option>Tabletop</option>
                                                        <option>Simulation</option>
                                                        <option>Full Interruption</option>
                                                        <option>Checklist</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Date</Label>
                                                    <Input type="date" value={exerciseData.date} onChange={e => setExerciseData({ ...exerciseData, date: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Outcome/Notes</Label>
                                                <Textarea value={exerciseData.notes} onChange={e => setExerciseData({ ...exerciseData, notes: e.target.value })} />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={() => createExercise.mutateAsync({ ...exerciseData, clientId, planId })} disabled={createExercise.isPending}>
                                                Log Exercise
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Exercise</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Notes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {exercises?.map(ex => (
                                            <TableRow key={ex.id}>
                                                <TableCell>{new Date(ex.date).toLocaleDateString()}</TableCell>
                                                <TableCell className="font-medium">{ex.title}</TableCell>
                                                <TableCell>{ex.type}</TableCell>
                                                <TableCell><Badge variant="outline">{ex.status}</Badge></TableCell>
                                                <TableCell className="max-w-xs truncate text-muted-foreground">{ex.notes}</TableCell>
                                            </TableRow>
                                        ))}
                                        {(!exercises?.length) && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No exercises logged.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
