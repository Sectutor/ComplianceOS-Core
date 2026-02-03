import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@complianceos/ui/ui/sheet";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Button } from "@complianceos/ui/ui/button";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { Separator } from "@complianceos/ui/ui/separator";
import { Badge } from "@complianceos/ui/ui/badge";

import { CheckCircle2, Circle, Plus, Trash2, X, Wand2, Paperclip, FileText, Link as LinkIcon, Sparkles, Eye, Edit2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@complianceos/ui/ui/dialog";

interface Subtask {
    id: string;
    title: string;
    completed: boolean;
    evidenceId?: string;
    evidenceUrl?: string;
    filename?: string;
    aiSolution?: string;
}

interface TaskDetailSheetProps {
    task: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}

export function TaskDetailSheet({ task, open, onOpenChange, onUpdate }: TaskDetailSheetProps) {
    const [title, setTitle] = useState(task?.title || "");
    const [description, setDescription] = useState(task?.description || "");
    const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || []);
    const [newSubtask, setNewSubtask] = useState("");

    // Sync state when task changes
    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || "");
            setSubtasks(task.subtasks || []);
        }
    }, [task]);

    const updateMutation = trpc.implementation.updateTask.useMutation({
        onSuccess: () => {
            toast.success("Task updated");
            onUpdate();
            // onOpenChange(false); // Optional: close on save, or keep open
        },
        onError: (err) => {
            toast.error("Failed to update task");
            console.error(err);
        }
    });

    const generateSubtasksMutation = trpc.implementation.generateSubtasks.useMutation({
        onSuccess: (data: Subtask[]) => {
            toast.success(`Generated ${data.length} subtasks`);
            setSubtasks([...subtasks, ...data]);
        },
        onError: (err) => {
            toast.error("AI Generation failed");
            console.error(err);
        }
    });

    const attachEvidenceMutation = trpc.implementation.attachSubtaskEvidence.useMutation({
        onSuccess: () => {
            toast.success("Evidence attached");
            onUpdate();
            // onOpenChange(false); // Link established
        },
        onError: (err) => {
            toast.error("Failed to attach evidence");
            console.error(err);
        }
    });

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(null);
    const [solutionContent, setSolutionContent] = useState<string | null>(null);
    const [isSolutionOpen, setIsSolutionOpen] = useState(false);
    const [isEditingSolution, setIsEditingSolution] = useState(false);
    const [activeSubtask, setActiveSubtask] = useState<Subtask | null>(null);

    const generateSolutionMutation = trpc.implementation.generateSubtaskSolution.useMutation({
        onSuccess: (data) => {
            setSolutionContent(data.content);
            setIsSolutionOpen(true);
        },
        onError: (err) => {
            toast.error("Failed to generate solution");
            console.error(err);
        }
    });

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeSubtaskId || !task) return;

        const formData = new FormData();
        // We need to convert to base64 for the simple upload router we saw
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const base64Data = (reader.result as string).split(',')[1];

                // 1. Upload File
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: file.name,
                        data: base64Data,
                        contentType: file.type,
                        folder: 'evidence'
                    })
                });

                if (!uploadRes.ok) throw new Error("Upload failed");
                const uploadData = await uploadRes.json();

                // 2. Link Evidence
                attachEvidenceMutation.mutate({
                    taskId: task.id,
                    subtaskId: activeSubtaskId,
                    evidence: {
                        filename: file.name,
                        url: uploadData.url,
                        key: uploadData.key
                    }
                });

                // Optimistic update
                setSubtasks(subtasks.map(st => st.id === activeSubtaskId ? {
                    ...st,
                    completed: true,
                    evidenceUrl: uploadData.url,
                    filename: file.name
                } : st));

            } catch (err) {
                toast.error("Upload failed");
                console.error(err);
            }
            // Reset
            if (fileInputRef.current) fileInputRef.current.value = '';
            setActiveSubtaskId(null);
        };
        reader.readAsDataURL(file);
    };

    const triggerFileUpload = (subtaskId: string) => {
        setActiveSubtaskId(subtaskId);
        fileInputRef.current?.click();
    };

    const handleRemediate = (subtask: Subtask) => {
        if (!task) return;
        setActiveSubtask(subtask);
        setIsEditingSolution(false); // Reset to view mode

        // If already has solution, just open it
        if (subtask.aiSolution) {
            setSolutionContent(subtask.aiSolution);
            setIsSolutionOpen(true);
            return;
        }

        toast.info("AI is crafting a solution...");
        generateSolutionMutation.mutate({
            taskId: task.id,
            subtaskTitle: subtask.title,
            taskTitle: task.title,
            taskDescription: task.description || ""
        });
    };

    const handleApplySolution = () => {
        if (!activeSubtask || !solutionContent) return;

        const updated = subtasks.map(st =>
            st.id === activeSubtask.id
                ? { ...st, aiSolution: solutionContent }
                : st
        );
        setSubtasks(updated);
        setIsSolutionOpen(false);
        toast.success("Solution attached to subtask");
    };

    const handleGenerate = () => {
        if (!task) return;
        toast.info("Generating subtasks with AI...");
        generateSubtasksMutation.mutate({
            taskId: task.id,
            title: title || task.title,
            description: description || task.description,
            pdca: task.pdca
        });
    };

    const handleSave = () => {
        if (!task) return;
        updateMutation.mutate({
            taskId: task.id,
            title,
            description,
            subtasks,
            priority: task.priority,
            status: task.status,
            pdca: task.pdca
        });
    };

    const toggleSubtask = (id: string) => {
        const updated = subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st);
        setSubtasks(updated);
    };

    const addSubtask = () => {
        if (!newSubtask.trim()) return;
        const newItem: Subtask = {
            id: crypto.randomUUID(),
            title: newSubtask,
            completed: false
        };
        setSubtasks([...subtasks, newItem]);
        setNewSubtask("");
    };

    const removeSubtask = (id: string) => {
        setSubtasks(subtasks.filter(st => st.id !== id));
    };

    const completedCount = subtasks.filter(st => st.completed).length;
    const totalCount = subtasks.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full flex flex-col h-full bg-white p-0">
                <SheetHeader className="p-6 border-b border-slate-100 bg-white z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="capitalize bg-slate-50 text-slate-500 border-slate-200">
                            {task?.pdca || "General"}
                        </Badge>
                        <Badge variant="outline" className={cn(
                            "capitalize border-0",
                            task?.priority === "high" ? "bg-red-50 text-red-600" :
                                task?.priority === "medium" ? "bg-amber-50 text-amber-600" :
                                    "bg-blue-50 text-blue-600"
                        )}>
                            {task?.priority} Priority
                        </Badge>
                    </div>
                    <SheetTitle>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-xl font-bold border-0 px-0 focus-visible:ring-0 h-auto shadow-none placeholder:text-slate-300"
                            placeholder="Task Title"
                        />
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Description */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Description</h4>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[100px] resize-none border-slate-200 focus-visible:ring-indigo-500 bg-slate-50/50 text-sm"
                            placeholder="Add a more detailed description..."
                        />
                        {task?.controlDetails ? (
                            <div className="mt-2 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 space-y-2">
                                <div className="flex items-center gap-2">
                                    <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
                                    <span className="text-xs font-bold text-indigo-700">Related Control</span>
                                    <Badge variant="outline" className="bg-white text-indigo-600 border-indigo-200 text-[10px] h-5">{task.controlId}</Badge>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-800">{task.controlDetails.name}</div>
                                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-2" title={task.controlDetails.description}>{task.controlDetails.description}</div>
                                </div>
                            </div>
                        ) : task?.controlId && (
                            <div className="flex items-center gap-2 mt-2 bg-indigo-50/50 p-2 rounded border border-indigo-100">
                                <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="text-xs font-medium text-indigo-700">Related Control:</span>
                                <Badge variant="outline" className="bg-white text-indigo-600 border-indigo-200 text-[10px] h-5">{task.controlId}</Badge>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Subtasks */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Subtasks</h4>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGenerate}
                                    disabled={generateSubtasksMutation.isPending}
                                    className="h-6 text-[10px] px-2 gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                >
                                    {generateSubtasksMutation.isPending ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Wand2 className="w-3 h-3" />
                                    )}
                                    {generateSubtasksMutation.isPending ? "Thinking..." : "AI Generate"}
                                </Button>
                                <span className="text-xs font-medium text-slate-400">
                                    {completedCount}/{totalCount} completed
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <div className="space-y-2 mt-4">
                            {subtasks.map((st) => (
                                <div key={st.id} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                    <Checkbox
                                        checked={st.completed}
                                        onCheckedChange={() => toggleSubtask(st.id)}
                                        className="rounded-full data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                    />
                                    <span className={cn(
                                        "flex-1 text-sm font-medium transition-colors",
                                        st.completed ? "text-slate-400 line-through" : "text-slate-700"
                                    )}>
                                        {st.title}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeSubtask(st.id)}
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>

                                    {/* Evidence Button */}
                                    {st.evidenceUrl ? (
                                        <a href={st.evidenceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200 hover:underline">
                                            <FileText className="w-3 h-3" />
                                            Evidence
                                        </a>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => triggerFileUpload(st.id)}
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-500 transition-opacity"
                                            title="Attach Evidence"
                                        >
                                            <Paperclip className="w-3.5 h-3.5" />
                                        </Button>
                                    )}

                                    {/* AI Fix-it / View Button */}
                                    {!st.evidenceUrl && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemediate(st)}
                                            disabled={generateSolutionMutation.isPending}
                                            className={cn(
                                                "h-6 px-2 text-[10px] gap-1 transition-all",
                                                st.aiSolution
                                                    ? "bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200 opacity-100"
                                                    : "opacity-0 group-hover:opacity-100 text-slate-400 hover:text-purple-500",
                                                generateSolutionMutation.isPending && st.id === activeSubtask?.id && "animate-pulse"
                                            )}
                                        >
                                            {generateSolutionMutation.isPending && st.id === activeSubtask?.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : st.aiSolution ? (
                                                <Eye className="w-3 h-3" />
                                            ) : (
                                                <Sparkles className="w-3 h-3" />
                                            )}
                                            {st.aiSolution ? "View Info" : "AI Fix"}
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                            <Plus className="w-4 h-4 text-slate-400" />
                            <Input
                                value={newSubtask}
                                onChange={(e) => setNewSubtask(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addSubtask();
                                    }
                                }}
                                placeholder="Add a subtask..."
                                className="border-0 shadow-none focus-visible:ring-0 px-0 bg-transparent placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </div>

                <SheetFooter className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="mr-2">Cancel</Button>
                    <Button onClick={handleSave} disabled={updateMutation.isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                        {updateMutation.isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                </SheetFooter>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                />

                {/* Solution Dialog */}
                <Dialog open={isSolutionOpen} onOpenChange={setIsSolutionOpen}>
                    <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col p-0 overflow-hidden bg-white shadow-2xl">
                        <DialogHeader className="p-6 pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2 text-purple-600 mb-1">
                                <Sparkles className="w-4 h-4 fill-purple-600" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-500">AI Remediation Result</span>
                            </div>
                            <DialogTitle className="text-xl font-bold text-slate-900 leading-tight">
                                {activeSubtask?.title}
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 text-xs">
                                Use the generated content below to complete this requirement.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                            {isEditingSolution ? (
                                <Textarea
                                    value={solutionContent || ""}
                                    onChange={(e) => setSolutionContent(e.target.value)}
                                    className="min-h-[300px] w-full p-4 border-slate-200 focus-visible:ring-indigo-500 font-mono text-sm leading-relaxed"
                                    placeholder="Edit AI solution content..."
                                />
                            ) : (
                                <div className="prose prose-sm max-w-none prose-slate prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-indigo-600 prose-strong:text-slate-900">
                                    <ReactMarkdown>
                                        {solutionContent || ""}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 font-medium italic">
                                Note: Review and customize this content before application.
                            </span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setIsSolutionOpen(false)}>Close</Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setIsEditingSolution(!isEditingSolution)}
                                    className={cn(isEditingSolution && "bg-indigo-50 text-indigo-600 border-indigo-200")}
                                >
                                    <Edit2 className="w-3.5 h-3.5 mr-2" />
                                    {isEditingSolution ? "Preview" : "Edit"}
                                </Button>
                                {!isEditingSolution && (
                                    <Button variant="secondary" size="sm" onClick={() => {
                                        navigator.clipboard.writeText(solutionContent || "");
                                        toast.success("Content copied to clipboard");
                                    }}>
                                        Copy
                                    </Button>
                                )}
                                <Button size="sm" onClick={handleApplySolution} className="bg-indigo-600 hover:bg-indigo-700">
                                    {isEditingSolution ? "Save & Attach" : "Attach to Subtask"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </SheetContent>
        </Sheet >
    );
}
