
import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@complianceos/ui/ui/dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { FileText, Plus, Search, ExternalLink, Sparkles, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@complianceos/ui/ui/alert-dialog";
import { PageGuide } from "@/components/PageGuide";

export default function DPAManager() {
    const { data: templates, refetch } = trpc.dpaTemplates.list.useQuery();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: "", content: "", jurisdiction: "Global" });
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [viewingTemplate, setViewingTemplate] = useState<any>(null);

    const createMutation = trpc.dpaTemplates.create.useMutation({
        onSuccess: () => {
            toast.success("Template created");
            setIsCreateOpen(false);
            setNewTemplate({ name: "", content: "", jurisdiction: "Global" });
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

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">

                <PageGuide
                    title="DPA Templates"
                    description="Manage standard Data Processing Agreements."
                    rationale="Mandatory for GDPR compliance when sharing personal data with processors."
                    howToUse={[
                        { step: "Create", description: "Draft new DPA templates for different regions." },
                        { step: "Customize", description: "Set jurisdictions (EU, UK, CA) and clauses." },
                        { step: "Deploy", description: "Use templates for vendor contract negotiation." }
                    ]}
                />
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> New Template</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create New DPA Template</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Template Name</label>
                                <Input value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} placeholder="e.g. Standard EU DPA 2026" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Jurisdiction</label>
                                <Input value={newTemplate.jurisdiction} onChange={e => setNewTemplate({ ...newTemplate, jurisdiction: e.target.value })} placeholder="e.g. Global, EU, CA" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Content (Markdown/HTML)</label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs text-purple-600 border-purple-200 hover:bg-purple-50"
                                        onClick={() => {
                                            if (!newTemplate.name) return toast.error("Enter a name first for context");
                                            toast.promise(
                                                new Promise(resolve => setTimeout(() => resolve(`
**DATA PROCESSING REQUIREMENTS (DPA)**

**THIS AGREEMENT** is made on ${new Date().toLocaleDateString()}

**BETWEEN:**
(1) **[Company Name]** (the "Controller"); and
(2) **${newTemplate.name}** (the "Processor").

---

**1. DEFINITIONS**
1.1 "Data Protection Laws" means all applicable laws relating to the processing of Personal Data, including but not limited to the GDPR, UK GDPR, and CCPA/CPRA where applicable.
1.2 "Personal Data", "Processing", "Controller", "Processor", and "Data Subject" shall have the meanings given to them in the Data Protection Laws.

**2. SCOPE AND PURPOSE**
2.1 The Processor shall process Personal Data only on documented instructions from the Controller, unless required to do so by applicable law.
2.2 The subject matter, duration, nature, and purpose of the processing are described in **Annex A** of this agreement.

**3. OBLIGATIONS OF THE PROCESSOR**
The Processor shall:
(a) Ensure that persons authorized to process the personal data have committed themselves to confidentiality;
(b) Implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk, including encryption and pseudonymization where appropriate;
(c) Assist the Controller in fulfilling its obligation to respond to requests for exercising the data subject's rights;
(d) Assist the Controller in ensuring compliance with security, data breach notification, and data protection impact assessment obligations;
(e) At the choice of the Controller, delete or return all Personal Data to the Controller after the end of the provision of services.

**4. SUBPROCESSING**
4.1 The Processor shall not engage another processor without prior specific or general written authorization of the Controller.
4.2 Where the Processor engages another processor, same data protection obligations shall be imposed on that other processor.

**5. INTERNATIONAL TRANSFERS**
5.1 Any transfer of Personal Data to a third country or an international organization shall only be performed in compliance with Chapter V of the GDPR or equivalent provisions of applicable Data Protection Laws.

**6. JURISDICTION**
This agreement is governed by the laws of **${newTemplate.jurisdiction || 'New York'}**.

---
*Generated by ComplianceOS AI*
                                                `), 1500)),
                                                {
                                                    loading: 'Generating legal text with AI...',
                                                    success: (data: any) => {
                                                        setNewTemplate(prev => ({ ...prev, content: data }));
                                                        return 'Draft generated!';
                                                    },
                                                    error: 'Failed to generate'
                                                }
                                            );
                                        }}
                                    >
                                        <Sparkles className="h-3 w-3 mr-1" /> Generate with AI
                                    </Button>
                                </div>
                                <Textarea className="min-h-[200px]" value={newTemplate.content} onChange={e => setNewTemplate({ ...newTemplate, content: e.target.value })} placeholder="# Data Processing Agreement..." />
                            </div>
                            <Button onClick={handleCreate} disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Creating...' : 'Save Template'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates?.map(t => (
                    <Card key={t.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-bold flex items-center">
                                <FileText className="mr-2 h-5 w-5 text-blue-500" />
                                {t.name}
                            </CardTitle>
                            <Badge variant="outline">{t.jurisdiction}</Badge>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-500 line-clamp-3 mb-4">
                                {t.content.substring(0, 150)}...
                            </p>
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <span>v{t.version}</span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setViewingTemplate(t)}
                                    >
                                        <ExternalLink className="h-3 w-3 mr-1" /> View
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingTemplate(t)}
                                    >
                                        <Edit className="h-3 w-3 mr-1" /> Edit
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => setDeleteId(t.id)}
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* View/Preview Dialog */}
            <Dialog open={!!viewingTemplate} onOpenChange={(open) => !open && setViewingTemplate(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>{viewingTemplate?.name}</span>
                            <Badge variant="outline">{viewingTemplate?.jurisdiction}</Badge>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="prose prose-sm max-w-none py-4">
                        <div className="bg-slate-50 p-6 rounded-lg border">
                            <pre className="whitespace-pre-wrap font-sans text-sm">
                                {viewingTemplate?.content}
                            </pre>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                            <p>Version: {viewingTemplate?.version} • Created: {viewingTemplate?.createdAt ? new Date(viewingTemplate.createdAt).toLocaleDateString() : 'N/A'}</p>
                            <p className="mt-2 text-blue-600">💡 This template can be selected during vendor onboarding in the "Legal" step.</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit DPA Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Template Name</label>
                            <Input
                                value={editingTemplate?.name || ""}
                                onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                placeholder="e.g. Standard EU DPA 2026"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Jurisdiction</label>
                            <Input
                                value={editingTemplate?.jurisdiction || ""}
                                onChange={e => setEditingTemplate({ ...editingTemplate, jurisdiction: e.target.value })}
                                placeholder="e.g. Global, EU, CA"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Content (Markdown/HTML)</label>
                            <Textarea
                                className="min-h-[200px]"
                                value={editingTemplate?.content || ""}
                                onChange={e => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                                placeholder="# Data Processing Agreement..."
                            />
                        </div>
                        <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
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
                            This will permanently delete this DPA template. This action cannot be undone.
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
