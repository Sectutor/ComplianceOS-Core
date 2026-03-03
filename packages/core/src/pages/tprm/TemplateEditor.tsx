
import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { QuestionTable, Section } from "./QuestionTable";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { PageGuide } from "@/components/PageGuide";

// Built-in template IDs from questionnaire router
// NOTE: These must match the built-in template IDs returned by trpc.questionnaire.listTemplates
// TODO: Fetch built-in templates dynamically from server using trpc.questionnaire.listTemplates
//       to avoid maintaining duplicate lists in frontend and backend
const BUILT_IN_TEMPLATES = ['sig-lite', 'caiq-v4', 'iso27001-baseline', 'nist-csf', 'soc2-type2', 'pentest-scope', 'gdpr-readiness', 'hipaa-security'];

export default function TemplateEditor() {
    const { id, templateId } = useParams(); // id is clientId, templateId is template ID or 'new'
    const { selectedClientId } = useClientContext();
    const [, setLocation] = useLocation();

    // Ensure we have a valid clientId
    const clientId = selectedClientId || (id ? parseInt(id) : null);

    const isNew = templateId === "new";
    const isBuiltIn = !isNew && templateId && BUILT_IN_TEMPLATES.includes(templateId);
    const numericTemplateId = !isNew && !isBuiltIn && templateId ? parseInt(templateId) : null;

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

    // Fetch existing template if editing (custom templates)
    const { data: existingTemplate, isLoading: isFetchingCustom } = trpc.vendors.getTemplate.useQuery(
        { id: numericTemplateId! },
        { enabled: !!numericTemplateId }
    );

    // Fetch built-in template questions if editing a built-in template
    const { data: builtInQuestions, isLoading: isFetchingBuiltIn } = trpc.questionnaire.getTemplateQuestions.useQuery(
        { templateId: templateId! },
        { enabled: isBuiltIn }
    );

    const isFetching = isFetchingCustom || isFetchingBuiltIn;

    // Load template data - either from custom template or built-in
    useEffect(() => {
        if (isBuiltIn && builtInQuestions && builtInQuestions.length > 0) {
            // Convert built-in questions to sections format
            const sections: Section[] = [];
            const categoryMap = new Map<string, typeof builtInQuestions>();

            builtInQuestions.forEach(q => {
                const cat = q.category || 'General';
                if (!categoryMap.has(cat)) {
                    categoryMap.set(cat, []);
                }
                categoryMap.get(cat)!.push(q);
            });

            categoryMap.forEach((questions, category) => {
                sections.push({
                    title: category,
                    questions: questions.map((q, idx) => ({
                        id: q.questionId || `q${idx + 1}`,
                        text: q.question,
                        type: 'text' as const,
                        required: false
                    }))
                });
            });

            setTemplateData({
                name: builtInQuestions[0]?.questionId?.split('-')[0] ?
                    `${builtInQuestions[0].questionId.split('-')[0]} Assessment Template` :
                    'Compliance Assessment Template',
                description: `Built-in template with ${builtInQuestions.length} questions`,
                content: { sections }
            });
        } else if (existingTemplate) {
            setTemplateData({
                name: existingTemplate.name,
                description: existingTemplate.description || "",
                content: typeof existingTemplate.content === 'string'
                    ? JSON.parse(existingTemplate.content)
                    : existingTemplate.content as any
            });
        }
    }, [existingTemplate, builtInQuestions, isBuiltIn]);

    const createMutation = trpc.vendors.createTemplate.useMutation({
        onSuccess: () => {
            toast.success("Template created successfully");
            setLocation(`/clients/${clientId}/vendors/templates`);
        },
        onError: (err) => toast.error(`Failed to create: ${err.message}`)
    });

    const updateMutation = trpc.vendors.updateTemplate.useMutation({
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
                        title={isNew ? "Create Assessment Template" : isBuiltIn ? "View Assessment Template" : "Edit Assessment Template"}
                        description={isNew ? "Design a new questionnaire from scratch." : isBuiltIn ? `Built-in template - ${builtInQuestions?.length || 0} questions` : `Editing "${existingTemplate?.name || '...'}"`}
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

