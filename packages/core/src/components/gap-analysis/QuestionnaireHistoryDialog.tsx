import { useState } from "react";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { trpc } from "@/lib/trpc";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Loader2, Mail, Clock, CheckCircle2, Eye, ExternalLink, Calendar, Copy, FileText, Check, MoreVertical, Archive } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@complianceos/ui/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@complianceos/ui/ui/accordion";

interface QuestionnaireHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assessmentId: number;
}

function StatusBadge({ status, appliedAt }: { status: string | null, appliedAt?: Date | null }) {
    if (!status) return null;

    // Override status based on flags
    let displayStatus = status;
    if (status === 'completed' && appliedAt) displayStatus = 'approved';
    if (status === 'archived') displayStatus = 'archived';

    const styles: Record<string, string> = {
        'pending': 'bg-slate-100 text-slate-600 border-slate-200',
        'viewed': 'bg-blue-50 text-blue-600 border-blue-200',
        'completed': 'bg-indigo-50 text-indigo-600 border-indigo-200', // Response Received
        'approved': 'bg-green-50 text-green-600 border-green-200',
        'archived': 'bg-gray-100 text-gray-500 border-gray-200',
        'expired': 'bg-red-50 text-red-600 border-red-200',
    };

    const icons: Record<string, any> = {
        'pending': Clock,
        'viewed': Eye,
        'completed': Mail, // Received
        'approved': CheckCircle2,
        'archived': Archive,
        'expired': Loader2,
    };

    const labels: Record<string, string> = {
        'completed': 'Response Received',
        'approved': 'Approved',
        'archived': 'Archived',
    };

    const Icon = icons[displayStatus] || Clock;

    return (
        <Badge variant="outline" className={`${styles[displayStatus] || styles['pending']} gap-1 pl-1.5`}>
            <Icon className="h-3 w-3" />
            <span className="capitalize">{labels[displayStatus] || displayStatus}</span>
        </Badge>
    );
}

