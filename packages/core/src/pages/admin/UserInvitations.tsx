import { useState } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { trpc } from "@/lib/trpc";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@complianceos/ui/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@complianceos/ui/ui/card";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import { Badge } from "@complianceos/ui/ui/badge";
import { Skeleton } from "@complianceos/ui/ui/skeleton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@complianceos/ui/ui/alert-dialog";
import { UserPlus, Mail, Clock, XCircle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function UserInvitations() {
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("viewer");

    const { data: invitations, isLoading, refetch } = trpc.users.listInvitations.useQuery();

    const inviteMutation = trpc.users.invite.useMutation({
        onSuccess: () => {
            toast.success("Invitation sent successfully!");
            setIsInviteOpen(false);
            setEmail("");
            setRole("viewer");
            refetch();
        },
        onError: (error) => toast.error(error.message),
    });

    const revokeMutation = trpc.users.revokeInvitation.useMutation({
        onSuccess: () => {
            toast.success("Invitation revoked");
            refetch();
        },
        onError: (error) => toast.error(error.message),
    });

    const deleteMutation = trpc.users.deleteInvitation.useMutation({
        onSuccess: () => {
            toast.success("Invitation deleted");
            refetch();
        },
        onError: (error) => toast.error(error.message),
    });

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        inviteMutation.mutate({ email, role });
    };

    const getStatusBadge = (status: string, expiresAt: Date | null) => {
        if (status === "revoked") {
            return <Badge variant="destructive">Revoked</Badge>;
        }
        if (status === "accepted") {
            return <Badge variant="default">Accepted</Badge>;
        }
        if (expiresAt && new Date(expiresAt) < new Date()) {
            return <Badge variant="secondary">Expired</Badge>;
        }
        return <Badge variant="outline">Pending</Badge>;
    };

    return (
        <div className="space-y-6">
            <Breadcrumb items={[{ label: "Admin" }, { label: "User Invitations" }]} />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Invitations</h1>
                    <p className="text-muted-foreground mt-1">
                        Invite new users to join your organization.
                    </p>
                </div>
                <EnhancedDialog
                    open={isInviteOpen}
                    onOpenChange={setIsInviteOpen}
                    trigger={
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Invite User
                        </Button>
                    }
                    title="Invite New User"
                    description="Send an email invitation to a new team member."
                    footer={
                        <div className="flex justify-end gap-2 w-full">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsInviteOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={(e) => {
                                    const form = document.getElementById('invite-user-form') as HTMLFormElement;
                                    if (form) form.requestSubmit();
                                }}
                                disabled={inviteMutation.isPending}
                            >
                                {inviteMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Send Invitation
                                    </>
                                )}
                            </Button>
                        </div>
                    }
                >
                    <form id="invite-user-form" onSubmit={handleInvite} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="user@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                    <SelectItem value="editor">Editor</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="owner">Owner</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </form>
                </EnhancedDialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending & Recent Invitations</CardTitle>
                    <CardDescription>
                        View and manage user invitations sent from your organization.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                        <TableHead className="text-white font-semibold py-4">Email</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Role</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Invited By</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Status</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Expires</TableHead>
                                        <TableHead className="text-right text-white font-semibold py-4">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invitations && invitations.length > 0 ? (
                                        invitations.map((invitation) => (
                                            <TableRow key={invitation.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                                                <TableCell className="font-medium text-black py-4">
                                                    {invitation.email}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Badge variant="outline" className="capitalize bg-white border-gray-300 text-gray-700">
                                                        {invitation.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-black">
                                                            {invitation.inviterName || "Unknown"}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {invitation.inviterEmail}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    {getStatusBadge(invitation.status, invitation.expiresAt)}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500 py-4">
                                                    {invitation.expiresAt ? (
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-3 w-3" />
                                                            {format(new Date(invitation.expiresAt), "MMM d, yyyy")}
                                                        </div>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    {invitation.status === "pending" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                                                            onClick={() => revokeMutation.mutate({ id: invitation.id })}
                                                            disabled={revokeMutation.isPending}
                                                        >
                                                            <XCircle className="h-4 w-4 mr-2" />
                                                            Revoke
                                                        </Button>
                                                    )}
                                                    {invitation.status === "revoked" && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                                                                    disabled={deleteMutation.isPending}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This will permanently delete the invitation for <span className="font-semibold">{invitation.email}</span>. This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => deleteMutation.mutate({ id: invitation.id })}
                                                                        className="bg-red-600 hover:bg-red-700 text-white"
                                                                    >
                                                                        {deleteMutation.isPending ? (
                                                                            <>
                                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                                Deleting...
                                                                            </>
                                                                        ) : (
                                                                            "Delete Invitation"
                                                                        )}
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-gray-500 bg-white">
                                                No invitations found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
