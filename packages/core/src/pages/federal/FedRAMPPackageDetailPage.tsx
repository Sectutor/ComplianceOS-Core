
import React from "react";
import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import {
    Shield,
    Cloud,
    FileText,
    ClipboardList,
    Zap,
    ArrowLeft,
    ExternalLink,
    Download,
    Layers,
    ShieldCheck,
    AlertTriangle,
    Clock,
    Building2,
    Settings,
    Plus,
    Calendar
} from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { checkResult, checkScope } from "@/lib/permissions";
import { generateOscalSsp } from "@/utils/federal/oscal-generator";
import { useState } from "react";

export default function FedRAMPPackageDetailPage() {
    const { id, packageId } = useParams<{ id: string, packageId: string }>();
    const clientId = parseInt(id || "0");
    const pkgId = parseInt(packageId || "0");

    const { data: pkg, isLoading: loadingPkg } = trpc.federal.getFedrampPackage?.useQuery({
        clientId,
        packageId: pkgId
    }) || { data: null, isLoading: false };

    const { data: metrics } = trpc.federal.getNonCompliantMetrics.useQuery({
        clientId,
        sspId: pkgId
    });

    if (loadingPkg) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-pulse text-slate-400">Loading package details...</div>
                </div>
            </DashboardLayout>
        );
    }

    if (!pkg && !loadingPkg) {
        // Mock data if query fails or is not implemented yet
        const mockPkg = {
            id: pkgId,
            title: "Federal Cloud Services - Production",
            impactLevel: "Moderate",
            authorizationType: "Agency",
            agencyName: "Department of Energy",
            provisioningStatus: "In-Process",
            updatedAt: new Date()
        };
        return <PackageDetailView pkg={mockPkg} clientId={clientId} metrics={metrics} />;
    }

    return <PackageDetailView pkg={pkg} clientId={clientId} metrics={metrics} />;
}

