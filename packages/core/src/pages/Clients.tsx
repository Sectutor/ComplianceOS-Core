import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
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
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Skeleton } from "@complianceos/ui/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Plus, FolderOpen, ArrowRight, Search, Building2, Trash2, Edit, Settings } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useBilling } from "@/hooks/useBilling";


export default function Clients() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<number | null>(null);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
  const [clientData, setClientData] = useState({ name: "", description: "", industry: "", size: "" });

  const { data: clients, isLoading, refetch } = trpc.clients.list.useQuery();
  console.log('Clients page render. isLoading:', isLoading, 'clients:', clients);

  const { upgradeAccount, isLoading: isBillingLoading } = useBilling();

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success("Client created successfully");
      setIsCreateOpen(false);
      setClientData({ name: "", description: "", industry: "", size: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create client");
    },
  });

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast.success("Client updated successfully");
      setEditingClient(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update client");
    },
  });

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success("Client deleted successfully");
      setClientToDelete(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete client");
    },
  });


  const { data: me } = trpc.users.me.useQuery();

  const clientsArray = Array.isArray(clients) ? clients : (clients as any)?.json || [];

  // Count organizations where user is owner
  const ownedClientsLimit = me?.maxClients || 2;
  const isAtLimit = clientsArray.length >= ownedClientsLimit && me?.role !== 'admin' && me?.role !== 'owner';

  const filteredClients = clientsArray.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateClient = () => {
    if (isAtLimit) {
      toast.error(`You have reached your limit of ${ownedClientsLimit} organizations.`);
      return;
    }
    createMutation.mutate(clientData);
  }

  const handleDeleteClient = (id: number) => {
    setClientToDelete(id);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: "Clients" },
          ]}
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground mt-1">Manage your client organizations and their compliance workspaces.</p>
          </div>
          <EnhancedDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            trigger={
              <Button className="gap-2" disabled={isAtLimit} variant={isAtLimit ? "outline" : "default"}>
                <Plus className="h-4 w-4" />
                {isAtLimit ? "Limit Reached" : "New Client"}
              </Button>
            }
            title="Add New Client"
            description={isAtLimit
              ? `You have reached the limit for your current plan (${ownedClientsLimit} organizations).`
              : "Create a new client workspace to manage."
            }
            footer={
              <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                {!isAtLimit && (
                  <Button onClick={handleCreateClient} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Client"}
                  </Button>
                )}
                {isAtLimit && (
                  <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => upgradeAccount('pro')} disabled={isBillingLoading}>
                    Upgrade Plan
                  </Button>
                )}
              </div>
            }
          >
            {isAtLimit ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-amber-600 rotate-45" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">Subscription Limit Reached</h3>
                  <p className="text-sm text-muted-foreground">
                    Your current <strong>Subscription (DIY)</strong> plan allows for up to {ownedClientsLimit} organizations.
                    Upgrade to Managed or vCISO tiers for unlimited client management and AI-powered evidence triage.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input id="name" value={clientData.name} onChange={(e) => setClientData({ ...clientData, name: e.target.value })} placeholder="Acme Corp" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input id="industry" value={clientData.industry} onChange={(e) => setClientData({ ...clientData, industry: e.target.value })} placeholder="Technology, Healthcare, etc." />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="size">Company Size</Label>
                  <Select value={clientData.size} onValueChange={(v) => setClientData({ ...clientData, size: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="500+">500+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={clientData.description} onChange={(e) => setClientData({ ...clientData, description: e.target.value })} placeholder="Brief description of the client..." />
                </div>
              </div>
            )}
          </EnhancedDialog>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clients..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {
          isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-[200px] w-full" />
              <Skeleton className="h-[200px] w-full" />
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 custom-dashed-border rounded-lg bg-muted/10 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No clients found</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                {searchQuery ? "No clients match your search criteria." : "Get started by adding your first client organization."}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Client
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <Card key={client.id} className="card-interactive card-accent-left group cursor-pointer" onClick={() => setLocation(`/clients/${client.id}`)}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-bold">{client.name}</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                        {client.description || "No description provided."}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {client.industry && (
                          <div className="bg-secondary px-2 py-1 rounded-md">
                            {client.industry}
                          </div>
                        )}
                        {client.size && (
                          <div className="bg-secondary px-2 py-1 rounded-md">
                            {client.size}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FolderOpen className="h-3 w-3" />
                          Workspace Ready
                        </span>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLocation(`/clients/${client.id}/settings`)} title="Client Settings">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteClient(client.id)} title="Delete Client">
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => setLocation(`/clients/${client.id}`)}>
                            Open
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        }
      </div >

      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client
              organization and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (clientToDelete) {
                  deleteMutation.mutate({ id: clientToDelete });
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Client"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout >
  );
}