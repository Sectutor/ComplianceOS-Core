import { useState } from 'react';
import { useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@complianceos/ui/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { Skeleton } from '@complianceos/ui/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@complianceos/ui/ui/dialog';
import { 
    FileText, Download, Trash2, AlertCircle, Calendar, 
    Plus, RefreshCw, Edit, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useClientContext } from '@/contexts/ClientContext';

export default function StrategicReportsPage() {
    const params = useParams();
    const clientIdParam = params.id ? parseInt(params.id, 10) : null;
    const { selectedClientId } = useClientContext();
    const clientId = clientIdParam || selectedClientId;

    // State
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [reportToDelete, setReportToDelete] = useState<{id: number, title: string} | null>(null);

    // Queries - using reports.getReportHistory instead of strategicReports.list
    const { data: reports, isLoading, refetch } = trpc.reports.getReportHistory.useQuery({
        clientId: clientId!,
        limit: 50
    }, { enabled: !!clientId });

    const deleteReportMutation = trpc.reports.deleteReport.useMutation({
        onSuccess: () => {
            toast.success("Report deleted successfully");
            refetch();
        },
        onError: (error) => {
            toast.error(`Failed to delete report: ${error.message}`);
        }
    });

    // Show ALL reports - roadmap, implementation, and general
    const allReports = reports || [];

    const handleDownload = async (reportId: number, title: string, version: string) => {
        try {
            // Fetch the report data via tRPC
            const result = await trpc.reports.downloadReport.query({ reportId });
            
            // Convert base64 to blob
            const byteCharacters = atob(result.data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: result.mimeType });
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.fileName || `${title.replace(/\s+/g, "_")}_${version}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success("Report downloaded successfully");
        } catch (error) {
            console.error("Download failed:", error);
            toast.error("Failed to download report");
        }
    };

    const handleDeleteClick = (reportId: number, title: string) => {
        setReportToDelete({ id: reportId, title });
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (reportToDelete) {
            deleteReportMutation.mutate({ reportId: reportToDelete.id });
            setDeleteDialogOpen(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetch();
        setIsRefreshing(false);
        toast.success("Reports refreshed");
    };



    if (!clientId) {
        return (
            <DashboardLayout>
                <div className="space-y-6 w-full max-w-full p-6">
                    <Card className="border-destructive/20 bg-destructive/5">
                        <CardContent className="p-8 text-center">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                            <h2 className="text-xl font-bold mb-2">Client Access Required</h2>
                            <p className="text-muted-foreground">
                                Please select a client to view roadmap reports.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 w-full max-w-full p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Report Management</h1>
                    <p className="text-muted-foreground">
                        View, download, and delete all generated reports
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isRefreshing || isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Reports
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? <Skeleton className="h-8 w-16" /> : allReports.length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Roadmap Reports
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? <Skeleton className="h-8 w-16" /> : 
                                allReports.filter(r => r.roadmapId !== null).length
                            }
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Implementation Reports
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? <Skeleton className="h-8 w-16" /> : 
                                allReports.filter(r => r.implementationPlanId !== null).length
                            }
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            General Reports
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? <Skeleton className="h-8 w-16" /> : 
                                allReports.filter(r => r.roadmapId === null && r.implementationPlanId === null).length
                            }
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Reports List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Generated Reports</CardTitle>
                    <CardDescription>
                        Manage all generated reports - roadmap, implementation, and general
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-lg" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-48" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-9 w-20" />
                                        <Skeleton className="h-9 w-20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : allReports.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No reports generated yet</h3>
                            <p className="text-muted-foreground mb-6">
                                Generate reports from the Roadmap Dashboard or Implementation Dashboard
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => window.location.href = `/clients/${clientId}/roadmap/dashboard`}
                            >
                                Go to Roadmap Dashboard
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {allReports.map((report) => (
                                <div
                                    key={report.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${
                                            report.roadmapId ? 'bg-emerald-50' : 
                                            report.implementationPlanId ? 'bg-blue-50' : 'bg-slate-50'
                                        }`}>
                                            <FileText className={`h-4 w-4 ${
                                                report.roadmapId ? 'text-emerald-600' : 
                                                report.implementationPlanId ? 'text-blue-600' : 'text-slate-600'
                                            }`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">{report.title}</h4>
                                                {report.roadmapId && (
                                                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                                                        Roadmap
                                                    </Badge>
                                                )}
                                                {report.implementationPlanId && (
                                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                        Implementation
                                                    </Badge>
                                                )}
                                                {!report.roadmapId && !report.implementationPlanId && (
                                                    <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
                                                        General
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{format(new Date(report.generatedAt), 'MMM d, yyyy')}</span>
                                                </div>
                                                {report.version && (
                                                    <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                                                        {report.version}
                                                    </span>
                                                )}
                                                {report.fileSize && (
                                                    <span className="text-xs">
                                                        {(report.fileSize / 1024 / 1024).toFixed(2)} MB
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.location.href = `/clients/${clientId}/roadmap/reports/${report.id}`}
                                            disabled={deleteReportMutation.isLoading}
                                        >
                                            <Edit className="h-3 w-3 mr-2" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownload(report.id, report.title, report.version || 'v1.0')}
                                            disabled={deleteReportMutation.isLoading}
                                        >
                                            <Download className="h-3 w-3 mr-2" />
                                            Download
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDeleteClick(report.id, report.title)}
                                            disabled={deleteReportMutation.isLoading}
                                        >
                                            <Trash2 className="h-3 w-3 mr-2" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        About Report Management
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <div className="mt-1">•</div>
                            <span><strong>Create Reports:</strong> Generate reports from the Roadmap Dashboard or Implementation Dashboard</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="mt-1">•</div>
                            <span><strong>Manage Reports:</strong> View, download, or delete ALL generated reports here</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="mt-1">•</div>
                            <span><strong>Roadmap Reports:</strong> Generated from specific strategic roadmaps (green badge)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="mt-1">•</div>
                            <span><strong>Implementation Reports:</strong> Generated from implementation plans (blue badge)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="mt-1">•</div>
                            <span><strong>General Reports:</strong> Generated without specific roadmap or plan (gray badge)</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete Report
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{reportToDelete?.title}"? 
                            <br />
                            <span className="font-semibold text-destructive">This action cannot be undone.</span>
                            <br />
                            <br />
                            This will permanently delete the report from the database and remove the generated file from storage.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deleteReportMutation.isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleteReportMutation.isLoading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteReportMutation.isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Report
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            </div>
        </DashboardLayout>
    );
}
