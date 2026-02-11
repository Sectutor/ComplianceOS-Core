import React from "react";
import CyberLayout from "./CyberLayout";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@complianceos/ui/ui/alert";
import { Plus, AlertTriangle, Search, Filter, Eye } from "lucide-react";
import { Input } from "@complianceos/ui/ui/input";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { PageGuide } from "@/components/PageGuide";

export default function CyberIncidentsPage() {
    const { selectedClientId } = useClientContext();
    const [location, setLocation] = useLocation();

    const { data: incidents, isLoading } = trpc.cyber.getIncidents.useQuery(
        { clientId: selectedClientId! },
        { enabled: !!selectedClientId }
    );

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "critical": return "destructive";
            case "high": return "destructive"; // Or orange if available, usually destructive implies red
            case "medium": return "secondary"; // or yellow/warning
            case "low": return "outline";
            default: return "outline";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "resolved": return "bg-green-100 text-green-800 hover:bg-green-100";
            case "mitigated": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
            case "investigating": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
            default: return "bg-gray-100 text-gray-800 hover:bg-gray-100"; // Open/Repoerted
        }
    };

    return (
        <CyberLayout>
            <div className="space-y-6 w-full max-w-none">
                <div className="flex justify-between items-start animate-slide-down">
                    <PageGuide
                        title="Incident Management"
                        description="Track and manage cyber security incidents reported under NIS2."
                        rationale="Centralized incident tracking ensures timely reporting (24h/72h) and effective response."
                        howToUse={[
                            { step: "Report", description: "Log new incidents immediately upon detection." },
                            { step: "Monitor", description: "Track status and severity of open incidents." },
                            { step: "Resolve", description: "Document mitigation steps and close incidents." }
                        ]}
                    />
                    <Button onClick={() => setLocation(`/cyber/incidents/new`)} className="bg-red-600 hover:bg-red-700 text-white">
                        <Plus className="mr-2 h-4 w-4" /> Report New Incident
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {incidents?.filter(i => i.status === 'open' || i.status === 'investigating').length || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Critical Incidents (72h)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {incidents?.filter(i => i.severity === 'critical' && i.status !== 'resolved').length || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Resolved (Last 30d)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {incidents?.filter(i => i.status === 'resolved').length || 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Recorded Incidents</CardTitle>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search incidents..."
                                        className="pl-8 w-[250px]"
                                    />
                                </div>
                                <Button variant="outline" size="icon">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Title / ID</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Detected At</TableHead>
                                    <TableHead>Reporter</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            Loading incidents...
                                        </TableCell>
                                    </TableRow>
                                ) : incidents?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No incidents recorded.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    incidents?.map((incident) => (
                                        <TableRow key={incident.id}>
                                            <TableCell>
                                                <Badge variant={getSeverityColor(incident.severity || 'low') as any} className="capitalize">
                                                    {incident.severity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div>{incident.title}</div>
                                                <div className="text-xs text-muted-foreground">ID: #{incident.id}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={`capitalize ${getStatusColor(incident.status || 'open')}`}>
                                                    {incident.status?.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {incident.detectedAt && format(new Date(incident.detectedAt), "MMM d, yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell>{incident.reporterName || 'Unknown'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setLocation(`/cyber/incidents/${incident.id}`)}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </CyberLayout>
    );
}
