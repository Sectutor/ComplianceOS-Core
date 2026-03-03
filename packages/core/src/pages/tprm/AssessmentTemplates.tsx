
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { Button } from "@complianceos/ui/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@complianceos/ui/ui/card";
import { Plus, FileText, Copy, Trash2 } from "lucide-react";
import { PageGuide } from "@/components/PageGuide";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@complianceos/ui/ui/alert-dialog";

interface Questionnaire {
    id: number;
    name: string;
    senderName?: string;
    productName?: string;
    status?: string;
    progress?: number;
}

export default function AssessmentTemplates() {
    const { selectedClientId: clientId } = useClientContext();
    const [, setLocation] = useLocation();
    const [templateToDelete, setTemplateToDelete] = useState<any>(null);

    // Fetch questionnaires that can be used as templates
    const { data: questionnaires, isLoading: isQuestionnaireLoading, refetch } = trpc.questionnaire.list.useQuery(
        { clientId: clientId! },
        { enabled: !!clientId }
    );

    // Delete mutation
    const deleteMutation = trpc.questionnaire.delete.useMutation({
        onSuccess: () => {
            toast.success("Template deleted successfully");
            setTemplateToDelete(null);
            refetch();
        },
        onError: (err: { message: string }) => {
            toast.error(`Failed to delete: ${err.message}`);
        }
    });

    const handleDelete = (template: any) => {
        setTemplateToDelete(template);
    };

    const confirmDelete = () => {
        if (templateToDelete) {
            deleteMutation.mutate({ id: templateToDelete.id });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <PageGuide
                    title="Assessment Templates"
                    description="Create and manage questionnaires for vendor assessments."
                    rationale="Standardize your security review process with reusable, version-controlled templates."
                    howToUse={[
                        { step: "Create", description: "Build new templates from scratch or clone existing questionnaires." },
                        { step: "Customize", description: "Add logic, scoring, and specific compliance questions." },
                        { step: "Deploy", description: "Use templates to launch new vendor reviews." }
                    ]}
                />
                <Button onClick={() => setLocation(`/clients/${clientId}/vendors/templates/new`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Template
                </Button>
            </div>

            {isQuestionnaireLoading ? (
                <div className="text-center py-12">Loading templates...</div>
            ) : questionnaires && questionnaires.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Templates Found</h3>
                    <p className="text-muted-foreground">Create your first questionnaire to use as a template.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {questionnaires?.map((template) => (
                        <Card key={template.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-start justify-between">
                                    <span className="truncate">{template.name}</span>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {template.progress || 0}%
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    {template.senderName ? `From: ${template.senderName}` : template.productName || 'No description'}
                                </CardDescription>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {template.status || 'open'}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDelete(template as Questionnaire)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                                    </Button>
                                    <Link href={`/clients/${clientId}/vendors/templates/${template.id}`}>
                                        <Button variant="outline" size="sm">
                                            <Copy className="h-4 w-4 mr-1" /> Use as Template
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-500 hover:bg-red-600 text-white"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
