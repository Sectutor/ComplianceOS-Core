import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { trpc } from "../../lib/trpc";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Label } from "@complianceos/ui/ui/label";
import { toast } from "sonner";
import { Calendar } from "@complianceos/ui/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@complianceos/ui/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Flag, CheckCircle2, Circle, Clock, AlertCircle, HelpCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@complianceos/ui/ui/avatar";

const taskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    status: z.enum(["todo", "in_progress", "review", "done"]),
    priority: z.enum(["low", "medium", "high", "critical"]),
    dueDate: z.date().optional().nullable(),
    assigneeId: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: number;
    task?: any;
    initialStatus?: string;
}

export function TaskDialog({ open, onOpenChange, clientId, task, onSuccess, initialStatus }: TaskDialogProps) {
    const utils = trpc.useContext();
    const { data: members } = trpc.users.listWorkspaceMembers.useQuery({ clientId });

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: "",
            description: "",
            status: (initialStatus as any) || "todo",
            priority: "medium",
            dueDate: undefined,
        },
    });

    useEffect(() => {
        if (open) {
            if (task) {
                form.reset({
                    title: task.title,
                    description: task.description || "",
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
                    assigneeId: task.assigneeId?.toString(),
                });
            } else {
                form.reset({
                    title: "",
                    description: "",
                    status: (initialStatus as any) || "todo",
                    priority: "medium",
                    dueDate: undefined,
                });
            }
        }
    }, [task, form, open, initialStatus]);

    const createMutation = trpc.projectTasks.create.useMutation({
        onSuccess: () => {
            toast.success("Task created successfully");
            utils.projectTasks.list.invalidate({ clientId });
            onOpenChange(false);
            onSuccess?.();
            form.reset();
        },
        onError: (err) => {
            toast.error("Failed to create task: " + err.message);
        }
    });

    const updateMutation = trpc.projectTasks.update.useMutation({
        onSuccess: () => {
            toast.success("Task updated successfully");
            utils.projectTasks.list.invalidate({ clientId });
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (err) => {
            toast.error("Failed to update task: " + err.message);
        }
    });

    const onSubmit = (data: TaskFormValues) => {
        const payload = {
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
            assigneeId: data.assigneeId && data.assigneeId !== "unassigned" ? parseInt(data.assigneeId) : undefined,
            clientId,
        };

        if (task) {
            updateMutation.mutate({ ...payload, id: task.id });
        } else {
            createMutation.mutate(payload);
        }
    };

    const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

    const renderFooter = () => (
        <>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-500 hover:text-slate-700 hover:bg-slate-200/50">
                Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px] bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm transition-all hover:shadow-md" onClick={form.handleSubmit(onSubmit)}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {task ? "Save Changes" : "Create Task"}
            </Button>
        </>
    );

    return (
        <EnhancedDialog
            open={open}
            onOpenChange={onOpenChange}
            title={task ? "Edit Task" : "Create New Task"}
            description={task ? "Update the details of this task." : "Add a new task to your project board."}
            size="md"
            footer={renderFooter()}
        >
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Title Section */}
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-slate-700">Task Title</Label>
                    <Input
                        id="title"
                        placeholder="What needs to be done?"
                        {...form.register("title")}
                        className="text-lg font-medium h-12 px-4 shadow-sm border-slate-200 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                    />
                    {form.formState.errors.title && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.title.message}</p>
                    )}
                </div>

                {/* Description Section */}
                <div className="space-y-2">
                    <Label htmlFor="desc" className="text-sm font-medium text-slate-700">Description</Label>
                    <Textarea
                        id="desc"
                        placeholder="Add more details about this task..."
                        {...form.register("description")}
                        className="min-h-[120px] resize-y shadow-sm border-slate-200 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                    />
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-6">

                    {/* Status */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</Label>
                        <Controller
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="h-10 border-slate-200 hover:bg-slate-50 transition-colors focus:ring-blue-500/20 focus:border-blue-500">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todo">
                                            <div className="flex items-center gap-2">
                                                <Circle className="h-3.5 w-3.5 text-slate-400" /> <span className="text-slate-700">To Do</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="in_progress">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5 text-blue-500" /> <span className="text-slate-700">In Progress</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="review">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="h-3.5 w-3.5 text-purple-500" /> <span className="text-slate-700">Review</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="done">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> <span className="text-slate-700">Done</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</Label>
                        <Controller
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="h-10 border-slate-200 hover:bg-slate-50 transition-colors focus:ring-blue-500/20 focus:border-blue-500">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">
                                            <div className="flex items-center gap-2"><Flag className="h-3.5 w-3.5 text-slate-400" /> <span className="text-slate-700">Low</span></div>
                                        </SelectItem>
                                        <SelectItem value="medium">
                                            <div className="flex items-center gap-2"><Flag className="h-3.5 w-3.5 text-blue-500" /> <span className="text-slate-700">Medium</span></div>
                                        </SelectItem>
                                        <SelectItem value="high">
                                            <div className="flex items-center gap-2"><Flag className="h-3.5 w-3.5 text-orange-500" /> <span className="text-slate-700">High</span></div>
                                        </SelectItem>
                                        <SelectItem value="critical">
                                            <div className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5 text-red-600" /> <span className="text-slate-700">Critical</span></div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    {/* Due Date */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</Label>
                        <Controller
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal h-10 border-slate-200 hover:bg-slate-50 focus:ring-blue-500/20 focus:border-blue-500",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value || undefined}
                                            onSelect={field.onChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        />
                    </div>

                    {/* Assignee */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignee</Label>
                        <Controller
                            control={form.control}
                            name="assigneeId"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                    <SelectTrigger className="h-10 border-slate-200 hover:bg-slate-50 transition-colors focus:ring-blue-500/20 focus:border-blue-500">
                                        <SelectValue placeholder="Unassigned" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <HelpCircle className="h-4 w-4 text-slate-400" />
                                                <span>Unassigned</span>
                                            </div>
                                        </SelectItem>
                                        {members?.map((member: any) => (
                                            <SelectItem key={member.id} value={member.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-5 w-5 border border-slate-200">
                                                        <AvatarImage src={`https://avatar.vercel.sh/${member.email}`} />
                                                        <AvatarFallback className="text-[10px] bg-blue-50 text-blue-600">{member.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-slate-700">{member.name || member.email}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>
            </form>
        </EnhancedDialog>
    );
}
