import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@complianceos/ui/ui/button';
import { Input } from '@complianceos/ui/ui/input';
import { ArrowLeft, Save, Download, Loader2, FileText } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
// @ts-ignore
import { asBlob } from 'html-docx-js-typescript';
import DashboardLayout from '@/components/DashboardLayout';

export default function StrategicReportEditor() {
    const params = useParams();
    const reportId = parseInt(params.reportId || '0');
    const clientId = parseInt(params.id || '0');

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const { data: report, isLoading, refetch } = trpc.reports.getReport.useQuery({ reportId });

    useEffect(() => {
        if (report) {
            setTitle(report.title);
            // If report has no content field (old reports), create a basic template
            if (!report.content) {
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
            } else {
                setContent(report.content);
            }
        }
    }, [report]);

    const updateMutation = trpc.reports.updateReport.useMutation({
        onSuccess: () => {
            toast.success('Report saved successfully');
            setIsSaving(false);
            refetch();
        },
        onError: (err) => {
            toast.error(`Failed to save: ${err.message}`);
            setIsSaving(false);
        }
    });

    const handleSave = () => {
        setIsSaving(true);
        updateMutation.mutate({
            reportId,
            title,
            content
        });
    };

    const handleExport = async () => {
        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${title}</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; line-height: 1.6; }
                        h1 { font-size: 24px; color: #333; }
                        h2 { font-size: 20px; color: #444; margin-top: 20px; }
                        p { margin-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    ${content}
                </body>
                </html>
            `;

            const blob = await asBlob(htmlContent);
            saveAs(blob, `${title.replace(/\s+/g, '_')}_Report.docx`);
            toast.success('Export started');
        } catch (err) {
            console.error(err);
            toast.error('Failed to export document');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!report) return <div>Report not found</div>;

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-50 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Link href={`/clients/${clientId}/roadmap/reports`}>
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="w-px h-8 bg-slate-200" />
                        <div>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-auto"
                            />
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                <span className="bg-slate-100 rounded px-1.5 py-0.5 font-medium">Draft</span>
                                <span>• Last saved {new Date().toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            title="Export edited content as DOCX"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export Edited
                        </Button>
                        <Button
                            variant="outline"
                            onClick={async () => {
                                try {
                                    // Use the existing downloadReport endpoint
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
                                    a.download = result.fileName || `${report?.title.replace(/\s+/g, "_")}_${report?.version || 'v1.0'}.docx`;
                                    document.body.appendChild(a);
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);

                                    toast.success("Original report downloaded successfully");
                                } catch (error: any) {
                                    console.error("Download failed:", error);
                                    toast.error("Failed to download original report");
                                }
                            }}
                            title="Download original generated file"
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Download Original
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="min-w-[100px]">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 max-w-5xl w-full mx-auto p-8">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[800px]">
                        <RichTextEditor
                            value={content}
                            onChange={setContent}
                            className="min-h-[800px] border-none"
                        />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
