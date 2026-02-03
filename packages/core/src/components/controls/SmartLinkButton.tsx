import { useState } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@complianceos/ui/ui/dialog";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { Badge } from "@complianceos/ui/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function SmartLinkButton() {
    const [open, setOpen] = useState(false);
    const [autoSource, setAutoSource] = useState<string>("ISO 27001");
    const [autoTarget, setAutoTarget] = useState<string>("SOC 2");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

    const { data: availableFrameworksData } = trpc.controls.getAvailableFrameworks.useQuery();
    const availableFrameworks = Array.isArray(availableFrameworksData) ? availableFrameworksData : [];

    const utils = trpc.useContext();

    const autoMapControls = trpc.compliance.frameworkMappings.autoMapControls.useMutation({
        onSuccess: (data: any) => {
            setSuggestions(data);
            setSelectedSuggestions(new Set(data.map((_: any, i: number) => i)));
            toast.success(`AI found ${data.length} potential mappings`);
        },
        onError: (e) => toast.error(e.message)
    });

    const bulkCreateMappings = trpc.compliance.frameworkMappings.bulkCreate.useMutation({
        onSuccess: (data) => {
            toast.success(`Successfully created ${data.count} mappings`);
            setOpen(false);
            setSuggestions([]);
            utils.compliance.frameworkMappings.list.invalidate();
        },
        onError: (e) => toast.error(e.message)
    });

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
        <>
            <Button variant="outline" className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => setOpen(true)}>
                <Sparkles className="h-4 w-4" />
                Smart Link
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
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
                                            {availableFrameworks.map((fw: string) => (
                                                <SelectItem key={fw} value={fw}>{fw}</SelectItem>
                                            ))}
                                            {!availableFrameworks.length && (
                                                <>
                                                    <SelectItem value="ISO 27001">ISO 27001</SelectItem>
                                                    <SelectItem value="SOC 2">SOC 2</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Target Framework</Label>
                                    <Select value={autoTarget} onValueChange={setAutoTarget}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {availableFrameworks.map((fw: string) => (
                                                <SelectItem key={fw} value={fw}>{fw}</SelectItem>
                                            ))}
                                            {!availableFrameworks.length && (
                                                <>
                                                    <SelectItem value="ISO 27001">ISO 27001</SelectItem>
                                                    <SelectItem value="SOC 2">SOC 2</SelectItem>
                                                </>
                                            )}
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
                                                        if (c) setSelectedSuggestions(new Set(suggestions.map((_, i) => i)));
                                                        else setSelectedSuggestions(new Set());
                                                    }}
                                                />
                                            </TableHead>
                                            <TableHead className="w-[45%]">Source Control</TableHead>
                                            <TableHead className="w-[45%]">Target Control (Suggested)</TableHead>
                                            <TableHead>Conf.</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {suggestions.map((s: any, idx: number) => (
                                            <TableRow key={idx} className="align-top">
                                                <TableCell className="pt-4">
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
                                                <TableCell className="space-y-1 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline">{s.sourceCode}</Badge>
                                                        <span className="font-semibold text-sm">{s.sourceName}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-3" title={s.sourceDescription}>
                                                        {s.sourceDescription}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="space-y-1 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                            {s.targetCode}
                                                        </Badge>
                                                        <span className="font-semibold text-sm">{s.targetName}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-3" title={s.targetDescription}>
                                                        {s.targetDescription}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="pt-4">
                                                    <Badge variant={s.confidence > 85 ? "default" : "secondary"}>
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
        </>
    );
}
