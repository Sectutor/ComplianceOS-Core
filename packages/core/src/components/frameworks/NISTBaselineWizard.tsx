
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@complianceos/ui/ui/dialog';
import { Button } from '@complianceos/ui/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Shield, Check, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";

interface NISTBaselineWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: number;
    onSuccess?: () => void;
}

const BASELINES = [
    {
        id: 'low',
        name: 'Low Impact',
        description: 'For systems where the loss of confidentiality, integrity, or availability has a limited adverse effect.',
        controlCount: '~120',
        color: 'bg-green-50 border-green-200 hover:border-green-300'
    },
    {
        id: 'moderate',
        name: 'Moderate Impact',
        description: 'For systems where the loss has a serious adverse effect. Includes all Low controls plus additional safeguards.',
        controlCount: '~260',
        color: 'bg-blue-50 border-blue-200 hover:border-blue-300'
    },
    {
        id: 'high',
        name: 'High Impact',
        description: 'For systems where the loss has a severe or catastrophic adverse effect. Includes Low & Moderate controls.',
        controlCount: '~350',
        color: 'bg-orange-50 border-orange-200 hover:border-orange-300'
    }
];

export function NISTBaselineWizard({ open, onOpenChange, clientId, onSuccess }: NISTBaselineWizardProps) {
    const [selectedBaseline, setSelectedBaseline] = useState<string | null>(null);

    const applyMutation = trpc.clientControls.applyBaseline.useMutation({
        onSuccess: (data) => {
            toast.success(`Applied ${data.added} controls from NIST ${selectedBaseline?.toUpperCase()} baseline.`);
            onOpenChange(false);
            if (onSuccess) onSuccess();
        },
        onError: (err) => {
            toast.error("Failed to apply baseline: " + err.message);
        }
    });

    const handleApply = () => {
        if (!selectedBaseline) return;
        applyMutation.mutate({
            clientId,
            framework: "NIST SP 800-53 Rev 5",
            baseline: selectedBaseline as 'low' | 'moderate' | 'high'
        });
    };

    return (
        <EnhancedDialog
            open={open}
            onOpenChange={onOpenChange}
            title="NIST SP 800-53 Baseline Selection"
            description="Select a security control baseline based on your system's impact level (FIPS 199)."
            size="lg"
            footer={
                <div className="flex justify-end gap-2 w-full">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleApply}
                        disabled={!selectedBaseline || applyMutation.isPending}
                        className="min-w-[100px]"
                    >
                        {applyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Apply Baseline
                    </Button>
                </div>
            }
        >
            <div className="py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {BASELINES.map((b) => (
                        <Card
                            key={b.id}
                            className={cn(
                                "cursor-pointer transition-all border-2 relative",
                                b.color,
                                selectedBaseline === b.id ? "ring-2 ring-primary border-primary" : "border-transparent"
                            )}
                            onClick={() => setSelectedBaseline(b.id)}
                        >
                            {selectedBaseline === b.id && (
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                    <Check className="w-3 h-3" />
                                </div>
                            )}
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Shield className={cn("w-4 h-4", selectedBaseline === b.id ? "fill-current" : "")} />
                                    {b.name}
                                </CardTitle>
                                <CardDescription className="text-xs font-mono">{b.controlCount} Controls</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground leading-snug">
                                    {b.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="bg-muted/50 p-3 rounded text-xs text-muted-foreground border">
                    <span className="font-semibold">Note:</span> Applying a baseline is additive. It will add any missing controls from the selected baseline to your client profile. Existing controls will remain unchanged.
                </div>
            </div>
        </EnhancedDialog>
    );
}
