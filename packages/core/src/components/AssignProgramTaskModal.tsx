import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@complianceos/ui/ui/dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@complianceos/ui/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@complianceos/ui/ui/popover";
import { Calendar } from "@complianceos/ui/ui/calendar";

interface AssignProgramTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: number;
    guideType: string;
    stepId: string;
    stepTitle: string;
    currentUserId?: number;
    currentTargetDate?: Date | string | null;
    onAssignmentUpdated: () => void;
}

export function AssignProgramTaskModal({
    isOpen,
    onClose,
    clientId,
    guideType,
    stepId,
    stepTitle,
    currentUserId,
    currentTargetDate,
    onAssignmentUpdated
}: AssignProgramTaskModalProps) {
    const [userId, setUserId] = useState<string>(currentUserId ? String(currentUserId) : "");
    const [targetDate, setTargetDate] = useState<Date | undefined>(currentTargetDate ? new Date(currentTargetDate) : undefined);

    const utils = trpc.useUtils();
    const { data: teamMembers } = trpc.clients.getUsers.useQuery({ clientId }, { enabled: isOpen });
    
    const upsertMutation = trpc.programGuides.upsertAssignment.useMutation({
        onSuccess: () => {
            toast.success("Assignment updated successfully");
            utils.programGuides.getAssignments.invalidate({ clientId, guideType });
            onAssignmentUpdated();
            onClose();
        },
        onError: (err) => {
            toast.error(err.message || "Failed to update assignment");
        }
    });

    useEffect(() => {
        if (isOpen) {
            setUserId(currentUserId ? String(currentUserId) : "");
            setTargetDate(currentTargetDate ? new Date(currentTargetDate) : undefined);
        }
    }, [isOpen, currentUserId, currentTargetDate]);

    const handleSave = () => {
        if (!userId) {
            toast.error("Please select an owner");
            return;
        }

        upsertMutation.mutate({
            clientId,
            guideType,
            stepId,
            userId: parseInt(userId, 10),
            targetDate: targetDate ? targetDate.toISOString() : null
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manage Assignment</DialogTitle>
                    <DialogDescription>
                        Assign an owner and target date for <strong>{stepTitle}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Owner</Label>
                        <Select value={userId} onValueChange={setUserId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a team member" />
                            </SelectTrigger>
                            <SelectContent>
                                {teamMembers?.map((member: any) => (
                                    <SelectItem key={member.id} value={String(member.id)}>
                                        {member.name || member.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Target Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !targetDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {targetDate ? format(targetDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={targetDate}
                                    onSelect={setTargetDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={upsertMutation.isLoading}>
                        {upsertMutation.isLoading ? "Saving..." : "Save Assignment"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
