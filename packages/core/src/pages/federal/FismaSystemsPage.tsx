
import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import {
    Database,
    Plus,
    ArrowRight,
    ShieldCheck,
    Calendar,
    Trash2,
    FileText,
    Download,
    Server,
    Activity
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

export default function FismaSystemsPage() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [, setLocation] = useLocation();
    const utils = trpc.useUtils();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newSystem, setNewSystem] = useState({
        name: "",
        fips199Overall: "Moderate",
        description: ""
    });

    const { data: systems, isLoading } = trpc.federal.listFismaSystems.useQuery({ clientId });

    const createMutation = trpc.federal.createFismaSystem.useMutation({
        onSuccess: () => {
            toast.success("FISMA System created successfully");
            setIsCreateOpen(false);
            utils.federal.listFismaSystems.invalidate({ clientId });
            setNewSystem({ name: "", fips199Overall: "Moderate", description: "" });
        },
        onError: (err) => {
            toast.error("Failed to create system: " + err.message);
        }
    });

    const handleCreate = () => {
        if (!newSystem.name) {
            toast.error("System name is required");
            return;
        }
        createMutation.mutate({
            clientId,
            ...newSystem
        });
    };

    const getImpactColor = (level?: string) => {
        switch (level) {
            case 'High': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Moderate': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const [systemToDelete, setSystemToDelete] = useState<any>(null);

    const deleteMutation = trpc.federal.deleteFismaSystem.useMutation({
        onSuccess: () => {
            toast.success("System deleted successfully");
            utils.federal.listFismaSystems.invalidate({ clientId });
            setSystemToDelete(null);
        },
        onError: (err) => {
            toast.error(`Error deleting system: ${err.message}`);
        }
    });

    const handleDelete = () => {
        if (systemToDelete) {
            deleteMutation.mutate({ clientId, systemId: systemToDelete.id });
        }
    };

    return (
        <DashboardLayout>
            <div className="pb-20">
                <div className="px-6 pt-6 pb-2">
                    <Breadcrumb items={[
                        { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                        { label: "Federal Compliance", href: `/clients/${clientId}/federal` },
                        { label: "FISMA Inventory" }
                    ]} />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-40 bg-slate-50/90 backdrop-blur-xl py-4 px-6 border-b border-slate-200 shadow-sm mb-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Database className="h-10 w-10 text-emerald-600" />
                            FISMA Inventory
                        </h1>
                        <p className="text-slate-500 text-lg">Manage your FISMA system inventory and FIPS 199 categorizations.</p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-12 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95">
                                <Plus className="h-5 w-5" />
                                New FISMA System
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-3xl p-8">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Register New System</DialogTitle>
                                <DialogDescription>
                                    Add a new information system to your FISMA inventory.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="font-bold text-slate-700">System Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Core Financial System"
                                        className="h-12 rounded-xl"
                                        value={newSystem.name}
                                        onChange={(e) => setNewSystem({ ...newSystem, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">FIPS 199 Overall Categorization</Label>
                                    <Select
                                        value={newSystem.fips199Overall}
                                        onValueChange={(v) => setNewSystem({ ...newSystem, fips199Overall: v })}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl">
                                            <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Low">Low</SelectItem>
                                            <SelectItem value="Moderate">Moderate</SelectItem>
                                            <SelectItem value="High">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="font-bold text-slate-700">Description</Label>
                                    <Input
                                        id="description"
                                        placeholder="Brief description of the system..."
                                        className="h-12 rounded-xl"
                                        value={newSystem.description}
                                        onChange={(e) => setNewSystem({ ...newSystem, description: e.target.value })}
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
                                    disabled={createMutation.isLoading}
                                    className="h-12 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold px-8"
                                >
                                    {createMutation.isLoading ? "Creating..." : "Create System"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="px-6 space-y-8">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-64 bg-slate-100 rounded-3xl" />
                            ))}
                        </div>
                    ) : systems?.length === 0 ? (
                        <Card className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-20 text-center">
                            <div className="flex flex-col items-center max-w-md mx-auto space-y-4">
                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
                                    <Database className="h-12 w-12 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">No FISMA Systems</h3>
                                <p className="text-slate-500">
                                    You haven't registered any systems in your FISMA inventory yet.
                                    Start by creating a new system to track compliance and assessments.
                                </p>
                                <Button
                                    onClick={() => setIsCreateOpen(true)}
                                    variant="outline"
                                    className="mt-4 border-slate-300 rounded-xl font-bold h-11 px-8"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Register First System
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                            {systems?.map((sys: any) => (
                                <Card
                                    key={sys.id}
                                    className="group rounded-3xl border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-emerald-200/50 transition-all duration-500 overflow-hidden flex flex-col"
                                >
                                    <div className="cursor-pointer" onClick={() => setLocation(`/clients/${clientId}/federal/assessment?fismaSystemId=${sys.id}&impact=${sys.fips199Overall}`)}>
                                        <div className={`h-2 bg-gradient-to-r ${sys.fips199Overall === 'High' ? 'from-rose-500 to-rose-600' : 'from-emerald-500 to-teal-600'}`} />
                                        <CardHeader className="pb-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-emerald-50 transition-colors">
                                                    <Server className="h-6 w-6 text-slate-400 group-hover:text-emerald-600" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="bg-white">{sys.status}</Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSystemToDelete(sys);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                                                {sys.name}
                                            </CardTitle>
                                            <CardDescription className="text-sm font-medium text-slate-500 mt-2 line-clamp-2">
                                                {sys.description || "No description provided."}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1 space-y-6 pt-0">
                                            <div className="flex items-center gap-4">
                                                <Badge className={`${getImpactColor(sys.fips199Overall)} border uppercase font-black text-[10px] tracking-widest px-3 py-1`}>
                                                    FIPS 199 {sys.fips199Overall}
                                                </Badge>
                                            </div>

                                            <div className="space-y-3 pt-4 border-t border-slate-50">
                                                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                                    <span>Assessment Progress</span>
                                                    <span>--%</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full w-[0%]" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </div>
                                    <CardFooter className="bg-slate-50/50 p-6 pt-0 flex flex-col gap-3 group-hover:bg-emerald-50/50 transition-colors">
                                        <div className="w-full flex justify-between items-center mb-2 px-1">
                                            <div className="flex items-center text-xs font-bold text-slate-400">
                                                <Calendar className="h-3 w-3 mr-1.5" />
                                                {new Date(sys.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full">
                                            <Button
                                                className="w-full rounded-xl h-11 bg-slate-900 hover:bg-black text-white font-bold text-xs gap-2"
                                                onClick={() => setLocation(`/clients/${clientId}/federal/assessment?fismaSystemId=${sys.id}&impact=${sys.fips199Overall}`)}
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
                                className="h-full min-h-[300px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center space-y-4 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer group"
                            >
                                <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors">
                                    <Plus className="h-8 w-8 text-slate-300 group-hover:text-emerald-500" />
                                </div>
                                <span className="font-bold text-slate-400 group-hover:text-emerald-600">Register New System</span>
                            </div>
                        </div>
                    )}

                    {/* FISMA Resources Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 mt-12 border-t border-slate-100">
                        <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-gradient-to-br from-slate-900 to-emerald-950 text-white overflow-hidden p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black">FISMA Reports</h3>
                                    <p className="text-slate-400 text-sm font-medium">Generate required FISMA reports and PO&AMs.</p>
                                </div>
                                <div className="p-3 bg-white/10 rounded-2xl">
                                    <FileText className="h-8 w-8 text-emerald-400" />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <Button
                                    variant="outline"
                                    className="border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl h-11 px-6 active:scale-95 transition-all"
                                    onClick={() => toast.info("Report generation is currently under development.")}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Generate Report
                                </Button>
                            </div>
                        </Card>

                        <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-white p-8 border border-slate-100">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900">Continuous Monitoring</h3>
                                    <p className="text-slate-500 text-sm font-medium">View continuous monitoring dashboards and metrics.</p>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-2xl">
                                    <Activity className="h-8 w-8 text-emerald-600" />
                                </div>
                            </div>
                            <Button
                                className="w-full bg-slate-900 text-white hover:bg-black font-bold rounded-xl h-11 active:scale-95 transition-all"
                                onClick={() => toast.info("Continuous Monitoring dashboard is coming soon.")}
                            >
                                View Metrics
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>

            <AlertDialog open={!!systemToDelete} onOpenChange={(open) => !open && setSystemToDelete(null)}>
                <AlertDialogContent className="rounded-3xl p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-900">
                            Delete System?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-base leading-relaxed">
                            This will permanently delete the <span className="font-bold text-slate-900">"{systemToDelete?.name}"</span> system
                            and all associated assessment data. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="rounded-xl h-12 font-bold px-8">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="rounded-xl h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold px-8"
                            disabled={deleteMutation.isLoading}
                        >
                            {deleteMutation.isLoading ? "Deleting..." : "Delete System"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
