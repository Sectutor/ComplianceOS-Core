
import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@complianceos/ui/ui/card";
import { toast } from "sonner";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function VendorAssessmentPortal() {
    // Extract token from URL (e.g., /portal/assessment/:token)
    // or query param ?token=... depending on routing setup.
    // Let's assume path param for now, or fallback to query param.
    const { token } = useParams<{ token: string }>();

    const [responses, setResponses] = useState<Record<string, any>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const { data, isLoading, error } = trpc.vendorAssessments.getPublicAssessment.useQuery(
        { token: token! },
        { enabled: !!token, retry: false }
    );

    const submitMutation = trpc.vendorAssessments.submitAssessment.useMutation({
        onSuccess: () => {
            setIsSubmitted(true);
            toast.success("Assessment submitted successfully!");
        },
        onError: (err) => {
            toast.error(`Submission failed: ${err.message}`);
        },
    });

    useEffect(() => {
        if (data?.request?.responses) {
            // Pre-fill existing responses if any (for draft saving)
            setResponses(data.request.responses as Record<string, any>);
        }
    }, [data]);

    const handleInputChange = (questionId: string, value: any) => {
        setResponses((prev) => ({
            ...prev,
            [questionId]: { value }, // Store as object to allow for comments/evidence later
        }));
    };

    const handleSubmit = (status: "in_progress" | "submitted") => {
        submitMutation.mutate({
            token: token!,
            responses: responses,
            status: status,
        });
    };

    if (!token) return <div className="min-h-screen flex items-center justify-center">Invalid Link</div>;
    if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading Assessment...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">Access Denied or Expired</div>;
    if (isSubmitted || data?.request?.status === "submitted" || data?.request?.status === "completed") {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center py-12">
                    <CardContent>
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Assessment Submitted</h2>
                        <p className="text-muted-foreground">
                            Thank you for completing the assessment. The compliance team will review your responses shortly.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const sections = (data?.template?.content as any)?.sections || [];

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-900">{data?.template?.name}</h1>
                    <p className="text-lg text-slate-600 mt-2">
                        Requested by {data?.vendorName ? "Compliance Team" : "Client"} for {data?.vendorName}
                    </p>
                    {data?.request?.dueDate && (
                        <p className="text-sm text-red-500 mt-1">Due Date: {new Date(data.request.dueDate!).toLocaleDateString()}</p>
                    )}
                </div>

                {sections.map((section: any, idx: number) => (
                    <Card key={idx}>
                        <CardHeader>
                            <CardTitle>{section.title}</CardTitle>
                            {section.description && <CardDescription>{section.description}</CardDescription>}
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {section.questions.map((q: any) => (
                                <div key={q.id} className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {q.text} {q.required && <span className="text-red-500">*</span>}
                                    </label>

                                    {q.type === "text" && (
                                        <Input
                                            value={responses[q.id]?.value || ""}
                                            onChange={(e) => handleInputChange(q.id, e.target.value)}
                                            placeholder="Your answer..."
                                        />
                                    )}
                                    {/* Add other types (yes/no, multichoice) here */}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}

                <div className="flex justify-end gap-4 sticky bottom-4">
                    {/* Floating Action Bar equivalent */}
                    <Card className="w-full shadow-lg border-t-2 border-primary/20">
                        <CardContent className="flex justify-between items-center p-4">
                            <span className="text-sm text-muted-foreground">
                                {Object.keys(responses).length} questions answered
                            </span>
                            <div className="space-x-4">
                                <Button variant="outline" onClick={() => handleSubmit("in_progress")} disabled={submitMutation.isLoading}>
                                    Save Draft
                                </Button>
                                <Button onClick={() => handleSubmit("submitted")} disabled={submitMutation.isLoading}>
                                    {submitMutation.isLoading ? "Submitting..." : "Submit Assessment"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
