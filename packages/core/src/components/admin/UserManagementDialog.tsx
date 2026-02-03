
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { toast } from "sonner";
import { Users, Mail, Plus, Loader2, Trash2, ShieldCheck } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@complianceos/ui/ui/alert-dialog";

interface UserManagementDialogProps {
    clientId: number;
    clientName: string;
    trigger?: React.ReactNode;
}

export function UserManagementDialog({ clientId, clientName, trigger }: UserManagementDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("viewer");
    const [userToRemove, setUserToRemove] = useState<any>(null);

    const { data: users, isLoading, refetch } = trpc.clients.getUsers.useQuery(
        { clientId },
        { enabled: isOpen }
    );

    const inviteMutation = trpc.clients.inviteUser.useMutation({
        onSuccess: () => {
            toast.success("User invited successfully");
            setInviteEmail("");
            refetch();
        },
        onError: (err: any) => toast.error(err.message)
    });

    const removeUserMutation = trpc.users.removeFromOrganization.useMutation({
        onSuccess: () => {
            toast.success("User removed from organization");
            setUserToRemove(null);
            refetch();
        },
        onError: (err: any) => toast.error(err.message)
    });

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        inviteMutation.mutate({
            clientId,
            email: inviteEmail,
            role: inviteRole as any
        });
    };

    return (
        <EnhancedDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            trigger={trigger || (
                <Button variant="ghost" size="icon" title="Manage Users">
                    <Users className="h-4 w-4 text-slate-600" />
                </Button>
            )}
            title={`Users: ${clientName}`}
            description="Manage users and permissions for this organization."
            size="lg"
        >
            <div className="space-y-6 min-h-[400px]">
                {/* Invite Section */}
                <div className="bg-slate-50 border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        Invite New User
                    </h3>
                    <form onSubmit={handleInvite} className="flex gap-2 items-end">
                        <div className="grid gap-1.5 flex-1">
                            <Label htmlFor="invite-email" className="text-xs">Email Address</Label>
                            <Input
                                id="invite-email"
                                placeholder="colleague@company.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                required
                                type="email"
                                className="bg-white"
                            />
                        </div>
                        <div className="grid gap-1.5 w-[140px]">
                            <Label htmlFor="invite-role" className="text-xs">Role</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger id="invite-role" className="bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="owner">Owner</SelectItem>
                                    <SelectItem value="editor">Editor</SelectItem>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" disabled={inviteMutation.isPending}>
                            {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            <span className="ml-2">Invite</span>
                        </Button>
                    </form>
                </div>

                {/* Users List */}
                <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-600" />
                        Active Users
                    </h3>

                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : users?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground italic">
                                            No users assigned to this organization yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users?.map((user: any) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{user.name || "Unknown"}</span>
                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    user.role === 'owner' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        user.role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'text-slate-600'
                                                }>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => setUserToRemove(user)}
                                                    disabled={removeUserMutation.isPending || user.role === 'owner'}
                                                    title={user.role === 'owner' ? "Cannot remove owner" : "Remove user"}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <AlertDialog open={!!userToRemove} onOpenChange={(open) => !open && setUserToRemove(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Remove User from Organization?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to remove <b>{userToRemove?.name}</b> from <b>{clientName}</b>?
                                They will lose access to all data within this organization.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => {
                                    if (userToRemove) {
                                        removeUserMutation.mutate({ userId: userToRemove.id, clientId });
                                    }
                                }}
                                disabled={removeUserMutation.isPending}
                            >
                                {removeUserMutation.isPending ? "Removing..." : "Remove User"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </EnhancedDialog>
    );
}
