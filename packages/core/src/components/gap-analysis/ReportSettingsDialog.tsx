
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@complianceos/ui/ui/dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Label } from "@complianceos/ui/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";

interface ReportSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assessmentId: number;
    initialData?: {
        executiveSummary?: string | null;
        introduction?: string | null;
        keyRecommendations?: string[] | null;
        scope?: string | null;
        methodology?: string | null;
        assumptions?: string | null;
        references?: string | null;
    };
    onSave?: () => void;
}

export function ReportSettingsDialog({ open, onOpenChange, assessmentId, initialData, onSave }: ReportSettingsDialogProps) {
    const [executiveSummary, setExecutiveSummary] = useState(initialData?.executiveSummary || "");
    const [introduction, setIntroduction] = useState(initialData?.introduction ||
        "This report details the findings of the Gap Analysis conducted against the standard. The objective was to assess the current implementation status of required controls and identify gaps requiring remediation.");
    const [scope, setScope] = useState(initialData?.scope || "");
    const [methodology, setMethodology] = useState(initialData?.methodology || "");
    const [assumptions, setAssumptions] = useState(initialData?.assumptions || "");
    const [references, setReferences] = useState(initialData?.references || "");

    // Recommendations stored as newline separated string for editing
    const [recommendations, setRecommendations] = useState((initialData?.keyRecommendations || []).join('\n'));

    const [generating, setGenerating] = useState(false);

    const generateMutation = trpc.gapAnalysis.generateReportContent.useMutation();
    const saveMutation = trpc.gapAnalysis.updateReportDetails.useMutation();

    useEffect(() => {
        if (open && initialData) {
            if (initialData.executiveSummary) setExecutiveSummary(initialData.executiveSummary);
            if (initialData.introduction) setIntroduction(initialData.introduction);
            if (initialData.keyRecommendations) setRecommendations(initialData.keyRecommendations.join('\n'));
            if (initialData.scope) setScope(initialData.scope);
            if (initialData.methodology) setMethodology(initialData.methodology);
            if (initialData.assumptions) setAssumptions(initialData.assumptions);
            if (initialData.references) setReferences(initialData.references);
        }
    }, [open, initialData]);

    const handleGenerate = async () => {
        try {
            setGenerating(true);
            const result = await generateMutation.mutateAsync({ assessmentId });

            if (result.executiveSummary) setExecutiveSummary(result.executiveSummary);
            if (result.keyRecommendations) setRecommendations(result.keyRecommendations.join('\n'));
            if (result.scope) setScope(result.scope);
            if (result.methodology) setMethodology(result.methodology);
            if (result.assumptions) setAssumptions(result.assumptions);
            if (result.references) setReferences(result.references);

            toast.success("AI Content Generated!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate content");
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        try {
            await saveMutation.mutateAsync({
                assessmentId,
                executiveSummary,
                introduction,
                scope,
                methodology,
                assumptions,
                references,
                keyRecommendations: recommendations.split('\n').filter(line => line.trim().length > 0)
            });
            toast.success("Report settings saved");
            onOpenChange(false);
            if (onSave) onSave();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save settings");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Report Configuration</DialogTitle>
                    <DialogDescription>
                        Customize the content for the exported Gap Analysis report.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="content" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="content">Report Content</TabsTrigger>
                        <TabsTrigger value="preview">Preview Report</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-4 mt-4">
                        <div className="bg-slate-50 p-4 rounded-lg border flex items-center justify-between">
                            <div>
                                <h4 className="font-medium flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-600" /> AI Assistance</h4>
                                <p className="text-sm text-slate-600">Auto-generate the executive summary and recommendations based on your assessment data.</p>
                            </div>
                            <Button
                                onClick={handleGenerate}
                                disabled={generating}
                                variant="secondary"
                                className="border-purple-200 text-purple-700 hover:bg-purple-50"
                            >
                                {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                Generate Content
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label>Executive Summary</Label>
                            <Textarea
                                value={executiveSummary}
                                onChange={(e) => setExecutiveSummary(e.target.value)}
                                rows={6}
                                placeholder="Enter executive summary..."
                            />
                            <p className="text-xs text-muted-foreground">High-level overview of findings.</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Introduction</Label>
                            <Textarea
                                value={introduction}
                                onChange={(e) => setIntroduction(e.target.value)}
                                rows={4}
                                placeholder="Enter report introduction..."
                            />
                            <p className="text-xs text-muted-foreground">Sets the context and scope for the report.</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Scope</Label>
                            <Textarea
                                value={scope}
                                onChange={(e) => setScope(e.target.value)}
                                rows={3}
                                placeholder="Defined ISMS boundaries (e.g. Departments, Locations)..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Methodology</Label>
                            <Textarea
                                value={methodology}
                                onChange={(e) => setMethodology(e.target.value)}
                                rows={3}
                                placeholder="Data collection methods, scale, tools..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Assumptions & Limitations</Label>
                            <Textarea
                                value={assumptions}
                                onChange={(e) => setAssumptions(e.target.value)}
                                rows={3}
                                placeholder="E.g. Based on provided evidence; excludes out-of-scope areas..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>References</Label>
                            <Textarea
                                value={references}
                                onChange={(e) => setReferences(e.target.value)}
                                rows={3}
                                placeholder="ISO 27001:2022, Internal Policies..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Key Recommendations</Label>
                            <Textarea
                                value={recommendations}
                                onChange={(e) => setRecommendations(e.target.value)}
                                rows={6}
                                placeholder="Enter recommendations (one per line)..."
                            />
                            <p className="text-xs text-muted-foreground">Strategic actions to take (one per line).</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="preview" className="mt-4">
                        <div className="bg-white border rounded-lg p-8 shadow-sm h-[600px] overflow-y-auto font-serif">
                            <h1 className="text-3xl font-bold mb-8 text-center text-slate-900">Gap Analysis Report</h1>

                        <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4 text-slate-900 border-b pb-2">1. Executive Summary</h2>
                                <div className="whitespace-pre-wrap text-slate-800 leading-relaxed text-lg">
                                    {executiveSummary || <span className="text-slate-400 italic">No executive summary provided.</span>}
                                </div>
                            </div>

                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4 text-slate-900 border-b pb-2">2. Introduction</h2>
                                <div className="whitespace-pre-wrap text-slate-800 leading-relaxed text-lg">
                                    {introduction || <span className="text-slate-400 italic">No introduction content provided.</span>}
                                </div>
                            </div>

                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4 text-slate-900 border-b pb-2">3. Scope</h2>
                                <div className="whitespace-pre-wrap text-slate-800 leading-relaxed text-lg">
                                    {scope || <span className="text-slate-400 italic">No scope provided.</span>}
                                </div>
                            </div>

                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4 text-slate-900 border-b pb-2">4. Methodology</h2>
                                <div className="whitespace-pre-wrap text-slate-800 leading-relaxed text-lg">
                                    {methodology || <span className="text-slate-400 italic">No methodology provided.</span>}
                                </div>
                            </div>

                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4 text-slate-900 border-b pb-2">5. Assumptions & Limitations</h2>
                                <div className="whitespace-pre-wrap text-slate-800 leading-relaxed text-lg">
                                    {assumptions || <span className="text-slate-400 italic">No assumptions provided.</span>}
                                </div>
                            </div>

                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4 text-slate-900 border-b pb-2">6. References</h2>
                                <div className="whitespace-pre-wrap text-slate-800 leading-relaxed text-lg">
                                    {references || <span className="text-slate-400 italic">No references provided.</span>}
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold mb-4 text-slate-900 border-b pb-2">7. Strategic Recommendations</h2>
                                {recommendations.trim() ? (
                                    <ul className="list-disc pl-5 space-y-2 text-lg text-slate-800">
                                        {recommendations.split('\n').filter(r => r.trim()).map((rec, i) => (
                                            <li key={i}>{rec}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="text-slate-400 italic">No recommendations provided.</span>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} className="gap-2">
                        <CheckCircle className="w-4 h-4" /> Save Configuration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
