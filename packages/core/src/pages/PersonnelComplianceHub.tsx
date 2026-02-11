import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageGuide } from "@/components/PageGuide";
import { useClientContext } from "@/contexts/ClientContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Input } from "@complianceos/ui/ui/input";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Users, GraduationCap, ClipboardList, Search, Loader2, FileCheck, Package, ArrowLeft, AlertOctagon } from "lucide-react";
import TrainingManagement from "./TrainingManagement";
import OnboardingSettings from "./settings/OnboardingSettings";
import ClientPoliciesPage from "./ClientPoliciesPage";
import EquipmentAssignmentTab from "@/components/compliance/EquipmentAssignmentTab";
import PolicyExceptionsTab from "@/components/compliance/PolicyExceptionsTab";

export default function PersonnelComplianceHub() {
    const { id: idParam } = useParams();
    const context = useClientContext();
    const clientId = parseInt(idParam || "0") || context.selectedClientId || 0;
    const [activeTab, setActiveTab] = useState("training");
    const { data: client } = trpc.clients.get.useQuery({ id: clientId }, { enabled: !!clientId });

    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => window.history.back()}>
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <Breadcrumb
                        items={[
                            { label: "Dashboard", href: "/dashboard" },
                            { label: "Clients", href: "/clients" },
                            { label: client?.name || "Client", href: `/clients/${clientId}` },
                            { label: "Personnel Compliance" },
                        ]}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Personnel Compliance</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage training modules, onboarding documents, and track company-wide compliance status.
                        </p>
                    </div>
                    <PageGuide
                        title="Personnel Compliance"
                        description="360-degree view of employee security status."
                        rationale="Centralizes tracking of background checks, training, and policy acceptance."
                        howToUse={[
                            { step: "Onboard Employees", description: "Manage document signing workflows." },
                            { step: "Monitor Status", description: "Identify non-compliant staff at a glance." },
                            { step: "Asset Management", description: "Track assigned devices and access." }
                        ]}
                        integrations={[
                            { name: "Training", description: "Links to Training Management." },
                            { name: "Policies", description: "Tracks policy acceptance." }
                        ]}
                    />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full max-w-4xl grid-cols-6">
                        <TabsTrigger value="training" className="gap-2">
                            <GraduationCap className="h-4 w-4" />
                            Training
                        </TabsTrigger>
                        <TabsTrigger value="documents" className="gap-2">
                            <ClipboardList className="h-4 w-4" />
                            Documents
                        </TabsTrigger>
                        <TabsTrigger value="policies" className="gap-2">
                            <FileCheck className="h-4 w-4" />
                            Policies
                        </TabsTrigger>
                        <TabsTrigger value="exceptions" className="gap-2">
                            <AlertOctagon className="h-4 w-4" />
                            Exceptions
                        </TabsTrigger>
                        <TabsTrigger value="assets" className="gap-2">
                            <Package className="h-4 w-4" />
                            Assets
                        </TabsTrigger>
                        <TabsTrigger value="tracking" className="gap-2">
                            <Users className="h-4 w-4" />
                            Tracking
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="training" className="space-y-6">
                        <TrainingManagement hideLayout={true} clientId={clientId} />
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-6">
                        <OnboardingSettings hideLayout={true} clientId={clientId} />
                    </TabsContent>

                    <TabsContent value="policies" className="space-y-6">
                        <ClientPoliciesPage hideLayout={true} clientId={clientId} />
                    </TabsContent>

                    <TabsContent value="exceptions" className="space-y-6">
                        <PolicyExceptionsTab clientId={clientId} />
                    </TabsContent>

                    <TabsContent value="assets" className="space-y-6">
                        <EquipmentAssignmentTab clientId={clientId} />
                    </TabsContent>

                    <TabsContent value="tracking" className="space-y-6">
                        <ComplianceTrackingTab clientId={clientId} />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}

// --- Compliance Tracking Tab ---
function ComplianceTrackingTab({ clientId }: { clientId: number }) {
    const [search, setSearch] = useState("");
    const { data: employeeStatuses, isLoading } = (trpc.onboarding as any).getCompanyOnboardingStatus?.useQuery(
        { clientId },
        { enabled: clientId > 0 }
    );

    const filteredEmployees = employeeStatuses?.filter((emp: any) =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle>Personnel Compliance Tracking</CardTitle>
                    <CardDescription>
                        Real-time status of employee onboarding and training completion.
                    </CardDescription>
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search employees..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Employee</TableHead>
                                <TableHead>Training</TableHead>
                                <TableHead>Documents</TableHead>
                                <TableHead>Overall</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                            <span>Loading status...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredEmployees?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                        No employees found matching your search.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEmployees?.map((emp: any) => (
                                    <TableRow key={emp.employeeId} className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-blue-600 hover:underline cursor-pointer">
                                                    <a href={`/clients/${clientId}/employees/${emp.employeeId}`}>
                                                        {emp.firstName} {emp.lastName}
                                                    </a>
                                                </span>
                                                <span className="text-xs text-muted-foreground">{emp.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 transition-all"
                                                        style={{ width: `${(emp.tasks.training.count / (emp.tasks.training.total || 1)) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium tabular-nums">
                                                    {emp.tasks.training.count}/{emp.tasks.training.total}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-orange-500 transition-all"
                                                        style={{ width: `${(emp.tasks.acknowledgments.count / (emp.tasks.acknowledgments.total || 1)) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium tabular-nums">
                                                    {emp.tasks.acknowledgments.count}/{emp.tasks.acknowledgments.total}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={emp.percentage === 100 ? "default" : "secondary"}
                                                className={emp.percentage === 100 ? "bg-green-500 hover:bg-green-600" : ""}
                                            >
                                                {emp.percentage}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <a href={`/clients/${clientId}/employees/${emp.employeeId}`}>View Details</a>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
