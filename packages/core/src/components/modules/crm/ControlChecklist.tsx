
import React from 'react';
import { Badge } from '@complianceos/ui/ui/badge';
import { Button } from '@complianceos/ui/ui/button';
import { Card } from '@complianceos/ui/ui/card';
import { ScrollArea } from '@complianceos/ui/ui/scroll-area';
import { CheckCircle2, Circle, Clock, AlertCircle, FileText, Upload, ChevronDown, ExternalLink, HelpCircle, ArrowRight } from 'lucide-react';
import { ControlChecklistItem } from '@/lib/modules/crm/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@complianceos/ui/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@complianceos/ui/ui/alert';

interface ControlChecklistProps {
    controls: ControlChecklistItem[];
    onStatusChange: (controlId: number, status: string) => void;
    isLoading?: boolean;
    onViewDetails?: (control: ControlChecklistItem) => void;
}

export function ControlChecklist({ controls, onStatusChange, isLoading, onViewDetails }: ControlChecklistProps) {

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'implemented': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'in_progress': return <Clock className="w-5 h-5 text-amber-500" />;
            case 'not_implemented': return <Circle className="w-5 h-5 text-slate-300" />;
            case 'not_applicable': return <AlertCircle className="w-5 h-5 text-slate-400" />;
            default: return <Circle className="w-5 h-5 text-slate-300" />;
        }
    };

    const StatusButton = ({ current, target, label, color, icon: Icon }: any) => {
        const activeClass = {
            green: "bg-green-100 text-green-700 ring-green-200 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-900",
            amber: "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-900",
            slate: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
        }[color as 'green' | 'amber' | 'slate'] || "bg-slate-100 text-slate-700";

        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        disabled={isLoading}
                        onClick={(e) => { e.stopPropagation(); onStatusChange(current.controlId, target); }}
                        className={cn(
                            "p-1.5 rounded-md transition-colors flex items-center gap-1.5",
                            current.status === target 
                                ? `${activeClass} ring-1 font-medium` 
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500"
                        )}
                    >
                        <Icon className={cn("w-4 h-4", current.status === target && `fill-current`)} />
                        {current.status === target && <span className="text-xs pr-1">{label}</span>}
                    </button>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
            </Tooltip>
        );
    };

    return (
        <div className="space-y-4">
            <Alert className="bg-purple-50 border-purple-100 dark:bg-purple-900/10 dark:border-purple-900/30">
                <HelpCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <AlertTitle className="text-purple-900 dark:text-purple-300">How to use this checklist</AlertTitle>
                <AlertDescription className="text-purple-800 dark:text-purple-400 mt-1">
                    <ol className="list-decimal pl-4 space-y-1 text-xs">
                        <li>Review each control requirement below.</li>
                        <li>Click <strong>Manage Evidence</strong> to upload documents, screenshots, or policies.</li>
                        <li>Update the status to <strong>Implemented</strong> once the control is effective and evidence is attached.</li>
                    </ol>
                </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                    {controls.filter(c => c.status === 'implemented').length} of {controls.length} Controls Implemented
                </h4>
                <div className="flex gap-2 text-xs">
                    <Badge variant="outline" className="gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Implemented</Badge>
                    <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3 text-amber-500" /> In Progress</Badge>
                </div>
            </div>

            <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                    {controls.map((control) => (
                        <Card 
                            key={control.controlId} 
                            className="p-4 hover:shadow-md transition-all group border-l-4 border-l-transparent hover:border-l-purple-500 cursor-pointer"
                            onClick={() => onViewDetails?.(control)}
                        >
                            <div className="flex items-start gap-4">
                                <div className="mt-1">
                                    {getStatusIcon(control.status)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-bold">
                                                    {control.controlCode}
                                                </span>
                                                <h5 className="font-semibold text-sm truncate text-slate-900 dark:text-slate-50">{control.name}</h5>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{control.description}</p>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-7 text-xs gap-1.5 border-dashed"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewDetails?.(control);
                                                }}
                                            >
                                                {control.evidenceCount > 0 ? (
                                                    <>
                                                        <FileText className="w-3.5 h-3.5 text-indigo-500" /> 
                                                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">{control.evidenceCount} Evidence</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-slate-500">Add Evidence</span>
                                                    </>
                                                )}
                                            </Button>

                                            {control.owner && (
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                                                        {control.owner.charAt(0)}
                                                    </span>
                                                    {control.owner}
                                                </div>
                                            )}
                                        </div>

                                        <TooltipProvider>
                                            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 rounded-lg p-1 border">
                                                <StatusButton current={control} target="not_implemented" label="Not Started" color="slate" icon={Circle} />
                                                <StatusButton current={control} target="in_progress" label="In Progress" color="amber" icon={Clock} />
                                                <StatusButton current={control} target="implemented" label="Implemented" color="green" icon={CheckCircle2} />
                                            </div>
                                        </TooltipProvider>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
