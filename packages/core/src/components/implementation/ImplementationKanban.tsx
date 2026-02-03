
import React, { useState, useEffect } from 'react';
import { Badge } from "@complianceos/ui/ui/badge";
import { MoreHorizontal, Plus, Calendar, Filter, Layers, ShieldCheck, Target, RefreshCw } from "lucide-react";
import { Button } from "@complianceos/ui/ui/button";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { trpc } from '@/lib/trpc';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ImplementationKanbanProps {
  clientId: number;
  planId: number;
}

type PDCA = 'Plan' | 'Do' | 'Check' | 'Act';
type NISTInput = 'Govern' | 'Identify' | 'Protect' | 'Detect' | 'Respond' | 'Recover';

type Task = {
  id: string;
  title: string;
  tag: string;
  priority: string;
  date: string;
  pdca: PDCA;
  nist: NISTInput;
};

type ColumnType = 'backlog' | 'todo' | 'inprogress' | 'review' | 'done';

const columnTitles: Record<ColumnType, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  inprogress: 'In Progress',
  review: 'Review',
  done: 'Done'
};

const pdcaColors: Record<PDCA, string> = {
  Plan: 'bg-blue-100 text-blue-700 border-blue-200',
  Do: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  Check: 'bg-amber-100 text-amber-700 border-amber-200',
  Act: 'bg-purple-100 text-purple-700 border-purple-200'
};

const nistColors: Record<NISTInput, string> = {
  Govern: 'bg-slate-100 text-slate-700',
  Identify: 'bg-yellow-100 text-yellow-700',
  Protect: 'bg-green-100 text-green-700',
  Detect: 'bg-orange-100 text-orange-700',
  Respond: 'bg-red-100 text-red-700',
  Recover: 'bg-teal-100 text-teal-700'
};

