
import React from "react";
import { trpc } from "@/lib/trpc";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Loader2, Globe, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";

interface PublicSubprocessorTableProps {
    clientId: number;
    className?: string;
}

export function PublicSubprocessorTable({ clientId, className }: PublicSubprocessorTableProps) {
    const { data, isLoading } = trpc.subprocessors.publicExport.useQuery({ clientId });

    if (isLoading) {
        return (
            <div className="flex justify-center p-8 border rounded-lg bg-slate-50">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
        );
    }

    const { subprocessors, lastUpdated } = data || { subprocessors: [], lastUpdated: new Date() };

    return (
        <Card className={className}>
            <CardHeader className="pb-3 border-b bg-slate-50/50">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg">Subprocessor List</CardTitle>
                        <CardDescription>
                            List of third-party vendors processing personal data.
                        </CardDescription>
                    </div>
                    {lastUpdated && (
                        <Badge variant="outline" className="bg-white text-xs font-normal">
                            Updated: {format(new Date(lastUpdated), 'MMM d, yyyy')}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="pl-6">Name</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Transfer Mechanism</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subprocessors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No public subprocessors listed.
                                </TableCell>
                            </TableRow>
                        ) : (
                            subprocessors.map((sub: any, idx: number) => (
                                <TableRow key={idx} className="hover:bg-slate-50/50">
                                    <TableCell className="pl-6 font-medium text-slate-900">
                                        {sub.name}
                                    </TableCell>
                                    <TableCell>{sub.category || "Service Provider"}</TableCell>
                                    <TableCell>{sub.dataLocation || "Global"}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-normal text-xs bg-slate-100 text-slate-700">
                                            {sub.transferMechanism || "Standard Contractual Clauses"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            <div className="p-3 border-t bg-slate-50 text-center text-xs text-muted-foreground">
                Powered by ComplianceOS &bull; <a href="#" className="underline">Subscribe to updates</a>
            </div>
        </Card>
    );
}
