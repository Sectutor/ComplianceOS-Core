
import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { QuestionTable, Section } from "./QuestionTable";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { PageGuide } from "@/components/PageGuide";

export default function TemplateEditor() {
    const { id, templateId } = useParams(); // id is clientId, templateId is template ID or 'new'
    const { selectedClientId } = useClientContext();
    const [, setLocation] = useLocation();

    // Ensure we have a valid clientId
    const clientId = selectedClientId || (id ? parseInt(id) : null);

    const isNew = templateId === "new";
    const numericTemplateId = !isNew && templateId ? parseInt(templateId) : null;

    const [templateData, setTemplateData] = useState({
        name: "",
        description: "",
        content: {
            sections: [
                {
                    title: "General Information",
                    questions: [
                        { id: "q1", text: "Company Name", type: "text", required: true }
                    ]
                }
            ]
        } as { sections: Section[] },
    });

    // Fetch existing template if editing
    const { data: existingTemplate, isLoading: isFetching } = trpc.vendorAssessments.getTemplate.useQuery(
        { id: numericTemplateId! },
        { enabled: !!numericTemplateId }
    );

    useEffect(() => {
        if (existingTemplate) {
            setTemplateData({
                name: existingTemplate.name,
                description: existingTemplate.description || "",
                content: typeof existingTemplate.content === 'string'
                    ? JSON.parse(existingTemplate.content)
                    : existingTemplate.content as any
            });
        }
    }, [existingTemplate]);

    const createMutation = trpc.vendorAssessments.createTemplate.useMutation({
        onSuccess: () => {
            toast.success("Template created successfully");
            setLocation(`/clients/${clientId}/vendors/templates`);
        },
        onError: (err) => toast.error(`Failed to create: ${err.message}`)
    });

    const updateMutation = trpc.vendorAssessments.updateTemplate.useMutation({
        onSuccess: () => {
            toast.success("Template updated successfully");
            setLocation(`/clients/${clientId}/vendors/templates`);
        },
        onError: (err) => toast.error(`Failed to update: ${err.message}`)
    });

    const handleSave = () => {
        if (!clientId) return;

        if (isNew) {
            createMutation.mutate({
                clientId,
                name: templateData.name,
                description: templateData.description,
                content: templateData.content,
            });
        } else {
            updateMutation.mutate({
                id: numericTemplateId!,
                name: templateData.name,
                description: templateData.description,
                content: templateData.content,
            });
        }
    };

    if (isFetching) {
        return <div className="p-8">Loading template...</div>;
    }

    return (
        <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation(`/clients/${clientId}/vendors/templates`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <PageGuide
                        title={isNew ? "Create Assessment Template" : "Edit Assessment Template"}
                        description={isNew ? "Design a new questionnaire from scratch." : `Editing "${existingTemplate?.name || '...'}"`}
                        rationale="Tailor assessments to your specific risk appetite and compliance requirements."
                        howToUse={[
                            { step: "Structure", description: "Organize questions into logical sections." },
                            { step: "Configure", description: "Set question types (Text, Yes/No, File Upload)." },
                            { step: "Save", description: "Publish the template for immediate use." }
                        ]}
                    />
                </div>
                <Button onClick={handleSave} disabled={createMutation.isLoading || updateMutation.isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isNew ? "Create Template" : "Save Changes"}
                </Button>
            </div>

            {/* Metadata Card */}
            <Card>
                <CardContent className="pt-6 grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Template Name</Label>
                        <Input
                            id="name"
                            value={templateData.name}
                            onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                            placeholder="e.g., Annual Security Review 2024"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="desc">Description</Label>
                        <Input
                            id="desc"
                            value={templateData.description}
                            onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                            placeholder="Purpose of this questionnaire..."
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Questions Editor */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Questionnaire Content</h2>
                </div>
                <div className="bg-white rounded-lg border shadow-sm p-6 min-h-[500px]">
                    <QuestionTable
                        sections={templateData.content.sections}
                        onChange={(sections) => setTemplateData({ ...templateData, content: { sections } })}
                    />
                </div>
            </div>
        </div>
    );
}
