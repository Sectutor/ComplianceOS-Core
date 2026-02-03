
import React, { useState } from 'react';
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@complianceos/ui/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Avatar, AvatarFallback } from "@complianceos/ui/ui/avatar";
import { Plus, User, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@complianceos/ui/ui/label";

interface StakeholderManagerProps {
    projectId?: number;
    processId?: number;
}

export function StakeholderManager({ projectId, processId }: StakeholderManagerProps) {
    const { data: stakeholders, refetch } = trpc.businessContinuity.stakeholders.list.useQuery({ projectId, processId });
    const addMutation = trpc.businessContinuity.stakeholders.add.useMutation();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<{ id: number; name: string | null } | null>(null);
    const [role, setRole] = useState("contributor");

    const { data: candidates, isLoading: isSearching } = trpc.businessContinuity.stakeholders.searchCandidates.useQuery(
        { query: searchQuery },
        { enabled: isAddOpen }
    );

    const handleAdd = async () => {
        if (!selectedUser) return;
        try {
            await addMutation.mutateAsync({
                userId: selectedUser.id,
                role,
                projectId,
                processId
            });
            toast.success("Stakeholder added");
            setIsAddOpen(false);
            setSelectedUser(null);
            refetch();
        } catch (e) {
            toast.error("Failed to add stakeholder");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Stakeholders</h3>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Stakeholder</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Stakeholder</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Search User</Label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-8"
                                        placeholder="Name or email..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                {isSearching ? (
                                    <div className="flex justify-center p-2"><Loader2 className="w-4 h-4 animate-spin" /></div>
                                ) : (
                                    <div className="border rounded-md max-h-40 overflow-auto">
                                        {candidates?.map(user => (
                                            <div
                                                key={user.id}
                                                className={`p-2 hover:bg-muted cursor-pointer flex items-center gap-2 ${selectedUser?.id === user.id ? 'bg-muted' : ''}`}
                                                onClick={() => setSelectedUser(user)}
                                            >
                                                <Avatar className="h-6 w-6">
                                                    <AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium">{user.name}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="owner">Process Owner</SelectItem>
                                        <SelectItem value="contributor">Contributor</SelectItem>
                                        <SelectItem value="reviewer">Reviewer</SelectItem>
                                        <SelectItem value="approver">Approver</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={handleAdd} disabled={!selectedUser || addMutation.isPending} className="w-full">
                                {addMutation.isPending ? "Adding..." : "Add Stakeholder"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                            <TableHead className="text-white font-semibold py-4">User</TableHead>
                            <TableHead className="text-white font-semibold py-4">Role</TableHead>
                            <TableHead className="text-white font-semibold py-4">Assigned</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stakeholders?.map((sh: any) => (
                            <TableRow key={sh.stakeholder.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                                <TableCell className="flex items-center gap-2 py-4">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{sh.user?.name?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium text-black">{sh.user?.name}</div>
                                        <div className="text-xs text-gray-500">{sh.user?.email}</div>
                                    </div>
                                </TableCell>
                                <TableCell className="capitalize text-gray-600 py-4">{sh.stakeholder.role}</TableCell>
                                <TableCell className="text-xs text-gray-500 py-4">
                                    {new Date(sh.stakeholder.assignedDate).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))}
                        {stakeholders?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-6 text-gray-500 bg-white">
                                    No stakeholders assigned.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
