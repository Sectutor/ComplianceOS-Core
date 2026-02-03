import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@complianceos/ui/ui/sheet";
import { Badge } from "@complianceos/ui/ui/badge";
import { Avatar, AvatarFallback } from "@complianceos/ui/ui/avatar";
import { Separator } from "@complianceos/ui/ui/separator";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Button } from "@complianceos/ui/ui/button";
import { Shield, User, Calendar, Link as LinkIcon, Activity, Sparkles, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Markdown from 'react-markdown';

interface Control {
    id: number;
    controlId: string;
    name: string;
    description: string | null;
    framework: string;
    owner: string | null;
    status: string | null;
    evidenceType: string | null;
    implementationGuidance?: string | null;
}

interface ControlDetailsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    control: Control | null;
}

export function ControlDetailsSheet({ open, onOpenChange, control: initialControl }: ControlDetailsSheetProps) {
    const utils = trpc.useUtils();

    const { data: fetchedControl } = trpc.controls.get.useQuery(
        { id: initialControl?.id || 0 },
        {
            enabled: !!initialControl?.id && open,
            // Prefer fresh data
            staleTime: 0
        }
    );

    const control = fetchedControl || initialControl;

    const generateGuidanceMutation = trpc.controls.generateGuidance.useMutation({
        onSuccess: () => {
            toast.success("Guidance generated successfully");
            // Invalidate specific control query to trigger re-fetch in this component
            if (control?.id) {
                utils.controls.get.invalidate({ id: control.id });
            }
            utils.controls.list.invalidate();
            utils.controls.listPaginated.invalidate();
        },
        onError: (err) => {
            toast.error("Failed to generate guidance: " + err.message);
        }
    });

    const handleGenerateGuidance = () => {
        if (!control) return;
        generateGuidanceMutation.mutate({
            controlId: control.id,
            framework: control.framework
        });
    };

    if (!control) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[500px] sm:w-[600px] sm:max-w-[700px] p-0 flex flex-col bg-white">
                {/* ... Header ... */}
                <div className="p-6 pb-2 border-b border-slate-100 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 font-normal">
                                {control.framework}
                            </Badge>
                            <span className="text-xs text-slate-400 font-mono">{control.controlId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-slate-100 text-slate-600">
                                    {(control.owner || "U").substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <SheetTitle className="text-xl font-bold leading-tight">{control.name}</SheetTitle>
                        <SheetDescription className="text-sm text-slate-500 line-clamp-3">
                            {control.description}
                        </SheetDescription>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Source: ComplianceOS
                        </div>
                        <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Owner: {control.owner || "Unassigned"}
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Updated: Today
                        </div>
                    </div>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                Description
                            </h3>
                            <div className="text-sm text-slate-600 leading-relaxed">
                                {control.description || "No description provided."}
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                    Implementation Guidance
                                </h3>
                                {!control.implementationGuidance && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                        onClick={handleGenerateGuidance}
                                        disabled={generateGuidanceMutation.isPending}
                                    >
                                        {generateGuidanceMutation.isPending ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-3 w-3" />
                                        )}
                                        {generateGuidanceMutation.isPending ? "Generating..." : "Generate with AI"}
                                    </Button>
                                )}
                            </div>

                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                {control.implementationGuidance ? (
                                    <div className="text-sm text-slate-600 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4">
                                        <Markdown>{control.implementationGuidance}</Markdown>
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <p className="text-sm text-slate-500 mb-2">No guidance available.</p>
                                        <p className="text-xs text-slate-400">Generate guidance to get started.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
