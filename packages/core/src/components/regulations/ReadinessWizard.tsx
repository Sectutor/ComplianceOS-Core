import { useState, useEffect } from "react";
import { WizardQuestion } from "@/data/regulations/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Button } from "@complianceos/ui/ui/button";
import { RadioGroup, RadioGroupItem } from "@complianceos/ui/ui/radio-group";
import { Label } from "@complianceos/ui/ui/label";
import { Check, ChevronRight, RotateCcw, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ReadinessWizardProps {
    questions: WizardQuestion[];
    onComplete: (answers: Record<string, string>) => void;
    regulationId: string;
    clientId?: number; // make optional for now, default to 1
}

export function ReadinessWizard({ questions, onComplete, regulationId, clientId = 1 }: ReadinessWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isCompleted, setIsCompleted] = useState(false);

    // Fetch existing answers
    const { data: savedAnswers, isLoading } = trpc.regulations.getReadinessResponses.useQuery({
        clientId,
        regulationId
    });

    // Save mutation
    const saveMutation = trpc.regulations.saveReadinessResponse.useMutation({
        onError: (err) => toast.error("Failed to save progress: " + err.message)
    });

    // Load saved answers on mount
    useEffect(() => {
        if (savedAnswers) {
            setAnswers(savedAnswers);
            // Optionally: could fast-forward to first unanswered question logic here
        }
    }, [savedAnswers]);

    const currentQuestion = questions[currentStep];

    const handleAnswer = (value: string) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));

        // Auto-save
        saveMutation.mutate({
            clientId,
            regulationId,
            questionId: currentQuestion.id,
            response: value
        });
    };

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setIsCompleted(true);
            onComplete(answers);
        }
    };

    const handleReset = () => {
        setCurrentStep(0);
        // We don't clear answers from DB on simple reset, just UI flow, unless requested
        setIsCompleted(false);
    };

    // Download mutation
    const downloadMutation = trpc.regulations.downloadReadinessReport.useMutation({
        onSuccess: (data) => {
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${data.pdfBase64}`;
            link.download = data.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Report downloaded successfully");
        },
        onError: (err) => toast.error("Failed to download report: " + err.message)
    });

    const handleDownload = () => {
        downloadMutation.mutate({
            clientId,
            regulationId
        });
    };

    if (isLoading) return <div className="p-8 text-center">Loading assessment data...</div>;

    if (isCompleted) {
        // Calculate gaps for recommendations
        const gaps = questions.filter(q => {
            const ans = answers[q.id];
            if (!ans) return true; // Unanswered treated as gap
            if (q.type === 'boolean' && ans === 'no') return true;
            // Add scale logic if needed later
            return false;
        });

        return (
            <Card className="max-w-xl mx-auto mt-8 border-dashed border-2">
                <CardContent className="pt-6 pb-6 text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                        <Check className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Assessment Complete</h3>
                    <p className="text-muted-foreground mb-6">You have answered all {questions.length} questions.</p>

                    {gaps.length > 0 && (
                        <div className="text-left bg-orange-50 rounded-lg mb-6 border border-orange-100 overflow-hidden">
                            <div className="p-4 border-b border-orange-100 bg-orange-50/50">
                                <h4 className="font-semibold text-orange-800 flex items-center gap-2">
                                    <span className="bg-orange-200 text-orange-800 text-xs px-2 py-0.5 rounded-full">{gaps.length}</span>
                                    Recommended Actions
                                </h4>
                            </div>
                            <ScrollArea className="h-64 p-4">
                                <ul className="space-y-4 pr-3">
                                    {gaps.map(q => (
                                        <li key={q.id} className="text-sm">
                                            <p className="font-medium text-orange-900 mb-1">{q.text}</p>
                                            <p className="text-orange-700/90 text-xs leading-relaxed bg-white/50 p-2 rounded">
                                                {q.failureGuidance || "Review this area to ensure compliance."}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        </div>
                    )}

                    <div className="flex justify-center gap-3">
                        <Button variant="outline" onClick={handleReset} className="gap-2">
                            <RotateCcw className="h-4 w-4" /> Review Answers
                        </Button>
                        <Button onClick={handleDownload} disabled={downloadMutation.isPending} className="gap-2">
                            {downloadMutation.isPending ? "Generating..." : <><Save className="h-4 w-4" /> Download Report</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-2xl mx-auto mt-8 relative">
            <CardHeader>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Step {currentStep + 1} of {questions.length}</span>
                        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden w-24">
                            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${((currentStep) / questions.length) * 100}%` }}></div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {saveMutation.isPending ? "Saving..." : <><Save className="h-3 w-3" /> Auto-saved</>}
                        </span>
                        <span className="text-xs text-muted-foreground">{Math.round(((currentStep) / questions.length) * 100)}% Complete</span>
                    </div>
                </div>
                <CardTitle className="text-xl pt-4">{currentQuestion.text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {currentQuestion.type === 'boolean' && (
                    <RadioGroup
                        value={answers[currentQuestion.id] || ""}
                        onValueChange={handleAnswer}
                        className="grid gap-4"
                    >
                        <div className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors has-[:checked]:bg-accent has-[:checked]:border-primary">
                            <RadioGroupItem value="yes" id="yes" />
                            <Label htmlFor="yes" className="flex-1 cursor-pointer">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors has-[:checked]:bg-accent has-[:checked]:border-primary">
                            <RadioGroupItem value="no" id="no" />
                            <Label htmlFor="no" className="flex-1 cursor-pointer">No</Label>
                        </div>
                    </RadioGroup>
                )}

                {currentQuestion.type === 'scale' && (
                    <RadioGroup
                        value={answers[currentQuestion.id] || ""}
                        onValueChange={handleAnswer}
                        className="grid grid-cols-5 gap-2"
                    >
                        {[1, 2, 3, 4, 5].map(val => (
                            <div key={val} className="flex flex-col items-center space-y-2 border p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors has-[:checked]:bg-accent has-[:checked]:border-primary">
                                <RadioGroupItem value={val.toString()} id={`scale-${val}`} className="mb-2" />
                                <Label htmlFor={`scale-${val}`} className="cursor-pointer text-xs font-medium text-center">
                                    {val === 1 ? "None" : val === 5 ? "Mature" : val}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                )}

                <div className="flex justify-between pt-4">
                    <Button variant="ghost" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}>
                        Back
                    </Button>
                    <Button onClick={handleNext} disabled={!answers[currentQuestion.id]} className="gap-2">
                        Next Question <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
