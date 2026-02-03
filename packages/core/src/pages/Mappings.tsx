import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Skeleton } from "@complianceos/ui/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, Trash2, Link2, Edit2, Sparkles } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function Mappings() {
  const { id } = useParams<{ id: string }>();
  const clientId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedControlId, setSelectedControlId] = useState<string>("");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("");
  const [editingMapping, setEditingMapping] = useState<any>(null);

  const { data: client } = trpc.clients.get.useQuery(
    { id: clientId },
    { enabled: clientId > 0 }
  );
  const { data: mappings, isLoading, refetch } = trpc.mappings.list.useQuery(
    { clientId },
    { enabled: clientId > 0 }
  );
  const { data: clientControls } = trpc.clientControls.list.useQuery(
    { clientId },
    { enabled: clientId > 0 }
  );
  const { data: clientPolicies, isLoading: policiesLoading } = trpc.clientPolicies.list.useQuery(
    { clientId },
    { enabled: clientId > 0 }
  );

  // Reset selected policy when dialog closes to ensure fresh data loads
  useEffect(() => {
    if (!isAddOpen) {
      setSelectedPolicyId("");
    }
  }, [isAddOpen]);
  const { data: masterControls } = trpc.controls.list.useQuery();

  const createMutation = trpc.mappings.create.useMutation({
    onSuccess: () => {
      toast.success("Mapping created");
      setIsAddOpen(false);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.mappings.delete.useMutation({
    onSuccess: () => {
      toast.success("Mapping removed");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.mappings.update.useMutation({
    onSuccess: () => {
      toast.success("Mapping updated");
      setEditingMapping(null);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedControlId || !selectedPolicyId) {
      toast.error("Please select both a control and a policy");
      return;
    }
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      clientId,
      clientControlId: parseInt(selectedControlId),
      clientPolicyId: parseInt(selectedPolicyId),
      evidenceReference: formData.get("evidenceReference") as string,
      notes: formData.get("notes") as string,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMapping) return;

    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingMapping.mapping.id,
      evidenceReference: formData.get("evidenceReference") as string,
      notes: formData.get("notes") as string,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Clients", href: "/clients" },
            { label: client?.name || "Client", href: `/clients/${clientId}` },
            { label: "Control-Policy Mappings" },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation(`/clients/${clientId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Control-Policy Mappings</h1>
              <p className="text-muted-foreground">{client?.name}</p>
            </div>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add Mapping
          </Button>
        </div>

        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Control-Policy Mappings</strong> bridge the gap between your external compliance requirements and your internal documentation.
              Use this page to link your active <strong>Controls</strong> (what you need to do) to your internal <strong>Policies</strong> (how you do it),
              demonstrating clear compliance coverage to auditors.
            </p>
          </CardContent>
        </Card>
        <EnhancedDialog
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
          title="Create Mapping"
          description="Link a control to a policy for this client."
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={(e) => {
                  const form = document.getElementById('create-mapping-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Mapping"}
              </Button>
            </div>
          }
        >
          <form id="create-mapping-form" onSubmit={handleCreate} onReset={() => {
            setSelectedControlId("");
            setSelectedPolicyId("");
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Control *</Label>
                <Select value={selectedControlId} onValueChange={setSelectedControlId}>
                  <SelectTrigger className={!selectedControlId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select control" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientControls?.map((item, idx) => {
                      // Fallback to master control name if not found in join
                      // Get the control name - prefer the joined control data, fallback to master controls lookup
                      const controlName = item.control?.name ||
                        masterControls?.find(c => c.id === item.clientControl.controlId)?.name ||
                        `${item.clientControl.clientControlId} - Unknown`;

                      // Display the control with its name
                      const displayText = item.control?.name ?
                        `${item.clientControl.clientControlId} - ${controlName}` :
                        controlName;
                      return (
                        <SelectItem key={item.clientControl.id} value={item.clientControl.id.toString()}>
                          {displayText}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Policy *</Label>
                <Select value={selectedPolicyId} onValueChange={setSelectedPolicyId}>
                  <SelectTrigger className={!selectedPolicyId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select policy" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientPolicies && clientPolicies.length > 0 ? (
                      clientPolicies.map((item) => (
                        <SelectItem key={item.clientPolicy.id} value={item.clientPolicy.id.toString()}>
                          {item.clientPolicy.clientPolicyId} - {item.clientPolicy.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">No policies available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Evidence Reference</Label>
                <Textarea name="evidenceReference" placeholder="Reference to evidence supporting this mapping..." />
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Textarea name="notes" placeholder="Additional notes..." />
              </div>
            </div>
          </form>
        </EnhancedDialog>

        <EnhancedDialog
          open={!!editingMapping}
          onOpenChange={(open) => !open && setEditingMapping(null)}
          title="Edit Mapping"
          description="Update evidence and notes for this control-policy mapping."
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button type="button" variant="outline" onClick={() => setEditingMapping(null)}>
                Cancel
              </Button>
              <Button
                onClick={(e) => {
                  const form = document.getElementById('edit-mapping-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          }
        >
          {editingMapping && (
            <form id="edit-mapping-form" onSubmit={handleUpdate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Control</Label>
                  <div className="p-2 border rounded bg-muted/50 text-sm">
                    {editingMapping.control?.name || editingMapping.clientControl?.clientControlId}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Policy</Label>
                  <div className="p-2 border rounded bg-muted/50 text-sm">
                    {editingMapping.clientPolicy?.name || editingMapping.clientPolicy?.clientPolicyId}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Evidence Reference</Label>
                  <Textarea
                    name="evidenceReference"
                    defaultValue={editingMapping.mapping.evidenceReference || ''}
                    placeholder="Reference to evidence supporting this mapping..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Textarea
                    name="notes"
                    defaultValue={editingMapping.mapping.notes || ''}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </form>
          )}
        </EnhancedDialog>

        {/* Mappings Table */}
        {
          isLoading ? (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : mappings && mappings.length > 0 ? (
            <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                    <TableHead className="text-white font-semibold py-4">Control</TableHead>
                    <TableHead className="text-white font-semibold py-4">Policy</TableHead>
                    <TableHead className="text-white font-semibold py-4">Evidence Reference</TableHead>
                    <TableHead className="text-white font-semibold py-4">Notes</TableHead>
                    <TableHead className="w-20 text-white font-semibold py-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((item) => (
                    <TableRow
                      key={`mapping-${item.mapping.id}`}
                      className="bg-white border-b border-slate-200 cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group"
                      onDoubleClick={() => setEditingMapping(item)}
                    >
                      <TableCell className="py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm text-black">{item.clientControl?.clientControlId}</p>
                            {(item.mapping as any).isAiGenerated && (
                              <div className="p-0.5 rounded bg-purple-100 text-purple-600" title="AI Suggested Mapping">
                                <Sparkles className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{item.control?.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div>
                          <p className="font-mono text-sm text-black">{item.clientPolicy?.clientPolicyId}</p>
                          <p className="text-sm text-gray-500">{item.clientPolicy?.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-gray-600 py-4">
                        {item.mapping.evidenceReference || '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-gray-600 py-4">
                        {item.mapping.notes || '-'}
                      </TableCell>
                      <TableCell className="py-4">

                        <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-[#1C4D8D]/10 hover:text-[#1C4D8D] transition-colors duration-200"
                            onClick={() => setEditingMapping(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                            onClick={() => {
                              if (confirm("Remove this mapping?")) {
                                deleteMutation.mutate({ id: item.mapping.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Card className="py-12">
              <CardContent className="text-center">
                <Link2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No mappings yet</h3>
                <p className="text-muted-foreground mb-4">
                  Link controls to policies to create an audit-ready mapping table.
                </p>
                <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Mapping
                </Button>
              </CardContent>
            </Card>
          )
        }
      </div>
    </DashboardLayout >
  );
}
