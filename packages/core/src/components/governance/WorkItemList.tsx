
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal
} from "@complianceos/ui/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { CheckCircle2, MoreHorizontal, User as UserIcon, Calendar, ArrowUpCircle, Filter, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@complianceos/ui/ui/avatar";
import { toast } from "sonner";
import { Skeleton } from "@complianceos/ui/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@complianceos/ui/ui/dialog";
import { Label } from "@complianceos/ui/ui/label";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";

interface WorkItemListProps {
    clientId: number;
}

export function WorkItemList({ clientId }: WorkItemListProps) {
    const [activeTab, setActiveTab] = useState("all");
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const [, setLocation] = useLocation();
    const [editingTask, setEditingTask] = useState<any | null>(null);

    // Query for tasks
    const { data: tasks, isLoading, refetch } = trpc.governance.list.useQuery({
        clientId,
        status: statusFilter as any, // Simple type bypass for demo
    });

    // Fetch users for assignment (Fix: Use listAssignees instead of me)
    const { data: assignees } = trpc.universalTasks.listAssignees.useQuery({ clientId });

    const updateMutation = trpc.governance.update.useMutation({
        onSuccess: () => {
            toast.success("Task updated");
            refetch();
        },
        onError: (err) => {
            toast.error("Failed to update task");
        }
    });

    const handleRowDoubleClick = (task: any) => {
        // Open task for editing
        setEditingTask(task);
    };

    const onTabChange = (val: string) => {
        setActiveTab(val);
        if (val === "all") setStatusFilter(undefined);
        if (val === "pending") setStatusFilter("pending");
        if (val === "completed") setStatusFilter("completed");
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "critical": return "text-red-600 bg-red-50 border-red-200";
            case "high": return "text-orange-600 bg-orange-50 border-orange-200";
            case "medium": return "text-blue-600 bg-blue-50 border-blue-200";
            case "low": return "text-gray-600 bg-gray-50 border-gray-200";
            default: return "";
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed": return <Badge variant="default" className="bg-green-600">Completed</Badge>;
            case "in_progress": return <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress</Badge>;
            case "pending": return <Badge variant="outline" className="text-gray-500">Pending</Badge>;
            case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getAssigneeName = (id: number | null) => {
        if (!id) return "Unassigned";
        const found = assignees?.find(u => u.id === id);
        return found ? `${found.firstName} ${found.lastName}` : `User ${id}`;
    };

    const handleComplete = (id: number) => {
        updateMutation.mutate({ clientId, id, status: "completed" });
    };

    const handleAssignUser = (taskId: number, userId: number | null) => {
        updateMutation.mutate({ clientId, id: taskId, assignedToUserId: userId });
        toast.success(userId ? "User assigned" : "Task unassigned");
    };

    if (isLoading) {
        return <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Tabs value={activeTab} onValueChange={onTabChange} className="w-[400px]">
                    <TabsList className="bg-slate-100">
                        <TabsTrigger
                            value="all"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                        >
                            All Tasks
                        </TabsTrigger>
                        <TabsTrigger
                            value="pending"
                            className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"
                        >
                            Pending
                        </TabsTrigger>
                        <TabsTrigger
                            value="completed"
                            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                        >
                            Completed
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Filter className="h-3.5 w-3.5" />
                    <span>Filter</span>
                </Button>
            </div>

            <div className="rounded-md border bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                            <TableHead className="w-[40%] text-white font-semibold py-4">Task Details</TableHead>
                            <TableHead className="text-white font-semibold py-4">Status</TableHead>
                            <TableHead className="text-white font-semibold py-4">Priority</TableHead>
                            <TableHead className="text-white font-semibold py-4">Due Date</TableHead>
                            <TableHead className="text-white font-semibold py-4">Assignee</TableHead>
                            <TableHead className="w-[50px] text-white font-semibold py-4"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks && tasks.length > 0 ? (
                            tasks.map((task) => (
                                <TableRow
                                    key={task.id}
                                    className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group cursor-pointer"
                                    onDoubleClick={() => handleRowDoubleClick(task)}
                                >
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-sm">{task.title}</span>
                                            {task.description && (
                                                <span className="text-xs text-muted-foreground line-clamp-1">
                                                    {task.description}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(task.status || 'pending')}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority || 'medium')}`}>
                                            {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {task.dueDate ? (
                                            <div className={`flex items-center gap-1.5 text-sm ${new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>{format(new Date(task.dueDate), "MMM d")}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-[10px]">
                                                    <UserIcon className="h-3 w-3" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs text-muted-foreground">
                                                {getAssigneeName(task.assignedToUserId)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleComplete(task.id)}>
                                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                                    Mark as Complete
                                                </DropdownMenuItem>
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>
                                                        <UserIcon className="mr-2 h-4 w-4" />
                                                        Assign User
                                                        <ChevronRight className="ml-auto h-4 w-4" />
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuPortal>
                                                        <DropdownMenuSubContent className="max-h-[200px] overflow-y-auto">
                                                            <DropdownMenuItem onClick={() => handleAssignUser(task.id, null)}>
                                                                Unassign
                                                            </DropdownMenuItem>
                                                            {assignees?.map((user) => (
                                                                <DropdownMenuItem key={user.id} onClick={() => handleAssignUser(task.id, user.id)}>
                                                                    {user.firstName} {user.lastName}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuPortal>
                                                </DropdownMenuSub>
                                                <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                                        <p>No tasks found for this view.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Task Dialog */}
            {editingTask && (
                <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Edit Task</DialogTitle>
                            <DialogDescription>Update task details and assignment</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    defaultValue={editingTask.title}
                                    onBlur={(e) => e.target.value !== editingTask.title && updateMutation.mutate({ clientId, id: editingTask.id, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    defaultValue={editingTask.description || ''}
                                    onBlur={(e) => e.target.value !== editingTask.description && updateMutation.mutate({ clientId, id: editingTask.id, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Due Date</Label>
                                    <Input
                                        type="date"
                                        defaultValue={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''}
                                        onBlur={(e) => e.target.value && updateMutation.mutate({ clientId, id: editingTask.id, dueDate: new Date(e.target.value).toISOString() })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        defaultValue={editingTask.status}
                                        onValueChange={(val) => {
                                            updateMutation.mutate({ clientId, id: editingTask.id, status: val });
                                            setEditingTask({ ...editingTask, status: val });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Assignee</Label>
                                <Select
                                    defaultValue={editingTask.assignedToUserId?.toString() || "unassigned"}
                                    onValueChange={(val) => {
                                        const userId = val === "unassigned" ? null : parseInt(val);
                                        updateMutation.mutate({ clientId, id: editingTask.id, assignedToUserId: userId });
                                        setEditingTask({ ...editingTask, assignedToUserId: userId });
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Assignee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {assignees?.map((user) => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                {user.firstName} {user.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setEditingTask(null)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
