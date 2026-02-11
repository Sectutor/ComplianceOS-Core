
import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@complianceos/ui/ui/dialog";
import { Input } from "@complianceos/ui/ui/input";
import { FileText, Plus, ExternalLink, Sparkles, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@complianceos/ui/ui/alert-dialog";
import RichTextEditor from '@/components/RichTextEditor';
import { PageGuide } from "@/components/PageGuide";

// Helper to convert Markdown to HTML (Basic)
const convertMarkdownToHtml = (markdown: string) => {
    if (!markdown) return "";
    // If it already looks like HTML (starts with <), return it
    if (markdown.trim().startsWith("<")) return markdown;

    let html = markdown
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/\n/gim, '<br />');

    return html;
};

export default function VendorContractTemplates() {
    // Reusing DPA templates backend for now
    const { data: templates, refetch } = trpc.dpaTemplates.list.useQuery();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [newTemplate, setNewTemplate] = useState({ name: "", content: "", jurisdiction: "General" });
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [viewingTemplate, setViewingTemplate] = useState<any>(null);

    const createMutation = trpc.dpaTemplates.create.useMutation({
        onSuccess: () => {
            toast.success("Template created");
            setIsCreateOpen(false);
            setNewTemplate({ name: "", content: "", jurisdiction: "General" });
            refetch();
        },
        onError: (err) => toast.error("Failed to create template: " + err.message)
    });

    const updateMutation = trpc.dpaTemplates.update.useMutation({
        onSuccess: () => {
            toast.success("Template updated");
            setEditingTemplate(null);
            refetch();
        },
        onError: (err) => toast.error("Failed to update template: " + err.message)
    });

    const deleteMutation = trpc.dpaTemplates.delete.useMutation({
        onSuccess: () => {
            toast.success("Template deleted");
            setDeleteId(null);
            refetch();
        },
        onError: (err) => toast.error("Failed to delete template: " + err.message)
    });

    const handleCreate = () => {
        if (!newTemplate.name || !newTemplate.content) return toast.error("Name and Content are required");
        createMutation.mutate(newTemplate);
    };

    const handleUpdate = () => {
        if (!editingTemplate?.name || !editingTemplate?.content) return toast.error("Name and Content are required");
        updateMutation.mutate({
            id: editingTemplate.id,
            name: editingTemplate.name,
            content: editingTemplate.content,
            jurisdiction: editingTemplate.jurisdiction
        });
    };

    const handleDelete = () => {
        if (deleteId) {
            deleteMutation.mutate({ id: deleteId });
        }
    };

    // Updated AI Generator to produce cleaner HTML
    const generateAIContent = async (templateName: string) => {
        if (!templateName) return toast.error("Enter a name first for context");

        return new Promise(resolve => {
            setTimeout(() => {
                const type = templateName.toLowerCase().includes('nda') ? 'MUTUAL NON-DISCLOSURE AGREEMENT'
                    : templateName.toLowerCase().includes('msa') ? 'MASTER SERVICES AGREEMENT'
                        : 'AGREEMENT';

                resolve(`
<div style="font-family: 'Times New Roman', serif; color: #000;">
    <h1 style="text-align: center; text-transform: uppercase; font-size: 24px; margin-bottom: 40px;">${type}</h1>
    
    <p><strong>THIS AGREEMENT</strong> is made on ${new Date().toLocaleDateString()}</p>
    
    <p><strong>BETWEEN:</strong></p>
    <ol>
        <li><strong>[Company Name]</strong>, a company organized and existing under the laws of [State/Country], with its head office located at [Address] (the "Disclosing Party"); and</li>
        <li><strong>[Counterparty Name]</strong>, a company organized and existing under the laws of [State/Country], with its head office located at [Address] (the "Receiving Party").</li>
    </ol>
    
    <hr style="margin: 30px 0; border: 0; border-top: 1px solid #ccc;">

    <h3>1. PURPOSE</h3>
    <p>The parties wish to explore a business opportunity of mutual interest and in connection with this opportunity, the Disclosing Party may disclose to the Receiving Party certain confidential technical and business information that the Disclosing Party desires the Receiving Party to treat as confidential.</p>

    <h3>2. CONFIDENTIAL INFORMATION</h3>
    <p>"Confidential Information" means any information disclosed by the Disclosing Party to the Receiving Party, either directly or indirectly, in writing, orally or by inspection of tangible objects (including without limitation documents, prototypes, samples, plant and equipment), which is designated as "Confidential," "Proprietary" or some similar designation.</p>

    <h3>3. NON-USE AND NON-DISCLOSURE</h3>
    <p>The Receiving Party agrees not to use any Confidential Information for any purpose except to evaluate and engage in discussions concerning a potential business relationship between the parties. The Receiving Party agrees not to disclose any Confidential Information to third parties or to such of its employees and consultants who do not have a need to know.</p>

    <h3>4. TERM AND TERMINATION</h3>
    <p>This Agreement shall remain in effect for a period of [Number] years from the Effective Date. The obligations of confidentiality shall survive the termination of this Agreement for a period of [Number] years.</p>

    <div style="margin-top: 60px; display: flex; justify-content: space-between;">
        <div style="width: 45%;">
            <p><strong>Signed for and on behalf of<br>The Disclosing Party:</strong></p>
            <br><br>
            <div style="border-top: 1px solid #000; padding-top: 10px;">
                <p>Name: ______________________</p>
                <p>Title: _______________________</p>
            </div>
        </div>
        <div style="width: 45%;">
            <p><strong>Signed for and on behalf of<br>The Receiving Party:</strong></p>
            <br><br>
            <div style="border-top: 1px solid #000; padding-top: 10px;">
                <p>Name: ______________________</p>
                <p>Title: _______________________</p>
            </div>
        </div>
    </div>
</div>
`);
            }, 1500);
        });
    };

    const openEdit = (t: any) => {
        // Auto-convert Markdown to HTML if needed
        const content = convertMarkdownToHtml(t.content);
        setEditingTemplate({ ...t, content });
    };

    const openView = (t: any) => {
        const content = convertMarkdownToHtml(t.content);
        setViewingTemplate({ ...t, content });
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <PageGuide
                    title="Vendor Contract Templates"
                    description="Manage standard agreements (NDAs, MSAs, DPAs) for your vendor onboarding."
                    rationale="Ensure consistent legal terms across your vendor supply chain."
                    howToUse={[
                        { step: "Create", description: "Draft new contract templates." },
                        { step: "AI Draft", description: "Use AI to generate standard legal clauses." },
                        { step: "Manage", description: "Update, version, and delete templates." }
                    ]}
                />
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> New Template</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
                        <DialogHeader className="px-6 py-4 border-b">
                            <DialogTitle>Create New Contract Template</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Template Name</label>
                                    <Input value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} placeholder="e.g. Standard Mutual NDA" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Category / Jurisdiction</label>
                                    <Input value={newTemplate.jurisdiction} onChange={e => setNewTemplate({ ...newTemplate, jurisdiction: e.target.value })} placeholder="e.g. Legal, NDA, US-Only" />
                                </div>
                            </div>

                            <div className="space-y-2 flex-1 flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-medium">Document Content</label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs text-purple-600 border-purple-200 hover:bg-purple-50"
                                        onClick={() => {
                                            toast.promise(
                                                generateAIContent(newTemplate.name),
                                                {
                                                    loading: 'Drafting legal document...',
                                                    success: (data: any) => {
                                                        setNewTemplate(prev => ({ ...prev, content: data }));
                                                        return 'Draft generated!';
                                                    },
                                                    error: 'Failed to generate'
                                                }
                                            );
                                        }}
                                    >
                                        <Sparkles className="h-3 w-3 mr-1" /> Auto-Draft with AI
                                    </Button>
                                </div>
                                <div className="flex-1">
                                    <RichTextEditor
                                        className="h-full"
                                        value={newTemplate.content}
                                        onChange={(html) => setNewTemplate({ ...newTemplate, content: html })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-slate-50 flex justify-end">
                            <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full sm:w-auto">
                                {createMutation.isPending ? 'Creating...' : 'Save Template'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates?.map(t => (
                    <Card key={t.id} className="hover:shadow-md transition-shadow group flex flex-col">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-bold flex items-center truncate pr-2">
                                <FileText className="mr-2 h-5 w-5 text-indigo-500 shrink-0" />
                                <span className="truncate" title={t.name}>{t.name}</span>
                            </CardTitle>
                            <Badge variant="secondary" className="shrink-0">{t.jurisdiction}</Badge>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            <div className="text-sm text-slate-500 mb-4 font-sans bg-slate-50 p-3 rounded border h-32 overflow-hidden relative">
                                <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(t.content) }} />
                                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-50 to-transparent" />
                            </div>

                            <div className="mt-auto flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
                                <span>v{t.version}</span>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2"
                                        onClick={() => openView(t)}
                                    >
                                        <ExternalLink className="h-3 w-3 mr-1" /> View
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2"
                                        onClick={() => openEdit(t)}
                                    >
                                        <Edit className="h-3 w-3 mr-1" /> Edit
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => setDeleteId(t.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* View/Preview Dialog */}
            <Dialog open={!!viewingTemplate} onOpenChange={(open) => !open && setViewingTemplate(null)}>
                <DialogContent className="max-w-5xl h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>{viewingTemplate?.name}</span>
                            <Badge variant="outline">{viewingTemplate?.jurisdiction}</Badge>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="max-w-4xl mx-auto w-full py-8">
                        <div className="bg-white p-12 rounded shadow-sm border min-h-[800px] print:shadow-none print:border-none" dangerouslySetInnerHTML={{ __html: viewingTemplate?.content || '' }} />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
                <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle>Edit Template</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Template Name</label>
                                <Input
                                    value={editingTemplate?.name || ""}
                                    onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category / Jurisdiction</label>
                                <Input
                                    value={editingTemplate?.jurisdiction || ""}
                                    onChange={e => setEditingTemplate({ ...editingTemplate, jurisdiction: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2 flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium">Document Content</label>
                            </div>
                            <div className="flex-1">
                                <RichTextEditor
                                    value={editingTemplate?.content || ""}
                                    onChange={(html) => setEditingTemplate({ ...editingTemplate, content: html })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t bg-slate-50 flex justify-end">
                        <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="w-full sm:w-auto">
                            {updateMutation.isPending ? 'Updating...' : 'Update Template'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this template.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
