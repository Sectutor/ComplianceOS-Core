
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useClientContext } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Avatar, AvatarFallback } from "@complianceos/ui/ui/avatar";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, Circle, Clock, Loader2, Filter, User as UserIcon, X, Save, AlertCircle, Plus as PlusIcon, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@complianceos/ui/ui/sheet";
import { Label } from "@complianceos/ui/ui/label";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

export default function ClientTasksPage() {
    const { selectedClientId } = useClientContext();
    const { user } = useAuth();

    // State
    const [filterSource, setFilterSource] = useState<string>("all"); // 'all', 'general', 'remediation'
    const [viewMode, setViewMode] = useState<"all" | "mine">("all");
    const [selectedTask, setSelectedTask] = useState<any>(null); // Task object being viewed
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<any>(null);

    const ctx = trpc.useContext();

    // Queries
    const { data: tasks, isLoading: isLoadingTasks } = trpc.actions.listAll.useQuery(
        { clientId: selectedClientId as number },
        { enabled: !!selectedClientId }
    );

    const { data: assignees } = trpc.actions.listAssignees.useQuery(
        { clientId: selectedClientId as number },
        { enabled: !!selectedClientId }
    );

    const updateTask = trpc.actions.updateStatus.useMutation({
        onSuccess: () => {
            toast.success("Task updated");
            ctx.actions.listAll.invalidate();
            setIsSheetOpen(false);
        },
        onError: (err) => {
            toast.error("Failed to update task: " + err.message);
        }
    });

    const deleteTask = trpc.actions.delete.useMutation({
        onSuccess: () => {
            toast.success("Task deleted");
            ctx.actions.listAll.invalidate();
            setTaskToDelete(null);
        },
        onError: (err) => {
            toast.error("Failed to delete task: " + err.message);
        }
    });

    // Filter Logic
    const filteredTasks = tasks?.filter((t: any) => {
        if (filterSource !== "all" && t.type !== filterSource) return false;
        if (viewMode === "mine" && user && t.assigneeId !== user.id) return false;
        return true;
    }) || [];

    // Helper functions
    const getAssigneeName = (id: number) => {
        const found = assignees?.find((e: any) => e.id === id);
        return found ? `${found.firstName} ${found.lastName}` : `User ${id}`;
    };

    const getStatusBadge = (status: string | null) => {
        const s = status?.toLowerCase() || 'pending';
        if (s.includes('done') || s.includes('complete') || s.includes('verified') || s === 'closed' || s === 'approved' || s === 'implemented')
            return <Badge variant="success" className="uppercase text-[10px] font-bold px-2.5"><CheckCircle2 className="w-3 h-3 mr-1" /> {status}</Badge>;
        if (s.includes('progress') || s === 'todo' || s === 'active')
            return <Badge variant="info" className="uppercase text-[10px] font-bold px-2.5"><Clock className="w-3 h-3 mr-1" /> {status}</Badge>;
        if (s.includes('review') || s === 'resolved')
            return <Badge variant="warning" className="uppercase text-[10px] font-bold px-2.5"><AlertCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
        return <Badge variant="secondary" className="uppercase text-[10px] font-bold px-2.5"><Circle className="w-3 h-3 mr-1" /> {status}</Badge>;
    };

    const getTypeBadge = (type: string, sourceLabel: string) => {
        switch (type) {
            case 'remediation': return <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">Remediation</Badge>;
            case 'poam': return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">POA&M</Badge>;
            default: return <Badge variant="outline" className="border-slate-200 text-slate-700">General</Badge>;
        }
    };

    // Create Task State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', assigneeId: undefined as number | undefined, dueDate: '' });

    const createTask = trpc.actions.create.useMutation({
        onSuccess: () => {
            toast.success("Task created");
            ctx.actions.listAll.invalidate();
            setIsCreateOpen(false);
            setNewTask({ title: '', description: '', priority: 'medium', assigneeId: undefined, dueDate: '' });
        },
        onError: (err) => {
            toast.error("Failed to create task: " + err.message);
        }
    });

    const handleStatusChange = (id: number, newStatus: string) => {
        updateTask.mutate({
            id,
            status: newStatus,
            clientId: selectedClientId as number
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this task?')) {
            deleteTask.mutate({
                id,
                clientId: selectedClientId as number
            });
        }
    };

    const handleCreate = () => {
        if (!newTask.title) {
            toast.error("Title is required");
            return;
        }
        createTask.mutate({
            clientId: selectedClientId as number,
            title: newTask.title,
            description: newTask.description,
            priority: newTask.priority,
            dueDate: newTask.dueDate || undefined,
            assigneeId: newTask.assigneeId
        });
    };

    const handleDoubleClick = (task: any) => {
        setSelectedTask(task);
        setIsSheetOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Tasks Management</h1>
                        <p className="text-muted-foreground">Universal view of all tasks, remediation items, and assignments.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center border rounded-lg p-1 bg-white">
                            <Button
                                variant={viewMode === 'all' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('all')}
                                className="text-xs h-8"
                            >
                                All Tasks
                            </Button>
                            <Button
                                variant={viewMode === 'mine' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('mine')}
                                className="text-xs h-8"
                            >
                                My Tasks
                            </Button>
                        </div>

                        <Select value={filterSource} onValueChange={setFilterSource}>
                            <SelectTrigger className="w-[180px] bg-white">
                                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Source" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sources</SelectItem>
                                <SelectItem value="generic">General Tasks</SelectItem>
                                <SelectItem value="remediation">Remediation</SelectItem>
                                <SelectItem value="poam">POA&M</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            onClick={() => setIsCreateOpen(true)}
                        >
                            <PlusIcon className="w-4 h-4 mr-2" /> Create Task
                        </Button>
                    </div>
                </div>

                {/* Task Board */}
                <Card className="border shadow-lg rounded-xl overflow-hidden bg-white">
                    <CardHeader className="pb-3 border-b bg-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg text-black">Active Tasks</CardTitle>
                                <CardDescription>
                                    Double-click a task to view details and manage.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table className="table-fancy">
                            <TableHeader>
                                <TableRow className="border-none">
                                    <TableHead className="w-[400px] text-white font-semibold py-4">Task Details</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Source</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Assignee</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Status</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Due Date</TableHead>
                                    <TableHead className="text-right text-white font-semibold py-4">Priority</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingTasks ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex items-center justify-center text-muted-foreground">
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Loading tasks...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredTasks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                            No tasks found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTasks.map((task: any) => (
                                        <TableRow
                                            key={task.id}
                                            className="bg-white border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition-all duration-200 hover:shadow-sm group"
                                            onDoubleClick={() => handleDoubleClick(task)}
                                        >
                                            <TableCell className="py-4">
                                                <div className="font-medium text-black">{task.title}</div>
                                                <div className="text-xs text-gray-500 mt-0.5 flex gap-2">
                                                    <span>{task.sourceLabel}</span>
                                                    <span>•</span>
                                                    {/* Using createdAt from actions.ts might technically not be on all types, but safe enough if missing */}
                                                    <span>Created {task.originalId ? '-' : '-'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {getTypeBadge(task.type, task.sourceLabel)}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6 border">
                                                        <AvatarFallback className="text-[10px] bg-white border border-gray-200 text-gray-600">
                                                            {task.assigneeId ? 'U' : '?'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm text-gray-700">
                                                        {task.assigneeId ? getAssigneeName(task.assigneeId) : <span className="text-gray-400 italic">Unassigned</span>}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {getStatusBadge(task.status)}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {task.dueDate ? (
                                                    <div className={cn("flex items-center text-sm", new Date(task.dueDate) < new Date() ? "text-red-600 font-medium" : "text-gray-600")}>
                                                        <CalendarIcon className="w-3 h-3 mr-1.5 opacity-70" />
                                                        {format(new Date(task.dueDate), "MMM d, yyyy")}
                                                    </div>
                                                ) : <span className="text-gray-400 text-xs">-</span>}
                                            </TableCell>
                                            <TableCell className="text-right py-4">
                                                <Badge
                                                    variant={
                                                        task.priority === 'critical' ? 'error' :
                                                            task.priority === 'high' ? 'warning' :
                                                                'secondary'
                                                    }
                                                    className="capitalize text-[10px] font-bold px-2.5"
                                                >
                                                    {task.priority || 'medium'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-600 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTaskToDelete(task);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Create Task Dialog using Sheet for consistency */}
                <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <SheetContent className="sm:max-w-md w-full">
                        <SheetHeader className="mb-6">
                            <SheetTitle>Create New Task</SheetTitle>
                            <SheetDescription>
                                Add a new task to your list.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Title <span className="text-red-500">*</span></Label>
                                <Input
                                    placeholder="Task title"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    placeholder="Details about the task..."
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select
                                        value={newTask.priority}
                                        onValueChange={(val) => setNewTask({ ...newTask, priority: val })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Due Date</Label>
                                    <Input
                                        type="date"
                                        value={newTask.dueDate}
                                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Assignee</Label>
                                <Select
                                    value={newTask.assigneeId?.toString() || ""}
                                    onValueChange={(val) => setNewTask({ ...newTask, assigneeId: parseInt(val) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Unassigned" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {assignees?.map((e: any) => (
                                            <SelectItem key={e.id} value={e.id.toString()}>
                                                {e.firstName} {e.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <SheetFooter className="mt-8">
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={handleCreate}
                                    disabled={createTask.isPending}
                                >
                                    {createTask.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlusIcon className="w-4 h-4 mr-2" />}
                                    Create Task
                                </Button>
                            </SheetFooter>
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Task Details Sheet */}
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetContent className="sm:max-w-md w-full">
                        <SheetHeader className="mb-6">
                            <SheetTitle>Manage Task</SheetTitle>
                            <SheetDescription>
                                {selectedTask?.sourceLabel}
                            </SheetDescription>
                        </SheetHeader>

                        {selectedTask && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <div className="text-sm font-medium p-2 bg-slate-50 border rounded-md">
                                        {selectedTask.title}
                                    </div>
                                    {selectedTask.description && (
                                        <p className="text-xs text-muted-foreground mt-1">{selectedTask.description}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select
                                            defaultValue={selectedTask.status}
                                            onValueChange={(val) => setSelectedTask({ ...selectedTask, status: val })}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="open">Open / To Do</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="review">Review</SelectItem>
                                                <SelectItem value="done">Done / Completed</SelectItem>
                                                <SelectItem value="closed">Closed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Priority</Label>
                                        <div className="flex items-center h-10 px-3 border rounded-md bg-slate-50 text-sm text-gray-500">
                                            {selectedTask.priority}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Assignee</Label>
                                    <Select
                                        value={selectedTask.assigneeId ? selectedTask.assigneeId.toString() : "unassigned"}
                                        onValueChange={(val) => {
                                            const v = parseInt(val);
                                            setSelectedTask({ ...selectedTask, assigneeId: (isNaN(v) || val === "unassigned") ? null : v });
                                        }}
                                        disabled={selectedTask.type === 'poam'} // Lock for POA&M for now
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Unassigned" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {assignees?.map((e: any) => (
                                                <SelectItem key={e.id} value={e.id.toString()}>
                                                    {e.firstName} {e.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Due Date</Label>
                                    <Input
                                        type="date"
                                        defaultValue={selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setSelectedTask({ ...selectedTask, dueDate: e.target.value })}
                                        disabled={selectedTask.type === 'remediation'} // Lock for remediation? No, allow.
                                    />
                                </div>

                                <SheetFooter className="mt-8 flex justify-between sm:justify-between">
                                     <Button 
                                        variant="destructive" 
                                        size="icon"
                                        onClick={() => {
                                            setIsSheetOpen(false);
                                            setTaskToDelete(selectedTask);
                                        }}
                                        title="Delete Task"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                                        <Button
                                            onClick={() => updateTask.mutate({
                                                id: selectedTask.id,
                                                status: selectedTask.status,
                                                priority: selectedTask.priority,
                                                dueDate: selectedTask.dueDate,
                                                assigneeId: selectedTask.assigneeId,
                                                clientId: selectedClientId as number
                                            })}
                                            disabled={updateTask.isPending}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {updateTask.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </SheetFooter>
                            </div>
                        )}
                    </SheetContent>
                </Sheet>

                <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the task "{taskToDelete?.title}".
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => taskToDelete && deleteTask.mutate({ 
                                    id: taskToDelete.id,
                                    clientId: selectedClientId as number
                                })}
                            >
                                {deleteTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </div>
        </DashboardLayout>
    );
}



