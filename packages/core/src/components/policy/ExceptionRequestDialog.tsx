
import { useState } from "react";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Input } from "@complianceos/ui/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@complianceos/ui/ui/alert";

interface ExceptionRequestDialogProps {
    policyId: number;
    employeeId: number; // Current logged-in employee ID (or simulated for now)
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ExceptionRequestDialog({ policyId, employeeId, open, onOpenChange }: ExceptionRequestDialogProps) {
    const [reason, setReason] = useState("");
    const [expirationDate, setExpirationDate] = useState("");
    const utils = trpc.useUtils();

    // In a real app we'd get the current user's employee record. 
    // Here we assume employeeId is passed in or derived from context.

    const requestMutation = trpc.policyManagement.requestException.useMutation({
        onSuccess: () => {
            toast.success("Exception request submittted");
            onOpenChange(false);
            setReason("");
            setExpirationDate("");
            utils.policyManagement.getMyPolicies.invalidate(); // Refetch my policies if applicable
            utils.policyManagement.getExceptions.invalidate({ policyId }); // Refetch policy exceptions
        },
        onError: (error) => toast.error(error.message)
    });

    const handleSubmit = () => {
        if (!reason.trim()) return;
        requestMutation.mutate({
            policyId,
            employeeId,
            reason,
            expirationDate: expirationDate || undefined
        });
    };

    return (
        <EnhancedDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Request Policy Exception"
            description="Require an exception to this policy? Submit a request for approval."
            trigger={null}
            footer={
                <div className="flex justify-end gap-2 w-full">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleSubmit} disabled={!reason.trim() || requestMutation.isPending}>
                        {requestMutation.isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4 py-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Exceptions are tracked and reviewed by auditors. Only request if absolutely necessary.
                    </AlertDescription>
                </Alert>

                <div className="grid gap-2">
                    <Label>Reason for Exception</Label>
                    <Textarea
                        placeholder="Explain why you cannot comply with this policy..."
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Expected Duration (Optional)</Label>
                    <Input
                        type="date"
                        value={expirationDate}
                        onChange={e => setExpirationDate(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Leave blank if permanent (not recommended)</p>
                </div>
            </div>
        </EnhancedDialog>
    );
}
