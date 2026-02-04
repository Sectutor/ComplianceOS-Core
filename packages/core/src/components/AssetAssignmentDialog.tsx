import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@complianceos/ui/ui/dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Laptop, Key, Shield, Hash, FileText } from "lucide-react";

interface AssetAssignmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employeeId: number;
    clientId: number;
    onSuccess?: () => void;
    employeeName: string;
}

export function AssetAssignmentDialog({
    open,
    onOpenChange,
    employeeId,
    clientId,
    onSuccess,
    employeeName
}: AssetAssignmentDialogProps) {
    const [assetType, setAssetType] = useState<string>("laptop");
    const [serialNumber, setSerialNumber] = useState("");
    const [notes, setNotes] = useState("");

    const utils = trpc.useContext();

    const assignMutation = trpc.onboarding.assignAsset.useMutation({
        onSuccess: () => {
            toast.success("Asset assigned successfully");
            utils.onboarding.getCompanyOnboardingStatus.invalidate();
            onOpenChange(false);
            // Reset form
            setAssetType("laptop");
            setSerialNumber("");
            setNotes("");
            onSuccess?.();
        },
        onError: (error) => {
            toast.error(`Failed to assign asset: ${error.message}`);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        assignMutation.mutate({
            clientId,
            employeeId,
            assetType,
            serialNumber: serialNumber || undefined,
            notes: notes || undefined
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Asset</DialogTitle>
                    <div className="text-sm text-muted-foreground">
                        Assigning equipment or access to <span className="font-medium text-foreground">{employeeName}</span>
                    </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="assetType">Asset Type</Label>
                        <Select value={assetType} onValueChange={setAssetType}>
                            <SelectTrigger id="assetType">
                                <SelectValue placeholder="Select asset type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="laptop">
                                    <div className="flex items-center gap-2">
                                        <Laptop className="h-4 w-4" />
                                        <span>Laptop / Workstation</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="badge">
                                    <div className="flex items-center gap-2">
                                        <Key className="h-4 w-4" />
                                        <span>access Badge / Key card</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="software_access">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        <span>Software Access / VPN</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="serialNumber">Serial Number / ID (Optional)</Label>
                        <div className="relative">
                            <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="serialNumber"
                                placeholder="e.g. SN-12345678"
                                className="pl-9"
                                value={serialNumber}
                                onChange={(e) => setSerialNumber(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <div className="relative">
                            <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Textarea
                                id="notes"
                                placeholder="Additional details about this assignment..."
                                className="pl-9 min-h-[80px]"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={assignMutation.isLoading}>
                            {assignMutation.isLoading ? "Assigning..." : "Assign Asset"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
