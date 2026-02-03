import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Skeleton } from "@complianceos/ui/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, Trash2, CheckCircle2, Paperclip, Upload, X, Search, ChevronRight, Filter, Info, AlertCircle, Clock, Shield, User, BarChart3, Download, BookOpen } from "lucide-react";
import EvidenceFileUpload from "@/components/EvidenceFileUpload";
import EvidenceAnalysisButton from "@/components/EvidenceAnalysisButton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@complianceos/ui/ui/accordion";
import { Badge } from "@complianceos/ui/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@complianceos/ui/ui/alert-dialog";

export default function Evidence() {
  const { id } = useParams<{ id: string }>();
  const clientId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState<number | null>(null);
  const [viewingFiles, setViewingFiles] = useState<number | null>(null);
  const [selectedClientControlId, setSelectedClientControlId] = useState<string>("");
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [selectedRaci, setSelectedRaci] = useState<string>("R");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [evidenceToDelete, setEvidenceToDelete] = useState<any>(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [frameworkFilter, setFrameworkFilter] = useState("all");

  const { data: client } = trpc.clients.get.useQuery(
    { id: clientId },
    { enabled: clientId > 0 }
  );
  const { data: evidenceList, isLoading, refetch } = trpc.evidence.list.useQuery(
    { clientId },
    { enabled: clientId > 0 }
  );
  const { data: clientControls } = trpc.clientControls.list.useQuery(
    { clientId },
    { enabled: clientId > 0 }
  );
  const { data: employees } = trpc.employees.list.useQuery(
    { clientId },
    { enabled: clientId > 0 }
  );

  const { data: frameworkMappings } = trpc.compliance.frameworkMappings.list.useQuery(
    {},
    { enabled: clientId > 0 }
  );

  const createMutation = trpc.evidence.create.useMutation();
  const createFileMutation = trpc.evidenceFiles.create.useMutation();

  const updateMutation = trpc.evidence.update.useMutation({
    onSuccess: () => {
      toast.success("Evidence updated");
      setEditingEvidence(null);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.evidence.delete.useMutation({
    onSuccess: () => {
      toast.success("Evidence removed");
      setEvidenceToDelete(null);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  // Categorization and Filtering Logic
  const groupedData = useMemo(() => {
    console.log("[DEBUG] groupedData memo recalculating. Dependencies:", {
      clientControls: !!clientControls,
      evidenceList: !!evidenceList,
      frameworkMappings: !!frameworkMappings,
      searchQuery,
      statusFilter,
      frameworkFilter
    });

    if (!clientControls || !evidenceList) {
      console.log("[DEBUG] evidenceList or clientControls missing, skipping memo logic");
      return [];
    }

    try {
      // Build mapping graph for faster lookups
      const mappingGraph = new Map<number, Set<number>>();
      if (frameworkMappings) {
        console.log("[DEBUG] Building mapping graph from", frameworkMappings.length, "mappings");
        frameworkMappings.forEach(mapping => {
          const s = mapping.sourceControlId;
          const t = mapping.targetControlId;
          if (!mappingGraph.has(s)) mappingGraph.set(s, new Set());
          if (!mappingGraph.has(t)) mappingGraph.set(t, new Set());
          mappingGraph.get(s)!.add(t);
          mappingGraph.get(t)!.add(s);
        });
      }

      const findEquivalentControlIds = (controlId: number) => {
        const equivalents = new Set<number>([controlId]);
        const queue = [controlId];
        const visited = new Set<number>([controlId]);

        while (queue.length > 0) {
          const current = queue.shift()!;
          const neighbors = mappingGraph.get(current);
          if (neighbors) {
            for (const neighbor of neighbors) {
              if (!visited.has(neighbor)) {
                visited.add(neighbor);
                equivalents.add(neighbor);
                queue.push(neighbor);
              }
            }
          }
        }
        return equivalents;
      };

      let filtered = clientControls.map(cc => {
        const masterControlId = cc.control?.id;
        if (!masterControlId) return { ...cc, evidence: [] };

        // Find all equivalent master control IDs
        const equivalentIds = findEquivalentControlIds(masterControlId);

        // Collect all evidence items from ANY equivalent control
        const evidence = evidenceList.filter(e => {
          const evidenceMasterControlId = e.control?.id;
          return evidenceMasterControlId && equivalentIds.has(evidenceMasterControlId);
        }).map(e => ({
          evidence: e, // Wrap to match UI expectations
          isInherited: e.control?.id !== masterControlId,
          sourceFramework: e.control?.framework,
          sourceControlId: e.control?.controlId
        }));

        return {
          ...cc,
          evidence
        };
      });

      console.log("[DEBUG] Filtered controls count:", filtered.length);

      // Apply Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(item =>
          item.control?.name?.toLowerCase().includes(query) ||
          item.clientControl.clientControlId?.toLowerCase().includes(query) ||
          item.control?.description?.toLowerCase().includes(query)
        );
      }

      // Apply Filters
      if (statusFilter !== "all") {
        filtered = filtered.filter(item => {
          if (statusFilter === "need_documents") return item.evidence.length === 0;
          if (statusFilter === "ok") return item.evidence.some(e => e.evidence.status === 'verified');
          return true;
        });
      }

      if (frameworkFilter !== "all") {
        filtered = filtered.filter(item => item.control?.framework === frameworkFilter);
      }

      const categories: Record<string, any> = {};

      filtered.forEach(item => {
        const category = item.control?.category || "Other";
        const grouping = item.control?.grouping || "General";

        if (!categories[category]) {
          categories[category] = {
            name: category,
            subgroups: {},
            totalItems: 0,
            okItems: 0
          };
        }

        if (!categories[category].subgroups[grouping]) {
          categories[category].subgroups[grouping] = {
            name: grouping,
            items: []
          };
        }

        categories[category].subgroups[grouping].items.push(item);
        categories[category].totalItems++;
        if (item.evidence.some(e => e.evidence.status === 'verified')) {
          categories[category].okItems++;
        }
      });

      return Object.values(categories).sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
      console.error("[DEBUG] Error in groupedData memo:", err);
      return [];
    }
  }, [clientControls, evidenceList, frameworkMappings, searchQuery, statusFilter, frameworkFilter]);

  const uniqueFrameworks = useMemo(() => {
    if (!clientControls) return [];
    return Array.from(new Set(clientControls.map(cc => cc.control?.framework).filter(Boolean)));
  }, [clientControls]);

  const getNextEvidenceId = () => {
    if (!evidenceList || evidenceList.length === 0) return "EVD-001";
    const maxNum = Math.max(...evidenceList.map(e => {
      const match = (e.evidenceId as string)?.match(/EVD-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }));
    return `EVD-${String(maxNum + 1).padStart(3, '0')}`;
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClientControlId) {
      toast.error("Please select a control");
      return;
    }

    setIsUploading(true);
    const formData = new FormData(e.currentTarget);

    let ownerName = selectedOwner;
    if (selectedOwner && employees) {
      const emp = employees.find(e => e.id.toString() === selectedOwner);
      if (emp) {
        ownerName = `${emp.firstName} ${emp.lastName}`;
      }
    }

    try {
      const evidence = await createMutation.mutateAsync({
        clientId,
        clientControlId: parseInt(selectedClientControlId),
        evidenceId: formData.get("evidenceId") as string,
        description: formData.get("description") as string,
        type: formData.get("type") as string,
        location: formData.get("location") as string,
        owner: ownerName || (formData.get("owner") as string),
        status: formData.get("status") as "pending" | "verified" | "expired" | "not_applicable",
      });

      if (selectedFiles.length > 0 && evidence?.id) {
        for (const file of selectedFiles) {
          const reader = new FileReader();
          await new Promise<void>((resolve, reject) => {
            reader.onload = async () => {
              try {
                const base64 = (reader.result as string).split(',')[1];
                const timestamp = Date.now();
                const randomSuffix = Math.random().toString(36).substring(2, 8);
                const extension = file.name.split('.').pop() || '';
                const generatedFilename = `evidence-${evidence.id}-${timestamp}-${randomSuffix}.${extension}`;

                const res = await fetch('/api/upload', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    filename: generatedFilename,
                    data: base64,
                    contentType: file.type,
                    folder: 'evidence'
                  })
                });

                if (!res.ok) throw new Error("Upload failed");
                const { key, url } = await res.json();

                await createFileMutation.mutateAsync({
                  evidenceId: evidence.id,
                  filename: generatedFilename,
                  originalFilename: file.name,
                  mimeType: file.type,
                  size: file.size,
                  fileKey: key,
                  url: url,
                });
                resolve();
              } catch (err) { reject(err); }
            };
            reader.onerror = () => reject(new Error("File read failed"));
            reader.readAsDataURL(file);
          });
        }
      }

      toast.success("Evidence added successfully");
      setIsAddOpen(false);
      setSelectedFiles([]);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to create evidence");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>, evidenceId: number) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: evidenceId,
      evidenceId: formData.get("evidenceId") as string,
      description: formData.get("description") as string,
      type: formData.get("type") as string,
      location: formData.get("location") as string,
      owner: formData.get("owner") as string,
      status: formData.get("status") as "pending" | "verified" | "expired" | "not_applicable",
      lastVerified: formData.get("lastVerified") ? new Date(formData.get("lastVerified") as string) : undefined,
    });
  };

  const handleDelete = (evidence: any) => {
    setEvidenceToDelete(evidence);
  };

  const confirmDelete = () => {
    if (evidenceToDelete) {
      deleteMutation.mutate({ id: evidenceToDelete.id });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full max-w-full p-6 pb-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="sm" onClick={() => setLocation(`/clients/${clientId}`)} className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Documents</h1>
            </div>
            <p className="text-slate-500 ml-10">{client?.name} &bull; Evidence Tracking</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Download className="mr-2 h-4 w-4" /> Export all
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => setLocation(`/clients/${clientId}/evidence/overview`)}>
              <BookOpen className="mr-2 h-4 w-4" /> Usage Guide
            </Button>
            <EnhancedDialog
              open={isAddOpen}
              onOpenChange={setIsAddOpen}
              trigger={
                <Button className="bg-[#5844ED] hover:bg-[#4736C9] font-semibold">
                  <Plus className="mr-2 h-4 w-4" /> Add document
                </Button>
              }
              title="Add Evidence"
              description="Track evidence for a control."
              footer={
                <div className="flex justify-end gap-2 w-full">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#5844ED] hover:bg-[#4736C9]"
                    onClick={(e) => {
                      const form = document.getElementById('add-evidence-form') as HTMLFormElement;
                      if (form) form.requestSubmit();
                    }}
                    disabled={createMutation.isPending || isUploading}
                  >
                    {createMutation.isPending || isUploading ? "Adding & Uploading..." : "Add Evidence"}
                  </Button>
                </div>
              }
              size="lg"
            >
              <form id="add-evidence-form" onSubmit={handleCreate} onReset={() => {
                setSelectedClientControlId("");
                setSelectedOwner("");
                setSelectedRaci("R");
              }}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Evidence ID</Label>
                      <Input name="evidenceId" defaultValue={getNextEvidenceId()} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Control *</Label>
                      <Select value={selectedClientControlId} onValueChange={setSelectedClientControlId}>
                        <SelectTrigger className={!selectedClientControlId ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select control" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {clientControls?.map((item) => (
                            <SelectItem key={item.clientControl.id} value={item.clientControl.id.toString()}>
                              {item.clientControl.clientControlId} - {item.control?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Textarea name="description" placeholder="Describe the evidence..." className="min-h-[100px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Type</Label>
                      <Select name="type" defaultValue="Document">
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Document">Document</SelectItem>
                          <SelectItem value="Screenshot">Screenshot</SelectItem>
                          <SelectItem value="Log">Log</SelectItem>
                          <SelectItem value="Report">Report</SelectItem>
                          <SelectItem value="Configuration">Configuration</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Status</Label>
                      <Select name="status" defaultValue="pending">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="not_applicable">Not Applicable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Location</Label>
                    <Input name="location" placeholder="URL, file path, or system name..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Owner</Label>
                      <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees?.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id.toString()}>
                              {emp.firstName} {emp.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>RACI Role</Label>
                      <Select value={selectedRaci} onValueChange={setSelectedRaci}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="R">Responsible</SelectItem>
                          <SelectItem value="A">Accountable</SelectItem>
                          <SelectItem value="C">Consulted</SelectItem>
                          <SelectItem value="I">Informed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2 mt-4">
                    <Label>Attachments</Label>
                    <div
                      className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative border-slate-200"
                      onClick={() => document.getElementById('evidence-file-upload')?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files) {
                          setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
                        }
                      }}
                    >
                      <input id="evidence-file-upload" type="file" className="hidden" multiple onChange={(e) => {
                        if (e.target.files) setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                      }} />
                      <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm font-medium text-slate-700">Drag & drop files here, or click to select</p>
                      <p className="text-xs text-slate-500 mt-1">Supports PDF, PNG, JPG, DOCX</p>
                    </div>
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-200 text-sm">
                            <span className="truncate max-w-[200px] flex items-center gap-2">
                              <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                              {file.name}
                            </span>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                            }}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </EnhancedDialog>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
          <div className="relative w-full max-w-xs min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search all documents"
              className="pl-9 h-9 border-slate-200 focus:ring-[#5844ED]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

          <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Filter by</span>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-fit gap-2 border-slate-200 font-medium">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Status:</span>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="need_documents">Need documents</SelectItem>
              <SelectItem value="ok">OK</SelectItem>
            </SelectContent>
          </Select>

          <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
            <SelectTrigger className="h-9 w-fit gap-2 border-slate-200 font-medium">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Framework:</span>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frameworks</SelectItem>
              {uniqueFrameworks.map(fw => (
                <SelectItem key={fw} value={fw}>{fw}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Placeholders for other filters based on image */}
          <Button variant="outline" size="sm" className="h-9 text-slate-600 border-slate-200">Category</Button>
          <Button variant="outline" size="sm" className="h-9 text-slate-600 border-slate-200">Frequency</Button>
          <Button variant="outline" size="sm" className="h-9 text-slate-600 border-slate-200">Priority</Button>
          <Button variant="outline" size="sm" className="h-9 text-slate-600 border-slate-200">Owner</Button>
        </div>

        {/* Main Content - Categories */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : groupedData.length > 0 ? (
          <div className="space-y-8">
            {groupedData.map((category) => (
              <div key={category.name} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-bold text-slate-900">{category.name}</h2>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                    <div className={`h-2.5 w-2.5 rounded-full border ${category.okItems === category.totalItems ? 'bg-green-500 border-green-200' : 'bg-amber-400 border-amber-200'}`} />
                    {category.okItems} / {category.totalItems} OK
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <Accordion type="multiple" defaultValue={Object.keys(category.subgroups)} className="divide-y divide-slate-100">
                    {Object.values(category.subgroups).map((subgroup: any) => (
                      <AccordionItem key={subgroup.name} value={subgroup.name} className="border-none">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50 transition-colors group">
                          <div className="flex items-center justify-between w-full pr-6">
                            <div className="flex items-center gap-3">
                              <span className="h-2 w-2 rounded-full bg-slate-300 group-data-[state=open]:bg-[#5844ED]" />
                              <span className="font-semibold text-slate-700">{subgroup.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {subgroup.items.some((i: any) => i.evidence.length === 0) && (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium px-2 py-0 h-6 border-slate-200 border">
                                  {subgroup.items.filter((i: any) => i.evidence.length === 0).length} Need documents
                                </Badge>
                              )}
                              {subgroup.items.filter((i: any) => i.evidence.some((e: any) => e.evidence.status === 'verified')).length > 0 && (
                                <Badge className="bg-green-50 text-green-700 font-medium px-2 py-0 h-6 border-green-200 border shadow-none">
                                  {subgroup.items.filter((i: any) => i.evidence.some((e: any) => e.evidence.status === 'verified')).length} OK
                                </Badge>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="border-t border-slate-100 bg-slate-50/30">
                            <Table>
                              <TableBody>
                                {subgroup.items.map((item: any) => (
                                  <TableRow key={item.clientControl.id} className="hover:bg-white border-b border-slate-100 last:border-0">
                                    <TableCell className="w-12 text-center text-slate-400 font-mono text-xs">
                                      {item.clientControl.clientControlId}
                                    </TableCell>
                                    <TableCell className="max-w-[300px]">
                                      <div className="font-semibold text-slate-800">{item.control?.name}</div>
                                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.control?.description}</div>
                                    </TableCell>
                                    <TableCell>
                                      {item.evidence.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                          {item.evidence.map((ev: any) => (
                                            <div key={ev.evidence.id} className="flex flex-col gap-1">
                                              <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-md border border-slate-200 text-xs shadow-sm group/ev">
                                                <span className="font-medium text-slate-700">{ev.evidence.evidenceId}</span>
                                                <span className={`h-1.5 w-1.5 rounded-full ${ev.evidence.status === 'verified' ? 'bg-green-500' :
                                                  ev.evidence.status === 'pending' ? 'bg-blue-400' :
                                                    ev.evidence.status === 'expired' ? 'bg-red-500' : 'bg-slate-300'
                                                  }`} />

                                                {ev.isInherited && (
                                                  <Badge variant="outline" className="h-4 px-1 text-[10px] bg-slate-50 text-slate-500 border-slate-200 font-normal">
                                                    Inherited
                                                  </Badge>
                                                )}

                                                <div className="flex items-center gap-1 ml-1 opacity-0 group-hover/ev:opacity-100 transition-opacity">
                                                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setViewingFiles(ev.evidence.id)}>
                                                    <Paperclip className="h-3 w-3" />
                                                  </Button>
                                                  <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500" onClick={() => handleDelete(ev.evidence)}>
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                              {ev.isInherited && (
                                                <div className="text-[10px] text-slate-400 ml-1 flex items-center gap-1">
                                                  <Shield className="h-2.5 w-2.5" />
                                                  via {ev.sourceFramework} {ev.sourceControlId}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full border border-dashed border-slate-300" onClick={() => {
                                            setSelectedClientControlId(item.clientControl.id.toString());
                                            setIsAddOpen(true);
                                          }}>
                                            <Plus className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 text-slate-400 italic text-sm">
                                          <AlertCircle className="h-3.5 w-3.5" />
                                          No evidence provided
                                          <Button variant="link" size="sm" className="h-fit p-0 ml-1 text-[#5844ED] font-semibold" onClick={() => {
                                            setSelectedClientControlId(item.clientControl.id.toString());
                                            setIsAddOpen(true);
                                          }}>
                                            Add document
                                          </Button>
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell className="w-40">
                                      <div className="flex items-center gap-2 text-slate-600 text-xs">
                                        <User className="h-3 w-3 text-slate-400" />
                                        {item.clientControl.owner || "Unassigned"}
                                      </div>
                                    </TableCell>
                                    <TableCell className="w-10">
                                      <EnhancedDialog
                                        open={viewingFiles === item.evidence[0]?.evidence.id} // Simple shim for view
                                        onOpenChange={(open) => !open && setViewingFiles(null)}
                                        trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><Info className="h-4 w-4" /></Button>}
                                        title="Control Details"
                                        size="lg"
                                      >
                                        <div className="space-y-4 py-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-xs text-slate-400 uppercase tracking-wider">Framework</Label>
                                              <div className="font-medium">{item.control?.framework}</div>
                                            </div>
                                            <div>
                                              <Label className="text-xs text-slate-400 uppercase tracking-wider">Frequency</Label>
                                              <div className="font-medium">{item.control?.frequency || "Continuous"}</div>
                                            </div>
                                          </div>
                                          <div>
                                            <Label className="text-xs text-slate-400 uppercase tracking-wider">Implementation Guidance</Label>
                                            <p className="text-sm text-slate-600 mt-1">{item.control?.implementationGuidance || "No guidance available"}</p>
                                          </div>
                                        </div>
                                      </EnhancedDialog>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="py-20 border-dashed border-2">
            <CardContent className="text-center">
              <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No documents found</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-8">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <Button variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("all"); setFrameworkFilter("all"); }}>
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Persistence and Management Dialogs */}
      {viewingFiles !== null && (
        <EnhancedDialog
          open={viewingFiles !== null}
          onOpenChange={(open) => !open && setViewingFiles(null)}
          title="Evidence Files"
          description="Manage attachments and view analysis results"
          size="lg"
          footer={<Button onClick={() => setViewingFiles(null)}>Close</Button>}
        >
          <div className="py-4 space-y-6">
            <EvidenceFileUpload evidenceId={viewingFiles} clientId={clientId} />
            <div className="pt-4 border-t border-slate-100">
              <Label className="text-sm font-semibold mb-3 block">AI Compliance Analysis</Label>
              <EvidenceAnalysisButton
                evidenceId={viewingFiles}
                controlName={evidenceList?.find(e => e.id === viewingFiles)?.control?.name}
              />
            </div>
          </div>
        </EnhancedDialog>
      )}

      <AlertDialog open={!!evidenceToDelete} onOpenChange={(open) => !open && setEvidenceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Evidence?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this evidence? This action cannot be undone.
              {evidenceToDelete && evidenceToDelete.status === 'verified' && (
                <div className="mt-2 p-2 bg-amber-50 rounded text-amber-800 text-sm border border-amber-200">
                  Warning: This evidence is marked as <b>Verified</b>. Deleting it may impact compliance status.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              Delete Evidence
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
