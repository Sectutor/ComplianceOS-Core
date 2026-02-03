import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Badge } from "@complianceos/ui/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Label } from "@complianceos/ui/ui/label";
import { ArrowRight, Link2, Plus, Trash2, Loader2, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@complianceos/ui/ui/dialog";
import { Checkbox } from "@complianceos/ui/ui/checkbox";

export function ControlMappingsAdmin({ clientId }: { clientId?: number }) {
    const [sourceControlId, setSourceControlId] = useState<number | null>(null);
    const [targetControlId, setTargetControlId] = useState<number | null>(null);
    const [mappingType, setMappingType] = useState<"equivalent" | "partial" | "related">("equivalent");
    const [notes, setNotes] = useState("");

    // Auto-Map State
    const [sourceFramework, setSourceFramework] = useState<string>("");
    const [targetFramework, setTargetFramework] = useState<string>("");
    const [suggestedMappings, setSuggestedMappings] = useState<any[]>([]);
    const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    // Fetch all controls for selection, including custom library if clientId is present
    const { data: controls = [], isLoading: loadingControls } = trpc.controls.list.useQuery({
        framework: "all",
        clientId
    });
    const controlsArray = Array.isArray(controls) ? controls : [];

    // Extract Unique Frameworks
    const uniqueFrameworks = useMemo(() => {
        const frameworks = new Set(controlsArray.map(c => c.framework).filter(Boolean));
        return Array.from(frameworks).sort();
    }, [controlsArray]);

    // Fetch all mappings
    const { data: mappings = [], isLoading: loadingMappings, refetch } = trpc.compliance.frameworkMappings.list.useQuery({});

    const createMutation = trpc.compliance.frameworkMappings.create.useMutation({
        onSuccess: () => {
            toast.success("Mapping created successfully");
            setSourceControlId(null);
            setTargetControlId(null);
            setNotes("");
            refetch();
        },
        onError: (error) => toast.error(error.message),
    });

    const deleteMutation = trpc.compliance.frameworkMappings.delete.useMutation({
        onSuccess: () => {
            toast.success("Mapping deleted");
            refetch();
        },
        onError: (error) => toast.error(error.message),
    });

    const bulkCreateMutation = trpc.compliance.frameworkMappings.bulkCreate.useMutation({
        onSuccess: (data) => {
            toast.success(`Successfully saved ${data.count} mappings.`);
            setSuggestedMappings([]);
            setSelectedSuggestions(new Set());
            setIsReviewOpen(false);
            refetch();
        },
        onError: (error) => toast.error("Failed to save mappings: " + error.message)
    });

    const autoMapMutation = trpc.compliance.frameworkMappings.autoMapControls.useMutation({
        onSuccess: (data) => {
            setSuggestedMappings(data);
            // Select all by default
            setSelectedSuggestions(new Set(data.map((_, i) => i)));
            setIsReviewOpen(true);
            toast.success(`AI found ${data.length} potential mappings`);
        },
        onError: (error) => toast.error("Auto-Map Failed: " + error.message)
    });

    const getControlById = (id: number) => controlsArray.find(c => c.id === id);

    const handleCreate = () => {
        if (!sourceControlId || !targetControlId) {
            toast.error("Please select both source and target controls");
            return;
        }
        if (sourceControlId === targetControlId) {
            toast.error("Source and target cannot be the same control");
            return;
        }
        createMutation.mutate({
            sourceControlId,
            targetControlId,
            mappingType,
            notes: notes || undefined,
        });
    };

    const handleAutoMap = async () => {
        if (!sourceFramework) {
            toast.error("Please select a Source framework.");
            return;
        }
        if (!targetFramework) {
            toast.error("Please select a Target framework.");
            return;
        }

        if (targetFramework === "all_frameworks") {
            // Multi-Framework Logic
            const targets = uniqueFrameworks.filter(f => f !== sourceFramework);
            if (targets.length === 0) {
                toast.error("No other frameworks available to map against.");
                return;
            }

            let allSuggestions: any[] = [];
            let processedCount = 0;

            // Show initial loading toast
            const toastId = toast.loading(`Harmonizing ${sourceFramework} with ${targets.length} frameworks...`);

            try {
                for (const target of targets) {
                    try {
                        const result = await autoMapMutation.mutateAsync({ sourceFramework, targetFramework: target });
                        if (result && Array.isArray(result)) {
                            allSuggestions = [...allSuggestions, ...result];
                        }
                        processedCount++;
                        // Update toast via a new message (Sonner doesn't support direct update easily without ID in this version)
                    } catch (e) {
                        console.error(`Failed to map ${sourceFramework} -> ${target}`, e);
                    }
                }

                toast.dismiss(toastId);

                if (allSuggestions.length > 0) {
                    setSuggestedMappings(allSuggestions);
                    setSelectedSuggestions(new Set(allSuggestions.map((_, i) => i)));
                    setIsReviewOpen(true);
                    toast.success(`Harmonization complete! AI found ${allSuggestions.length} mappings across ${processedCount} frameworks.`);
                } else {
                    toast.info(`Harmonization complete, but no high-confidence mappings were found.`);
                }
            } catch (err) {
                toast.dismiss(toastId);
                toast.error("Harmonization process encountered an error.");
            }

        } else {
            // Single Framework Logic (Original)
            if (sourceFramework === targetFramework) {
                toast.error("Source and Target frameworks must be different.");
                return;
            }
            autoMapMutation.mutate({ sourceFramework, targetFramework });
        }
    };

    const handleSaveSuggestions = async () => {
        if (selectedSuggestions.size === 0) {
            setIsReviewOpen(false);
            return;
        }

        const mappingsToCreate = Array.from(selectedSuggestions).map(index => {
            const suggestion = suggestedMappings[index];
            return {
                sourceControlId: suggestion.sourceId,
                targetControlId: suggestion.targetId,
                mappingType: suggestion.mappingType,
                confidence: suggestion.confidence.toString(),
                notes: `AI Auto-Map (Semantic Similarity: ${suggestion.confidence}%)`
            };
        });

        bulkCreateMutation.mutate(mappingsToCreate);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-primary" />
                    Cross-Framework Control Mappings
                </CardTitle>
                <CardDescription>
                    Map equivalent controls across frameworks to reduce redundant compliance work.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* AI Auto-Map Section */}
                <div className="border rounded-lg p-4 bg-primary/5 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <h4 className="font-medium text-purple-900">AI Framework Auto-Mapper</h4>
                        <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-700 border-purple-200">
                            Semantic Analysis
                        </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Source Framework</Label>
                            <Select value={sourceFramework} onValueChange={setSourceFramework}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select Framework..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_frameworks" className="font-bold text-purple-700 bg-purple-50">
                                        ✨ All Existing Frameworks (Harmonize Library)
                                    </SelectItem>
                                    {uniqueFrameworks.map(f => (
                                        <SelectItem key={f} value={f}>{f}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Target Framework</Label>
                            <Select value={targetFramework} onValueChange={setTargetFramework}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select Framework..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {uniqueFrameworks.map(f => (
                                        <SelectItem key={f} value={f}>{f}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={handleAutoMap}
                            disabled={autoMapMutation.isPending || loadingControls}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {autoMapMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                            Auto-Map Controls
                        </Button>
                    </div>
                </div>

                {/* Create New Mapping */}
                <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
                    <h4 className="font-medium">Manual Mapping</h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Source Control</Label>
                            <Select
                                value={sourceControlId?.toString() || ""}
                                onValueChange={(v) => setSourceControlId(parseInt(v))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select control..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {controlsArray.filter(c => !sourceFramework || c.framework === sourceFramework).map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            <span className="font-mono text-xs">{c.controlId}</span>
                                            <span className="ml-2 text-muted-foreground text-xs">({c.framework})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-center">
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Target Control</Label>
                            <Select
                                value={targetControlId?.toString() || ""}
                                onValueChange={(v) => setTargetControlId(parseInt(v))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select control..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {controlsArray.filter(c => !targetFramework || c.framework === targetFramework).map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            <span className="font-mono text-xs">{c.controlId}</span>
                                            <span className="ml-2 text-muted-foreground text-xs">({c.framework})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Relationship Type</Label>
                            <Select value={mappingType} onValueChange={(v: any) => setMappingType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="equivalent">
                                        <Badge variant="default" className="bg-green-600">Equivalent</Badge>
                                    </SelectItem>
                                    <SelectItem value="partial">
                                        <Badge variant="default" className="bg-yellow-600">Partial</Badge>
                                    </SelectItem>
                                    <SelectItem value="related">
                                        <Badge variant="default" className="bg-blue-600">Related</Badge>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={handleCreate} disabled={createMutation.isPending}>
                            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                            Add
                        </Button>
                    </div>

                    <div>
                        <Label className="text-xs">Notes (Optional)</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g., Both controls address access management for privileged accounts."
                            className="h-16 mt-1.5"
                        />
                    </div>
                </div>

                {/* Existing Mappings */}
                <div>
                    <h4 className="font-medium mb-3">Existing Mappings ({(mappings as any[]).length})</h4>
                    {loadingMappings ? (
                        <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : (mappings as any[]).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border rounded-lg">
                            No control mappings defined yet.
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                        <TableHead className="text-white font-semibold py-4">Source Control</TableHead>
                                        <TableHead className="w-[100px] text-center text-white font-semibold py-4">Type</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Target Control</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Notes</TableHead>
                                        <TableHead className="w-[60px] text-white font-semibold py-4"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(mappings as any[]).map((mapping) => {
                                        const source = getControlById(mapping.sourceControlId);
                                        const target = getControlById(mapping.targetControlId);
                                        return (
                                            <TableRow key={mapping.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                                                <TableCell className="py-4">
                                                    <div className="font-mono text-sm text-black">{source?.controlId || `ID:${mapping.sourceControlId}`}</div>
                                                    <div className="text-xs text-gray-500">{source?.framework} - {source?.name?.substring(0, 30)}...</div>
                                                </TableCell>
                                                <TableCell className="text-center py-4">
                                                    <Badge className={
                                                        mapping.mappingType === 'equivalent' ? 'bg-green-600' :
                                                            mapping.mappingType === 'partial' ? 'bg-yellow-600' :
                                                                'bg-blue-600'
                                                    }>
                                                        {mapping.mappingType}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="font-mono text-sm text-black">{target?.controlId || `ID:${mapping.targetControlId}`}</div>
                                                    <div className="text-xs text-gray-500">{target?.framework} - {target?.name?.substring(0, 30)}...</div>
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-500 max-w-[200px] truncate py-4">
                                                    {mapping.notes || '-'}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                                                        onClick={() => deleteMutation.mutate({ id: mapping.id })}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </CardContent>

            {/* AI Review Dialog */}
            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Review AI Suggested Mappings</DialogTitle>
                        <DialogDescription>
                            The AI has analyzed controls from <strong>{sourceFramework}</strong> and <strong>{targetFramework}</strong> and found the following matches. Please review and select the ones you want to save.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                    <TableHead className="w-[50px] text-white font-semibold py-4">
                                        <Checkbox
                                            checked={selectedSuggestions.size === suggestedMappings.length && suggestedMappings.length > 0}
                                            onCheckedChange={(checked) => {
                                                if (checked) setSelectedSuggestions(new Set(suggestedMappings.map((_, i) => i)));
                                                else setSelectedSuggestions(new Set());
                                            }}
                                        />
                                    </TableHead>
                                    <TableHead className="text-white font-semibold py-4">Source Control</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Target Control</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Type</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Confidence</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suggestedMappings.map((suggestion, index) => {
                                    const source = getControlById(suggestion.sourceId);
                                    const target = getControlById(suggestion.targetId);
                                    return (
                                        <TableRow key={index} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                                            <TableCell className="py-4">
                                                <Checkbox
                                                    checked={selectedSuggestions.has(index)}
                                                    onCheckedChange={(checked) => {
                                                        const newSet = new Set(selectedSuggestions);
                                                        if (checked) newSet.add(index);
                                                        else newSet.delete(index);
                                                        setSelectedSuggestions(newSet);
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="font-mono font-medium text-xs text-black">{source?.controlId}</div>
                                                <div className="text-sm text-gray-600">{source?.name}</div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="font-mono font-medium text-xs text-black">{target?.controlId}</div>
                                                <div className="text-sm text-gray-600">{target?.name}</div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge variant="outline" className="capitalize bg-white border-gray-300 text-gray-700">{suggestion.mappingType}</Badge>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge variant={suggestion.confidence > 80 ? "default" : "secondary"}>
                                                    {suggestion.confidence}%
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSuggestions}>
                            <Check className="mr-2 h-4 w-4" />
                            Save {selectedSuggestions.size} Mappings
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
