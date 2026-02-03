
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useClientContext } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Loader2, Plus, Search, Settings, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function ProcessRegistry() {
    const { selectedClientId } = useClientContext();
    const [location, setLocation] = useLocation();
    const [match, params] = useRoute("/clients/:id/business-continuity/processes");

    // Robustly get clientId from URL or Context
    const clientId = params?.id ? parseInt(params.id) : selectedClientId;

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Create Form State
    const [newName, setNewName] = useState("");
    const [newDepartment, setNewDepartment] = useState("");
    const [newCriticality, setNewCriticality] = useState<string>("Tier 2");
    const [newDescription, setNewDescription] = useState("");

    const { data: processes, isLoading, refetch } = trpc.businessContinuity.processes.list.useQuery(
        { clientId: clientId! },
        { enabled: !!clientId }
    );

    const createMutation = trpc.businessContinuity.processes.create.useMutation();

    const handleCreate = async () => {
        if (!newName || !selectedClientId) return;

        try {
            await createMutation.mutateAsync({
                clientId: selectedClientId,
                name: newName,
                department: newDepartment,
                criticalityTier: newCriticality,
                description: newDescription,
            });
            toast.success("Process registered successfully");
            setIsCreateOpen(false);
            setNewName("");
            setNewDepartment("");
            setNewDescription("");
            refetch();
        } catch (error) {
            console.error(error);
            toast.error("Failed to register process");
        }
    };

    const filteredProcesses = processes?.filter((p: any) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="p-8 w-full max-w-full space-y-6">
                <div className="flex items-center gap-4">
                    <div className="mb-2">
                        <Breadcrumb
                            items={[
                                { label: "Clients", href: "/clients" },
                                { label: "Business Continuity", href: `/clients/${clientId}/business-continuity` },
                                { label: "Process Registry", href: `/clients/${clientId}/business-continuity/processes` },
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
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Process Registry</h1>
                        <p className="text-muted-foreground">Catalog of critical business functions and their dependencies.</p>
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <div className="relative w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search processes..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Button onClick={() => setLocation(`/clients/${selectedClientId}/business-continuity/processes/new`)}>
                        <Plus className="w-4 h-4 mr-2" /> Register Process
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Registered Processes</CardTitle>
                        <CardDescription>Manage your organization's business processes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                        ) : (
                            <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                            <TableHead className="text-white font-semibold py-4">Process Name</TableHead>
                                            <TableHead className="text-white font-semibold py-4">Department</TableHead>
                                            <TableHead className="text-white font-semibold py-4">Criticality</TableHead>
                                            <TableHead className="text-white font-semibold py-4">RTO / RPO</TableHead>
                                            <TableHead className="text-right text-white font-semibold py-4">Edit</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProcesses?.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-gray-500 py-8 bg-white">
                                                    No processes registered yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {filteredProcesses?.map((process: any) => (
                                            <TableRow key={process.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                                                <TableCell className="font-medium text-black py-4">{process.name}</TableCell>
                                                <TableCell className="text-gray-600 py-4">{process.department || "-"}</TableCell>
                                                <TableCell className="py-4">
                                                    <Badge variant={
                                                        process.criticalityTier === 'Tier 1' ? 'destructive' :
                                                            process.criticalityTier === 'Tier 2' ? 'default' : 'secondary'
                                                    }>
                                                        {process.criticalityTier || "Unassessed"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500 py-4">
                                                    {process.rto ? `RTO: ${process.rto}` : "Pending BIA"}
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <Button variant="outline" size="sm" className="hover:bg-[#1C4D8D]/10 hover:text-[#1C4D8D] transition-colors duration-200" onClick={() => setLocation(`/clients/${selectedClientId}/business-continuity/processes/${process.id}`)}>
                                                        Edit
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
