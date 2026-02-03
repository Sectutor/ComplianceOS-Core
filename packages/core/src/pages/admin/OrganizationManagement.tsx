import { useState } from "react";
import { UserManagementDialog } from "@/components/admin/UserManagementDialog";
import DashboardLayout from "@/components/DashboardLayout"; // We might want to use AdminLayout here if it's different, but UserManagement used DashboardLayout in my view?
// Wait, Step 284 said AdminLayout was created and App.tsx wraps it. 
// BUT UserManagement code in Step 306 imports DashboardLayout!
// This means the migration in Phase 3 might have been incomplete or I need to update UserManagement to use AdminLayout?
// Actually, App.tsx wraps the Route with AdminLayout. So the Page itself should probably NOT wrap itself in DashboardLayout if AdminLayout is already wrapping it?
// Or maybe AdminLayout *internally* uses DashboardLayout?
// Let's check AdminLayout content from Step 351 (View File).
// Ah, I haven't viewed AdminLayout yet. I just viewed it in step 351.
// Let me wait for Step 351 response to confirm.
import { Breadcrumb } from "@/components/Breadcrumb";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { toast } from "sonner";
import { Building2, Plus, Trash2, Edit, Check, X, Search } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
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

const MODULES = [
    { id: "risk", label: "Risk Management" },
    { id: "compliance", label: "Compliance & Controls" },
    { id: "audit", label: "Audit Management" },
    { id: "vendors", label: "Vendor Management (TPRM)" },
    { id: "federal", label: "Federal Hub (NIST/CMMC)" },
    { id: "billing", label: "Billing & Subscriptions" },
];

