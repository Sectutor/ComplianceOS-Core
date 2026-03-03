import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import { trpc } from "@/lib/trpc";
import { Loader2, Calendar, CalendarDays, CheckCircle2, Clock, AlertCircle, FileText, Plus, MoreHorizontal, Search, BarChart3, ClipboardCheck, ShieldCheck, X, UserPlus, Mail, Trash2 } from "lucide-react";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@complianceos/ui/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@complianceos/ui/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { useParams } from "wouter";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@complianceos/ui/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import { toast } from "sonner";

interface Audit {
    id: string;
    title: string;
    type: "Internal" | "External" | "Supplier";
    scope: string;
    auditor: string;
    plannedDate: string;
    status: "planned" | "in_progress" | "completed" | "delayed";
    findings: number;
}

export default function AuditManager() {
    const params = useParams<{ id: string }>();
    const clientId = parseInt(params.id || "0");

    // Validate clientId - must be a positive number
    if (!clientId || clientId <= 0) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <p className="text-red-500 text-lg font-medium">Invalid client ID</p>
                        <p className="text-slate-500 mt-2">Please select a valid client from the dashboard.</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const [activeTab, setActiveTab] = useState("schedule");
    const [searchQuery, setSearchQuery] = useState("");
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

    // Form state for scheduling audit
    const [auditForm, setAuditForm] = useState({
        title: "",
        type: "Internal" as "Internal" | "External" | "Supplier",
        scope: "",
        plannedDate: "",
        auditorName: "",
        auditorEmail: "",
        createCalendarEvent: true
    });
    const [participants, setParticipants] = useState<Array<{ name: string; email: string }>>([]);
    const [newParticipant, setNewParticipant] = useState({ name: "", email: "" });

    // Fetch audits from API - falls back to empty array if not implemented yet
    const { data: auditsData, isLoading, refetch } = trpc.audit.list.useQuery(
        { clientId },
        { enabled: !!clientId && clientId > 0 }
    );

    // Use API data or empty array (API may not be implemented yet)
    const audits: Audit[] = auditsData || [];

    // Schedule audit mutation
    const scheduleAuditMutation = trpc.audit.scheduleAudit.useMutation({
        onSuccess: (data) => {
            toast.success("Audit scheduled successfully!");
            if (data.calendarEvent) {
                toast.info("Calendar event created");
            }
            if (data.invitations.length > 0) {
                toast.info(`${data.invitations.length} invitation(s) sent`);
            }
            setIsScheduleDialogOpen(false);
            resetForm();
            refetch();
        },
        onError: (error) => {
            toast.error(`Failed to schedule audit: ${error.message}`);
        }
    });

    const resetForm = () => {
        setAuditForm({
            title: "",
            type: "Internal",
            scope: "",
            plannedDate: "",
            auditorName: "",
            auditorEmail: "",
            createCalendarEvent: true
        });
        setParticipants([]);
        setNewParticipant({ name: "", email: "" });
    };

    const handleScheduleAudit = () => {
        if (!auditForm.title || !auditForm.plannedDate) {
            toast.error("Please fill in required fields");
            return;
        }

        scheduleAuditMutation.mutate({
            clientId,
            title: auditForm.title,
            type: auditForm.type,
            scope: auditForm.scope || undefined,
            plannedDate: auditForm.plannedDate,
            auditorName: auditForm.auditorName || undefined,
            auditorEmail: auditForm.auditorEmail || undefined,
            inviteParticipants: participants.length > 0 ? participants : undefined,
            createCalendarEvent: auditForm.createCalendarEvent
        });
    };

    const addParticipant = () => {
        if (newParticipant.name && newParticipant.email) {
            setParticipants([...participants, newParticipant]);
            setNewParticipant({ name: "", email: "" });
        }
    };

    const removeParticipant = (index: number) => {
        setParticipants(participants.filter((_, i) => i !== index));
    };

    // Compute KPI metrics from actual data
    const upcomingAudits = audits.filter(a => a.status === 'planned').length;
    const openFindings = audits.reduce((sum, a) => sum + (a.findings || 0), 0);
    const completedAudits = audits.filter(a => a.status === 'completed').length;
    const totalAudits = audits.length || 1;
    const auditCoverage = totalAudits > 0 ? Math.round((completedAudits / totalAudits) * 100) : 0;

    // Handle loading state
    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            </DashboardLayout>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>;
            case "in_progress":
                return <Badge className="bg-blue-50 text-blue-700 border-blue-200 animate-pulse">In Progress</Badge>;
            case "planned":
                return <Badge variant="outline" className="text-slate-500 border-slate-200 bg-slate-50">Planned</Badge>;
            case "delayed":
                return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Delayed</Badge>;
            default:
                return null;
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case "Internal":
                return <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">Internal</Badge>;
            case "External":
                return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">External</Badge>;
            case "Supplier":
                return <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50">Supplier</Badge>;
            default:
                return null;
        }
    };

    const filteredAudits = audits.filter(audit =>
        audit.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audit.auditor?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                            <ShieldCheck className="h-8 w-8 text-indigo-600" />
                            Audit Manager
                        </h1>
                        <p className="text-lg text-slate-500 max-w-3xl">
                            Plan, establish, implement, and maintain an audit program (ISO 27001 Clause 9.2).
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="border-slate-200">
                            <BarChart3 className="mr-2 h-4 w-4" /> Audit Report
                        </Button>
                        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                                    <Plus className="mr-2 h-4 w-4" /> Schedule Audit
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Schedule New Audit</DialogTitle>
                                    <DialogDescription>
                                        Create a new audit, invite participants, and add to calendar.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-4">
                                    {/* Basic Info */}
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="title">Audit Title *</Label>
                                            <Input
                                                id="title"
                                                placeholder="e.g., Q1 2024 Internal Security Audit"
                                                value={auditForm.title}
                                                onChange={(e) => setAuditForm({ ...auditForm, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="type">Audit Type *</Label>
                                                <Select
                                                    value={auditForm.type}
                                                    onValueChange={(value: any) => setAuditForm({ ...auditForm, type: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Internal">Internal</SelectItem>
                                                        <SelectItem value="External">External</SelectItem>
                                                        <SelectItem value="Supplier">Supplier</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="plannedDate">Planned Date *</Label>
                                                <Input
                                                    id="plannedDate"
                                                    type="date"
                                                    value={auditForm.plannedDate}
                                                    onChange={(e) => setAuditForm({ ...auditForm, plannedDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="scope">Scope</Label>
                                            <Textarea
                                                id="scope"
                                                placeholder="Describe the audit scope, systems, processes, and controls to be evaluated..."
                                                value={auditForm.scope}
                                                onChange={(e) => setAuditForm({ ...auditForm, scope: e.target.value })}
                                                rows={3}
                                            />
                                        </div>
                                    </div>

                                    {/* Auditor Info */}
                                    <div className="border-t pt-4">
                                        <h4 className="font-medium text-sm text-slate-900 mb-3 flex items-center gap-2">
                                            <UserPlus className="h-4 w-4" /> Auditor / Lead
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="auditorName">Auditor Name</Label>
                                                <Input
                                                    id="auditorName"
                                                    placeholder="e.g., John Smith"
                                                    value={auditForm.auditorName}
                                                    onChange={(e) => setAuditForm({ ...auditForm, auditorName: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="auditorEmail">Auditor Email</Label>
                                                <Input
                                                    id="auditorEmail"
                                                    type="email"
                                                    placeholder="auditor@company.com"
                                                    value={auditForm.auditorEmail}
                                                    onChange={(e) => setAuditForm({ ...auditForm, auditorEmail: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Participants */}
                                    <div className="border-t pt-4">
                                        <h4 className="font-medium text-sm text-slate-900 mb-3 flex items-center gap-2">
                                            <Mail className="h-4 w-4" /> Invite Additional Participants
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <Input
                                                placeholder="Name"
                                                value={newParticipant.name}
                                                onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                                            />
                                            <Input
                                                placeholder="Email"
                                                type="email"
                                                value={newParticipant.email}
                                                onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addParticipant}
                                            disabled={!newParticipant.name || !newParticipant.email}
                                            className="mb-3"
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> Add Participant
                                        </Button>
                                        {participants.length > 0 && (
                                            <div className="space-y-2">
                                                {participants.map((p, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-md">
                                                        <span className="text-sm">
                                                            <strong>{p.name}</strong> - {p.email}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeParticipant(index)}
                                                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Calendar Option */}
                                    <div className="border-t pt-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={auditForm.createCalendarEvent}
                                                onChange={(e) => setAuditForm({ ...auditForm, createCalendarEvent: e.target.checked })}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-slate-700">
                                                Create calendar event (appears in Tasks/Calendar)
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleScheduleAudit}
                                        disabled={!auditForm.title || !auditForm.plannedDate || scheduleAuditMutation.isPending}
                                        className="bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        {scheduleAuditMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...
                                            </>
                                        ) : (
                                            <>
                                                <Calendar className="mr-2 h-4 w-4" /> Schedule Audit
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* KPI Cards - Now using computed values from API data */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="border-none shadow-sm bg-indigo-600 text-white">
                        <CardContent className="p-6">
                            <p className="text-indigo-100 font-medium text-sm uppercase tracking-wider">Upcoming Audits</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-4xl font-bold">{upcomingAudits}</span>
                                <span className="text-sm text-indigo-200">planned</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6">
                            <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Open Findings</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-slate-900">{openFindings}</span>
                                <span className="text-sm text-rose-600 font-medium flex items-center">
                                    <AlertCircle className="h-3 w-3 mr-1" /> Needs Action
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6">
                            <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Total Audits</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-slate-900">{totalAudits}</span>
                                <span className="text-sm text-slate-400">recorded</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6">
                            <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Audit Coverage</p>
                            <div className="mt-2 flex flex-col gap-2">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-slate-900">{auditCoverage}%</span>
                                    <span className="text-sm text-slate-400">of audits completed</span>
                                </div>
                                <Progress value={auditCoverage} className="h-1.5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white border p-1 h-12 w-full md:w-auto justify-start mb-6">
                        <TabsTrigger value="schedule" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 h-10 px-6">
                            <CalendarDays className="mr-2 h-4 w-4" /> Audit Schedule
                        </TabsTrigger>
                        <TabsTrigger value="findings" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 h-10 px-6">
                            <AlertCircle className="mr-2 h-4 w-4" /> Non-Conformities
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="schedule" className="space-y-6">
                        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg">Audit Program 2024-2025</CardTitle>
                                        <CardDescription>
                                            Manage your internal and external audit lifecycle.
                                        </CardDescription>
                                    </div>
                                    <div className="relative max-w-sm w-full">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Search audits..."
                                            className="pl-10 bg-white"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                            <TableHead className="w-[120px]">Audit ID</TableHead>
                                            <TableHead>Audit Title & Scope</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Auditor</TableHead>
                                            <TableHead>Planned Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAudits.length > 0 ? (
                                            filteredAudits.map((audit) => (
                                                <TableRow key={audit.id} className="group hover:bg-slate-50/50 cursor-pointer">
                                                    <TableCell className="font-mono text-xs font-medium text-slate-500">
                                                        {audit.id}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                                {audit.title}
                                                            </p>
                                                            <p className="text-xs text-slate-500 line-clamp-1">{audit.scope}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{getTypeBadge(audit.type)}</TableCell>
                                                    <TableCell className="text-sm text-slate-600">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                                {audit.auditor.charAt(0)}
                                                            </div>
                                                            {audit.auditor}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-slate-600">
                                                        {new Date(audit.plannedDate).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(audit.status)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem>
                                                                    <FileText className="mr-2 h-4 w-4" /> View Plan
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem>
                                                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Start Audit
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                                    {searchQuery ? 'No audits match your search' : 'No audits scheduled yet. Click "Schedule Audit" to create one.'}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="findings">
                        <Card className="bg-white border-slate-200">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="p-4 bg-slate-50 rounded-full mb-4">
                                    <CheckCircle2 className="h-12 w-12 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">No Open Non-Conformities</h3>
                                <p className="text-slate-500 max-w-sm mt-2">
                                    Great job! All audit findings and non-conformities have been addressed or none have been raised yet.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
