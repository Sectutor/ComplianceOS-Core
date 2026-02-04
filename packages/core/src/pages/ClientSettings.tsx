
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { DemoImportDialog } from "@/components/admin/DemoImportDialog";
import { toast } from "sonner";
import {
    CreditCard,
    Settings,
    FileText,
    Shield,
    Loader2,
    ArrowLeft,
    Building2,
    Users,
    Trash2,
    Image,
    Server,
    Database,
    Briefcase,
    MapPin,
    Globe
} from "lucide-react";

import ClientLogoUpload from "@/components/ClientLogoUpload";
import ClientContactInfo from "@/components/ClientContactInfo";
import ClientTeamManagement from "@/components/ClientTeamManagement";
import BillingSettings from "./BillingSettings";
import ClientGeneralSettings from "@/components/ClientGeneralSettings";
import { SmtpSettings } from "@/components/settings/SmtpSettings";
import { PolicySettingsTab } from "@/components/settings/PolicySettingsTab";
import { FrameworksSettingsTab } from "@/components/settings/FrameworksSettingsTab";
import { Badge } from "@complianceos/ui/ui/badge";
import { OnboardingSettingsTab } from "@/components/settings/OnboardingSettingsTab";
import { ListTodo } from "lucide-react";

export default function ClientSettings() {
    const params = useParams();
    const clientId = Number(params.id);
    const [, setLocation] = useLocation();
    const { user } = useAuth();

    // Lazy loaded to avoid potential circular dep issues or just keep clean


    const [isDeletingClient, setIsDeletingClient] = useState(false);
    const [isImportingData, setIsImportingData] = useState(false);

    const { data: client, isLoading, refetch } = trpc.clients.get.useQuery({ id: clientId });

    const deleteClientMutation = trpc.clients.delete.useMutation({
        onSuccess: () => {
            toast.success("Client deleted successfully");
            setLocation("/clients");
        },
        onError: (err) => toast.error(err.message),
    });

    const importDemoDataMutation = trpc.clients.importDemoData.useMutation({
        onSuccess: () => {
            toast.success("Demo data imported successfully!");
            setIsImportingData(false);
            refetch();
        },
        onError: (err) => toast.error(err.message),
    });

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!client) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Client not found</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 w-full max-w-full pb-10 px-6">
                <Breadcrumb
                    items={[
                        { label: "Clients", href: "/clients" },
                        { label: client.name, href: `/clients/${clientId}` },
                        { label: "Settings" },
                    ]}
                />

                {/* Hero Header */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 p-24 bg-indigo-500/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>

                    <CardContent className="p-8 relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-start gap-5">
                                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner">
                                    {client.logoUrl ? (
                                        <img src={client.logoUrl} alt={client.name} className="h-12 w-12 object-contain" />
                                    ) : (
                                        <Settings className="h-12 w-12 text-blue-200" />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-3xl font-bold tracking-tight text-white">{client.name}</h1>
                                        <Badge variant="secondary" className="bg-primary/20 text-primary-foreground hover:bg-primary/30 border-none">
                                            Settings
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
                                        <div className="flex items-center gap-1.5">
                                            <Building2 className="w-4 h-4 text-slate-400" />
                                            {client.industry || "Industry not set"}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-4 h-4 text-slate-400" />
                                            {client.size || "Size not set"}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            {client.headquarters || "HQ not set"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
                                    onClick={() => setLocation(`/clients/${clientId}`)}
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Dashboard
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="general" className="space-y-8">
                    <TabsList className="bg-slate-100/50 p-1.5 h-auto flex flex-wrap justify-start gap-2 w-full border border-slate-200/60 rounded-xl">
                        <TabsTrigger
                            value="general"
                            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent px-4 py-2.5 rounded-lg transition-all"
                        >
                            <Building2 className="mr-2 h-4 w-4" />
                            General
                        </TabsTrigger>
                        <TabsTrigger
                            value="policy"
                            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent px-4 py-2.5 rounded-lg transition-all"
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Policy Settings
                        </TabsTrigger>
                        <TabsTrigger
                            value="team"
                            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent px-4 py-2.5 rounded-lg transition-all"
                        >
                            <Users className="mr-2 h-4 w-4" />
                            Team
                        </TabsTrigger>
                        <TabsTrigger
                            value="branding"
                            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent px-4 py-2.5 rounded-lg transition-all"
                        >
                            <Image className="mr-2 h-4 w-4" />
                            Branding
                        </TabsTrigger>
                        <TabsTrigger
                            value="billing"
                            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent px-4 py-2.5 rounded-lg transition-all"
                        >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Billing
                        </TabsTrigger>
                        <TabsTrigger
                            value="integrations"
                            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent px-4 py-2.5 rounded-lg transition-all"
                        >
                            <Server className="mr-2 h-4 w-4" />
                            Integrations
                        </TabsTrigger>
                        <TabsTrigger
                            value="frameworks"
                            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent px-4 py-2.5 rounded-lg transition-all"
                        >
                            <Shield className="mr-2 h-4 w-4" />
                            Frameworks
                        </TabsTrigger>
                        <TabsTrigger
                            value="data"
                            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent px-4 py-2.5 rounded-lg transition-all"
                        >
                            <Database className="mr-2 h-4 w-4" />
                            Demo Data
                        </TabsTrigger>
                        <TabsTrigger
                            value="onboarding"
                            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent px-4 py-2.5 rounded-lg transition-all"
                        >
                            <ListTodo className="mr-2 h-4 w-4" />
                            Onboarding
                        </TabsTrigger>
                    </TabsList>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* General Tab */}
                            <TabsContent value="general" className="m-0 space-y-6 animate-in fade-in-50 duration-300">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Organization Details</CardTitle>
                                        <CardDescription>Manage the core profile information for this client.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ClientGeneralSettings
                                            clientId={clientId}
                                            initialData={{
                                                name: client.name,
                                                description: client.description,
                                                industry: client.industry,
                                                size: client.size,
                                                cisoName: client.cisoName,
                                                dpoName: client.dpoName,
                                                headquarters: client.headquarters,
                                                mainServiceRegion: client.mainServiceRegion,
                                            }}
                                        />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Contact Information</CardTitle>
                                        <CardDescription>Primary point of contact for this organization.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ClientContactInfo
                                            clientId={clientId}
                                            contactName={client?.primaryContactName}
                                            contactTitle={undefined}
                                            contactEmail={client?.primaryContactEmail}
                                            contactPhone={client?.primaryContactPhone}
                                            address={undefined}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Onboarding Tab */}
                            <TabsContent value="onboarding" className="m-0 space-y-6 animate-in fade-in-50 duration-300">
                                <OnboardingSettingsTab clientId={clientId} />
                            </TabsContent>

                            {/* Policy Settings Tab */}
                            <TabsContent value="policy" className="m-0 space-y-6 animate-in fade-in-50 duration-300">
                                <PolicySettingsTab
                                    clientId={clientId}
                                    client={client}
                                    onUpdate={refetch}
                                />
                            </TabsContent>

                            {/* Team Tab */}
                            <TabsContent value="team" className="m-0 space-y-6 animate-in fade-in-50 duration-300">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Team Management</CardTitle>
                                        <CardDescription>Manage members who have access to this workspace.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ClientTeamManagement clientId={clientId} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Branding Tab */}
                            <TabsContent value="branding" className="m-0 space-y-6 animate-in fade-in-50 duration-300">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Brand Customization</CardTitle>
                                        <CardDescription>Upload organization logo to personlize the workspace.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ClientLogoUpload
                                            clientId={clientId}
                                            currentLogoUrl={client?.logoUrl}
                                            clientName={client?.name || "Client"}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Billing Tab */}
                            <TabsContent value="billing" className="m-0 space-y-6 animate-in fade-in-50 duration-300">
                                <BillingSettings client={client} />
                            </TabsContent>

                            {/* Integrations Tab */}
                            <TabsContent value="integrations" className="m-0 space-y-6 animate-in fade-in-50 duration-300">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>SMTP Configuration</CardTitle>
                                        <CardDescription>Configure email server settings for outgoing notifications.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <SmtpSettings clientId={clientId} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Frameworks Tab */}
                            <TabsContent value="frameworks" className="m-0 space-y-6 animate-in fade-in-50 duration-300">
                                <FrameworksSettingsTab clientId={clientId} />
                            </TabsContent>

                            {/* Demo Data Tab */}
                            <TabsContent value="data" className="m-0 space-y-6 animate-in fade-in-50 duration-300">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Database className="h-5 w-5 text-primary" />
                                            Import Demo Data
                                        </CardTitle>
                                        <CardDescription>
                                            Populate this organization with comprehensive sample data for testing purposes.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5">
                                                    <Shield className="h-5 w-5 text-amber-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-amber-800 mb-1">Warning: Use with caution</h4>
                                                    <p className="text-sm text-amber-700 leading-relaxed">
                                                        This action will generate significant amounts of data including employees, assets, risks, vendors, and policies.
                                                        It is strictly intended for <strong>empty</strong> or <strong>demo</strong> organizations.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <Button onClick={() => setIsImportingData(true)}>
                                            <Database className="mr-2 h-4 w-4" />
                                            Import Demo Data
                                        </Button>
                                        <DemoImportDialog
                                            open={isImportingData}
                                            onOpenChange={setIsImportingData}
                                            onImport={async () => {
                                                await importDemoDataMutation.mutateAsync({ clientId });
                                            }}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>

                        <div className="space-y-6">
                            {/* Tips / Info Side Panel */}
                            <Card className="bg-slate-50/50 border-slate-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-500">Quick Tips</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-sm text-slate-600">
                                        <p className="mb-2 font-medium text-slate-900">Keeping profiles updated</p>
                                        <p>Accurate industry and size information helps us benchmark your compliance posture against peers.</p>
                                    </div>
                                    <div className="h-px bg-slate-200"></div>
                                    <div className="text-sm text-slate-600">
                                        <p className="mb-2 font-medium text-slate-900">Policy Management</p>
                                        <p>Configure default review cycles and approval workflows in the Policy Settings tab.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Danger Zone - Only for Admins */}
                            {user?.role === 'admin' && (
                                <Card className="border-red-200 bg-red-50/30 overflow-hidden">
                                    <CardHeader className="bg-red-50/50 border-b border-red-100 pb-4">
                                        <CardTitle className="text-red-700 flex items-center gap-2 text-lg">
                                            <Trash2 className="h-5 w-5" />
                                            Danger Zone
                                        </CardTitle>
                                        <CardDescription className="text-red-600/80">
                                            Irreversible actions for this organization.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <p className="text-sm text-slate-600 mb-4">
                                            Permanently delete this client and all associated data. This action cannot be undone and will remove:
                                        </p>
                                        <ul className="list-disc list-inside text-sm text-slate-600 mb-6 space-y-1 ml-1">
                                            <li>All policies and procedures</li>
                                            <li>Risk assessments and registers</li>
                                            <li>Employee records and evidence</li>
                                            <li>Access controls and settings</li>
                                        </ul>
                                        <EnhancedDialog
                                            open={isDeletingClient}
                                            onOpenChange={setIsDeletingClient}
                                            title="Delete Client"
                                            description={
                                                <>
                                                    Are you sure you want to delete <span className="font-semibold text-foreground">{client.name}</span>?
                                                    This will permanently delete all associated controls, policies, evidence, mappings, and assignments.
                                                </>
                                            }
                                            footer={
                                                <div className="flex justify-end gap-2 w-full">
                                                    <Button variant="outline" onClick={() => setIsDeletingClient(false)}>Cancel</Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => deleteClientMutation.mutate({ id: clientId })}
                                                        disabled={deleteClientMutation.isPending}
                                                    >
                                                        {deleteClientMutation.isPending ? "Deleting..." : "Delete Permanently"}
                                                    </Button>
                                                </div>
                                            }
                                            trigger={
                                                <Button variant="destructive" className="w-full">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete Organization
                                                </Button>
                                            }
                                        />
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </Tabs>
            </div>
        </DashboardLayout >
    );
}
