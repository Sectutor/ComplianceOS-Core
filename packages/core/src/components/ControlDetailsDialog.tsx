import { Button } from "@complianceos/ui/ui/button";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import {
  Dialog,
  DialogDescription,
} from "@complianceos/ui/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@complianceos/ui/ui/card";
import { Separator } from "@complianceos/ui/ui/separator";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";

import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FileText, Upload, Trash2, Download, Calendar, User, ClipboardList, MessageSquare } from "lucide-react";
import { CommentsSection } from "@/components/CommentsSection";

interface ControlDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientControl: {
    id: number;
    clientControlId: string | null;
    customDescription: string | null;
    owner: string | null;
    status: string;
    notes: string | null;
    implementationNotes: string | null;
    implementationDate: Date | null;
    evidenceLocation: string | null;
  };
  control: {
    name: string;
    description: string | null;
    framework: string;
    controlId: string;
  } | null;
  clientId: number;
  onUpdate: () => void;
}

export default function ControlDetailsDialog({
  open,
  onOpenChange,
  clientControl,
  control,
  clientId,
  onUpdate,
}: ControlDetailsDialogProps) {
  const [implementationNotes, setImplementationNotes] = useState(clientControl.implementationNotes || "");
  const [implementationDate, setImplementationDate] = useState(
    clientControl.implementationDate
      ? new Date(clientControl.implementationDate).toISOString().split('T')[0]
      : ""
  );
  const [status, setStatus] = useState(clientControl.status);
  const [evidenceLocation, setEvidenceLocation] = useState(clientControl.evidenceLocation || "");
  const [deleteEvidenceId, setDeleteEvidenceId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<'responsible' | 'accountable' | 'consulted' | 'informed' | null>(null);

  const utils = trpc.useUtils();

  // Get workspace members
  const { data: workspaceMembers } = trpc.users.listWorkspaceMembers.useQuery({ clientId });

  // Get evidence for this control
  const { data: allEvidence, refetch: refetchEvidence } = trpc.evidence.list.useQuery({
    clientId
  });
  // Filter evidence for this specific control
  const evidenceList = allEvidence?.filter(item => item.evidence?.clientControlId === clientControl.id);

  // Get RACI assignments for this control
  const { data: raciSummary, refetch: refetchRaci } = trpc.taskAssignments.summary.useQuery({
    taskType: 'control',
    taskId: clientControl.id,
  });

  const assignMutation = trpc.taskAssignments.assignUser.useMutation({
    onSuccess: () => {
      toast.success("RACI assignment added");
      refetchRaci();
    },
    onError: (error) => toast.error(error.message),
  });

  const removeAssignmentMutation = trpc.taskAssignments.remove.useMutation({
    onSuccess: () => {
      toast.success("Assignment removed");
      refetchRaci();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.clientControls.update.useMutation({
    onSuccess: () => {
      toast.success("Control updated successfully");
      onUpdate();
      utils.clientControls.list.invalidate({ clientId });
    },
    onError: (error) => toast.error(error.message),
  });

  const createEvidenceMutation = trpc.evidence.create.useMutation({
    onSuccess: () => {
      toast.success("Evidence added");
      refetchEvidence();
      (document.getElementById("description") as HTMLInputElement).value = "";
      (document.getElementById("location") as HTMLInputElement).value = "";
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteEvidenceMutation = trpc.evidence.delete.useMutation({
    onSuccess: () => {
      toast.success("Evidence deleted");
      refetchEvidence();
      setDeleteEvidenceId(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const { data: mappings } = trpc.clientControls.getMappings.useQuery(
    { controlId: clientControl?.controlId || 0 },
    { enabled: !!clientControl }
  );

  const syncMutation = trpc.clientControls.sync.useMutation({
    onSuccess: () => {
      toast.success("Status and evidence synced to related controls");
    },
    onError: (e) => toast.error(e.message)
  });

  // Evidence Requests Logic
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [requestAssignee, setRequestAssignee] = useState("");
  const [requestDueDate, setRequestDueDate] = useState("");
  const [requestDescription, setRequestDescription] = useState("");

  const { data: evidenceRequests, refetch: refetchRequests } = trpc.evidenceRequests.list.useQuery({
    clientId,
    clientControlId: clientControl.id
  });

  const createRequestMutation = trpc.evidenceRequests.create.useMutation({
    onSuccess: () => {
      toast.success("Request sent");
      setRequestFormOpen(false);
      setRequestAssignee("");
      setRequestDescription("");
      refetchRequests();
    },
    onError: (e) => toast.error(e.message)
  });

  const handleCreateRequest = () => {
    if (!requestAssignee) return toast.error("Select an assignee");
    createRequestMutation.mutate({
      clientId,
      clientControlId: clientControl.id,
      assigneeId: parseInt(requestAssignee),
      dueDate: requestDueDate,
      description: requestDescription
    });
  };

  useEffect(() => {
    setImplementationNotes(clientControl.implementationNotes || "");
    setImplementationDate(
      clientControl.implementationDate
        ? new Date(clientControl.implementationDate).toISOString().split('T')[0]
        : ""
    );
    setStatus(clientControl.status);
    setEvidenceLocation(clientControl.evidenceLocation || "");
  }, [clientControl]);

  const handleSave = () => {
    updateMutation.mutate({
      clientId: clientId,
      id: clientControl.id,
      implementationNotes: implementationNotes || undefined,
      implementationDate: implementationDate ? new Date(implementationDate) : undefined,
      status: status as any,
      evidenceLocation: evidenceLocation || undefined,
    });
  };

  const handleAddEvidence = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createEvidenceMutation.mutate({
      clientId,
      clientControlId: clientControl.id,
      description: formData.get("description") as string,
      type: formData.get("type") as string,
      location: formData.get("location") as string,
      owner: formData.get("evidenceOwner") as string,
    });
    e.currentTarget.reset();
  };

  return (
    <>
      <EnhancedDialog
        open={open}
        onOpenChange={onOpenChange}
        size="lg"
        className="max-w-4xl"
        title={
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{clientControl.clientControlId}</span>
            <span>{control?.name}</span>
          </div>
        }
        description={control?.description || "No description available"}
      >
        <Tabs defaultValue="implementation" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="implementation">
              <ClipboardList className="mr-2 h-4 w-4" />
              Implementation
            </TabsTrigger>
            <TabsTrigger value="evidence">
              <FileText className="mr-2 h-4 w-4" />
              Evidence ({evidenceList?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="related">
              <div className="flex items-center">
                Related Controls
                {mappings && mappings.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {mappings.length}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="discussion">
              <MessageSquare className="mr-2 h-4 w-4" />
              Discussion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="implementation" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_implemented">Not Implemented</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="implemented">Implemented</SelectItem>
                    <SelectItem value="not_applicable">Not Applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="implementationDate">Implementation Date</Label>
                <Input
                  id="implementationDate"
                  type="date"
                  value={implementationDate}
                  onChange={(e) => setImplementationDate(e.target.value)}
                />
              </div>
            </div>

            {/* RACI Assignments Section */}
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">RACI Assignments</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Responsible */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-100 text-red-800 text-xs font-bold">R</span>
                    <Label>Responsible</Label>
                  </div>
                  <Select
                    value=""
                    onValueChange={(empId) => {
                      assignMutation.mutate({
                        clientId,
                        userId: parseInt(empId),
                        taskType: 'control',
                        taskId: clientControl.id,
                        raciRole: 'responsible',
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {workspaceMembers?.filter(user => !raciSummary?.responsible.some(r => r.id === user.id)).map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1">
                    {raciSummary?.responsible.map((emp) => (
                      <span key={emp.id} className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                        {emp.firstName} {emp.lastName}
                        <button type="button" onClick={() => {
                          if (emp.assignmentId) {
                            removeAssignmentMutation.mutate({ assignmentId: emp.assignmentId });
                          }
                        }} className="hover:text-red-600">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Accountable */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-800 text-xs font-bold">A</span>
                    <Label>Accountable</Label>
                  </div>
                  <Select
                    value=""
                    onValueChange={(empId) => {
                      assignMutation.mutate({
                        clientId,
                        userId: parseInt(empId),
                        taskType: 'control',
                        taskId: clientControl.id,
                        raciRole: 'accountable',
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {workspaceMembers?.filter(user => !raciSummary?.accountable.some(r => r.id === user.id)).map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1">
                    {raciSummary?.accountable.map((emp) => (
                      <span key={emp.id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {emp.firstName} {emp.lastName}
                        <button type="button" onClick={() => {
                          if (emp.assignmentId) removeAssignmentMutation.mutate({ assignmentId: emp.assignmentId });
                        }} className="hover:text-blue-600">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Consulted */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-100 text-green-800 text-xs font-bold">C</span>
                    <Label>Consulted</Label>
                  </div>
                  <Select
                    value=""
                    onValueChange={(empId) => {
                      assignMutation.mutate({
                        clientId,
                        userId: parseInt(empId),
                        taskType: 'control',
                        taskId: clientControl.id,
                        raciRole: 'consulted',
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {workspaceMembers?.filter(user => !raciSummary?.consulted.some(r => r.id === user.id)).map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1">
                    {raciSummary?.consulted.map((emp) => (
                      <span key={emp.id} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {emp.firstName} {emp.lastName}
                        <button type="button" onClick={() => {
                          if (emp.assignmentId) removeAssignmentMutation.mutate({ assignmentId: emp.assignmentId });
                        }} className="hover:text-green-600">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Informed */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-yellow-100 text-yellow-800 text-xs font-bold">I</span>
                    <Label>Informed</Label>
                  </div>
                  <Select
                    value=""
                    onValueChange={(empId) => {
                      assignMutation.mutate({
                        clientId,
                        userId: parseInt(empId),
                        taskType: 'control',
                        taskId: clientControl.id,
                        raciRole: 'informed',
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {workspaceMembers?.filter(user => !raciSummary?.informed.some(r => r.id === user.id)).map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1">
                    {raciSummary?.informed.map((emp) => (
                      <span key={emp.id} className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                        {emp.firstName} {emp.lastName}
                        <button type="button" onClick={() => {
                          if (emp.assignmentId) removeAssignmentMutation.mutate({ assignmentId: emp.assignmentId });
                        }} className="hover:text-yellow-600">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="evidenceLocation">Evidence Location (URL or Path)</Label>
              <Input
                id="evidenceLocation"
                value={evidenceLocation}
                onChange={(e) => setEvidenceLocation(e.target.value)}
                placeholder="https://drive.google.com/... or /path/to/evidence"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="implementationNotes">Implementation Notes</Label>
              <Textarea
                id="implementationNotes"
                value={implementationNotes}
                onChange={(e) => setImplementationNotes(e.target.value)}
                placeholder="Document how this control was implemented, any exceptions, compensating controls, or relevant details..."
                rows={4}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="evidence" className="space-y-4 mt-4">
            {/* Evidence Requests Section */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <User className="h-4 w-4" /> Evidence Requests
                </h3>
                <Button variant="outline" size="sm" onClick={() => setRequestFormOpen(!requestFormOpen)}>
                  {requestFormOpen ? "Cancel" : "New Request"}
                </Button>
              </div>

              {requestFormOpen && (
                <div className="bg-white p-4 rounded border mb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Assignee</Label>
                      <Select onValueChange={setRequestAssignee} value={requestAssignee}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee..." />
                        </SelectTrigger>
                        <SelectContent>
                          {workspaceMembers?.map(user => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Input type="date" value={requestDueDate} onChange={e => setRequestDueDate(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Instructions</Label>
                    <Textarea
                      placeholder="What evidence is needed?"
                      value={requestDescription}
                      onChange={e => setRequestDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleCreateRequest} disabled={createRequestMutation.isPending}>
                      {createRequestMutation.isPending ? "Sending..." : "Send Request"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {evidenceRequests?.map(req => (
                  <div key={req.request.id} className="flex justify-between items-center p-2 bg-white rounded border text-sm">
                    <div>
                      <div className="font-medium">{req.assignee?.firstName} {req.assignee?.lastName}</div>
                      <div className="text-xs text-muted-foreground">
                        {req.request.description} • Due: {req.request.dueDate ? new Date(req.request.dueDate).toLocaleDateString() : 'None'}
                      </div>
                    </div>
                    <Badge variant={req.request.status === 'open' ? 'secondary' : 'outline'}>
                      {req.request.status}
                    </Badge>
                  </div>
                ))}
                {(!evidenceRequests || evidenceRequests.length === 0) && (
                  <div className="text-center text-xs text-muted-foreground py-2">No active requests</div>
                )}
              </div>
            </div>

            <Separator />

            {/* Add Evidence Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Upload Evidence</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleAddEvidence} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Input
                        id="description"
                        name="description"
                        required
                        placeholder="Evidence description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select name="type" defaultValue="Document">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Document">Document</SelectItem>
                          <SelectItem value="Screenshot">Screenshot</SelectItem>
                          <SelectItem value="Log">Log</SelectItem>
                          <SelectItem value="Configuration">Configuration</SelectItem>
                          <SelectItem value="Report">Report</SelectItem>
                          <SelectItem value="Certificate">Certificate</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location (URL or Path)</Label>
                      <Input
                        id="location"
                        name="location"
                        placeholder="https://... or file path"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="evidenceOwner">Owner</Label>
                      <Select name="evidenceOwner">
                        <SelectTrigger>
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                        <SelectContent>
                          {workspaceMembers?.map((user) => (
                            <SelectItem key={user.id} value={user.name}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={createEvidenceMutation.isPending}>
                      <Upload className="mr-2 h-4 w-4" />
                      {createEvidenceMutation.isPending ? "Adding..." : "Add Evidence"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {evidenceList && evidenceList.length > 0 ? (
              <div className="space-y-2">
                {evidenceList.map((item) => (
                  <Card key={item.evidence.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{item.evidence.description}</span>
                            <span className="text-xs px-2 py-0.5 bg-muted rounded">
                              {item.evidence.type}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {item.evidence.location && (
                              <a
                                href={item.evidence.location}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <Download className="h-3 w-3" />
                                View
                              </a>
                            )}
                            {item.evidence.owner && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {item.evidence.owner}
                              </span>
                            )}
                            {item.evidence.lastVerified && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Verified: {new Date(item.evidence.lastVerified).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteEvidenceId(item.evidence.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No evidence attached to this control yet</p>
                <p className="text-sm">Use the form above to add evidence</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="related" className="space-y-4 mt-4">
            <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
              <div>
                <h3 className="text-lg font-medium">Cross-Framework Mappings</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically propagate specific implementation details to related controls.
                </p>
              </div>
              <Button
                onClick={() => syncMutation.mutate({ sourceClientControlId: clientControl?.id || 0 })}
                disabled={syncMutation.isPending || (mappings?.length || 0) === 0}
              >
                {syncMutation.isPending ? "Syncing..." : "Sync Status & Evidence"}
              </Button>
            </div>

            <div className="grid gap-4">
              {mappings?.map((map) => (
                <Card key={map.targetControl.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{map.targetControl.framework}</Badge>
                        <span className="font-semibold">{map.targetControl.controlId}</span>
                      </div>
                      <Badge variant="secondary">{map.mapping.relationship}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">{map.targetControl.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{map.targetControl.description}</p>
                  </CardContent>
                </Card>
              ))}
              {mappings?.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                  No mapped controls found for this item.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="discussion" className="mt-4">
            <CommentsSection entityType="control" entityId={clientControl.id} />
          </TabsContent>
        </Tabs>
      </EnhancedDialog>

      <EnhancedDialog
        open={deleteEvidenceId !== null}
        onOpenChange={(open) => !open && setDeleteEvidenceId(null)}
        title="Delete Evidence"
        description="Are you sure you want to delete this evidence? This action cannot be undone."
        size="sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setDeleteEvidenceId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteEvidenceId) {
                  deleteEvidenceMutation.mutate({ id: deleteEvidenceId });
                  setDeleteEvidenceId(null);
                }
              }}
              disabled={deleteEvidenceMutation.isPending}
            >
              {deleteEvidenceMutation.isPending ? "Deleting..." : "Delete Evidence"}
            </Button>
          </div>
        }
      >
        <div className="py-2">
          <p className="text-sm text-muted-foreground">
            This will permanently remove the evidence file and its metadata.
          </p>
        </div>
      </EnhancedDialog>
    </>
  );
}
