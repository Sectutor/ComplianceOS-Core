
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Breadcrumb } from "@/components/Breadcrumb";
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@complianceos/ui/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@complianceos/ui/ui/command";
import {
    Plus,
    Search,
    Filter,
    Download,
    Calendar,
    User,
    AlertCircle,
    CheckCircle2,
    Clock,
    MoreVertical,
    Zap,
    ChevronDown,
    FileText,
    Trash2,
    ShieldAlert,
    Tool,
    Briefcase,
    CalendarCheck,
    RefreshCw,
    Check,
    ChevronsUpDown
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Switch } from "@complianceos/ui/ui/switch";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@complianceos/ui/ui/tooltip";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@complianceos/ui/ui/searchable-select";


export default function POAMTracker() {
    const params = useParams();
    const clientId = Number(params.id);

    // Using first POAM for MVP
    const { data: poams, refetch: refetchPoams, isLoading: isLoadingPoams } = trpc.federal.listPoams.useQuery({ clientId });

    // Plan Management State
    const [selectedPoamId, setSelectedPoamId] = useState<number | null>(null);

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

    const createPoam = trpc.federal.createPoam.useMutation({
        onSuccess: (data) => {
            toast.success("POA&M Created");
            refetchPoams();
            setSelectedPoamId(data.id);
        }
    });

    const handleCreatePlan = () => {
        const title = window.prompt("Enter a title for the new POA&M Plan:", `POA&M ${new Date().getFullYear()}`);
        if (title) {
            createPoam.mutate({ clientId, title });
        }
    };

    const importSample = trpc.federal.importSamplePoam.useMutation({
        onSuccess: (data) => {
            toast.success("Sample POA&M Imported");
            refetchPoams();
            setSelectedPoamId(data.id);
        },
        onError: () => {
            toast.error("Failed to import sample data");
        }
    });

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

    const handleImportSample = () => {
        importSample.mutate({ clientId });
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

    const exportMutation = trpc.federal.exportPoam.useMutation({
        onSuccess: (data) => {
            // Decode base64 and download
            const binaryString = window.atob(data.base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = data.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success("POA&M Exported Successfully");
        },
        onError: () => {
            toast.error("Failed to export POA&M");
        }
    });

    const handleExportPoam = () => {
        if (!poamId) return;
        exportMutation.mutate({ poamId, clientId });
    };

    if (isLoadingPoams) {
        return (
            <DashboardLayout>
                <div className="flex h-[50vh] items-center justify-center">
                    <p className="text-muted-foreground">Loading POA&Ms...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (poams && poams.length === 0) {
        return (
            <DashboardLayout>
                <div className="p-8 space-y-6 w-full">
                    <Breadcrumb items={[
                        { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                        { label: "Federal Hub", href: `/clients/${clientId}/federal` },
                        { label: "POA&M Tracker" }
                    ]} />
                    <div className="flex flex-col items-center justify-center h-[50vh] border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                            <Zap className="h-8 w-8 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Initialize POA&M</h2>
                        <p className="text-slate-500 max-w-md text-center mb-6">
                            No Plan of Action & Milestones document found. Initialize one to start tracking weaknesses and remediation efforts for NIST 800-171/CMMC.
                        </p>
                        <div className="flex gap-3">
                            <Button onClick={() => createPoam.mutate({ clientId, title: "Primary POA&M" })} disabled={createPoam.isPending} className="bg-blue-600 hover:bg-blue-700">
                                {createPoam.isPending ? "Initializing..." : "Create POA&M Document"}
                            </Button>
                            <Button onClick={handleImportSample} disabled={importSample.isPending} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                                <Zap className="h-4 w-4 mr-2" />
                                {importSample.isPending ? "Importing..." : "Load Sample Data"}
                            </Button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Filter & Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

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
        <DashboardLayout>
            <div className="p-8 space-y-6 w-full">
                <Breadcrumb items={[
                    { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                    { label: "Federal Hub", href: `/clients/${clientId}/federal` },
                    { label: "POA&M Tracker" }
                ]} />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            {poams?.find(p => p.id === poamId)?.title || "Plan of Action & Milestones"}
                        </h1>
                        <p className="text-slate-500">Track and remediate security weaknesses for NIST 800-171 compliance.</p>
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
                                <DropdownMenuItem onClick={handleImportSample} className="text-slate-600 cursor-pointer">
                                    <Zap className="h-4 w-4 mr-2 text-amber-500" /> Import Sample POA&M
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleCreatePlan} className="text-blue-600 font-bold cursor-pointer">
                                    <Plus className="h-4 w-4 mr-2" /> New POA&M Plan
                                </DropdownMenuItem>
                            </DropdownMenuContent>




                        </DropdownMenu>

                        <Button
                            variant="outline"
                            className="gap-2 border-slate-200 font-bold h-11"
                            onClick={() => handleExportPoam()}
                            disabled={exportMutation.isPending}
                        >
                            <Download className="h-4 w-4" />
                            {exportMutation.isPending ? "Generating..." : "Export DoD"}
                        </Button>
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
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="font-bold">Detector Source</Label>
                                                    <Input value={newItem.weaknessDetectorSource} onChange={e => setNewItem({ ...newItem, weaknessDetectorSource: e.target.value })} placeholder="e.g. Vulnerability Scan" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="font-bold">Source Identifier</Label>
                                                    <SearchableSelect
                                                        placeholder="Select Source (CVE/ID)"
                                                        value={newItem.sourceIdentifier || ""}
                                                        onSelect={(val) => setNewItem({ ...newItem, sourceIdentifier: val })}
                                                        options={vulnerabilities?.map(v => ({
                                                            label: v.name,
                                                            value: v.name
                                                        })) || []}
                                                    />
                                                </div>
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
                                            <div className="space-y-2">
                                                <Label className="font-bold">Product Name</Label>
                                                <Input value={newItem.productName} onChange={e => setNewItem({ ...newItem, productName: e.target.value })} placeholder="e.g. Cisco AnyConnect" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="font-bold">Vendor Dependency</Label>
                                                    <Input value={newItem.vendorDependency} onChange={e => setNewItem({ ...newItem, vendorDependency: e.target.value })} placeholder="e.g. Firmware Update" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="font-bold">Last Check-in</Label>
                                                    <Input type="date" value={newItem.lastVendorCheckinDate} onChange={e => setNewItem({ ...newItem, lastVendorCheckinDate: e.target.value })} />
                                                </div>
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
                                            <div className="space-y-2">
                                                <Label className="font-bold">Related Risk Assessment</Label>
                                                <SearchableSelect
                                                    placeholder="Select Related Risk"
                                                    value={newItem.relatedRiskId ? newItem.relatedRiskId.toString() : ""}
                                                    onSelect={(val) => setNewItem({ ...newItem, relatedRiskId: val ? Number(val) : undefined })}
                                                    options={risks?.map(r => ({
                                                        label: `${r.assessmentId}: ${r.title}`,
                                                        value: r.id.toString(),
                                                        description: `Inherent Risk: ${r.inherentRisk}`
                                                    })) || []}
                                                />
                                            </div>
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
                                            <div className="space-y-2">
                                                <Label className="font-bold">Risk Adjustment Rationale</Label>
                                                <Textarea value={newItem.riskAdjustment} onChange={e => setNewItem({ ...newItem, riskAdjustment: e.target.value })} placeholder="Why was the risk adjusted?" />
                                            </div>
                                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="space-y-0.5">
                                                    <Label className="font-bold text-sm">False Positive</Label>
                                                    <p className="text-xs text-muted-foreground">Is this a known false positive?</p>
                                                </div>
                                                <Switch checked={newItem.falsePositive} onCheckedChange={v => setNewItem({ ...newItem, falsePositive: v })} />
                                            </div>
                                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="space-y-0.5">
                                                    <Label className="font-bold text-sm">Auto Approve</Label>
                                                    <p className="text-xs text-muted-foreground">Automate closure upon verification?</p>
                                                </div>
                                                <Switch checked={newItem.autoApprove} onCheckedChange={v => setNewItem({ ...newItem, autoApprove: v })} />
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
                    <StatusCard label="Open Weaknesses" value={items.filter(i => i.status === 'open').length} icon={AlertCircle} color="text-amber-600" bg="bg-amber-50" />
                    <StatusCard label="Completed" value={items.filter(i => i.status === 'closed').length} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
                    <StatusCard label="Past Due" value={0} icon={Clock} color="text-rose-600" bg="bg-rose-50" />
                    <StatusCard label="Risk Accepted" value={0} icon={User} color="text-blue-600" bg="bg-blue-50" />
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
                                        placeholder="Search weaknesses, controls, or IDs..."
                                        className="pl-9 h-9 w-72 bg-white"
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
                                        <DropdownMenuItem onClick={() => setStatusFilter('risk_accepted')}>
                                            {statusFilter === 'risk_accepted' && <Check className="h-3 w-3 mr-2" />}
                                            Risk Accepted
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {statusFilter && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 px-2 text-slate-400 hover:text-slate-600"
                                        onClick={() => setStatusFilter(null)}
                                    >
                                        Clear
                                    </Button>
                                )}
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
                                        title="Double-click to edit"
                                    >
                                        <TableCell className="font-mono text-xs font-bold text-blue-600">{item.controlId || "N/A"}</TableCell>
                                        <TableCell>
                                            <div className="max-w-md">
                                                <p className="font-bold text-slate-900 mb-0.5">{item.weaknessName}</p>
                                                <p className="text-xs text-slate-500 line-clamp-1 mb-1.5">{item.weaknessDescription || "No description provided."}</p>
                                                <div className="flex gap-2">
                                                    <Badge variant="outline" className={`text-[10px] h-4 px-1 ${item.adjustedRiskRating === 'high' ? 'border-rose-200 text-rose-700 bg-rose-50' :
                                                        item.adjustedRiskRating === 'moderate' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                                                            'border-emerald-200 text-emerald-700 bg-emerald-50'
                                                        }`}>
                                                        {item.adjustedRiskRating?.toUpperCase() || 'LOW'} RISK
                                                    </Badge>
                                                    {item.falsePositive && (
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1 border-blue-200 text-blue-700 bg-blue-50">
                                                            FALSE POSITIVE
                                                        </Badge>
                                                    )}
                                                </div>
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

                {/* Edit POAM Item Dialog */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Edit POA&M Item</DialogTitle>
                            <DialogDescription>
                                Update the weakness details and remediation information.
                            </DialogDescription>
                        </DialogHeader>

                        {editingItem && (
                            <Tabs defaultValue="identification" className="py-4">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="identification">ID</TabsTrigger>
                                    <TabsTrigger value="responsibility">Resp</TabsTrigger>
                                    <TabsTrigger value="remediation">Remed</TabsTrigger>
                                    <TabsTrigger value="risk">Risk</TabsTrigger>
                                </TabsList>

                                <ScrollArea className="h-[450px] pr-4 mt-4">
                                    <TabsContent value="identification" className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="controlId">Control ID</Label>
                                                <SearchableSelect
                                                    placeholder="Select Control"
                                                    value={editingItem.controlId || ""}
                                                    onSelect={(val) => setEditingItem({ ...editingItem, controlId: val })}
                                                    options={clientControls?.map(cc => ({
                                                        label: `${cc.control?.controlId || cc.clientControl.clientControlId || 'Custom'}: ${cc.control?.name || ''}`,
                                                        value: cc.clientControl.id.toString()
                                                    })) || []}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="status">Status</Label>
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
                                                        <SelectItem value="risk_accepted">Risk Accepted</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="weaknessName">Weakness Name *</Label>
                                            <Input
                                                id="weaknessName"
                                                value={editingItem.weaknessName || ""}
                                                onChange={(e) => setEditingItem({ ...editingItem, weaknessName: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="weaknessDescription">Weakness Description</Label>
                                            <Textarea
                                                id="weaknessDescription"
                                                value={editingItem.weaknessDescription || ""}
                                                rows={3}
                                                onChange={(e) => setEditingItem({ ...editingItem, weaknessDescription: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Detector Source</Label>
                                                <Input
                                                    value={editingItem.weaknessDetectorSource || ""}
                                                    onChange={e => setEditingItem({ ...editingItem, weaknessDetectorSource: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Asset Identifier</Label>
                                                <SearchableSelect
                                                    placeholder="Select Asset"
                                                    value={editingItem.assetIdentifier || ""}
                                                    onSelect={(val) => setEditingItem({ ...editingItem, assetIdentifier: val })}
                                                    options={assetList?.map(a => ({
                                                        label: a.name,
                                                        value: a.id.toString()
                                                    })) || []}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Source Identifier</Label>
                                            <SearchableSelect
                                                placeholder="Select Source (CVE/ID)"
                                                value={editingItem.sourceIdentifier || ""}
                                                onSelect={(val) => setEditingItem({ ...editingItem, sourceIdentifier: val })}
                                                options={vulnerabilities?.map(v => ({
                                                    label: v.name,
                                                    value: v.name
                                                })) || []}
                                            />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="responsibility" className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Point of Contact</Label>
                                            <SearchableSelect
                                                placeholder="Select Point of Contact"
                                                value={editingItem.pointOfContact || ""}
                                                onSelect={(val) => setEditingItem({ ...editingItem, pointOfContact: val })}
                                                options={workspaceMembers?.map(u => ({
                                                    label: u.name,
                                                    value: u.name
                                                })) || []}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Resources Required</Label>
                                            <Textarea
                                                value={editingItem.resourcesRequired || ""}
                                                onChange={(e) => setEditingItem({ ...editingItem, resourcesRequired: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Product Name</Label>
                                            <Input
                                                value={editingItem.productName || ""}
                                                onChange={(e) => setEditingItem({ ...editingItem, productName: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Vendor Dependency</Label>
                                                <Input
                                                    value={editingItem.vendorDependency || ""}
                                                    onChange={(e) => setEditingItem({ ...editingItem, vendorDependency: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Last Check-in</Label>
                                                <Input
                                                    type="date"
                                                    value={editingItem.lastVendorCheckinDate ? new Date(editingItem.lastVendorCheckinDate).toISOString().split('T')[0] : ""}
                                                    onChange={(e) => setEditingItem({ ...editingItem, lastVendorCheckinDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="remediation" className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Overall Remediation Plan</Label>
                                            <Textarea
                                                value={editingItem.overallRemediationPlan || ""}
                                                rows={4}
                                                onChange={(e) => setEditingItem({ ...editingItem, overallRemediationPlan: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Detection Date</Label>
                                                <Input
                                                    type="date"
                                                    value={editingItem.originalDetectionDate ? new Date(editingItem.originalDetectionDate).toISOString().split('T')[0] : ""}
                                                    onChange={(e) => setEditingItem({ ...editingItem, originalDetectionDate: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Scheduled Completion</Label>
                                                <Input
                                                    type="date"
                                                    value={editingItem.scheduledCompletionDate ? new Date(editingItem.scheduledCompletionDate).toISOString().split('T')[0] : ""}
                                                    onChange={(e) => setEditingItem({ ...editingItem, scheduledCompletionDate: e.target.value || undefined })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Status Date</Label>
                                            <Input
                                                type="date"
                                                value={editingItem.statusDate ? new Date(editingItem.statusDate).toISOString().split('T')[0] : ""}
                                                onChange={(e) => setEditingItem({ ...editingItem, statusDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Comments</Label>
                                            <Textarea
                                                value={editingItem.comments || ""}
                                                onChange={(e) => setEditingItem({ ...editingItem, comments: e.target.value })}
                                            />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="risk" className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Related Risk Assessment</Label>
                                            <SearchableSelect
                                                placeholder="Select Related Risk"
                                                value={editingItem.relatedRiskId ? editingItem.relatedRiskId.toString() : ""}
                                                onSelect={(val) => setEditingItem({ ...editingItem, relatedRiskId: val ? Number(val) : undefined })}
                                                options={risks?.map(r => ({
                                                    label: `${r.assessmentId}: ${r.title}`,
                                                    value: r.id.toString(),
                                                    description: `Inherent Risk: ${r.inherentRisk}`
                                                })) || []}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Original Risk</Label>
                                                <Select
                                                    value={editingItem.originalRiskRating || "low"}
                                                    onValueChange={v => setEditingItem({ ...editingItem, originalRiskRating: v })}
                                                >
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="low">Low</SelectItem>
                                                        <SelectItem value="moderate">Moderate</SelectItem>
                                                        <SelectItem value="high">High</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Adjusted Risk</Label>
                                                <Select
                                                    value={editingItem.adjustedRiskRating || "low"}
                                                    onValueChange={v => setEditingItem({ ...editingItem, adjustedRiskRating: v })}
                                                >
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="low">Low</SelectItem>
                                                        <SelectItem value="moderate">Moderate</SelectItem>
                                                        <SelectItem value="high">High</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Risk Adjustment Rationale</Label>
                                            <Textarea
                                                value={editingItem.riskAdjustment || ""}
                                                onChange={e => setEditingItem({ ...editingItem, riskAdjustment: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="space-y-0.5">
                                                <Label className="font-bold text-sm">False Positive</Label>
                                                <p className="text-xs text-muted-foreground">Is this a known false positive?</p>
                                            </div>
                                            <Switch checked={editingItem.falsePositive} onCheckedChange={v => setEditingItem({ ...editingItem, falsePositive: v })} />
                                        </div>
                                        <div className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="space-y-0.5">
                                                <Label className="font-bold text-sm">Auto Approve</Label>
                                                <p className="text-xs text-muted-foreground">Automate closure upon verification?</p>
                                            </div>
                                            <Switch checked={editingItem.autoApprove} onCheckedChange={v => setEditingItem({ ...editingItem, autoApprove: v })} />
                                        </div>
                                    </TabsContent>
                                </ScrollArea>
                            </Tabs>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    if (!editingItem?.weaknessName) {
                                        toast.error("Weakness name is required");
                                        return;
                                    }
                                    updatePoamItem.mutate({
                                        clientId,
                                        id: editingItem.id,
                                        controlId: editingItem.controlId || undefined,
                                        weaknessName: editingItem.weaknessName,
                                        weaknessDescription: editingItem.weaknessDescription || undefined,
                                        weaknessDetectorSource: editingItem.weaknessDetectorSource || undefined,
                                        sourceIdentifier: editingItem.sourceIdentifier || undefined,
                                        assetIdentifier: editingItem.assetIdentifier || undefined,
                                        pointOfContact: editingItem.pointOfContact || undefined,
                                        resourcesRequired: editingItem.resourcesRequired || undefined,
                                        overallRemediationPlan: editingItem.overallRemediationPlan || undefined,
                                        originalDetectionDate: editingItem.originalDetectionDate || undefined,
                                        scheduledCompletionDate: editingItem.scheduledCompletionDate || undefined,
                                        status: editingItem.status || undefined,
                                        statusDate: editingItem.statusDate || undefined,
                                        vendorDependency: editingItem.vendorDependency || undefined,
                                        lastVendorCheckinDate: editingItem.lastVendorCheckinDate || undefined,
                                        productName: editingItem.productName || undefined,
                                        originalRiskRating: editingItem.originalRiskRating || undefined,
                                        adjustedRiskRating: editingItem.adjustedRiskRating || undefined,
                                        riskAdjustment: editingItem.riskAdjustment || undefined,
                                        falsePositive: editingItem.falsePositive || undefined,
                                        operationalRequirement: editingItem.operationalRequirement || undefined,
                                        deviationRationale: editingItem.deviationRationale || undefined,
                                        comments: editingItem.comments || undefined,
                                        autoApprove: editingItem.autoApprove || undefined,
                                        relatedRiskId: editingItem.relatedRiskId || undefined,
                                    });
                                }}
                                disabled={updatePoamItem.isPending}
                            >
                                {updatePoamItem.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout >
    );
}

function StatusCard({ label, value, icon: Icon, color, bg }: any) {
    return (
        <Card className="border-slate-200">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${bg}`}>
                        <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

