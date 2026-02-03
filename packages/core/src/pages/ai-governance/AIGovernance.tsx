import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from "@/components/DashboardLayout";
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import { Button } from '@complianceos/ui/ui/button';
import { Badge } from '@complianceos/ui/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { Brain, ShieldCheck, ClipboardCheck, LayoutGrid, Plus, Search, Activity, AlertTriangle, ArrowLeft, History, FileText, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@complianceos/ui/ui/dialog';
import { Input } from '@complianceos/ui/ui/input';
import { Label } from '@complianceos/ui/ui/label';
import { Textarea } from '@complianceos/ui/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { toast } from 'sonner';
import { AIAssessmentWizard } from './AIAssessmentWizard';
import { AIControlMapping } from './AIControlMapping';

const AIGovernance = () => {
    const { id } = useParams<{ id: string }>();
    const activeClientId = id ? parseInt(id) : 1;
    const [isAddSystemOpen, setIsAddSystemOpen] = useState(false);
    const [isEditSystemOpen, setIsEditSystemOpen] = useState(false);
    const [selectedSystemId, setSelectedSystemId] = useState<number | null>(null);
    const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const { data: systems, refetch: refetchSystems } = trpc.ai.systems.list.useQuery({ clientId: activeClientId });
    const { data: stats } = trpc.ai.systems.getStats.useQuery({ clientId: activeClientId });
    const { data: allAssessments } = trpc.ai.systems.listAllAssessments.useQuery({ clientId: activeClientId });
    const { data: vendorsData } = trpc.vendors.listVendors.useQuery({ clientId: activeClientId });
    const { data: selectedSystem, refetch: refetchDetail } = trpc.ai.systems.getWithAssessments.useQuery(
        { id: selectedSystemId as number },
        { enabled: !!selectedSystemId }
    );

    const createSystem = trpc.ai.systems.create.useMutation({
        onSuccess: () => {
            toast.success("AI System registered successfully");
            setIsAddSystemOpen(false);
            refetchSystems();
        }
    });

    const updateSystem = trpc.ai.systems.update.useMutation({
        onSuccess: () => {
            toast.success("AI System updated successfully");
            setIsEditSystemOpen(false);
            refetchDetail();
            refetchSystems();
        }
    });

    const deleteSystem = trpc.ai.systems.delete.useMutation({
        onSuccess: () => {
            toast.success("AI System deleted successfully");
            setIsDeleteOpen(false);
            setSelectedSystemId(null);
            refetchSystems();
        }
    });

    const exportCardMutation = trpc.ai.systems.exportModelCard.useMutation({
        onSuccess: (data) => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ModelCard_${selectedSystem?.name.replace(/\s+/g, '_')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Model Card exported successfully");
        }
    });

    const handleExport = () => {
        if (selectedSystemId) {
            exportCardMutation.mutate({ id: selectedSystemId });
        }
    };

    const downloadReportMutation = trpc.ai.systems.downloadAssessmentReport.useMutation({
        onSuccess: (data) => {
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${data.pdfBase64}`;
            link.download = data.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Report downloaded successfully");
        },
        onError: () => {
            toast.error("Failed to generate report");
        }
    });

    const handleDownloadReport = () => {
        if (selectedSystemId) {
            downloadReportMutation.mutate({ id: selectedSystemId });
        }
    };

    const [newSystem, setNewSystem] = useState({
        name: '',
        description: '',
        purpose: '',
        type: 'internal',
        riskLevel: 'medium',
        status: 'evaluation',
        vendorId: undefined as number | undefined
    });

    const handleAddSystem = () => {
        createSystem.mutate({
            clientId: activeClientId,
            ...newSystem as any
        });
    };

    const handleUpdateSystem = () => {
        if (!selectedSystem) return;
        updateSystem.mutate({
            id: selectedSystem.id,
            name: newSystem.name,
            description: newSystem.description,
            purpose: newSystem.purpose,
            riskLevel: newSystem.riskLevel as any,
            status: newSystem.status as any,
            vendorId: newSystem.vendorId
        });
    };

    const handleDeleteSystem = () => {
        if (!selectedSystemId) return;
        deleteSystem.mutate({ id: selectedSystemId });
    };

    // Pre-fill form on edit open
    React.useEffect(() => {
        if (isEditSystemOpen && selectedSystem) {
            setNewSystem({
                name: selectedSystem.name,
                description: selectedSystem.description || '',
                purpose: selectedSystem.purpose || '',
                type: selectedSystem.type || 'internal',
                riskLevel: selectedSystem.riskLevel || 'medium',
                status: selectedSystem.status || 'evaluation',
                vendorId: selectedSystem.vendorId || undefined
            });
        }
    }, [isEditSystemOpen, selectedSystem]);

    if (selectedSystemId && selectedSystem) {
        return (
            <DashboardLayout>
                <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                    <Button variant="ghost" className="gap-2" onClick={() => setSelectedSystemId(null)}>
                        <ArrowLeft className="h-4 w-4" /> Back to Inventory
                    </Button>

                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold">{selectedSystem.name}</h1>
                                <Badge variant={selectedSystem.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                                    {selectedSystem.riskLevel?.toUpperCase()} RISK
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">{selectedSystem.description}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => setIsEditSystemOpen(true)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setIsDeleteOpen(true)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="w-px h-8 bg-border mx-2" />
                            <Button variant="outline" className="gap-2" onClick={() => setIsAssessmentOpen(true)}>
                                <ClipboardCheck className="h-4 w-4" /> Assessment
                            </Button>
                            <Button variant="outline" className="gap-2" onClick={handleDownloadReport} disabled={downloadReportMutation.isPending}>
                                {downloadReportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                                Report
                            </Button>
                            <Button className="gap-2" onClick={handleExport} disabled={exportCardMutation.isPending}>
                                {exportCardMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                                Model Card
                            </Button>
                        </div>
                    </div>

                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="flex w-fit mb-8 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                            <TabsTrigger
                                value="overview"
                                className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-slate-600 hover:text-slate-900"
                            >
                                <LayoutGrid className="h-4 w-4 mr-2" /> Overview
                            </TabsTrigger>
                            <TabsTrigger
                                value="assessments"
                                className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-slate-600 hover:text-slate-900"
                            >
                                <History className="h-4 w-4 mr-2" /> Assessments History
                            </TabsTrigger>
                            <TabsTrigger
                                value="mapping"
                                className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-slate-600 hover:text-slate-900"
                            >
                                <ShieldCheck className="h-4 w-4 mr-2" /> NIST Control Mapping
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="mt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="md:col-span-2">
                                    <CardHeader><CardTitle className="text-lg">Deployment Context (MAP 1.2)</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Intended Purpose</h4>
                                            <p className="mt-1">{selectedSystem.purpose || "No purpose documented."}</p>
                                        </div>
                                        <div className="pt-4 border-t">
                                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Technical Details</h4>
                                            <div className="grid grid-cols-2 gap-4 mt-2">
                                                <div>
                                                    <span className="text-xs text-muted-foreground">Type</span>
                                                    <p className="font-medium capitalize">{selectedSystem.type}</p>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-muted-foreground">Status</span>
                                                    <p className="font-medium capitalize">{selectedSystem.status}</p>
                                                </div>
                                                {selectedSystem.vendor && (
                                                    <div className="col-span-2 pt-2 border-t mt-2">
                                                        <span className="text-xs text-muted-foreground">Vendor Provider</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="pl-1 pr-3 py-1 flex gap-2">
                                                                <img
                                                                    src={`https://www.google.com/s2/favicons?domain=${selectedSystem.vendor.website}&sz=16`}
                                                                    alt=""
                                                                    className="w-4 h-4 rounded-full"
                                                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                                                />
                                                                {selectedSystem.vendor.name}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle className="text-lg">Quick Stats</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Audit Readiness</span>
                                            <span className="font-bold">42%</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: '42%' }}></div>
                                        </div>
                                        <div className="pt-4 space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                                <span>31 Controls Mapped</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                                <span>2 Moderate Gaps</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="assessments" className="mt-6">
                            <div className="space-y-4">
                                {selectedSystem.assessments?.map((assessment: any) => (
                                    <Card key={assessment.id} className="hover:border-primary/30 transition-colors">
                                        <CardHeader className="p-4 flex flex-row items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${assessment.overallRiskScore > 70 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                                    <History className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <CardTitle className="text-base uppercase">Impact Assessment</CardTitle>
                                                        <Badge variant="outline">{new Date(assessment.createdAt).toLocaleDateString()}</Badge>
                                                    </div>
                                                    <CardDescription>Risk Score: {assessment.overallRiskScore}/100</CardDescription>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm">View Report</Button>
                                        </CardHeader>
                                    </Card>
                                ))}
                                {selectedSystem.assessments?.length === 0 && (
                                    <div className="text-center py-12 border-2 border-dashed rounded-3xl">
                                        <ClipboardCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                                        <h4 className="font-semibold">No assessments found</h4>
                                        <p className="text-sm text-muted-foreground mt-1">Start your first NIST AI RMF assessment for this system.</p>
                                        <Button variant="outline" className="mt-4" onClick={() => setIsAssessmentOpen(true)}>Run Assessment</Button>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="mapping" className="mt-6">
                            <AIControlMapping aiSystemId={selectedSystem.id} clientId={activeClientId} />
                        </TabsContent>
                    </Tabs>

                    {/* Assessment Wizard Dialog */}
                    <Dialog open={isAssessmentOpen} onOpenChange={setIsAssessmentOpen}>
                        <DialogContent className="sm:max-w-3xl rounded-3xl">
                            <DialogHeader>
                                <DialogTitle>AI Impact Assessment (NIST MEASURE)</DialogTitle>
                                <DialogDescription>
                                    Evaluate the characteristics of {selectedSystem.name} according to trustworthy AI criteria.
                                </DialogDescription>
                            </DialogHeader>
                            <AIAssessmentWizard
                                aiSystemId={selectedSystem.id}
                                onComplete={() => {
                                    setIsAssessmentOpen(false);
                                    refetchDetail();
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                    {/* Delete Confirmation Dialog */}
                    <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete AI System?</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete <strong>{selectedSystem.name}</strong>? This action cannot be undone and will delete all associated assessments and mappings.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                                <Button variant="destructive" onClick={handleDeleteSystem} disabled={deleteSystem.isPending}>
                                    {deleteSystem.isPending ? "Deleting..." : "Delete System"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Dialog */}
                    <Dialog open={isEditSystemOpen} onOpenChange={setIsEditSystemOpen}>
                        <DialogContent className="sm:max-w-[600px] rounded-3xl">
                            <DialogHeader>
                                <DialogTitle>Edit AI System</DialogTitle>
                                <DialogDescription>
                                    Update details for {selectedSystem.name}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">System Name</Label>
                                    <Input id="edit-name" value={newSystem.name} onChange={e => setNewSystem({ ...newSystem, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-status">Status</Label>
                                        <Select value={newSystem.status} onValueChange={v => setNewSystem({ ...newSystem, status: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="evaluation">Evaluation</SelectItem>
                                                <SelectItem value="development">Development</SelectItem>
                                                <SelectItem value="production">Production</SelectItem>
                                                <SelectItem value="monitoring">Monitoring</SelectItem>
                                                <SelectItem value="retired">Retired</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-risk">Risk Level</Label>
                                        <Select value={newSystem.riskLevel} onValueChange={v => setNewSystem({ ...newSystem, riskLevel: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="critical">Critical</SelectItem>
                                                <SelectItem value="unacceptable">Unacceptable</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {selectedSystem.type === 'vendor' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-vendor">Vendor</Label>
                                        <Select
                                            value={newSystem.vendorId?.toString()}
                                            onValueChange={v => setNewSystem({ ...newSystem, vendorId: parseInt(v) })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a vendor..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {vendorsData?.map((vendor: any) => (
                                                    <SelectItem key={vendor.id} value={vendor.id.toString()}>
                                                        {vendor.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea id="edit-description" value={newSystem.description} onChange={e => setNewSystem({ ...newSystem, description: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-purpose">Intended Purpose</Label>
                                    <Textarea id="edit-purpose" value={newSystem.purpose} onChange={e => setNewSystem({ ...newSystem, purpose: e.target.value })} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditSystemOpen(false)}>Cancel</Button>
                                <Button onClick={handleUpdateSystem} disabled={updateSystem.isPending}>
                                    {updateSystem.isPending ? "Saving..." : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-foreground">AI Governance</h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            NIST AI Risk Management Framework (RMF 1.0) Lifecycle Management
                        </p>
                    </div>
                    <Button onClick={() => setIsAddSystemOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4" /> Register AI System
                    </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20 shadow-lg hover:shadow-xl transition-all">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Brain className="h-4 w-4 text-blue-500" /> Total AI Systems
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{systems?.length || 0}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-purple-500" /> NIST Compliance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats?.nistCompliance.percentage || 0}%</div>
                            <p className="text-xs text-muted-foreground mt-1">{stats?.nistCompliance.mappedCount || 0}/{stats?.nistCompliance.totalCount || 73} subcategories mapped</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20 shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-orange-500" /> High Risk Systems
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats?.highRiskSystems || 0}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Activity className="h-4 w-4 text-emerald-500" /> Active Assessments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats?.totalAssessments || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="inventory" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-10 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
                        <TabsTrigger
                            value="inventory"
                            className="rounded-xl py-3 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md text-slate-500 hover:text-slate-800"
                        >
                            <LayoutGrid className="h-4 w-4 mr-2" /> AI System Inventory
                        </TabsTrigger>
                        <TabsTrigger
                            value="assessments"
                            className="rounded-xl py-3 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md text-slate-500 hover:text-slate-800"
                        >
                            <ClipboardCheck className="h-4 w-4 mr-2" /> Global Assessments
                        </TabsTrigger>
                        <TabsTrigger
                            value="nist-map"
                            className="rounded-xl py-3 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md text-slate-500 hover:text-slate-800"
                        >
                            <ShieldCheck className="h-4 w-4 mr-2" /> NIST AI RMF Core
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="inventory" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {systems?.map((system: any) => (
                                <Card
                                    key={system.id}
                                    className="hover:border-primary/50 transition-colors shadow-sm cursor-pointer group hover:shadow-md"
                                    onClick={() => setSelectedSystemId(system.id)}
                                >
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="p-3 bg-primary/5 rounded-xl group-hover:bg-primary/10 transition-colors">
                                                <Brain className="h-6 w-6 text-primary" />
                                            </div>
                                            <Badge variant={system.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                                                {system.riskLevel?.toUpperCase()} RISK
                                            </Badge>
                                        </div>
                                        <CardTitle className="mt-4">{system.name}</CardTitle>
                                        <CardDescription className="line-clamp-2">{system.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-2">
                                            <Badge variant="outline">{system.status}</Badge>
                                            <Badge variant="outline">{system.type}</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {systems?.length === 0 && (
                                <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
                                    <Brain className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold">No AI Systems Registered</h3>
                                    <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                                        Start by documenting your AI models or third-party AI services to map them against NIST RMF.
                                    </p>
                                    <Button variant="outline" className="mt-6" onClick={() => setIsAddSystemOpen(true)}>
                                        Add Your First System
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="assessments">
                        <Card className="rounded-3xl border-muted/30 shadow-xl overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-6 border-b border-muted/20">
                                <CardTitle>Global Assessment History</CardTitle>
                                <CardDescription>All evaluations performed across your AI inventory</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-muted/10">
                                    {allAssessments?.map((assessment: any) => (
                                        <div
                                            key={assessment.id}
                                            className="p-6 flex items-center justify-between hover:bg-muted/5 transition-colors cursor-pointer"
                                            onClick={() => setSelectedSystemId(assessment.aiSystemId)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${assessment.overallRiskScore > 70 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                    <ClipboardCheck className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg">{assessment.systemName}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">{new Date(assessment.createdAt).toLocaleDateString()}</Badge>
                                                        <span className="text-xs text-muted-foreground">Assessor: {assessment.assessorName || 'System'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-foreground">{assessment.overallRiskScore}<span className="text-sm font-normal text-muted-foreground">/100</span></div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mt-1">Risk Score</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!allAssessments || allAssessments.length === 0) && (
                                        <div className="p-20 text-center">
                                            <ClipboardCheck className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
                                            <h3 className="text-2xl font-bold">No Assessments Yet</h3>
                                            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                                                Select an individual system from the inventory to run your first impact assessment.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="nist-map">
                        <Card className="rounded-3xl border-muted/30 shadow-xl overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-6 border-b border-muted/20">
                                <CardTitle>NIST AI RMF 1.0 Core Mapping</CardTitle>
                                <CardDescription>Visualizing your coverage across the 73 subcategories</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {(stats?.categoryBreakdown || []).map((stat: any) => (
                                        <div key={stat.category} className="p-8 rounded-3xl bg-slate-50 border border-muted/30 flex flex-col items-center shadow-sm hover:shadow-md transition-all">
                                            <span className="text-xs font-black text-indigo-600 mb-3 tracking-[0.2em]">{stat.category}</span>
                                            <div className="relative h-24 w-24 flex items-center justify-center mb-4">
                                                <svg className="w-full h-full -rotate-90">
                                                    <circle
                                                        cx="48"
                                                        cy="48"
                                                        r="38"
                                                        stroke="currentColor"
                                                        strokeWidth="8"
                                                        fill="transparent"
                                                        className="text-slate-200"
                                                    />
                                                    <circle
                                                        cx="48"
                                                        cy="48"
                                                        r="38"
                                                        stroke="currentColor"
                                                        strokeWidth="8"
                                                        fill="transparent"
                                                        strokeDasharray={238.76}
                                                        strokeDashoffset={238.76 - (238.76 * stat.percentage) / 100}
                                                        className="text-indigo-600 transition-all duration-1000"
                                                    />
                                                </svg>
                                                <span className="absolute text-xl font-bold">{stat.percentage}%</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2 font-medium">
                                                {stat.mapped} of {stat.total} mapped
                                            </p>
                                        </div>
                                    ))}
                                    {(!stats?.categoryBreakdown || stats.categoryBreakdown.length === 0) && (
                                        <div className="col-span-full text-center py-10">
                                            <p className="text-muted-foreground italic">No mapping data available for this client yet.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-12 text-center py-10 bg-indigo-50/30 rounded-3xl border border-indigo-100/50">
                                    <ShieldCheck className="h-10 w-10 text-indigo-200 mx-auto mb-4" />
                                    <p className="text-slate-600 font-medium">Select an AI System to begin mapping controls across the NIST AI RMF core lifecycle.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Registration Dialog */}
                <Dialog open={isAddSystemOpen} onOpenChange={setIsAddSystemOpen}>
                    <DialogContent className="sm:max-w-[600px] rounded-3xl">
                        <DialogHeader>
                            <DialogTitle>Register AI System</DialogTitle>
                            <DialogDescription>
                                Define the scope and context of your AI system as per NIST AI RMF MAP function.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">System Name</Label>
                                <Input id="name" placeholder="e.g., Customer Support LLM" value={newSystem.name} onChange={e => setNewSystem({ ...newSystem, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="type">System Type</Label>
                                    <Select value={newSystem.type} onValueChange={v => setNewSystem({ ...newSystem, type: v, vendorId: undefined })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="internal">In-house Developed</SelectItem>
                                            <SelectItem value="vendor">Vendor Provided (SaaS)</SelectItem>
                                            <SelectItem value="opensource">Open Source</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {newSystem.type === 'vendor' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="vendor">Select Vendor</Label>
                                        <Select
                                            value={newSystem.vendorId?.toString()}
                                            onValueChange={v => setNewSystem({ ...newSystem, vendorId: parseInt(v) })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a vendor..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {vendorsData?.length === 0 && (
                                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                                        No vendors found. Please add vendors in the Vendor module first.
                                                    </div>
                                                )}
                                                {vendorsData?.map((vendor: any) => (
                                                    <SelectItem key={vendor.id} value={vendor.id.toString()}>
                                                        {vendor.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="grid gap-2">
                                    <Label htmlFor="risk">Self-Assessed Risk Level</Label>
                                    <Select value={newSystem.riskLevel} onValueChange={v => setNewSystem({ ...newSystem, riskLevel: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">Critical (Unacceptable)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">System Description</Label>
                                <Textarea id="description" placeholder="Briefly describe what the AI system does..." value={newSystem.description} onChange={e => setNewSystem({ ...newSystem, description: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="purpose">Intended Purpose (MAP 1.1)</Label>
                                <Textarea id="purpose" placeholder="What is the business mission this AI system fulfills?" value={newSystem.purpose} onChange={e => setNewSystem({ ...newSystem, purpose: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddSystemOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddSystem} disabled={!newSystem.name || createSystem.isPending}>
                                {createSystem.isPending ? "Registering..." : "Register System"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default AIGovernance;
