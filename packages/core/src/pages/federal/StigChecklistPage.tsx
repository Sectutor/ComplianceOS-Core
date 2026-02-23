
import React, { useState, useMemo } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import {
    Shield,
    ArrowLeft,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    MinusCircle,
    AlertTriangle,
    Plus,
    FileText,
    ChevronDown,
    ChevronUp,
    Target
} from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@complianceos/ui/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@complianceos/ui/ui/select";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Separator } from "@complianceos/ui/ui/separator";

export default function StigChecklistPage() {
    const { id, checklistId } = useParams<{ id: string; checklistId: string }>();
    const clientId = parseInt(id || "0");
    const cId = parseInt(checklistId || "0");
    const utils = trpc.useUtils();

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [expandedItem, setExpandedItem] = useState<number | null>(null);

    // Create Item State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newItem, setNewItem] = useState({
        ruleId: "",
        title: "",
        severity: "medium",
        description: ""
    });

    const { data: checklist } = trpc.federal.getDisaStigChecklist.useQuery({ clientId, id: cId });
    const { data: items, isLoading } = trpc.federal.listDisaStigItems.useQuery({ checklistId: cId });

    const createItemMutation = trpc.federal.createDisaStigItem.useMutation({
        onSuccess: () => {
            toast.success("Rule added successfully");
            setIsCreateOpen(false);
            utils.federal.listDisaStigItems.invalidate({ checklistId: cId });
            setNewItem({ ruleId: "", title: "", severity: "medium", description: "" });
        },
        onError: (err) => {
            toast.error("Failed to add rule: " + err.message);
        }
    });

    const updateItemMutation = trpc.federal.updateDisaStigItem.useMutation({
        onSuccess: () => {
            toast.success("Rule updated");
            utils.federal.listDisaStigItems.invalidate({ checklistId: cId });
        },
        onError: (err) => {
            toast.error("Failed to update rule: " + err.message);
        }
    });

    const handleCreate = () => {
        if (!newItem.ruleId || !newItem.title) {
            toast.error("Rule ID and Title are required");
            return;
        }
        createItemMutation.mutate({
            checklistId: cId,
            ...newItem
        });
    };

    const handleStatusUpdate = (itemId: number, status: string, comments?: string) => {
        updateItemMutation.mutate({
            id: itemId,
            status,
            comments
        });
    };

    const filteredItems = useMemo(() => {
        if (!items) return [];
        return items.filter((item: any) => {
            const matchesSearch = 
                item.ruleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "all" || item.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [items, searchQuery, statusFilter]);

    const stats = useMemo(() => {
        if (!items) return { open: 0, notAFinding: 0, notApplicable: 0, total: 0 };
        return {
            open: items.filter((i: any) => i.status === 'Open').length,
            notAFinding: items.filter((i: any) => i.status === 'Not a Finding').length,
            notApplicable: items.filter((i: any) => i.status === 'Not Applicable').length,
            total: items.length
        };
    }, [items]);

    const complianceScore = useMemo(() => {
        if (stats.total === 0) return 0;
        // Simple calculation: (Not a Finding + N/A) / Total
        const compliantCount = stats.notAFinding + stats.notApplicable;
        return Math.round((compliantCount / stats.total) * 100);
    }, [stats]);

    if (!checklist) return null;

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8 w-full">
                <Breadcrumb items={[
                    { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                    { label: "Federal Compliance", href: `/clients/${clientId}/federal` },
                    { label: "DISA STIGs", href: `/clients/${clientId}/federal/stigs` },
                    { label: checklist.title }
                ]} />

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                {checklist.title}
                            </h1>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {checklist.category || "General"}
                            </Badge>
                        </div>
                        <p className="text-slate-500 text-lg flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Target: <span className="font-bold text-slate-700">{checklist.assetIdentifier || "Unassigned"}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                         <Link href={`/clients/${clientId}/federal/stigs`}>
                            <Button variant="ghost" className="rounded-xl gap-2 text-slate-500 hover:text-slate-900">
                                <ArrowLeft className="w-4 h-4" />
                                Back to List
                            </Button>
                        </Link>
                        <Button 
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-lg shadow-blue-200"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Rule
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="rounded-2xl border-none shadow-sm bg-white p-6 flex items-center gap-4">
                        <div className="p-3 bg-slate-100 rounded-xl">
                            <Shield className="h-8 w-8 text-slate-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Compliance</p>
                            <p className={`text-3xl font-black ${complianceScore >= 90 ? 'text-emerald-600' : complianceScore >= 70 ? 'text-amber-500' : 'text-rose-600'}`}>
                                {complianceScore}%
                            </p>
                        </div>
                    </Card>
                    <Card className="rounded-2xl border-none shadow-sm bg-white p-6 flex items-center gap-4">
                        <div className="p-3 bg-rose-50 rounded-xl">
                            <XCircle className="h-8 w-8 text-rose-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Open Findings</p>
                            <p className="text-3xl font-black text-slate-900">{stats.open}</p>
                        </div>
                    </Card>
                    <Card className="rounded-2xl border-none shadow-sm bg-white p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Not a Finding</p>
                            <p className="text-3xl font-black text-slate-900">{stats.notAFinding}</p>
                        </div>
                    </Card>
                    <Card className="rounded-2xl border-none shadow-sm bg-white p-6 flex items-center gap-4">
                        <div className="p-3 bg-slate-50 rounded-xl">
                            <MinusCircle className="h-8 w-8 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">N/A</p>
                            <p className="text-3xl font-black text-slate-900">{stats.notApplicable}</p>
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            className="pl-10 bg-slate-50 border-none rounded-xl focus-visible:ring-blue-500/20 transition-all font-medium"
                            placeholder="Search rules by ID or title..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-[200px] bg-slate-50 border-none rounded-xl">
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Open">Open</SelectItem>
                                <SelectItem value="Not a Finding">Not a Finding</SelectItem>
                                <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Checklist Items */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-12">Loading checklist items...</div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                            <Shield className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-slate-900">No items found</h3>
                            <p className="text-slate-500">Try adjusting your filters or add a new rule.</p>
                        </div>
                    ) : (
                        filteredItems.map((item: any) => (
                            <Card 
                                key={item.id} 
                                className={`rounded-2xl border-none shadow-sm transition-all duration-300 ${
                                    expandedItem === item.id ? 'ring-2 ring-blue-500/20 shadow-lg' : 'hover:shadow-md'
                                }`}
                            >
                                <div 
                                    className="p-6 cursor-pointer"
                                    onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`mt-1 p-2 rounded-lg shrink-0 ${
                                                item.status === 'Open' ? 'bg-rose-50 text-rose-600' :
                                                item.status === 'Not a Finding' ? 'bg-emerald-50 text-emerald-600' :
                                                'bg-slate-100 text-slate-500'
                                            }`}>
                                                {item.status === 'Open' ? <AlertTriangle className="w-5 h-5" /> :
                                                 item.status === 'Not a Finding' ? <CheckCircle2 className="w-5 h-5" /> :
                                                 <MinusCircle className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono font-bold text-slate-500 text-sm">{item.ruleId}</span>
                                                    {item.severity && (
                                                        <Badge variant="outline" className={`
                                                            ${item.severity.toLowerCase() === 'high' ? 'text-rose-600 border-rose-200 bg-rose-50' : 
                                                              item.severity.toLowerCase() === 'medium' ? 'text-amber-600 border-amber-200 bg-amber-50' : 
                                                              'text-blue-600 border-blue-200 bg-blue-50'}
                                                        `}>
                                                            {item.severity.toUpperCase()}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge className={`text-sm px-3 py-1 font-bold ${
                                                item.status === 'Open' ? 'bg-rose-500 hover:bg-rose-600' :
                                                item.status === 'Not a Finding' ? 'bg-emerald-500 hover:bg-emerald-600' :
                                                'bg-slate-500 hover:bg-slate-600'
                                            }`}>
                                                {item.status}
                                            </Badge>
                                            {expandedItem === item.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                                        </div>
                                    </div>
                                </div>

                                {expandedItem === item.id && (
                                    <>
                                        <Separator />
                                        <div className="p-6 bg-slate-50/50 rounded-b-2xl animate-in slide-in-from-top-2">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                <div className="space-y-6">
                                                    <div>
                                                        <h4 className="text-sm font-bold uppercase text-slate-400 mb-2">Rule Description</h4>
                                                        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                                                            {item.description || "No description provided."}
                                                        </p>
                                                    </div>
                                                    {item.checkText && (
                                                        <div>
                                                            <h4 className="text-sm font-bold uppercase text-slate-400 mb-2">Check Text</h4>
                                                            <div className="bg-slate-100 p-4 rounded-xl text-sm font-mono text-slate-600 whitespace-pre-wrap">
                                                                {item.checkText}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {item.fixText && (
                                                        <div>
                                                            <h4 className="text-sm font-bold uppercase text-slate-400 mb-2">Fix Text</h4>
                                                            <div className="bg-slate-100 p-4 rounded-xl text-sm font-mono text-slate-600 whitespace-pre-wrap">
                                                                {item.fixText}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-sm h-fit">
                                                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                                        <Activity className="w-4 h-4 text-blue-500" />
                                                        Assessment Finding
                                                    </h4>
                                                    
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold uppercase text-slate-500">Status</Label>
                                                        <Select 
                                                            value={item.status || "Open"} 
                                                            onValueChange={(val) => handleStatusUpdate(item.id, val, item.comments)}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Open">Open (Finding)</SelectItem>
                                                                <SelectItem value="Not a Finding">Not a Finding (Compliant)</SelectItem>
                                                                <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold uppercase text-slate-500">Comments / Evidence</Label>
                                                        <Textarea 
                                                            className="min-h-[100px] resize-none bg-slate-50"
                                                            placeholder="Enter comments or evidence..."
                                                            defaultValue={item.comments || ""}
                                                            onBlur={(e) => handleStatusUpdate(item.id, item.status, e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </Card>
                        ))
                    )}
                </div>

                {/* Create Item Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="sm:max-w-[600px] rounded-3xl p-8">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Add STIG Rule</DialogTitle>
                            <DialogDescription>
                                Manually add a rule to this checklist.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ruleId" className="font-bold text-slate-700">Rule ID (SV-XXXX)</Label>
                                    <Input
                                        id="ruleId"
                                        placeholder="SV-12345r1"
                                        value={newItem.ruleId}
                                        onChange={(e) => setNewItem({ ...newItem, ruleId: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="severity" className="font-bold text-slate-700">Severity</Label>
                                    <Select 
                                        value={newItem.severity} 
                                        onValueChange={(val) => setNewItem({ ...newItem, severity: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="high">High (CAT I)</SelectItem>
                                            <SelectItem value="medium">Medium (CAT II)</SelectItem>
                                            <SelectItem value="low">Low (CAT III)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ruleTitle" className="font-bold text-slate-700">Rule Title</Label>
                                <Input
                                    id="ruleTitle"
                                    placeholder="System must..."
                                    value={newItem.title}
                                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ruleDesc" className="font-bold text-slate-700">Description</Label>
                                <Textarea
                                    id="ruleDesc"
                                    placeholder="Enter rule discussion..."
                                    className="min-h-[100px]"
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreate}
                                disabled={createItemMutation.isLoading}
                                className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold"
                            >
                                {createItemMutation.isLoading ? "Adding..." : "Add Rule"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
