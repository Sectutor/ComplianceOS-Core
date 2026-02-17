import React, { useState, useEffect, ReactElement } from "react";

import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@complianceos/ui/ui/dialog";
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@complianceos/ui/ui/dropdown-menu";
import { toast } from "sonner";
import {
    Plus,
    Search,
    Filter,
    Calendar,
    User,
    AlertCircle,
    CheckCircle2,
    Clock,
    MoreVertical,
    Zap,
    ChevronDown,
    Check,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Switch } from "@complianceos/ui/ui/switch";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { SearchableSelect } from "@complianceos/ui/ui/searchable-select";
import NISTLayout from "./NISTLayout";


export default function NISTPOAM() {
    const params = useParams();
    const clientId = Number(params.id);

    // Using first POAM for MVP
    const { data: poams, refetch: refetchPoams, isLoading: isLoadingPoams } = trpc.federal.listPoams.useQuery({ clientId });

    // Plan Management State
    const [selectedPoamId, setSelectedPoamId] = useState<number | null>(null);

    // Filter & Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    // Reset selection on client change
    useEffect(() => {
        setSelectedPoamId(null);
    }, [clientId]);

    const poamId = selectedPoamId || poams?.[0]?.id;

    const { data: poamData, refetch } = trpc.federal.getPoamWithItems.useQuery(
        { id: poamId!, clientId },
        { enabled: !!poamId }
    );

    // Data for searchable selections
    const { data: clientControls } = trpc.clientControls.list.useQuery({ clientId });
    const { data: assetList } = trpc.assets.list.useQuery({ clientId });
    const { data: vulnerabilities } = trpc.risks.getVulnerabilities.useQuery({ clientId });
    const { data: workspaceMembers } = trpc.users.listWorkspaceMembers.useQuery({ clientId });
    const { data: risks } = trpc.risks.getAll.useQuery({ clientId });

    const createPoamMutation = trpc.federal.createPoam.useMutation({
        onSuccess: (data) => {
            toast.success("POA&M Created");
            refetchPoams();
            setSelectedPoamId(data.id);
        }
    });

    const handleCreatePlan = () => {
        const title = window.prompt("Enter a title for the new POA&M Plan:", `NIST POA&M ${new Date().getFullYear()}`);
        if (title) {
            createPoamMutation.mutate({ clientId, title });
        }
    };

    // Edit POAM item state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Update POAM item mutation
    const updatePoamItem = trpc.federal.updatePoamItem.useMutation({
        onSuccess: () => {
            toast.success("POA&M item updated");
            refetch();
            setEditDialogOpen(false);
            setEditingItem(null);
        },
        onError: (error) => {
            toast.error(`Failed to update POA&M item: ${error.message}`);
        }
    });


    // Handle double-click on table row
    const handleRowDoubleClick = (item: any) => {
        setEditingItem(item);
        setEditDialogOpen(true);
    };

    const addMutation = trpc.federal.addPoamItem.useMutation();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newItem, setNewItem] = useState({
        weaknessName: "",
        weaknessDescription: "",
        controlId: "",
        pointOfContact: "",
        scheduledCompletionDate: "",
        weaknessDetectorSource: "",
        sourceIdentifier: "",
        assetIdentifier: "",
        resourcesRequired: "",
        overallRemediationPlan: "",
        originalDetectionDate: "",
        status: "open",
        statusDate: "",
        vendorDependency: "",
        lastVendorCheckinDate: "",
        productName: "",
        originalRiskRating: "low",
        adjustedRiskRating: "low",
        riskAdjustment: "",
        falsePositive: false,
        operationalRequirement: "",
        deviationRationale: "",
        comments: "",
        autoApprove: false,
        relatedRiskId: undefined as number | undefined
    });

    const handleAdd = async () => {
        if (!poamId) return;
        try {
            await addMutation.mutateAsync({
                clientId,
                poamId,
                ...newItem,
                originalDetectionDate: newItem.originalDetectionDate || undefined,
                scheduledCompletionDate: newItem.scheduledCompletionDate || undefined,
                statusDate: newItem.statusDate || undefined,
                lastVendorCheckinDate: newItem.lastVendorCheckinDate || undefined,
            });
            toast.success("POA&M item added");
            setIsAddOpen(false);
            setNewItem({
                weaknessName: "",
                weaknessDescription: "",
                controlId: "",
                pointOfContact: "",
                scheduledCompletionDate: "",
                weaknessDetectorSource: "",
                sourceIdentifier: "",
                assetIdentifier: "",
                resourcesRequired: "",
                overallRemediationPlan: "",
                originalDetectionDate: "",
                status: "open",
                statusDate: "",
                vendorDependency: "",
                lastVendorCheckinDate: "",
                productName: "",
                originalRiskRating: "low",
                adjustedRiskRating: "low",
                riskAdjustment: "",
                falsePositive: false,
                operationalRequirement: "",
                deviationRationale: "",
                comments: "",
                autoApprove: false,
                relatedRiskId: undefined
            });
            refetch();
        } catch (error) {
            toast.error("Failed to add item");
        }
    };


    if (isLoadingPoams) {
        return (
            <NISTLayout>
                <div className="flex h-[50vh] items-center justify-center">
                    <p className="text-muted-foreground">Loading POA&Ms...</p>
                </div>
            </NISTLayout>
        );
    }

    if (poams && poams.length === 0) {
        return (
            <NISTLayout>
                <div className="flex flex-col items-center justify-center h-[50vh] border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                        <Zap className="h-8 w-8 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Initialize POA&M</h2>
                    <p className="text-slate-500 max-w-md text-center mb-6">
                        No Plan of Action & Milestones document found. Initialize one to start tracking weaknesses and remediation efforts.
                    </p>
                    <div className="flex gap-3">
                        <Button onClick={() => createPoamMutation.mutate({ clientId, title: "NIST POA&M" })} disabled={createPoamMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                            {createPoamMutation.isPending ? "Initializing..." : "Create POA&M Document"}
                        </Button>
                    </div>
                </div>
            </NISTLayout>
        );
    }

    const items = poamData?.items || [];

    const filteredItems = items.filter(item => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery ||
            item.weaknessName?.toLowerCase().includes(query) ||
            item.weaknessDescription?.toLowerCase().includes(query) ||
            item.controlId?.toLowerCase().includes(query) ||
            item.sourceIdentifier?.toLowerCase().includes(query);

        const matchesStatus = !statusFilter || item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <NISTLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            {poams?.find(p => p.id === poamId)?.title || "Plan of Action & Milestones"}
                        </h1>
                        <p className="text-slate-500">Track and remediate security weaknesses identified during assessments.</p>
                    </div>
                    <div className="flex gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2 border-slate-200 font-bold h-11">
                                    Plans
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Available Plans</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {poams?.map(p => (
                                    <DropdownMenuItem key={p.id} onClick={() => setSelectedPoamId(p.id)} className="justify-between cursor-pointer">
                                        {p.title}
                                        {p.id === poamId && <CheckCircle2 className="h-3 w-3 text-blue-600" />}
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleCreatePlan} className="text-blue-600 font-bold cursor-pointer">
                                    <Plus className="h-4 w-4 mr-2" /> New POA&M Plan
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-700 font-bold gap-2 h-11 shadow-lg shadow-blue-100">
                                    <Plus className="h-4 w-4" /> New Weakness
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Add POA&M Weakness</DialogTitle>
                                    <DialogDescription>Record a new security weakness and its remediation plan.</DialogDescription>
                                </DialogHeader>
                                <Tabs defaultValue="identification" className="py-4">
                                    <TabsList className="grid w-full grid-cols-4">
                                        <TabsTrigger value="identification">ID</TabsTrigger>
                                        <TabsTrigger value="responsibility">Resp</TabsTrigger>
                                        <TabsTrigger value="remediation">Remed</TabsTrigger>
                                        <TabsTrigger value="risk">Risk</TabsTrigger>
                                    </TabsList>

                                    <ScrollArea className="h-[400px] pr-4 mt-4">
                                        <TabsContent value="identification" className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="font-bold">Weakness Name *</Label>
                                                <Input value={newItem.weaknessName} onChange={e => setNewItem({ ...newItem, weaknessName: e.target.value })} placeholder="e.g. MFA not enabled on VPN" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="font-bold">Control ID</Label>
                                                    <SearchableSelect
                                                        placeholder="Select Control"
                                                        value={newItem.controlId || ""}
                                                        onSelect={(val) => setNewItem({ ...newItem, controlId: val })}
                                                        options={clientControls?.map(cc => ({
                                                            label: `${cc.control?.controlId || cc.clientControl.clientControlId || 'Custom'}: ${cc.control?.name || ''}`,
                                                            value: cc.clientControl.id.toString()
                                                        })) || []}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="font-bold">Asset Identifier</Label>
                                                    <SearchableSelect
                                                        placeholder="Select Asset"
                                                        value={newItem.assetIdentifier || ""}
                                                        onSelect={(val) => setNewItem({ ...newItem, assetIdentifier: val })}
                                                        options={assetList?.map(a => ({
                                                            label: a.name,
                                                            value: a.id.toString()
                                                        })) || []}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="font-bold">Weakness Description</Label>
                                                <Textarea value={newItem.weaknessDescription} onChange={e => setNewItem({ ...newItem, weaknessDescription: e.target.value })} placeholder="Describe the deficiency..." />
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="responsibility" className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="font-bold">Point of Contact</Label>
                                                <SearchableSelect
                                                    placeholder="Select Point of Contact"
                                                    value={newItem.pointOfContact || ""}
                                                    onSelect={(val) => setNewItem({ ...newItem, pointOfContact: val })}
                                                    options={workspaceMembers?.map(u => ({
                                                        label: u.name,
                                                        value: u.name
                                                    })) || []}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="font-bold">Resources Required</Label>
                                                <Textarea value={newItem.resourcesRequired} onChange={e => setNewItem({ ...newItem, resourcesRequired: e.target.value })} placeholder="Budget, staff, tools..." />
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="remediation" className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="font-bold">Overall Remediation Plan</Label>
                                                <Textarea value={newItem.overallRemediationPlan} onChange={e => setNewItem({ ...newItem, overallRemediationPlan: e.target.value })} placeholder="Steps to fix..." />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="font-bold">Detection Date</Label>
                                                    <Input type="date" value={newItem.originalDetectionDate} onChange={e => setNewItem({ ...newItem, originalDetectionDate: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="font-bold">Completion Date</Label>
                                                    <Input type="date" value={newItem.scheduledCompletionDate} onChange={e => setNewItem({ ...newItem, scheduledCompletionDate: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="font-bold">Comments</Label>
                                                <Textarea value={newItem.comments} onChange={e => setNewItem({ ...newItem, comments: e.target.value })} placeholder="Additional notes..." />
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="risk" className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="font-bold">Original Risk</Label>
                                                    <Select value={newItem.originalRiskRating} onValueChange={v => setNewItem({ ...newItem, originalRiskRating: v })}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="low">Low</SelectItem>
                                                            <SelectItem value="moderate">Moderate</SelectItem>
                                                            <SelectItem value="high">High</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="font-bold">Adjusted Risk</Label>
                                                    <Select value={newItem.adjustedRiskRating} onValueChange={v => setNewItem({ ...newItem, adjustedRiskRating: v })}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="low">Low</SelectItem>
                                                            <SelectItem value="moderate">Moderate</SelectItem>
                                                            <SelectItem value="high">High</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </ScrollArea>
                                </Tabs>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                    <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">Add Item</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-amber-50 border-amber-200">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" /> Open Weaknesses
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-amber-700">{items.filter(i => i.status === 'open').length}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-emerald-50 border-emerald-200">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" /> Completed
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-emerald-700">{items.filter(i => i.status === 'closed').length}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-slate-200">
                    <CardHeader className="border-b bg-slate-50/50 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Remediation Roadmap</CardTitle>
                                <span className="text-xs text-slate-400 font-normal">(Double-click items to edit)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search..."
                                        className="pl-9 h-9 w-64 bg-white"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={`h-9 gap-2 font-bold ${statusFilter ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}`}
                                        >
                                            <Filter className="h-4 w-4" />
                                            {statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : "Filter Status"}
                                            {statusFilter && <ChevronDown className="h-3 w-3 opacity-50" />}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                                            {statusFilter === null && <Check className="h-3 w-3 mr-2" />}
                                            All Statuses
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setStatusFilter('open')}>
                                            {statusFilter === 'open' && <Check className="h-3 w-3 mr-2" />}
                                            Open
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setStatusFilter('closed')}>
                                            {statusFilter === 'closed' && <Check className="h-3 w-3 mr-2" />}
                                            Closed
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-slate-200">
                                    <TableHead className="w-[120px] font-bold text-slate-700">Control ID</TableHead>
                                    <TableHead className="font-bold text-slate-700">Weakness / Deficiency</TableHead>
                                    <TableHead className="font-bold text-slate-700">Point of Contact</TableHead>
                                    <TableHead className="font-bold text-slate-700">Scheduled Date</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                                            {items.length === 0
                                                ? "No POA&M items found. Start by recording a weakness."
                                                : "No items match your search criteria."}
                                        </TableCell>
                                    </TableRow>
                                ) : filteredItems.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        className="group border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
                                        onDoubleClick={() => handleRowDoubleClick(item)}
                                    >
                                        <TableCell className="font-mono text-xs font-bold text-blue-600">{item.controlId || "N/A"}</TableCell>
                                        <TableCell>
                                            <div className="max-w-md">
                                                <p className="font-bold text-slate-900 mb-0.5">{item.weaknessName}</p>
                                                <p className="text-xs text-slate-500 line-clamp-1 mb-1.5">{item.weaknessDescription || "No description provided."}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">{item.pointOfContact || "--"}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Calendar className="h-3.5 w-3.5 opacity-50" />
                                                {item.scheduledCompletionDate ? new Date(item.scheduledCompletionDate).toLocaleDateString() : "--"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={
                                                item.status === 'open' ? "bg-amber-100 text-amber-700" :
                                                    item.status === 'closed' ? "bg-emerald-100 text-emerald-700" :
                                                        "bg-slate-100 text-slate-700"
                                            }>
                                                {item.status?.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Edit POAM Item Dialog (Simplified) */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Item</DialogTitle>
                            <DialogDescription>
                                Update status and details.
                            </DialogDescription>
                        </DialogHeader>
                        {editingItem && (
                            <div className="space-y-4">
                                <div>
                                    <Label>Status</Label>
                                    <Select
                                        value={editingItem.status || "open"}
                                        onValueChange={(value) => setEditingItem({ ...editingItem, status: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Weakness Name</Label>
                                    <Input
                                        value={editingItem.weaknessName || ""}
                                        onChange={(e) => setEditingItem({ ...editingItem, weaknessName: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={() => updatePoamItem.mutate({
                                        clientId,
                                        poamId,
                                        itemId: editingItem.id,
                                        ...editingItem
                                    })}>Save Changes</Button>
                                </div>
                            </div>
                        )}

                    </DialogContent>
                </Dialog>
            </div>
        </NISTLayout>
    );
}