export default function ImplementationKanban({ clientId, planId }: ImplementationKanbanProps) {
  const [tasks, setTasks] = useState<Record<ColumnType, Task[]>>({
    backlog: [], todo: [], inprogress: [], review: [], done: []
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'none' | 'pdca' | 'nist'>('none');

  const { data: serverTasks, isLoading, refetch } = trpc.implementation.getPlanTasks.useQuery({
    planId: planId
  }, { enabled: !!planId });

  const updateStatusMutation = trpc.implementation.updateTaskStatus.useMutation({
    onError: (err) => {
      toast.error(`Sync failed: ${err.message}`);
      refetch(); // Revert on failure
    }
  });

  useEffect(() => {
    if (serverTasks) {
      const grouped: Record<ColumnType, Task[]> = {
        backlog: [], todo: [], inprogress: [], review: [], done: []
      };
      serverTasks.forEach(t => {
        // Map DB status to internal ColumnType
        let col: ColumnType = 'todo';
        if (t.status === 'backlog') col = 'backlog';
        else if (t.status === 'in_progress') col = 'inprogress';
        else if (t.status === 'review') col = 'review';
        else if (t.status === 'done') col = 'done';

        grouped[col].push({
          id: t.id.toString(),
          title: t.title,
          tag: (t.tags as string[])?.[0] || 'Implementation',
          priority: t.priority || 'Medium',
          date: t.plannedEndDate ? format(new Date(t.plannedEndDate), 'MMM d') : 'Variable',
          pdca: (t.pdca as PDCA) || 'Plan',
          nist: (t.nist as NISTInput) || 'Identify'
        });
      });
      setTasks(grouped);
    }
  }, [serverTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findContainer = (id: string): ColumnType | undefined => {
    if (Object.keys(tasks).includes(id)) return id as ColumnType;
    return (Object.keys(tasks) as ColumnType[]).find((key) =>
      tasks[key].find((item) => item.id === id)
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;
    if (!overId || active.id === overId) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(overId as string);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setTasks((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((item) => item.id === active.id);
      const overIndex = overItems.findIndex((item) => item.id === overId);

      let newIndex;
      if (overId in prev) {
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;

        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      return {
        ...prev,
        [activeContainer]: [...prev[activeContainer].filter((item) => item.id !== active.id)],
        [overContainer]: [
          ...prev[overContainer].slice(0, newIndex),
          activeItems[activeIndex],
          ...prev[overContainer].slice(newIndex, prev[overContainer].length),
        ],
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId) {
      setActiveId(null);
      return;
    }

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(overId as string);

    if (activeContainer && overContainer) {
      // Persist to backend if container changed
      if (activeContainer !== overContainer) {
        // Map internal ColumnType back to DB Status
        let dbStatus: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' = 'todo';
        if (overContainer === 'backlog') dbStatus = 'backlog';
        else if (overContainer === 'inprogress') dbStatus = 'in_progress';
        else if (overContainer === 'review') dbStatus = 'review';
        else if (overContainer === 'done') dbStatus = 'done';

        updateStatusMutation.mutate({
          taskId: parseInt(active.id as string, 10),
          status: dbStatus
        });
      }

      if (activeContainer === overContainer) {
        const activeIndex = tasks[activeContainer].findIndex((item) => item.id === active.id);
        const overIndex = tasks[overContainer].findIndex((item) => item.id === overId);

        if (activeIndex !== overIndex) {
          setTasks((prev) => ({
            ...prev,
            [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex),
          }));
        }
      }
    }

    setActiveId(null);
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading Task Board...</div>;

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1 bg-white flex gap-2 items-center">
            <Target className="w-3 h-3 text-blue-600" />
            PDCA Aligned
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-white flex gap-2 items-center">
            <ShieldCheck className="w-3 h-3 text-green-600" />
            NIST CSF Mapped
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Group By:
          </span>
          <Select value={groupBy} onValueChange={(val: any) => setGroupBy(val)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Default (Status)</SelectItem>
              <SelectItem value="pdca">PDCA Phase</SelectItem>
              <SelectItem value="nist">NIST Function</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => refetch()}>
            <RefreshCw className={`w-4 h-4 ${updateStatusMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="h-[calc(100vh-320px)] overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-[1200px] h-full">
            {(Object.keys(tasks) as ColumnType[]).map((columnId) => (
              <KanbanColumn
                key={columnId}
                id={columnId}
                title={columnTitles[columnId]}
                tasks={tasks[columnId]}
                groupBy={groupBy}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <TaskCard task={findActionTask(tasks, activeId)} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function KanbanColumn({ id, title, tasks, groupBy }: { id: ColumnType, title: string, tasks: Task[], groupBy: 'none' | 'pdca' | 'nist' }) {
  const { setNodeRef } = useDroppable({ id });

  const columnStyles: Record<ColumnType, string> = {
    backlog: 'bg-slate-100/50 border-slate-200 border-t-slate-400',
    todo: 'bg-blue-50/50 border-blue-200 border-t-blue-500',
    inprogress: 'bg-orange-50/50 border-orange-200 border-t-orange-500',
    review: 'bg-purple-50/50 border-purple-200 border-t-purple-500',
    done: 'bg-emerald-50/50 border-emerald-200 border-t-emerald-500'
  };

  const headerStyles: Record<ColumnType, string> = {
    backlog: 'bg-white/50 border-slate-200',
    todo: 'bg-blue-100/40 border-blue-200',
    inprogress: 'bg-orange-100/40 border-orange-200',
    review: 'bg-purple-100/40 border-purple-200',
    done: 'bg-emerald-100/40 border-emerald-200'
  };

  return (
    <div ref={setNodeRef} className={`w-80 flex-shrink-0 flex flex-col h-full rounded-xl border border-t-4 ${columnStyles[id]}`}>
      <div className={`p-4 flex items-center justify-between border-b rounded-t-xl backdrop-blur-sm ${headerStyles[id]}`}>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-700">{title}</h3>
          <Badge variant="secondary" className="rounded-full bg-white/60 text-slate-700 shadow-sm border border-black/5">
            {tasks.length}
          </Badge>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
        <SortableContext id={id} items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableItem key={task.id} task={task} groupBy={groupBy} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="h-full min-h-[100px] border-2 border-dashed border-slate-300/50 rounded-lg flex items-center justify-center text-slate-400 text-sm">
            No items
          </div>
        )}
      </div>
    </div>
  );
}

function findActionTask(tasks: Record<ColumnType, Task[]>, id: string): Task | undefined {
  for (const key of Object.keys(tasks)) {
    const task = tasks[key as ColumnType].find(t => t.id === id);
    if (task) return task;
  }
  return undefined;
}

function SortableItem({ task, groupBy }: { task: Task, groupBy?: 'none' | 'pdca' | 'nist' }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} groupBy={groupBy} />
    </div>
  );
}

function TaskCard({ task, isOverlay, groupBy = 'none' }: { task: Task | undefined, isOverlay?: boolean, groupBy?: 'none' | 'pdca' | 'nist' }) {
  if (!task) return null;
  return (
    <div className={`
            bg-white p-4 rounded-lg border border-slate-200 shadow-sm 
            ${isOverlay ? 'shadow-2xl scale-105 rotate-2 cursor-grabbing' : 'hover:shadow-md cursor-grab active:cursor-grabbing'}
            transition-all group relative overflow-hidden
        `}>
      {groupBy === 'pdca' && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${pdcaColors[task.pdca].replace('bg-', 'bg-').split(' ')[0].replace('100', '500')}`} />
      )}
      <div className="flex justify-between items-start mb-2 pl-2">
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className={`
                        text-[10px] uppercase tracking-wider
                        ${task.priority === 'Critical' ? 'border-red-200 text-red-600 bg-red-50' :
              task.priority === 'High' ? 'border-orange-200 text-orange-600 bg-orange-50' :
                'border-slate-200 text-slate-600 bg-slate-50'}
                    `}>
            {groupBy === 'none' ? task.tag : task.priority}
          </Badge>
        </div>
        <MoreHorizontal className="w-4 h-4 text-slate-300 hover:text-slate-500" />
      </div>

      <h4 className="font-medium text-slate-900 text-sm mb-3 leading-snug pl-2 line-clamp-2">
        {task.title}
      </h4>

      <div className="flex gap-2 mb-3 pl-2">
        <Badge className={`text-[10px] h-5 px-1.5 font-normal border ${pdcaColors[task.pdca]}`} variant="outline">
          <RefreshCw className="w-3 h-3 mr-1 opacity-70" />
          {task.pdca}
        </Badge>
        <Badge className={`text-[10px] h-5 px-1.5 font-normal border ${nistColors[task.nist]}`} variant="outline">
          <ShieldCheck className="w-3 h-3 mr-1 opacity-70" />
          {task.nist}
        </Badge>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-50 pl-2">
        <div className="flex items-center text-xs text-slate-400">
          <Calendar className="w-3 h-3 mr-1" />
          {task.date}
        </div>
      </div>
    </div>
  );
}