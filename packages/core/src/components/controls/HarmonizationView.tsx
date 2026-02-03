
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { ArrowRight, Link as LinkIcon, Sparkles, Loader2, Trash2, CheckCircle2, ShieldCheck, Target, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@complianceos/ui/ui/dialog";
import { Checkbox } from "@complianceos/ui/ui/checkbox";

export function HarmonizationView() {
    const [sourceFramework, setSourceFramework] = useState<string>("ISO 27001");
    const [targetFramework, setTargetFramework] = useState<string>("SOC 2");

    const [sourceControlId, setSourceControlId] = useState<string>("");
    const [targetControlId, setTargetControlId] = useState<string>("");

    // Auto-Map State
    const [openAutoMap, setOpenAutoMap] = useState(false);
    const [autoSource, setAutoSource] = useState<string>("ISO 27001");
    const [autoTarget, setAutoTarget] = useState<string>("SOC 2");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

    const [isAiAnalyzeOpen, setIsAiAnalyzeOpen] = useState(false);
    const [selectedMapping, setSelectedMapping] = useState<any>(null);

    // Fetch available frameworks
    const { data: availableFrameworks } = trpc.controls.getAvailableFrameworks.useQuery();

    // Fetch Controls for Source
    const { data: sourceControls } = trpc.controls.listPaginated.useQuery({
        framework: sourceFramework,
        limit: 100,
    }, { enabled: !!sourceFramework });

    // Fetch Controls for Target
    const { data: targetControls } = trpc.controls.listPaginated.useQuery({
        framework: targetFramework,
        limit: 100,
    }, { enabled: !!targetFramework });

    // Fetch Existing Mappings
    const { data: mappings, refetch: refetchMappings } = trpc.compliance.frameworkMappings.list.useQuery({});

    const createMapping = trpc.compliance.frameworkMappings.create.useMutation({
        onSuccess: () => {
            toast.success("Mapping created successfully");
            refetchMappings();
            // setSourceControlId(""); // Keep source selected for multi-target mapping
            setTargetControlId("");
        },
        onError: (e) => toast.error(e.message)
    });

    const deleteMapping = trpc.compliance.frameworkMappings.delete.useMutation({
        onSuccess: () => {
            toast.success("Mapping deleted");
            refetchMappings();
        }
    });

    const autoMapControls = trpc.compliance.frameworkMappings.autoMapControls.useMutation({
        onSuccess: (data: any) => {
            setSuggestions(data);
            setSelectedSuggestions(new Set(data.map((_: any, i: number) => i))); // Select all by default
            toast.success(`AI found ${data.length} potential mappings`);
        },
        onError: (e) => toast.error(e.message)
    });

    const bulkCreateMappings = trpc.compliance.frameworkMappings.bulkCreate.useMutation({
        onSuccess: (data) => {
            toast.success(`Successfully created ${data.count} mappings`);
            setOpenAutoMap(false);
            setSuggestions([]);
            refetchMappings();
        },
        onError: (e) => toast.error(e.message)
    });

    const groupedMappings = useMemo(() => {
        if (!mappings) return [];
        const groups = new Map();
        mappings.forEach((m: any) => {
            // Use composite key or just source ID.
            // Since we want to group by "Master Rule", we group by source ID.
            if (!groups.has(m.sourceControlId)) {
                groups.set(m.sourceControlId, {
                    source: { 
                        id: m.sourceControlId, 
                        code: m.sourceControlCode, 
                        name: m.sourceControlName, 
                        framework: m.sourceFramework 
                    },
                    targets: []
                });
            }
            groups.get(m.sourceControlId).targets.push(m);
        });
        return Array.from(groups.values());
    }, [mappings]);

    const handleCreateMapping = () => {
        if (!sourceControlId || !targetControlId) {
            toast.error("Please select both controls");
            return;
        }
        createMapping.mutate({
            sourceControlId: parseInt(sourceControlId),
            targetControlId: parseInt(targetControlId),
            mappingType: 'equivalent',
            confidence: '100',
            notes: 'Manually mapped'
        });
    };

    const handleRunAutoMap = () => {
        autoMapControls.mutate({
            sourceFramework: autoSource,
            targetFramework: autoTarget,
            save: false
        });
    };

    const handleApplyAutoMap = () => {
        const toCreate = suggestions.filter((_, i) => selectedSuggestions.has(i)).map(s => ({
            sourceControlId: s.sourceId,
            targetControlId: s.targetId,
            mappingType: s.mappingType,
            confidence: s.confidence.toString(),
            notes: `Auto-mapped by AI (${s.confidence}%)`
        }));

        if (toCreate.length === 0) return;
        bulkCreateMappings.mutate(toCreate);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Mapping Creator */}
                <Card className="lg:col-span-3 border-dashed border-2 bg-slate-50/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <LinkIcon className="h-5 w-5 text-primary" />
                                Harmonization Engine
                            </CardTitle>
                            <CardDescription>Define your Master Controls and map them to multiple compliance requirements.</CardDescription>
                        </div>
                        <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => setOpenAutoMap(true)}>
                            <Wand2 className="mr-2 h-4 w-4" />
                            AI Auto-Map
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-end gap-4">
                            <div className="flex-1 w-full space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                                    <h4 className="font-semibold text-sm text-indigo-900 uppercase tracking-wide">Step 1: Select Master Control</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                    <div className="space-y-2">
                                        <Label>Master Framework</Label>
                                        <Select value={sourceFramework} onValueChange={setSourceFramework}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {availableFrameworks?.map(fw => (
                                                    <SelectItem key={fw} value={fw}>{fw}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Master Control</Label>
                                        <Select value={sourceControlId} onValueChange={setSourceControlId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select master control..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {sourceControls?.items?.map((c: any) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>
                                                        <span className="font-semibold text-indigo-700">{c.controlId}</span>: {c.name.substring(0, 30)}...
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="pb-8 items-center justify-center flex">
                                <ArrowRight className="h-6 w-6 text-slate-300" />
                            </div>

                            <div className="flex-1 w-full space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="h-4 w-4 text-rose-600" />
                                    <h4 className="font-semibold text-sm text-rose-900 uppercase tracking-wide">Step 2: Map Target Requirement</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                    <div className="space-y-2">
                                        <Label>Target Framework</Label>
                                        <Select value={targetFramework} onValueChange={setTargetFramework}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {availableFrameworks?.map(fw => (
                                                    <SelectItem key={fw} value={fw}>{fw}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Target Control</Label>
                                        <Select value={targetControlId} onValueChange={setTargetControlId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select target control..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {targetControls?.items?.map((c: any) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>
                                                        <span className="font-semibold">{c.controlId}</span>: {c.name.substring(0, 30)}...
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="pb-8">
                                <Button onClick={handleCreateMapping} disabled={createMapping.isPending} className="bg-slate-900 hover:bg-slate-800">
                                    {createMapping.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Link"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Mappings List Groupped */}
                <div className="lg:col-span-3">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">Harmonized Controls ({groupedMappings.length})</h3>
                    <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="w-[40%]">Master Control</TableHead>
                                    <TableHead>Mapped Compliance Requirements</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groupedMappings.map((group: any) => (
                                    <TableRow key={group.source.id}>
                                        <TableCell className="align-top">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                                        {group.source.framework}
                                                    </Badge>
                                                    <span className="font-bold text-slate-900">{group.source.code}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 line-clamp-2">
                                                    {group.source.name}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2">
                                                {group.targets.map((t: any) => (
                                                    <div key={t.id} className="flex items-center bg-white border border-slate-200 rounded-md shadow-sm pl-2 pr-1 py-1 group hover:border-slate-300 transition-colors">
                                                        <div className="flex flex-col mr-2">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{t.targetFramework}</span>
                                                            <span className="text-xs font-medium text-slate-900" title={t.targetControlName}>
                                                                {t.targetControlCode}
                                                            </span>
                                                        </div>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => deleteMapping.mutate({ id: t.id })}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <div className="flex items-center justify-center border border-dashed border-slate-300 rounded-md w-8 h-10 hover:bg-slate-50 cursor-pointer transition-colors"
                                                     title="Add another mapping"
                                                     onClick={() => {
                                                         setSourceFramework(group.source.framework);
                                                         setSourceControlId(group.source.id.toString());
                                                         // Scroll to top or highlight input could be nice
                                                         window.scrollTo({ top: 0, behavior: 'smooth' });
                                                     }}
                                                >
                                                    <Sparkles className="h-4 w-4 text-slate-400" />
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {groupedMappings.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center py-12 text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <LinkIcon className="h-8 w-8 text-slate-300" />
                                                <p>No master controls mapped yet.</p>
                                                <p className="text-sm">Select a Master Control above to start building your framework.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Auto-Map Dialog */}
            <Dialog open={openAutoMap} onOpenChange={setOpenAutoMap}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>AI Auto-Mapping</DialogTitle>
                        <DialogDescription>
                            Automatically identify and link equivalent controls between two frameworks using AI.
                        </DialogDescription>
                    </DialogHeader>

                    {!suggestions.length ? (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Master Framework (Source)</Label>
                                    <Select value={autoSource} onValueChange={setAutoSource}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {availableFrameworks?.map(fw => (
                                                <SelectItem key={fw} value={fw}>{fw}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Target Framework</Label>
                                    <Select value={autoTarget} onValueChange={setAutoTarget}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {availableFrameworks?.map(fw => (
                                                <SelectItem key={fw} value={fw}>{fw}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded text-sm text-slate-600">
                                <p>This process will:</p>
                                <ul className="list-disc ml-5 mt-2 space-y-1">
                                    <li>Analyze the text of controls from both frameworks.</li>
                                    <li>Calculate similarity scores (Embeddings + Cosine Similarity).</li>
                                    <li>Suggest high-confidence mappings (&gt;75% match).</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-50 p-3 rounded-md flex items-center gap-2 text-green-700 text-sm">
                                <CheckCircle2 className="h-4 w-4" />
                                Found {suggestions.length} potential mappings.
                            </div>
                            <div className="max-h-[400px] overflow-y-auto border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox 
                                                    checked={selectedSuggestions.size === suggestions.length}
                                                    onCheckedChange={(c) => {
                                                        if(c) setSelectedSuggestions(new Set(suggestions.map((_, i) => i)));
                                                        else setSelectedSuggestions(new Set());
                                                    }}
                                                />
                                            </TableHead>
                                            <TableHead>Control A (Source)</TableHead>
                                            <TableHead>Control B (Target)</TableHead>
                                            <TableHead>Confidence</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {suggestions.map((s: any, idx: number) => (
                                            <TableRow key={idx}>
                                                <TableCell>
                                                    <Checkbox 
                                                        checked={selectedSuggestions.has(idx)}
                                                        onCheckedChange={(c) => {
                                                            const next = new Set(selectedSuggestions);
                                                            if (c) next.add(idx);
                                                            else next.delete(idx);
                                                            setSelectedSuggestions(next);
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    Control #{s.sourceId}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    Control #{s.targetId}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={s.confidence > 90 ? "default" : "secondary"}>
                                                        {s.confidence}%
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {!suggestions.length ? (
                            <Button onClick={handleRunAutoMap} disabled={autoMapControls.isPending}>
                                {autoMapControls.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Analyze Frameworks
                            </Button>
                        ) : (
                            <div className="flex gap-2 w-full justify-end">
                                <Button variant="outline" onClick={() => setSuggestions([])}>Back</Button>
                                <Button onClick={handleApplyAutoMap} disabled={bulkCreateMappings.isPending}>
                                    {bulkCreateMappings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirm {selectedSuggestions.size} Mappings
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
