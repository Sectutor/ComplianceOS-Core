import { useState } from "react";
import { useStudio, FrameworkRequirement, generateId } from "./StudioContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Input } from "@complianceos/ui/ui/input";
import { Button } from "@complianceos/ui/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Trash2, Plus, GripVertical, List } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@complianceos/ui/ui/dialog";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { SmartImportDialog } from "./SmartImportDialog";

export const RequirementsGrid = () => {
    const { state, dispatch } = useStudio();
    const [importOpen, setImportOpen] = useState(false);
    const [importText, setImportText] = useState("");

    // Local state for the "Quick Add" row
    const [newReq, setNewReq] = useState<Partial<FrameworkRequirement>>({
        title: '',
        description: '',
        phaseId: state.phases[0]?.id || ''
    });

    const handleAdd = () => {
        if (!newReq.description) return;

        dispatch({
            type: 'ADD_REQUIREMENT',
            requirement: {
                id: generateId(),
                title: newReq.title || `REQ-${state.requirements.length + 1}`,
                description: newReq.description,
                phaseId: newReq.phaseId || state.phases[0]?.id || ''
            }
        });

        // Reset description but keep phase/title logic for speed
        setNewReq({ ...newReq, title: '', description: '' });
    };

    const parseAndAdd = (text: string) => {
        const rows = text.split('\n').filter(row => row.trim());
        if (rows.length > 0) {
            const newRequirements: FrameworkRequirement[] = [];

            rows.forEach(row => {
                // Try splitting by tab first, then generic comma if no tabs found
                let cols = row.split('\t');
                if (cols.length < 2) {
                    // Simple CSV fallback
                    cols = row.split(',');
                }

                if (cols.length >= 1) {
                    newRequirements.push({
                        id: generateId(),
                        title: cols.length >= 2 ? cols[0]?.trim() : `REQ`,
                        description: cols.length >= 2 ? cols[1]?.trim() : cols[0]?.trim(),
                        phaseId: state.phases[0]?.id || '' // Default to first phase
                    });
                }
            });

            if (newRequirements.length > 0) {
                dispatch({ type: 'BULK_ADD_REQUIREMENTS', requirements: newRequirements });
                return true;
            }
        }
        return false;
    }

    const processImport = () => {
        if (!importText) return;
        if (parseAndAdd(importText)) {
            setImportText("");
            setImportOpen(false);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const clipboardData = e.clipboardData.getData('text');
        if (!clipboardData) return;

        // Only trigger bulk paste if multiple lines
        if (clipboardData.includes('\n')) {
            e.preventDefault();
            parseAndAdd(clipboardData);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2">
                <SmartImportDialog />
                <Dialog open={importOpen} onOpenChange={setImportOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <List className="mr-2 h-4 w-4" />
                            Bulk Import Requirements
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Import Requirements</DialogTitle>
                            <DialogDescription>
                                Paste your requirements here. Each line will be a new requirement.<br />
                                Format: <code>ID [TAB] Description</code> (Excel copy) or just <code>Description</code>.
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder={"REQ-1\tAccess Control Policy\nREQ-2\tPassword Standards..."}
                            className="min-h-[200px] font-mono text-xs"
                        />
                        <DialogFooter>
                            <Button onClick={processImport}>Import {importText.split('\n').filter(x => x.trim()).length} Items</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-white" onPaste={handlePaste}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">ID / Title</TableHead>
                            <TableHead>Requirement / Control Text</TableHead>
                            {!state.simpleMode && <TableHead className="w-[200px]">Phase</TableHead>}
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {state.requirements.map((req) => (
                            <TableRow key={req.id}>
                                <TableCell>
                                    <Input
                                        value={req.title}
                                        onChange={(e) => dispatch({ type: 'UPDATE_REQUIREMENT', id: req.id, field: 'title', value: e.target.value })}
                                        className="h-8 font-mono text-xs"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={req.description}
                                        onChange={(e) => dispatch({ type: 'UPDATE_REQUIREMENT', id: req.id, field: 'description', value: e.target.value })}
                                        className="h-8"
                                    />
                                </TableCell>
                                {!state.simpleMode && (
                                    <TableCell>
                                        <Select
                                            value={req.phaseId}
                                            onValueChange={(val) => dispatch({ type: 'UPDATE_REQUIREMENT', id: req.id, field: 'phaseId', value: val })}
                                        >
                                            <SelectTrigger className="h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {state.phases.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                )}
                                <TableCell>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => dispatch({ type: 'DELETE_REQUIREMENT', id: req.id })}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}

                        {/* Quick Add Row */}
                        <TableRow className="bg-muted/30">
                            <TableCell>
                                <Input
                                    placeholder="REQ-..."
                                    value={newReq.title}
                                    onChange={(e) => setNewReq({ ...newReq, title: e.target.value })}
                                    className="h-8 font-mono text-xs bg-transparent"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    placeholder="Type requirement and press Enter..."
                                    value={newReq.description}
                                    onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
                                    className="h-8 bg-transparent"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                />
                            </TableCell>
                            {!state.simpleMode && (
                                <TableCell>
                                    <Select
                                        value={newReq.phaseId}
                                        onValueChange={(val) => setNewReq({ ...newReq, phaseId: val })}
                                    >
                                        <SelectTrigger className="h-8 bg-transparent">
                                            <SelectValue placeholder="Select Phase" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {state.phases.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            )}
                            <TableCell>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleAdd}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded border border-blue-100 flex items-center gap-2">
                <span className="font-bold">Tip:</span> You can now use the <b>Bulk Import</b> button above, or simply paste rows from Excel directly into the table.
            </div>
        </div>
    );
};
