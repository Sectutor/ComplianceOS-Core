
import { useState, useEffect } from "react";
import { useClientContext } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@complianceos/ui/ui/button";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Progress } from "@complianceos/ui/ui/progress";
import { Badge } from "@complianceos/ui/ui/badge";
import { Save, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import DashboardLayout from "@/components/DashboardLayout";

interface Question {
    id: string;
    text: string;
}

interface Category {
    id: string;
    category: string;
    questions: Question[];
}

interface PrivacyAssessmentProps {
    title: string;
    type: "gdpr" | "ccpa";
    checklist: Category[];
    mode?: "assessment" | "checklist"; // New prop
}

export default function PrivacyAssessment({ title, type, checklist, mode = "assessment" }: PrivacyAssessmentProps) {
    const { selectedClientId } = useClientContext();
    const [, setLocation] = useLocation();

    // State
    // State
    const [responses, setResponses] = useState<Record<string, { answer: string; notes?: string; owner?: string; dueDate?: string; lastReviewed?: string }>>({});
    const [score, setScore] = useState(0);

    // Fetch existing data
    const { data: assessment, isLoading } = trpc.privacy.getAssessment.useQuery(
        { clientId: selectedClientId || 0, type },
        {
            enabled: !!selectedClientId,
            onSuccess: (data: any) => {
                if (data?.responses) {
                    setResponses(data.responses as any);
                }
            }
        }
    );

    // Mutation
    const saveMutation = trpc.privacy.saveAssessment.useMutation({
        onSuccess: () => {
            toast.success("Assessment saved successfully");
        },
        onError: (e) => toast.error(e.message)
    });

    // Calculate score
    useEffect(() => {
        let yesCount = 0;
        let totalQuestions = 0;

        checklist.forEach(cat => {
            cat.questions.forEach(q => {
                totalQuestions++;
                if (responses[q.id]?.answer === "yes") yesCount++;
                if (responses[q.id]?.answer === "partial") yesCount += 0.5;
            });
        });

        const newScore = totalQuestions > 0 ? Math.round((yesCount / totalQuestions) * 100) : 0;
        setScore(newScore);
    }, [responses, checklist]);

    const handleAnswerChange = (qId: string, val: string) => {
        setResponses(prev => ({
            ...prev,
            [qId]: { ...prev[qId], answer: val }
        }));
    };

    const handleNotesChange = (qId: string, val: string) => {
        setResponses(prev => ({
            ...prev,
            [qId]: { ...prev[qId], notes: val }
        }));
    };

    const handleSave = () => {
        if (!selectedClientId) return;

        const status = score === 100 ? "completed" : score > 0 ? "in_progress" : "not_started";

        saveMutation.mutate({
            clientId: selectedClientId || 0,
            type,
            responses,
            score,
            status
        });
    };

    if (!selectedClientId) return <div className="p-8">Please select a client.</div>;
    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto pb-12">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Button variant="ghost" className="mb-2 pl-0 hover:pl-2 transition-all" onClick={() => setLocation(`/clients/${selectedClientId}/privacy`)}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                        <p className="text-muted-foreground mt-1">Assess your compliance posture.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-2xl font-bold">{score}%</div>
                            <div className="text-xs text-muted-foreground">Readiness Score</div>
                        </div>
                        <Button onClick={handleSave} disabled={saveMutation.isLoading}>
                            {saveMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" /> Save Progress
                        </Button>
                    </div>
                </div>

                {/* Progress Bar */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Completion Progress</span>
                                <span className={score >= 100 ? "text-green-600 font-medium" : "text-muted-foreground"}>
                                    {score >= 100 ? "Completed!" : `${score}%`}
                                </span>
                            </div>
                            <Progress value={score} className="h-3" />
                        </div>
                    </CardContent>
                </Card>

                {/* Questionnaire / Checklist */}
                <div className="space-y-6">
                    {checklist.map((category) => (
                        <Card key={category.id}>
                            <CardHeader className="bg-muted/30 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {category.category}
                                    {/* Show check if category is fully complete (all yes) */}
                                    {category.questions.every(q => responses[q.id]?.answer === 'yes') && (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                {mode === "checklist" ? (
                                    <div className="rounded-md border">
                                        <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm bg-muted/50 border-b">
                                            <div className="col-span-12 md:col-span-5 pl-2">Requirement</div>
                                            <div className="col-span-12 md:col-span-2 text-center">Status</div>
                                            <div className="col-span-12 md:col-span-2 hidden md:block">Owner / Due</div>
                                            <div className="col-span-12 md:col-span-3 hidden md:block">Evidence / Notes</div>
                                        </div>
                                        {category.questions.map((q, idx) => (
                                            <div key={q.id} className={cn("grid grid-cols-12 gap-4 p-4 items-start transition-all hover:bg-slate-50", idx !== category.questions.length - 1 && "border-b")}>

                                                {/* Question Text */}
                                                <div className="col-span-12 md:col-span-5 flex gap-3">
                                                    <span className="text-muted-foreground text-xs font-mono mt-1 w-6 shrink-0">{idx + 1}.</span>
                                                    <p className="text-sm leading-relaxed">{q.text}</p>
                                                </div>

                                                {/* Status Dropdown (Tracking Tool Style) */}
                                                <div className="col-span-12 md:col-span-2">
                                                    <Select
                                                        value={responses[q.id]?.answer || "not_started"}
                                                        onValueChange={(val) => handleAnswerChange(q.id, val)}
                                                    >
                                                        <SelectTrigger className={cn("h-8 text-xs font-medium border-0 ring-1 ring-inset",
                                                            responses[q.id]?.answer === 'yes' ? "bg-green-50 text-green-700 ring-green-600/20" : // Done
                                                                responses[q.id]?.answer === 'partial' ? "bg-yellow-50 text-yellow-700 ring-yellow-600/20" : // In Progress
                                                                    responses[q.id]?.answer === 'na' ? "bg-slate-50 text-slate-600 ring-slate-400/20" : // N/A
                                                                        "bg-red-50 text-red-700 ring-red-600/20" // Not Started
                                                        )}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="not_started">Not Started (Gap)</SelectItem>
                                                            <SelectItem value="partial">In Progress</SelectItem>
                                                            <SelectItem value="yes">Done / Complete</SelectItem>
                                                            <SelectItem value="na">N/A</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Owner & Due Date */}
                                                <div className="col-span-12 md:col-span-2 space-y-2">
                                                    <input
                                                        placeholder="Owner"
                                                        className="flex h-7 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        value={responses[q.id]?.owner || ""}
                                                        onChange={(e) => setResponses(prev => ({ ...prev, [q.id]: { ...prev[q.id], owner: e.target.value } }))}
                                                    />
                                                    <input
                                                        type="date"
                                                        className="flex h-7 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        value={responses[q.id]?.dueDate || ""}
                                                        onChange={(e) => setResponses(prev => ({ ...prev, [q.id]: { ...prev[q.id], dueDate: e.target.value } }))}
                                                    />
                                                </div>

                                                {/* Evidence / Notes */}
                                                <div className="col-span-12 md:col-span-3">
                                                    <Textarea
                                                        placeholder="Link to ROPA, DPA, Policy..."
                                                        className="min-h-[3.5rem] text-xs resize-y mb-1"
                                                        value={responses[q.id]?.notes || ""}
                                                        onChange={(e) => handleNotesChange(q.id, e.target.value)}
                                                    />
                                                    {responses[q.id]?.lastReviewed && (
                                                        <p className="text-[10px] text-muted-foreground text-right">
                                                            Rev: {responses[q.id]?.lastReviewed}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    // Default Assessment Mode (CCPA)
                                    category.questions.map((q) => (
                                        <div key={q.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                                            <div className="md:col-span-6">
                                                <p className="font-medium text-sm leading-relaxed">{q.text}</p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <Select
                                                    value={responses[q.id]?.answer || "no"}
                                                    onValueChange={(val) => handleAnswerChange(q.id, val)}
                                                >
                                                    <SelectTrigger className={
                                                        responses[q.id]?.answer === 'yes' ? "border-green-200 bg-green-50 text-green-700" :
                                                            responses[q.id]?.answer === 'partial' ? "border-yellow-200 bg-yellow-50 text-yellow-700" : ""
                                                    }>
                                                        <SelectValue placeholder="Select..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="no">No / Not Started</SelectItem>
                                                        <SelectItem value="partial">Partial</SelectItem>
                                                        <SelectItem value="yes">Yes / Compliant</SelectItem>
                                                        <SelectItem value="na">N/A</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="md:col-span-4">
                                                <Textarea
                                                    placeholder="Add notes, evidence links, or gaps..."
                                                    className="min-h-[2.5rem] text-xs resize-y"
                                                    value={responses[q.id]?.notes || ""}
                                                    onChange={(e) => handleNotesChange(q.id, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
