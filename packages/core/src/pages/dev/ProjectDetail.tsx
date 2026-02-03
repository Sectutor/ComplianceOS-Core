
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { useLocation, useParams } from "wouter";
import { Button } from "@complianceos/ui/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { ArrowLeft, Github, ShieldAlert, FileText, Layers, Pencil, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ThreatModelWizard } from "../../components/threat-modeling/ThreatModelWizard";
import { RiskTreatmentDialog } from "../../components/risk/RiskTreatmentDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { TreatmentEditDialog } from "../../components/risk/TreatmentEditDialog";
import { RiskEditDialog } from "../../components/risk/RiskEditDialog";

import { format } from "date-fns";

export const ProjectDetail = () => {
    const { selectedClientId } = useClientContext();
    const params = useParams();
    const [location, setLocation] = useLocation();

    // Prioritize URL parameter for consistency, fallback to context
    const clientId = params.clientId ? parseInt(params.clientId) : selectedClientId;
    const projectId = parseInt(params.projectId || "0");

    console.log("[ProjectDetail] Route params:", params);
    console.log("[ProjectDetail] clientId:", clientId, "type:", typeof clientId);
    console.log("[ProjectDetail] projectId:", projectId, "type:", typeof projectId);

    const { data: project, isLoading, error } = trpc.devProjects.get.useQuery(
        { id: projectId, clientId: clientId! },
        { enabled: !!clientId && !!projectId }
    );

    if (error) {
        console.error("[ProjectDetail] TRPC Error:", error);
    }

    const [activeTab, setActiveTab] = useState("threat-models");

    // Fetch Risks & Treatments
    const { data: risks, refetch: refetchRisks } = trpc.devProjects.getRisks.useQuery(
        { clientId: clientId!, devProjectId: projectId },
        { enabled: !!clientId && !!projectId }
    );

    const { data: treatments, refetch: refetchTreatments } = trpc.devProjects.getTreatments.useQuery(
        { clientId: clientId!, devProjectId: projectId },
        { enabled: !!clientId && !!projectId }
    );

    const [isMitigationOpen, setIsMitigationOpen] = useState(false);
    const [selectedRiskId, setSelectedRiskId] = useState<number | null>(null);
    const [editingTreatment, setEditingTreatment] = useState<any | null>(null);
    const [editingRisk, setEditingRisk] = useState<any | null>(null);

    const deleteTreatmentMutation = trpc.risks.deleteRiskTreatment.useMutation();
    const deleteRiskMutation = trpc.devProjects.deleteRisk.useMutation();

    const handleAddMitigation = (riskId: number) => {
        setSelectedRiskId(riskId);
        setIsMitigationOpen(true);
    };

    const handleEditTreatment = (treatment: any) => {
        setEditingTreatment(treatment);
    };

    const handleEditRisk = (risk: any) => {
        setEditingRisk(risk);
    };

    const handleDeleteTreatment = async (treatmentId: number) => {
        if (!confirm('Are you sure you want to delete this mitigation?')) return;
        try {
            await deleteTreatmentMutation.mutateAsync({ id: treatmentId });
            refetchTreatments();
            refetchRisks();
        } catch (error) {
            console.error('Failed to delete treatment', error);
        }
    };

    const handleDeleteRisk = async (riskId: number) => {
        if (!confirm('Are you sure you want to delete this risk?')) return;
        try {
            await deleteRiskMutation.mutateAsync({ id: riskId, clientId: clientId! });
            refetchRisks();
            refetchTreatments(); // Deleted risk might have treatments
        } catch (error) {
            console.error('Failed to delete risk', error);
        }
    };

    if (isLoading) return <div className="p-8">Loading project details...</div>;
    if (!project) return (
        <div className="p-8">
            <h1 className="text-xl font-bold text-red-600">Project not found</h1>
            <div className="mt-4 p-4 border rounded bg-slate-50 text-sm font-mono">
                <p>Debug Information:</p>
                <ul className="list-disc ml-5 mt-2">
                    <li>clientId: {String(clientId)} (type: {typeof clientId})</li>
                    <li>projectId: {String(projectId)} (type: {typeof projectId})</li>
                    <li>params.clientId: {params.clientId}</li>
                    <li>params.id (legacy): {params.id}</li>
                    <li>params.projectId: {params.projectId}</li>
                    <li>selectedClientId (context): {String(selectedClientId)}</li>
                </ul>
            </div>
            <Button className="mt-4" onClick={() => setLocation(`/clients/${clientId}/dev/projects`)}>
                Back to Threat Modeling
            </Button>
        </div>
    );

    return (
        <DashboardLayout>
            <div className="space-y-6 page-transition">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Threat Modeling", href: `/clients/${clientId}/dev/projects` },
                        { label: project.name },
                    ]}
                />
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation(`/clients/${clientId}/dev/projects`)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                            {project.repositoryUrl && (
                                <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600">
                                    <Github className="h-5 w-5" />
                                </a>
                            )}
                        </div>
                        <p className="text-slate-500 mt-1">{project.description}</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                        <Badge variant="outline" className="text-sm px-3 py-1 bg-white">
                            {project.owner || "No Owner"}
                        </Badge>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 mb-6">

                        <TabsTrigger value="threat-models" className="border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-4 py-2">Threat Models</TabsTrigger>
                        <TabsTrigger value="risks" className="border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-4 py-2">Risk Register</TabsTrigger>
                        <TabsTrigger value="mitigations" className="border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-4 py-2">Mitigations</TabsTrigger>
                    </TabsList>



                    <TabsContent value="threat-models">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold">Threat Models</h2>
                                <Button onClick={() => setLocation(`/clients/${clientId}/dev/projects/${projectId}/threat-model/new`)}>Create Threat Model</Button>
                            </div>

                            {project.threatModels && project.threatModels.length > 0 ? (
                                <div className="grid gap-4">
                                    {project.threatModels.map((tm: any) => (
                                        <div
                                            key={tm.id}
                                            className="cursor-pointer transition-all hover:scale-[1.01]"
                                            onClick={() => {
                                                console.log("Navigating to threat model:", tm.id);
                                                setLocation(`/clients/${clientId}/dev/projects/${projectId}/threat-model/${tm.id}`);
                                            }}
                                        >
                                            <Card className="hover:bg-slate-50 border-blue-100/50 hover:border-blue-300 transition-colors">
                                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                    <div className="flex items-center gap-3">
                                                        <ShieldAlert className="h-5 w-5 text-blue-500" />
                                                        <div>
                                                            <CardTitle className="text-base text-blue-950">{tm.name}</CardTitle>
                                                            <CardDescription>{tm.methodology} • {format(new Date(tm.updatedAt), 'MMM d, yyyy')}</CardDescription>
                                                        </div>
                                                    </div>
                                                    <Badge variant={tm.status === 'active' ? 'default' : 'secondary'} className={tm.status === 'active' ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : ""}>
                                                        {tm.status}
                                                    </Badge>
                                                </CardHeader>
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 border border-dashed rounded-lg text-slate-500">
                                    No threat models found. Create one to analyze risks.
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="risks">
                        <Card>
                            <CardHeader>
                                <CardTitle>Risk Register</CardTitle>
                                <CardDescription>Identified security risks for {project.name}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Risk Title</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead className="text-center">Likelihood</TableHead>
                                            <TableHead className="text-center">Impact</TableHead>
                                            <TableHead>Inherent Risk</TableHead>
                                            <TableHead>Residual Risk</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {risks?.map((risk: any) => (
                                            <TableRow key={risk.id}>
                                                <TableCell className="font-medium">
                                                    <div>{risk.title}</div>
                                                    <div className="text-xs text-slate-500 line-clamp-1">{risk.description}</div>
                                                </TableCell>
                                                <TableCell><Badge variant="outline">{risk.threatCategory || 'General'}</Badge></TableCell>
                                                <TableCell className="text-center">
                                                    {risk.likelihood ? (
                                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-white font-bold text-sm shadow-sm ${Number(risk.likelihood) >= 5 ? 'bg-red-600' :
                                                            Number(risk.likelihood) >= 4 ? 'bg-orange-500' :
                                                                Number(risk.likelihood) >= 3 ? 'bg-amber-500' : 'bg-emerald-600'
                                                            }`}>
                                                            {risk.likelihood}
                                                        </div>
                                                    ) : <span className="text-muted-foreground">-</span>}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {risk.impact ? (
                                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-white font-bold text-sm shadow-sm ${Number(risk.impact) >= 5 ? 'bg-red-600' :
                                                            Number(risk.impact) >= 4 ? 'bg-orange-500' :
                                                                Number(risk.impact) >= 3 ? 'bg-amber-500' : 'bg-emerald-600'
                                                            }`}>
                                                            {risk.impact}
                                                        </div>
                                                    ) : <span className="text-muted-foreground">-</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <div className={`font-bold ${Number(risk.inherentScore) >= 15 ? 'text-red-600' : Number(risk.inherentScore) >= 9 ? 'text-amber-600' : 'text-green-600'}`}>
                                                        {risk.inherentScore} <span className="text-xs font-normal text-muted-foreground">({risk.inherentRisk})</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {risk.residualScore ? (
                                                        <div className={`font-bold ${Number(risk.residualScore) >= 15 ? 'text-red-600' : Number(risk.residualScore) >= 9 ? 'text-amber-600' : 'text-green-600'}`}>
                                                            {risk.residualScore} <span className="text-xs font-normal text-muted-foreground">({risk.residualRisk || '-'})</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell><Badge variant={risk.status === 'mitigated' ? 'default' : 'secondary'}>{risk.status}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="outline" onClick={() => handleAddMitigation(risk.id)}>Mitigate</Button>
                                                        <Button size="icon" variant="ghost" onClick={() => handleEditRisk(risk)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteRisk(risk.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!risks || risks.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-10 text-slate-500 italic">
                                                    No risks identified yet. Run a Threat Model to generate risks.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="mitigations">
                        <Card>
                            <CardHeader>
                                <CardTitle>Mitigations</CardTitle>
                                <CardDescription>Risk treatment strategy and status</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Risk</TableHead>
                                            <TableHead>Strategy</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {treatments?.map((t: any) => (
                                            <TableRow key={t.treatment.id}>
                                                <TableCell className="font-medium">{t.riskTitle}</TableCell>
                                                <TableCell>
                                                    <div className="capitalize font-semibold">{t.treatment.treatmentType}</div>
                                                    <div className="text-xs text-slate-500">{t.treatment.strategy || t.treatment.justification}</div>
                                                </TableCell>
                                                <TableCell><Badge variant="secondary">{t.treatment.status}</Badge></TableCell>
                                                <TableCell className="text-slate-500">
                                                    {t.treatment.dueDate ? format(new Date(t.treatment.dueDate), 'MMM d, yyyy') : 'No date'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEditTreatment(t.treatment)}
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-600 hover:bg-red-50 hover:border-red-300"
                                                            onClick={() => handleDeleteTreatment(t.treatment.id)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!treatments || treatments.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-10 text-slate-500 italic">
                                                    No mitigations planned yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {isMitigationOpen && selectedRiskId && (
                    <RiskTreatmentDialog
                        open={isMitigationOpen}
                        onOpenChange={setIsMitigationOpen}
                        riskId={selectedRiskId}
                        clientId={clientId!}
                        onSuccess={() => {
                            refetchTreatments();
                            refetchRisks();
                        }}
                    />
                )}

                {editingTreatment && (
                    <TreatmentEditDialog
                        open={!!editingTreatment}
                        onOpenChange={(open) => !open && setEditingTreatment(null)}
                        treatment={editingTreatment}
                        clientId={clientId!}
                        onSuccess={() => {
                            refetchTreatments();
                            refetchRisks();
                            setEditingTreatment(null);
                        }}
                    />
                )}

                {editingRisk && (
                    <RiskEditDialog
                        open={!!editingRisk}
                        onOpenChange={(open) => !open && setEditingRisk(null)}
                        risk={editingRisk}
                        clientId={clientId!}
                        onSuccess={() => {
                            refetchRisks();
                            setEditingRisk(null);
                        }}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};
