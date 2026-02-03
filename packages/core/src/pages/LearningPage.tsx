import { useParams, Redirect, Link } from "wouter";
import { Button } from "@complianceos/ui/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { ChevronRight } from "lucide-react";

import { learningContent } from "@/data/learningContent";

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

import { FrameworkLearning } from "@/data/learningContent";

function FrameworkGuide({ framework }: { framework: FrameworkLearning }) {
    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
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
                {framework.sections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <div key={section.id} className="bg-card rounded-xl border shadow-sm overflow-hidden">
                            <div className="p-6 border-b bg-muted/20 flex items-center gap-3">
                                {Icon && <Icon className="w-6 h-6 text-primary" />}
                                <h2 className="text-xl font-semibold">{section.title}</h2>
                            </div>
                            <div
                                className="p-6 prose prose-neutral max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: section.content }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function LearningPage() {
    const { frameworkId } = useParams<{ frameworkId: string }>();

    // If no ID or invalid, default to first or 404
    if (!frameworkId || !learningContent[frameworkId]) {
        // If accessing root /learning, redirect to first framework
        if (!frameworkId) return <Redirect to="/learning/iso-27001" />;
        return <Redirect to="/404" />;
    }

    const framework = learningContent[frameworkId];

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-4rem)] flex flex-col space-y-4 p-8">
                <Breadcrumb
                    items={[
                        { label: "Learning Zone", href: "/learning" },
                        { label: framework.title }
                    ]}
                />

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
                    <FrameworkGuide framework={framework} />
                </div>
            </div>
        </DashboardLayout>
    );
}
