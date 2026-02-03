import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Badge } from "@complianceos/ui/ui/badge";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ArrowLeft, Save, Eye, FileText, Loader2, History, RotateCcw, HelpCircle, ChevronDown, ChevronUp, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@complianceos/ui/ui/dialog";
import RichTextEditor from "@/components/RichTextEditor";
import { marked } from "marked";
import TurndownService from "turndown";
// @ts-ignore
import html2pdf from "html2pdf.js";
// @ts-ignore
import { asBlob } from "html-docx-js-typescript";
import { saveAs } from "file-saver";

export default function ReportEditor() {
    const params = useParams();
    const clientId = Number(params.id);
    const reportId = Number(params.reportId);
    const [location, setLocation] = useLocation();

    // TODO: Need to add getReport and updateReport endpoints to tRPC
    // For now, we'll use getReportHistory and filter
    const { data: reportsData, isLoading: loadingReports, refetch: refetchReports } = trpc.reports.getReportHistory.useQuery(
        { clientId, limit: 100 },
        { enabled: !!clientId }
    );

    // Find the specific report from the list
    const report = reportsData?.find(r => r.id === reportId);

    const deleteReportMutation = trpc.reports.deleteReport.useMutation({
        onSuccess: () => {
            toast.success("Report deleted successfully");
            setLocation(`/clients/${clientId}/roadmap/reports`);
        },
        onError: (error) => {
            toast.error(`Failed to delete report: ${error.message}`);
        }
    });

    const [title, setTitle] = useState("");
    const [version, setVersion] = useState("draft");
    const [content, setContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Initialize form when report data loads
    useEffect(() => {
        if (report) {
            setTitle(report.title);
            setVersion(report.version || "draft");

            // If report has stored content, use it. Otherwise use a default template.
            if (report.content) {
                setContent(report.content);
            } else {
                const basicContent = `
                    <h1>${report.title}</h1>
                    <p><strong>Version:</strong> ${report.version || 'draft'}</p>
                    <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleDateString()}</p>
                    <hr>
                    <h2>Report Content</h2>
                    <p>This report was generated as a DOCX/PDF file. You can now edit it here in the rich text editor.</p>
                    <p>Changes you make will be saved as HTML content in the database.</p>
                    <p>You can still download the original generated file using the "Download Original" button.</p>
                `;
                setContent(basicContent);
            }
        }
    }, [report]);

    const updateReportMutation = trpc.reports.updateReport.useMutation({
        onSuccess: () => {
            toast.success("Report updated successfully");
            setIsSaving(false);
            refetchReports();
        },
        onError: (error) => {
            toast.error(`Failed to save report: ${error.message}`);
            setIsSaving(false);
        }
    });

    const handleSave = async () => {
        if (!report) return;

        setIsSaving(true);
        try {
            await updateReportMutation.mutateAsync({
                reportId: report.id,
                title,
                version,
                content,
            });
        } catch (error: any) {
            // Error handled in onError callback
        }
    };

    const handleDelete = () => {
        if (!report) return;
        deleteReportMutation.mutate({ reportId: report.id });
    };

    const handleDownload = async () => {
        if (!report) return;

        try {
            // Use the existing download endpoint
            const result = await trpc.reports.downloadReport.query({ reportId: report.id });

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
            a.download = result.fileName || `${report.title.replace(/\s+/g, "_")}_${report.version || 'v1.0'}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Report downloaded successfully");
        } catch (error: any) {
            console.error("Download failed:", error);
            toast.error("Failed to download report");
        }
    };

    const handleExportPDF = () => {
        if (!content) return;

        try {
            const element = document.createElement('div');
            element.innerHTML = marked.parse(content);

            const opt = {
                margin: 1,
                filename: `${title.replace(/\s+/g, '_')}_${version}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save();
            toast.success("PDF exported successfully");
        } catch (error: any) {
            toast.error(`Failed to export PDF: ${error.message}`);
        }
    };

    const handleExportDOCX = async () => {
        if (!content) return;

        try {
            const htmlContent = marked.parse(content);
            const blob = await asBlob({ html: htmlContent });
            saveAs(blob, `${title.replace(/\s+/g, '_')}_${version}.docx`);
            toast.success("DOCX exported successfully");
        } catch (error: any) {
            toast.error(`Failed to export DOCX: ${error.message}`);
        }
    };

    if (loadingReports) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        );
    }

    if (!report) {
        return (
            <DashboardLayout>
                <div className="p-8">
                    <div className="text-center py-20">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Report Not Found</h1>
                        <p className="text-muted-foreground mb-6">
                            The report you're looking for doesn't exist or you don't have access to it.
                        </p>
                        <Button onClick={() => setLocation(`/clients/${clientId}/roadmap/reports`)}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Reports
                        </Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-8 max-w-[1400px] mx-auto">
                {/* Breadcrumb */}
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                        { label: "Report Management", href: `/clients/${clientId}/roadmap/reports` },
                        { label: title || "Edit Report" },
                    ]}
                />

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Report</h1>
                        <p className="text-muted-foreground mt-2">
                            Edit and manage your generated report
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setLocation(`/clients/${clientId}/roadmap/reports`)}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleDownload}
                            disabled={deleteReportMutation.isLoading}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download Original
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => setShowDeleteDialog(true)}
                            disabled={deleteReportMutation.isLoading}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Report Info */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Report Information</CardTitle>
                        <CardDescription>
                            Basic details about this report
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="title">Report Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Strategic Roadmap Report"
                                />
                            </div>
                            <div>
                                <Label htmlFor="version">Version</Label>
                                <Input
                                    id="version"
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    placeholder="v1.0"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className={
                                report.roadmapId ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                    report.implementationPlanId ? "bg-blue-50 text-blue-700 border-blue-200" :
                                        "bg-slate-50 text-slate-700 border-slate-200"
                            }>
                                {report.roadmapId ? "Roadmap Report" :
                                    report.implementationPlanId ? "Implementation Report" :
                                        "General Report"}
                            </Badge>
                            <Badge variant="outline">
                                Generated: {new Date(report.generatedAt).toLocaleDateString()}
                            </Badge>
                            {report.fileSize && (
                                <Badge variant="outline">
                                    Size: {Math.round(report.fileSize / 1024)} KB
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Content Editor */}
                {/* Content Editor */}
                {/* Content Editor */}
                <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="mb-6">
                    <div className="rounded-xl border bg-card text-card-foreground shadow">
                        <div className="flex flex-col space-y-1.5 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold leading-none tracking-tight">Report Content</h3>
                                    <p className="text-sm text-muted-foreground mt-1.5">
                                        Edit the report content using the rich text editor
                                    </p>
                                </div>
                                <div className="bg-muted p-1 rounded-lg">
                                    <TabsList className="bg-transparent p-0">
                                        <TabsTrigger value="edit">
                                            <FileText className="h-4 w-4 mr-2" />
                                            Edit
                                        </TabsTrigger>
                                        <TabsTrigger value="preview">
                                            <Eye className="h-4 w-4 mr-2" />
                                            Preview
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 pt-0">
                            <TabsContent value="edit" className="mt-0">
                                <RichTextEditor
                                    value={content}
                                    onChange={setContent}
                                    placeholder="Start writing your report content here..."
                                    height="500px"
                                />
                            </TabsContent>
                            <TabsContent value="preview" className="mt-0">
                                <div
                                    className="prose prose-slate max-w-none p-6 border rounded-lg bg-white"
                                    dangerouslySetInnerHTML={{ __html: marked.parse(content) }}
                                />
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleExportPDF}
                        >
                            Export as PDF
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleExportDOCX}
                        >
                            Export as DOCX
                        </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Last saved: {report.updatedAt ? new Date(report.updatedAt).toLocaleString() : "Never"}
                    </div>
                </div>

                {/* Delete Dialog */}
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Trash2 className="h-5 w-5 text-destructive" />
                                Delete Report
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete "{report.title}"?
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
                                onClick={() => setShowDeleteDialog(false)}
                                disabled={deleteReportMutation.isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
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