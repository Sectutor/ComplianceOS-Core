import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@complianceos/ui/ui/dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, CheckCircle2 } from "lucide-react";
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

export default function IssueTrackerSettings() {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<string>("");
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [connectionToDelete, setConnectionToDelete] = useState<any>(null);

    const { data: connections, isLoading, refetch } = trpc.issueTrackers.list.useQuery({});
    const { data: clients } = trpc.clients.list.useQuery();

    const createMutation = trpc.issueTrackers.create.useMutation({
        onSuccess: () => {
            toast.success("Issue tracker connected");
            setIsAddOpen(false);
            refetch();
        },
        onError: (err) => toast.error(err.message),
    });

    const deleteMutation = trpc.issueTrackers.delete.useMutation({
        onSuccess: () => {
            toast.success("Connection removed");
            setConnectionToDelete(null);
            refetch();
        },
        onError: (err) => toast.error(err.message),
    });

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedProvider || !selectedClientId) {
            toast.error("Please select provider and client");
            return;
        }
        const formData = new FormData(e.currentTarget);
        createMutation.mutate({
            clientId: parseInt(selectedClientId),
            provider: selectedProvider as "jira" | "linear",
            name: formData.get("name") as string,
            baseUrl: formData.get("baseUrl") as string || undefined,
            credentials: formData.get("credentials") as string,
            projectKey: formData.get("projectKey") as string || undefined,
        });
    };

    const getProviderLogo = (provider: string) => {
        if (provider === "jira") {
            return <span className="text-blue-600 font-bold text-lg">Jira</span>;
        }
        return <span className="text-purple-600 font-bold text-lg">Linear</span>;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <Breadcrumb items={[{ label: "Admin" }, { label: "Issue Trackers" }]} />

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Issue Tracker Integrations</h1>
                        <p className="text-muted-foreground">Connect Jira or Linear to sync remediation tasks</p>
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" />Add Connection</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleCreate}>
                                <DialogHeader>
                                    <DialogTitle>Connect Issue Tracker</DialogTitle>
                                    <DialogDescription>
                                        Link Jira or Linear to automatically create and sync remediation tasks.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Client *</Label>
                                        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select client" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {clients?.map((c) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Provider *</Label>
                                        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select provider" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="jira">Jira (Atlassian)</SelectItem>
                                                <SelectItem value="linear">Linear</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Connection Name *</Label>
                                        <Input name="name" placeholder="e.g. Production Jira" required />
                                    </div>
                                    {selectedProvider === "jira" && (
                                        <div className="grid gap-2">
                                            <Label>Jira Base URL</Label>
                                            <Input name="baseUrl" placeholder="https://yourcompany.atlassian.net" />
                                        </div>
                                    )}
                                    <div className="grid gap-2">
                                        <Label>API Token / Credentials *</Label>
                                        <Input name="credentials" type="password" placeholder="Enter API token" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Default Project Key</Label>
                                        <Input name="projectKey" placeholder="e.g. COMP or SEC" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={createMutation.isPending}>
                                        {createMutation.isPending ? "Connecting..." : "Connect"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                    <TableHead className="text-white font-semibold py-4">Provider</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Name</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Client</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Project</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Status</TableHead>
                                    <TableHead className="w-24 text-white font-semibold py-4">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {connections?.map((conn) => (
                                    <TableRow key={conn.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                                        <TableCell className="py-4">{getProviderLogo(conn.provider)}</TableCell>
                                        <TableCell className="font-medium text-black py-4">{conn.name}</TableCell>
                                        <TableCell className="text-gray-600 py-4">{clients?.find(c => c.id === conn.clientId)?.name || '-'}</TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant="outline" className="bg-white border-gray-300 text-gray-700">{conn.projectKey || 'Default'}</Badge>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Connected
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                                                onClick={() => setConnectionToDelete(conn)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!connections || connections.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500 bg-white">
                                            No issue trackers connected
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* Remediation Tasks Section */}
                <RemediationTasksSection />

                <AlertDialog open={!!connectionToDelete} onOpenChange={(open) => !open && setConnectionToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Disconnect Issue Tracker?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to disconnect <b>{connectionToDelete?.name}</b>?
                                Existing synced tasks will remain but no longer update.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => {
                                    if (connectionToDelete) {
                                        deleteMutation.mutate({ id: connectionToDelete.id });
                                    }
                                }}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? "Disconnecting..." : "Disconnect"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}

function RemediationTasksSection() {
    const { data: tasks } = trpc.remediationTasks.list.useQuery({});

    const getPriorityBadge = (priority: string | null) => {
        switch (priority) {
            case "critical":
                return <Badge variant="destructive">Critical</Badge>;
            case "high":
                return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
            case "medium":
                return <Badge variant="secondary">Medium</Badge>;
            default:
                return <Badge variant="outline">Low</Badge>;
        }
    };

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case "resolved":
            case "closed":
                return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
            case "in_progress":
                return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
            default:
                return <Badge variant="secondary">Open</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Remediation Tasks</h2>
            <Card>
                <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                <TableHead className="text-white font-semibold py-4">Title</TableHead>
                                <TableHead className="text-white font-semibold py-4">Priority</TableHead>
                                <TableHead className="text-white font-semibold py-4">Status</TableHead>
                                <TableHead className="text-white font-semibold py-4">External Link</TableHead>
                                <TableHead className="text-white font-semibold py-4">Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks?.map((task) => (
                                <TableRow key={task.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                                    <TableCell className="font-medium text-black py-4">{task.title}</TableCell>
                                    <TableCell className="py-4">{getPriorityBadge(task.priority)}</TableCell>
                                    <TableCell className="py-4">{getStatusBadge(task.status)}</TableCell>
                                    <TableCell className="py-4">
                                        {task.externalIssueUrl ? (
                                            <a
                                                href={task.externalIssueUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-blue-600 hover:underline"
                                            >
                                                {task.externalIssueId}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="text-gray-500 py-4">{task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '-'}</TableCell>
                                </TableRow>
                            ))}
                            {(!tasks || tasks.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500 bg-white">
                                        No remediation tasks created yet
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
