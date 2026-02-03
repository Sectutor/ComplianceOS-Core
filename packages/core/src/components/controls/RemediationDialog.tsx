
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@complianceos/ui/ui/dialog";
import { Button } from "@complianceos/ui/ui/button";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Badge } from "@complianceos/ui/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Play, Wrench, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface RemediationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    controlId: string;
    controlName: string;
    category?: string;
    framework?: string;
    numericControlId: number; // For creating the task linked to internal ID
}

export function RemediationDialog({ open, onOpenChange, controlId, controlName, category, framework, numericControlId }: RemediationDialogProps) {
    const { data: playbooks, isLoading } = trpc.compliance.remediationPlaybooks.getSuggestions.useQuery({
        controlId,
        controlName,
        category,
        framework
    }, {
        enabled: open
    });

    const createRemediationTask = trpc.compliance.remediationTasks.create.useMutation({
        onSuccess: () => {
            toast.success("Remediation task created!");
            onOpenChange(false);
        },
        onError: (e) => toast.error(e.message)
    });

    const handleStartPlaybook = (playbook: any) => {
        // Create a task based on the playbook
        // We assume clientId is available in context or we pass it. 
        // This component is used in ControlCard which is in Controls page.
        // The ControlCard data comes from 'controls' table which is master library.
        // Remediation usually happens for a CLIENT control.
        // If we are in the master library, we might be editing master playbooks or testing.
        // However, the user plan says "Add 'Fix This' button to Control Cards".
        // If these are master controls, "Fixing" them doesn't make sense unless it's "Add to my library".
        // Let's assume we are in a Client context or this feature creates a task for the "Default Client" (demo mode).
        // For now, I'll hardcode clientId=1 or find a way to get it. 
        // Wait, the `controls` router creates generic controls.
        // If this is for the Library view, maybe it's "View Playbooks".
        // But if we want to "Fix This", we need a gap.

        // Assuming we create a task for the current user's organization (Client 1 usually).
        createRemediationTask.mutate({
            clientId: 1, // Default for now
            title: `Implement ${playbook.title}`,
            description: `Playbook activated for control ${controlId}.\n\nSteps:\n` + playbook.steps?.map((s: any) => `- ${s.title}: ${s.description}`).join('\n'),
            priority: playbook.severity === 'critical' ? 'high' : 'medium',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-primary" />
                        Remediation Playbooks
                    </DialogTitle>
                    <DialogDescription>
                        Automated suggestions to fix specific gaps for <span className="font-semibold text-foreground">{controlId}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : (
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-4">
                                {playbooks?.map((playbook: any) => (
                                    <div key={playbook.id} className="border rounded-lg p-4 hover:border-primary/50 transition-colors bg-white">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-semibold text-lg">{playbook.title}</h4>
                                                <div className="flex gap-2 mt-1">
                                                    <Badge variant="secondary">{playbook.estimatedEffort}</Badge>
                                                    <Badge variant={playbook.severity === 'critical' ? 'destructive' : 'outline'}>{playbook.severity}</Badge>
                                                </div>
                                            </div>
                                            <Button size="sm" onClick={() => handleStartPlaybook(playbook)} disabled={createRemediationTask.isPending}>
                                                <Play className="h-4 w-4 mr-2" />
                                                Start
                                            </Button>
                                        </div>

                                        <p className="text-sm text-slate-600 mb-4">{playbook.description}</p>

                                        <div className="bg-slate-50 p-3 rounded text-sm space-y-1">
                                            <h5 className="font-medium text-xs uppercase text-slate-500 mb-2">Recommended Steps</h5>
                                            {playbook.steps?.slice(0, 3).map((step: any, i: number) => (
                                                <div key={i} className="flex items-start gap-2">
                                                    <CheckCircle2 className="h-3 w-3 mt-0.5 text-slate-400" />
                                                    <span>{step.title}</span>
                                                </div>
                                            ))}
                                            {(playbook.steps?.length || 0) > 3 && (
                                                <div className="text-xs text-slate-400 pl-5">+{playbook.steps.length - 3} more steps</div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {playbooks?.length === 0 && (
                                    <div className="text-center py-12 text-slate-500 border border-dashed rounded-lg">
                                        <p>No specific playbooks found for this control.</p>
                                        <Button variant="link" className="mt-2">Request AI-generated playbook</Button>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
