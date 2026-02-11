import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { FileText, ArrowRight, ExternalLink, Trash } from "lucide-react";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import { PageGuide } from "@/components/PageGuide";

export default function RiskReportList() {
    const params = useParams();
    const clientId = params.id ? Number(params.id) : 0;

    // Use the listReports procedure we just created
    const { data: reports, isLoading } = trpc.risks.listReports.useQuery({ clientId });
    const utils = trpc.useUtils();

    const deleteMutation = trpc.risks.deleteReport.useMutation({
        onSuccess: () => {
            toast.success("Report deleted");
            utils.risks.listReports.invalidate({ clientId });
        },
        onError: () => toast.error("Failed to delete report")
    });

    const statusMutation = trpc.risks.updateReportStatus.useMutation({
        onSuccess: () => {
            toast.success("Status updated");
            utils.risks.listReports.invalidate({ clientId });
        },
        onError: () => toast.error("Failed to update status")
    });

    const handleStatusChange = (reportId: number, newStatus: string) => {
        statusMutation.mutate({ clientId, reportId, status: newStatus });
    };

    const handleDelete = async (reportId: number) => {
        if (confirm("Are you sure you want to delete this report?")) {
            await deleteMutation.mutateAsync({ clientId, reportId });
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Risk Reports</h1>
                        <p className="text-muted-foreground">Manage and archive risk management reports.</p>
                    </div>
                    <PageGuide
                        title="Risk Reports"
                        description="Archive and manage generated risk management reports."
                        rationale="Maintaining a history of risk reports is crucial for demonstrating compliance over time and tracking improvements."
                        howToUse={[
                            { step: "View Reports", description: "Access past reports to compare risk postures." },
                            { step: "Manage Status", description: "Track reports through Draft, Review, and Approval stages." },
                            { step: "Export", description: "Download reports for board meetings or audits." }
                        ]}
                        integrations={[
                            { name: "Risk Assessments", description: "Reports are generated directly from your live assessment data." }
                        ]}
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Saved Reports</CardTitle>
                        <CardDescription>
                            A history of AI-generated and saved risk management reports.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4">Loading reports...</TableCell>
                                    </TableRow>
                                ) : !reports || reports.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                            No saved reports found.
                                            <br />
                                            Go to the <Link href={`/clients/${clientId}/risks/report/new`} className="text-primary hover:underline">Draft Editor</Link> to create one.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reports.map((report) => (
                                        <TableRow key={report.id}>
                                            <TableCell className="font-medium">
                                                {report.title || "Untitled Report"}
                                            </TableCell>
                                            <TableCell>v{report.version}</TableCell>
                                            <TableCell>
                                                <Select
                                                    defaultValue={report.status || "draft"}
                                                    onValueChange={(val) => handleStatusChange(report.id, val)}
                                                >
                                                    <SelectTrigger className="w-[130px] h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="draft">Draft</SelectItem>
                                                        <SelectItem value="review">In Review</SelectItem>
                                                        <SelectItem value="approved">Approved</SelectItem>
                                                        <SelectItem value="published">Published</SelectItem>
                                                        <SelectItem value="archived">Archived</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>{new Date(report.createdAt || new Date()).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/clients/${clientId}/risks/report/${report.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        Open
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(report.id)}
                                                    disabled={deleteMutation.isLoading}
                                                >
                                                    <Trash className="w-4 h-4" />
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
        </DashboardLayout>
    );
}
