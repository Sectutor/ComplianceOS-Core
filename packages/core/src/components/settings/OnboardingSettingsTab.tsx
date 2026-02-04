import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Switch } from "@complianceos/ui/ui/switch";
import { Label } from "@complianceos/ui/ui/label";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Edit2, Sparkles } from "lucide-react";
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
import RichTextEditor from "../RichTextEditor";

interface OnboardingSettingsTabProps {
    clientId: number;
}

export function OnboardingSettingsTab({ clientId }: OnboardingSettingsTabProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Fetch requirements
    const { data: requirements, refetch } = (trpc.onboarding as any).getRequirements?.useQuery(
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

    // AI Generation
    const [isGenerating, setIsGenerating] = useState(false);
    const generateMutation = (trpc.onboarding as any).generateRequirementContent?.useMutation({
        onSuccess: (data: any) => {
            if (isCreateOpen) {
                setNewItem(prev => ({ ...prev, description: data.content }));
            } else if (editingItem) {
                setEditingItem((prev: any) => ({ ...prev, description: data.content }));
            }
            setIsGenerating(false);
            toast.success("Content generated successfully");
        },
        onError: (error: any) => {
            setIsGenerating(false);
            toast.error(`Failed to generate content: ${error.message}`);
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
            clientId: clientId,
            ...newItem
        });
    };

    const handleUpdate = () => {
        if (!clientId || !editingItem) return;
        updateMutation.mutate({
            clientId: clientId,
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
                clientId: clientId,
                id
            });
        }
    };

    const handleGenerateAI = (title: string) => {
        if (!title) {
            toast.error("Please enter a title first");
            return;
        }
        setIsGenerating(true);
        generateMutation.mutate({
            clientId,
            title,
            tone: 'Professional'
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Compliance Acknowledgments</CardTitle>
                    <CardDescription>
                        Configuration for documents employees must read and acknowledge during onboarding.
                    </CardDescription>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Requirement
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {requirements?.map((req: any) => (
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

                    {(!requirements || requirements.length === 0) && (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                            No requirements configured. Default system requirements will be applied.
                        </div>
                    )}
                </div>

                {/* Create Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="sm:max-w-[900px]">
                        <DialogHeader>
                            <DialogTitle>Add Compliance Requirement</DialogTitle>
                            <DialogDescription>
                                Create a new document or policy for employees to acknowledge.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                            <div className="grid grid-cols-2 gap-4">
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
                                    <p className="text-xs text-gray-500">Lowercase, underscores only.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="description">Content</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isGenerating || !newItem.title}
                                        onClick={() => handleGenerateAI(newItem.title)}
                                        className="h-7 text-xs gap-1"
                                    >
                                        {isGenerating ? (
                                            <>Generating...</>
                                        ) : (
                                            <>
                                                <Sparkles className="h-3 w-3 text-purple-500" />
                                                Generate with AI
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <div className="h-[350px]">
                                    <RichTextEditor
                                        value={newItem.description}
                                        onChange={(html) => setNewItem({ ...newItem, description: html })}
                                        className="h-full"
                                        minHeight="300px"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 pt-2">
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
                    <DialogContent className="sm:max-w-[900px]">
                        <DialogHeader>
                            <DialogTitle>Edit Requirement</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={editingItem?.title || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Content</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isGenerating || !editingItem?.title}
                                        onClick={() => handleGenerateAI(editingItem.title)}
                                        className="h-7 text-xs gap-1"
                                    >
                                        {isGenerating ? (
                                            <>Generating...</>
                                        ) : (
                                            <>
                                                <Sparkles className="h-3 w-3 text-purple-500" />
                                                Generate with AI
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <div className="h-[350px]">
                                    <RichTextEditor
                                        value={editingItem?.description || ''}
                                        onChange={(html) => setEditingItem({ ...editingItem, description: html })}
                                        className="h-full"
                                        minHeight="300px"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 pt-2">
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
            </CardContent>
        </Card>
    );
}
