
import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@complianceos/ui/ui/sheet";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { ActivityFeed } from "../feed/ActivityFeed";
import { CalendarIcon, UserIcon, Tag, Copy, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface TaskDetailViewProps {
    open: boolean;
    onClose: () => void;
    task: any; // Using existing unified task type
}

export function TaskDetailView({ open, onClose, task }: TaskDetailViewProps) {
    const [, setLocation] = useLocation();

    if (!task) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'done': return 'bg-green-100 text-green-800';
            case 'review': return 'bg-purple-100 text-purple-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'control': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'policy': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'risk_treatment': return 'bg-red-100 text-red-800 border-red-200';
            case 'remediation': return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        }
    };

    const formatType = (type: string) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const handleViewSource = () => {
        if (!task.clientId) return;

        switch (task.sourceType) {
            case 'control':
                setLocation(`/clients/${task.clientId}?tab=controls`);
                break;
            case 'policy':
                setLocation(`/clients/${task.clientId}/policies/${task.sourceId}`);
                break;
            case 'risk_treatment':
            case 'remediation':
                setLocation(`/clients/${task.clientId}/risks`);
                break;
            default:
                break;
        }
        onClose();
    };

    return (
        <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-[800px] sm:max-w-[800px] p-0 flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b bg-slate-50/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={getTypeColor(task.sourceType)}>
                            {formatType(task.sourceType)}
                        </Badge>
                        <Badge className={getStatusColor(task.status)} variant="secondary">
                            {formatType(task.status)}
                        </Badge>
                    </div>
                    <SheetTitle className="text-2xl font-bold">{task.title}</SheetTitle>
                    <SheetDescription className="mt-1 flex items-center gap-4 text-sm">
                        {task.dueDate && (
                            <span className="flex items-center gap-1">
                                <CalendarIcon className="h-3.5 w-3.5" />
                                Due {format(new Date(task.dueDate), "MMM d, yyyy")}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <UserIcon className="h-3.5 w-3.5" />
                            {task.assigneeName}
                        </span>
                    </SheetDescription>
                </div>

                {/* Main Content + Sidebar Layout */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left: Details */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
                            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {task.description || "No description provided."}
                            </div>
                        </div>

                        {task.tags && task.tags.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 mb-2">Tags & Context</h3>
                                <div className="flex flex-wrap gap-2">
                                    {task.tags.map((tag: string) => (
                                        <Badge key={tag} variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                                            <Tag className="mr-1 h-3 w-3" />
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Metadata / Source Info */}
                        <div className="bg-slate-50 p-4 rounded-lg border text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Source ID:</span>
                                <span className="font-mono text-slate-700 select-all">{task.sourceId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Global ID:</span>
                                <span className="font-mono text-slate-700">{task.id}</span>
                            </div>
                            {task.sourceType !== 'project_task' && (
                                <div className="pt-2">
                                    <Button variant="outline" size="sm" className="w-full" onClick={handleViewSource}>
                                        <ExternalLink className="mr-2 h-3 w-3" />
                                        View Source Artifact
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Activity Feed (The "Talk" View) */}
                    <div className="w-[350px] border-l h-full flex flex-col">
                        <ActivityFeed entityType={task.sourceType} entityId={task.sourceId} />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