export default function OrganizationManagement() {
    // If AdminLayout is wrapping in App.tsx, we return a fragment.
    // However, UserManagement in step 306 returns <DashboardLayout>.
    // If App.tsx wraps <AdminLayout><UserManagement/></AdminLayout>, and UserManagement returns <DashboardLayout>..., then we have nested layouts?
    // I need to check App.tsx changes in Step 284.
    // "Refactored the routing for all /admin/* paths to be wrapped by AdminLayout."
    // <Route path="/admin/:rest*"><AdminLayout><Switch>...</Switch></AdminLayout></Route>
    // So if UserManagement also renders DashboardLayout, we have DOUBLE layout.
    // I should fix UserManagement too. But for now, I will write OrganizationManagement assuming it is WRAPPED by AdminLayout via App.tsx, so I just render the content.

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editClient, setEditClient] = useState<any>(null);
    const [deleteClient, setDeleteClient] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: clients, isLoading, refetch } = trpc.clients.list.useQuery({});

    const createMutation = trpc.clients.create.useMutation({
        onSuccess: () => {
            toast.success("Organization created successfully");
            setIsAddOpen(false);
            refetch();
        },
        onError: (err) => {
            toast.error(err.message || "Failed to create organization");
        }
    });

    const updateMutation = trpc.clients.update.useMutation({
        onSuccess: () => {
            toast.success("Organization updated");
            setEditClient(null);
            refetch();
        },
        onError: (err) => toast.error(err.message)
    });

    const deleteMutation = trpc.clients.delete.useMutation({
        onSuccess: () => {
            toast.success("Organization deleted");
            refetch();
        },
        onError: (err) => toast.error(err.message)
    });

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const frameworks: string[] = [];
        if (formData.get("fw_ISO 27001") === "on") frameworks.push("ISO 27001");
        if (formData.get("fw_SOC 2") === "on") frameworks.push("SOC 2");
        if (formData.get("fw_HIPAA") === "on") frameworks.push("HIPAA");

        createMutation.mutate({
            name: formData.get("name") as string,
            industry: formData.get("industry") as string,
            description: formData.get("description") as string,
            size: formData.get("size") as string,
            adminEmail: formData.get("adminEmail") as string,
            welcomeMessage: formData.get("welcomeMessage") as string,
            frameworks: frameworks
        });
    };

    const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        // Collect active modules
        const activeModules = MODULES.filter(m => formData.get(`module_${m.id}`) === "on").map(m => m.id);

        updateMutation.mutate({
            id: editClient.id,
            name: formData.get("name") as string,
            planTier: formData.get("planTier") as string,
            status: formData.get("status") as string,
            activeModules: activeModules
        });
    };

    const filteredClients = clients?.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.industry?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 p-6">
            <Breadcrumb items={[{ label: "Admin" }, { label: "Organizations" }]} />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organization Management</h1>
                    <p className="text-muted-foreground mt-1">Manage tenant organizations, subscriptions, and active modules.</p>
                </div>
                <EnhancedDialog
                    open={isAddOpen}
                    onOpenChange={setIsAddOpen}
                    trigger={
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Organization
                        </Button>
                    }
                    title="Create New Organization"
                    description="Set up a new tenant workspace and onboard the initial admin."
                    size="lg" // Make it wider for the complex form
                    footer={
                        <div className="flex justify-end gap-2 w-full">
                            <Button type="submit" form="create-org-form" disabled={createMutation.isPending}>
                                {createMutation.isPending ? "Creating & Onboarding..." : "Create Organization"}
                            </Button>
                        </div>
                    }
                >
                    <form id="create-org-form" onSubmit={handleCreate} className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Organization Name *</Label>
                            <Input id="name" name="name" required placeholder="Acme Corp" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Select name="industry">
                                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Technology">Technology</SelectItem>
                                        <SelectItem value="Finance">Finance</SelectItem>
                                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                                        <SelectItem value="Retail">Retail</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="size">Size</Label>
                                <Select name="size">
                                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1-10">1-10 Employees</SelectItem>
                                        <SelectItem value="11-50">11-50 Employees</SelectItem>
                                        <SelectItem value="51-200">51-200 Employees</SelectItem>
                                        <SelectItem value="201-1000">201-1000 Employees</SelectItem>
                                        <SelectItem value="1000+">1000+ Employees</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Input id="description" name="description" placeholder="Short description..." />
                        </div>

                        {/* Onboarding & Invite Section */}
                        <div className="border-t pt-4 mt-4">
                            <h3 className="text-sm font-medium mb-3">Onboarding & Invitation</h3>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="adminEmail">Initial Admin Email (Optional)</Label>
                                    <Input
                                        id="adminEmail"
                                        name="adminEmail"
                                        type="email"
                                        placeholder="admin@neworg.com (Leave empty to creating for yourself)"
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        If provided, this user will be made the Owner. If they don't exist, an account will be created.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="welcomeMessage">Welcome Email Message</Label>
                                    <textarea
                                        id="welcomeMessage"
                                        name="welcomeMessage"
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Welcome to your new ComplianceOS workspace! Here are your login details..."
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Frameworks to Pre-load</Label>
                                    <div className="flex gap-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="fw_iso27001" name="fw_ISO 27001" />
                                            <Label htmlFor="fw_iso27001" className="font-normal">ISO 27001</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="fw_soc2" name="fw_SOC 2" />
                                            <Label htmlFor="fw_soc2" className="font-normal">SOC 2</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="fw_hipaa" name="fw_HIPAA" />
                                            <Label htmlFor="fw_hipaa" className="font-normal">HIPAA</Label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </EnhancedDialog>
            </div>

            <Card className="shadow-sm border-muted/40">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Organizations
                        </CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search organizations..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="h-24 flex items-center justify-center text-muted-foreground">Loading...</div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>Name</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Modules</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClients?.map((client) => (
                                        <TableRow key={client.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{client.name}</span>
                                                    <span className="text-xs text-muted-foreground">{client.industry} • {client.size}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    client.planTier === 'enterprise' ? 'border-purple-200 bg-purple-50 text-purple-700' :
                                                        client.planTier === 'pro' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'text-slate-600'
                                                }>
                                                    {client.planTier ? client.planTier.toUpperCase() : 'FREE'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={client.status === 'active' ? 'bg-green-500' : 'bg-slate-500'}>
                                                    {client.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {client.activeModules && Array.isArray(client.activeModules) && client.activeModules.slice(0, 3).map((m: string) => (
                                                        <Badge key={m} variant="secondary" className="text-[10px] h-5 px-1">{m}</Badge>
                                                    ))}
                                                    {client.activeModules && Array.isArray(client.activeModules) && client.activeModules.length > 3 && (
                                                        <Badge variant="secondary" className="text-[10px] h-5 px-1">+{client.activeModules.length - 3}</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {client.createdAt ? format(new Date(client.createdAt), "MMM d, yyyy") : "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <UserManagementDialog
                                                        clientId={client.id}
                                                        clientName={client.name}
                                                    />
                                                    <Button variant="ghost" size="icon" onClick={() => setEditClient(client)}>
                                                        <Edit className="h-4 w-4 text-blue-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteClient(client)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
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

            {/* Delete Confirmation Alert */}
            <AlertDialog open={!!deleteClient} onOpenChange={(open) => !open && setDeleteClient(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the organization
                            <span className="font-semibold text-foreground"> {deleteClient?.name} </span>
                            and remove ALL related data including users, controls, and policies.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deleteClient) {
                                    deleteMutation.mutate({ id: deleteClient.id });
                                    setDeleteClient(null);
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Organization
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Modal */}
            <EnhancedDialog
                open={!!editClient}
                onOpenChange={(open) => !open && setEditClient(null)}
                title={`Edit Organization: ${editClient?.name}`}
                description="Update subscription plan and active modules."
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button type="submit" form="edit-org-form" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                }
            >
                {editClient && (
                    <form id="edit-org-form" onSubmit={handleUpdate} className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input id="edit-name" name="name" defaultValue={editClient.name} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="planTier">Plan Tier</Label>
                                <Select name="planTier" defaultValue={editClient.planTier || 'free'}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="free">Free</SelectItem>
                                        <SelectItem value="pro">Pro</SelectItem>
                                        <SelectItem value="enterprise">Enterprise</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue={editClient.status || 'active'}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <Label>Active Modules</Label>
                            <div className="grid grid-cols-2 gap-3 border rounded-md p-3">
                                {MODULES.map((module) => (
                                    <div key={module.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`module_${module.id}`}
                                            name={`module_${module.id}`}
                                            defaultChecked={editClient.activeModules?.includes(module.id)}
                                        />
                                        <Label htmlFor={`module_${module.id}`} className="text-sm font-normal cursor-pointer">
                                            {module.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>
                )}
            </EnhancedDialog>
        </div>
    );
}
