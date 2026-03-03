import { useState, useEffect } from "react";
import { useParams, Redirect, Link } from "wouter";
import { Button } from "@complianceos/ui/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { ChevronRight, Edit2, Save, X, Shield, Lock, FileText, Database, Activity, Globe, Server, UserCheck } from "lucide-react";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Input } from "@complianceos/ui/ui/input";
import { learningContent, FrameworkLearning, LearningSection } from "@/data/learningContent";
import { toast } from "sonner";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

// Map icon names to components
const iconMap: Record<string, any> = {
    Shield,
    Lock,
    FileText,
    Database,
    Activity,
    Globe,
    Server,
    UserCheck,
};

function Breadcrumb({ items }: { items: { label: string, href?: string }[] }) {
    return (
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            {items.map((item, index) => (
                <div key={index} className="flex items-center">
                    {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
                    {item.href ? (
                        <Link href={item.href} className="hover:text-foreground transition-colors">
                            {item.label}
                        </Link>
                    ) : (
                        <span className="font-medium text-foreground">{item.label}</span>
                    )}
                </div>
            ))}
        </nav>
    );
}

interface EditableSectionProps {
    section: LearningSection;
    onUpdate: (sectionId: string, title: string, content: string) => void;
}

function EditableSection({ section, onUpdate }: EditableSectionProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(section.title);
    const [editContent, setEditContent] = useState(section.content);

    const handleSave = () => {
        onUpdate(section.id, editTitle, editContent);
        setIsEditing(false);
        toast.success("Section updated successfully!");
    };

    const handleCancel = () => {
        setEditTitle(section.title);
        setEditContent(section.content);
        setIsEditing(false);
    };

    const Icon = section.icon ? iconMap[section.icon as string] : null;

    // Quill editor modules configuration
    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link', 'image'],
            ['clean']
        ],
    };

    return (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-muted/20 flex items-center gap-3">
                {Icon && <Icon className="w-6 h-6 text-primary" />}
                {isEditing ? (
                    <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="font-semibold text-xl"
                    />
                ) : (
                    <h2 className="text-xl font-semibold">{section.title}</h2>
                )}
                {!isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="ml-auto">
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                    </Button>
                )}
            </div>
            {isEditing ? (
                <div className="p-6 space-y-4">
                    <div className="rich-text-editor">
                        <ReactQuill
                            theme="snow"
                            value={editContent}
                            onChange={setEditContent}
                            modules={quillModules}
                            className="h-[300px] mb-12"
                        />
                    </div>
                    <div className="flex gap-2 justify-end pt-4">
                        <Button variant="outline" onClick={handleCancel}>
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            <Save className="h-4 w-4 mr-1" />
                            Save
                        </Button>
                    </div>

                </div>
            ) : (
                <div
                    className="p-6 prose prose-neutral max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                />
            )}
        </div>
    );
}

interface FrameworkGuideProps {
    framework: FrameworkLearning;
    onUpdateSection: (sectionId: string, title: string, content: string) => void;
}

function FrameworkGuide({ framework, onUpdateSection }: FrameworkGuideProps) {
    return (
        <div className="p-6 space-y-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-12 rounded-full ${framework.color}`} />
                    <h1 className="text-3xl font-bold">{framework.title} Guide</h1>
                </div>
                <p className="text-xl text-muted-foreground leading-relaxed">
                    {framework.description}
                </p>
            </div>

            <div className="grid gap-8">
                {framework.sections.map((section: LearningSection) => (
                    <EditableSection
                        key={section.id}
                        section={section}
                        onUpdate={onUpdateSection}
                    />
                ))}
            </div>
        </div>
    );
}

export default function LearningPage() {
    const { frameworkId } = useParams<{ frameworkId: string }>();

    // Local state to hold editable content
    const [content, setContent] = useState(learningContent);

    // If no ID or invalid, default to first or 404
    if (!frameworkId || !content[frameworkId as keyof typeof content]) {
        // If accessing root /learning, redirect to first framework
        if (!frameworkId) return <Redirect to="/learning/iso-27001" />;
        return <Redirect to="/404" />;
    }

    const framework = content[frameworkId as keyof typeof content];

    const handleUpdateSection = (sectionId: string, title: string, newContent: string) => {
        setContent((prev: any) => ({
            ...prev,
            [frameworkId]: {
                ...prev[frameworkId],
                sections: prev[frameworkId].sections.map((s: LearningSection) =>
                    s.id === sectionId
                        ? { ...s, title, content: newContent }
                        : s
                )
            }
        }));
    };

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-4rem)] flex flex-col space-y-4 p-8">
                <div className="flex items-center justify-between">
                    <Breadcrumb
                        items={[
                            { label: "Learning Zone", href: "/learning" },
                            { label: framework.title }
                        ]}
                    />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 px-3 py-1 rounded-full">
                        <Edit2 className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-700">Editor Mode Active</span>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    {frameworkId === 'iso-27001' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 flex items-center justify-between shadow-sm">
                            <div>
                                <h3 className="font-semibold text-blue-900 text-lg">Get Audit Ready</h3>
                                <p className="text-blue-700 mt-1">Use our professional checklist to track your readiness steps.</p>
                            </div>
                            <Link href="/learning/iso-27001/checklist">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">View Checklist</Button>
                            </Link>
                        </div>
                    )}
                    {frameworkId === 'cmmc' && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-8 flex items-center justify-between shadow-sm">
                            <div>
                                <h3 className="font-semibold text-indigo-900 text-lg">Compliance Readiness</h3>
                                <p className="text-indigo-700 mt-1">View the official CMMC 2.0 articles and track your compliance obligations.</p>
                            </div>
                            <Link href="/compliance-obligations/cmmc">
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">View Obligations</Button>
                            </Link>
                        </div>
                    )}

                    <FrameworkGuide
                        framework={framework}
                        onUpdateSection={handleUpdateSection}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}

