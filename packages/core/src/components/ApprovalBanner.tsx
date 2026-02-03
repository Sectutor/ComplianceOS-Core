
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@complianceos/ui/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Badge } from "@complianceos/ui/ui/badge";
import { useClientContext } from "@/contexts/ClientContext";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, XCircle, Clock, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ApprovalBannerProps {
    entityType: 'plan' | 'bia' | 'strategy';
    entityId: number;
}

export function ApprovalBanner({ entityType, entityId }: ApprovalBannerProps) {
    const { selectedClientId } = useClientContext();
    const { user } = useAuth();
    const [isRequestOpen, setIsRequestOpen] = useState(false);
    const [isRespondOpen, setIsRespondOpen] = useState(false);
    const [selectedApprover, setSelectedApprover] = useState<string>("");
    const [responseStatus, setResponseStatus] = useState<'approved' | 'rejected'>('approved');
    const [responseComment, setResponseComment] = useState("");

    const ctx = trpc.useContext();

    const { data: approvals, isLoading } = trpc.businessContinuity.collaboration.getApprovals.useQuery(
        { clientId: selectedClientId as number, entityType, entityId },
        { enabled: !!selectedClientId }
    );

    // Get potential approvers
    const { data: contacts } = trpc.businessContinuity.callTree.list.useQuery(
        { clientId: selectedClientId as number },
        { enabled: !!selectedClientId && isRequestOpen }
    );

    const requestMutation = trpc.businessContinuity.collaboration.requestApproval.useMutation({
        onSuccess: () => {
            toast.success("Approval requested");
            setIsRequestOpen(false);
            ctx.businessContinuity.collaboration.getApprovals.invalidate();
        },
        onError: (err) => toast.error(err.message)
    });

    const respondMutation = trpc.businessContinuity.collaboration.respondToApproval.useMutation({
        onSuccess: () => {
            toast.success("Response submitted");
            setIsRespondOpen(false);
            ctx.businessContinuity.collaboration.getApprovals.invalidate();
        },
        onError: (err) => toast.error(err.message)
    });

    const latestApproval = approvals?.[0]; // Sort ordered by requestedAt desc

    const handleRequest = () => {
        if (!selectedApprover) return toast.error("Select an approver");
        requestMutation.mutate({
            clientId: selectedClientId as number,
            entityType,
            entityId,
            approverId: parseInt(selectedApprover)
        });
    };

    const handleRespond = () => {
        if (!latestApproval) return;
        respondMutation.mutate({
            id: latestApproval.id,
            status: responseStatus,
            comments: responseComment
        });
    };

    if (isLoading) return <div className="h-12 bg-muted/20 animate-pulse rounded-md mb-4" />;

    // If no approval request ever, show "Draft" or Request button
    if (!latestApproval) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 px-4 flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-slate-600">
                    <ShieldCheck className="h-5 w-5 text-slate-400" />
                    <span className="font-medium text-sm">Status: Draft</span>
                </div>
                <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">Request Approval</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Request Approval</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <label className="text-sm font-medium mb-2 block">Select Approver</label>
                            <Select value={selectedApprover} onValueChange={setSelectedApprover}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a user..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {contacts?.internal.map(u => (
                                        <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsRequestOpen(false)}>Cancel</Button>
                            <Button onClick={handleRequest} disabled={requestMutation.isLoading}>Send Request</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    const isPending = latestApproval.status === 'pending';
    const isApproved = latestApproval.status === 'approved';
    const isRejected = latestApproval.status === 'rejected';

    // Check if current user is the approver
    const canApprove = isPending && user?.id === latestApproval.approverId;

    return (
        <div className={cn(
            "rounded-lg p-4 border mb-6 flex items-center justify-between shadow-sm",
            isPending && "bg-yellow-50 border-yellow-200",
            isApproved && "bg-green-50 border-green-200",
            isRejected && "bg-red-50 border-red-200"
        )}>
            <div className="flex items-center gap-3">
                {isPending && <Clock className="h-5 w-5 text-yellow-600" />}
                {isApproved && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                {isRejected && <XCircle className="h-5 w-5 text-red-600" />}

                <div>
                    <div className={cn("font-medium",
                        isPending && "text-yellow-900",
                        isApproved && "text-green-900",
                        isRejected && "text-red-900"
                    )}>
                        {isPending && "Pending Approval"}
                        {isApproved && "Approved"}
                        {isRejected && "Rejected"}
                    </div>
                    <div className={cn("text-xs mt-0.5",
                        isPending && "text-yellow-700",
                        isApproved && "text-green-700",
                        isRejected && "text-red-700"
                    )}>
                        {isPending && `Requested on ${new Date(latestApproval.requestedAt!).toLocaleDateString()}`}
                        {isApproved && `Approved on ${new Date(latestApproval.respondedAt!).toLocaleDateString()}`}
                        {isRejected && `Rejected on ${new Date(latestApproval.respondedAt!).toLocaleDateString()}`}
                        {latestApproval.comments && <span className="block mt-1 italic">"{latestApproval.comments}"</span>}
                    </div>
                </div>
            </div>

            {canApprove && (
                <Dialog open={isRespondOpen} onOpenChange={setIsRespondOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className={cn(
                            isPending && "bg-yellow-600 hover:bg-yellow-700 text-white"
                        )}>
                            Review Request
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Review Approval Request</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="flex gap-4">
                                <Button
                                    variant={responseStatus === 'approved' ? 'default' : 'outline'}
                                    className={cn(responseStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : '')}
                                    onClick={() => setResponseStatus('approved')}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                                </Button>
                                <Button
                                    variant={responseStatus === 'rejected' ? 'destructive' : 'outline'}
                                    onClick={() => setResponseStatus('rejected')}
                                >
                                    <XCircle className="mr-2 h-4 w-4" /> Reject
                                </Button>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Comments (Optional)</label>
                                <Textarea
                                    placeholder="Add notes..."
                                    value={responseComment}
                                    onChange={e => setResponseComment(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsRespondOpen(false)}>Cancel</Button>
                            <Button onClick={handleRespond} disabled={respondMutation.isLoading}>Submit Decision</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* If rejected, allow re-requesting (start a new cycle) */}
            {isRejected && user?.id !== latestApproval.approverId && (
                <Button variant="outline" size="sm" onClick={() => setIsRequestOpen(true)} className="bg-white">
                    Request Again
                </Button>
            )}
        </div>
    );
}
