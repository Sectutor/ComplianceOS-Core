import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@complianceos/ui/ui/sheet";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { BookOpen, Info, Link as LinkIcon, ListChecks, Lightbulb, CheckCircle2, Target, GraduationCap, ClipboardCheck, Shield, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Separator } from "@complianceos/ui/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { cn } from "@/lib/utils";
import React, { useState, useRef, useCallback } from "react";

interface PageGuideProps {
    title: string;
    description: string;
    rationale?: string;
    moduleId?: string; // Unique ID for training tracking
    isTrainingRequirement?: boolean;
    howToUse?: {
        step: string;
        description: string;
        targetId?: string; // HTML ID of the element to highlight
    }[];
    scenarios?: {
        title: string;
        example: string;
        auditTip: string;
    }[];
    resources?: {
        name: string;
        description: string;
        href: string;
    }[];
    integrations?: {
        name: string;
        description: string;
    }[];
}

export function PageGuide({
    title,
    description,
    rationale,
    howToUse,
    integrations,
    moduleId,
    isTrainingRequirement = false,
    scenarios,
    resources
}: PageGuideProps) {
    const { id: clientIdParam } = useParams();
    const parsedClientId = parseInt(clientIdParam || "0", 10);
    const clientId = isNaN(parsedClientId) ? 0 : parsedClientId;
    const [isCompleted, setIsCompleted] = useState(false);

    // Use ref to track highlight timeout to prevent race conditions
    const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Check if training backend is available - trpc.training.complete may not exist
    // Intentionally checking for function existence as training router may not be configured
    // @ts-ignore - training.complete may not be defined in all configurations
    const hasTrainingBackend = typeof trpc.training?.complete?.useMutation === 'function';

    // Mutation for marking training as complete
    const completeTrainingMutation = hasTrainingBackend
        // @ts-ignore - training.complete may not be defined in all configurations
        ? trpc.training.complete.useMutation({
            onSuccess: () => {
                setIsCompleted(true);
                toast.success("Training completion recorded as audit evidence.");
            },
            onError: (err: Error) => {
                toast.error("Failed to record training: " + err.message);
            }
        })
        : null;

    const handleCompleteTraining = () => {
        if (completeTrainingMutation) {
            completeTrainingMutation.mutate({ clientId, moduleId: moduleId || title });
        } else {
            // Training backend not available - show informative message
            toast.warning("Training recording is not available in this environment. This is a demo UI.", {
                description: "Contact your administrator to enable training tracking."
            });
        }
    };

    const handleHighlight = useCallback((targetId: string) => {
        // Validate ID format to prevent selecting unintended elements
        if (!targetId || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(targetId)) {
            console.warn(`[PageGuide] Invalid target ID format: "${targetId}"`);
            toast.error("Invalid target specified.");
            return;
        }

        const element = document.getElementById(targetId);
        if (element) {
            // Clear any existing highlight timeout to prevent race conditions
            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current);
            }

            // Close other UI elements if possible or just focus
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Ensure the element is visible ABOVE the sheet overlay
            // Sheet z-index is 50, so 100 will pop it through
            const originalZIndex = element.style.zIndex;
            const originalPosition = element.style.position;

            element.style.zIndex = "100";
            if (!originalPosition || originalPosition === 'static') {
                element.style.position = 'relative';
            }

            // Add a temporary highlight class
            element.classList.add('animate-pulse-highlight');

            toast.info("Target located. Highlighting now...", {
                icon: <Target className="h-4 w-4 text-primary" />,
                duration: 2000
            });

            highlightTimeoutRef.current = setTimeout(() => {
                element.classList.remove('animate-pulse-highlight');
                element.style.zIndex = originalZIndex;
                element.style.position = originalPosition;
                highlightTimeoutRef.current = null;
            }, 4000);
        } else {
            console.warn(`[PageGuide] Target ID "${targetId}" not found in current DOM.`);
            toast.error("Target element not found on this view.", {
                description: "The element might be collapsed or missing from this version of the page."
            });
        }
    }, []);

    return (
        <Sheet modal={false}>
            <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 bg-background hover:bg-accent text-muted-foreground hover:text-foreground border-dashed">
                    <BookOpen className="h-4 w-4" />
                    Page Guide
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col">
                <div className="p-6 border-b">
                    <SheetHeader>
                        <div className="flex items-center justify-between gap-4">
                            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                                <BookOpen className="h-6 w-6 text-blue-600" />
                                {title}
                            </SheetTitle>
                            {isTrainingRequirement && (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">
                                    Training Req.
                                </Badge>
                            )}
                        </div>
                        <SheetDescription className="text-base text-slate-500 font-medium">
                            {description}
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 border-b bg-slate-50/50">
                        <TabsList className="bg-transparent h-12 w-full justify-start gap-8 border-none">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#5844ED] data-[state=active]:text-[#5844ED] text-slate-500/80 rounded-none px-0 font-bold transition-all h-full">Overview</TabsTrigger>
                            <TabsTrigger value="steps" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#5844ED] data-[state=active]:text-[#5844ED] text-slate-500/80 rounded-none px-0 font-bold transition-all h-full">How-To</TabsTrigger>
                            <TabsTrigger value="scenarios" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#5844ED] data-[state=active]:text-[#5844ED] text-slate-500/80 rounded-none px-0 font-bold transition-all h-full">Scenarios</TabsTrigger>
                            <TabsTrigger value="training" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#5844ED] data-[state=active]:text-[#5844ED] text-slate-500/80 rounded-none px-0 font-bold transition-all h-full flex items-center gap-1.5">
                                <GraduationCap className="w-4 h-4" /> Training
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1">
                        <TabsContent value="overview" className="p-6 m-0 space-y-8">
                            {/* Rationale Section */}
                            {rationale && (
                                <section className="space-y-4">
                                    <h3 className="text-lg font-black flex items-center gap-2 text-slate-800">
                                        <Lightbulb className="h-5 w-5 text-amber-500" />
                                        Contextual Purpose
                                    </h3>
                                    <div className="bg-slate-50 p-6 rounded-3xl text-sm text-slate-600 leading-relaxed border border-slate-100 shadow-sm italic">
                                        "{rationale}"
                                    </div>
                                </section>
                            )}

                            {/* Integrations Section */}
                            {integrations && integrations.length > 0 && (
                                <section className="space-y-4">
                                    <h3 className="text-lg font-black flex items-center gap-2 text-slate-800">
                                        <LinkIcon className="h-5 w-5 text-violet-500" />
                                        Data Connections
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {integrations.map((item, index) => (
                                            <div key={index} className="flex flex-col p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                                <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                                    {item.name}
                                                </span>
                                                <span className="text-xs text-slate-500 mt-1">
                                                    {item.description}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </TabsContent>

                        <TabsContent value="steps" className="p-6 m-0 space-y-6">
                            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex gap-3 text-sm text-blue-800">
                                <Target className="w-5 h-5 flex-shrink-0 text-blue-600" />
                                <p className="font-medium">Click "Show Me" to visually locate actions on the actual page.</p>
                            </div>

                            {/* How to Use Section */}
                            {howToUse && howToUse.length > 0 && (
                                <div className="grid gap-3">
                                    {howToUse.map((item, index) => (
                                        <div key={index} className="flex gap-4 p-4 rounded-3xl border border-slate-100 bg-white hover:border-primary/20 transition-all shadow-sm group">
                                            <div className="flex-none flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-black text-xs">
                                                {index + 1}
                                            </div>
                                            <div className="space-y-1 flex-1">
                                                <h4 className="font-bold text-sm text-slate-800">{item.step}</h4>
                                                <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                                            </div>
                                            {item.targetId && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-[10px] font-black uppercase tracking-tighter text-primary hover:bg-primary/10 rounded-full"
                                                    onClick={() => handleHighlight(item.targetId!)}
                                                >
                                                    Show Me
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="scenarios" className="p-6 m-0 space-y-6">
                            {scenarios && scenarios.length > 0 ? (
                                <div className="space-y-4">
                                    {scenarios.map((scenario, index) => (
                                        <Card key={index} className="border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                                            <div className="bg-slate-50 p-4 border-b">
                                                <h4 className="font-bold text-slate-900 flex items-center gap-2 truncate">
                                                    <BookOpen className="w-4 h-4 text-blue-600" />
                                                    {scenario.title}
                                                </h4>
                                            </div>
                                            <CardContent className="p-5 space-y-4">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Typical Scenario</span>
                                                    <p className="text-sm text-slate-600 italic">"{scenario.example}"</p>
                                                </div>
                                                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex gap-3">
                                                    <ClipboardCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                                    <p className="text-xs text-emerald-800 font-medium">
                                                        <span className="font-black">Auditor's Tip:</span> {scenario.auditTip}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-sm text-slate-400 font-medium italic">No specific scenarios defined for this page.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="training" className="p-6 m-0 space-y-8">
                            <div className="text-center space-y-4 py-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                <div className="w-16 h-16 rounded-full bg-white shadow-xl mx-auto flex items-center justify-center">
                                    <GraduationCap className="w-8 h-8 text-blue-600" />
                                </div>
                                <div className="max-w-xs mx-auto space-y-2">
                                    <h4 className="font-black text-slate-900 text-lg">Self-Service Certification</h4>
                                    <p className="text-sm text-slate-500 font-medium leading-normal">
                                        By clicking the certificate button below, you acknowledge that you have read and understood the operating procedures for this module.
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <Button
                                        className={cn(
                                            "rounded-full px-8 py-6 font-black text-sm uppercase tracking-widest transition-all",
                                            isCompleted ? "bg-emerald-500 hover:bg-emerald-600" : "bg-primary hover:bg-primary/90"
                                        )}
                                        onClick={handleCompleteTraining}
                                        disabled={isCompleted}
                                    >
                                        {isCompleted ? (
                                            <>
                                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                                Certified ✅
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="w-5 h-5 mr-2" />
                                                Record My Training
                                            </>
                                        )}
                                    </Button>
                                    {isCompleted && (
                                        <p className="text-[10px] text-emerald-600 font-bold mt-4 uppercase tracking-tighter">
                                            Evidence logged to Personnel Hub on {new Date().toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Resource Section shifted here */}
                            {resources && resources.length > 0 && (
                                <section className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                                        Reference Material
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {resources.map((item, index) => (
                                            <a
                                                key={index}
                                                href={item.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-primary/30 group transition-all"
                                            >
                                                <div className="space-y-1">
                                                    <span className="font-bold text-sm text-slate-800">{item.name}</span>
                                                    <p className="text-[10px] text-slate-500">{item.description}</p>
                                                </div>
                                                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                                            </a>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </TabsContent>
                    </ScrollArea>
                </Tabs>

                <div className="p-6 border-t bg-slate-50/50">
                    <div className="flex items-start gap-4 text-xs">
                        <div className="p-2 bg-blue-100 rounded-full">
                            <Info className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            <span className="font-black text-slate-900 block mb-0.5">Need more help?</span>
                            This guide is built dynamically to support audit-ready operations. If steps are unclear, please notify your compliance officer.
                        </p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
