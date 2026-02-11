
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { useLocation, useParams } from "wouter";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Plus, Search, Github, Layers, Calendar, ChevronRight, Trash2 } from "lucide-react";
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
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageGuide } from "@/components/PageGuide";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@complianceos/ui/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@complianceos/ui/ui/dialog";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Badge } from "@complianceos/ui/ui/badge";
import { format } from "date-fns";

export const DevProjectsList = () => {
    const { selectedClientId } = useClientContext();
    const params = useParams();
    const [location, setLocation] = useLocation();

    const clientId = params.clientId ? parseInt(params.clientId) : selectedClientId;

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [projectToDelete, setProjectToDelete] = useState<number | null>(null);

    // Create Project State
    const [newProject, setNewProject] = useState({
        name: "",
        description: "",
        repositoryUrl: "",
        techStackInput: "",
        owner: ""
    });

    const utils = trpc.useContext();
    const { data: projects, isLoading } = trpc.devProjects.list.useQuery({ clientId: clientId! }, { enabled: !!clientId });

    const createMutation = trpc.devProjects.create.useMutation({
        onSuccess: () => {
            utils.devProjects.list.invalidate();
            setIsCreateOpen(false);
            setNewProject({ name: "", description: "", repositoryUrl: "", techStackInput: "", owner: "" });
        }
    });

    const deleteMutation = trpc.devProjects.delete.useMutation({
        onSuccess: () => {
            utils.devProjects.list.invalidate();
            setProjectToDelete(null);
        }
    });

    const handleDelete = async () => {
        if (!projectToDelete || !clientId) return;
        await deleteMutation.mutateAsync({
            id: projectToDelete,
            clientId: clientId
        });
    };

    const handleCreate = async () => {
        if (!clientId) return;
        await createMutation.mutateAsync({
            clientId: clientId,
            name: newProject.name,
            description: newProject.description,
            repositoryUrl: newProject.repositoryUrl,
            techStack: newProject.techStackInput.split(',').map(s => s.trim()).filter(Boolean),
            owner: newProject.owner
        });
    };

    const filteredProjects = projects?.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-6 page-transition">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Threat Modeling" },
                    ]}
                />
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Threat Modeling</h1>
                        <p className="text-slate-500 mt-2">Manage security and risks for your software development projects.</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <PageGuide
                            title="Threat Modeling"
                            description="Identify and mitigate security risks in your software design."
                            rationale="Shift security left by finding design flaws early in the SDLC."
                            howToUse={[
                                { step: "Create Project", description: "Define the application scope." },
                                { step: "Model Threats", description: "Use STRIDE or LINDDUN to find issues." },
                                { step: "Treat Risks", description: "Assign mitigations to developers." }
                            ]}
                            integrations={[
                                { name: "GitHub", description: "Link repos for automated scanning." },
                                { name: "JIRA", description: "Push mitigations as tasks." }
                            ]}
                        />
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button><Plus className="mr-2 h-4 w-4" /> New Project</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Project</DialogTitle>
                                    <DialogDescription>Add a new software project to track security risks.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Project Name</Label>
                                        <Input
                                            value={newProject.name}
                                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                            placeholder="e.g. Customer Portal"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={newProject.description}
                                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                            placeholder="Brief description of the project..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Repository URL</Label>
                                        <Input
                                            value={newProject.repositoryUrl}
                                            onChange={(e) => setNewProject({ ...newProject, repositoryUrl: e.target.value })}
                                            placeholder="https://github.com/..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tech Stack (comma separated)</Label>
                                        <Input
                                            value={newProject.techStackInput}
                                            onChange={(e) => setNewProject({ ...newProject, techStackInput: e.target.value })}
                                            placeholder="React, Node, Postgres..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Owner / Lead</Label>
                                        <Input
                                            value={newProject.owner}
                                            onChange={(e) => setNewProject({ ...newProject, owner: e.target.value })}
                                            placeholder="Tech Lead or Team Name"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreate} disabled={!newProject.name || createMutation.isLoading}>
                                        {createMutation.isLoading ? "Creating..." : "Create Project"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the project
                                and all associated threat models and risks.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            >
                                {deleteMutation.isLoading ? "Deleting..." : "Delete Project"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Filters */}
                <div className="flex items-center space-x-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search projects..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-3 text-center py-10">Loading projects...</div>
                    ) : filteredProjects?.length === 0 ? (
                        <div className="col-span-3 text-center py-10 text-slate-500 border border-dashed rounded-lg">
                            No projects found. Create your first one to get started.
                        </div>
                    ) : (
                        filteredProjects?.map(project => (
                            <Card
                                key={project.id}
                                className="hover:shadow-md transition-shadow cursor-pointer group"
                                onClick={() => setLocation(`/clients/${clientId}/dev/projects/${project.id}`)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">{project.name}</CardTitle>
                                        {project.repositoryUrl && <Github className="h-5 w-5 text-slate-400" />}
                                    </div>
                                    <CardDescription className="line-clamp-2 min-h-[40px]">{project.description || "No description provided."}</CardDescription>
                                </CardHeader>
                                <CardContent className="pb-3">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {project.techStack?.slice(0, 3).map((tech: string) => (
                                            <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                                        ))}
                                        {(project.techStack?.length || 0) > 3 && (
                                            <Badge variant="outline" className="text-xs">+{project.techStack!.length - 3}</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center text-sm text-slate-500 gap-4">
                                        <div className="flex items-center">
                                            <Layers className="h-4 w-4 mr-1" />
                                            {project.threatModelCount || 0} Threat Models
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            Updated {format(new Date(project.updatedAt!), 'MMM d')}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0 flex justify-between items-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setProjectToDelete(project.id);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                                    </Button>
                                    <Button variant="ghost" className="text-blue-600 p-0 h-auto hover:bg-transparent group-hover:underline">
                                        View Details <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};
