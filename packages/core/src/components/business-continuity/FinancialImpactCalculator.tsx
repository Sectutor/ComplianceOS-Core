
import React, { useState } from 'react';
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Plus, Trash, DollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@complianceos/ui/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { toast } from "sonner";

export function FinancialImpactCalculator({ biaId }: { biaId: number }) {
    const { data: impacts, refetch } = trpc.businessContinuity.bia.getFinancialImpacts.useQuery({ biaId });
    const createMutation = trpc.businessContinuity.bia.saveFinancialImpact.useMutation();

    const [form, setForm] = useState({
        lossCategory: 'Revenue',
        amountPerUnit: 0,
        unit: 'Hour',
        description: ''
    });

    const handleAdd = async () => {
        if (!form.amountPerUnit) return;
        try {
            await createMutation.mutateAsync({
                biaId,
                lossCategory: form.lossCategory,
                amountPerUnit: form.amountPerUnit,
                unit: form.unit,
                description: form.description
            });
            toast.success("Added financial impact");
            setForm({ ...form, amountPerUnit: 0, description: '' });
            refetch();
        } catch (e) {
            toast.error("Failed to add impact");
        }
    };

    const totalPerHour = impacts?.filter(i => i.unit === 'Hour').reduce((acc, i) => acc + (i.amountPerUnit || 0), 0) || 0;
    const totalPerDay = impacts?.filter(i => i.unit === 'Day').reduce((acc, i) => acc + (i.amountPerUnit || 0), 0) || 0;

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Est. Impact per Hour</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalPerHour.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Est. Impact per Day</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(totalPerHour * 24 + totalPerDay).toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Add Financial Impact Factor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={form.lossCategory} onValueChange={(v) => setForm({ ...form, lossCategory: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Revenue">Revenue Loss</SelectItem>
                                    <SelectItem value="Productivity">Productivity Loss</SelectItem>
                                    <SelectItem value="Penalty">Regulatory Fines</SelectItem>
                                    <SelectItem value="Recovery">Recovery Costs</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Amount ($)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-8"
                                    type="number"
                                    value={form.amountPerUnit || ''}
                                    onChange={e => setForm({ ...form, amountPerUnit: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Per Unit</Label>
                            <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Hour">Per Hour</SelectItem>
                                    <SelectItem value="Day">Per Day</SelectItem>
                                    <SelectItem value="Event">Flat (One-time)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button className="w-full" onClick={handleAdd} disabled={createMutation.isPending}>
                                <Plus className="mr-2 h-4 w-4" /> Add
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                            <TableHead className="text-white font-semibold py-4">Category</TableHead>
                            <TableHead className="text-white font-semibold py-4">Impact</TableHead>
                            <TableHead className="text-white font-semibold py-4">Frequency</TableHead>
                            <TableHead className="text-white font-semibold py-4">Description</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {impacts?.map(item => (
                            <TableRow key={item.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                                <TableCell className="text-black py-4">{item.lossCategory}</TableCell>
                                <TableCell className="font-medium text-black py-4">${item.amountPerUnit?.toLocaleString()}</TableCell>
                                <TableCell className="text-gray-600 py-4">{item.unit}</TableCell>
                                <TableCell className="text-gray-500 py-4">{item.description || '-'}</TableCell>
                            </TableRow>
                        ))}
                        {impacts?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-6 text-gray-500 bg-white">
                                    No financial impacts defined.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
