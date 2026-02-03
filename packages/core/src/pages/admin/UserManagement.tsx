import { useState } from "react";

import { Breadcrumb } from "@/components/Breadcrumb";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { toast } from "sonner";
import { Shield, User, Loader2, Plus, Trash2, Building2, X, LogIn, Edit, Check, Mail } from "lucide-react";
import { format } from "date-fns";
import { UserEditor } from "@/components/admin/UserEditor";
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


export default function UserManagement() {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState("user");
    const [userToImpersonate, setUserToImpersonate] = useState<any>(null);

    const { data: users, isLoading, refetch } = trpc.users.list.useQuery();

    const createMutation = trpc.users.create.useMutation({
        onSuccess: () => {
            toast.success("User created successfully");
            setIsAddOpen(false);
            setSelectedRole("user");
            refetch();
        },
        onError: (err) => {
            toast.error(err.message || "Failed to create user");
        }
    });

    const deleteMutation = trpc.users.delete.useMutation({
        onSuccess: () => {
            console.log('[USER MANAGEMENT] Delete success');
            toast.success("User deleted");
            setUserToDelete(null);
            refetch();
        },
        onError: (err) => {
            console.error('[USER MANAGEMENT] Delete error:', err);
            toast.error(err.message || "Failed to delete user");
        }
    });

    const impersonateMutation = trpc.users.impersonate.useMutation({
        onSuccess: (data: any) => {
            toast.success("Redirecting to user session...");
            // Redirect to the magic link
            if (data.url) {
                window.location.href = data.url;
            }
        },
        onError: (err) => {
            toast.error("Impersonation failed: " + err.message);
            setUserToImpersonate(null);
        }
    });

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        createMutation.mutate({
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            role: selectedRole,
        });
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            <Breadcrumb items={[{ label: "Admin" }, { label: "User Management" }]} />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground mt-1">Manage user access and permissions across the platform.</p>
                </div>
                <EnhancedDialog
                    open={isAddOpen}
                    onOpenChange={setIsAddOpen}
                    trigger={
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    }
                    title="Add New User"
                    description="Create a new user account. They will be able to log in with the provided email."
                    footer={
                        <div className="flex justify-end gap-2 w-full">
                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={(e) => {
                                    const form = document.getElementById('add-user-form') as HTMLFormElement;
                                    if (form) form.requestSubmit();
                                }
                                }
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? "Creating..." : "Create User"}
                            </Button>
                        </div>
                    }
                >
                    <form id="add-user-form" onSubmit={handleCreate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input id="name" name="name" placeholder="John Doe" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input id="email" name="email" type="email" placeholder="john@company.com" required />
                            </div>
                            <div className="grid gap-2">
                                <Label>Role</Label>
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="editor">Editor</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </form>
                </EnhancedDialog>
            </div>

            <Card className="shadow-sm border-muted/40">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Registered Users
                    </CardTitle>
                    <CardDescription>
                        {users?.length || 0} users registered in the system.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                        <TableHead className="text-white font-semibold py-4">User</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Email</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Role</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Organizations</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Status</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Joined</TableHead>
                                        <TableHead className="text-white font-semibold py-4">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users?.map((user: any) => (
                                        <TableRow key={user.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                                            <TableCell className="font-medium py-4">
                                                <div className="flex items-center gap-2 text-black">
                                                    <div className="h-8 w-8 rounded-full bg-[#1C4D8D]/10 flex items-center justify-center text-[#1C4D8D] font-bold text-xs uppercase">
                                                        {user.name ? user.name.substring(0, 2) : "U"}
                                                    </div>
                                                    {user.name || "Unknown"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600 py-4">{user.email}</TableCell>
                                            <TableCell className="py-4">
                                                <Badge variant={user.role === 'admin' || user.role === 'owner' ? 'default' : 'secondary'} className={user.role === 'admin' ? "bg-purple-500 hover:bg-purple-600" : ""}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.memberships?.map((m: any) => (
                                                        <Badge key={m.clientId} variant="outline" className="text-xs">
                                                            {m.clientName} ({m.role})
                                                        </Badge>
                                                    ))}
                                                    {(!user.memberships || user.memberships.length === 0) && <span className="text-muted-foreground text-xs italic">No memberships</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-500 text-sm py-4">
                                                {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "-"}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <UserEditor user={user} />

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-200"
                                                        title="Login as User"
                                                        disabled={user.role === 'owner' || impersonateMutation.isPending}
                                                        onClick={() => setUserToImpersonate(user)}
                                                    >
                                                        {impersonateMutation.isPending && impersonateMutation.variables?.userId === user.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <LogIn className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                                                        disabled={user.role === 'owner'}
                                                        onClick={() => setUserToDelete(user)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete <b>{userToDelete?.name}</b>'s account and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            disabled={deleteMutation.isPending}
                            onClick={(e) => {
                                e.preventDefault(); // Prevent closing dialog automatically if we want to handle pending state
                                if (userToDelete) {
                                    deleteMutation.mutate({ id: userToDelete.id });
                                }
                            }}
                        >
                            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Delete Account"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!userToImpersonate} onOpenChange={(open) => !open && setUserToImpersonate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Impersonation</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to login as <b>{userToImpersonate?.name}</b>?
                            <br /><br />
                            You will be signed out of your current account and redirected to a new session as this user.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                if (userToImpersonate) {
                                    impersonateMutation.mutate({ userId: userToImpersonate.id });
                                }
                            }}
                            disabled={impersonateMutation.isPending}
                        >
                            {impersonateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Login as User"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
