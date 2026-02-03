import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@complianceos/ui/ui/dialog";
import { Button } from "@complianceos/ui/ui/button";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { trpc } from "@/lib/trpc";
import { FileText, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

interface ReportGeneratorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: number;
    roadmapId?: number;
}

const REPORT_SECTIONS = [
    { id: "cover_page", label: "Cover Page", required: true },
    { id: "executive_summary", label: "Executive Summary (AI-Generated)", recommended: true },
    { id: "strategic_vision", label: "Strategic Vision & Business Context" },
    { id: "risk_appetite", label: "Risk Appetite & Compliance Drivers" },
    { id: "objectives_timeline", label: "Key Objectives & Milestones Timeline" },
    { id: "implementation_plan", label: "Implementation Plan" },
    { id: "resource_allocation", label: "Resource Allocation & Budget" },
    { id: "kpis_metrics", label: "KPIs & Success Metrics" },
    { id: "governance", label: "Governance Structure" },
    { id: "appendix", label: "Appendix (Data Tables)" },
];

export default function ReportGeneratorDialog({ open, onOpenChange, clientId, roadmapId }: ReportGeneratorDialogProps) {
    const [title, setTitle] = useState("Strategic Roadmap Report");
    const [version, setVersion] = useState("draft");
    const [selectedSections, setSelectedSections] = useState<string[]>([
        "cover_page",
        "executive_summary",
        "strategic_vision",
        "objectives_timeline",
        "kpis_metrics",
    ]);
    const [dataSources, setDataSources] = useState({
        gapAnalysis: false,
        riskAssessment: true,
        controls: true,
        policies: false,
    });
    const [generationProgress, setGenerationProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState("");

    const generateMutation = trpc.reports.generateRoadmapReport.useMutation({
        onMutate: () => {
            toast.info("Starting report generation...", {
                description: "This may take a few moments",
                duration: 3000,
            });
            setGenerationProgress(10);
            setCurrentStep("Preparing data...");
        },
        onSuccess: (data) => {
            setGenerationProgress(100);
            setCurrentStep("Report generated successfully!");
            
            toast.success("Report generated successfully!", {
                description: "Your report is ready to download",
                duration: 5000,
            });
            
            // Close dialog after a short delay
            setTimeout(() => {
                onOpenChange(false);
                // Reset progress
                setGenerationProgress(0);
                setCurrentStep("");
            }, 1500);
        },
        onError: (error) => {
            setGenerationProgress(0);
            setCurrentStep("Generation failed");
            toast.error(`Failed to generate report: ${error.message}`, {
                duration: 5000,
            });
        },
    });

    const handleSectionToggle = (sectionId: string) => {
        if (sectionId === "cover_page") return; // Cover page is required

        setSelectedSections((prev) =>
            prev.includes(sectionId)
                ? prev.filter((id) => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    const handleGenerate = () => {
        generateMutation.mutate({
            clientId,
            roadmapId,
            title,
            version,
            includedSections: selectedSections as any[],
            dataSources,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Generate Roadmap Report
                    </DialogTitle>
                    <DialogDescription>
                        Configure and generate a strategic roadmap report
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Report Details */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="title">Report Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Strategic Roadmap Report"
                            />
                        </div>
                        <div>
                            <Label htmlFor="version">Version</Label>
                            <Input
                                id="version"
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                                placeholder="draft, v1.0, final"
                            />
                        </div>
                    </div>

                    {/* Section Selection */}
                    <div>
                        <Label className="text-base font-semibold mb-3 block">Report Sections</Label>
                        <div className="space-y-2 border rounded-lg p-4">
                            {REPORT_SECTIONS.map((section) => (
                                <div key={section.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={section.id}
                                        checked={selectedSections.includes(section.id)}
                                        onCheckedChange={() => handleSectionToggle(section.id)}
                                        disabled={section.required}
                                    />
                                    <label
                                        htmlFor={section.id}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                    >
                                        {section.label}
                                        {section.required && (
                                            <span className="text-xs text-muted-foreground ml-2">(Required)</span>
                                        )}
                                        {section.recommended && (
                                            <span className="text-xs text-blue-600 ml-2">(Recommended)</span>
                                        )}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Data Sources */}
                    <div>
                        <Label className="text-base font-semibold mb-3 block">Include Data Sources</Label>
                        <div className="space-y-2 border rounded-lg p-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="gap-analysis"
                                    checked={dataSources.gapAnalysis}
                                    onCheckedChange={(checked) =>
                                        setDataSources({ ...dataSources, gapAnalysis: !!checked })
                                    }
                                />
                                <label htmlFor="gap-analysis" className="text-sm font-medium cursor-pointer">
                                    Gap Analysis Results
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="risk-assessment"
                                    checked={dataSources.riskAssessment}
                                    onCheckedChange={(checked) =>
                                        setDataSources({ ...dataSources, riskAssessment: !!checked })
                                    }
                                />
                                <label htmlFor="risk-assessment" className="text-sm font-medium cursor-pointer">
                                    Risk Assessment Findings
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="controls"
                                    checked={dataSources.controls}
                                    onCheckedChange={(checked) =>
                                        setDataSources({ ...dataSources, controls: !!checked })
                                    }
                                />
                                <label htmlFor="controls" className="text-sm font-medium cursor-pointer">
                                    Control Implementation Status
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="policies"
                                    checked={dataSources.policies}
                                    onCheckedChange={(checked) =>
                                        setDataSources({ ...dataSources, policies: !!checked })
                                    }
                                />
                                <label htmlFor="policies" className="text-sm font-medium cursor-pointer">
                                    Policy Coverage Metrics
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900">
                            <strong>AI Enhancement:</strong> The Executive Summary will be generated using AI based on your
                            roadmap data and selected sources. This provides a professional, narrative overview suitable for
                            C-level executives.
                        </p>
                    </div>

                    {/* Progress Indicator */}
                    {generateMutation.isLoading && (
                        <div className="space-y-3 border rounded-lg p-4 bg-slate-50">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-700">Generating Report...</span>
                                <span className="text-sm font-bold text-emerald-600">{generationProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${generationProgress}%` }}
                                />
                            </div>
                            {currentStep && (
                                <div className="text-xs text-slate-600 flex items-center gap-2">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    {currentStep}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generateMutation.isLoading}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleGenerate} 
                        disabled={generateMutation.isLoading}
                        className={`
                            ${generateMutation.isLoading 
                                ? 'bg-emerald-600 hover:bg-emerald-700 animate-pulse shadow-lg shadow-emerald-500/30' 
                                : 'bg-emerald-600 hover:bg-emerald-700'
                            }
                            transition-all duration-300
                        `}
                    >
                        {generateMutation.isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                Generate Report
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
