import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@complianceos/ui/ui/sheet";
import { Button } from "@complianceos/ui/ui/button";
import { BookOpen, Info, Link as LinkIcon, ListChecks, Lightbulb } from "lucide-react";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Separator } from "@complianceos/ui/ui/separator";

interface PageGuideProps {
    title: string;
    description: string;
    rationale?: string;
    howToUse?: {
        step: string;
        description: string;
    }[];
    integrations?: {
        name: string;
        description: string;
    }[];
}

export function PageGuide({ title, description, rationale, howToUse, integrations }: PageGuideProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 bg-background hover:bg-accent text-muted-foreground hover:text-foreground border-dashed">
                    <BookOpen className="h-4 w-4" />
                    Page Guide
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl w-full">
                <SheetHeader>
                    <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                        {title} Guide
                    </SheetTitle>
                    <SheetDescription className="text-base">
                        {description}
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-120px)] pr-4 mt-6">
                    <div className="space-y-8 pb-8">

                        {/* Rationale Section */}
                        {rationale && (
                            <section className="space-y-3">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                                    <Lightbulb className="h-5 w-5 text-amber-500" />
                                    Why This Page Exists
                                </h3>
                                <div className="bg-muted/30 p-4 rounded-lg text-sm text-muted-foreground leading-relaxed border border-border/50">
                                    {rationale}
                                </div>
                            </section>
                        )}

                        {(rationale && (howToUse || integrations)) && <Separator />}

                        {/* How to Use Section */}
                        {howToUse && howToUse.length > 0 && (
                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                                    <ListChecks className="h-5 w-5 text-blue-500" />
                                    Key Workflows
                                </h3>
                                <div className="grid gap-4">
                                    {howToUse.map((item, index) => (
                                        <div key={index} className="flex gap-4 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                                            <div className="flex-none flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs mt-0.5">
                                                {index + 1}
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-medium text-sm text-foreground">{item.step}</h4>
                                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {(howToUse && integrations) && <Separator />}

                        {/* Integrations Section */}
                        {integrations && integrations.length > 0 && (
                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                                    <LinkIcon className="h-5 w-5 text-purple-500" />
                                    Connected Features
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {integrations.map((item, index) => (
                                        <div key={index} className="flex flex-col p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                                            <span className="font-medium text-sm text-foreground flex items-center gap-2">
                                                {item.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground mt-1">
                                                {item.description}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Additional Help */}
                        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg flex items-start gap-3 text-sm text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            <Info className="h-5 w-5 flex-none mt-0.5 text-blue-600 dark:text-blue-400" />
                            <p className="font-medium">
                                This guide is always available. Click the "Page Guide" button whenever you need a refresher on how this module works.
                            </p>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
