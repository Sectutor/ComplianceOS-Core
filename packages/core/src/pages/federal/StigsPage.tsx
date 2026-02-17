
import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import {
    Shield,
    Plus,
    ArrowRight,
    Calendar,
    Trash2,
    FileText,
    Download,
    Target,
    BarChart3,
    Activity,
    Layers,
    CheckCircle2,
    Server,
    Database,
    Globe,
    Cpu
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@complianceos/ui/ui/select";
import { Link } from "wouter";

export default function StigsPage() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [, setLocation] = useLocation();
    const utils = trpc.useUtils();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newChecklist, setNewChecklist] = useState({
        title: "",
        category: "Server",
        assetIdentifier: ""
    });

    const { data: checklists, isLoading } = trpc.federal.listDisaStigChecklists.useQuery({ clientId });

    const createMutation = trpc.federal.createDisaStigChecklist.useMutation({
        onSuccess: () => {
            toast.success("STIG Checklist created successfully");
            setIsCreateOpen(false);
            utils.federal.listDisaStigChecklists.invalidate({ clientId });
            setNewChecklist({ title: "", category: "Server", assetIdentifier: "" });
        },
        onError: (err) => {
            toast.error("Failed to create checklist: " + err.message);
        }
    });

    const handleCreate = () => {
        if (!newChecklist.title) {
            toast.error("Title is required");
            return;
        }
        createMutation.mutate({
            clientId,
            ...newChecklist
        });
    };

    const [checklistToDelete, setChecklistToDelete] = useState<any>(null);

    const deleteMutation = trpc.federal.deleteDisaStigChecklist.useMutation({
        onSuccess: () => {
            toast.success("Checklist deleted successfully");
            utils.federal.listDisaStigChecklists.invalidate({ clientId });
            setChecklistToDelete(null);
        },
        onError: (err) => {
            toast.error(`Error deleting checklist: ${err.message}`);
        }
    });

    const handleDelete = () => {
        if (checklistToDelete) {
            deleteMutation.mutate({ clientId, id: checklistToDelete.id });
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Server': return <Server className="h-6 w-6 text-slate-400 group-hover:text-blue-600" />;
            case 'Database': return <Database className="h-6 w-6 text-slate-400 group-hover:text-blue-600" />;
            case 'Network': return <Activity className="h-6 w-6 text-slate-400 group-hover:text-blue-600" />;
            case 'Application': return <Globe className="h-6 w-6 text-slate-400 group-hover:text-blue-600" />;
            default: return <Cpu className="h-6 w-6 text-slate-400 group-hover:text-blue-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        if (status === 'Compliant') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (status === 'Non-Compliant') return 'text-rose-600 bg-rose-50 border-rose-200';
        return 'text-slate-600 bg-slate-50 border-slate-200';
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8 max-w-7xl mx-auto">
                <Breadcrumb items={[
                    { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                    { label: "Federal Compliance", href: `/clients/${clientId}/federal` },
                    { label: "DISA STIGs" }
                ]} />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Shield className="h-10 w-10 text-blue-600" />
                            DISA STIG Checklists
                        </h1>
                        <p className="text-slate-500 text-lg">Manage Security Technical Implementation Guides (STIGs) for system hardening.</p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95">
                                <Plus className="h-5 w-5" />
                                New Checklist
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-3xl p-8">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">New STIG Checklist</DialogTitle>
                                <DialogDescription>
                                    Create a new checklist to track hardening compliance.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="font-bold text-slate-700">Checklist Title</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Ubuntu 20.04 Server Hardening"
                                        className="h-12 rounded-xl"
                                        value={newChecklist.title}
                                        onChange={(e) => setNewChecklist({ ...newChecklist, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="font-bold text-slate-700">Category</Label>
                                    <Select value={newChecklist.category} onValueChange={(val) => setNewChecklist({ ...newChecklist, category: val })}>
                                        <SelectTrigger className="h-12 rounded-xl">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Server">Operating System / Server</SelectItem>
                                            <SelectItem value="Database">Database</SelectItem>
                                            <SelectItem value="Network">Network Device</SelectItem>
                                            <SelectItem value="Application">Application / Web Server</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="asset" className="font-bold text-slate-700">Target Asset (Hostname/IP)</Label>
                                    <Input
                                        id="asset"
                                        placeholder="e.g. web-prod-01"
                                        className="h-12 rounded-xl"
                                        value={newChecklist.assetIdentifier}
                                        onChange={(e) => setNewChecklist({ ...newChecklist, assetIdentifier: e.target.value })}
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
                                    className="h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold px-8"
                                >
                                    {createMutation.isLoading ? "Creating..." : "Create Checklist"}
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
                ) : checklists?.length === 0 ? (
                    <Card className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-20 text-center">
                        <div className="flex flex-col items-center max-w-md mx-auto space-y-4">
                            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
                                <Shield className="h-12 w-12 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">No Checklists Found</h3>
                            <p className="text-slate-500">
                                You haven't created any STIG checklists yet.
                                Start by creating one for your assets.
                            </p>
                            <Button
                                onClick={() => setIsCreateOpen(true)}
                                variant="outline"
                                className="mt-4 border-slate-300 rounded-xl font-bold h-11 px-8"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Checklist
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {checklists?.map((checklist: any) => (
                            <Card
                                key={checklist.id}
                                className="group rounded-3xl border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-500 overflow-hidden flex flex-col"
                            >
                                <div className="cursor-pointer" onClick={() => setLocation(`/clients/${clientId}/federal/stigs/${checklist.id}`)}>
                                    <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
                                                {getCategoryIcon(checklist.category)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={`bg-white ${getStatusColor(checklist.overallStatus)}`}>
                                                    {checklist.overallStatus || "Pending"}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setChecklistToDelete(checklist);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardTitle className="text-xl font-black text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                                            {checklist.title}
                                        </CardTitle>
                                        <CardDescription className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2">
                                            <Target className="h-3 w-3" />
                                            {checklist.assetIdentifier || "No Asset Assigned"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-6 pt-0">
                                         <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Findings</span>
                                            <span className="text-lg font-black text-slate-900">{checklist.findingsCount || 0}</span>
                                        </div>
                                    </CardContent>
                                </div>
                                <CardFooter className="bg-slate-50/50 p-6 pt-0 flex flex-col gap-3 group-hover:bg-blue-50/50 transition-colors">
                                    <div className="w-full flex justify-between items-center mb-2 px-1">
                                        <div className="flex items-center text-xs font-bold text-slate-400">
                                            <Calendar className="h-3 w-3 mr-1.5" />
                                            Updated: {new Date(checklist.updatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full">
                                        <Button
                                            className="w-full rounded-xl h-11 bg-slate-900 hover:bg-black text-white font-bold text-xs gap-2"
                                            onClick={() => setLocation(`/clients/${clientId}/federal/stigs/${checklist.id}`)}
                                        >
                                            Open Checklist
                                            <ArrowRight className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}

                        {/* Quick Add Placeholder */}
                        <div
                            onClick={() => setIsCreateOpen(true)}
                            className="h-full min-h-[300px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center space-y-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group"
                        >
                            <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors">
                                <Plus className="h-8 w-8 text-slate-300 group-hover:text-blue-500" />
                            </div>
                            <span className="font-bold text-slate-400 group-hover:text-blue-600">New Checklist</span>
                        </div>
                    </div>
                )}
            </div>

            <AlertDialog open={!!checklistToDelete} onOpenChange={(open) => !open && setChecklistToDelete(null)}>
                <AlertDialogContent className="rounded-3xl p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-900">
                            Delete Checklist?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-base leading-relaxed">
                            This will permanently delete the checklist <span className="font-bold text-slate-900">"{checklistToDelete?.title}"</span> and all its recorded findings. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="rounded-xl h-12 font-bold px-8">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="rounded-xl h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold px-8"
                            disabled={deleteMutation.isLoading}
                        >
                            {deleteMutation.isLoading ? "Deleting..." : "Delete Checklist"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
