
import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Loader2, Flag, Clock, MoreHorizontal, Plus, List as ListIcon, CheckCircle2, AlertTriangle, Kanban, LayoutDashboard, User, Link, X, GanttChart as GanttChartIcon } from 'lucide-react';
import { Button } from '@complianceos/ui/ui/button';
import { Badge } from '@complianceos/ui/ui/badge';
import { Card, CardContent } from '@complianceos/ui/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@complianceos/ui/ui/dialog';
import { Input } from '@complianceos/ui/ui/input';
import { Label } from '@complianceos/ui/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import GanttChart from './GanttChart';
import { validateDependency, findDependencyCycles, isTaskBlocked } from './dependencyUtils';

export default function ExecutionDashboard({ planId }: { planId: number }) {
    const { data, isLoading } = trpc.roadmap.get.useQuery({ planId });

    // State for task editing
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [selectedDependencies, setSelectedDependencies] = useState<number[]>([]);
    const [selectedAssignee, setSelectedAssignee] = useState<string>('');
    const [dependencyError, setDependencyError] = useState<string | null>(null);
    const [dependencyCycles, setDependencyCycles] = useState<string[]>([]);

    // Handlers for task editing
    const handleEditTask = (task: any) => {
        setEditingTask(task);
        setSelectedDependencies(task.dependencies || []);
        setSelectedAssignee(task.assignee || '');
        setDependencyError(null);
        setDependencyCycles([]);
        setEditDialogOpen(true);

        // Check for existing cycles
        const cycles = findDependencyCycles(items.map(item => ({
            id: item.id,
            dependencies: item.dependencies || [],
            title: item.title
        })));
        setDependencyCycles(cycles);
    };

    const handleSaveTask = () => {
        // In a real implementation, this would call an API to update the task
        console.log('Saving task:', {
            ...editingTask,
            dependencies: selectedDependencies,
            assignee: selectedAssignee
        });

        // For now, just close the dialog
        setEditDialogOpen(false);
        setEditingTask(null);
        setSelectedDependencies([]);
        setSelectedAssignee('');
    };

    const handleCancelEdit = () => {
        setEditDialogOpen(false);
        setEditingTask(null);
        setSelectedDependencies([]);
        setSelectedAssignee('');
    };

    const handleAddDependency = (taskId: number) => {
        if (!selectedDependencies.includes(taskId)) {
            // Validate the dependency
            const error = validateDependency(
                items.map(item => ({
                    id: item.id,
                    dependencies: item.id === editingTask?.id ?
                        [...selectedDependencies, taskId] :
                        item.dependencies || [],
                    title: item.title
                })),
                editingTask?.id || 0,
                taskId
            );

            if (error) {
                setDependencyError(error);
                return;
            }

            setSelectedDependencies([...selectedDependencies, taskId]);
            setDependencyError(null);
        }
    };

    const handleRemoveDependency = (taskId: number) => {
        setSelectedDependencies(selectedDependencies.filter(id => id !== taskId));
        setDependencyError(null);
    };

    // Transform roadmap items to Gantt tasks
    const transformItemsToGanttTasks = (items: any[]): any[] => {
        return items.map((item, index) => {
            // Calculate dates based on phase and index
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + (item.phase || 1) * 7 + index * 2);

            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + (item.estimatedDuration || 5));

            // progress Calculate based on status
            let progress = 0;
            let status: 'not_started' | 'in_progress' | 'completed' | 'blocked' = 'not_started';

            if (item.status === 'done') {
                progress = 100;
                status = 'completed';
            } else if (item.status === 'in_progress') {
                progress = 50;
                status = 'in_progress';
            } else if (item.status === 'pending') {
                progress = 0;
                status = 'not_started';
            }

            // Determine priority
            let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
            if (item.priority === 'critical') priority = 'critical';
            else if (item.priority === 'high') priority = 'high';
            else if (item.priority === 'low') priority = 'low';

            return {
                id: item.id,
                title: item.title,
                description: item.description,
                startDate,
                endDate,
                progress,
                assignee: item.assignee,
                priority,
                dependencies: item.dependencies || [],
                phase: item.phase || 1,
                status
            };
        });
    };



    if (isLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;
    if (!data) return <div className="p-8">Plan not found</div>;

    const { plan, items } = data;
    const totalItems = items.length;
    const completedItems = items.filter((i: any) => i.status === 'done').length;
    const inProgressItems = items.filter((i: any) => i.status === 'in_progress').length;
    const pendingItems = items.filter((i: any) => i.status === 'pending').length;
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50/30">
            {/* Header */}
            <header className="bg-white border-b px-8 py-5 flex items-center justify-between sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">{plan.title}</h1>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Flag className="w-3 h-3" /> Target: {plan.targetDate ? format(new Date(plan.targetDate), "MMM d, yyyy") : 'Not set'}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {totalItems} Tasks</span>
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">{Math.round(progress)}% Complete</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Add Task
                    </Button>
                </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 px-8 py-6">
                <StatsCard title="Total Tasks" value={totalItems} icon={ListIcon} />
                <StatsCard title="In Progress" value={inProgressItems} icon={Clock} color="text-amber-500" />
                <StatsCard title="Completed" value={completedItems} icon={CheckCircle2} color="text-green-500" />
                <StatsCard title="Remaining" value={pendingItems} icon={AlertTriangle} color="text-red-500" />
            </div>

            {/* Content Tabs */}
            <div className="flex-1 px-8 pb-8 overflow-hidden">
                <Tabs defaultValue="board" className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            <TabsTrigger value="board" className="gap-2"><Kanban className="w-4 h-4" /> Board</TabsTrigger>
                            <TabsTrigger value="gantt" className="gap-2"><GanttChartIcon className="w-4 h-4" /> Gantt</TabsTrigger>
                            <TabsTrigger value="timeline" className="gap-2"><LayoutDashboard className="w-4 h-4" /> Timeline</TabsTrigger>
                            <TabsTrigger value="list" className="gap-2"><ListIcon className="w-4 h-4" /> List</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-hidden rounded-lg bg-white border shadow-sm">
                        <TabsContent value="board" className="h-full m-0 p-0">
                            <RoadmapBoard items={items} onEditTask={handleEditTask} />
                        </TabsContent>
                        <TabsContent value="gantt" className="h-full m-0 p-0 overflow-auto">
                            <div className="p-4">
                                <GanttChart
                                    tasks={transformItemsToGanttTasks(items)}
                                    onTaskClick={handleEditTask}
                                    height={500}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="timeline" className="h-full m-0 p-0 overflow-auto">
                            <RoadmapTimeline items={items} />
                        </TabsContent>
                        <TabsContent value="list" className="h-full m-0 p-0 overflow-auto">
                            <RoadmapList items={items} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            {/* Task Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                        <DialogDescription>
                            Update task details, dependencies, and assignment.
                        </DialogDescription>
                    </DialogHeader>

                    {editingTask && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="task-title">Task Title</Label>
                                <Input
                                    id="task-title"
                                    value={editingTask.title}
                                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="task-assignee">Assignee</Label>
                                <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                                    <SelectTrigger id="task-assignee">
                                        <SelectValue placeholder="Select assignee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="john.doe">John Doe</SelectItem>
                                        <SelectItem value="jane.smith">Jane Smith</SelectItem>
                                        <SelectItem value="mike.johnson">Mike Johnson</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Dependencies</Label>
                                <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                                    {items
                                        .filter((task: any) => task.id !== editingTask.id)
                                        .map((task: any) => (
                                            <div key={task.id} className="flex items-center gap-2 p-1">
                                                <input
                                                    type="checkbox"
                                                    id={`dep-${task.id}`}
                                                    checked={selectedDependencies.includes(task.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            handleAddDependency(task.id);
                                                        } else {
                                                            handleRemoveDependency(task.id);
                                                        }
                                                    }}
                                                    className="h-4 w-4"
                                                />
                                                <label htmlFor={`dep-${task.id}`} className="text-sm">
                                                    {task.title}
                                                </label>
                                            </div>
                                        ))}
                                </div>

                                {/* Dependency Validation Error */}
                                {dependencyError && (
                                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                                        <div className="flex items-center gap-2 text-red-700">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-sm font-medium">{dependencyError}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Existing Dependency Cycles Warning */}
                                {dependencyCycles.length > 0 && (
                                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                                        <div className="flex items-center gap-2 text-amber-700 mb-1">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-sm font-medium">Dependency Cycles Detected</span>
                                        </div>
                                        <ul className="text-xs text-amber-600 space-y-1">
                                            {dependencyCycles.map((cycle, index) => (
                                                <li key={index}>• {cycle}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancelEdit}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveTask}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, color = "text-primary" }: any) {
    return (
        <Card className="shadow-sm border-none bg-white">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
                <div className={cn("p-2 rounded-full bg-gray-50", color)}>
                    <Icon className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    );
}

function RoadmapBoard({ items, onEditTask }: { items: any[], onEditTask: (task: any) => void }) {
    // Group by Phase or Status. Let's use Phase for the board columns.
    const phases = [1, 2, 3];
    return (
        <div className="h-full overflow-x-auto p-4">
            <div className="flex h-full gap-4">
                {phases.map(phase => (
                    <div key={phase} className="w-80 flex-shrink-0 flex flex-col h-full rounded-lg bg-gray-50/50 border">
                        <div className="p-3 border-b bg-white rounded-t-lg flex justify-between items-center sticky top-0">
                            <h3 className="font-semibold text-sm">Phase {phase}</h3>
                            <Badge variant="secondary">{items.filter((i: any) => (i.phase || 1) === phase).length}</Badge>
                        </div>
                        <div className="p-3 space-y-3 overflow-y-auto flex-1">
                            {items.filter((i: any) => (i.phase || 1) === phase).map((item: any) => (
                                <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group">
                                    <CardContent className="p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-xs font-semibold text-primary line-clamp-1 mb-1">{item.controlId}</span>
                                            <div className="flex items-center gap-1">
                                                {item.status === 'done' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                                <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onEditTask(item)}>
                                                    <MoreHorizontal className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="font-medium text-sm line-clamp-2 mb-2">{item.title}</p>

                                        {/* Dependencies indicator */}
                                        {item.dependencies && item.dependencies.length > 0 && (
                                            <div className="flex items-center gap-1 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                <span className="text-xs text-muted-foreground">
                                                    Depends on {item.dependencies.length} task{item.dependencies.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        )}

                                        {/* Blocked indicator */}
                                        {isTaskBlocked(item.id, items) && (
                                            <div className="flex items-center gap-1 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                <span className="text-xs text-red-600 font-medium">
                                                    Blocked by dependencies
                                                </span>
                                            </div>
                                        )}

                                        {/* Assignment indicator */}
                                        {item.assignee && (
                                            <div className="flex items-center gap-1 mb-2">
                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                                    {item.assignee.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {item.assignee}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3 h-3" />
                                                {item.estimatedDuration}d
                                            </div>
                                            {item.priority && (
                                                <Badge variant={
                                                    item.priority === 'critical' ? 'destructive' :
                                                        item.priority === 'high' ? 'default' :
                                                            'secondary'
                                                } className="text-[10px] px-1.5 py-0">
                                                    {item.priority}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RoadmapTimeline({ items }: { items: any[] }) {
    // Simple vertical timeline for now
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            {items.map((item: any, index: number) => (
                <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className={cn("w-3 h-3 rounded-full mt-1.5", item.status === 'done' ? "bg-green-500" : "bg-primary")} />
                        {index < items.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                    </div>
                    <div className="flex-1 pb-8">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold">{item.title}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                    </div>
                                    <Badge variant="outline">Phase {item.phase}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ))}
        </div>
    );
}

function RoadmapList({ items }: { items: any[] }) {
    return (
        <div className="flex flex-col">
            {items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border-b hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                        {item.status === 'done'
                            ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                            : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{item.title}</h4>
                            <Badge variant="secondary" className="text-[10px]">Phase {item.phase}</Badge>
                            {item.priority && (
                                <Badge variant={
                                    item.priority === 'critical' ? 'destructive' :
                                        item.priority === 'high' ? 'default' :
                                            'secondary'
                                } className="text-[10px] px-1.5 py-0">
                                    {item.priority}
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-1">{item.controlId}</p>

                        {/* Dependencies and assignment info */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {item.dependencies && item.dependencies.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    <span>{item.dependencies.length} dependency{item.dependencies.length !== 1 ? 's' : ''}</span>
                                </div>
                            )}
                            {item.assignee && (
                                <div className="flex items-center gap-1">
                                    <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
                                        {item.assignee.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="truncate max-w-[100px]">{item.assignee}</span>
                                </div>
                            )}
                            {isTaskBlocked(item.id, items) && (
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <span className="text-xs text-red-600">Blocked</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground w-24 text-right">
                        {item.estimatedDuration} days
                    </div>
                </div>
            ))}
        </div>
    );
}
