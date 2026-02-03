
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@complianceos/ui/ui/alert";
import { Loader2, CheckCircle2, Shield, AlertTriangle, Upload } from "lucide-react";
import { toast } from "sonner";

export default function GapQuestionnaire() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [response, setResponse] = useState("");
    const [files, setFiles] = useState<File[]>([]); // Mock file upload

    const { data: request, isLoading, error } = trpc.compliance.gapQuestionnaireRequests.get.useQuery(
        { token: token || "" },
        { enabled: !!token, retry: false }
    );

    const submitMutation = trpc.compliance.gapQuestionnaireRequests.submit.useMutation({
        onSuccess: () => {
            toast.success("Response submitted successfully!");
        },
        onError: (e) => toast.error(e.message)
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !request) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-destructive/20 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Invalid or Expired Link
                        </CardTitle>
                        <CardDescription>
                            This questionnaire link is invalid, expired, or has already been completed.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full" onClick={() => navigate('/')}>Return to Home</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (submitMutation.isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-green-200 bg-green-50 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <CheckCircle2 className="h-6 w-6" />
                            Submission Received
                        </CardTitle>
                        <CardDescription className="text-green-600">
                            Thank you for submitting your evidence. Our compliance team will review it shortly.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const handleSubmit = () => {
        if (!response.trim() && files.length === 0) {
            toast.error("Please provide a response or upload evidence.");
            return;
        }

        // Mock file upload to URLs
        const mockFileUrls = files.map(f => `https://storage.complianceos.com/evidence/${f.name}`);

        submitMutation.mutate({
            token: token!,
            response: response,
            files: mockFileUrls
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Compliance Evidence Request</h2>
                    <p className="mt-2 text-lg text-slate-600">
                        Please provide evidence for the following control requirement.
                    </p>
                </div>

                <Card className="shadow-xl border-t-4 border-t-primary">
                    <CardHeader className="bg-slate-50/50 border-b pb-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl">{request.control.control.controlId}: {request.control.control.name}</CardTitle>
                                <CardDescription className="mt-2 text-base text-slate-700">
                                    {request.control.control.description}
                                </CardDescription>
                            </div>
                            {request.expiresAt && (
                                <div className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border shadow-sm">
                                    Due by {new Date(request.expiresAt).toLocaleDateString()}
                                </div>
                            )}
                        </div>

                        {request.notes && (
                            <Alert className="mt-4 bg-blue-50 border-blue-100">
                                <AlertTitle className="text-blue-800 font-semibold">Note from Requester</AlertTitle>
                                <AlertDescription className="text-blue-700">
                                    {request.notes}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardHeader>

                    <CardContent className="space-y-6 pt-8">
                        <div className="space-y-3">
                            <Label htmlFor="response" className="text-base font-semibold">Your Response / Explanation</Label>
                            <Textarea
                                id="response"
                                placeholder="Describe how this requirement is met..."
                                className="min-h-[150px] text-base resize-none"
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Evidence Files</Label>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 hover:bg-slate-50 transition-colors cursor-pointer text-center group">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 group-hover:bg-primary/10 transition-colors">
                                    <Upload className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
                                </div>
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-slate-900">
                                        Drag and drop files here, or click to browse
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Supports PDF, PNG, JPG, DOCX (Max 10MB)
                                    </p>
                                </div>
                                {/* Mock Input */}
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files?.length) {
                                            setFiles([...files, ...Array.from(e.target.files)]);
                                            toast.success(`Added ${e.target.files.length} file(s)`);
                                        }
                                    }}
                                />
                            </div>

                            {files.length > 0 && (
                                <div className="space-y-2 mt-4">
                                    {files.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-md border text-sm">
                                            <span className="truncate max-w-[200px]">{f.name}</span>
                                            <Button variant="ghost" size="sm" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="bg-slate-50 p-6 flex justify-end gap-3 border-t">
                        <Button variant="outline" onClick={() => setResponse("")}>Clear</Button>
                        <Button size="lg" onClick={handleSubmit} disabled={submitMutation.isPending}>
                            {submitMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit Response"
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
