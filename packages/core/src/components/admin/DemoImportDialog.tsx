
import React, { useState, useEffect } from "react";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Progress } from "@complianceos/ui/ui/progress";
import { CheckCircle2, Database, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: () => Promise<void>;
}

const STEPS = [
    "Initializing workspace...",
    "Assigning compliance frameworks (ISO 27001, SOC 2)...",
    "Generating policy documents...",
    "Creating risk register and assessments...",
    "Seeding evidence files...",
    "Finalizing setup..."
];

export function DemoImportDialog({ open, onOpenChange, onImport }: DemoImportDialogProps) {
    const [status, setStatus] = useState<'idle' | 'importing' | 'completed' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Reset state when dialog opens
    useEffect(() => {
        if (open && status === 'completed') {
            setStatus('idle');
            setProgress(0);
            setCurrentStepIndex(0);
            setError(null);
        }
    }, [open]);

    const handleImport = async () => {
        setStatus('importing');
        setProgress(0);
        setCurrentStepIndex(0);
        setError(null);

        // Simulation timer - continues slowly all the way to 100%
        const intervalId = setInterval(() => {
            setProgress(prev => {
                // Continue animating slowly even at high percentages
                if (prev >= 99.5) return 99.5; // Cap at 99.5% to leave room for completion
                const increment = Math.max(0.1, (100 - prev) / 100); // Very slow near the end
                return Math.min(99.5, prev + increment);
            });
        }, 300); // Slightly slower interval

        // Step cycler
        const stepIntervalId = setInterval(() => {
            setCurrentStepIndex(prev => {
                if (prev < STEPS.length - 1) return prev + 1;
                return prev;
            });
        }, 2000); // Slightly slower step transitions

        // Safety timeout (90 seconds - much longer for comprehensive imports)
        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            clearInterval(stepIntervalId);
            setStatus('error');
            setError("Import is taking longer than expected (90 seconds). The operation may still be running in the background. Large imports can take several minutes.");
        }, 90000);

        try {
            await onImport();
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            clearInterval(stepIntervalId);
            setProgress(100);
            setCurrentStepIndex(STEPS.length - 1);
            setStatus('completed');
        } catch (err: any) {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            clearInterval(stepIntervalId);
            setStatus('error');
            setError(err.message || "An error occurred during import.");
        }
    };

    return (
        <EnhancedDialog
            open={open}
            onOpenChange={(newOpen) => {
                // Prevent closing while importing
                if (status === 'importing' && !newOpen) return;
                onOpenChange(newOpen);
            }}
            title={
                <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-amber-600" />
                    Import Demo Data
                </div>
            }
            description="Populate this workspace with sample data for demonstration purposes."
            size="md"
            footer={
                <div className="flex justify-end gap-2 w-full">
                    {status === 'idle' && (
                        <>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button 
                                onClick={handleImport}
                                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0"
                            >
                                Start Import
                            </Button>
                        </>
                    )}
                    {status === 'importing' && (
                        <Button disabled>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Importing...
                        </Button>
                    )}
                    {status === 'completed' && (
                        <Button onClick={() => onOpenChange(false)} className="bg-emerald-600 hover:bg-emerald-700">
                            Done
                        </Button>
                    )}
                    {status === 'error' && (
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    )}
                </div>
            }
        >
            <div className="space-y-6 py-2">
                {status === 'idle' && (
                    <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-amber-900 text-sm">
                            <div className="font-medium mb-1 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Warning
                            </div>
                            This action will generate a comprehensive set of demo data including:
                            <ul className="list-disc list-inside mt-2 space-y-1 ml-1 opacity-90">
                                <li>ISO 27001 & SOC 2 Frameworks with all controls</li>
                                <li>20+ Policy Documents with full content</li>
                                <li>Complete Risk Register & Assessments</li>
                                <li>Sample Evidence & Governance Tasks</li>
                                <li>Fake Employee & Department Data</li>
                                <li>Third-Party Vendor Records</li>
                                <li>Business Continuity Plans</li>
                                <li>CRM & Sales Pipeline Data</li>
                            </ul>
                            <div className="mt-3 font-medium">This comprehensive import can take 1-2 minutes to complete. Please do not close this dialog during the process.</div>
                        </div>
                    </div>
                )}

                {(status === 'importing' || status === 'completed' || status === 'error') && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span className={status === 'error' ? "text-red-600" : "text-blue-900"}>
                                    {status === 'error' ? "Import Failed" : status === 'completed' ? "Import Complete" : STEPS[currentStepIndex]}
                                </span>
                                <span className="text-slate-500">{Math.round(progress)}%</span>
                            </div>
                            <div className="relative">
                                <Progress value={progress} className={cn("h-2", status === 'error' && "bg-red-100", status === 'importing' && "animate-pulse")} indicatorClassName={cn(status === 'completed' && "bg-emerald-500", status === 'error' && "bg-red-500")} />
                                {status === 'importing' && progress > 80 && (
                                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg border border-slate-100 p-4 space-y-3">
                            {STEPS.map((step, i) => {
                                const isCompleted = i < currentStepIndex || status === 'completed';
                                const isCurrent = i === currentStepIndex && status === 'importing';
                                const isPending = i > currentStepIndex && status !== 'completed';

                                return (
                                    <div key={i} className={cn("flex items-center gap-3 text-sm transition-colors duration-300", 
                                        isCompleted ? "text-emerald-700" : isCurrent ? "text-blue-700 font-medium" : "text-slate-400"
                                    )}>
                                        <div className={cn("h-5 w-5 rounded-full flex items-center justify-center border",
                                            isCompleted ? "bg-emerald-100 border-emerald-200" : 
                                            isCurrent ? "bg-blue-100 border-blue-200" : 
                                            "bg-slate-50 border-slate-200"
                                        )}>
                                            {isCompleted ? (
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                            ) : isCurrent ? (
                                                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                            ) : (
                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                            )}
                                        </div>
                                        {step}
                                    </div>
                                );
                            })}
                        </div>
                        
                        {status === 'error' && (
                            <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-lg text-sm flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-medium">Import Status</div>
                                    {error}
                                    <div className="mt-2 text-red-600/80 text-xs">
                                        <strong>Note:</strong> The import may have partially completed. 
                                        Refresh the page to see what data was created.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </EnhancedDialog>
    );
}
