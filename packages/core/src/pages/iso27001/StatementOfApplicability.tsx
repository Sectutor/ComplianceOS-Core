import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { cn } from "@/lib/utils";
import {
    ChevronRight,
    Search,
    Filter,
    FileDown,
    CheckCircle2,
    Circle,
    XCircle,
    Info,
    LayoutGrid,
    List,
    Save,
    ExternalLink,
    AlertCircle,
    Loader2
} from "lucide-react";
import { Input } from "@complianceos/ui/ui/input";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter
} from "@complianceos/ui/ui/sheet";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@complianceos/ui/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Separator } from "@complianceos/ui/ui/separator";
import { Shield, Upload, FileText } from "lucide-react";
import { ISOLayout } from "./ISOLayout";

export default function StatementOfApplicability() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedControl, setSelectedControl] = useState<any | null>(null);

    // TRPC Queries & Mutations
    const { data: soaData, isLoading, refetch } = trpc.iso27001.getSoA.useQuery({ clientId }, {
        enabled: clientId > 0
    });

    const updateMutation = trpc.iso27001.updateSoA.useMutation({
        onSuccess: () => {
            refetch();
            setSelectedControl(null);
            toast.success("Control updated successfully");
        },
        onError: (err) => {
            toast.error(`Update failed: ${err.message}`);
        }
    });

    // Form State for Editing
    const [editForm, setEditForm] = useState({
        applicability: "applicable" as "applicable" | "not_applicable",
        justification: "",
        status: "not_implemented" as any,
        implementationNotes: ""
    });

    const handleEdit = (item: any) => {
        setSelectedControl(item);
        setEditForm({
            applicability: (item.clientControl.applicability || "applicable") as any,
            justification: item.clientControl.justification || "",
            status: item.clientControl.status || "not_implemented",
            implementationNotes: item.clientControl.implementationNotes || ""
        });
    };

    const handleSave = () => {
        if (!selectedControl) return;

        // Validation: justification required for not_applicable
        if (editForm.applicability === "not_applicable" && !editForm.justification) {
            toast.error("Justification is required for excluded controls");
            return;
        }

        updateMutation.mutate({
            clientId,
            controlId: selectedControl.clientControl.id,
            ...editForm,
            status: editForm.applicability === 'not_applicable' ? 'not_applicable' : editForm.status
        });
    };

    const categories = ["Organizational Controls", "People Controls", "Physical Controls", "Technological Controls"];

    const filteredControls = useMemo(() => {
        if (!soaData) return [];
        return soaData.filter((item: any) =>
            item.control.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.control.controlId.includes(searchQuery) ||
            item.control.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [soaData, searchQuery]);

    const stats = useMemo(() => {
        if (!soaData) return { total: 0, applicable: 0, implemented: 0, excluded: 0 };
        return {
            total: soaData.length,
            applicable: soaData.filter((item: any) => item.clientControl.applicability !== 'not_applicable').length,
            implemented: soaData.filter((item: any) => item.clientControl.status === 'implemented').length,
            excluded: soaData.filter((item: any) => item.clientControl.applicability === 'not_applicable').length
        };
    }, [soaData]);

    const getStatusUI = (status: string, applicability: string) => {
        if (applicability === 'not_applicable') {
            return {
                label: "Excluded",
                icon: <XCircle className="h-4 w-4 text-slate-400" />,
                color: "bg-slate-50 text-slate-600 border-slate-200"
            };
        }
        switch (status) {
            case "implemented": return {
                label: "Implemented",
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
                color: "bg-emerald-50 text-emerald-700 border-emerald-200"
            };
            case "in_progress": return {
                label: "In Progress",
                icon: <Circle className="h-4 w-4 text-amber-500 fill-amber-500/20" />,
                color: "bg-amber-50 text-amber-700 border-amber-200"
            };
            default: return {
                label: "Not Started",
                icon: <Circle className="h-4 w-4 text-slate-200" />,
                color: "bg-white text-slate-400 border-slate-200"
            };
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-medium">Initializing Statement of Applicability...</p>
            </div>
        );
    }

    return (
        <ISOLayout clientId={clientId} fullWidth={true}>
            <div className="p-0 space-y-8 animate-in fade-in duration-500">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Statement of Applicability</h1>
                        <p className="text-lg text-slate-500 max-w-2xl">
                            Identify and justify the Annex A controls applicable to your ISMS scope as per ISO 27001:2022.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="h-11 px-4 border-slate-200 shadow-sm hover:bg-white">
                            <FileDown className="mr-2 h-4 w-4" /> Export SoA
                        </Button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: "Total Controls", value: stats.total, color: "text-slate-900" },
                        { label: "Applicable", value: stats.applicable, color: "text-indigo-600" },
                        { label: "Implemented", value: stats.implemented, color: "text-emerald-600" },
                        { label: "Excluded", value: stats.excluded, color: "text-slate-500" }
                    ].map((stat, i) => (
                        <Card key={i} className="border-none shadow-sm bg-white/50 backdrop-blur-sm group hover:shadow-md transition-all duration-300">
                            <CardContent className="p-6">
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                                <p className={cn("text-3xl font-bold mt-2", stat.color)}>{stat.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Controls Content */}
                <Card className="border-none shadow-lg overflow-hidden bg-white/80 backdrop-blur-md">
                    <CardHeader className="border-b border-slate-100 bg-white/50 p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search controls by ID, title, or description..."
                                    className="pl-10 h-10 border-slate-200 focus:ring-indigo-500 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center bg-slate-100/80 p-1 rounded-lg">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setViewMode("list")}
                                        className={cn("h-8 w-8 p-0 rounded-md", viewMode === 'list' && "bg-white shadow-sm text-indigo-600")}
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setViewMode("grid")}
                                        className={cn("h-8 w-8 p-0 rounded-md", viewMode === 'grid' && "bg-white shadow-sm text-indigo-600")}
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {filteredControls.map((item: any) => {
                                const ui = getStatusUI(item.clientControl.status, item.clientControl.applicability);
                                return (
                                    <div
                                        key={item.clientControl.id}
                                        className="group hover:bg-slate-50/50 transition-colors cursor-pointer p-6"
                                        onClick={() => handleEdit(item)}
                                    >
                                        <div className="flex items-start justify-between gap-6">
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded">
                                                        Annex A {item.control.controlId}
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px] uppercase tracking-tighter font-semibold border-slate-200 text-slate-500">
                                                        {item.control.category}
                                                    </Badge>
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                                    {item.control.name}
                                                </h3>
                                                <p className="text-slate-500 line-clamp-2 text-sm leading-relaxed max-w-3xl">
                                                    {item.control.description}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-3">
                                                <Badge className={cn("px-2.5 py-1 flex items-center gap-1.5 border shadow-none", ui.color)}>
                                                    {ui.icon}
                                                    {ui.label}
                                                </Badge>
                                                <div className="flex items-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                                                    <span className="text-xs font-medium mr-1 opacity-0 group-hover:opacity-100 transition-opacity">Edit Details</span>
                                                    <ChevronRight className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Drawer */}
                <Sheet open={!!selectedControl} onOpenChange={() => setSelectedControl(null)}>
                    <SheetContent className="sm:max-w-xl md:max-w-2xl overflow-y-auto">
                        <SheetHeader className="pb-6 border-b">
                            <SheetTitle className="text-2xl font-bold flex items-center gap-3 text-slate-900">
                                <span className="font-mono text-sm px-2 py-1 bg-slate-100 rounded text-slate-500">
                                    {selectedControl?.control.controlId}
                                </span>
                                Edit Control Details
                            </SheetTitle>
                            <SheetDescription className="text-slate-500 pt-2">
                                {selectedControl?.control.name}
                            </SheetDescription>
                        </SheetHeader>

                        <Tabs defaultValue="details" className="flex-1 mt-6">
                            <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1">
                                <TabsTrigger value="details" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">details</TabsTrigger>
                                <TabsTrigger value="evidence" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Evidence</TabsTrigger>
                            </TabsList>

                            <TabsContent value="details" className="py-4 space-y-6">
                                {/* Control Info Container */}
                                <div className="p-4 rounded-xl bg-slate-50 space-y-3">
                                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Info className="h-4 w-4" /> Description
                                    </h4>
                                    <p className="text-sm text-slate-600 leading-relaxed italic">
                                        "{selectedControl?.control.description}"
                                    </p>
                                </div>

                                {/* Applicability Toggle */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-slate-700">Applicability Context</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            type="button"
                                            variant={editForm.applicability === 'applicable' ? 'default' : 'outline'}
                                            className={cn(
                                                "h-12 border-slate-200",
                                                editForm.applicability === 'applicable' && "bg-indigo-600 hover:bg-indigo-700"
                                            )}
                                            onClick={() => setEditForm(prev => ({ ...prev, applicability: 'applicable' }))}
                                        >
                                            Applicable
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={editForm.applicability === 'not_applicable' ? 'default' : 'outline'}
                                            className={cn(
                                                "h-12 border-slate-200",
                                                editForm.applicability === 'not_applicable' && "bg-slate-700 hover:bg-slate-800"
                                            )}
                                            onClick={() => setEditForm(prev => ({ ...prev, applicability: 'not_applicable' }))}
                                        >
                                            Excluded
                                        </Button>
                                    </div>
                                </div>

                                {/* Implementation Status */}
                                {editForm.applicability === 'applicable' && (
                                    <div className="space-y-3">
                                        <Label className="text-sm font-bold text-slate-700">Implementation Maturity</Label>
                                        <Select
                                            value={editForm.status}
                                            onValueChange={(val) => setEditForm(prev => ({ ...prev, status: val }))}
                                        >
                                            <SelectTrigger className="h-12 border-slate-200">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="not_implemented">Not Started</SelectItem>
                                                <SelectItem value="in_progress">Partial / In Progress</SelectItem>
                                                <SelectItem value="implemented">Fully Implemented</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Justification / Notes */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-slate-700">
                                        {editForm.applicability === 'not_applicable' ? 'Exclusion Justification' : 'Justification & Gap Assessment'}
                                        <span className="text-rose-500 ml-1 font-normal">* required for exclusions</span>
                                    </Label>
                                    <Textarea
                                        placeholder={editForm.applicability === 'not_applicable' ?
                                            "Provide the business reason why this control is not applicable (e.g., 'Organization does not manage its own data center')..." :
                                            "Describe how this control is applied or relevant to your business context..."
                                        }
                                        className="min-h-[120px] border-slate-200 focus:ring-indigo-500"
                                        value={editForm.justification}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, justification: e.target.value }))}
                                    />
                                </div>

                                {/* Implementation Notes */}
                                {editForm.applicability === 'applicable' && (
                                    <div className="space-y-3">
                                        <Label className="text-sm font-bold text-slate-700">Operational Notes</Label>
                                        <Textarea
                                            placeholder="Internal notes on configuration, owners, or recurring actions..."
                                            className="min-h-[100px] border-slate-200 focus:ring-indigo-500"
                                            value={editForm.implementationNotes}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, implementationNotes: e.target.value }))}
                                        />
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="evidence" className="py-4 space-y-6">
                                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                    <Shield className="h-12 w-12 text-slate-300 mb-3" />
                                    <h3 className="text-sm font-semibold text-slate-700">No Evidence Linked</h3>
                                    <p className="text-xs text-slate-500 text-center max-w-[250px] mb-4">
                                        Link verified evidence from the Audit Hub to demonstrate this control is operating effectively.
                                    </p>
                                    <Button size="sm" variant="outline" className="gap-2">
                                        <Upload className="h-3.5 w-3.5" /> Link Evidence
                                    </Button>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-slate-900">Recommended Evidence</h4>
                                    <ScrollArea className="h-[200px]">
                                        <div className="space-y-3">
                                            {[1, 2, 3].map((_, i) => (
                                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:border-indigo-100 cursor-pointer">
                                                    <div className="p-2 bg-slate-50 rounded text-slate-400">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-slate-700">Access Control Policy (v1.2).pdf</p>
                                                        <p className="text-[10px] text-slate-400">Uploaded on May 12, 2025</p>
                                                    </div>
                                                    <Button size="sm" variant="ghost" className="ml-auto h-6 w-6 p-0">
                                                        <Upload className="h-3 w-3 text-slate-400" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <SheetFooter className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t z-20">
                            <div className="flex items-center justify-between w-full">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedControl(null)}
                                    className="h-10 px-6 border-slate-200"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={updateMutation.isLoading}
                                    className="h-10 px-8 bg-indigo-600 hover:bg-indigo-700 shadow-sm min-w-[140px]"
                                >
                                    {updateMutation.isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" /> Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>
        </ISOLayout>
    );
}
