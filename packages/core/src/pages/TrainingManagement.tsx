import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { useClientContext } from "@/contexts/ClientContext";
import { TrainingAssignmentDialog } from "@/components/training/TrainingAssignmentDialog";
import { PageGuide } from "@/components/PageGuide";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Plus, Edit, Trash2, Video, FileText, CheckCircle2, Circle, Eye, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Label } from "@complianceos/ui/ui/label";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Switch } from "@complianceos/ui/ui/switch";
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

export default function TrainingManagement({ hideLayout = false, clientId: propClientId }: { hideLayout?: boolean, clientId?: number }) {
    const { clientId: clientIdParam } = useParams();
    const context = useClientContext();
    const clientId = propClientId || parseInt(clientIdParam || "0") || context.selectedClientId || 0;
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedModule, setSelectedModule] = useState<any>(null);
    const [deletingModuleId, setDeletingModuleId] = useState<number | null>(null);

    const { data: modules, isLoading, refetch } = trpc.training.list.useQuery(
        { clientId, includeInactive: true },
        { enabled: clientId > 0 }
    );

    const { data: stats } = (trpc.training as any).getStats.useQuery(
        { clientId },
        { enabled: clientId > 0 }
    );

    const createMutation = trpc.training.create.useMutation({
        onSuccess: () => {
            toast.success("Training module created");
            setIsDialogOpen(false);
            refetch();
        },
        onError: (err: any) => toast.error(err.message)
    });

    const updateMutation = trpc.training.update.useMutation({
        onSuccess: () => {
            toast.success("Training module updated");
            setIsDialogOpen(false);
            refetch();
        },
        onError: (err: any) => toast.error(err.message)
    });

    const deleteMutation = trpc.training.delete.useMutation({
        onSuccess: () => {
            toast.success("Training module deleted");
            setIsDialogOpen(false);
            refetch();
        },
        onError: (err: any) => toast.error(err.message)
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            clientId,
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            type: formData.get("type") as 'video' | 'text',
            videoUrl: formData.get("videoUrl") as string,
            thumbnailUrl: formData.get("thumbnailUrl") as string,
            content: formData.get("content") as string,
            durationMinutes: parseInt(formData.get("durationMinutes") as string || "0"),
            active: formData.get("active") === "on",
        };

        if (selectedModule) {
            updateMutation.mutate({ ...data, id: selectedModule.id });
        } else {
            createMutation.mutate(data);
        }
    };

    const openCreateDialog = () => {
        setSelectedModule(null);
        setIsDialogOpen(true);
    };

    const openEditDialog = (module: any) => {
        setSelectedModule(module);
        setIsDialogOpen(true);
    };

    const content = (
        <div className={hideLayout ? "" : "p-8 max-w-7xl mx-auto space-y-8"}>
            {!hideLayout && (
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Training Management</h1>
                        <p className="text-muted-foreground mt-1">
                            Create and manage training modules for your employees.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <PageGuide
                            title="Training Management"
                            description="Create, assign, and track employee security training."
                            rationale="Ensures staff awareness of security risks and compliance obligations."
                            howToUse={[
                                { step: "Create Module", description: "Upload videos or write text-based training content." },
                                { step: "Assign Training", description: "Target specific departments or roles." },
                                { step: "Track Progress", description: "Monitor completion rates and audit evidence." }
                            ]}
                            integrations={[
                                { name: "Personnel Hub", description: "Syncs with employee records." },
                                { name: "Evidence Collection", description: "Auto-generates training logs." }
                            ]}
                        />
                        <Button onClick={openCreateDialog}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Module
                        </Button>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle>Training Modules</CardTitle>
                        <CardDescription>
                            {hideLayout ? "Manage company training content and assign modules." : "Support for video and rich text content."}
                        </CardDescription>
                    </div>
                    {hideLayout && (
                        <Button onClick={openCreateDialog} size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Module
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead>Visibility</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : modules?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground border-dashed border-2 rounded-lg mt-4">
                                        <div className="flex flex-col items-center gap-2 py-4">
                                            <Video className="h-8 w-8 text-gray-300" />
                                            <p>No training modules found.</p>
                                            <Button variant="outline" size="sm" onClick={openCreateDialog}>Create your first module</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                modules?.map((module: any) => {
                                    const moduleStats = stats?.statsByModule?.[module.id] || { assignments: 0, completions: 0 };
                                    return (
                                        <TableRow key={module.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    {module.type === 'video' ? <Video className="h-4 w-4 text-blue-500" /> : <FileText className="h-4 w-4 text-orange-500" />}
                                                    {module.title}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {module.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-3 w-3 text-muted-foreground" />
                                                        <span>{moduleStats.assignments} Assigned</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                        <span>{moduleStats.completions} Completed</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {module.active ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Active</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Inactive</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedModule(module);
                                                            setIsAssignDialogOpen(true);
                                                        }}
                                                        title="Assign to Users"
                                                    >
                                                        <Users className="h-4 w-4 text-primary" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(module)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingModuleId(module.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Assignment Dialog */}
            {selectedModule && (
                <TrainingAssignmentDialog
                    open={isAssignDialogOpen}
                    onOpenChange={setIsAssignDialogOpen}
                    clientId={clientId}
                    moduleId={selectedModule.id}
                />
            )}

            {/* Create/Edit Dialog */}
            <EnhancedDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                title={selectedModule ? "Edit Module" : "Create Module"}
                description="Configure your training content."
            >
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Module Title</Label>
                            <Input id="title" name="title" defaultValue={selectedModule?.title} required placeholder="e.g. Data Privacy Basics" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Short Description</Label>
                            <Textarea id="description" name="description" defaultValue={selectedModule?.description} placeholder="What will employees learn?" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Content Type</Label>
                                <Select name="type" defaultValue={selectedModule?.type || "video"}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="video">Video</SelectItem>
                                        <SelectItem value="text">Rich Text</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                                <Input id="durationMinutes" name="durationMinutes" type="number" defaultValue={selectedModule?.durationMinutes} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="videoUrl">Video URL (YouTube/Vimeo link or direct file)</Label>
                            <Input id="videoUrl" name="videoUrl" defaultValue={selectedModule?.videoUrl} placeholder="https://youtube.com/..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="thumbnailUrl">Custom Thumbnail URL (Optional)</Label>
                            <Input id="thumbnailUrl" name="thumbnailUrl" defaultValue={selectedModule?.thumbnailUrl} placeholder="If empty, YouTube/Vimeo thumbnail will be used if possible" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">Text Content (if Type is Rich Text)</Label>
                            <Textarea id="content" name="content" className="min-h-[200px]" defaultValue={selectedModule?.content} placeholder="Markdown or HTML supported..." />
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch id="active" name="active" defaultChecked={selectedModule ? selectedModule.active : true} />
                            <Label htmlFor="active">Module is active and visible to employees</Label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                            {selectedModule ? "Update Module" : "Create Module"}
                        </Button>
                    </div>
                </form>
            </EnhancedDialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingModuleId} onOpenChange={(open) => !open && setDeletingModuleId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the training module and all completion records.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deletingModuleId && deleteMutation.mutate({ clientId, id: deletingModuleId })}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );

    if (hideLayout) return content;

    return (
        <DashboardLayout>
            {content}
        </DashboardLayout>
    );
}
