
import React, { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import {
    Cloud,
    Plus,
    ArrowRight,
    Shield,
    ShieldCheck,
    ShieldAlert,
    FileText,
    Search,
    Filter,
    MoreHorizontal,
    LayoutGrid,
    List,
    Download,
    ExternalLink,
    Zap,
    Clock,
    Building2,
    Calendar,
    Layers,
    Trash2
} from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@complianceos/ui/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@complianceos/ui/ui/dialog";

export default function FedRAMPPackagesPage() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [, setLocation] = useLocation();
    const utils = trpc.useUtils();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newPackage, setNewPackage] = useState({
        title: "",
        impactLevel: "Moderate",
        authorizationType: "Agency",
        agencyName: ""
    });

    const { data: packages, isLoading } = trpc.federal.listFedrampPackages.useQuery({ clientId });

    const createMutation = trpc.federal.createFedrampPackage.useMutation({
        onSuccess: () => {
            toast.success("FedRAMP Package created successfully");
            setIsCreateOpen(false);
            utils.federal.listFedrampPackages.invalidate({ clientId });
            setNewPackage({ title: "", impactLevel: "Moderate", authorizationType: "Agency", agencyName: "" });
        },
        onError: (err) => {
            toast.error("Failed to create package: " + err.message);
        }
    });

    const handleCreate = () => {
        if (!newPackage.title) {
            toast.error("Package title is required");
            return;
        }
        createMutation.mutate({
            clientId,
            ...newPackage
        });
    };

    const getImpactColor = (level?: string) => {
        switch (level) {
            case 'High': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Moderate': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'LI-SaaS': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'Authorized': return <Badge className="bg-emerald-500 font-bold">Authorized</Badge>;
            case 'In-Process': return <Badge className="bg-blue-500 font-bold">In-Process</Badge>;
            case 'Ready': return <Badge className="bg-indigo-500 font-bold">Ready</Badge>;
            default: return <Badge variant="outline">{status || 'Draft'}</Badge>;
        }
    };

    const [packageToDelete, setPackageToDelete] = useState<any>(null);

    const deleteMutation = trpc.federal.deleteFedrampPackage.useMutation({
        onSuccess: () => {
            toast.success("Package deleted successfully");
            utils.federal.listFedrampPackages.invalidate({ clientId });
            setPackageToDelete(null);
        },
        onError: (err) => {
            toast.error(`Error deleting package: ${err.message}`);
        }
    });

    const handleDelete = () => {
        if (packageToDelete) {
            deleteMutation.mutate({ clientId, packageId: packageToDelete.id });
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 py-8 animate-in fade-in duration-500">
                <Breadcrumb items={[
                    { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                    { label: "Federal Compliance", href: `/clients/${clientId}/federal` },
                    { label: "FedRAMP Packages" }
                ]} />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Cloud className="h-10 w-10 text-sky-500" />
                            FedRAMP Packages
                        </h1>
                        <p className="text-slate-500 text-lg">Manage your FedRAMP Cloud Service Provider (CSP) authorization packages.</p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-12 bg-sky-600 hover:bg-sky-700 rounded-xl font-bold gap-2 shadow-lg shadow-sky-200 transition-all active:scale-95">
                                <Plus className="h-5 w-5" />
                                New Authorization Package
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-3xl p-8">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Create Authorization Package</DialogTitle>
                                <DialogDescription>
                                    Initialize a new FedRAMP package for your cloud service.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="font-bold text-slate-700">Package Title</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Core SaaS Platform v2"
                                        className="h-12 rounded-xl"
                                        value={newPackage.title}
                                        onChange={(e) => setNewPackage({ ...newPackage, title: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700">Impact Level</Label>
                                        <Select
                                            value={newPackage.impactLevel}
                                            onValueChange={(v) => setNewPackage({ ...newPackage, impactLevel: v })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl">
                                                <SelectValue placeholder="Select level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="LI-SaaS">LI-SaaS</SelectItem>
                                                <SelectItem value="Low">Low</SelectItem>
                                                <SelectItem value="Moderate">Moderate</SelectItem>
                                                <SelectItem value="High">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700">Authorization Path</Label>
                                        <Select
                                            value={newPackage.authorizationType}
                                            onValueChange={(v) => setNewPackage({ ...newPackage, authorizationType: v })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl">
                                                <SelectValue placeholder="Select path" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Agency">Agency Authorization</SelectItem>
                                                <SelectItem value="JAB">JAB P-ATO</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="agency" className="font-bold text-slate-700">Sponsoring Agency (Optional)</Label>
                                    <Input
                                        id="agency"
                                        placeholder="e.g. Department of Justice"
                                        className="h-12 rounded-xl"
                                        value={newPackage.agencyName}
                                        onChange={(e) => setNewPackage({ ...newPackage, agencyName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="h-12 rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={createMutation.isPending}
                                    className="h-12 bg-sky-600 hover:bg-sky-700 rounded-xl font-bold px-8"
                                >
                                    {createMutation.isPending ? "Creating..." : "Create Package"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-slate-100 rounded-3xl" />
                        ))}
                    </div>
                ) : packages?.length === 0 ? (
                    <Card className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-20 text-center">
                        <div className="flex flex-col items-center max-w-md mx-auto space-y-4">
                            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
                                <Cloud className="h-12 w-12 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">No FedRAMP Packages</h3>
                            <p className="text-slate-500">
                                You haven't initialized any FedRAMP authorization packages yet.
                                Start by creating a new package to manage your compliance artifacts and controls.
                            </p>
                            <Button
                                onClick={() => setIsCreateOpen(true)}
                                variant="outline"
                                className="mt-4 border-slate-300 rounded-xl font-bold h-11 px-8"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Package
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {packages?.map((pkg: any) => (
                            <Card
                                key={pkg.id}
                                className="group rounded-3xl border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-sky-200/50 transition-all duration-500 overflow-hidden flex flex-col"
                            >
                                <div
                                    className="cursor-pointer"
                                    onClick={() => setLocation(`/clients/${clientId}/federal/fedramp/${pkg.id}`)}
                                >
                                    <div className={`h-2 bg-gradient-to-r ${pkg.impactLevel === 'High' ? 'from-rose-500 to-rose-600' : 'from-sky-500 to-indigo-600'}`} />
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-sky-50 transition-colors">
                                                <ShieldCheck className="h-6 w-6 text-slate-400 group-hover:text-sky-600" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(pkg.provisioningStatus)}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPackageToDelete(pkg);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-sky-700 transition-colors">
                                            {pkg.title}
                                        </CardTitle>
                                        <CardDescription className="text-sm font-medium text-slate-500 flex items-center gap-2 mt-2">
                                            <Building2 className="h-4 w-4" />
                                            {pkg.agencyName || "Self-Sourced / Private Package"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-6 pt-0">
                                        <div className="flex items-center gap-4">
                                            <Badge className={`${getImpactColor(pkg.impactLevel)} border uppercase font-black text-[10px] tracking-widest px-3 py-1`}>
                                                {pkg.impactLevel} Impact
                                            </Badge>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                <Zap className="h-3 w-3" />
                                                {pkg.authorizationType}
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-slate-50">
                                            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                                <span>Baseline Coverage</span>
                                                <span>65%</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-sky-500 rounded-full w-[65%]" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </div>
                                <CardFooter className="bg-slate-50/50 p-6 pt-0 flex flex-col gap-3 group-hover:bg-sky-50/50 transition-colors">
                                    <div className="w-full flex justify-between items-center mb-2 px-1">
                                        <div className="flex items-center text-xs font-bold text-slate-400">
                                            <Calendar className="h-3 w-3 mr-1.5" />
                                            {new Date(pkg.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">SSP Ready</div>
                                    </div>
                                    <div className="flex gap-2 w-full">
                                        <Button
                                            variant="outline"
                                            className="flex-1 rounded-xl h-11 font-bold text-xs"
                                            onClick={() => setLocation(`/clients/${clientId}/federal/fedramp/${pkg.id}`)}
                                        >
                                            Details
                                        </Button>
                                        <Button
                                            className="flex-1 rounded-xl h-11 bg-slate-900 hover:bg-black text-white font-bold text-xs gap-2"
                                            onClick={() => setLocation(`/clients/${clientId}/federal/assessment?packageId=${pkg.id}&impact=${pkg.impactLevel}`)}
                                        >
                                            Assessment
                                            <ArrowRight className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}

                        {/* Quick Add Placeholder */}
                        <div
                            onClick={() => setIsCreateOpen(true)}
                            className="h-full min-h-[300px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center space-y-4 hover:border-sky-300 hover:bg-sky-50/30 transition-all cursor-pointer group"
                        >
                            <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors">
                                <Plus className="h-8 w-8 text-slate-300 group-hover:text-sky-500" />
                            </div>
                            <span className="font-bold text-slate-400 group-hover:text-sky-600">Initialize New Package</span>
                        </div>
                    </div>
                )}

                {/* FedRAMP Resources Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 mt-12 border-t border-slate-100">
                    <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-gradient-to-br from-slate-900 to-indigo-950 text-white overflow-hidden p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black">FedRAMP SSP Export</h3>
                                <p className="text-slate-400 text-sm font-medium">Generate the required FedRAMP System Security Plan (SSP) template in OSCAL formatted XML or Word.</p>
                            </div>
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <FileText className="h-8 w-8 text-indigo-400" />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <Button
                                variant="outline"
                                className="border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl h-11 px-6 active:scale-95 transition-all"
                                onClick={() => toast.info("OSCAL Export engine is being initialized. This feature will be available in the next update.")}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                OSCAL XML
                            </Button>
                            <Button
                                variant="outline"
                                className="border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl h-11 px-6 active:scale-95 transition-all"
                                onClick={() => toast.info("Word Template generation is currently under development.")}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Word Template
                            </Button>
                        </div>
                    </Card>

                    <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-white p-8 border border-slate-100">
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900">Partner Inheritances</h3>
                                <p className="text-slate-500 text-sm font-medium">Manage inheritance from CSP partners like AWS, Azure, or GCP directly into your package.</p>
                            </div>
                            <div className="p-3 bg-indigo-50 rounded-2xl">
                                <Layers className="h-8 w-8 text-indigo-600" />
                            </div>
                        </div>
                        <Button
                            className="w-full bg-slate-900 text-white hover:bg-black font-bold rounded-xl h-11 active:scale-95 transition-all"
                            onClick={() => toast.info("Partner Inheritance Manager is coming soon.")}
                        >
                            Manage Inheritances
                        </Button>
                    </Card>
                </div>
            </div>

            <AlertDialog open={!!packageToDelete} onOpenChange={(open) => !open && setPackageToDelete(null)}>
                <AlertDialogContent className="rounded-3xl p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-900">
                            Delete Authorization Package?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-base leading-relaxed">
                            This will permanently delete the <span className="font-bold text-slate-900">"{packageToDelete?.title}"</span> package
                            and all associated NIST 800-53 assessment data. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="rounded-xl h-12 font-bold px-8">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="rounded-xl h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold px-8"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete Package"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
