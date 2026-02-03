import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Label } from "@complianceos/ui/ui/label";
import { AlertCircle, CheckCircle2, Shield, Loader2, Clock, Send } from "lucide-react";
import { Input } from "@complianceos/ui/ui/input";
import { toast } from "sonner";

export default function GapQuestionnaireResponse() {
    const { token } = useParams<{ token: string }>();
    const [responses, setResponses] = useState<Record<number, { status: string; notes: string }>>({});
    const [submitted, setSubmitted] = useState(false);
    const [respondentName, setRespondentName] = useState("");

    const { data, isLoading, error } = trpc.gapQuestionnaire.getByToken.useQuery(
        { token: token || "" },
        { enabled: !!token }
    );

    const submitMutation = trpc.gapQuestionnaire.submitResponses.useMutation({
        onSuccess: () => {
            setSubmitted(true);
            toast.success("Responses submitted successfully!");
        },
        onError: (err) => toast.error(err.message),
    });

    // Initialize responses from existing data
    useEffect(() => {
        if (data?.controls) {
            const initial: Record<number, { status: string; notes: string }> = {};
            data.controls.forEach((c: any) => {
                initial[c.id] = {
                    status: c.currentResponse?.currentStatus || "not_implemented",
                    notes: "",
                };
            });
            setResponses(initial);
        }
    }, [data]);

    const handleSubmit = () => {
        if (!token) return;

        const responseArray = Object.entries(responses).map(([id, resp]) => ({
            controlId: parseInt(id),
            currentStatus: resp.status,
            notes: resp.notes || undefined,
        }));

        submitMutation.mutate({ token, responses: responseArray, respondentName: respondentName || undefined });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading questionnaire...</p>
                </div>
            </div>
        );
    }

    if (!data || error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Questionnaire Not Found</h2>
                        <p className="text-muted-foreground">
                            This link may be invalid or has expired.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (data.expired) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <Clock className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Questionnaire Expired</h2>
                        <p className="text-muted-foreground">
                            This questionnaire has expired. Please contact the sender for a new link.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
                        <p className="text-muted-foreground">
                            Your responses have been submitted successfully. You can close this window.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Shield className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Gap Analysis Questionnaire</CardTitle>
                                <CardDescription>
                                    {data.request?.recipientName
                                        ? `Hello ${data.request.recipientName},`
                                        : 'Hello,'
                                    } please provide your input on the following controls.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    {data.request?.message && (
                        <CardContent className="pt-0">
                            <div className="bg-muted/50 p-3 rounded-lg text-sm italic">
                                "{data.request.message}"
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Respondent Name */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base">Your Detail</CardTitle>
                        <CardDescription>Optional: Let us know who provided these responses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="respondent-name">Your Name / Email</Label>
                            <Input
                                id="respondent-name"
                                placeholder="e.g. John Doe"
                                value={respondentName}
                                onChange={(e) => setRespondentName(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Controls */}
                <div className="space-y-4">
                    {data.controls?.map((control: any, index: number) => (
                        <Card key={control.id}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                                {index + 1}
                                            </span>
                                            <Badge variant="outline">{control.controlId}</Badge>
                                        </div>
                                        <CardTitle className="text-base">{control.name}</CardTitle>
                                        {control.description && (
                                            <CardDescription className="mt-1 text-sm">
                                                {control.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                    <Badge className="bg-slate-100 text-slate-700">{control.framework}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Current Implementation Status</Label>
                                        <Select
                                            value={responses[control.id]?.status || "not_implemented"}
                                            onValueChange={(val) => setResponses(prev => ({
                                                ...prev,
                                                [control.id]: { ...prev[control.id], status: val }
                                            }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="implemented">
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                                        Implemented
                                                    </span>
                                                </SelectItem>
                                                <SelectItem value="in_progress">
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                                        In Progress
                                                    </span>
                                                </SelectItem>
                                                <SelectItem value="not_implemented">
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                                        Not Implemented
                                                    </span>
                                                </SelectItem>
                                                <SelectItem value="not_applicable">
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                                                        Not Applicable
                                                    </span>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Additional Notes / Evidence Description</Label>
                                    <Textarea
                                        placeholder="Describe the current implementation, evidence available, or any relevant notes..."
                                        value={responses[control.id]?.notes || ""}
                                        onChange={(e) => setResponses(prev => ({
                                            ...prev,
                                            [control.id]: { ...prev[control.id], notes: e.target.value }
                                        }))}
                                        className="min-h-[80px]"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Submit */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {data.controls?.length || 0} control(s) to review
                            </p>
                            <Button
                                onClick={handleSubmit}
                                disabled={submitMutation.isPending}
                                className="gap-2"
                            >
                                {submitMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                Submit Responses
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
