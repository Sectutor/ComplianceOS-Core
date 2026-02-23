import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    Shield,
    Search,
    Filter,
    CheckCircle2,
    ChevronRight,
    Save,
    Activity,
    FileText,
    Sparkles,
    Loader2
} from "lucide-react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@complianceos/ui/ui/dialog";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@complianceos/ui/ui/select";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { toast } from "sonner";
import NISTLayout from "./NISTLayout";

const NIST_FUNCTIONS = [
    { id: 'GV', name: 'Govern' },
    { id: 'ID', name: 'Identify' },
    { id: 'PR', name: 'Protect' },
    { id: 'DE', name: 'Detect' },
    { id: 'RS', name: 'Respond' },
    { id: 'RC', name: 'Recover' },
];

export default function NISTAssessment() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const utils = trpc.useUtils();

    // Read initial state from URL query parameters
    const queryParams = new URLSearchParams(window.location.search);
    const rawFunction = queryParams.get("function")?.toLowerCase();

    // Map URL function names to their IDs (e.g. 'recover' -> 'RC', 'govern' -> 'GV')
    let initialFunction = "all";
    if (rawFunction && rawFunction !== "all") {
        const foundFunc = NIST_FUNCTIONS.find(f =>
            f.id.toLowerCase() === rawFunction ||
            f.name.toLowerCase() === rawFunction
        );
        if (foundFunc) {
            initialFunction = foundFunc.id;
        }
    }

    const initialStatus = queryParams.get("status") || "all";
    const initialSearch = queryParams.get("search") || "";

    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [selectedFunction, setSelectedFunction] = useState<string>(initialFunction);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedControl, setSelectedControl] = useState<any>(null);

    // Filters
    const [showFilters, setShowFilters] = useState(initialStatus !== "all");
    const [statusFilter, setStatusFilter] = useState<string>(initialStatus);

    // Form State
    const [implementationStatus, setImplementationStatus] = useState("not_implemented");
    const [implementationNotes, setImplementationNotes] = useState("");
    const [complianceStatus, setComplianceStatus] = useState("not_implemented");

    // Queries
    const { data: controls, isLoading: loadingControls, refetch } = trpc.frameworks.getWorkProcessData.useQuery({
        clientId,
        frameworkId: 'NISTCSF'
    });

    const saveMutation = trpc.clientControls.update.useMutation({
        onSuccess: () => {
            toast.success("Assessment saved successfully");
            refetch();
            setIsDetailOpen(false);
        },
        onError: (err) => {
            toast.error(`Error saving assessment: ${err.message}`);
        }
    });

    const filteredControls = useMemo(() => {
        if (!controls) return [];

        return controls.filter((ctrl: any) => {
            const matchesSearch = ctrl.controlId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ctrl.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFunction = selectedFunction === "all" || ctrl.controlId.startsWith(selectedFunction);

            // Status Filter
            let matchesStatus = true;
            if (statusFilter !== "all") {
                const status = ctrl.status || "not_implemented";
                matchesStatus = status === statusFilter;
            }

            return matchesSearch && matchesFunction && matchesStatus;
        });
    }, [controls, searchQuery, selectedFunction, statusFilter]);

    const handleOpenDetail = (control: any) => {
        setSelectedControl(control);
        setImplementationStatus(control.status || "not_implemented");
        setImplementationNotes(control.implementationNotes || "");
        setComplianceStatus(control.status || "not_implemented");
        setIsDetailOpen(true);
    };

    const handleSave = () => {
        if (!selectedControl) return;

        saveMutation.mutate({
            clientId,
            id: selectedControl.id,
            status: implementationStatus as any,
            implementationNotes,
        });
    };

    const getStatusBadge = (control: any) => {
        const status = control.status || "not_implemented";

        switch (status) {
            case 'implemented':
                return <Badge className="bg-emerald-500 text-white border-none">Implemented</Badge>;
            case 'in_progress':
                return <Badge className="bg-amber-500 text-white border-none">In Progress</Badge>;
            case 'not_applicable':
                return <Badge className="bg-slate-400 text-white border-none">N/A</Badge>;
            default:
                return <Badge variant="outline" className="bg-slate-50 text-slate-400">Not Implemented</Badge>;
        }
    };

    return (
        <NISTLayout fullWidth>
            <div className="space-y-6 pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            <Shield className="w-8 h-8 text-blue-600" />
                            NIST CSF 2.0 Assessment
                        </h1>
                        <p className="text-slate-500 mt-1 uppercase text-xs font-bold tracking-widest">
                            Cybersecurity Framework Assessment
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Sidebar Filters */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/50 backdrop-blur-sm sticky top-6">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Functions</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[calc(100vh-250px)] px-4 pb-4">
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => setSelectedFunction("all")}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedFunction === "all"
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                                : "text-slate-600 hover:bg-slate-100"
                                                }`}
                                        >
                                            All Functions
                                        </button>
                                        {NIST_FUNCTIONS.map(func => (
                                            <button
                                                key={func.id}
                                                onClick={() => setSelectedFunction(func.id)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all group ${selectedFunction === func.id
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                                    : "text-slate-600 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>{func.id} - {func.name}</span>
                                                    {selectedFunction !== func.id && (
                                                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-3 space-y-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        className="pl-10 bg-slate-50 border-none rounded-xl focus-visible:ring-blue-500/20 transition-all font-medium"
                                        placeholder="Search controls by ID or name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant={showFilters ? "secondary" : "ghost"}
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="rounded-xl text-slate-500"
                                >
                                    <Filter className="w-4 h-4 mr-2" />
                                    More Filters
                                </Button>
                            </div>

                            {/* Additional Filters Area */}
                            {showFilters && (
                                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-400">Implementation Status</Label>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="bg-slate-50 border-none rounded-xl">
                                                <SelectValue placeholder="Filter by status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                <SelectItem value="implemented">Implemented</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="not_implemented">Not Implemented</SelectItem>
                                                <SelectItem value="not_applicable">Not Applicable</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {loadingControls ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                                <p className="font-medium animate-pulse">Loading NIST CSF 2.0 Controls...</p>
                            </div>
                        ) : filteredControls.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                                <Shield className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-900">No controls found</h3>
                                <p className="text-slate-500">Try adjusting your search or function filter.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredControls.map((control: any) => (
                                    <div
                                        key={control.id}
                                        onClick={() => handleOpenDetail(control)}
                                        className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-100 transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />

                                        <div className="flex items-start justify-between relative z-10">
                                            <div className="space-y-2 pr-12 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-black tracking-tight text-blue-600">{control.controlId}</span>
                                                    {getStatusBadge(control)}
                                                </div>
                                                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight text-sm leading-tight">
                                                    {control.name}
                                                </h3>
                                                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                                                    {control.description || "No description available"}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <Button size="icon" variant="ghost" className="rounded-full bg-slate-50 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                    <ChevronRight className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Control Detail Dialog */}
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden border-none rounded-[32px] shadow-2xl h-[90vh] flex flex-col">
                        <DialogHeader className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative shrink-0">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-bold uppercase tracking-widest text-blue-100">Control Assessment</span>
                            </div>
                            <DialogTitle className="text-3xl font-black tracking-tight">
                                {selectedControl?.controlId}: {selectedControl?.name}
                            </DialogTitle>
                            <DialogDescription className="text-blue-100 text-lg mt-2 leading-relaxed pr-8 max-h-[100px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
                                {selectedControl?.description}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto bg-slate-50">
                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            <Activity className="w-4 h-4" />
                                            Implementation Status
                                        </Label>
                                        <Select value={implementationStatus} onValueChange={setImplementationStatus}>
                                            <SelectTrigger className="rounded-2xl border-none shadow-sm h-12 bg-white font-medium">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-xl">
                                                <SelectItem value="implemented">Implemented</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="not_implemented">Not Implemented</SelectItem>
                                                <SelectItem value="not_applicable">Not Applicable</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Compliance Result
                                        </Label>
                                        <Select value={complianceStatus} onValueChange={setComplianceStatus}>
                                            <SelectTrigger className="rounded-2xl border-none shadow-sm h-12 bg-white font-medium">
                                                <SelectValue placeholder="Select result" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-xl">
                                                <SelectItem value="compliant">Compliant</SelectItem>
                                                <SelectItem value="partial">Partial</SelectItem>
                                                <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Implementation Description
                                    </Label>
                                    <Textarea
                                        className="min-h-[120px] rounded-3xl border-none shadow-sm bg-white p-6 focus-visible:ring-blue-500/20 text-slate-700 leading-relaxed"
                                        placeholder="Describe how this control is implemented in the system..."
                                        value={implementationNotes}
                                        onChange={(e) => setImplementationNotes(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Activity className="w-4 h-4" />
                                        Test Results & Assessment Observations
                                    </Label>
                                    <Textarea
                                        className="min-h-[120px] rounded-3xl border-none shadow-sm bg-white p-6 focus-visible:ring-blue-500/20 text-slate-700 leading-relaxed font-mono text-sm"
                                        placeholder="Enter artifacts, test dates, and observations..."
                                        value={implementationNotes}
                                        onChange={(e) => setImplementationNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-white border-t border-slate-100 flex items-center justify-between sm:justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" className="rounded-xl text-slate-400 hover:text-slate-600">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Related Risks
                                </Button>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="rounded-2xl px-6">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saveMutation.isPending}
                                    className="bg-blue-600 hover:bg-blue-700 rounded-2xl px-8 shadow-lg shadow-blue-200"
                                >
                                    {saveMutation.isPending ? "Saving..." : "Save Assessment"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </NISTLayout>
    );
}
