
import React, { useState } from "react";
import { trpc } from "../../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Edit2, Mail, Plus, RotateCw, Save, Info, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@complianceos/ui/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@complianceos/ui/ui/accordion";
import RichTextEditor from "../RichTextEditor";

interface EmailTemplatesTabProps {
    clientId: number;
}

export function EmailTemplatesTab({ clientId }: EmailTemplatesTabProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<any>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [formData, setFormData] = useState({
        slug: "",
        subject: "",
        content: "",
        name: ""
    });

    const { data: templates = [], isLoading: isTemplatesLoading, refetch: refetchTemplates } = trpc.emailTemplates.list.useQuery();
    const { data: triggers = [], isLoading: isTriggersLoading, refetch: refetchTriggers } = trpc.emailTriggers.list.useQuery();

    const createMutation = trpc.emailTemplates.create.useMutation({
        onSuccess: () => {
            toast.success("Template Created");
            setIsAddOpen(false);
            refetchTemplates();
        },
        onError: (err) => toast.error(err.message)
    });

    const updateMutation = trpc.emailTemplates.update.useMutation({
        onSuccess: () => {
            toast.success("Template Updated");
            setIsEditOpen(false);
            refetchTemplates();
        },
        onError: (err) => toast.error(err.message)
    });

    const assignMutation = trpc.emailTriggers.assign.useMutation({
        onSuccess: () => {
            toast.success("Trigger Assignment Updated");
            refetchTriggers();
        },
        onError: (err) => toast.error(err.message)
    });

    const deleteMutation = trpc.emailTemplates.delete.useMutation({
        onSuccess: () => {
            toast.success("Template Deleted");
            setIsDeleteOpen(false);
            setTemplateToDelete(null);
            refetchTemplates();
        },
        onError: (err) => toast.error(err.message)
    });

    const handleEdit = (template: any) => {
        setSelectedTemplate(template);
        setFormData({
            slug: template.slug,
            name: template.name,
            subject: template.subject,
            content: template.content
        });
        setIsEditOpen(true);
    };

    const handlePreview = (template: any) => {
        setSelectedTemplate(template);
        setIsPreviewOpen(true);
    };

    const handleSave = () => {
        if (!selectedTemplate) return;
        updateMutation.mutate({
            id: selectedTemplate.id,
            subject: formData.subject,
            content: formData.content,
            name: formData.name
        });
    };

    const handleCreate = () => {
        if (!formData.slug || !formData.name || !formData.subject) {
            toast.error("Please fill in all required fields");
            return;
        }
        createMutation.mutate({
            slug: formData.slug,
            name: formData.name,
            subject: formData.subject,
            content: formData.content
        });
    };

    const handleAssign = (eventSlug: string, templateId: string) => {
        assignMutation.mutate({
            eventSlug,
            templateId: templateId === "none" ? null : parseInt(templateId)
        });
    };

    const confirmDelete = (template: any) => {
        setTemplateToDelete(template);
        setIsDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!templateToDelete) return;
        deleteMutation.mutate({ id: templateToDelete.id });
    };

    if (isTemplatesLoading || isTriggersLoading) return <div className="p-8 flex justify-center"><RotateCw className="animate-spin text-gray-400" /></div>;

    return (
        <div className="space-y-6">


            <Tabs defaultValue="library" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="library">Templates Library</TabsTrigger>
                    <TabsTrigger value="assignments">Trigger Assignments</TabsTrigger>
                </TabsList>

                <TabsContent value="library">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-indigo-600" />
                                    Email Library
                                </CardTitle>
                                <CardDescription>
                                    Manage your library of reusable email templates.
                                </CardDescription>
                            </div>
                            <Button onClick={() => {
                                setFormData({ slug: "", name: "", subject: "", content: "" });
                                setIsAddOpen(true);
                            }} className="bg-indigo-600 hover:bg-indigo-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Template
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead>Template Name</TableHead>
                                            <TableHead>Slug</TableHead>
                                            <TableHead>Subject Line</TableHead>
                                            <TableHead className="w-32">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {templates.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                    No templates found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            templates.map((template: any) => (
                                                <TableRow key={template.id} className="hover:bg-slate-50 transition-colors">
                                                    <TableCell className="font-medium">{template.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="font-mono text-[10px]">
                                                            {template.slug}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-slate-600">{template.subject}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(template)} title="Edit Template">
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handlePreview(template)} title="Preview">
                                                                <Eye className="h-4 w-4 text-slate-400" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => confirmDelete(template)} title="Delete Template" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="assignments">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <RotateCw className="h-5 w-5 text-indigo-600" />
                                Trigger Assignments
                            </CardTitle>
                            <CardDescription>
                                Map system events (transactions) to specific templates from your library.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead>System Event</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="w-64">Assigned Template</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {triggers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                    No system triggers configured.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            triggers.map((trigger: any) => (
                                                <TableRow key={trigger.id}>
                                                    <TableCell className="font-semibold">
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 font-mono">
                                                            {trigger.eventSlug}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-slate-500">
                                                        {trigger.description}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={trigger.templateId?.toString() || "none"}
                                                            onValueChange={(val) => handleAssign(trigger.eventSlug, val)}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select a template" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">Disabled (No Email)</SelectItem>
                                                                {templates.map((t: any) => (
                                                                    <SelectItem key={t.id} value={t.id.toString()}>
                                                                        {t.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Add Dialog */}
            <EnhancedDialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                title="Create New Template"
                description="Create a custom email template that can be assigned to system triggers."
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                            {createMutation.isPending ? <RotateCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Create Template
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Template Name</Label>
                            <Input
                                placeholder="e.g. Custom Welcome"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Internal Slug</Label>
                            <Input
                                placeholder="e.g. custom-welcome"
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Subject Line</Label>
                        <Input
                            placeholder="e.g. Welcome to our platform!"
                            value={formData.subject}
                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Content</Label>
                        <RichTextEditor
                            minHeight="400px"
                            value={formData.content}
                            onChange={html => setFormData({ ...formData, content: html })}
                        />
                    </div>
                </div>
            </EnhancedDialog>

            {/* Edit Dialog */}
            <EnhancedDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                title={`Edit Template: ${selectedTemplate?.name}`}
                description="Modify the subject and body of this email. Placeholders will be replaced at runtime."
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                            {updateMutation.isPending ? <RotateCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Changes
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Display Name</Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Subject Line</Label>
                        <Input
                            value={formData.subject}
                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Content</Label>
                        <RichTextEditor
                            minHeight="400px"
                            value={formData.content}
                            onChange={html => setFormData({ ...formData, content: html })}
                        />
                    </div>
                </div>
            </EnhancedDialog>

            {/* Preview Dialog */}
            <EnhancedDialog
                open={isPreviewOpen}
                onOpenChange={setIsPreviewOpen}
                title="Email Preview"
                description="This is how the email will roughly appear to the recipient (rendered without CSS styles)."
            >
                <div className="py-4 border rounded-md bg-white p-6 max-h-[600px] overflow-auto">
                    <div className="mb-4 pb-4 border-b">
                        <p className="text-sm font-semibold text-slate-500">Subject:</p>
                        <p className="text-lg font-bold">{selectedTemplate?.subject}</p>
                    </div>
                    <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedTemplate?.content || "" }}
                    />
                </div>
            </EnhancedDialog>

            {/* Delete Confirmation Dialog */}
            <EnhancedDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                title="Delete Template?"
                description={`Are you sure you want to delete "${templateToDelete?.name}"? Any triggers using this template will need to be re-assigned.`}
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? <RotateCw className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Delete Permanently
                        </Button>
                    </div>
                }
            />
        </div>
    );
}
