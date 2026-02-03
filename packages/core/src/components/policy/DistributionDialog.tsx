
import { useState } from "react";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Label } from "@complianceos/ui/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, Users, Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@complianceos/ui/ui/command";
import { cn } from "@/lib/utils";

interface DistributionDialogProps {
    policyId: number;
    clientId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DistributionDialog({ policyId, clientId, open, onOpenChange }: DistributionDialogProps) {
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const utils = trpc.useUtils();

    const { data: employees } = trpc.employees.list.useQuery(
        { clientId },
        { enabled: open && clientId > 0 }
    );

    const assignMutation = trpc.policyManagement.assignPolicy.useMutation({
        onSuccess: (data: any) => {
            toast.success(`Policy distributed to ${data.count} employees`);
            onOpenChange(false);
            setSelectedEmployees([]);
            utils.policyManagement.getAssignments.invalidate({ policyId });
        },
        onError: (error) => toast.error(error.message)
    });

    const handleDistribute = () => {
        if (selectedEmployees.length === 0) return;
        assignMutation.mutate({
            policyId,
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
            title="Distribute Policy"
            description="Select employees who must read and attest to this policy."
            trigger={null} // Controlled dialog
            footer={
                <div className="flex justify-end gap-2 w-full">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleDistribute} disabled={selectedEmployees.length === 0 || assignMutation.isPending}>
                        {assignMutation.isPending ? "Distributing..." : `Distribute to ${selectedEmployees.length} Employees`}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                    <Label>Select Recipients</Label>
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
