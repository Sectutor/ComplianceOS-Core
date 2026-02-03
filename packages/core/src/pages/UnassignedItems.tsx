import { useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import { Button } from '@complianceos/ui/ui/button';
import { Link } from 'wouter';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Loader2, ArrowLeft, ShieldAlert, FileWarning, ArrowRight } from 'lucide-react';
import { Badge } from '@complianceos/ui/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";

export default function UnassignedItems() {
    const { id: clientId } = useParams<{ id: string }>();
    const cId = parseInt(clientId || '0', 10);

    const { data: gapAnalysis, isLoading } = trpc.employees.getRACIGapAnalysis.useQuery(
        { clientId: cId },
        { enabled: cId > 0 }
    );

    const { data: client } = trpc.clients.get.useQuery(
        { id: cId },
        { enabled: cId > 0 }
    );

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </DashboardLayout>
        );
    }

    const unassignedPolicies = gapAnalysis?.unassignedPolicies || [];
    const unassignedControls = gapAnalysis?.unassignedControls || [];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <Breadcrumb
                    items={[
                        { label: "Clients", href: "/clients" },
                        { label: client?.name || "Client", href: `/clients/${cId}` },
                        { label: "RACI Matrix", href: `/clients/${cId}/raci-matrix` },
                        { label: "Unassigned Items" },
                    ]}
                />

                <div className="flex items-center gap-4">
                    <Link href={`/clients/${cId}/raci-matrix`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Unassigned Items</h1>
                        <p className="text-gray-600 mt-1">Review and assign ownership to close compliance gaps</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-orange-50 border-orange-200">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                                <FileWarning className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-orange-900">{unassignedPolicies.length}</div>
                                <div className="text-orange-700 font-medium">Unassigned Policies</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-yellow-50 border-yellow-200">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-yellow-900">{unassignedControls.length}</div>
                                <div className="text-yellow-700 font-medium">Unassigned Controls</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="policies" className="w-full">
                    <TabsList>
                        <TabsTrigger value="policies">Policies ({unassignedPolicies.length})</TabsTrigger>
                        <TabsTrigger value="controls">Controls ({unassignedControls.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="policies" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Unassigned Policies</CardTitle>
                                <CardDescription>
                                    These policies lack assigned Accountable or Responsible roles.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {unassignedPolicies.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        No unassigned policies found. Good job!
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {unassignedPolicies.map((policy: any) => (
                                            <div key={policy.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 bg-white">
                                                <div className="flex items-center gap-4">
                                                    <Badge variant="outline">POLICY</Badge>
                                                    <div className="font-medium">{policy.name}</div>
                                                </div>
                                                <Button asChild size="sm" variant="outline" className="gap-2">
                                                    <Link href={`/clients/${cId}/policies/${policy.id}?from=raci-unassigned`}>
                                                        Assign RACI <ArrowRight className="w-4 h-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="controls" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Unassigned Controls</CardTitle>
                                <CardDescription>
                                    These controls have no assigned owner.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {unassignedControls.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        No unassigned controls found. Good job!
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {unassignedControls.map((control: any) => (
                                            <div key={control.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 bg-white">
                                                <div className="flex items-center gap-4">
                                                    <Badge variant="outline">CONTROL</Badge>
                                                    <div className="font-medium">
                                                        {control.name}
                                                        {(control.title || control.description) && (
                                                            <span className="ml-2 text-gray-500 font-normal">
                                                                - {control.title || control.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button asChild size="sm" variant="outline" className="gap-2">
                                                    <Link href={`/clients/${cId}/controls`}>
                                                        Assign Owner <ArrowRight className="w-4 h-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
