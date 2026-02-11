
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { useLocation, useParams } from "wouter";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import {
    Plus, Search, Shield, Brain, Server,
    Lock, ChevronRight, Trash2, LayoutGrid, List
} from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import { format } from "date-fns";

export const ProjectsDashboard = () => {
    const { selectedClientId } = useClientContext();
    const params = useParams();
    const [, setLocation] = useLocation();
    const clientId = params.id ? parseInt(params.id) : selectedClientId;

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [projectToDelete, setProjectToDelete] = useState<number | null>(null);

    const [newProject, setNewProject] = useState({
        name: "",
        description: "",
        projectType: "it" as "it" | "ai" | "infra" | "privacy",
        owner: "",
        securityCriticality: "medium" as "low" | "medium" | "high" | "critical",
    });

    const utils = trpc.useContext();
    const { data: projects, isLoading } = trpc.projects.list.useQuery({ clientId: clientId! }, { enabled: !!clientId });
    const { data: members } = trpc.users.listWorkspaceMembers.useQuery({ clientId: clientId! }, { enabled: !!clientId });

    const createMutation = trpc.projects.create.useMutation({
        onSuccess: () => {
            utils.projects.list.invalidate();
            setIsCreateOpen(false);
            setNewProject({
                name: "",
                description: "",
                projectType: "it",
                owner: "",
                securityCriticality: "medium"
            });
        }
    });

    const deleteMutation = trpc.projects.delete.useMutation({
        onSuccess: () => {
            utils.projects.list.invalidate();
            setProjectToDelete(null);
        }
    });

    const handleCreate = async () => {
        if (!clientId) return;
        await createMutation.mutateAsync({
            clientId: clientId,
            ...newProject
        });
    };

    const handleDelete = async () => {
        if (!projectToDelete || !clientId) return;
        await deleteMutation.mutateAsync({
            id: projectToDelete,
            clientId: clientId
        });
    };

    const getProjectIcon = (type: string) => {
        switch (type) {
            case 'ai': return <Brain className="h-5 w-5 text-purple-500" />;
            case 'infra': return <Server className="h-5 w-5 text-blue-500" />;
            case 'privacy': return <Lock className="h-5 w-5 text-emerald-500" />;
            default: return <Shield className="h-5 w-5 text-slate-500" />;
        }
    };

    const getCriticalityBadge = (level: string) => {
        switch (level) {
            case 'critical': return <Badge className="bg-red-600">Critical</Badge>;
            case 'high': return <Badge className="bg-orange-500">High</Badge>;
            case 'medium': return <Badge className="bg-yellow-500">Medium</Badge>;
            default: return <Badge variant="secondary">Low</Badge>;
        }
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
                        { label: "Projects" },
                    ]}
                />

                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                            Security Projects
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">
                            Track the security posture of your IT, AI, and Infrastructure projects.
                        </p>
                    </div>

                    <div className="flex gap-4 items-center">
                        <PageGuide
                            title="Security Projects"
                            description="Manage and track security initiatives across IT, AI, and Infrastructure."
                            rationale="Projects group related assets and risks, allowing for focused assessment and remediation."
                            howToUse={[
                                { step: "Create Project", description: "Define clear scope and criticality for new initiatives." },
                                { step: "Assign Owner", description: "Designate a responsible lead for accountability." },
                                { step: "Assess Risks", description: "Use the project view to identify and treat specific risks." }
                            ]}
                            integrations={[
                                { name: "Risk Register", description: "Aggregates project risks into the global register." },
                                { name: "Threat Modeling", description: "Links technical threat models to the project." }
                            ]}
                        />
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                                    <Plus className="mr-2 h-5 w-5" /> New Project
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl">Initialize Security Project</DialogTitle>
                                    <DialogDescription>
                                        Define the scope and criticality to start tracking its security posture.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Project Name</Label>
                                        <Input
                                            value={newProject.name}
                                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                            placeholder="e.g. Migration to AWS"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Project Type</Label>
                                            <Select
                                                value={newProject.projectType}
                                                onValueChange={(v: any) => setNewProject({ ...newProject, projectType: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="it">IT Project</SelectItem>
                                                    <SelectItem value="ai">AI / LLM Project</SelectItem>
                                                    <SelectItem value="infra">Infrastructure</SelectItem>
                                                    <SelectItem value="privacy">Privacy / Personal Data</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Criticality</Label>
                                            <Select
                                                value={newProject.securityCriticality}
                                                onValueChange={(v: any) => setNewProject({ ...newProject, securityCriticality: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select level" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Low Impact</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="critical">Critical</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={newProject.description}
                                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                            placeholder="Briefly describe the security scope..."
                                            rows={3}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Owner / Lead</Label>
                                        <Select
                                            value={newProject.owner}
                                            onValueChange={(v) => setNewProject({ ...newProject, owner: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select responsible person" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {members?.map(member => (
                                                    <SelectItem key={member.id} value={member.name || member.email}>
                                                        <div className="flex flex-col">
                                                            <span>{member.name || member.email}</span>
                                                            <span className="text-[10px] text-slate-400 capitalize">{member.role}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                                {(!members || members.length === 0) && (
                                                    <SelectItem value="unassigned" disabled>No members found</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button
                                        onClick={handleCreate}
                                        className="bg-blue-600 hover:bg-blue-700"
                                        disabled={!newProject.name || createMutation.isLoading}
                                    >
                                        {createMutation.isLoading ? "Initializing..." : "Create Project"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Filter projects..."
                            className="pl-10 border-slate-200 focus:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredProjects?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                            <Shield className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">No projects started</h3>
                        <p className="text-slate-500 max-w-md mt-2">
                            Initialize your first project to begin tracking its risks and compliance posture.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects?.map(project => (
                            <Card
                                key={project.id}
                                className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-200 cursor-pointer"
                                onClick={() => setLocation(`/clients/${clientId}/projects/${project.id}`)}
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                                                {getProjectIcon(project.projectType!)}
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold group-hover:text-blue-600 transition-colors">
                                                    {project.name}
                                                </CardTitle>
                                                <div className="flex items-center mt-1 space-x-2">
                                                    <Badge variant="outline" className="capitalize text-[10px] px-2 py-0">
                                                        {project.projectType}
                                                    </Badge>
                                                    {getCriticalityBadge(project.securityCriticality!)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <CardDescription className="line-clamp-2 mt-2 h-10">
                                        {project.description || "No description provided."}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="pb-4">
                                    <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-100">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Identified Risks</p>
                                            <p className="text-xl font-bold text-slate-900">{(project as any).riskCount || 0}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Threat Models</p>
                                            <p className="text-xl font-bold text-slate-900">{(project as any).threatModelCount || 0}</p>
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-0 flex justify-between items-center bg-slate-50/50 py-3 px-6">
                                    <span className="text-xs text-slate-400">
                                        Updated {format(new Date(project.updatedAt!), 'MMM d, yyyy')}
                                    </span>
                                    <div className="flex items-center text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                                        View Posture <ChevronRight className="h-4 w-4 ml-1" />
                                    </div>
                                </CardFooter>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setProjectToDelete(project.id);
                                    }}
                                    className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </Card>
                        ))}
                    </div>
                )}

                <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Archive Security Project?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will remove the project from your active dashboard. Associated risk assessments and threat models will remain in the database but will be unlinked.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {deleteMutation.isLoading ? "Deleting..." : "Archived Project"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout >
    );
};
