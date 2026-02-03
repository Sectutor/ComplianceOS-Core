
import { cn } from "@/lib/utils";
import { FrameworkLearning } from "@/data/learningContent";
import { Button } from "@complianceos/ui/ui/button";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { ChevronRight, BookOpen } from "lucide-react";
import { useState } from "react";

interface FrameworkGuideProps {
    framework: FrameworkLearning;
}

export default function FrameworkGuide({ framework }: FrameworkGuideProps) {
    const [activeSection, setActiveSection] = useState(framework.sections[0].id);

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start h-[calc(100vh-8rem)]">
            {/* Sidebar Navigation */}
            <div className="w-full lg:w-64 shrink-0 space-y-4 lg:sticky lg:top-4">
                <Card className="border-none shadow-md bg-secondary/20">
                    <CardContent className="p-4 space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4 px-2">Contents</h3>
                        {framework.sections.map((section) => (
                            <Button
                                key={section.id}
                                variant={activeSection === section.id ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start text-sm h-auto py-2",
                                    activeSection === section.id ? "font-medium bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => scrollToSection(section.id)}
                            >
                                {activeSection === section.id && <ChevronRight className="mr-2 h-3 w-3 text-primary" />}
                                {section.title}
                            </Button>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <ScrollArea className="flex-1 h-full w-full rounded-xl">
                <div className="space-y-8 pr-6 pb-20">
                    {/* Header */}
                    <div className={cn("rounded-2xl p-8 text-white shadow-lg", framework.color)}>
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-2 mb-4 opacity-90">
                                <BookOpen className="h-5 w-5" />
                                <span className="text-sm font-medium uppercase tracking-wide">Detailed Guide</span>
                            </div>
                            <h1 className="text-4xl font-bold mb-4">{framework.title}</h1>
                            <p className="text-lg opacity-90 leading-relaxed max-w-2xl">
                                {framework.description}
                            </p>
                        </div>
                    </div>

                    {/* Sections */}
                    <div className="space-y-12 mt-8">
                        {framework.sections.map((section, index) => (
                            <section
                                key={section.id}
                                id={section.id}
                                className="scroll-mt-6"
                                onMouseEnter={() => setActiveSection(section.id)} // Auto-update nav on hover for better UX
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        {section.icon ? <section.icon className="h-6 w-6" /> : <span className="font-bold text-lg">{index + 1}</span>}
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
                                </div>

                                <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                                    <CardContent className="p-6 md:p-8">
                                        {/* Render HTML Content safely */}
                                        <div
                                            className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-primary hover:prose-a:underline prose-img:rounded-xl"
                                            dangerouslySetInnerHTML={{ __html: section.content }}
                                        />
                                    </CardContent>
                                </Card>
                            </section>
                        ))}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