export function QuestionnaireHistoryDialog({ open, onOpenChange, assessmentId }: QuestionnaireHistoryDialogProps) {
    const { data: requests, isLoading } = trpc.gapQuestionnaire.listByAssessment.useQuery(
        { assessmentId },
        { enabled: open }
    );

    const [confirmApproveId, setConfirmApproveId] = useState<number | null>(null);

    const utils = trpc.useContext();
    const approveMutation = trpc.gapQuestionnaire.approveResponses.useMutation({
        onSuccess: (data) => {
            toast.success(`Successfully approved and applied ${data.count} responses.`);
            utils.gapQuestionnaire.listByAssessment.invalidate({ assessmentId });
            // Also invalidate gap analysis to show new values
            utils.gapAnalysis.get.invalidate({ id: assessmentId });
            setConfirmApproveId(null);
        },
        onError: (err) => {
            toast.error("Failed to approve responses: " + err.message);
        }
    });

    const archiveMutation = trpc.gapQuestionnaire.archiveRequest.useMutation({
        onSuccess: () => {
            toast.success("Questionnaire archived.");
            utils.gapQuestionnaire.listByAssessment.invalidate({ assessmentId });
        }
    });

    const copyLink = (token: string) => {
        const url = `${window.location.origin}/respond-gap/${token}`;
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
    };

    const handleArchive = (requestId: number) => {
        if (confirm("Are you sure you want to archive this response?")) {
            archiveMutation.mutate({ requestId });
        }
    };

    const handleApproveClick = (requestId: number) => {
        setConfirmApproveId(requestId);
    };

    const confirmApprove = () => {
        if (confirmApproveId) {
            approveMutation.mutate({ requestId: confirmApproveId });
        }
    };

    return (
        <>
            <EnhancedDialog
                open={open}
                onOpenChange={onOpenChange}
                title="Questionnaire History"
                description="View sent questionnaires and responses."
                size="lg"
            >
                <div className="h-[400px] flex flex-col">
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : !requests || requests.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <Mail className="h-12 w-12 text-slate-200" />
                            <p>No questionnaires sent yet.</p>
                        </div>
                    ) : (
                        <ScrollArea className="flex-1 pr-4">
                            <div className="space-y-4">
                                {requests.map((request) => (
                                    <Card key={request.id} className="overflow-hidden">
                                        <div className="p-4 border-b bg-slate-50/50 flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-sm">
                                                        {request.recipientName || request.recipientEmail}
                                                    </h4>
                                                    <Badge variant="outline" className="text-[10px] font-normal">
                                                        {request.recipientEmail}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(request.createdAt!), "MMM d, yyyy")}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <FileText className="h-3 w-3" />
                                                        {(request.controlIds as any[])?.length || 0} Controls
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <StatusBadge status={request.status} appliedAt={request.appliedAt} />

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                            <MoreVertical className="h-3 w-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => copyLink(request.token)}>
                                                            <Copy className="h-3.5 w-3.5 mr-2" />
                                                            Copy Link
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <a href={`/respond-gap/${request.token}`} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                                                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                                                Open Form
                                                            </a>
                                                        </DropdownMenuItem>
                                                        {request.status !== 'archived' && (
                                                            <DropdownMenuItem onClick={() => handleArchive(request.id)} className="text-red-600 focus:text-red-600">
                                                                <Archive className="h-3.5 w-3.5 mr-2" />
                                                                Archive
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        {/* Respondent Info */}
                                        {request.respondentName && (
                                            <div className="px-4 pb-2 text-xs text-muted-foreground italic bg-slate-50/50 border-b flex items-center gap-1.5">
                                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                                                Response submitted by: <span className="font-medium text-slate-700">{request.respondentName}</span>
                                            </div>
                                        )}

                                        {(request.status === 'completed' || request.status === 'archived') && request.responses && (
                                            <Accordion type="single" collapsible>
                                                <AccordionItem value="responses" className="border-b-0">
                                                    <AccordionTrigger className="px-4 py-2 text-xs hover:no-underline hover:bg-slate-50">
                                                        View Responses
                                                    </AccordionTrigger>
                                                    <AccordionContent className="px-4 pb-4 pt-2 bg-slate-50/30">
                                                        <div className="space-y-3">
                                                            {(request.responses as any[]).map((resp: any, i: number) => (
                                                                <div key={i} className="text-sm border-l-2 border-slate-200 pl-3 py-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-mono text-xs font-semibold">{resp.controlId || `ID: ${resp.controlId}`}</span>
                                                                        <ResponseStatusBadge status={resp.currentStatus} />
                                                                    </div>
                                                                    {resp.notes && (
                                                                        <p className="text-muted-foreground text-xs italic">
                                                                            "{resp.notes}"
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {!request.appliedAt ? (
                                                            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                                                                <Button
                                                                    size="sm"
                                                                    className="h-8 text-xs bg-green-600 hover:bg-green-700"
                                                                    onClick={() => handleApproveClick(request.id)}
                                                                    disabled={approveMutation.isLoading}
                                                                >
                                                                    {approveMutation.isLoading && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                                                                    Approve & Apply Answers
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-3 pt-2 border-t border-slate-200/50">
                                                                <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium justify-end">
                                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                                    Approved & Applied
                                                                </div>
                                                            </div>
                                                        )}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </EnhancedDialog>

            {/* Confirmation Dialog */}
            <EnhancedDialog
                open={!!confirmApproveId}
                onOpenChange={(val) => !val && setConfirmApproveId(null)}
                title="Approve Responses?"
                description="This will apply the external responses to your Gap Analysis, overwriting any current values for these controls."
                size="sm"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setConfirmApproveId(null)}>Cancel</Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={confirmApprove}
                            disabled={approveMutation.isLoading}
                        >
                            {approveMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yes, Approve & Apply
                        </Button>
                    </>
                }
            >
                <div className="py-2 text-sm text-slate-600">
                    <p>Are you sure you want to proceed? This action cannot be easily undone.</p>
                </div>
            </EnhancedDialog>
        </>
    );
}

// REMOVED old StatusBadge function, moved to top
function ResponseStatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        'implemented': 'text-green-600 bg-green-50 border-green-200',
        'in_progress': 'text-yellow-600 bg-yellow-50 border-yellow-200',
        'not_implemented': 'text-red-600 bg-red-50 border-red-200',
        'not_applicable': 'text-slate-500 bg-slate-100 border-slate-200',
    };

    return (
        <Badge variant="outline" className={`${styles[status]} text-[10px] h-5 px-1.5 border`}>
            {status.replace('_', ' ')}
        </Badge>
    );
}
