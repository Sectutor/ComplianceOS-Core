import React, { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@complianceos/ui/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import { Badge } from "@complianceos/ui/ui/badge";
import { Loader2, ChevronLeft, ChevronRight, Eye, RefreshCw, Download } from "lucide-react";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function ClientActivity() {
    const [, params] = useRoute("/clients/:id/activity");
    const clientId = parseInt(params?.id || "0");

    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [actionFilter, setActionFilter] = useState<string>("all");
    const [entityFilter, setEntityFilter] = useState<string>("all");

    const { data: logs, isLoading, isError, error, refetch } = trpc.auditLogs.list.useQuery({
        page,
        limit,
        clientId,
        action: actionFilter === "all" ? undefined : actionFilter,
        entityType: entityFilter === "all" ? undefined : entityFilter,
    }, {
        enabled: !!clientId
    });

    const { data: client } = trpc.clients.get.useQuery({ id: clientId }, { enabled: !!clientId });

    const handleExport = () => {
        if (!logs) return;
        const csvContent = "data:text/csv;charset=utf-8," +
            ["ID,Time,User,Action,Entity Type,Entity ID,Details,Severity,IP"].join(",") + "\n" +
            logs.map(log =>
                [
                    log.id,
                    new Date(log.createdAt || "").toISOString(),
                    log.userEmail || log.userId,
                    log.action,
                    log.entityType,
                    log.entityId,
                    JSON.stringify(log.details).replace(/,/g, ";"),
                    log.severity,
                    log.ipAddress || ''
                ].join(",")
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `client_${clientId}_activity_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <Breadcrumb items={[
                    { label: "Clients", href: "/clients" },
                    { label: client?.name || "Client", href: `/clients/${clientId}` },
                    { label: "Activity Log" }
                ]} />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
                        <p className="text-muted-foreground mt-2">
                            Audit trail for {client?.name}.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExport} disabled={!logs || logs.length === 0}>
                            <Download className="h-4 w-4 mr-2" /> Export CSV
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle>Change History</CardTitle>
                                <CardDescription>View changes made within this workspace.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-[180px]">
                                    <Select value={actionFilter} onValueChange={setActionFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by Action" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Actions</SelectItem>
                                            <SelectItem value="create">Create</SelectItem>
                                            <SelectItem value="update">Update</SelectItem>
                                            <SelectItem value="delete">Delete</SelectItem>
                                            <SelectItem value="publish">Publish</SelectItem>
                                            <SelectItem value="restore">Restore</SelectItem>
                                            <SelectItem value="login">Login</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-[180px]">
                                    <Select value={entityFilter} onValueChange={setEntityFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by Entity" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Entities</SelectItem>
                                            <SelectItem value="policy">Policy</SelectItem>
                                            <SelectItem value="control">Control</SelectItem>
                                            <SelectItem value="user">People</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : isError ? (
                            <div className="text-center p-8 text-red-500">
                                Error loading logs: {error.message}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                            <TableHead className="text-white font-semibold py-4">Timestamp</TableHead>
                                            <TableHead className="text-white font-semibold py-4">User</TableHead>
                                            <TableHead className="text-white font-semibold py-4">Action</TableHead>
                                            <TableHead className="text-white font-semibold py-4">Entity</TableHead>
                                            <TableHead className="text-right text-white font-semibold py-4">Details</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-gray-500 bg-white">
                                                    No activity found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            logs?.map((log) => (
                                                <TableRow key={log.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                                                    <TableCell className="whitespace-nowrap font-mono text-xs text-gray-500 py-4">
                                                        {new Date(log.createdAt || '').toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm text-black">{log.userName}</span>
                                                            <span className="text-xs text-gray-500">{log.userEmail}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge variant="outline" className="capitalize bg-white border-gray-300 text-gray-700">
                                                            {log.action}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="capitalize text-sm text-black">
                                                            {log.entityType} {log.entityId && <span className="text-gray-500">#{log.entityId}</span>}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right py-4">
                                                        <EnhancedDialog
                                                            title="Details"
                                                            trigger={
                                                                <Button variant="ghost" size="sm" className="hover:bg-[#1C4D8D]/10 hover:text-[#1C4D8D] transition-colors duration-200">
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    View
                                                                </Button>
                                                            }
                                                            size="lg"
                                                        >
                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <span className="font-semibold block text-muted-foreground">Action</span>
                                                                        {log.action}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-semibold block text-muted-foreground">Entity</span>
                                                                        {log.entityType} #{log.entityId}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-semibold block text-muted-foreground">User</span>
                                                                        {log.userName} ({log.userEmail})
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-semibold block text-muted-foreground">Time</span>
                                                                        {new Date(log.createdAt || '').toLocaleString()}
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <span className="font-semibold block mb-2 text-muted-foreground">Raw Data</span>
                                                                    <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                                                                        {JSON.stringify(JSON.parse(log.details as string || '{}'), null, 2)}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        </EnhancedDialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || isLoading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <div className="text-sm text-muted-foreground">
                                Page {page}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={!logs || logs.length < limit || isLoading}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
