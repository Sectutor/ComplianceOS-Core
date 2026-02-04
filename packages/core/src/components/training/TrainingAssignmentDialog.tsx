import { useState } from "react";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Label } from "@complianceos/ui/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, Users, Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@complianceos/ui/ui/command";
import { cn } from "@/lib/utils";

interface TrainingAssignmentDialogProps {
    moduleId: number;
    clientId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TrainingAssignmentDialog({ moduleId, clientId, open, onOpenChange }: TrainingAssignmentDialogProps) {
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const utils = trpc.useUtils();

    const { data: employees } = trpc.employees.list.useQuery(
        { clientId },
        { enabled: open && clientId > 0 }
    );

    const assignMutation = (trpc.training as any).assign.useMutation({
        onSuccess: (data: any) => {
            toast.success(`Training assigned to ${data.count} employees`);
            onOpenChange(false);
            setSelectedEmployees([]);
            utils.training.getAssignments.invalidate({ moduleId });
            (utils.training as any).getStats.invalidate({ clientId });
        },
        onError: (error: any) => toast.error(error.message)
    });

    const handleAssign = () => {
        if (selectedEmployees.length === 0) return;
        assignMutation.mutate({
            clientId,
            moduleId,
            employeeIds: selectedEmployees
        });
    };

    const toggleEmployee = (id: number) => {
        setSelectedEmployees(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (employees) {
            if (selectedEmployees.length === employees.length) {
                setSelectedEmployees([]);
            } else {
                setSelectedEmployees(employees.map(e => e.id));
            }
        }
    };

    return (
        <EnhancedDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Assign Training Module"
            description="Select employees who must complete this training module."
            trigger={null}
            footer={
                <div className="flex justify-end gap-2 w-full">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleAssign} disabled={selectedEmployees.length === 0 || assignMutation.isLoading}>
                        {assignMutation.isLoading ? "Assigning..." : `Assign to ${selectedEmployees.length} Employees`}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                    <Label>Select Employees</Label>
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                        {employees && selectedEmployees.length === employees.length ? "Deselect All" : "Select All"}
                    </Button>
                </div>

                <Command className="border rounded-md max-h-[300px]">
                    <CommandInput placeholder="Search employees..." />
                    <CommandList>
                        <CommandEmpty>No employees found.</CommandEmpty>
                        <CommandGroup>
                            {employees?.map(emp => (
                                <CommandItem
                                    key={emp.id}
                                    value={`${emp.firstName} ${emp.lastName}`}
                                    onSelect={() => toggleEmployee(emp.id)}
                                    className="cursor-pointer"
                                >
                                    <div className={cn(
                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                        selectedEmployees.includes(emp.id) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                    )}>
                                        <Check className={cn("h-4 w-4")} />
                                    </div>
                                    <span>{emp.firstName} {emp.lastName}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">({emp.jobTitle})</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </div>
        </EnhancedDialog>
    );
}
