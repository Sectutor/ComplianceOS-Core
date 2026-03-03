import React, { useState } from 'react';
import { useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from '@complianceos/ui/ui/card';
import { Button } from '@complianceos/ui/ui/button';
import { Input } from '@complianceos/ui/ui/input';
import { ScrollArea } from '@complianceos/ui/ui/scroll-area';
import { Badge } from '@complianceos/ui/ui/badge';
import { AlertCircle, Save, CheckCircle2, ShieldCheck, Mail, Building, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@complianceos/ui/ui/alert';
import { toast } from 'sonner';

export default function VendorQuestionnairePortal() {
    const { token } = useParams<{ token: string }>();

    const { data: questionnaireData, isLoading, error } = trpc.questionnaire.getByVendorToken.useQuery(
        { token: token as string },
        {
            enabled: !!token,
            retry: false,
            refetchOnWindowFocus: false,
        }
    );

    const [responses, setResponses] = useState<Record<number, { answer: string; comment?: string }>>({});

    const saveMutation = trpc.questionnaire.submitVendorResponses.useMutation({
        onSuccess: (_, variables) => {
            if (variables.submit) {
                toast.success("Questionnaire submitted successfully!");
            } else {
                toast.success("Progress saved successfully!");
            }
        },
        onError: (error) => {
            toast.error(`Failed to save: ${error.message}`);
        }
    });

    // Load existing answers on initial fetch
    React.useEffect(() => {
        try {
            if (questionnaireData?.questions) {
                const initial: Record<number, { answer: string; comment?: string }> = {};
                questionnaireData.questions.forEach((q: any) => {
                    initial[q.id] = { answer: q.answer || '', comment: q.comment || '' };
                });
                setResponses(initial);
            }
        } catch (error) {
            console.error('[VendorQuestionnairePortal] Failed to load existing answers:', error);
            toast.error('Failed to load questionnaire data. Please refresh the page.');
        }
    }, [questionnaireData]); // eslint-disable-line react-hooks/exhaustive-deps

    if (isLoading) {
        return (
            <div className="flex bg-slate-50 justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !questionnaireData) {
        return (
            <div className="flex bg-slate-50 justify-center items-center h-screen p-4">
                <Alert variant="destructive" className="max-w-md w-full bg-white shadow-lg">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>Assessment Not Found</AlertTitle>
                    <AlertDescription>
                        The security assessment link is invalid or has expired. Please contact the security team that sent you the link for a new one.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const isCompleted = questionnaireData.status === 'completed' || questionnaireData.status === 'pending_review';

    const handleInputChange = (id: number, field: 'answer' | 'comment', value: string) => {
        if (isCompleted) return;
        setResponses(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleSave = async (submit: boolean = false) => {
        if (isCompleted) return;

        // Convert Record to Array for the API
        const responseArray = Object.keys(responses).map(key => ({
            id: Number(key),
            answer: responses[Number(key)].answer || "",
            comment: responses[Number(key)].comment || ""
        }));

        saveMutation.mutate({
            token: token as string,
            responses: responseArray,
            submit
        });
    };

    const calculateProgress = () => {
        if (!questionnaireData.questions || questionnaireData.questions.length === 0) return 0;
        const answeredCount = Object.values(responses).filter(r => r.answer && r.answer.trim().length > 0).length;
        return Math.round((answeredCount / questionnaireData.questions.length) * 100);
    };

    const progress = calculateProgress();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 leading-tight">Security Assessment</h1>
                                <p className="text-sm text-slate-500 hidden sm:block">Powered by ComplianceOS TPRM</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {isCompleted ? (
                                <Badge variant="success" className="bg-emerald-100 text-emerald-800 flex gap-1.5 px-3 py-1">
                                    <CheckCircle2 size={16} />
                                    Submitted
                                </Badge>
                            ) : (
                                <>
                                    <div className="hidden sm:flex items-center gap-2 mr-4">
                                        <div className="text-sm font-medium text-slate-600">{progress}% Completed</div>
                                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleSave(false)}
                                        disabled={saveMutation.isPending}
                                        className="hidden sm:flex gap-2"
                                    >
                                        <Save size={16} />
                                        Save Draft
                                    </Button>
                                    <Button
                                        onClick={() => handleSave(true)}
                                        disabled={saveMutation.isPending}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                                    >
                                        <CheckCircle2 size={16} />
                                        Submit Assessment
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Project Context */}
                <Card className="mb-8 border border-indigo-100 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 mb-1">{questionnaireData.name}</h2>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                                    <Building size={16} />
                                    <span>Requested by: <strong>{questionnaireData.senderName || "Compliance/Security Team"}</strong></span>
                                </div>
                                <p className="text-slate-600 text-sm">
                                    Please complete the following security controls assessment. You can save your progress and return anytime using the original secure link until you hit Submit.
                                </p>
                            </div>

                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col justify-center space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="text-slate-400" size={18} />
                                    <span className="text-slate-600 font-medium w-24">Vendor Email:</span>
                                    <span className="text-slate-900">{questionnaireData.vendorEmail || '-'}</span>
                                </div>
                                {questionnaireData.productName && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <ShieldCheck className="text-slate-400" size={18} />
                                        <span className="text-slate-600 font-medium w-24">Product:</span>
                                        <span className="text-slate-900">{questionnaireData.productName}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm">
                                    <Clock className="text-slate-400" size={18} />
                                    <span className="text-slate-600 font-medium w-24">Due Date:</span>
                                    <span className="text-slate-900">
                                        {questionnaireData.dueDate
                                            ? new Date(questionnaireData.dueDate).toLocaleDateString()
                                            : 'Not specified'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {isCompleted && (
                    <Alert variant="success" className="mb-8 border-emerald-200 bg-emerald-50 text-emerald-900">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <AlertTitle className="text-emerald-800 font-semibold">Assessment Submitted</AlertTitle>
                        <AlertDescription className="text-emerald-700">
                            Thank you for completing the security assessment. This questionnaire is now locked for review by the requesting organization.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Questionnaire Questions */}
                <div className="space-y-6">
                    {questionnaireData.questions?.map((q: any, i: number) => (
                        <Card key={q.id} className="overflow-hidden shadow-sm transition-all hover:shadow-md border border-slate-200">
                            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex gap-4">
                                <div className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    {i + 1}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {q.questionId && (
                                            <Badge variant="outline" className="text-xs font-mono text-slate-500 bg-white">
                                                {q.questionId}
                                            </Badge>
                                        )}
                                        {q.category && (
                                            <Badge variant="secondary" className="text-xs bg-slate-200 text-slate-700">
                                                {q.category}
                                            </Badge>
                                        )}
                                    </div>
                                    <h3 className="text-base font-medium text-slate-900">{q.question}</h3>
                                </div>
                            </div>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Your Answer
                                        </label>
                                        <textarea
                                            className="w-full min-h-[100px] p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500 resize-y"
                                            value={responses[q.id]?.answer || ''}
                                            onChange={(e: any) => handleInputChange(q.id, 'answer', e.target.value)}
                                            placeholder="Provide exhaustive details about how you meet this control..."
                                            disabled={isCompleted}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Clarifications / Comments (Optional)
                                        </label>
                                        <Input
                                            value={responses[q.id]?.comment || ''}
                                            onChange={(e) => handleInputChange(q.id, 'comment', e.target.value)}
                                            placeholder="Add any links, clarifying notes, or context here..."
                                            disabled={isCompleted}
                                            className="disabled:bg-slate-50 disabled:text-slate-500"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Footer Save Area */}
                {!isCompleted && (
                    <div className="mt-8 flex justify-end gap-3 sticky bottom-6 z-10 p-4 bg-white/90 backdrop-blur-sm border border-slate-200 shadow-xl rounded-xl">
                        <Button
                            variant="outline"
                            onClick={() => handleSave(false)}
                            disabled={saveMutation.isPending}
                            size="lg"
                            className="gap-2"
                        >
                            <Save size={18} />
                            Save Draft
                        </Button>
                        <Button
                            onClick={() => handleSave(true)}
                            disabled={saveMutation.isPending}
                            size="lg"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                        >
                            <CheckCircle2 size={18} />
                            Submit Final Answers
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
