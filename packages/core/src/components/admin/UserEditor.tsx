
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
import { Shield, Loader2, Plus, Trash2, Edit, Check, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";

interface UserEditorProps {
    user: {
        id: number;
        name: string | null;
        email: string | null;
        role: string;
        maxClients: number | null;
        memberships?: Array<{
            clientId: number;
            clientName: string;
            role: string;
        }>;
    };
}

export function UserEditor({ user }: UserEditorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const utils = trpc.useUtils();

    // Profile State
    const [name, setName] = useState(user.name || "");
    const [email, setEmail] = useState(user.email || "");

    // Permissions State
    const [role, setRole] = useState(user.role || "user");
    const [maxClients, setMaxClients] = useState(user.maxClients || 2);

    // Organizations State
    const { data: clients } = trpc.clients.list.useQuery();
    const [selectedClient, setSelectedClient] = useState("");
    const [selectedOrgRole, setSelectedOrgRole] = useState("viewer");

    // Mutations
    const updateProfileMutation = trpc.users.update.useMutation({
        onSuccess: () => {
            toast.success("User profile updated");
            utils.users.list.invalidate();
        },
        onError: (err) => toast.error(err.message)
    });

    const updateRoleMutation = trpc.users.updateRole.useMutation({
        onSuccess: () => {
            toast.success("Global role updated");
            utils.users.list.invalidate();
        },
        onError: (err) => toast.error(err.message)
    });

    const assignOrgMutation = trpc.users.assignOrganization.useMutation({
        onSuccess: () => {
            toast.success("Organization access updated");
            utils.users.list.invalidate();
            setSelectedClient(""); // Reset selection on success
        },
        onError: (err) => toast.error(err.message)
    });

    const removeOrgMutation = trpc.users.removeFromOrganization.useMutation({
        onSuccess: () => {
            toast.success("Removed from organization");
            utils.users.list.invalidate();
        },
        onError: (err) => toast.error(err.message)
    });

    const resetPasswordMutation = trpc.users.resetPassword.useMutation({
        onSuccess: (data) => {
            toast.success(data.message || "Password reset email sent");
        },
        onError: (err) => toast.error(err.message)
    });

    const handleResetPassword = () => {
        resetPasswordMutation.mutate({ userId: user.id });
    };

    // Handlers
    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate({
            id: user.id,
            name,
            email,
            maxClients
        });
    };

    const handleSaveRole = () => {
        updateRoleMutation.mutate({
            id: user.id,
            role
        });
    };

    const handleAddOrg = () => {
        if (!selectedClient) return;
        assignOrgMutation.mutate({
            userId: user.id,
            clientId: parseInt(selectedClient),
            role: selectedOrgRole as any
        });
    };

    const handleUpdateOrgRole = (clientId: number, newRole: string) => {
        assignOrgMutation.mutate({
            userId: user.id,
            clientId: clientId,
            role: newRole as any
        });
    };

    return (
        <EnhancedDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            trigger={
                <Button variant="outline" size="icon" className="h-8 w-8 text-amber-600 bg-amber-50 border-amber-200 hover:text-amber-700 hover:bg-amber-100" title="Edit User">
                    <Edit className="h-4 w-4" />
                </Button>
            }
            title={`Manage User: ${user.name}`}
            description="Update profile, permissions, and organization access."
            size="lg"
        >
            <Tabs defaultValue="account" className="w-full">
                <div className="px-6 border-b bg-slate-50/50">
                    <TabsList className="bg-transparent p-0 h-12 w-full justify-start gap-6">
                        <TabsTrigger
                            value="account"
                            className="h-full rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-[#1C4D8D] data-[state=active]:text-[#1C4D8D] data-[state=active]:shadow-none px-0 pb-0"
                        >
                            Account Details
                        </TabsTrigger>
                        <TabsTrigger
                            value="permissions"
                            className="h-full rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-[#1C4D8D] data-[state=active]:text-[#1C4D8D] data-[state=active]:shadow-none px-0 pb-0"
                        >
                            Global Permissions
                        </TabsTrigger>
                        <TabsTrigger
                            value="organizations"
                            className="h-full rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-[#1C4D8D] data-[state=active]:text-[#1C4D8D] data-[state=active]:shadow-none px-0 pb-0"
                        >
                            Organization Access
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="p-6 min-h-[400px]">
                    <TabsContent value="account" className="mt-0 space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">Personal Information</h3>
                            <p className="text-sm text-muted-foreground mb-4">Update the user's basic profile information.</p>

                            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="john@example.com"
                                        type="email"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Organization Limit (Admin Tier)</Label>
                                    <Select value={maxClients.toString()} onValueChange={(val) => setMaxClients(parseInt(val))}>
                                        <SelectTrigger className="w-full bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="2">2 Organizations (Default)</SelectItem>
                                            <SelectItem value="10">10 Organizations</SelectItem>
                                            <SelectItem value="999999">Unlimited Organizations</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground italic">Limits how many organizations this user can create/manage as an owner.</p>
                                </div>
                                <div className="pt-2">
                                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                                        {updateProfileMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                        Save Profile
                                    </Button>
                                </div>
                            </form>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium">Password Reset</h3>
                            <p className="text-sm text-muted-foreground mb-4">Send a password reset email to this user.</p>
                            <Button
                                onClick={handleResetPassword}
                                disabled={resetPasswordMutation.isPending}
                                variant="outline"
                            >
                                {resetPasswordMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Mail className="mr-2 h-4 w-4" />
                                )}
                                Send Password Reset Email
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="permissions" className="mt-0 space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">Global Role</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Controls the user's access level across the entire ComplianceOS platform.
                            </p>

                            <div className="border rounded-lg p-4 bg-slate-50 max-w-2xl space-y-4">
                                <div className="grid gap-2">
                                    <Label>Current Role</Label>
                                    <Select value={role} onValueChange={setRole}>
                                        <SelectTrigger className="w-[300px] bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">
                                                <div className="flex flex-col text-left">
                                                    <span className="font-medium">User</span>
                                                    <span className="text-xs text-muted-foreground">Standard access, limited by org membership</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="editor">
                                                <div className="flex flex-col text-left">
                                                    <span className="font-medium">Global Editor</span>
                                                    <span className="text-xs text-muted-foreground">Can edit most global settings (Caution)</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="admin">
                                                <div className="flex flex-col text-left">
                                                    <span className="font-medium">Global Admin</span>
                                                    <span className="text-xs text-muted-foreground">Full system access (Danger)</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="super_admin">
                                                <div className="flex flex-col text-left">
                                                    <span className="font-medium">Super Admin</span>
                                                    <span className="text-xs text-muted-foreground">Highest clearance, bypasses all limits</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        onClick={handleSaveRole}
                                        disabled={updateRoleMutation.isPending || role === user.role}
                                        variant={role === user.role ? "outline" : "default"}
                                    >
                                        {updateRoleMutation.isPending ? "Saving..." : "Update Global Role"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="organizations" className="mt-0 space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">Organization Membership</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Manage which client organizations this user can access and their role within them.
                            </p>
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 text-sm text-amber-800 flex gap-2 items-start">
                                <Shield className="h-4 w-4 mt-0.5 shrink-0" />
                                <div>
                                    <span className="font-semibold">Note on Organization Roles:</span> An "Admin" here has full control over <strong>only this specific organization</strong>. They cannot access other organizations or change global system settings.
                                </div>
                            </div>

                            <div className="flex gap-2 items-end mb-6 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                                <div className="grid gap-2 flex-1">
                                    <Label>Add to Organization</Label>
                                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Select Organization..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients?.filter(c => !user.memberships?.some((m: any) => m.clientId === c.id)).map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2 w-[150px]">
                                    <Label>Role</Label>
                                    <Select value={selectedOrgRole} onValueChange={setSelectedOrgRole}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="owner">Owner</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="editor">Editor</SelectItem>
                                            <SelectItem value="viewer">Viewer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleAddOrg} disabled={!selectedClient || assignOrgMutation.isPending}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Access
                                </Button>
                            </div>

                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead>Organization</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!user.memberships || user.memberships.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                                                    No organization memberships yet.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            user.memberships.map((m: any) => (
                                                <TableRow key={m.clientId}>
                                                    <TableCell className="font-medium text-sm">{m.clientName}</TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={m.role}
                                                            onValueChange={(val) => handleUpdateOrgRole(m.clientId, val)}
                                                        >
                                                            <SelectTrigger className="h-8 w-[130px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="owner">Owner</SelectItem>
                                                                <SelectItem value="admin">Admin</SelectItem>
                                                                <SelectItem value="editor">Editor</SelectItem>
                                                                <SelectItem value="viewer">Viewer</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => removeOrgMutation.mutate({ userId: user.id, clientId: m.clientId })}
                                                            disabled={removeOrgMutation.isPending}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Remove
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </EnhancedDialog>
    );
}
