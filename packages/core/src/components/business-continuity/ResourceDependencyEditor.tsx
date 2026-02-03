
import React, { useState } from 'react';
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Loader2, Plus, Trash2, Server, Users, Building, Truck, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { toast } from "sonner";

interface ResourceDependencyEditorProps {
    processId: number;
    dependencies: any[]; // In a real app, strict type this
    onUpdate: () => void;
}

export function ResourceDependencyEditor({ processId, dependencies, onUpdate }: ResourceDependencyEditorProps) {
    const addMutation = trpc.businessContinuity.processes.addDependency.useMutation();
    const removeMutation = trpc.businessContinuity.processes.removeDependency.useMutation();

    const [form, setForm] = useState({
        type: 'it_system',
        name: '',
        criticality: 'medium',
        notes: ''
    });

    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        if (!form.name) return;
        setIsAdding(true);
        try {
            await addMutation.mutateAsync({
                processId,
                dependencyType: form.type,
                dependencyName: form.name,
                criticality: form.criticality,
                notes: form.notes
            });
            toast.success("Dependency added");
            setForm({ ...form, name: '', notes: '' });
            onUpdate();
        } catch (e) {
            toast.error("Failed to add dependency");
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemove = async (id: number) => {
        try {
            await removeMutation.mutateAsync({ id });
            toast.success("Dependency removed");
            onUpdate();
        } catch (e) {
            toast.error("Failed to remove dependency");
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'upstream_process': return <ArrowUpRight className="w-4 h-4" />;
            case 'downstream_process': return <ArrowDownLeft className="w-4 h-4" />;
            case 'it_system': return <Server className="w-4 h-4" />;
            case 'vendor': return <Truck className="w-4 h-4" />;
            case 'people': return <Users className="w-4 h-4" />;
            case 'facility': return <Building className="w-4 h-4" />;
            default: return <Server className="w-4 h-4" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'upstream_process': return 'Upstream Process (Input)';
            case 'downstream_process': return 'Downstream Process (Output)';
            case 'it_system': return 'IT System / Application';
            case 'vendor': return 'Third Party / Vendor';
            case 'people': return 'Key Personnel / Teams';
            case 'facility': return 'Facility / Location';
            default: return type;
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-dashed border-2">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-medium">Add New Dependency</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-3 space-y-2">
                            <Label>Resource Type</Label>
                            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="it_system">IT System</SelectItem>
                                    <SelectItem value="vendor">Vendor</SelectItem>
                                    <SelectItem value="people">People/Team</SelectItem>
                                    <SelectItem value="facility">Facility</SelectItem>
                                    <SelectItem value="upstream_process">Upstream Process</SelectItem>
                                    <SelectItem value="downstream_process">Downstream Process</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-4 space-y-2">
                            <Label>Name / Reference</Label>
                            <Input
                                placeholder="e.g. ERP System, AWS, HR Team..."
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                            <Label>Criticality</Label>
                            <Select value={form.criticality} onValueChange={(v) => setForm({ ...form, criticality: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="critical">Critical</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2">
                            <Button className="w-full" onClick={handleAdd} disabled={isAdding || !form.name}>
                                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                Add
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Mapped Dependencies</h3>
                {dependencies.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground border rounded-lg bg-slate-50">
                        No dependencies mapped yet. Add resources above.
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                    {dependencies.map((dep) => (
                        <div key={dep.id} className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full bg-slate-100 text-slate-600`}>
                                    {getTypeIcon(dep.dependencyType)}
                                </div>
                                <div>
                                    <div className="font-medium">{dep.dependencyName}</div>
                                    <div className="text-xs text-muted-foreground flex gap-2 items-center">
                                        <span>{getTypeLabel(dep.dependencyType)}</span>
                                        <span className="text-slate-300">•</span>
                                        <span>{dep.notes || "No notes"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge variant={dep.criticality === 'critical' || dep.criticality === 'high' ? 'destructive' : 'secondary'}>
                                    {dep.criticality || 'medium'}
                                </Badge>
                                <Button variant="ghost" size="icon" onClick={() => handleRemove(dep.id)} className="text-muted-foreground hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
