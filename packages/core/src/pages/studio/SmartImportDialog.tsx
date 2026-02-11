import { useState, useRef, useEffect } from "react";
import { Button } from "@complianceos/ui/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@complianceos/ui/ui/dialog";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Sparkles, Loader2, FileUp, Hash, FileText, X, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useStudio, generateId } from "./StudioContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";

// ── Loading overlay with animated progress ──────────────────────────
const ExtractionOverlay = () => {
    const [dots, setDots] = useState("");
    const [step, setStep] = useState(0);

    const steps = [
        "Reading file contents",
        "Analyzing document structure",
        "Extracting requirements",
        "Building requirement list",
    ];

    useEffect(() => {
        const dotTimer = setInterval(() => {
            setDots(prev => prev.length >= 3 ? "" : prev + ".");
        }, 500);
        const stepTimer = setInterval(() => {
            setStep(prev => (prev + 1) % steps.length);
        }, 3000);
        return () => { clearInterval(dotTimer); clearInterval(stepTimer); };
    }, []);

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
            {/* Animated spinner ring */}
            <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                </div>
            </div>

            {/* Status text */}
            <p className="text-sm font-semibold text-foreground mb-1">
                Extracting Requirements{dots}
            </p>
            <p className="text-xs text-muted-foreground animate-pulse">
                {steps[step]}
            </p>

            {/* Shimmer progress bar */}
            <div className="w-48 h-1.5 mt-4 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 rounded-full"
                    style={{
                        width: '40%',
                        animation: 'shimmer 1.5s ease-in-out infinite',
                    }}
                />
            </div>

            <p className="text-[11px] text-muted-foreground/60 mt-4">
                Please wait — do not close this dialog
            </p>

            {/* Inline keyframes for shimmer */}
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(350%); }
                }
            `}</style>
        </div>
    );
};

export const SmartImportDialog = () => {
    const [text, setText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("text");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { state, dispatch } = useStudio();

    const handleSuccess = (data: { requirements: any[] }) => {
        const requirements = data.requirements.map((req: any) => ({
            id: generateId(),
            title: req.title || "REQ",
            description: req.description,
            phaseId: state.phases[0]?.id || ""
        }));

        dispatch({ type: 'BULK_ADD_REQUIREMENTS', requirements });

        toast.success("Extraction Complete", {
            icon: <ShieldCheck className="h-4 w-4" />,
            description: `Successfully extracted ${requirements.length} requirements.`,
        });

        setOpen(false);
        setText("");
        setFile(null);
    };

    const extractTextMutation = trpc.studio.extractRequirements.useMutation({
        onSuccess: handleSuccess,
        onError: (error) => {
            toast.error("AI Extraction failed", {
                description: error.message,
            });
        }
    });

    const extractFileMutation = trpc.studio.extractFromFile.useMutation({
        onSuccess: handleSuccess,
        onError: (error) => {
            toast.error("File Extraction failed", {
                description: error.message,
            });
        }
    });

    const handleProcess = async () => {
        if (activeTab === "text") {
            if (!text.trim()) return;
            extractTextMutation.mutate({ text });
        } else {
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                extractFileMutation.mutate({
                    fileData: base64,
                    fileName: file.name,
                    fileType: file.type
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const isLoading = extractTextMutation.isLoading || extractFileMutation.isLoading;

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!isLoading) setOpen(val); }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all">
                    <Sparkles className="h-4 w-4 text-primary" /> AI Smart Import
                </Button>
            </DialogTrigger>
            <DialogContent
                className="sm:max-w-[600px] relative"
                onPointerDownOutside={(e) => { if (isLoading) e.preventDefault(); }}
                onEscapeKeyDown={(e) => { if (isLoading) e.preventDefault(); }}
            >
                {/* Loading overlay */}
                {isLoading && <ExtractionOverlay />}

                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" /> AI Smart Import
                    </DialogTitle>
                    <DialogDescription>
                        Import requirements automatically using our AI. Paste text or upload a document.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => { if (!isLoading) setActiveTab(v); }} className="py-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="text" className="gap-2" disabled={isLoading}>
                            <FileText className="h-4 w-4" /> Paste Text
                        </TabsTrigger>
                        <TabsTrigger value="file" className="gap-2" disabled={isLoading}>
                            <FileUp className="h-4 w-4" /> Upload File
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="text" className="mt-4">
                        <Textarea
                            placeholder="Paste document text here (e.g., Section 5.1: Users must use strong passwords...)"
                            className="min-h-[200px] font-mono text-sm"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={isLoading}
                        />
                    </TabsContent>

                    <TabsContent value="file" className="mt-4">
                        <div
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50'} ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
                            onClick={() => !file && !isLoading && fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".pdf,.xlsx,.xls,.csv,.txt,.md"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                disabled={isLoading}
                            />

                            {file ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center gap-2 text-primary font-medium">
                                        <Hash className="h-5 w-5" />
                                        {file.name}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 ml-2"
                                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                            disabled={isLoading}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to process
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4 cursor-pointer">
                                    <div className="flex justify-center">
                                        <div className="p-4 rounded-full bg-primary/10">
                                            <FileUp className="h-8 w-8 text-primary" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">PDF, XLSX, CSV, or Text (max 10MB)</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleProcess}
                        disabled={(activeTab === 'text' ? !text.trim() : !file) || isLoading}
                        className={`gap-2 min-w-[180px] transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="animate-pulse">Extracting...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" /> Extract Requirements
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
