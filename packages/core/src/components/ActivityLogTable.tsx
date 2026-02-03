
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import { Skeleton } from "@complianceos/ui/ui/skeleton";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc";
import { RefreshCw, Shield, FileText, User } from "lucide-react";
import { useState } from "react";

interface ActivityLogTableProps {
    clientId?: number;
}

export default function ActivityLogTable({ clientId }: ActivityLogTableProps) {
    const [page, setPage] = useState(0);
    const limit = 20;

    const { data: logs, isLoading, refetch } = trpc.auditLogs.list.useQuery({
        clientId,
        limit,
        offset: page * limit
    });

    const getEntityIcon = (type: string) => {
        switch (type) {
            case 'control': return <Shield className="h-4 w-4 text-blue-500" />;
            case 'policy': return <FileText className="h-4 w-4 text-purple-500" />;
            case 'user': return <User className="h-4 w-4 text-orange-500" />;
            default: return null;
        }
    };

    const formatDetails = (details: any) => {
        if (!details) return "N/A";
        try {
            const d = JSON.parse(details as string);
            if (d.field) return `Changed ${d.field} from '${d.old}' to '${d.new}'`;
            if (d.version) return `Published version ${d.version}`;
            return JSON.stringify(d).substring(0, 50) + "...";
        } catch {
            return String(details);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">System Activity</h3>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                    <TableHead className="text-white font-semibold py-4">Time</TableHead>
                                    <TableHead className="text-white font-semibold py-4">User</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Action</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Entity</TableHead>
                                    <TableHead className="text-white font-semibold py-4">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i} className="bg-white border-b border-slate-200">
                                            <TableCell className="py-4"><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell className="py-4"><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell className="py-4"><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell className="py-4"><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell className="py-4"><Skeleton className="h-4 w-40" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : logs && logs.length > 0 ? (
                                    logs.map((log) => (
                                        <TableRow key={log.id} className="bg-white border-b border-slate-200 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm group">
                                            <TableCell className="whitespace-nowrap text-xs text-gray-500 py-4">
                                                {format(new Date(log.createdAt || ''), 'MMM d, HH:mm')}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                        {(log.user?.firstName || 'U')[0]}
                                                    </div>
                                                    <span className="text-sm text-black">{log.user?.firstName} {log.user?.lastName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge variant="outline" className="uppercase text-[10px] bg-white border-gray-300 text-gray-700">
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2 text-sm capitalize text-gray-600">
                                                    {getEntityIcon(log.entityType)}
                                                    {log.entityType} #{log.entityId}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500 max-w-xs truncate py-4">
                                                {formatDetails(log.details)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500 bg-white">
                                            No activity recorded yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2 text-sm text-muted-foreground">
                Showing last {limit} events
            </div>
        </div>
    );
}
