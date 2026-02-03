
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Label } from "@complianceos/ui/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@complianceos/ui/ui/table";
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@complianceos/ui/ui/tabs";
import {
    ScrollText,
    Printer,
    Download,
    CheckCircle,
    AlertTriangle,
    Activity,
    ArrowLeft,
    Plus,
    Loader2,
    Save,
    Search,
    Edit2,
    ShieldAlert,
    RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { SearchableSelect } from "@complianceos/ui/ui/searchable-select";

export default function SARViewer() {
    const params = useParams();
    const clientId = Number(params.id);
    const location = window.location;
    // Robust detection: Check path for 172, otherwise default to 171 (since DB has 171)
    const is172 = location.pathname.includes('sar-172') || location.pathname.includes('172');

    // Default to sar-171/NIST 800-171 if not explicitly 172
    const frameworkSlug = is172 ? 'sar-172' : 'sar-171';
    const frameworkLabel = is172 ? 'NIST 800-172' : 'NIST 800-171';
    const frameworkKey = is172 ? 'NIST 800-172' : 'NIST 800-171';

    useEffect(() => {
        console.log(`[SAR] Resolved Framework: ${frameworkKey} (path: ${location.pathname})`);
    }, [frameworkKey, location.pathname]);

    const { data: sars, isLoading: loadingSARs, refetch: refetchSARs } = trpc.federal.listSARs.useQuery({ clientId });
    const { data: workspaceMembers } = trpc.users.listWorkspaceMembers.useQuery({ clientId });
    const { data: risks } = trpc.risks.getAll.useQuery({ clientId });
    const { data: clientControls } = trpc.clientControls.list.useQuery({ clientId });

    // Diagnostic logging
    useEffect(() => {
        console.log('[SAR Diagnostics] Framework Key:', frameworkKey);
        console.log('[SAR Diagnostics] Client Controls:', clientControls?.length || 0, 'controls loaded');

        if (clientControls) {
            const frameworks = Array.from(new Set(clientControls.map(cc => cc.control?.framework))).filter(Boolean);
            console.log('[SAR Diagnostics] Available Frameworks:', frameworks);
        }

        console.log('[SAR Diagnostics] Workspace Members:', workspaceMembers?.length || 0, 'members loaded');
        console.log('[SAR Diagnostics] Risks:', risks?.length || 0, 'risks loaded');
    }, [clientControls, workspaceMembers, risks, frameworkKey]);

    const createSAR = trpc.federal.createSAR.useMutation();
    const updateSAR = trpc.federal.updateSAR.useMutation();
    const saveFindingMutation = trpc.federal.saveSarFinding.useMutation();

    // Find the SAR matching this framework (or use first one)
    const sar = sars?.find(s => s.title?.includes(frameworkSlug === 'sar-171' ? '171' : '172')) || sars?.[0];
    const sarId = sar?.id;

    const { data: findings, refetch: refetchFindings } = trpc.federal.getSarFindings.useQuery(
        { sarId: sarId!, clientId },
        { enabled: !!sarId }
    );

    // State for Header Editing
    const [headerData, setHeaderData] = useState<any>({});
    const [isHeaderDirty, setIsHeaderDirty] = useState(false);

    useEffect(() => {
        if (sar) {
            setHeaderData({
                systemAcronym: sar.systemAcronym || "",
                systemIdentification: sar.systemIdentification || "",
                systemType: sar.systemType || "",
                version: sar.version || "",
                agency: sar.agency || "",
                assessmentCompletionDate: sar.assessmentCompletionDate ? new Date(sar.assessmentCompletionDate).toISOString().split('T')[0] : "",
                systemOwnerId: sar.systemOwnerId,
                confidentiality: sar.confidentiality || "Moderate",
                integrity: sar.integrity || "Moderate",
                availability: sar.availability || "Moderate",
                impact: sar.impact || "Moderate",
                packageType: sar.packageType || "",
                executiveSummary: sar.executiveSummary || "",
                assessorName: sar.assessorName || "",
            });
        }
    }, [sar]);

    // Filter controls for the dropdown
    const filteredControlOptions = React.useMemo(() => {
        if (!clientControls) {
            console.log('[SAR Filter] clientControls is null/undefined');
            return [];
        }

        console.log('[SAR Filter Debug] Total Controls:', clientControls.length);
        console.log('[SAR Filter Debug] Target Framework:', frameworkKey);
        console.log('[SAR Filter Debug] Framework Slug:', frameworkSlug);

        // Sample first 3 controls to see their frameworks
        if (clientControls.length > 0) {
            console.log('[SAR Filter Debug] Sample controls:',
                clientControls.slice(0, 3).map(cc => ({
                    id: cc.control?.controlId,
                    framework: cc.control?.framework
                }))
            );
        }

        const filtered = clientControls.filter(cc => {
            const fw = cc.control?.framework;

            // Match any NIST framework (be permissive)
            const isNIST = fw?.includes('NIST') || fw?.includes('800-171') || fw?.includes('800-172');

            return isNIST;
        }).map(cc => ({
            label: `${cc.control?.controlId || 'Custom'}: ${cc.control?.name}`,
            value: cc.control?.controlId || String(cc.clientControl.id),
            description: cc.control?.description?.substring(0, 50) + '...'
        }));

        console.log('[SAR Filter Debug] Filtered Count:', filtered.length);
        return filtered;
    }, [clientControls, frameworkKey, frameworkSlug]);

    useEffect(() => {
        console.log('[SAR Filter Debug] Final Filtered Count:', filteredControlOptions.length);
    }, [filteredControlOptions.length]);

    const handleHeaderSave = async () => {
        if (!sarId) return;
        try {
            await updateSAR.mutateAsync({
                clientId,
                id: sarId,
                ...headerData,
                systemOwnerId: headerData.systemOwnerId ? Number(headerData.systemOwnerId) : undefined,
                assessmentCompletionDate: headerData.assessmentCompletionDate || undefined
            });
            toast.success("SAR Header updated successfully.");
            setIsHeaderDirty(false);
            refetchSARs();
        } catch (e: any) {
            toast.error(`Failed to update header: ${e.message}`);
        }
    };

    // Finding State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingFinding, setEditingFinding] = useState<any>(null); // If null, mode is ADD

    const resetFindingForm = () => {
        setEditingFinding({
            controlId: "",
            overlay: "",
            result: "other_than_satisfied",
            naJustification: "",
            vulnerabilitySummary: "",
            vulnerabilitySeverity: "low",
            residualRiskLevel: "low",
            recommendations: "",
            observation: ""
        });
    };

    const openAddDialog = () => {
        resetFindingForm();
        setEditingFinding(null); // Explicitly null for add
        setIsAddOpen(true);
    };

    const openEditDialog = (finding: any) => {
        setEditingFinding({ ...finding });
        setIsAddOpen(true);
    };

    const handleSaveFinding = async () => {
        if (!sarId) return;
        const data = editingFinding || {};
        if (!data.controlId) {
            toast.error("Control ID is required.");
            return;
        }

        try {
            await saveFindingMutation.mutateAsync({
                clientId,
                sarId,
                ...data,
                // Ensure defaults
                result: data.result || "other_than_satisfied",
                riskLevel: data.riskLevel || data.vulnerabilitySeverity || "low", // Map severity to riskLevel if needed
            });
            toast.success("Finding saved.");
            refetchFindings();
            setIsAddOpen(false);
        } catch (e: any) {
            toast.error(`Failed to save finding: ${e.message}`);
        }
    };

    const handleCreateSAR = async () => {
        const title = `${frameworkLabel} SAR`;
        try {
            await createSAR.mutateAsync({
                clientId,
                title,
                assessorName: "Assessor"
            });
            toast.success("SAR Created. You can now configure it.");
            refetchSARs();
        } catch (e: any) {
            toast.error(`Failed to create SAR: ${e.message}`);
        }
    };

    if (loadingSARs) return <DashboardLayout><div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div></DashboardLayout>;

    if (!sar) {
        return (
            <DashboardLayout>
                <div className="p-8 space-y-6 max-w-4xl mx-auto">
                    <Breadcrumb items={[
                        { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                        { label: "Federal Hub", href: `/clients/${clientId}/federal` },
                        { label: "SAR Viewer" }
                    ]} />
                    <div className="flex flex-col items-center justify-center h-[50vh] border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <Activity className="h-12 w-12 text-blue-600 mb-4" />
                        <h2 className="text-xl font-bold mb-2">No SAR Found for {frameworkLabel}</h2>
                        <Button onClick={handleCreateSAR}>Create SAR</Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 max-w-[1400px] mx-auto text-slate-900">
                <Breadcrumb items={[
                    { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                    { label: "Federal Hub", href: `/clients/${clientId}/federal` },
                    { label: "DoD SAR" }
                ]} />

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                            <ShieldAlert className="h-8 w-8 text-blue-700" />
                            DoD Security Assessment Report (SAR)
                        </h1>
                        <p className="text-slate-500 font-medium">System Assessment Results - v{headerData.version || '1.0'}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={refetchFindings}><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
                        <Button variant="outline" className="border-slate-300"><Printer className="h-4 w-4 mr-2" /> Print PDF</Button>
                    </div>
                </div>

                {/* Header Information Form */}
                <Card className="border-slate-300 shadow-sm bg-slate-50/50">
                    <CardHeader className="pb-2 border-b border-slate-200 bg-white rounded-t-lg">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg font-bold text-slate-800">1. System Characterization & Assessment Details</CardTitle>
                            {isHeaderDirty && (
                                <Button size="sm" onClick={handleHeaderSave} className="bg-amber-600 hover:bg-amber-700 text-white">
                                    <Save className="h-4 w-4 mr-2" /> Save Changes
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs uppercase font-bold text-slate-500">(1) System Name</Label>
                                <Input value={headerData.systemIdentification || sar.title} onChange={e => { setHeaderData({ ...headerData, systemIdentification: e.target.value }); setIsHeaderDirty(true); }} className="bg-white" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase font-bold text-slate-500">(2) System Acronym</Label>
                                <Input value={headerData.systemAcronym} onChange={e => { setHeaderData({ ...headerData, systemAcronym: e.target.value }); setIsHeaderDirty(true); }} className="bg-white" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase font-bold text-slate-500">(3) Agency (CC/S/A/FA)</Label>
                                <Input value={headerData.agency} onChange={e => { setHeaderData({ ...headerData, agency: e.target.value }); setIsHeaderDirty(true); }} className="bg-white" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase font-bold text-slate-500">(5) System Type</Label>
                                <Input value={headerData.systemType} onChange={e => { setHeaderData({ ...headerData, systemType: e.target.value }); setIsHeaderDirty(true); }} className="bg-white" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase font-bold text-slate-500">Version / Release</Label>
                                <Input value={headerData.version} onChange={e => { setHeaderData({ ...headerData, version: e.target.value }); setIsHeaderDirty(true); }} className="bg-white" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase font-bold text-slate-500">(9) Last Update</Label>
                                <Input disabled value={sar.updatedAt ? new Date(sar.updatedAt).toLocaleDateString() : 'N/A'} className="bg-slate-100" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase font-bold text-slate-500">(8) Assessment Completion</Label>
                                <Input type="date" value={headerData.assessmentCompletionDate} onChange={e => { setHeaderData({ ...headerData, assessmentCompletionDate: e.target.value }); setIsHeaderDirty(true); }} className="bg-white" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase font-bold text-slate-500">(11) System Owner (ISO)</Label>
                                <SearchableSelect
                                    placeholder="Select Owner..."
                                    value={headerData.systemOwnerId ? String(headerData.systemOwnerId) : ""}
                                    onSelect={(val) => { setHeaderData({ ...headerData, systemOwnerId: val }); setIsHeaderDirty(true); }}
                                    emptyText={workspaceMembers ? "No workspace members found" : "Loading members..."}
                                    options={workspaceMembers?.map(u => ({ label: u.name || 'Unknown', value: String(u.id) })) || []}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 p-4 bg-slate-100 rounded-lg border border-slate-200">
                            <div className="space-y-1">
                                <Label className="text-xs uppercase font-bold text-slate-500">(10) Confidentiality</Label>
                                <Select value={headerData.confidentiality} onValueChange={v => { setHeaderData({ ...headerData, confidentiality: v }); setIsHeaderDirty(true); }}>
                                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Moderate">Moderate</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase font-bold text-slate-500">(10) Integrity</Label>
                                <Select value={headerData.integrity} onValueChange={v => { setHeaderData({ ...headerData, integrity: v }); setIsHeaderDirty(true); }}>
                                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Moderate">Moderate</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase font-bold text-slate-500">(10) Availability</Label>
                                <Select value={headerData.availability} onValueChange={v => { setHeaderData({ ...headerData, availability: v }); setIsHeaderDirty(true); }}>
                                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Moderate">Moderate</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase font-bold text-slate-500">(10) Impact Level</Label>
                                <Select value={headerData.impact} onValueChange={v => { setHeaderData({ ...headerData, impact: v }); setIsHeaderDirty(true); }}>
                                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Moderate">Moderate</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold text-slate-800">(1) Security Controls Assessor Executive Summary</Label>
                            <Textarea
                                className="min-h-[100px] bg-white resize-none"
                                value={headerData.executiveSummary}
                                onChange={e => { setHeaderData({ ...headerData, executiveSummary: e.target.value }); setIsHeaderDirty(true); }}
                                placeholder="Executive summary of the security assessment..."
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-300 shadow-xl">
                    <CardHeader className="bg-white border-b border-slate-100 flex flex-row justify-between items-center py-4">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold">Security Assessment Results</CardTitle>
                            <CardDescription>Comprehensive vulnerability and compliance findings.</CardDescription>
                        </div>
                        <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700 shadow-md">
                            <Plus className="h-4 w-4 mr-2" /> Add Finding
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 border-slate-200">
                                    <TableHead className="w-[100px] font-bold text-slate-800">Control</TableHead>
                                    <TableHead className="w-[80px] font-bold text-slate-800">Status</TableHead>
                                    <TableHead className="w-[100px] font-bold text-slate-800">Overlay</TableHead>
                                    <TableHead className="font-bold text-slate-800">Vulnerability Summary</TableHead>
                                    <TableHead className="w-[80px] font-bold text-slate-800">Severity</TableHead>
                                    <TableHead className="w-[80px] font-bold text-slate-800">Residual</TableHead>
                                    <TableHead className="font-bold text-slate-800">Recommendations</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(!findings || findings.length === 0) ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-40 text-center text-slate-400">
                                            No findings recorded. Add items to populate the SAR.
                                        </TableCell>
                                    </TableRow>
                                ) : findings.map((f: any) => (
                                    <TableRow key={f.id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                                        <TableCell className="align-top font-mono font-bold text-blue-700">{f.controlId}</TableCell>
                                        <TableCell className="align-top">
                                            <Badge variant={f.result === 'satisfied' ? 'outline' : 'destructive'} className={f.result === 'satisfied' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : ''}>
                                                {f.result === 'satisfied' ? 'C' : 'NC'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="align-top text-xs text-slate-500">{f.overlay || '-'}</TableCell>
                                        <TableCell className="align-top">
                                            <div className="prose prose-sm max-w-none text-slate-700 text-xs">
                                                {f.vulnerabilitySummary || f.observation || 'No summary'}
                                            </div>
                                            {f.naJustification && (
                                                <div className="mt-1 text-xs text-slate-500 italic">
                                                    <span className="font-semibold">N/A Justif:</span> {f.naJustification}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="align-top text-xs font-semibold capitalize bg-slate-50">{f.vulnerabilitySeverity || '-'}</TableCell>
                                        <TableCell className="align-top text-xs font-semibold capitalize">{f.residualRiskLevel || '-'}</TableCell>
                                        <TableCell className="align-top text-xs text-slate-600">{f.recommendations || f.remediationPlan || '-'}</TableCell>
                                        <TableCell className="align-top text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(f)}>
                                                <Edit2 className="h-3 w-3 text-slate-400 hover:text-blue-600" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Add/Edit Dialog */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingFinding?.id ? "Edit Assessment Finding" : "Add Assessment Finding"}</DialogTitle>
                            <DialogDescription>
                                Document a finding, vulnerability, or observation for a specific control.
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="w-full grid grid-cols-2">
                                <TabsTrigger value="general">Control & Result</TabsTrigger>
                                <TabsTrigger value="details">Vulnerability & Risk</TabsTrigger>
                            </TabsList>
                            <div className="py-4 space-y-4">
                                <TabsContent value="general" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="font-bold">Security Control</Label>
                                        <SearchableSelect
                                            placeholder="Select Control..."
                                            value={editingFinding?.controlId || ""}
                                            onSelect={(val) => setEditingFinding({ ...editingFinding, controlId: val })}
                                            emptyText={clientControls ? "No controls found" : "Loading controls..."}
                                            options={filteredControlOptions || []}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="font-bold">Assessment Result</Label>
                                            <Select value={editingFinding?.result || "other_than_satisfied"} onValueChange={v => setEditingFinding({ ...editingFinding, result: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="satisfied">Satisfied (C)</SelectItem>
                                                    <SelectItem value="other_than_satisfied">Other Than Satisfied (NC)</SelectItem>
                                                    <SelectItem value="not_applicable">Not Applicable (NA)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold">Overlay</Label>
                                            <Input value={editingFinding?.overlay || ""} onChange={e => setEditingFinding({ ...editingFinding, overlay: e.target.value })} placeholder="e.g. Classified" />
                                        </div>
                                    </div>
                                    {editingFinding?.result === 'not_applicable' && (
                                        <div className="space-y-2">
                                            <Label className="font-bold text-amber-600">N/A Justification</Label>
                                            <Textarea value={editingFinding?.naJustification || ""} onChange={e => setEditingFinding({ ...editingFinding, naJustification: e.target.value })} placeholder="Why is this control N/A?" />
                                        </div>
                                    )}
                                </TabsContent>
                                <TabsContent value="details" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="font-bold">Vulnerability Summary</Label>
                                        {/* Optional: Add search from Risk Registry here if needed, keeping simple text for now but hinting linkage */}
                                        <Textarea
                                            value={editingFinding?.vulnerabilitySummary || editingFinding?.observation || ""}
                                            onChange={e => setEditingFinding({ ...editingFinding, vulnerabilitySummary: e.target.value, observation: e.target.value })}
                                            placeholder="Describe the vulnerability or link to Risk ID..."
                                            className="min-h-[80px]"
                                        />
                                        <div className="text-xs text-slate-500">
                                            Tip: Mention Risk ID (e.g. RA-001) to cross-reference.
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="font-bold">Vulnerability Severity</Label>
                                            <Select value={editingFinding?.vulnerabilitySeverity || "low"} onValueChange={v => setEditingFinding({ ...editingFinding, vulnerabilitySeverity: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="moderate">Moderate</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="very_high">Very High</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold">Residual Risk Level</Label>
                                            <Select value={editingFinding?.residualRiskLevel || "low"} onValueChange={v => setEditingFinding({ ...editingFinding, residualRiskLevel: v })}>
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
                                        <Label className="font-bold">Recommendations</Label>
                                        <Textarea
                                            value={editingFinding?.recommendations || editingFinding?.remediationPlan || ""}
                                            onChange={e => setEditingFinding({ ...editingFinding, recommendations: e.target.value, remediationPlan: e.target.value })}
                                            placeholder="Recommended corrective actions..."
                                        />
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveFinding} disabled={saveFindingMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                                {saveFindingMutation.isPending ? "Saving..." : "Save Finding"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
