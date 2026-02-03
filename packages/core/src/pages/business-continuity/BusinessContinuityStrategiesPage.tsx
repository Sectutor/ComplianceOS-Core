
import React, { useState } from 'react';
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Plus, Shield, Check, X, Trash2, FileText, DollarSign, Target, Pencil, ArrowLeft } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@complianceos/ui/ui/dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function BusinessContinuityStrategiesPage() {
    const params = useParams();
    const clientId = parseInt(params.id || "0");
    const [_location, setLocation] = useLocation();
    const [isNewOpen, setIsNewOpen] = useState(false);

    // State for Editing
    const [editingStrategy, setEditingStrategy] = useState<any>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [resourceRequirements, setResourceRequirements] = useState("");
    const [benefits, setBenefits] = useState("");
    const [cost, setCost] = useState("");

    const { data: strategies, refetch } = trpc.businessContinuity.strategies.list.useQuery({ clientId });

    const createStrategy = trpc.businessContinuity.strategies.create.useMutation({
        onSuccess: () => {
            toast.success("Strategy created successfully");
            setIsNewOpen(false);
            resetForm();
            refetch();
        },
        onError: (err) => toast.error(`Failed to create: ${err.message}`)
    });

    const updateStrategy = trpc.businessContinuity.strategies.update.useMutation({
        onSuccess: () => {
            toast.success("Strategy updated successfully");
            setIsNewOpen(false);
            resetForm();
            refetch();
        },
        onError: (err) => toast.error(`Failed to update: ${err.message}`)
    });

    const deleteStrategy = trpc.businessContinuity.strategies.delete.useMutation({
        onSuccess: () => {
            toast.success("Strategy deleted");
            refetch();
        }
    });

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setResourceRequirements("");
        setBenefits("");
        setCost("");
        setEditingStrategy(null);
    };

    const openNew = () => {
        resetForm();
        setIsNewOpen(true);
    };

    const openEdit = (strategy: any) => {
        setEditingStrategy(strategy);
        setTitle(strategy.title);
        setDescription(strategy.description || "");
        setResourceRequirements(strategy.resourceRequirements || "");
        setBenefits(strategy.benefits || "");
        setCost(strategy.estimatedCost || "");
        setIsNewOpen(true);
    };

    const handleSave = () => {
        if (!title) return;

        if (editingStrategy) {
            updateStrategy.mutate({
                id: editingStrategy.id,
                title,
                description,
                resourceRequirements,
                estimatedCost: cost,
                benefits,
            });
        } else {
            createStrategy.mutate({
                clientId,
                title,
                description,
                resourceRequirements,
                estimatedCost: cost,
                benefits,
            });
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation(); // Prevent row click
        if (confirm("Are you sure you want to delete this strategy?")) {
            deleteStrategy.mutate({ id });
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 w-full max-w-full p-6">
                <div className="mb-2">
                    <Breadcrumb
                        items={[
                            { label: "Clients", href: "/clients" },
                            { label: "Business Continuity", href: `/clients/${clientId}/business-continuity` },
                            { label: "Strategies", href: `/clients/${clientId}/business-continuity/strategies` },
                        ]}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 -ml-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setLocation(`/clients/${clientId}/business-continuity`)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to BC Dashboard
                    </Button>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Recovery Strategies</h1>
                        <p className="text-muted-foreground mt-2">
                            Define and manage strategies to recover critical activities.
                        </p>
                    </div>
                    <Dialog open={isNewOpen} onOpenChange={(open) => {
                        setIsNewOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={openNew}>
                                <Plus className="mr-2 h-4 w-4" /> New Strategy
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px]">
                            <DialogHeader>
                                <DialogTitle>{editingStrategy ? "Edit Strategy" : "Define Recovery Strategy"}</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="title">Strategy Title *</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g., Cloud Failover to Secondary Region"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="font-medium"
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Detailed description of the strategy..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="resources">Resource Requirements</Label>
                                    <Textarea
                                        id="resources"
                                        placeholder="People, tech, data needs..."
                                        value={resourceRequirements}
                                        onChange={(e) => setResourceRequirements(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="benefits">Benefits / Mitigation</Label>
                                    <Textarea
                                        id="benefits"
                                        placeholder="Expected RTO reduction, risk mitigation..."
                                        value={benefits}
                                        onChange={(e) => setBenefits(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cost">Estimated Cost</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                        <Input
                                            id="cost"
                                            className="pl-9"
                                            placeholder="e.g., $5,000 / month"
                                            value={cost}
                                            onChange={(e) => setCost(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsNewOpen(false)}>Cancel</Button>
                                <Button onClick={handleSave} disabled={createStrategy.isPending || updateStrategy.isPending}>
                                    {createStrategy.isPending || updateStrategy.isPending ? "Saving..." : (editingStrategy ? "Save Changes" : "Create Strategy")}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid md:grid-cols-1 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Strategy Portfolio</CardTitle>
                            <CardDescription>
                                List of strategies evaluated and approved for implementation.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                            <TableHead className="w-[300px] text-white font-semibold py-4">Strategy</TableHead>
                                            <TableHead className="text-white font-semibold py-4">Resources & Benefits</TableHead>
                                            <TableHead className="text-white font-semibold py-4">Cost</TableHead>
                                            <TableHead className="text-white font-semibold py-4">Status</TableHead>
                                            <TableHead className="w-[100px] text-white font-semibold py-4 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {strategies?.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12 bg-white">
                                                    <div className="flex flex-col items-center justify-center text-gray-500">
                                                        <Shield className="h-12 w-12 mb-4 bg-slate-100 p-2 rounded-full" />
                                                        <p>No strategies defined yet.</p>
                                                        <Button variant="link" onClick={openNew}>Create your first strategy</Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {strategies?.map((strat) => (
                                            <TableRow
                                                key={strat.id}
                                                className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group cursor-pointer"
                                                onClick={() => openEdit(strat)}
                                            >
                                                <TableCell className="py-4">
                                                    <div className="font-semibold text-black">{strat.title}</div>
                                                    <div className="text-sm text-gray-500 mt-1 line-clamp-2">{strat.description}</div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="text-sm space-y-1">
                                                        {strat.resourceRequirements && (
                                                            <div className="flex items-start gap-1">
                                                                <Target className="w-3 h-3 mt-1 text-slate-400" />
                                                                <span className="text-gray-500">{strat.resourceRequirements}</span>
                                                            </div>
                                                        )}
                                                        {strat.benefits && (
                                                            <div className="flex items-start gap-1">
                                                                <Check className="w-3 h-3 mt-1 text-green-500" />
                                                                <span className="text-gray-500">{strat.benefits}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    {strat.estimatedCost ? (
                                                        <Badge variant="outline" className="font-mono bg-white border-gray-300 text-gray-700">{strat.estimatedCost}</Badge>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Badge className={strat.approvalStatus === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200' : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'}>
                                                        {strat.approvalStatus}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200">
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200" onClick={(e) => handleDelete(e, strat.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
