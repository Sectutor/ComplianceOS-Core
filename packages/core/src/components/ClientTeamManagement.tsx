
import { useState } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Avatar, AvatarFallback } from "@complianceos/ui/ui/avatar";
import { Mail, Plus, Shield, User, X, MoreHorizontal, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@complianceos/ui/ui/dropdown-menu";

interface ClientTeamManagementProps {
    clientId: number;
}

export default function ClientTeamManagement({ clientId }: ClientTeamManagementProps) {
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"viewer" | "editor" | "owner" | "auditor">("viewer");

    const { data: users, isLoading, refetch } = trpc.clients.getUsers.useQuery({ clientId });

    const inviteMutation = trpc.clients.inviteUser.useMutation({
        onSuccess: () => {
            toast.success("User invited successfully");
            handleClose();
            refetch();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const auditorInviteMutation = trpc.auditors.invite.useMutation({
        onSuccess: () => {
            toast.success("Auditor invited successfully via Magic Link");
            handleClose();
            refetch();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const revokeAuditorMutation = trpc.auditors.revoke.useMutation({
        onSuccess: () => {
            toast.success("Auditor access revoked");
            refetch();
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const handleClose = () => {
        setIsInviteOpen(false);
        setInviteEmail("");
        setInviteRole("viewer");
    }

    const handleInvite = () => {
        if (!inviteEmail) {
            toast.error("Please enter an email address");
            return;
        }

        if (inviteRole === 'auditor') {
            auditorInviteMutation.mutate({
                clientId,
                email: inviteEmail
            });
        } else {
            inviteMutation.mutate({
                clientId,
                email: inviteEmail,
                role: inviteRole as "viewer" | "editor" | "owner",
            });
        }
    };

    const handleRevokeAuditor = (userId: number) => {
        if (confirm("Are you sure you want to revoke access for this auditor?")) {
            revokeAuditorMutation.mutate({
                clientId,
                userId
            });
        }
    };

    const getInitials = (name?: string) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const isPending = inviteMutation.isPending || auditorInviteMutation.isPending;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Team Access</CardTitle>
                    <CardDescription>Manage who has access to this workspace.</CardDescription>
                </div>
                <EnhancedDialog
                    open={isInviteOpen}
                    onOpenChange={setIsInviteOpen}
                    trigger={
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Invite Member
                        </Button>
                    }
                    title="Invite Team Member"
                    description="Send an invitation to join this workspace."
                    footer={
                        <div className="flex justify-end gap-2 w-full">
                            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                            <Button onClick={handleInvite} disabled={isPending}>
                                {isPending ? "Inviting..." : "Send Invite"}
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="colleague@company.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={inviteRole} onValueChange={(val: any) => setInviteRole(val)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="viewer">Viewer (Read-only)</SelectItem>
                                    <SelectItem value="editor">Editor (Can edit controls/policies)</SelectItem>
                                    <SelectItem value="owner">Owner (Full admin access)</SelectItem>
                                    <SelectItem value="auditor">Auditor (Limited external access)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </EnhancedDialog>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading team...</div>
                ) : (
                    <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                    <TableHead className="text-white font-semibold py-4">User</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Email</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Role</TableHead>
                                    <TableHead className="w-[100px] text-white font-semibold py-4"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users?.map((user) => (
                                    <TableRow key={user.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                                        <TableCell className="flex items-center gap-3 py-4">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-black">{user.name || "Unknown"}</span>
                                        </TableCell>
                                        <TableCell className="text-gray-600 py-4">{user.email}</TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant={user.role === 'owner' ? 'default' : user.role === 'auditor' ? 'outline' : 'secondary'}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            {user.role === 'auditor' && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600"
                                                            onClick={() => handleRevokeAuditor(user.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Revoke Access
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {users?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-gray-500 bg-white">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
