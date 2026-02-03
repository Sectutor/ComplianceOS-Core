
import { useState } from "react";
import { useForm } from "react-hook-form";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@complianceos/ui/ui/dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "critical"]),
    dueDate: z.string().min(1, "Due date is required"),
});

type FormData = z.infer<typeof formSchema>;

export function CreateWorkItemDialog({ clientId, onOpenChange }: { clientId: number; onOpenChange?: (open: boolean) => void }) {
    const [open, setOpen] = useState(false);
    const utils = trpc.useUtils();

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            priority: "medium",
        }
    });

    const createMutation = trpc.governance.create.useMutation({
        onSuccess: () => {
            toast.success("Task created successfully");
            utils.governance.list.invalidate();
            utils.governance.getStats.invalidate();
            setOpen(false);
            reset();
            if (onOpenChange) onOpenChange(false);
        },
        onError: (err) => {
            toast.error(`Failed to create task: ${err.message}`);
        }
    });

    const onSubmit = (data: FormData) => {
        createMutation.mutate({
            clientId,
            title: data.title,
            description: data.description || "",
            priority: data.priority,
            dueDate: new Date(data.dueDate).toISOString(),
        });
    };

    const selectedPriority = watch("priority");

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (onOpenChange) onOpenChange(val);
        }}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Task
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                        Add a new task to your governance workbench.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" placeholder="Review Q1 Access Logs" {...register("title")} />
                        {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Detailed description of the task..."
                            className="resize-none"
                            {...register("description")}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                onValueChange={(val: any) => setValue("priority", val)}
                                defaultValue={selectedPriority}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date *</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                {...register("dueDate")}
                                required
                            />
                            {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate.message}</p>}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Create Task
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
