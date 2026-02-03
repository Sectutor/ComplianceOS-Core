
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Input } from "@complianceos/ui/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@complianceos/ui/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import { toast } from "sonner";
import { ShieldAlert, Save, Plus, Trash2, Info } from "lucide-react";

interface InfoType {
    type: string;
    description: string;
    confidentiality: 'low' | 'moderate' | 'high';
    integrity: 'low' | 'moderate' | 'high';
    availability: 'low' | 'moderate' | 'high';
}

export default function FipsCategorizationPage() {
    const params = useParams();
    const clientId = Number(params.id);

    const { data: existingData, refetch } = trpc.federal.getFipsCategorization.useQuery({ clientId });
    const saveMutation = trpc.federal.saveFipsCategorization.useMutation();

    const [systemName, setSystemName] = useState(existingData?.systemName || "");
    const [infoTypes, setInfoTypes] = useState<InfoType[]>(existingData?.informationTypes || [
        { type: "PII", description: "Personally Identifiable Information", confidentiality: 'moderate', integrity: 'moderate', availability: 'moderate' }
    ]);

    const handleAddType = () => {
        setInfoTypes([...infoTypes, { type: "", description: "", confidentiality: 'low', integrity: 'low', availability: 'low' }]);
    };

    const handleRemoveType = (idx: number) => {
        setInfoTypes(infoTypes.filter((_, i) => i !== idx));
    };

    const updateType = (idx: number, field: keyof InfoType, value: string) => {
        const newTypes = [...infoTypes];
        newTypes[idx] = { ...newTypes[idx], [field]: value };
        setInfoTypes(newTypes);
    };

    const calculateHighWaterMark = () => {
        const impactLevels = { 'low': 1, 'moderate': 2, 'high': 3 };
        const reverseLevels = { 1: 'Low', 2: 'Moderate', 3: 'High' };

        let maxConf = 1;
        let maxInt = 1;
        let maxAvail = 1;

        infoTypes.forEach(t => {
            maxConf = Math.max(maxConf, impactLevels[t.confidentiality]);
            maxInt = Math.max(maxInt, impactLevels[t.integrity]);
            maxAvail = Math.max(maxAvail, impactLevels[t.availability]);
        });

        const overall = Math.max(maxConf, maxInt, maxAvail);

        return {
            conf: reverseLevels[maxConf as 1 | 2 | 3],
            int: reverseLevels[maxInt as 1 | 2 | 3],
            avail: reverseLevels[maxAvail as 1 | 2 | 3],
            overall: reverseLevels[overall as 1 | 2 | 3]
        };
    };

    const results = calculateHighWaterMark();

    const handleSave = async () => {
        try {
            await saveMutation.mutateAsync({
                clientId,
                systemName,
                informationTypes: infoTypes,
                confidentialityImpact: results.conf,
                integrityImpact: results.int,
                availabilityImpact: results.avail,
                highWaterMark: results.overall,
                status: 'final'
            });
            toast.success("Categorization saved successfully");
            refetch();
        } catch (error) {
            toast.error("Failed to save categorization");
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-6 w-full">
                <Breadcrumb items={[
                    { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                    { label: "Federal Hub", href: `/clients/${clientId}/federal` },
                    { label: "FIPS 199 Categorization" }
                ]} />

                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">FIPS 199 Categorization</h1>
                        <p className="text-slate-500">Determine the security impact level of your system.</p>
                    </div>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 font-bold gap-2 h-11 px-6 shadow-lg shadow-blue-100">
                        <Save className="h-4 w-4" /> Save Categorization
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="border-slate-200">
                            <CardHeader>
                                <CardTitle className="text-xl">System Information</CardTitle>
                                <CardDescription>Basic identification for the system being categorized.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">System Name</label>
                                    <Input
                                        placeholder="e.g. Corporate ERP System"
                                        value={systemName}
                                        onChange={(e) => setSystemName(e.target.value)}
                                        className="h-11"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                                <div>
                                    <CardTitle className="text-xl">Information Types</CardTitle>
                                    <CardDescription>Select and assess information types processed by the system.</CardDescription>
                                </div>
                                <Button onClick={handleAddType} variant="outline" size="sm" className="gap-2 border-slate-200 font-bold">
                                    <Plus className="h-4 w-4" /> Add Type
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 border-slate-200 hover:bg-slate-50">
                                            <TableHead className="font-bold text-slate-700">Information Type</TableHead>
                                            <TableHead className="font-bold text-slate-700">Confidentiality</TableHead>
                                            <TableHead className="font-bold text-slate-700">Integrity</TableHead>
                                            <TableHead className="font-bold text-slate-700">Availability</TableHead>
                                            <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {infoTypes.map((type, idx) => (
                                            <TableRow key={idx} className="border-slate-100 odd:bg-white even:bg-slate-50/30">
                                                <TableCell className="py-4">
                                                    <Input
                                                        value={type.type}
                                                        onChange={(e) => updateType(idx, 'type', e.target.value)}
                                                        placeholder="Type"
                                                        className="h-9 mb-1"
                                                    />
                                                    <Input
                                                        value={type.description}
                                                        onChange={(e) => updateType(idx, 'description', e.target.value)}
                                                        placeholder="Description"
                                                        className="h-8 text-xs text-slate-500"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <ImpactSelect value={type.confidentiality} onChange={(v) => updateType(idx, 'confidentiality', v)} />
                                                </TableCell>
                                                <TableCell>
                                                    <ImpactSelect value={type.integrity} onChange={(v) => updateType(idx, 'integrity', v)} />
                                                </TableCell>
                                                <TableCell>
                                                    <ImpactSelect value={type.availability} onChange={(v) => updateType(idx, 'availability', v)} />
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveType(idx)} className="text-slate-400 hover:text-red-600">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="bg-slate-900 text-white border-none shadow-2xl sticky top-8 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-blue-600/20 rounded-full blur-3xl" />
                            <CardHeader className="relative">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <ShieldAlert className="h-5 w-5 text-blue-400" />
                                    Categorization Result
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-8 relative">
                                <div className="space-y-4">
                                    <ImpactResult label="Confidentiality" value={results.conf} />
                                    <ImpactResult label="Integrity" value={results.int} />
                                    <ImpactResult label="Availability" value={results.avail} />
                                </div>

                                <div className="pt-8 border-t border-slate-800">
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">High Water Mark</p>
                                    <div className="flex items-center gap-4">
                                        <div className="text-5xl font-black text-blue-400 tracking-tighter">{results.overall}</div>
                                        <div className="text-xs text-slate-400 leading-snug">
                                            Based on Information System <br /> impact analysis (FIPS 199).
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-600/10 border border-blue-600/20 p-4 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                                        <Info className="h-3 w-3" />
                                        Next Steps
                                    </div>
                                    <p className="text-xs text-slate-300">
                                        This categorization determines the baseline of NIST 800-171 controls required for your SSP.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function ImpactSelect({ value, onChange }: { value: string, onChange: (v: string) => void }) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="h-9 w-32 border-slate-200">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="high">High</SelectItem>
            </SelectContent>
        </Select>
    );
}

function ImpactResult({ label, value }: { label: string, value: string }) {
    const colors: Record<string, string> = {
        'Low': 'bg-emerald-500',
        'Moderate': 'bg-amber-500',
        'High': 'bg-rose-500'
    };

    return (
        <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm font-medium">{label}</span>
            <div className="flex items-center gap-3">
                <span className="font-bold text-sm">{value}</span>
                <div className={`h-2 w-12 rounded-full ${colors[value] || 'bg-slate-700'}`} />
            </div>
        </div>
    );
}

