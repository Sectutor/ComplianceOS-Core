import React, { useState, useMemo } from 'react';
import { GanttChart as GanttChartIcon, Calendar, Filter, ZoomIn, ZoomOut, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Button } from '@complianceos/ui/ui/button';
import { Badge } from '@complianceos/ui/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface GanttTask {
    id: number;
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    progress: number; // 0-100
    assignee?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    dependencies: number[]; // IDs of tasks this depends on
    phase?: number;
    status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
}

interface GanttChartProps {
    tasks: GanttTask[];
    startDate?: Date;
    endDate?: Date;
    onTaskClick?: (task: GanttTask) => void;
    height?: number;
}

export default function GanttChart({ 
    tasks, 
    startDate, 
    endDate, 
    onTaskClick,
    height = 600 
}: GanttChartProps) {
    // View state
    const [viewMode, setViewMode] = useState<'week' | 'month' | 'quarter'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [zoomLevel, setZoomLevel] = useState(1);
    const [showDependencies, setShowDependencies] = useState(true);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

    // Calculate date range
    const dateRange = useMemo(() => {
        if (startDate && endDate) {
            return { start: startDate, end: endDate };
        }
        
        // Auto-calculate from tasks
        const taskDates = tasks.flatMap(task => [task.startDate, task.endDate]);
        const minDate = new Date(Math.min(...taskDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...taskDates.map(d => d.getTime())));
        
        // Add buffer
        const bufferDays = 7;
        return {
            start: addDays(minDate, -bufferDays),
            end: addDays(maxDate, bufferDays)
        };
    }, [tasks, startDate, endDate]);

    // Generate timeline days based on view mode
    const timelineDays = useMemo(() => {
        const { start, end } = dateRange;
        
        switch (viewMode) {
            case 'week':
                return eachDayOfInterval({ 
                    start: startOfWeek(start, { weekStartsOn: 1 }), 
                    end: endOfWeek(end, { weekStartsOn: 1 }) 
                });
            case 'month':
                // Show first day of each week for month view
                const weeks = [];
                let current = startOfWeek(start, { weekStartsOn: 1 });
                while (current <= end) {
                    weeks.push(current);
                    current = addDays(current, 7);
                }
                return weeks;
            case 'quarter':
                // Show first day of each month for quarter view
                const months = [];
                let currentMonth = new Date(start.getFullYear(), start.getMonth(), 1);
                while (currentMonth <= end) {
                    months.push(currentMonth);
                    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth()  +1, 1);
                }
                return months;
        }
    }, [dateRange, viewMode]);

    // Calculate task positions
    const taskPositions = useMemo(() => {
        const { start } = dateRange;
        const totalDays = (dateRange.end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        
        return tasks.map(task => {
            const startOffset = (task.startDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
            const duration = (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24);
            
            return {
                task,
                left: (startOffset / totalDays) * 100,
                width: Math.max((duration / totalDays) * 100, 1), // Minimum 1% width
                isSelected: task.id === selectedTaskId
            };
        });
    }, [tasks, dateRange, selectedTaskId]);

    // Find dependencies for visualization
    const dependencyLines = useMemo(() => {
        if (!showDependencies) return [];
        
        const lines = [];
        for (const task of tasks) {
            for (const depId of task.dependencies) {
                const dependency = tasks.find(t => t.id === depId);
                if (dependency) {
                    const startTask = taskPositions.find(tp => tp.task.id === task.id);
                    const depTask = taskPositions.find(tp => tp.task.id === depId);
                    
                    if (startTask && depTask) {
                        lines.push({
                            from: { 
                                x: depTask.left + depTask.width, 
                                y: tasks.findIndex(t => t.id === depId) 
                            },
                            to: { 
                                x: startTask.left, 
                                y: tasks.findIndex(t => t.id === task.id) 
                            }
                        });
                    }
                }
            }
        }
        return lines;
    }, [tasks, taskPositions, showDependencies]);

    // Handle task click
    const handleTaskClick = (task: GanttTask) => {
        setSelectedTaskId(task.id);
        if (onTaskClick) {
            onTaskClick(task);
        }
    };

    // Navigation
    const navigatePrevious = () => {
        switch (viewMode) {
            case 'week':
                setCurrentDate(addDays(currentDate, -7));
                break;
            case 'month':
                setCurrentDate(addDays(currentDate, -30));
                break;
            case 'quarter':
                setCurrentDate(addDays(currentDate, -90));
                break;
        }
    };

    const navigateNext = () => {
        switch (viewMode) {
            case 'week':
                setCurrentDate(addDays(currentDate, 7));
                break;
            case 'month':
                setCurrentDate(addDays(currentDate, 30));
                break;
            case 'quarter':
                setCurrentDate(addDays(currentDate, 90));
                break;
        }
    };

    // Format date for header
    const formatDateHeader = () => {
        switch (viewMode) {
            case 'week':
                return `Week of ${format(currentDate, 'MMM d, yyyy')}`;
            case 'month':
                return format(currentDate, 'MMMM yyyy');
            case 'quarter':
                const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
                return `Q${quarter} ${currentDate.getFullYear()}`;
        }
    };

    // Get priority color
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-blue-500';
            case 'low': return 'bg-gray-400';
            default: return 'bg-gray-400';
        }
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'in_progress': return 'bg-blue-500';
            case 'blocked': return 'bg-red-500';
            case 'not_started': return 'bg-gray-300';
            default: return 'bg-gray-300';
        }
    };

    return (
        <Card className="w-full border shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <GanttChartIcon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Project Timeline</CardTitle>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateHeader()}
                        </Badge>
                        
                        <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                            <TabsList>
                                <TabsTrigger value="week">Week</TabsTrigger>
                                <TabsTrigger value="month">Month</TabsTrigger>
                                <TabsTrigger value="quarter">Quarter</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
                
                {/* Controls */}
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={navigatePrevious}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                            Today
                        </Button>
                        
                        <Button variant="outline" size="sm" onClick={navigateNext}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button 
                            variant={showDependencies ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setShowDependencies(!showDependencies)}
                        >
                            <Filter className="h-4 w-4 mr-1" />
                            {showDependencies ? 'Hide Dependencies' : 'Show Dependencies'}
                        </Button>
                        
                        <div className="flex items-center gap-1">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                                disabled={zoomLevel <= 0.5}
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            
                            <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                                {Math.round(zoomLevel * 100)}%
                            </span>
                            
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                                disabled={zoomLevel >= 2}
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="p-0 overflow-hidden">
                <div 
                    className="relative overflow-x-auto" 
                    style={{ height: `${height}px` }}
                >
                    {/* Timeline Header */}
                    <div className="sticky top-0 z-20 bg-white border-b">
                        <div className="flex">
                            <div className="w-64 flex-shrink-0 border-r p-3 bg-gray-50">
                                <div className="font-medium text-sm">Task</div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex" style={{ transform: `scaleX(${zoomLevel})`, transformOrigin: 'left' }}>
                                    {timelineDays.map((day, index) => (
                                        <div 
                                            key={index}
                                            className={cn(
                                                "flex-1 min-w-[80px] border-r p-2 text-center",
                                                isSameDay(day, new Date()) && "bg-blue-50"
                                            )}
                                        >
                                            <div className="text-xs font-medium">
                                                {viewMode === 'week' ? format(day, 'EEE') : 
                                                 viewMode === 'month' ? `Week ${Math.floor(index / 7) + 1}` :
                                                 format(day, 'MMM')}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {viewMode === 'week' ? format(day, 'd') :
                                                 viewMode === 'month' ? format(day, 'd') :
                                                 format(day, 'yyyy')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Gantt Chart Body */}
                    <div className="relative">
                        {/* Dependency Lines */}
                        {showDependencies && dependencyLines.map((line, index) => (
                            <svg
                                key={index}
                                className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
                                style={{ transform: `scaleX(${zoomLevel})`, transformOrigin: 'left' }}
                            >
                                <line
                                    x1={`${line.from.x}%`}
                                    y1={`${(line.from.y * 60) + 30}px`}
                                    x2={`${line.to.x}%`}
                                    y2={`${(line.to.y * 60) + 30}px`}
                                    stroke="#f59e0b"
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                    markerEnd="url(#arrowhead)"
                                />
                                <defs>
                                    <marker
                                        id="arrowhead"
                                        markerWidth="10"
                                        markerHeight="7"
                                        refX="9"
                                        refY="3.5"
                                        orient="auto"
                                    >
                                        <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
                                    </marker>
                                </defs>
                            </svg>
                        ))}
                        
                        {/* Tasks */}
                        {taskPositions.map(({ task, left, width, isSelected }, index) => (
                            <div 
                                key={task.id}
                                className={cn(
                                    "flex border-b hover:bg-gray-50 transition-colors",
                                    isSelected && "bg-blue-50"
                                )}
                                style={{ height: '60px' }}
                                onClick={() => handleTaskClick(task)}
                            >
                                {/* Task Info Column */}
                                <div className="w-64 flex-shrink-0 border-r p-3 flex items-center gap-3">
                                    <div className={cn(
                                        "w-3 h-3 rounded-full",
                                        getPriorityColor(task.priority)
                                    )} />
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-sm truncate">{task.title}</h4>
                                            {task.assignee && (
                                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                                    {task.assignee.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                                Phase {task.phase || 1}
                                            </Badge>
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                getStatusColor(task.status)
                                            )} />
                                            <span className="text-xs text-muted-foreground">
                                                {task.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Timeline Column */}
                                <div className="flex-1 min-w-0 relative">
                                    <div 
                                        className="absolute top-1/2 -translate-y-1/2 h-8 rounded-md border shadow cursor-sm-pointer hover:shadow-md transition-shadow"
                                        style={{
                                            left: `${left}%`,
                                            width: `${width}%`,
                                            transform: `scaleX(${1/zoomLevel})`,
                                            transformOrigin: 'left',
                                            minWidth: '20px'
                                        }}
                                    >
                                        {/* Task Bar */}
                                        <div className={cn(
                                            "h-full rounded-md flex items-center px-2",
                                            task.status === 'completed' ? 'bg-green-500' :
                                            task.status === 'in_progress' ? 'bg-blue-500' :
                                            task.status === 'blocked' ? 'bg-red-500' :
                                            'bg-gray-300'
                                        )}>
                                            {/* Progress Bar */}
                                            {task.status === 'in_progress' && task.progress > 0 && (
                                                <div 
                                                    className="absolute left-0 top-0 h-full bg-green-400 rounded-l-md"
                                                    style={{ width: `${task.progress}%` }}
                                                />
                                            )}
                                            
                                            {/* Task Info on Bar */}
                                            <div className="relative z-10 flex items-center justify-between w-full">
                                                <span className="text-xs font-medium text-white truncate">
                                                    {task.title}
                                                </span>
                                                <span className="text-xs text-white/80">
                                                    {task.progress}%
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Start/End Date Labels */}
                                        <div className="absolute -top-5 left-0 text-xs text-muted-foreground whitespace-nowrap">
                                            {format(task.startDate, 'MMM d')}
                                        </div>
                                        <div className="absolute -top-5 right-0 text-xs text-muted-foreground whitespace-nowrap">
                                            {format(task.endDate, 'MMM d')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Legend */}
                <div className="border-t p-3 bg-gray-50">
                    <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">Legend:</span>
                        
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span>Critical</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500" />
                            <span>High</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span>Medium</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-400" />
                            <span>Low</span>
                        </div>
                        
                        <div className="ml-4 flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-500" />
                            <span>Completed</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-blue-500" />
                            <span>In Progress</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-500" />
                            <span>Blocked</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}