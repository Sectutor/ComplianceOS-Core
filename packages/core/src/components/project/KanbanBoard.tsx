import React, { useState, useMemo } from 'react';
import { trpc } from '../../lib/trpc';
import { TaskDialog } from './TaskDialog';
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import { Plus, MoreHorizontal, Calendar, User as UserIcon, AlertTriangle, CheckSquare } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@complianceos/ui/ui/dropdown-menu";
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback } from "@complianceos/ui/ui/avatar";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Input } from "@complianceos/ui/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Search, Filter, X } from 'lucide-react';
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

interface KanbanBoardProps {
    clientId: number;
}

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

const COLUMNS: { id: TaskStatus; title: string, color: string }[] = [
    { id: 'todo', title: 'To Do', color: 'bg-slate-500/10 border-slate-500/20' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500/10 border-blue-500/20' },
    { id: 'review', title: 'Review', color: 'bg-orange-500/10 border-orange-500/20' },
    { id: 'done', title: 'Done', color: 'bg-green-500/10 border-green-500/20' },
];

export function KanbanBoard({ clientId }: KanbanBoardProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [draggedTaskId, setDraggedTaskId] = useState<{ id: number, type: string } | null>(null);
    const [activeColumn, setActiveColumn] = useState<TaskStatus | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<any>(null);

    // Filters State
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPriority, setFilterPriority] = useState<string>("all");
    const [filterAssignee, setFilterAssignee] = useState<string>("all");
    const [initialStatus, setInitialStatus] = useState<TaskStatus>("todo"); // For quick add

    const { data: tasks, isLoading, refetch } = trpc.projectTasks.list.useQuery({ clientId });
    const { data: members } = trpc.users.listWorkspaceMembers.useQuery({ clientId }); // For assignee filter

    const updateStatusMutation = trpc.projectTasks.updatePosition.useMutation();
    const deleteTaskMutation = trpc.projectTasks.delete.useMutation();

    const handleEdit = (task: any) => {
        if (!task.canEdit) {
            toast.info(`This is a ${task.sourceType === 'remediation' ? 'Remediation Task' : 'Risk Treatment'}. Please edit it in its respective module.`);
            return;
        }
        setEditingTask(task);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingTask(null);
        setInitialStatus("todo");
        setIsDialogOpen(true);
    };

    const handleQuickAdd = (status: TaskStatus) => {
        setEditingTask(null);
        setInitialStatus(status);
        setIsDialogOpen(true);
    };

    const handleDelete = (task: any) => {
        if (!task.canEdit) {
            toast.error("Cannot delete external tasks from here.");
            return;
        }
        setTaskToDelete(task);
    };

    const confirmDelete = async () => {
        if (taskToDelete) {
            try {
                await deleteTaskMutation.mutateAsync({ id: taskToDelete.id });
                toast.success("Task deleted");
                setTaskToDelete(null);
                refetch();
            } catch (e) {
                toast.error("Failed to delete task");
            }
        }
    };

    const handleDragStart = (e: React.DragEvent, taskId: number, type: string) => {
        e.dataTransfer.setData('taskId', taskId.toString());
        e.dataTransfer.setData('taskType', type);
        e.dataTransfer.effectAllowed = 'move';
        setDraggedTaskId({ id: taskId, type });
    };

    const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (activeColumn !== status) {
            setActiveColumn(status);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Optional: Could reset active column if leaving the board, but 'drop' and 'end' handle cleanup
    };

    const handleDragEnd = () => {
        setDraggedTaskId(null);
        setActiveColumn(null);
    };

    const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        setActiveColumn(null);
        const taskIdString = e.dataTransfer.getData('taskId');
        const taskType = e.dataTransfer.getData('taskType');
        const taskId = parseInt(taskIdString);

        if (taskId) {
            const task = tasks?.find(t => t.id === taskId && t.sourceType === taskType);
            if (task && task.status !== status) {
                // Optimistic Update could go here, but we'll rely on refetch for now
                try {
                    await updateStatusMutation.mutateAsync({
                        id: taskId,
                        sourceType: taskType,
                        status,
                        position: 0
                    });
                    toast.success(`Task moved to ${COLUMNS.find(c => c.id === status)?.title}`);
                    refetch();
                } catch (e) {
                    toast.error("Failed to move task");
                }
            }
        }
        setDraggedTaskId(null);
    };

    const tasksByStatus = useMemo(() => {
        const acc: Record<TaskStatus, typeof tasks> = {
            todo: [],
            in_progress: [],
            review: [],
            done: []
        };
        tasks?.forEach(task => {
            // Filter Logic
            if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) && !task.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
                return;
            }
            if (filterPriority !== 'all' && task.priority !== filterPriority) {
                return;
            }
            if (filterAssignee !== 'all') {
                if (filterAssignee === 'unassigned' && task.assigneeId) return;
                if (filterAssignee !== 'unassigned' && task.assigneeId?.toString() !== filterAssignee) return;
            }

            const status = task.status as TaskStatus;
            if (acc[status]) acc[status]?.push(task);
        });
        return acc;
    }, [tasks, searchTerm, filterPriority, filterAssignee]);

    if (isLoading) return <div className="flex items-center justify-center p-8"><span className="loading loading-spinner">Loading...</span></div>;

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold tracking-tight">Project Board</h2>
                    <Button onClick={handleCreate} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New Task
                    </Button>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-lg border shadow-sm">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9 bg-slate-50 border-slate-200"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />

                        <Select value={filterPriority} onValueChange={setFilterPriority}>
                            <SelectTrigger className="w-[130px] h-9 text-xs">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                            <SelectTrigger className="w-[150px] h-9 text-xs">
                                <SelectValue placeholder="Assignee" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Assignees</SelectItem>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {members?.map((m: any) => (
                                    <SelectItem key={m.id} value={m.id.toString()}>{m.name || m.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {(searchTerm || filterPriority !== 'all' || filterAssignee !== 'all') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-2 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilterPriority("all");
                                    setFilterAssignee("all");
                                }}
                            >
                                <X className="h-4 w-4 mr-1" /> Clear
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto min-h-[500px]">
                <div className="flex gap-4 h-full min-w-[1000px]">
                    {COLUMNS.map(column => (
                        <div
                            key={column.id}
                            className={cn(
                                "flex-1 flex flex-col rounded-lg border p-3 min-w-[280px] transition-colors duration-200",
                                column.color,
                                activeColumn === column.id ? "bg-slate-100 ring-2 ring-primary/20 border-primary/50" : "bg-slate-50/50"
                            )}
                            onDragOver={(e) => handleDragOver(e, column.id)}
                            onDrop={(e) => handleDrop(e, column.id)}
                        >
                            <div className="flex items-center justify-between mb-3 px-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-sm text-slate-700">{column.title}</h3>
                                    <Badge variant="secondary" className="text-xs">
                                        {tasksByStatus[column.id]?.length || 0}
                                    </Badge>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-slate-400 hover:text-slate-700 hover:bg-white/50"
                                    onClick={() => handleQuickAdd(column.id)}
                                    title={`Add task to ${column.title}`}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="space-y-3 pr-2 pb-2">
                                    {tasksByStatus[column.id]?.map((task: any) => (
                                        <Card
                                            key={`${task.sourceType}-${task.id}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task.id, task.sourceType)}
                                            onClick={() => handleEdit(task)}
                                            className={cn(
                                                "cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 relative group border-l-4",
                                                draggedTaskId?.id === task.id && draggedTaskId?.type === task.sourceType ? "opacity-50 rotate-2 scale-95" : "",
                                                task.priority === 'critical' ? 'border-l-red-500' :
                                                    task.priority === 'high' ? 'border-l-orange-500' :
                                                        task.priority === 'medium' ? 'border-l-blue-500' : 'border-l-slate-300'
                                            )}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <CardContent className="p-3 space-y-2">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="flex-1 gap-1">
                                                        <span className="font-medium text-sm leading-tight line-clamp-2">{task.title}</span>
                                                        <div className="mt-1 flex gap-1">
                                                            {task.sourceType === 'remediation' && <Badge variant="outline" className="text-[10px] h-4 px-1 bg-purple-50 text-purple-700 border-purple-200">Remediation</Badge>}
                                                            {task.sourceType === 'risk_treatment' && <Badge variant="outline" className="text-[10px] h-4 px-1 bg-red-50 text-red-700 border-red-200">Risk</Badge>}
                                                        </div>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <MoreHorizontal className="h-3 w-3" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(task); }}>
                                                                {task.canEdit ? 'Edit' : 'View Details'}
                                                            </DropdownMenuItem>
                                                            {task.canEdit && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(task); }}>Delete</DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {task.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                        {task.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex items-center gap-2">
                                                        {task.dueDate && (
                                                            <div className={cn("flex items-center text-[10px]",
                                                                new Date(task.dueDate) < new Date() ? "text-red-500 font-medium" : "text-slate-500"
                                                            )}>
                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                {format(new Date(task.dueDate), 'MMM d')}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {task.assigneeId ? (
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">ID</AvatarFallback>
                                                        </Avatar>
                                                    ) : (
                                                        <UserIcon className="h-4 w-4 text-slate-300" />
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {tasksByStatus[column.id]?.length === 0 && (
                                        <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                                            Drop tasks here
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    ))}
                </div>
            </div>

            <TaskDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                clientId={clientId}
                task={editingTask && editingTask.canEdit ? editingTask : null} // Only pass task if editable
                initialStatus={initialStatus}
                onSuccess={() => refetch()}
            />

            <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <b>{taskToDelete?.title}</b>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                        >
                            Delete Task
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
