import { useState } from "react";
import { useParams } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Switch } from "@complianceos/ui/ui/switch";
import { Label } from "@complianceos/ui/ui/label";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@complianceos/ui/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@complianceos/ui/ui/badge";

export default function OnboardingSettings({ hideLayout = false, clientId: propClientId }: { hideLayout?: boolean, clientId?: number }) {
    const { selectedClientId: contextClientId } = useClientContext();
    const { id: idParam, clientId: clientIdParam } = useParams();
    const clientId = propClientId || contextClientId || parseInt(idParam || clientIdParam || "0") || 0;
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Fetch requirements
    const { data: requirements, isLoading, refetch } = (trpc.onboarding as any).getRequirements?.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    // Mutations
    const createMutation = (trpc.onboarding as any).createRequirement?.useMutation({
        onSuccess: () => {
            toast.success("Requirement created successfully");
            setIsCreateOpen(false);
            setNewItem({ title: '', key: '', description: '', isMandatory: true });
            refetch();
        }
    });

    const updateMutation = (trpc.onboarding as any).updateRequirement?.useMutation({
        onSuccess: () => {
            toast.success("Requirement updated successfully");
            setEditingItem(null);
            refetch();
        }
    });

    const deleteMutation = (trpc.onboarding as any).deleteRequirement?.useMutation({
        onSuccess: () => {
            toast.success("Requirement deleted successfully");
            refetch();
        }
    });

    // Form State
    const [newItem, setNewItem] = useState({
        title: '',
        key: '',
        description: '',
        isMandatory: true
    });

    const handleCreate = () => {
        if (!clientId) return;
        createMutation.mutate({
            clientId,
            ...newItem
        });
    };

    const handleUpdate = () => {
        if (!clientId || !editingItem) return;
        updateMutation.mutate({
            clientId,
            id: editingItem.id,
            title: editingItem.title,
            description: editingItem.description,
            isMandatory: editingItem.isMandatory
        });
    };

    const handleDelete = (id: number) => {
        if (!clientId) return;
        if (confirm("Are you sure? This will remove this requirement for future onboardings.")) {
            deleteMutation.mutate({
                clientId,
                id
            });
        }
    };

    const content = (
        <div className={hideLayout ? "" : "space-y-6"}>
            {!hideLayout && (
                <>
                    <Breadcrumb items={[{ label: 'Settings', href: '/settings' }, { label: 'Onboarding', active: true }]} />
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Onboarding Settings</h1>
                            <p className="text-muted-foreground mt-2">
                                Configure compliance requirements and acknowledgments for new employees.
                            </p>
                        </div>
                    </div>
                </>
            )}

            <div className="grid gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Compliance Acknowledgments</CardTitle>
                            <CardDescription>
                                Documents employees must read and acknowledge during onboarding.
                            </CardDescription>
                        </div>
                        <Button onClick={() => setIsCreateOpen(true)} size={hideLayout ? "sm" : "default"} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Requirement
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : requirements?.map((req: any) => (
                                <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-medium text-lg">{req.title}</h3>
                                            {req.isMandatory && <Badge variant="secondary">Mandatory</Badge>}
                                            <span className="text-xs text-mono text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">
                                                {req.key}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                            {req.description?.replace(/<[^>]*>/g, '') || "No description provided."}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setEditingItem(req)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(req.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {(!requirements || requirements.length === 0) && !isLoading && (
                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                                    No requirements configured. Default system requirements may be applied.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Add Compliance Requirement</DialogTitle>
                        <DialogDescription>
                            Create a new document or policy for employees to acknowledge.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Remote Work Policy"
                                value={newItem.title}
                                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="key">Key (Unique ID)</Label>
                            <Input
                                id="key"
                                placeholder="e.g. remote_work_policy"
                                value={newItem.key}
                                onChange={(e) => setNewItem({ ...newItem, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                            />
                            <p className="text-xs text-gray-500">Lowercase, underscores only. Cannot be changed later.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Content (HTML)</Label>
                            <Textarea
                                id="description"
                                placeholder="<p>Policy content goes here...</p>"
                                className="h-[200px] font-mono text-sm"
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="mandatory"
                                checked={newItem.isMandatory}
                                onCheckedChange={(c) => setNewItem({ ...newItem, isMandatory: c })}
                            />
                            <Label htmlFor="mandatory">Mandatory Acknowledgment</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!newItem.title || !newItem.key}>Create Requirement</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Requirement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                value={editingItem?.title || ''}
                                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Content (HTML)</Label>
                            <Textarea
                                className="h-[200px] font-mono text-sm"
                                value={editingItem?.description || ''}
                                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={editingItem?.isMandatory || false}
                                onCheckedChange={(c) => setEditingItem({ ...editingItem, isMandatory: c })}
                            />
                            <Label>Mandatory Acknowledgment</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
                        <Button onClick={handleUpdate}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );

    if (hideLayout) return content;

    return (
        <DashboardLayout>
            {content}
        </DashboardLayout>
    );
}
