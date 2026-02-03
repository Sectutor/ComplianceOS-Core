import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    Upload, FileText, CheckCircle2, Clock, AlertCircle,
    Sparkles, Inbox, Search, Filter, MoreHorizontal,
    Trash2, Link as LinkIcon, Download, ChevronsUpDown, Check
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@complianceos/ui/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@complianceos/ui/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@complianceos/ui/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@complianceos/ui/ui/popover";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { cn } from "@/lib/utils";
import { Input } from "@complianceos/ui/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@complianceos/ui/ui/table";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";

export default function EvidenceIntakeBox() {
    const [isDragging, setIsDragging] = useState(false);
    const params = useParams();
    const clientId = useMemo(() => {
        if (!params.id) {
            console.warn('[EvidenceIntakeBox] No client ID in params');
            return null;
        }
        const id = parseInt(params.id);
        if (isNaN(id)) {
            console.error('[EvidenceIntakeBox] Invalid client ID:', params.id);
            return null;
        }
        return id;
    }, [params.id]);

    const { data: controls, isLoading: isLoadingControls } = trpc.evidence.listOpenRequests.useQuery(
        { clientId: clientId as number },
        { enabled: !!clientId }
    );

    const deleteMutation = trpc.intake.delete.useMutation({
        onSuccess: () => {
            toast.success("Item deleted");
            refetch();
        }
    });

    const mapMutation = trpc.intake.mapToEvidence.useMutation({
        onSuccess: () => {
            toast.success("Evidence mapped successfully");
            setMapDialogOpen(false);
            refetch();
        },
        onError: (error) => {
            console.error('[EvidenceIntakeBox] mapToEvidence mutation failed:', error);
            toast.error(`Failed to map evidence: ${error.message}`);
        }
    });

    const [mapDialogOpen, setMapDialogOpen] = useState(false);
    const [selectedIntakeItem, setSelectedIntakeItem] = useState<any>(null);
    const [selectedControlId, setSelectedControlId] = useState<number | null>(null);
    const [evidenceTitle, setEvidenceTitle] = useState("");
    const [comboboxOpen, setComboboxOpen] = useState(false);
    const [selectedFramework, setSelectedFramework] = useState<string>("all");

    const frameworks = useMemo(() => {
        if (!controls) return [];
        return Array.from(new Set(controls.map((c: any) => c.framework || c.control?.framework).filter(Boolean)));
    }, [controls]);

    const filteredControls = useMemo(() => {
        if (!controls) return [];
        if (selectedFramework === 'all') return controls;
        return controls.filter((c: any) => (c.framework || c.control?.framework) === selectedFramework);
    }, [controls, selectedFramework]);

    const [selectedEvidenceId, setSelectedEvidenceId] = useState<number | null>(null);

    const openMapDialog = (item: any) => {
        setSelectedIntakeItem(item);
        setEvidenceTitle(item.filename);
        setMapDialogOpen(true);
    };

    const handleMap = () => {
        // We require selectedIntakeItem and clientId. selectedControlId or selectedEvidenceId must be present.
        if (!selectedIntakeItem || !clientId) {
            console.error('[EvidenceIntakeBox] Missing required parameters for mapping:', {
                selectedIntakeItem: !!selectedIntakeItem,
                selectedControlId: !!selectedControlId,
                clientId: !!clientId
            });
            toast.error('Missing required parameters for mapping');
            return;
        }

        const mutationData = {
            intakeItemId: selectedIntakeItem.id,
            clientControlId: selectedControlId || 0, // Fallback if mapping directly to evidence ID
            evidenceId: selectedEvidenceId, // NEW: Pass the direct Evidence Record ID
            title: evidenceTitle || selectedIntakeItem.filename
        };

        console.log('[EvidenceIntakeBox] Calling mapToEvidence with:', mutationData);
        mapMutation.mutate(mutationData);
    };

    // Real tRPC connections
    const { data: intakeItems, refetch } = trpc.intake.list.useQuery(
        { clientId: clientId as number },
        { enabled: !!clientId }
    );

    const uploadMutation = trpc.intake.create.useMutation({
        onSuccess: () => {
            toast.success("File added to intake box!");
            refetch();
        },
        onError: (error) => {
            console.error('[EvidenceIntakeBox] intake.create mutation failed:', error);
            toast.error(`Failed to record upload: ${error.message}`);
        }
    });

    const triageMutation = trpc.intake.triage.useMutation({
        onSuccess: () => {
            toast.success("AI Triage complete!");
            refetch();
        }
    });

    const runTriage = (id: number) => {
        triageMutation.mutate({
            id,
            classification: "Analyzing content...",
            details: { confidence: 50, date: new Date().toISOString() }
        });
    };

    const processFile = (file: File) => {
        if (!clientId) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const base64 = (event.target?.result as string).split(',')[1];

                // 1. Physical Upload
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: file.name,
                        data: base64,
                        contentType: file.type,
                        folder: 'uploads/intake'
                    })
                });

                if (!uploadRes.ok) throw new Error('Upload failed');
                const uploadResult = await uploadRes.json();
                const { url: fileUrl, key: fileKey } = uploadResult;

                // 2. Database Record + AI Triage
                uploadMutation.mutate({
                    clientId,
                    filename: file.name,
                    fileUrl,
                    fileKey,
                    // fileBase64: base64 // Optimization: content is already uploaded, skip sending again to avoid payload limits. AI Triage currently relies on filename or can read from disk if needed.
                });
            } catch (error: any) {
                console.error('[EvidenceIntakeBox] Upload error:', error);
                toast.error('Upload failed: ' + error.message);
            }
        };
        reader.onerror = () => {
            console.error('[EvidenceIntakeBox] File reading failed');
            toast.error('Failed to read file');
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const triggerUpload = () => {
        document.getElementById("file-upload")?.click();
    };


    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Inbox className="h-8 w-8 text-indigo-600" />
                            Evidence Intake Box
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            "The Accountant Model": Just drop your evidence here. We'll handle the mapping and compliance logic for you.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleUpload}
                        />
                        <Button variant="outline">
                            <Filter className="mr-2 h-4 w-4" /> Filter
                        </Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={triggerUpload} disabled={uploadMutation.isPending}>
                            <Upload className="mr-2 h-4 w-4" /> {uploadMutation.isPending ? "Uploading..." : "Upload Files"}
                        </Button>
                    </div>
                </div>

                {/* Drop Zone */}
                <Card
                    className={`border-2 border-dashed transition-all cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={triggerUpload}
                >
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-20 w-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                            <Upload className="h-10 w-10 text-indigo-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">Drop Evidence Receipts Here</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mt-3 leading-relaxed">
                            Upload log exports, screenshots, invoices, or policies.
                            Our AI and Advisors will triage them into your compliance framework.
                        </p>
                        <div className="mt-6 flex gap-2">
                            <Badge variant="outline" className="bg-white">PDF</Badge>
                            <Badge variant="outline" className="bg-white">PNG/JPG</Badge>
                            <Badge variant="outline" className="bg-white">DOCX</Badge>
                            <Badge variant="outline" className="bg-white">CSV</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Actionable Intake Table */}
                <Card className="shadow-lg border-slate-200">
                    <CardHeader className="border-b bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Processing Queue</CardTitle>
                                <CardDescription>Items currently being triaged by your compliance advisor team.</CardDescription>
                            </div>
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                                {intakeItems?.length || 0} Items
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/30">
                                    <TableHead className="w-[300px]">File Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>AI Classification</TableHead>
                                    <TableHead>Date Uploaded</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {intakeItems?.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <button
                                                        onClick={() => window.open(item.fileUrl, '_blank')}
                                                        className="text-left text-sm font-semibold text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer"
                                                    >
                                                        {item.filename}
                                                    </button>
                                                    <span className="text-xs text-slate-500">{(Math.random() * 5 + 1).toFixed(1)} MB</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={item.status === 'mapped' ? 'success' : item.status === 'classified' ? 'secondary' : 'outline'}
                                                className="capitalize"
                                            >
                                                {item.status}
                                                {(item.mappedCount || 0) > 0 && ` (${item.mappedCount})`}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm">
                                                {item.status === 'pending' ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-0 px-2"
                                                        onClick={() => runTriage(item.id)}
                                                        disabled={triageMutation.isLoading}
                                                    >
                                                        <Sparkles className="h-3 w-3 mr-1" />
                                                        Run AI Triage
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Sparkles className="h-3 w-3 text-amber-500" />
                                                        <span className="font-medium text-slate-700">{item.classification}</span>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-sm">
                                            {new Date(item.createdAt!).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="hover:bg-slate-100">
                                                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => window.open(item.fileUrl, '_blank')}>
                                                        <Download className="mr-2 h-4 w-4" /> View / Download
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openMapDialog(item)}>
                                                        <LinkIcon className="mr-2 h-4 w-4" /> Map to Evidence
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => deleteMutation.mutate({ id: item.id })}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!intakeItems || intakeItems.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <Inbox className="h-12 w-12 mb-3 opacity-20" />
                                                <p className="text-lg font-medium">Your Intake Box is empty</p>
                                                <p className="text-sm max-w-xs mt-1">Start by dragging and dropping evidence files here for our team to process.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Map to Evidence Dialog */}
                <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Map to Control Evidence</DialogTitle>
                            <DialogDescription>
                                Link this file to a specific compliance control. This will officially collect it as evidence.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Evidence Title</Label>
                                <Input
                                    id="title"
                                    value={evidenceTitle}
                                    onChange={(e) => setEvidenceTitle(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Framework</Label>
                                <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select framework..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Frameworks</SelectItem>
                                        {frameworks.map((fw: any) => (
                                            <SelectItem key={fw} value={fw}>{fw}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Link to Control</Label>
                                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={comboboxOpen}
                                            className="w-full justify-between"
                                        >
                                            {selectedControlId || selectedEvidenceId
                                                ? controls?.find((c: any) => (c.clientControl?.id === selectedControlId) || (c.evidenceId === selectedEvidenceId))?.evidenceLabel || "Selected Control"
                                                : "Select control..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search controls..." />
                                            <CommandList className="max-h-[300px] overflow-y-auto">
                                                <CommandEmpty>
                                                    {isLoadingControls ? (
                                                        <div className="flex items-center justify-center py-4 text-slate-500">
                                                            <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full mr-2"></div>
                                                            Loading controls...
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-500">No control found.</span>
                                                    )}
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {filteredControls?.map((c: any) => {
                                                        const controlName = c.evidenceLabel || c.control?.name || c.clientControl?.customDescription || "Unknown Control"; // Use evidenceLabel first
                                                        const controlId = c.control?.id || "Req"; // Fallback ID
                                                        const searchValue = `${controlName} ${controlId} ${c.framework || ""}`;

                                                        // Use evidenceId as the unique key for selection if clientControlId is 0 or missing
                                                        const uniqueId = c.evidenceId;

                                                        return (
                                                            <CommandItem
                                                                key={uniqueId}
                                                                value={searchValue}
                                                                onSelect={() => {
                                                                    // We prioritize updating the specific Evidence Record ID
                                                                    setSelectedEvidenceId(c.id);
                                                                    // We also track control ID for legacy, if valid
                                                                    if (c.clientControl?.id) setSelectedControlId(c.clientControl.id);
                                                                    else setSelectedControlId(0);

                                                                    setComboboxOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedEvidenceId === c.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">
                                                                        {controlName}
                                                                    </span>
                                                                    {c.control?.name && c.control.name !== controlName && (
                                                                        <span className="text-muted-foreground text-xs">{c.control.name}</span>
                                                                    )}
                                                                </div>
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setMapDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleMap} disabled={mapMutation.isPending || (!selectedControlId && !selectedEvidenceId)}>
                                {mapMutation.isPending ? "Mapping..." : "Confirm & Map"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
