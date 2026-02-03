import React from 'react';
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Plus, AlertTriangle, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { toast } from "sonner";
import { Badge } from "@complianceos/ui/ui/badge";

export default function DisruptiveScenariosPage() {
    const params = useParams();
    const clientId = parseInt(params.id || "0");
    const [_, setLocation] = useLocation();

    const { data: scenarios, refetch } = trpc.businessContinuity.scenarios.list.useQuery({ clientId });

    const deleteScenario = trpc.businessContinuity.scenarios.delete.useMutation({
        onSuccess: () => {
            toast.success("Scenario deleted");
            refetch();
        }
    });

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-[1600px] mx-auto p-6">
                <div className="mb-2">
                    <Breadcrumb
                        items={[
                            { label: "Clients", href: "/clients" },
                            { label: "Business Continuity", href: `/clients/${clientId}/business-continuity` },
                            { label: "Scenarios", href: `/clients/${clientId}/business-continuity/scenarios` },
                        ]}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 -ml-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setLocation(`/clients/${clientId}/business-continuity`)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to BC Dashboard
                    </Button>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Disruptive Scenarios</h1>
                        <p className="text-muted-foreground mt-2">
                            Identify and plan for potential business disruptions.
                        </p>
                    </div>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => setLocation(`/clients/${clientId}/business-continuity/scenarios/new`)}
                    >
                        <Plus className="mr-2 h-4 w-4" /> New Scenario
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scenarios?.map(s => (
                        <Card key={s.id} className="hover:shadow-md transition-shadow group relative">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                                        {s.title}
                                    </CardTitle>
                                    <Badge variant={s.likelihood === 'high' ? 'destructive' : s.likelihood === 'medium' ? 'default' : 'outline'}>
                                        {s.likelihood}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-700 line-clamp-3">{s.description}</p>
                                </div>
                                {s.mitigationStrategies && (
                                    <div className="bg-slate-50 p-3 rounded text-xs text-muted-foreground border">
                                        <strong>Mitigation:</strong> {s.mitigationStrategies}
                                    </div>
                                )}
                                <div className="pt-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="outline" size="sm" onClick={() => setLocation(`/clients/${clientId}/business-continuity/scenarios/${s.id}`)}>
                                        <Pencil className="w-3 h-3 mr-1" /> Edit
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm("Delete this scenario?")) deleteScenario.mutate({ id: s.id });
                                    }}>
                                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {scenarios?.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <h3 className="text-lg font-medium mb-1">No Scenarios Defined</h3>
                            <p className="mb-4">Create your first disruptive scenario to start planning.</p>
                            <Button
                                variant="outline"
                                onClick={() => setLocation(`/clients/${clientId}/business-continuity/scenarios/new`)}
                            >
                                Create Scenario
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
