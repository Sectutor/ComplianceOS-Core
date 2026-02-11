
import React from "react";
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
import { Plus, Edit, FileText } from "lucide-react";
import { PageGuide } from "@/components/PageGuide";
import { Link, useLocation } from "wouter";

export default function AssessmentTemplates() {
    const { selectedClientId: clientId } = useClientContext();
    const [, setLocation] = useLocation();

    const { data: templates, isLoading } = trpc.vendorAssessments.listTemplates.useQuery(
        { clientId: clientId! },
        { enabled: !!clientId }
    );

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <PageGuide
                    title="Assessment Templates"
                    description="Create and manage questionnaires for vendor assessments."
                    rationale="Standardize your security review process with reusable, version-controlled templates."
                    howToUse={[
                        { step: "Create", description: "Build new templates from scratch or clone standards." },
                        { step: "Customize", description: "Add logic, scoring, and specific compliance questions." },
                        { step: "Deploy", description: "Use templates to launch new vendor reviews." }
                    ]}
                />
                <Button onClick={() => setLocation(`/clients/${clientId}/vendors/templates/new`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Template
                </Button>
            </div>

            {isLoading ? (
                <div className="text-center py-12">Loading templates...</div>
            ) : templates?.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Templates Found</h3>
                    <p className="text-muted-foreground">create your first assessment template to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates?.map((template) => (
                        <Card key={template.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-start justify-between">
                                    <span className="truncate">{template.name}</span>
                                </CardTitle>
                                <CardDescription>{template.description || "No description provided"}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-end gap-2">
                                    <Link href={`/clients/${clientId}/vendors/templates/${template.id}`}>
                                        <Button variant="outline" size="sm">
                                            <Edit className="h-4 w-4 mr-1" /> Edit
                                        </Button>
                                    </Link>
                                    {/* Future: Delete button */}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
