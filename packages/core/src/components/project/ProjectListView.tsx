import React, { useState } from 'react';
import { trpc } from '../../lib/trpc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import {
    MoreHorizontal,
    Calendar,
    User as UserIcon,
    AlertTriangle,
    CheckSquare,
    ArrowUpDown,
    Filter
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@complianceos/ui/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback } from "@complianceos/ui/ui/avatar";
import { TaskDialog } from './TaskDialog';
import { TaskDetailView } from './TaskDetailView';

interface ProjectListViewProps {
    clientId: number;
}

export function ProjectListView({ clientId }: ProjectListViewProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);

    // Detail View State
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const [sortField, setSortField] = useState<string>('updatedAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [filterType, setFilterType] = useState<string>('all');

    const { data: tasks, isLoading, refetch } = trpc.projectTasks.list.useQuery({ clientId });
    const deleteTaskMutation = trpc.projectTasks.delete.useMutation();

    const handleRowClick = (task: any) => {
        setSelectedTask(task);
        setIsDetailOpen(true);
    };

    const handleEdit = (task: any) => {
        if (!task.canEdit) {
            toast.info(`This is a ${task.sourceType === 'remediation' ? 'Remediation Task' : 'Risk Treatment'}. Please edit it in its respective module.`);
            return;
        }
        setEditingTask(task);
        setIsDialogOpen(true);
        setIsDetailOpen(false); // Close detail if opening edit
    };

    const handleCreate = () => {
        setEditingTask(null);
        setIsDialogOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, task: any) => {
        e.stopPropagation(); // Prevent row click
        if (!task.canEdit) {
            toast.error("Cannot delete external tasks from here.");
            return;
        }
        if (confirm("Are you sure you want to delete this task?")) {
            try {
                await deleteTaskMutation.mutateAsync({ id: task.id });
                toast.success("Task deleted");
                refetch();
                if (selectedTask?.id === task.id) setIsDetailOpen(false);
            } catch (e) {
                toast.error("Failed to delete task");
            }
        }
    };

    // ... (Keep existing getStatusBadgeVariant and getPriorityColor helpers if needed, or inline them) ...
    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'done': return 'success';
            case 'in_progress': return 'default';
            case 'review': return 'warning';
            case 'todo': return 'secondary';
            default: return 'outline';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'text-red-600 bg-red-50';
            case 'high': return 'text-orange-600 bg-orange-50';
            case 'medium': return 'text-blue-600 bg-blue-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    // Filter and Sort tasks
    const processedTasks = React.useMemo(() => {
        if (!tasks) return [];

        let filtered = tasks;
        if (filterType !== 'all') {
            if (filterType === 'project_task') filtered = tasks.filter((t: any) => t.sourceType === 'project_task');
            else if (filterType === 'control') filtered = tasks.filter((t: any) => t.sourceType === 'control');
            else if (filterType === 'policy') filtered = tasks.filter((t: any) => t.sourceType === 'policy');
            else if (filterType === 'risk') filtered = tasks.filter((t: any) => t.sourceType === 'risk_treatment');
        }

        return [...filtered].sort((a: any, b: any) => {
            let valA = a[sortField];
            let valB = b[sortField];

            // Handle dates
            if (sortField === 'dueDate' || sortField === 'updatedAt') {
                valA = valA ? new Date(valA).getTime() : 0;
                valB = valB ? new Date(valB).getTime() : 0;
            }
            // Handle string comparisons
            else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [tasks, sortField, sortOrder, filterType]);

    const toggleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc'); // Default to newest/highest first when switching fields
        }
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading tasks...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[180px] h-8 text-xs">
                            <SelectValue placeholder="Filter by Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Items</SelectItem>
                            <SelectItem value="project_task">Tasks</SelectItem>
                            <SelectItem value="control">Controls</SelectItem>
                            <SelectItem value="policy">Policies</SelectItem>
                            <SelectItem value="risk">Risks</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleCreate} size="sm">
                    <CheckSquare className="h-4 w-4 mr-2" />
                    New Task
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[400px]">
                                <Button variant="ghost" onClick={() => toggleSort('title')} className="h-8 px-2 -ml-2 font-bold text-xs uppercase text-muted-foreground hover:text-foreground">
                                    Task
                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => toggleSort('status')} className="h-8 px-2 -ml-2 font-bold text-xs uppercase text-muted-foreground hover:text-foreground">
                                    Status
                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => toggleSort('priority')} className="h-8 px-2 -ml-2 font-bold text-xs uppercase text-muted-foreground hover:text-foreground">
                                    Priority
                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => toggleSort('sourceType')} className="h-8 px-2 -ml-2 font-bold text-xs uppercase text-muted-foreground hover:text-foreground">
                                    Type
                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => toggleSort('assigneeName')} className="h-8 px-2 -ml-2 font-bold text-xs uppercase text-muted-foreground hover:text-foreground">
                                    Assignee
                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => toggleSort('dueDate')} className="h-8 px-2 -ml-2 font-bold text-xs uppercase text-muted-foreground hover:text-foreground">
                                    Due Date
                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                </Button>
                            </TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {processedTasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No items found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            processedTasks.map((task: any) => (
                                <TableRow
                                    key={`${task.sourceType}-${task.id}`}
                                    className="group cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleRowClick(task)}
                                >
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{task.title}</span>
                                            {task.description && (
                                                <span className="text-xs text-muted-foreground line-clamp-1">{task.description}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(
                                            "capitalize font-normal",
                                            task.status === 'done' && "bg-green-50 text-green-700 border-green-200",
                                            task.status === 'in_progress' && "bg-blue-50 text-blue-700 border-blue-200",
                                            task.status === 'review' && "bg-orange-50 text-orange-700 border-orange-200",
                                            task.status === 'todo' && "bg-slate-50 text-slate-700 border-slate-200"
                                        )}>
                                            {task.status?.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {task.priority && (
                                            <Badge variant="secondary" className={cn("capitalize font-normal text-xs", getPriorityColor(task.priority))}>
                                                {task.priority}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {task.sourceType === 'project_task' && <span className="text-xs text-muted-foreground">Task</span>}
                                        {task.sourceType === 'control' && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 font-normal">Control</Badge>}
                                        {task.sourceType === 'policy' && <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200 font-normal">Policy</Badge>}
                                        {task.sourceType === 'remediation' && <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 font-normal">Remediation</Badge>}
                                        {task.sourceType === 'risk_treatment' && <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200 font-normal">Risk</Badge>}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-[10px] bg-sky-100 text-sky-700">
                                                    {task.assigneeInitials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm truncate max-w-[120px]" title={task.assigneeName}>
                                                {task.assigneeName}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {task.dueDate ? (
                                            <div className={cn("flex items-center text-xs",
                                                new Date(task.dueDate) < new Date() && task.status !== 'done' ? "text-red-500 font-medium" : "text-muted-foreground"
                                            )}>
                                                <Calendar className="h-3 w-3 mr-1.5" />
                                                {format(new Date(task.dueDate), 'MMM d, yyyy')}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {task.canEdit && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(task); }}>
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600" onClick={(e) => handleDelete(e, task)}>
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <TaskDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                clientId={clientId}
                task={editingTask}
                onSuccess={() => {
                    refetch();
                }}
            />

            <TaskDetailView
                open={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                task={selectedTask}
            />
        </div>
    );
}
