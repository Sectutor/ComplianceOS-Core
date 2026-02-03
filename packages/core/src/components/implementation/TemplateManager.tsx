
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@complianceos/ui/ui/card';
import { Button } from '@complianceos/ui/ui/button';
import { Badge } from '@complianceos/ui/ui/badge';
import { Input } from '@complianceos/ui/ui/input';
import { Textarea } from '@complianceos/ui/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@complianceos/ui/ui/dialog';
import { trpc } from '@/lib/trpc';
import { useClientContext } from '@/contexts/ClientContext';
import { Plus, LayoutTemplate, Copy, Trash2, Shield, Clock, Search, Pencil } from 'lucide-react';
import { toast } from 'sonner';

export default function TemplateManager() {
    const { selectedClientId } = useClientContext();
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        tasksText: ''
    });

    const utils = trpc.useContext();
    const { data: templates, isLoading } = trpc.implementation.listTemplates.useQuery({
        clientId: selectedClientId || 0
    }, { enabled: !!selectedClientId });

    const createMutation = trpc.implementation.createTemplate.useMutation({
        onSuccess: () => {
            toast.success("Template created successfully");
            setCreateOpen(false);
            setFormData({ title: '', description: '', tasksText: '' });
            utils.implementation.listTemplates.invalidate();
        },
        onError: (err) => toast.error(`Failed to create: ${err.message}`)
    });

    const updateMutation = trpc.implementation.updateTemplate.useMutation({
        onSuccess: () => {
            toast.success("Template updated successfully");
            setEditOpen(false);
            setEditingId(null);
            setFormData({ title: '', description: '', tasksText: '' });
            utils.implementation.listTemplates.invalidate();
        },
        onError: (err) => toast.error(`Failed to update: ${err.message}`)
    });

    const cloneMutation = trpc.implementation.cloneTemplate.useMutation({
        onSuccess: () => {
            toast.success("Template cloned successfully");
            utils.implementation.listTemplates.invalidate();
        },
        onError: (err) => toast.error(`Failed to clone: ${err.message}`)
    });

    const deleteMutation = trpc.implementation.deleteTemplate.useMutation({
        onSuccess: () => {
            toast.success("Template deleted");
            utils.implementation.listTemplates.invalidate();
        }
    });

    const handleCreate = () => {
        const tasks = formData.tasksText.split('\n').filter(t => t.trim()).map(t => ({
            title: t,
            priority: 'medium'
        }));

        createMutation.mutate({
            clientId: selectedClientId || 0,
            title: formData.title,
            description: formData.description,
            tasks: tasks,
            isSystem: false
        });
    };

    const handleUpdate = () => {
        if (!editingId) return;
        const tasks = formData.tasksText.split('\n').filter(t => t.trim()).map(t => ({
            title: t,
            priority: 'medium'
        }));

        updateMutation.mutate({
            templateId: editingId,
            title: formData.title,
            description: formData.description,
            tasks: tasks
        });
    };

    const openEdit = (template: any) => {
        if (template.isSystem) {
            toast.info("System templates cannot be edited. Clone it first!");
            return;
        }
        setEditingId(template.id);
        setFormData({
            title: template.title,
            description: template.description || '',
            tasksText: (template.tasks as any[]).map((t: any) => t.title).join('\n')
        });
        setEditOpen(true);
    };

    const handleClone = (id: number) => {
        if (!selectedClientId) return;
        cloneMutation.mutate({
            templateId: id,
            clientId: selectedClientId
        });
    };

    return (
        <DashboardLayout>
            <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Template Manager</h1>
                        <p className="text-slate-500 mt-2">
                            Standardize your implementation workflows with reusable templates.
                        </p>
                    </div>
                    <Button onClick={() => setCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                        <Plus className="w-4 h-4 mr-2" />
                        New Template
                    </Button>
                </div>

                {isLoading && <div className="text-center py-12">Loading templates...</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates?.map((template: any) => (
                        <Card key={template.id} className="group hover:shadow-md transition-all border-slate-200 flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className={`p-2 rounded-lg mb-4 inline-block ${template.isSystem ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-600'}`}>
                                        <LayoutTemplate className="w-6 h-6" />
                                    </div>
                                    {template.isSystem && (
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                                            <Shield className="w-3 h-3 mr-1" /> System
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-xl flex items-center justify-between">
                                    {template.title}
                                    {!template.isSystem && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={() => openEdit(template)}>
                                            <Pencil className="w-4 h-4 text-slate-400 hover:text-blue-600" />
                                        </Button>
                                    )}
                                </CardTitle>
                                <CardDescription className="line-clamp-2 h-10">
                                    {template.description || "No description provided."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="space-y-4">
                                    <div className="flex items-center text-sm text-slate-500">
                                        <Clock className="w-4 h-4 mr-2" />
                                        <span>{template.estimatedHours ? `${template.estimatedHours}h estimated` : 'Variable duration'}</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600">
                                        <strong>Key Tasks:</strong>
                                        <ul className="mt-1 list-disc list-inside space-y-1">
                                            {(template.tasks as any[]).slice(0, 3).map((t: any, i: number) => (
                                                <li key={i} className="truncate">{t.title}</li>
                                            ))}
                                            {(template.tasks as any[]).length > 3 && (
                                                <li className="text-slate-400 italic">... +{(template.tasks as any[]).length - 3} more</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2 border-t border-slate-50 flex justify-between mt-auto">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-500"
                                    onClick={() => handleClone(template.id)}
                                    disabled={cloneMutation.isPending}
                                >
                                    <Copy className="w-4 h-4 mr-2" />
                                    {cloneMutation.isPending ? 'Cloning...' : 'Clone'}
                                </Button>
                                {!template.isSystem && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => {
                                            if (confirm("Are you sure you want to delete this template?")) {
                                                deleteMutation.mutate({ templateId: template.id });
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {/* CREATE DIALOG */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Template</DialogTitle>
                            <DialogDescription>Define a standard set of tasks for future projects.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Template Name</label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                    placeholder="e.g. ISO 27001 Foundation"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Description</label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                    placeholder="What is this template for?"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Tasks (One per line)</label>
                                <Textarea
                                    className="h-32 font-mono text-sm"
                                    value={formData.tasksText}
                                    onChange={(e) => setFormData(p => ({ ...p, tasksText: e.target.value }))}
                                    placeholder="Draft Policy&#10;Review with Stakeholders&#10;Publish to Portal"
                                />
                                <p className="text-xs text-slate-400 mt-1">Simple editor: Enter each task title on a new line.</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={!formData.title || createMutation.isPending}>
                                {createMutation.isPending ? "Creating..." : "Create Template"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* EDIT DIALOG */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Template</DialogTitle>
                            <DialogDescription>Modify your custom template.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Template Name</label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Description</label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Tasks (One per line)</label>
                                <Textarea
                                    className="h-32 font-mono text-sm"
                                    value={formData.tasksText}
                                    onChange={(e) => setFormData(p => ({ ...p, tasksText: e.target.value }))}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