function PackageDetailView({ pkg, clientId, metrics }: { pkg: any, clientId: number, metrics: any }) {
    const totalControls = 325; // Approximate for Moderate
    const completedControls = metrics?.totalItems || 0;
    const progress = Math.round((completedControls / totalControls) * 100);

    const [showSarDialog, setShowSarDialog] = useState(false);
    const [showPoamDialog, setShowPoamDialog] = useState(false);
    const [showInheritanceDialog, setShowInheritanceDialog] = useState(false);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [exportFormat, setExportFormat] = useState({ oscal: true, docx: false });

    const utils = trpc.useContext();
    const updateMutation = trpc.federal.updateFedrampPackage.useMutation({
        onSuccess: () => {
            toast.success("Package settings updated successfully");
            setShowSettingsDialog(false);
            utils.federal.getFedrampPackage.invalidate({ clientId, packageId: pkg.id });
        },
        onError: (err) => toast.error(err.message)
    });

    const handleUpdatePackage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        updateMutation.mutate({
            clientId,
            packageId: pkg.id,
            title: formData.get("title") as string,
            impactLevel: formData.get("impactLevel") as string,
            authorizationType: formData.get("authorizationType") as string,
            agencyName: formData.get("agencyName") as string,
        });
    };

    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            toast.info("Preparing export data...");
            // Fetch controls implementation details
            const controls = await utils.federal.getSspControls.fetch({
                clientId,
                sspId: pkg.id
            });

            if (exportFormat.oscal) {
                const oscalData = generateOscalSsp(pkg, {}, controls);
                const blob = new Blob([JSON.stringify(oscalData, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `FedRAMP-SSP-${pkg.title.replace(/\s+/g, '-')}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success("OSCAL SSP generated successfully");
            }

            if (exportFormat.docx) {
                // Simplified DOCX export (using HTML for now as it's easier without heavy libs)
                const docContent = `
                    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                    <head><title>${pkg.title} - SSP</title></head>
                    <body>
                        <h1>System Security Plan: ${pkg.title}</h1>
                        <p><strong>Agency:</strong> ${pkg.agencyName}</p>
                        <p><strong>Impact Level:</strong> ${pkg.impactLevel}</p>
                        <hr/>
                        <h2>Control Implementations</h2>
                        ${controls.map((c: any) => `
                            <h3>${c.controlId}</h3>
                            <p><strong>Status:</strong> ${c.implementationStatus}</p>
                            <p><strong>Implementation:</strong> ${c.implementationDescription || 'Not implemented'}</p>
                            <br/>
                        `).join('')}
                    </body>
                    </html>
                `;
                const blob = new Blob(['\ufeff', docContent], { type: 'application/msword' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `FedRAMP-SSP-${pkg.title.replace(/\s+/g, '-')}.doc`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success("Word template generated successfully");
            }

            setShowExportDialog(false);
        } catch (error: any) {
            console.error("Export failed:", error);
            toast.error("Failed to generate export: " + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    const { data: sarFindings } = trpc.federal.listPackageSarFindings.useQuery(
        { clientId, packageId: pkg.id },
        { enabled: showSarDialog }
    );

    const { data: poams } = trpc.federal.listPackagePoams.useQuery(
        { clientId, packageId: pkg.id },
        { enabled: showPoamDialog }
    );

    const { data: inheritances } = trpc.federal.getInheritances.useQuery(
        { clientId, packageId: pkg.id },
        { enabled: showInheritanceDialog }
    );

    const createInheritanceMutation = trpc.federal.createInheritance.useMutation({
        onSuccess: () => {
            toast.success("Inheritance added");
            utils.federal.getInheritances.invalidate({ clientId, packageId: pkg.id });
            setNewInheritance({ partnerName: '', controlId: '', description: '' });
        },
        onError: (err) => toast.error(err.message)
    });

    const deleteInheritanceMutation = trpc.federal.deleteInheritance.useMutation({
        onSuccess: () => {
            toast.success("Inheritance removed");
            utils.federal.getInheritances.invalidate({ clientId, packageId: pkg.id });
        },
        onError: (err) => toast.error(err.message)
    });

    const [newInheritance, setNewInheritance] = useState({ partnerName: '', controlId: '', description: '' });

    const handleAddInheritance = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newInheritance.partnerName || !newInheritance.controlId) {
            toast.error("Partner Name and Control ID are required");
            return;
        }
        createInheritanceMutation.mutate({
            clientId,
            packageId: pkg.id,
            partnerName: newInheritance.partnerName,
            controlId: newInheritance.controlId,
            description: newInheritance.description
        });
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 py-8 animate-in fade-in duration-500">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                        { label: "Federal Compliance", href: `/clients/${clientId}/federal` },
                        { label: "FedRAMP Packages", href: `/clients/${clientId}/federal/fedramp` },
                        { label: pkg.title },
                    ]}
                />

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Link href={`/clients/${clientId}/federal/fedramp`}>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            </Link>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                {pkg.title}
                            </h1>
                            <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-200 border-sky-200 px-3 py-1">
                                {pkg.impactLevel} Baseline
                            </Badge>
                        </div>
                        <p className="text-slate-500 text-lg flex items-center gap-2 ml-12">
                            <Building2 className="w-4 h-4" />
                            {pkg.agencyName} • {pkg.authorizationType} Authorization
                        </p>
                    </div>
                    <div className="flex gap-3 ml-12 md:ml-0">
                        <Button
                            variant="outline"
                            className="rounded-xl border-slate-200 shadow-sm gap-2 active:scale-95 transition-all"
                            onClick={() => setShowSettingsDialog(true)}
                        >
                            <Settings className="w-4 h-4" />
                            Package Settings
                        </Button>
                        <Button
                            className="bg-slate-900 text-white hover:bg-black rounded-xl shadow-lg gap-2 active:scale-95 transition-all"
                            onClick={() => setShowExportDialog(true)}
                        >
                            <Download className="w-4 h-4" />
                            Export Package
                        </Button>
                    </div>
                </div>

                {/* Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="border-0 shadow-md bg-white overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-sky-50 rounded-xl text-sky-600 group-hover:scale-110 transition-transform">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <Badge variant="outline" className="text-[10px] font-bold uppercase transition-colors">
                                    Overall Progress
                                </Badge>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-3xl font-black text-slate-900">{progress}%</span>
                                    <span className="text-slate-400 text-xs font-medium mb-1">{completedControls} / {totalControls} Controls</span>
                                </div>
                                <Progress value={progress} className="h-2 bg-slate-100" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md bg-white overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <Badge variant="outline" className="text-[10px] font-bold uppercase">
                                    Open POA&Ms
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <span className="text-3xl font-black text-slate-900">{metrics?.totalWeaknesses || 0}</span>
                                <p className="text-slate-500 text-xs font-medium">Remediation actions required</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md bg-white overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <Badge variant="outline" className="text-[10px] font-bold uppercase">
                                    Status
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <span className="text-3xl font-black text-slate-900">{pkg.provisioningStatus}</span>
                                <p className="text-slate-500 text-xs font-medium">Current authorization phase</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md bg-white overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <Badge variant="outline" className="text-[10px] font-bold uppercase">
                                    Next Milestone
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xl font-black text-slate-900 line-clamp-1">SSP Finalization</span>
                                <p className="text-slate-500 text-xs font-medium">Target: Q3 2026</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Control Assessment Section */}
                        <Card className="border-0 shadow-lg bg-white overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl font-black text-slate-900">Control Implementation</CardTitle>
                                        <CardDescription>Assess and document your {pkg.impactLevel} baseline controls.</CardDescription>
                                    </div>
                                    <Link href={`/clients/${clientId}/federal/assessment?packageId=${pkg.id}&impact=${pkg.impactLevel}`}>
                                        <Button className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md gap-2">
                                            Manage Controls
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                                        <div className="flex items-center gap-2 text-emerald-600">
                                            <ShieldCheck className="w-5 h-5" />
                                            <span className="font-bold text-sm uppercase tracking-wider">Compliant</span>
                                        </div>
                                        <div className="text-3xl font-black text-slate-900">{metrics?.compliantItems || 0}</div>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                                        <div className="flex items-center gap-2 text-amber-500">
                                            <Clock className="w-5 h-5" />
                                            <span className="font-bold text-sm uppercase tracking-wider">Partial</span>
                                        </div>
                                        <div className="text-3xl font-black text-slate-900">{metrics?.partialItems || 0}</div>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                                        <div className="flex items-center gap-2 text-rose-500">
                                            <AlertTriangle className="w-5 h-5" />
                                            <span className="font-bold text-sm uppercase tracking-wider">Non-Compliant</span>
                                        </div>
                                        <div className="text-3xl font-black text-slate-900">{metrics?.nonCompliantItems || 0}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Artifact Management */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="border-0 shadow-lg bg-white overflow-hidden group hover:scale-[1.02] transition-transform">
                                <CardContent className="p-8 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                            <FileText className="w-8 h-8" />
                                        </div>
                                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">Ready for Export</Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-slate-900">System Security Plan (SSP)</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            Comprehensive documentation of all management, operational, and technical controls.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full rounded-xl border-indigo-100 text-indigo-700 hover:bg-indigo-50 gap-2 active:scale-95 transition-all"
                                        onClick={() => setShowExportDialog(true)}
                                    >
                                        <Download className="w-4 h-4" />
                                        Download SSP (OSCAL)
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg bg-white overflow-hidden group hover:scale-[1.02] transition-transform">
                                <CardContent className="p-8 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                                            <ClipboardList className="w-8 h-8" />
                                        </div>
                                        <Badge variant="secondary" className="bg-rose-50 text-rose-700">In-Process</Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-slate-900">Security Assessment Report (SAR)</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            Results of the 3PAO assessment, documenting control testing and vulnerability findings.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full rounded-xl border-rose-100 text-rose-700 hover:bg-rose-50 gap-2 active:scale-95 transition-all"
                                        onClick={() => setShowSarDialog(true)}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        View SAR Findings
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-8">
                        <Card className="border-0 shadow-lg bg-slate-900 text-white overflow-hidden">
                            <CardContent className="p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded-xl">
                                        <Zap className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <h3 className="text-lg font-bold">Remediation Action (POA&M)</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="pb-4 border-b border-white/10">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Weakness Status</span>
                                            <span className="text-xs font-mono text-amber-400">24 Items</span>
                                        </div>
                                        <div className="flex gap-1 h-3 mt-3">
                                            <div className="w-[40%] bg-emerald-500 rounded-l-full" title="Closed" />
                                            <div className="w-[30%] bg-amber-500" title="Ongoing" />
                                            <div className="w-[30%] bg-rose-500 rounded-r-full" title="Delayed" />
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold gap-2 active:scale-95 transition-all"
                                        onClick={() => setShowPoamDialog(true)}
                                    >
                                        Manage POA&M
                                        <ArrowLeft className="w-4 h-4 rotate-180" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg bg-white overflow-hidden">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-indigo-600" />
                                    Inheritance Management
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <Cloud className="w-4 h-4 text-sky-500" />
                                            <span className="text-sm font-bold">AWS (PaS)</span>
                                        </div>
                                        <Badge variant="outline" className="text-[10px]">128 Controls</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <Shield className="w-4 h-4 text-emerald-500" />
                                            <span className="text-sm font-bold">Azure Government</span>
                                        </div>
                                        <Badge variant="outline" className="text-[10px]">45 Controls</Badge>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full rounded-xl gap-2 font-bold text-slate-600 active:scale-95 transition-all"
                                    onClick={() => setShowInheritanceDialog(true)}
                                >
                                    Configure Partners
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Dialogs */}
                <EnhancedDialog
                    open={showSarDialog}
                    onOpenChange={setShowSarDialog}
                    title="Security Assessment Report (SAR) Findings"
                    description="Review vulnerabilities and significant findings identified by the 3PAO."
                    size="3xl"
                >
                    <div className="border rounded-xl bg-white overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>Finding ID</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Risk Level</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sarFindings?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                                            No findings recorded yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sarFindings?.map((f: any) => (
                                        <TableRow key={f.id}>
                                            <TableCell className="font-mono">{f.uniqueId}</TableCell>
                                            <TableCell>{f.description}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        f.riskLevel === 'High' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                                            f.riskLevel === 'Moderate' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                                'bg-slate-100 text-slate-700'
                                                    }
                                                >
                                                    {f.riskLevel}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{f.status}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </EnhancedDialog>

                <EnhancedDialog
                    open={showPoamDialog}
                    onOpenChange={setShowPoamDialog}
                    title="Plan of Action & Milestones (POA&M)"
                    description="Track remediation progress for identified weaknesses."
                    size="3xl"
                >
                    <div className="border rounded-xl bg-white overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>Weakness ID</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Scheduled Completion</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {poams?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                                            No open POA&Ms.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    poams?.map((p: any) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-mono font-bold text-slate-700">{p.weaknessId}</TableCell>
                                            <TableCell>{p.weaknessDescription}</TableCell>
                                            <TableCell className="text-slate-500">
                                                {p.scheduledCompletionDate ? new Date(p.scheduledCompletionDate).toLocaleDateString() : 'TBD'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={p.status === 'Ongoing' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : ''}
                                                >
                                                    {p.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </EnhancedDialog>

                <EnhancedDialog
                    open={showInheritanceDialog}
                    onOpenChange={setShowInheritanceDialog}
                    title="Inheritance & Shared Responsibility"
                    description="Controls inherited from Cloud Service Providers (CSPs)."
                    size="3xl"
                >
                    <div className="space-y-6 py-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 mb-3">Add New Inheritance</h3>
                            <form onSubmit={handleAddInheritance} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-1 md:col-span-1">
                                    <Label htmlFor="inh-partner" className="text-xs">Partner / CSP</Label>
                                    <Input
                                        id="inh-partner"
                                        placeholder="e.g. AWS"
                                        value={newInheritance.partnerName}
                                        onChange={(e) => setNewInheritance({ ...newInheritance, partnerName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-1">
                                    <Label htmlFor="inh-control" className="text-xs">Control ID</Label>
                                    <Input
                                        id="inh-control"
                                        placeholder="e.g. AC-2"
                                        value={newInheritance.controlId}
                                        onChange={(e) => setNewInheritance({ ...newInheritance, controlId: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-1">
                                    <Label htmlFor="inh-desc" className="text-xs">Description</Label>
                                    <Input
                                        id="inh-desc"
                                        placeholder="Optional details"
                                        value={newInheritance.description}
                                        onChange={(e) => setNewInheritance({ ...newInheritance, description: e.target.value })}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={createInheritanceMutation.isPending}
                                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                                >
                                    {createInheritanceMutation.isPending ? "Adding..." : "Add"}
                                </Button>
                            </form>
                        </div>

                        <div className="border rounded-xl bg-white overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>Control ID</TableHead>
                                        <TableHead>Partner</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!inheritances || inheritances.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                                No inherited controls configured.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        inheritances.map((i: any) => (
                                            <TableRow key={i.id}>
                                                <TableCell className="font-mono font-bold">{i.controlId}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Cloud className="w-4 h-4 text-sky-500" />
                                                        {i.partnerName}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-600 max-w-[200px] truncate" title={i.description}>
                                                    {i.description || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    >
                                                        {i.status || 'Active'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                        onClick={() => deleteInheritanceMutation.mutate({ clientId, id: i.id })}
                                                    >
                                                        <span className="sr-only">Delete</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </EnhancedDialog>

                <EnhancedDialog
                    open={showSettingsDialog}
                    onOpenChange={setShowSettingsDialog}
                    title="Package Settings"
                    description="Update general information and authorization details."
                    size="lg"
                    footer={
                        <div className="flex justify-end gap-2 w-full">
                            <Button variant="ghost" onClick={() => setShowSettingsDialog(false)}>Cancel</Button>
                            <Button type="submit" form="pkg-settings-form" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    }
                >
                    <form id="pkg-settings-form" onSubmit={handleUpdatePackage} className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Package Title</Label>
                            <Input id="title" name="title" defaultValue={pkg.title} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="impactLevel">Impact Level</Label>
                                <Select name="impactLevel" defaultValue={pkg.impactLevel}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Moderate">Moderate</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="authorizationType">Authorization Type</Label>
                                <Select name="authorizationType" defaultValue={pkg.authorizationType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Agency">Agency</SelectItem>
                                        <SelectItem value="JAB">JAB</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="agencyName">Agency / Sponsor Name</Label>
                            <Input id="agencyName" name="agencyName" defaultValue={pkg.agencyName} />
                        </div>
                    </form>
                </EnhancedDialog>

                <EnhancedDialog
                    open={showExportDialog}
                    onOpenChange={setShowExportDialog}
                    title="Export Package"
                    description="Generate and download package artifacts in standard formats."
                    size="lg"
                    footer={
                        <div className="flex justify-end gap-2 w-full">
                            <Button variant="ghost" onClick={() => setShowExportDialog(false)}>Cancel</Button>
                            <Button onClick={handleExport} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                Start Export Job
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-6 py-4">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium">Select Artifacts</h3>
                            <div className="grid gap-4 border rounded-xl p-4">
                                <div className="flex items-start space-x-3">
                                    <Checkbox id="exp-ssp" defaultChecked />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label htmlFor="exp-ssp" className="font-bold">System Security Plan (SSP)</Label>
                                        <p className="text-sm text-muted-foreground">Main security documentation body</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <Checkbox id="exp-sar" defaultChecked />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label htmlFor="exp-sar" className="font-bold">Security Assessment Report (SAR)</Label>
                                        <p className="text-sm text-muted-foreground">Assessment results and findings</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <Checkbox id="exp-poam" defaultChecked />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label htmlFor="exp-poam" className="font-bold">POA&M</Label>
                                        <p className="text-sm text-muted-foreground">Plan of Action and Milestones</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium">Format Options</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    className={`border rounded-xl p-4 cursor-pointer hover:bg-slate-50 relative ${exportFormat.oscal ? 'border-indigo-500 bg-indigo-50/10' : ''}`}
                                    onClick={() => setExportFormat(prev => ({ ...prev, oscal: !prev.oscal }))}
                                >
                                    <Checkbox
                                        id="fmt-oscal"
                                        className="absolute top-4 right-4"
                                        checked={exportFormat.oscal}
                                        onCheckedChange={(c) => setExportFormat(prev => ({ ...prev, oscal: !!c }))}
                                    />
                                    <div className="space-y-2">
                                        <div className="p-2 w-fit rounded-lg bg-indigo-100 text-indigo-700">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <Label className="font-bold block mb-1 cursor-pointer">OSCAL (JSON)</Label>
                                            <span className="text-xs text-muted-foreground">NIST machine-readable standard</span>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    className={`border rounded-xl p-4 cursor-pointer hover:bg-slate-50 relative ${exportFormat.docx ? 'border-indigo-500 bg-indigo-50/10' : ''}`}
                                    onClick={() => setExportFormat(prev => ({ ...prev, docx: !prev.docx }))}
                                >
                                    <Checkbox
                                        id="fmt-docx"
                                        className="absolute top-4 right-4"
                                        checked={exportFormat.docx}
                                        onCheckedChange={(c) => setExportFormat(prev => ({ ...prev, docx: !!c }))}
                                    />
                                    <div className="space-y-2">
                                        <div className="p-2 w-fit rounded-lg bg-blue-100 text-blue-700">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <Label className="font-bold block mb-1 cursor-pointer">Word (DOCX)</Label>
                                            <span className="text-xs text-muted-foreground">Human-readable document</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </EnhancedDialog>
            </div>
        </DashboardLayout>
    );
}


