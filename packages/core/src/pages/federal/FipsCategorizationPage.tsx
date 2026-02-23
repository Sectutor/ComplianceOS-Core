
import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation, useParams } from "wouter";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { ArrowLeft, Lock, ShieldCheck, Save, Loader2, Plus, Trash2, Edit2, Info, CheckCircle2, HelpCircle } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Badge } from "@complianceos/ui/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@complianceos/ui/ui/dialog";
import { Input } from "@complianceos/ui/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Textarea } from "@complianceos/ui/ui/textarea";

const IMPACT_LEVELS = ['Low', 'Moderate', 'High', 'N/A'];

type InfoType = {
    id: string;
    name: string;
    confidentiality: { provisional: string; adjusted: string; rationale: string };
    integrity: { provisional: string; adjusted: string; rationale: string };
    availability: { provisional: string; adjusted: string; rationale: string };
};

export default function FipsCategorizationPage() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [_location, setLocation] = useLocation();

    // State for information types
    const [selectedTypes, setSelectedTypes] = useState<InfoType[]>([]);

    // Overall impacts (calculated or manual override)
    const [overallImpacts, setOverallImpacts] = useState({
        confidentiality: 'Low',
        integrity: 'Low',
        availability: 'Low'
    });

    const [rationales, setRationales] = useState({
        confidentiality: '',
        integrity: '',
        availability: ''
    });

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    // Fetch data
    const { data: categorization, isLoading: isDataLoading } = trpc.federal.getFipsCategorization.useQuery({ clientId });
    const { data: refTypes, isLoading: isRefLoading } = trpc.federal.listFipsInformationTypes.useQuery();
    const utils = trpc.useUtils();

    // Sync state from existing categorization
    useEffect(() => {
        if (categorization) {
            if (categorization.informationTypes) {
                setSelectedTypes(categorization.informationTypes as InfoType[]);
            }
            setOverallImpacts({
                confidentiality: categorization.confidentialityImpact || 'Low',
                integrity: categorization.integrityImpact || 'Low',
                availability: categorization.availabilityImpact || 'Low'
            });
            setRationales({
                confidentiality: categorization.confidentialityRationale || '',
                integrity: categorization.integrityRationale || '',
                availability: categorization.availabilityRationale || ''
            });
        }
    }, [categorization]);

    // Calculate High-Water Mark for each objective across selected types
    const calculatedImpacts = useMemo(() => {
        const result = {
            confidentiality: 'Low',
            integrity: 'Low',
            availability: 'Low'
        };

        if (selectedTypes.length === 0) return result;

        const compare = (a: string, b: string) => {
            const order = { 'Low': 1, 'Moderate': 2, 'High': 3, 'N/A': 0, '': 0 };
            const valA = order[a as keyof typeof order] || 0;
            const valB = order[b as keyof typeof order] || 0;
            return valA >= valB ? a : b;
        };

        selectedTypes.forEach(t => {
            if (t?.confidentiality) {
                result.confidentiality = compare(result.confidentiality, t.confidentiality.adjusted || t.confidentiality.provisional || 'Low');
            }
            if (t?.integrity) {
                result.integrity = compare(result.integrity, t.integrity.adjusted || t.integrity.provisional || 'Low');
            }
            if (t?.availability) {
                result.availability = compare(result.availability, t.availability.adjusted || t.availability.provisional || 'Low');
            }
        });

        return result;
    }, [selectedTypes]);

    // The high-water mark is the highest of the three objectives
    const highWaterMark = useMemo(() => {
        const levels = Object.values(overallImpacts);
        if (levels.includes('High')) return 'High';
        if (levels.includes('Moderate')) return 'Moderate';
        return 'Low';
    }, [overallImpacts]);

    const saveMutation = trpc.federal.saveFipsCategorization.useMutation({
        onSuccess: () => {
            toast.success("FIPS 199 Categorization saved successfully");
            utils.federal.getFipsCategorization.invalidate({ clientId });
        },
        onError: (err) => {
            toast.error("Failed to save categorization", { description: err.message });
        }
    });

    const handleSave = () => {
        saveMutation.mutate({
            clientId,
            informationTypes: selectedTypes,
            confidentialityImpact: overallImpacts.confidentiality,
            integrityImpact: overallImpacts.integrity,
            availabilityImpact: overallImpacts.availability,
            confidentialityRationale: rationales.confidentiality,
            integrityRationale: rationales.integrity,
            availabilityRationale: rationales.availability,
            highWaterMark,
            status: 'completed'
        });
    };

    const addType = (ref: any) => {
        if (selectedTypes.find(t => t.id === ref.code)) {
            toast.error("Information type already added");
            return;
        }

        const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

        setSelectedTypes(prev => [...prev, {
            id: ref.code,
            name: ref.name,
            confidentiality: { provisional: capitalize(ref.provisionalConfidentiality), adjusted: capitalize(ref.provisionalConfidentiality), rationale: '' },
            integrity: { provisional: capitalize(ref.provisionalIntegrity), adjusted: capitalize(ref.provisionalIntegrity), rationale: '' },
            availability: { provisional: capitalize(ref.provisionalAvailability), adjusted: capitalize(ref.provisionalAvailability), rationale: '' },
        }]);
        setIsAddDialogOpen(false);
        toast.success(`Added ${ref.name}`);
    };

    const removeType = (id: string) => {
        setSelectedTypes(prev => prev.filter(t => t.id !== id));
    };

    const updateTypeImpact = (id: string, objective: 'confidentiality' | 'integrity' | 'availability', value: string) => {
        setSelectedTypes(prev => prev.map(t => {
            if (t.id === id) {
                return {
                    ...t,
                    [objective]: { ...t[objective], adjusted: value }
                };
            }
            return t;
        }));
    };

    const filteredRefTypes = useMemo(() => {
        if (!refTypes) return [];
        return refTypes.filter(t =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [refTypes, searchQuery]);

    const getImpactBadgeColor = (level: string) => {
        switch (level) {
            case 'High': return 'bg-red-100 text-red-700 border-red-200';
            case 'Moderate': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Low': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-20 px-6 max-w-7xl mx-auto">
                <Breadcrumb
                    items={[
                        { label: "Federal", href: `/clients/${clientId}/federal` },
                        { label: "FIPS 199 Categorization" },
                    ]}
                />

                <div className="flex items-start justify-between">
                    <div>
                        <Button variant="ghost" className="mb-2 pl-0 hover:pl-2 transition-all" onClick={() => setLocation(`/clients/${clientId}/federal`)}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                        </Button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">FIPS 199 Security Categorization</h1>
                            <Badge variant="outline" className={getImpactBadgeColor(highWaterMark)}>
                                {highWaterMark || 'Calculating...'}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">NIST SP 800-60 based information system categorization workflow.</p>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <Button variant="outline" onClick={() => setIsGuideOpen(true)}>
                            <HelpCircle className="mr-2 h-4 w-4" /> Guide
                        </Button>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Add Info Type
                        </Button>
                        <Button onClick={handleSave} disabled={saveMutation.isPending}>
                            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Progress
                        </Button>
                    </div>
                </div>

                {/* RMF Guide Dialog */}
                <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-blue-600" />
                                FIPS 199 Security Categorization Guide
                            </DialogTitle>
                            <DialogDescription>
                                Phase 1 of the NIST Risk Management Framework (RMF).
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                            <section className="space-y-2">
                                <h4 className="font-bold text-slate-900 border-b pb-1">1. Selecting Information Types</h4>
                                <p className="text-sm text-slate-600">
                                    ComplianceOS includes the full library of <strong>NIST SP 800-60</strong> information types. Each type comes with "Provisional" impact levels (Low, Moderate, or High) for Confidentiality, Integrity, and Availability (the CIA triad).
                                </p>
                            </section>
                            <section className="space-y-2">
                                <h4 className="font-bold text-slate-900 border-b pb-1">2. High-Water Mark Calculation</h4>
                                <p className="text-sm text-slate-600">
                                    The app automatically implements the <strong>High-Water Mark</strong> rule. If you select one information type that is "Low" for Confidentiality and another that is "Moderate," the system's overall Confidentiality impact is automatically set to "Moderate."
                                </p>
                            </section>
                            <section className="space-y-2">
                                <h4 className="font-bold text-slate-900 border-b pb-1">3. Adjustments and Rationales</h4>
                                <p className="text-sm text-slate-600">
                                    Standard NIST values are "provisional." You have the authority to adjust them based on your specific context. However, for every impact level, you <strong>must</strong> provide a rationale justification.
                                </p>
                            </section>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setIsGuideOpen(false)}>Got it</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="grid gap-6">
                    {/* Step 1: Information Types */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle>Step 1: Identify Information Types</CardTitle>
                                <CardDescription>Select the types of information processed, stored, or transmitted by the system.</CardDescription>
                            </div>
                            <Badge variant="secondary">{selectedTypes.length} Types Selected</Badge>
                        </CardHeader>
                        <CardContent>
                            {selectedTypes.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                        <Plus className="text-slate-400" />
                                    </div>
                                    <h3 className="font-medium">No Information Types Added</h3>
                                    <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                                        Start by adding information types from the NIST SP 800-60 catalog.
                                    </p>
                                    <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                                        Open Catalog
                                    </Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type / Code</TableHead>
                                            <TableHead>Confidentiality</TableHead>
                                            <TableHead>Integrity</TableHead>
                                            <TableHead>Availability</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedTypes.map((type) => (
                                            <TableRow key={type.id}>
                                                <TableCell className="font-medium">
                                                    <div>{type.name}</div>
                                                    <div className="text-xs text-muted-foreground font-mono uppercase">{type.id}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Select value={type.confidentiality.adjusted} onValueChange={(v) => updateTypeImpact(type.id, 'confidentiality', v)}>
                                                        <SelectTrigger className="w-[120px]">
                                                            <SelectValue placeholder="Impact" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {IMPACT_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Select value={type.integrity.adjusted} onValueChange={(v) => updateTypeImpact(type.id, 'integrity', v)}>
                                                        <SelectTrigger className="w-[120px]">
                                                            <SelectValue placeholder="Impact" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {IMPACT_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Select value={type.availability.adjusted} onValueChange={(v) => updateTypeImpact(type.id, 'availability', v)}>
                                                        <SelectTrigger className="w-[120px]">
                                                            <SelectValue placeholder="Impact" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {IMPACT_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => removeType(type.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    {/* Step 2: High Water Mark Calculation */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Step 2: Review Calculated Watermark</CardTitle>
                                <CardDescription>Automatic system-level impact derived from information types.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    {['Confidentiality', 'Integrity', 'Availability'].map((obj) => (
                                        <div key={obj} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                                            <span className="font-medium">{obj}</span>
                                            <Badge variant="outline" className={getImpactBadgeColor(calculatedImpacts[obj.toLowerCase() as keyof typeof calculatedImpacts])}>
                                                {calculatedImpacts[obj.toLowerCase() as keyof typeof calculatedImpacts]}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="text-primary w-6 h-6" />
                                        <div>
                                            <div className="text-sm font-medium text-primary">System-Wide Recommendation</div>
                                            <div className="text-xl font-bold">{highWaterMark} Impact</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Step 3: Justify & Finalize</CardTitle>
                                <CardDescription>Final impact levels and rationales (overrides permitted with justification).</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {['Confidentiality', 'Integrity', 'Availability'].map((obj) => (
                                    <div key={obj} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-semibold">{obj} Final Impact</label>
                                            <Select
                                                value={overallImpacts[obj.toLowerCase() as keyof typeof overallImpacts]}
                                                onValueChange={(v) => setOverallImpacts(prev => ({ ...prev, [obj.toLowerCase()]: v }))}
                                            >
                                                <SelectTrigger className="w-[140px] h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {IMPACT_LEVELS.filter(l => l !== 'N/A').map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Textarea
                                            placeholder={`Provide rationale for ${obj} impact level...`}
                                            className="text-xs h-16 resize-none"
                                            value={rationales[obj.toLowerCase() as keyof typeof rationales]}
                                            onChange={(e) => setRationales(prev => ({ ...prev, [obj.toLowerCase()]: e.target.value }))}
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Add Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Information Type Catalog</DialogTitle>
                            <DialogDescription>
                                Search and add NIST SP 800-60 information types to your system boundary.
                            </DialogDescription>
                            <div className="mt-4">
                                <Input
                                    placeholder="Search by name or code..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </DialogHeader>
                        <ScrollArea className="flex-1 mt-4 pr-4">
                            {isRefLoading ? (
                                <div className="flex items-center justify-center p-12">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredRefTypes.map((t) => (
                                        <div key={t.id} className="p-4 border rounded-lg hover:border-primary transition-colors group">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs text-muted-foreground uppercase">{t.code}</span>
                                                        <Badge variant="secondary" className="text-[10px] py-0">{t.category}</Badge>
                                                    </div>
                                                    <h4 className="font-semibold text-sm mt-1">{t.name}</h4>
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                                                    <div className="flex gap-2 mt-3">
                                                        <Badge variant="outline" className="text-[10px] uppercase">C: {t.provisionalConfidentiality}</Badge>
                                                        <Badge variant="outline" className="text-[10px] uppercase">I: {t.provisionalIntegrity}</Badge>
                                                        <Badge variant="outline" className="text-[10px] uppercase">A: {t.provisionalAvailability}</Badge>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => addType(t)}>
                                                    <Plus className="h-4 w-4 mr-1" /> Add
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
