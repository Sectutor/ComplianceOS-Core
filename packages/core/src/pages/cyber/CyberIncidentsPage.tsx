import React from "react";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Plus, AlertTriangle, Search, Filter, Eye, CheckCircle2, Loader2 } from "lucide-react";
import { Input } from "@complianceos/ui/ui/input";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { PageGuide } from "@/components/PageGuide";
import { cn } from "@/lib/utils";

export default function CyberIncidentsPage() {
    const { selectedClientId } = useClientContext();
    const [, setLocation] = useLocation();

    const { data: incidents, isLoading } = trpc.cyber.getIncidents.useQuery(
        { clientId: selectedClientId! },
        { enabled: !!selectedClientId }
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "resolved": return "bg-green-50 text-green-700 ring-1 ring-green-600/20";
            case "mitigated": return "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20";
            case "investigating": return "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20";
            default: return "bg-slate-50 text-slate-700 ring-1 ring-slate-600/20";
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
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
                <Button
                    onClick={() => setLocation(`/clients/${selectedClientId}/cyber/incidents/new`)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-red-100 transition-all active:scale-95 flex-shrink-0"
                >
                    <Plus className="mr-2 h-5 w-5" /> Report New Incident
                </Button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden ring-1 ring-slate-200/50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-sky-50 text-[#3ABEF9] flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="text-3xl font-black text-slate-900 leading-none">
                                    {incidents?.filter(i => i.status === 'open' || i.status === 'investigating').length || 0}
                                </div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Open Incidents</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden ring-1 ring-slate-200/50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="text-3xl font-black text-red-600 leading-none">
                                    {incidents?.filter(i => i.severity === 'critical' && i.status !== 'resolved').length || 0}
                                </div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Critical (Active)</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden ring-1 ring-slate-200/50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="text-3xl font-black text-green-600 leading-none">
                                    {incidents?.filter(i => i.status === 'resolved').length || 0}
                                </div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Resolved (All Time)</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* List */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden ring-1 ring-slate-200/50">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <CardTitle className="text-xl font-bold text-slate-900">Incident Registry</CardTitle>
                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search incidents..."
                                    className="pl-9 h-10 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                                />
                            </div>
                            <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-slate-200">
                                <Filter className="h-4 w-4 text-slate-500" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-0">
                                <TableHead className="font-bold text-slate-700 h-14 pl-6 w-32">Severity</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Incident / ID</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Status</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Detected</TableHead>
                                <TableHead className="font-bold text-slate-700 h-14">Reporter</TableHead>
                                <TableHead className="text-right font-bold text-slate-700 h-14 pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="h-8 w-8 text-[#3ABEF9] animate-spin" />
                                            <p className="text-sm font-bold text-slate-500">Retrieving incident logs...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : incidents?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <p className="text-sm font-bold text-slate-400">No security incidents recorded.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                incidents?.map((incident, idx) => (
                                    <TableRow
                                        key={incident.id}
                                        className="hover:bg-slate-50/80 transition-colors group border-b border-slate-100 last:border-0"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <TableCell className="pl-6">
                                            <Badge className={cn(
                                                "font-bold px-3 py-1 rounded-full uppercase tracking-widest text-[10px]",
                                                incident.severity === 'critical' ? "bg-red-500 text-white" :
                                                    incident.severity === 'high' ? "bg-orange-500 text-white" :
                                                        incident.severity === 'medium' ? "bg-amber-500 text-white" : "bg-sky-500 text-white"
                                            )}>
                                                {incident.severity}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-bold text-slate-900">{incident.title}</div>
                                            <div className="text-xs font-bold text-[#1C4D8D]/60 mt-0.5 uppercase tracking-widest">ID-INC-{incident.id}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(
                                                "border-none font-bold px-3 py-1 rounded-full",
                                                getStatusColor(incident.status || 'open')
                                            )}>
                                                {incident.status?.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-600 font-medium">
                                            {incident.detectedAt && format(new Date(incident.detectedAt), "MMM d, HH:mm")}
                                        </TableCell>
                                        <TableCell className="text-slate-600 font-medium">{incident.reporterName || 'Sytem'}</TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setLocation(`/clients/${selectedClientId}/cyber/incidents/${incident.id}`)}
                                                className="h-9 px-4 rounded-lg font-bold text-[#1C4D8D] hover:bg-sky-50 hover:text-[#3ABEF9] transition-all"
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Review
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
    );
}
