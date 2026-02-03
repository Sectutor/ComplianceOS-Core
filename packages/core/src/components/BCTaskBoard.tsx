
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@complianceos/ui/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Calendar } from "@complianceos/ui/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@complianceos/ui/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Plus, CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientContext } from "@/contexts/ClientContext";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@complianceos/ui/ui/table";
import { Avatar, AvatarFallback } from "@complianceos/ui/ui/avatar";

export function BCTaskBoard() {
    const { selectedClientId } = useClientContext();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string | "all">("all");

    // Form State
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        assigneeId: "",
        dueDate: undefined as Date | undefined,
        priority: "medium"
    });

    const ctx = trpc.useContext();

    // Fetch Tasks
    const { data: tasks, isLoading: isLoadingTasks } = trpc.businessContinuity.collaboration.listTasks.useQuery(
        {
            clientId: selectedClientId as number,
            status: filterStatus === "all" ? undefined : filterStatus
        },
        { enabled: !!selectedClientId }
    );

    // Fetch Assignees (using Call Tree logic)
    const { data: contacts } = trpc.businessContinuity.callTree.list.useQuery(
        { clientId: selectedClientId as number },
        { enabled: !!selectedClientId }
    );

    const assignees = contacts?.internal || [];

    // Mutations
    const createTask = trpc.businessContinuity.collaboration.assignTask.useMutation({
        onSuccess: () => {
            toast.success("Task assigned successfully");
            setIsCreateOpen(false);
            setNewTask({ title: "", description: "", assigneeId: "", dueDate: undefined, priority: "medium" });
            ctx.businessContinuity.collaboration.listTasks.invalidate();
        },
        onError: (err) => toast.error(err.message)
    });

    const updateTask = trpc.businessContinuity.collaboration.updateTask.useMutation({
        onSuccess: () => {
            ctx.businessContinuity.collaboration.listTasks.invalidate();
            toast.success("Task updated");
        }
    });

    const handleCreate = () => {
        if (!selectedClientId) return;
        if (!newTask.title) return toast.error("Title is required");
        if (!newTask.assigneeId) return toast.error("Assignee is required");

        createTask.mutate({
            clientId: selectedClientId,
            title: newTask.title,
            description: newTask.description,
            assigneeId: parseInt(newTask.assigneeId),
            dueDate: newTask.dueDate?.toISOString(),
            // priority: newTask.priority // Pass strictly if supported by mutation
        });
    };

    const handleStatusChange = (id: number, currentStatus: string) => {
        const nextStatus = currentStatus === 'pending' ? 'in_progress' : currentStatus === 'in_progress' ? 'completed' : 'pending';
        updateTask.mutate({ id, status: nextStatus });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
            default: return <Circle className="h-4 w-4 text-slate-400" />;
        }
    };

    const getInitials = (name: string) => name.split(' ').map(p => p[0]).join('').toUpperCase().substring(0, 2);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tasks & Workflow</h1>
                    <p className="text-muted-foreground">Manage Business Continuity Plan assignments and track progress across your team.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[180px] bg-white">
                            <SelectValue placeholder="Filter Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="mr-2 h-4 w-4" />
                                Assign Task
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Task</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Task Title</label>
                                    <Input
                                        placeholder="e.g. Review BIA for HR"
                                        value={newTask.title}
                                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Assign To</label>
                                    <Select
                                        value={newTask.assigneeId}
                                        onValueChange={val => setNewTask({ ...newTask, assigneeId: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select team member" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {assignees.map((u: any) => (
                                                <SelectItem key={u.id} value={u.id.toString()}>
                                                    {u.name} ({u.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Due Date</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !newTask.dueDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {newTask.dueDate ? format(newTask.dueDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={newTask.dueDate}
                                                onSelect={(date) => setNewTask({ ...newTask, dueDate: date })}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Textarea
                                        placeholder="Details about the task..."
                                        value={newTask.description}
                                        onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreate} disabled={createTask.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">Assign Task</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="border shadow-sm">
                <CardContent className="p-0">
                    <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                    <TableHead className="w-[300px] text-white font-semibold py-4">Task</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Assignee</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Status</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Due Date</TableHead>
                                    <TableHead className="text-right text-white font-semibold py-4">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingTasks ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500 bg-white">Loading tasks...</TableCell>
                                    </TableRow>
                                ) : tasks?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500 bg-white">No tasks found.</TableCell>
                                    </TableRow>
                                ) : (
                                    tasks?.map((task: any) => (
                                        <TableRow key={task.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                                            <TableCell className="py-4">
                                                <div className="font-medium text-black">{task.title}</div>
                                                {task.description && <div className="text-xs text-gray-500 truncate max-w-[280px]">{task.description}</div>}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2">
                                                    {/* We need to match assigneeId to name, but backend only returns ID. 
                                                    Ideally backend joins user table or we lookup from contacts list.
                                                    For now, let's try to lookup from 'assignees' list if available.
                                                */}
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback className="text-[10px]">
                                                            {assignees.find((u: any) => u.id === task.assigneeId)?.name ? getInitials(assignees.find((u: any) => u.id === task.assigneeId)?.name!) : "?"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm text-gray-600">
                                                        {assignees.find((u: any) => u.id === task.assigneeId)?.name || `User ${task.assigneeId}`}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'default' : 'secondary'} className="capitalize">
                                                    {task.status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {task.dueDate ? (
                                                    <span className={cn("text-sm", new Date(task.dueDate) < new Date() && task.status !== 'completed' ? "text-red-500 font-medium" : "text-gray-600")}>
                                                        {format(new Date(task.dueDate), "MMM d, yyyy")}
                                                    </span>
                                                ) : <span className="text-gray-400 text-xs">-</span>}
                                            </TableCell>
                                            <TableCell className="text-right py-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="hover:bg-[#1C4D8D]/10 hover:text-[#1C4D8D] transition-colors duration-200"
                                                    onClick={() => handleStatusChange(task.id, task.status)}
                                                >
                                                    {task.status === 'completed' ? 'Reopen' : task.status === 'pending' ? 'Start' : 'Complete'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
