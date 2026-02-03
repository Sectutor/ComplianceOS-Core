import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@complianceos/ui";
import { trpc } from '@/lib/trpc';
import { FileText, Download, Calendar, FileBarChart } from "lucide-react";
import { Button } from "@complianceos/ui";
import { Badge } from "@complianceos/ui";

interface ReportsDashboardProps {
    clientId: number;
}

export const ReportsDashboard = ({ clientId }: ReportsDashboardProps) => {
    const { data: reports, isLoading } = trpc.reports.getReportHistory.useQuery({
        clientId,
        limit: 20
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Reports (Core)</h2>
                    <p className="text-slate-500">View and download generated report artifacts.</p>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileBarChart className="w-5 h-5 text-slate-500" />
                        Report History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="py-8 text-center text-slate-500">Loading reports...</div>
                    ) : !reports || reports.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-lg border-dashed border-2 border-slate-200">
                            No reports found for this client.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reports.map((report: any) => (
                                <div
                                    key={report.id}
                                    className="flex items-center justify-between p-4 bg-white border rounded-lg"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-slate-100 rounded-lg">
                                            <FileText className="w-6 h-6 text-slate-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900">{report.title}</h4>
                                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                <Badge variant="secondary" className="text-xs font-normal">
                                                    {report.version || 'v1.0'}
                                                </Badge>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(report.generatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
