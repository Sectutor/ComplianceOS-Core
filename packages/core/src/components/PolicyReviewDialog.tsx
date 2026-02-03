import { useState } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Label } from "@complianceos/ui/ui/label";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FileText, Upload, Sparkles, CheckCircle, AlertTriangle, XCircle, Loader2, ArrowRight } from "lucide-react";

interface PolicyReviewDialogProps {
    clientId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const COMPLIANCE_REQUIREMENTS = [
    { id: "SOC2", name: "SOC 2", description: "Service Organization Control 2" },
    { id: "GDPR", name: "GDPR", description: "General Data Protection Regulation (EU)" },
    { id: "ISO27001", name: "ISO 27001", description: "Information Security Management" },
    { id: "HIPAA", name: "HIPAA", description: "Health Insurance Portability and Accountability Act" },
    { id: "PCI-DSS", name: "PCI-DSS", description: "Payment Card Industry Data Security Standard" },
    { id: "NIST-CSF", name: "NIST CSF", description: "Cybersecurity Framework" },
    { id: "CCPA", name: "CCPA", description: "California Consumer Privacy Act" },
    { id: "NIS2", name: "NIS2", description: "Network and Information Security Directive (EU)" },
];

export default function PolicyReviewDialog({ clientId, open, onOpenChange }: PolicyReviewDialogProps) {
    const [step, setStep] = useState<"upload" | "requirements" | "analyzing" | "results">("upload");
    const [policyName, setPolicyName] = useState("");
    const [policyContent, setPolicyContent] = useState("");
    const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
    const [policyReviewId, setPolicyReviewId] = useState<string | null>(null);
    const [analysisResults, setAnalysisResults] = useState<any>(null);

    const createReviewMutation = trpc.policyReview.create.useMutation();
    const analyzeMutation = trpc.policyReview.analyze.useMutation();
    const applyMutation = trpc.policyReview.applyRecommendations.useMutation();

    const utils = trpc.useContext();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setPolicyContent(text);
            if (!policyName) {
                setPolicyName(file.name.replace(/\.[^/.]+$/, ""));
            }
            toast.success("Policy document loaded");
        };
        reader.readAsText(file);
    };

    const handleNext = async () => {
        if (step === "upload") {
            if (!policyName.trim() || !policyContent.trim()) {
                toast.error("Please provide policy name and content");
                return;
            }
            setStep("requirements");
        } else if (step === "requirements") {
            if (selectedRequirements.length === 0) {
                toast.error("Please select at least one compliance requirement");
                return;
            }

            // Create review
            try {
                const review = await createReviewMutation.mutateAsync({
                    clientId,
                    policyName,
                    policyContent,
                    selectedRequirements,
                });

                setPolicyReviewId(review.policyReviewId);
                setStep("analyzing");

                // Start analysis
                const results = await analyzeMutation.mutateAsync({
                    policyReviewId: review.policyReviewId,
                });

                setAnalysisResults(results);
                setStep("results");
                toast.success("Analysis complete!");
            } catch (error: any) {
                toast.error(error.message || "Failed to analyze policy");
                setStep("requirements");
            }
        }
    };

    const handleApplyChanges = async () => {
        if (!policyReviewId) return;

        try {
            const result = await applyMutation.mutateAsync({
                clientId,
                policyReviewId,
            });

            toast.success(`Improved policy created: ${result.policyName}`);
            utils.clientPolicies.list.invalidate({ clientId });

            // Reset and close
            handleReset();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to apply changes");
        }
    };

    const handleReset = () => {
        setStep("upload");
        setPolicyName("");
        setPolicyContent("");
        setSelectedRequirements([]);
        setPolicyReviewId(null);
        setAnalysisResults(null);
    };

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case "high":
                return "destructive";
            case "medium":
                return "default";
            case "low":
                return "secondary";
            default:
                return "outline";
        }
    };

    const getComplianceIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case "compliant":
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case "non-compliant":
                return <XCircle className="h-4 w-4 text-red-600" />;
            case "partial":
                return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
            default:
                return null;
        }
    };

    const renderFooter = () => (
        <>
            {step === "upload" && (
                <>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleNext} disabled={!policyName || !policyContent}>
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </>
            )}

            {step === "requirements" && (
                <>
                    <Button variant="outline" onClick={() => setStep("upload")}>
                        Back
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={selectedRequirements.length === 0 || createReviewMutation.isPending || analyzeMutation.isPending}
                    >
                        {createReviewMutation.isPending || analyzeMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Analyze Policy
                            </>
                        )}
                    </Button>
                </>
            )}

            {step === "results" && (
                <>
                    <Button variant="outline" onClick={handleReset}>
                        New Review
                    </Button>
                    <Button
                        onClick={handleApplyChanges}
                        disabled={applyMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {applyMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Applying...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Apply Changes & Create Improved Policy
                            </>
                        )}
                    </Button>
                </>
            )}
        </>
    );

    return (
        <EnhancedDialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) handleReset();
                onOpenChange(isOpen);
            }}
            title="AI-Powered Policy Review"
            description="Analyze existing policies against compliance requirements and get AI-powered improvement recommendations"
            size="lg" // Adjusted size
            className="sm:max-w-5xl"
            footer={renderFooter()}
        >
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 my-4">
                <div className={`flex items-center ${step === "upload" ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                    <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${step === "upload" ? "border-primary bg-primary text-white" : "border-muted"}`}>
                        1
                    </div>
                    <span className="ml-2">Upload</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className={`flex items-center ${step === "requirements" ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                    <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${step === "requirements" ? "border-primary bg-primary text-white" : "border-muted"}`}>
                        2
                    </div>
                    <span className="ml-2">Requirements</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className={`flex items-center ${step === "analyzing" || step === "results" ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                    <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${step === "analyzing" || step === "results" ? "border-primary bg-primary text-white" : "border-muted"}`}>
                        3
                    </div>
                    <span className="ml-2">Review</span>
                </div>
            </div>

            {/* Step 1: Upload Policy */}
            {step === "upload" && (
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="policyName">Policy Name *</Label>
                        <Input
                            id="policyName"
                            value={policyName}
                            onChange={(e) => setPolicyName(e.target.value)}
                            placeholder="e.g., Information Security Policy"
                        />
                    </div>

                    <div>
                        <Label>Policy Content *</Label>
                        <Tabs defaultValue="paste" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="paste">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Paste Text
                                </TabsTrigger>
                                <TabsTrigger value="upload">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload File
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="paste" className="mt-4">
                                <Textarea
                                    value={policyContent}
                                    onChange={(e) => setPolicyContent(e.target.value)}
                                    placeholder="Paste your policy content here..."
                                    className="min-h-[300px] font-mono text-sm"
                                />
                            </TabsContent>
                            <TabsContent value="upload" className="mt-4">
                                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Upload a policy document (.txt, .docx, .pdf)
                                    </p>
                                    <Input
                                        type="file"
                                        accept=".txt,.docx,.pdf"
                                        onChange={handleFileUpload}
                                        className="max-w-xs mx-auto"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Maximum file size: 10MB
                                    </p>
                                </div>
                                {policyContent && (
                                    <div className="mt-4 p-4 bg-muted rounded-md">
                                        <p className="text-sm font-medium">Policy loaded ({policyContent.length} characters)</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            )}

            {/* Step 2: Select Requirements */}
            {step === "requirements" && (
                <div className="space-y-4">
                    <div>
                        <Label>Select Compliance Requirements *</Label>
                        <p className="text-sm text-muted-foreground mb-4">
                            Choose the compliance frameworks to evaluate your policy against
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {COMPLIANCE_REQUIREMENTS.map((req) => (
                            <Card
                                key={req.id}
                                className={`cursor-pointer transition-all ${selectedRequirements.includes(req.id)
                                    ? "border-primary bg-primary/5"
                                    : "hover:border-primary/50"
                                    }`}
                                onClick={() => {
                                    setSelectedRequirements((prev) =>
                                        prev.includes(req.id)
                                            ? prev.filter((r) => r !== req.id)
                                            : [...prev, req.id]
                                    );
                                }}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            checked={selectedRequirements.includes(req.id)}
                                            onCheckedChange={() => { }}
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                            <h4 className="font-semibold">{req.name}</h4>
                                            <p className="text-xs text-muted-foreground">{req.description}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {selectedRequirements.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                            <span className="text-sm font-medium">Selected:</span>
                            {selectedRequirements.map((reqId) => {
                                const req = COMPLIANCE_REQUIREMENTS.find((r) => r.id === reqId);
                                return (
                                    <Badge key={reqId} variant="secondary">
                                        {req?.name}
                                    </Badge>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Analyzing */}
            {step === "analyzing" && (
                <div className="py-12 text-center space-y-4">
                    <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
                    <h3 className="text-lg font-semibold">Analyzing Policy...</h3>
                    <p className="text-muted-foreground">
                        Our AI is reviewing your policy against {selectedRequirements.length} compliance requirement(s)
                    </p>
                    <Progress value={undefined} className="w-64 mx-auto" />
                </div>
            )}

            {/* Step 4: Results */}
            {step === "results" && analysisResults && (
                <div className="space-y-6">
                    {/* Overall Score */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Overall Compliance Score</h3>
                                    <p className="text-sm text-muted-foreground">Based on selected requirements</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-primary">{analysisResults.overallScore}%</div>
                                    <Progress value={analysisResults.overallScore} className="w-32 mt-2" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs for Details */}
                    <Tabs defaultValue="gaps" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="gaps">
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Gaps ({analysisResults.gaps?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="compliance">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Compliance Status
                            </TabsTrigger>
                            <TabsTrigger value="recommendations">
                                <Sparkles className="h-4 w-4 mr-2" />
                                Recommendations ({analysisResults.recommendations?.length || 0})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="gaps" className="mt-4">
                            {analysisResults.gaps && analysisResults.gaps.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Requirement</TableHead>
                                            <TableHead>Issue</TableHead>
                                            <TableHead>Severity</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {analysisResults.gaps.map((gap: any, idx: number) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{gap.requirement}</TableCell>
                                                <TableCell>{gap.issue}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getSeverityColor(gap.severity) as any}>
                                                        {gap.severity}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">No gaps identified!</p>
                            )}
                        </TabsContent>

                        <TabsContent value="compliance" className="mt-4">
                            <div className="space-y-3">
                                {analysisResults.compliance && analysisResults.compliance.map((item: any, idx: number) => (
                                    <Card key={idx}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                {getComplianceIcon(item.status)}
                                                <div className="flex-1">
                                                    <h4 className="font-semibold">{item.requirement}</h4>
                                                    <p className="text-sm text-muted-foreground mt-1">{item.details}</p>
                                                </div>
                                                <Badge variant={item.status === "compliant" ? "default" : "outline"}>
                                                    {item.status}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="recommendations" className="mt-4">
                            <div className="space-y-4">
                                {analysisResults.recommendations && analysisResults.recommendations.map((rec: any, idx: number) => (
                                    <Card key={idx}>
                                        <CardContent className="p-4">
                                            <h4 className="font-semibold mb-2">{rec.section}</h4>
                                            <div className="grid grid-cols-2 gap-4 mt-3">
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Current</Label>
                                                    <p className="text-sm mt-1 p-2 bg-muted/50 rounded">{rec.current}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Improved</Label>
                                                    <p className="text-sm mt-1 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                                                        {rec.improved}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                <strong>Reasoning:</strong> {rec.reasoning}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </EnhancedDialog>
    );
}
