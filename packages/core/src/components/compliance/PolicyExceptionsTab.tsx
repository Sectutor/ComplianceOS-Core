
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@complianceos/ui/ui/dialog";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Label } from "@complianceos/ui/ui/label";
import { Input } from "@complianceos/ui/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Loader2, CheckCircle, XCircle, AlertCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface PolicyExceptionsTabProps {
    clientId: number;
}

export default function PolicyExceptionsTab({ clientId }: PolicyExceptionsTabProps) {
    const [selectedException, setSelectedException] = useState<any>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState("pending");
    const [searchQuery, setSearchQuery] = useState("");

    const { data: exceptions, isLoading, refetch } = trpc.policyManagement.getExceptions.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const handleReviewClick = (exception: any) => {
        setSelectedException(exception);
        setIsReviewOpen(true);
    };

    const filteredExceptions = exceptions?.filter((ex: any) => {
        const matchesStatus = statusFilter === "all" || ex.status === statusFilter;
        const matchesSearch =
            ex.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ex.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ex.policyName?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle>Policy Exceptions</CardTitle>
                            <CardDescription>
                                Manage and review employee requests for policy exceptions.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search employees or policies..."
                                    className="pl-8 h-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                            <TabsList>
                                <TabsTrigger value="pending">Pending Review</TabsTrigger>
                                <TabsTrigger value="approved">Approved</TabsTrigger>
                                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                                <TabsTrigger value="all">All Requests</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : !filteredExceptions?.length ? (
                        <div className="text-center p-12 border-2 border-dashed rounded-lg">
                            <div className="text-muted-foreground mb-2">No listing found</div>
                            <p className="text-sm text-muted-foreground">
                                {exceptions?.length ? "Try adjusting your filters." : "No policy exceptions found."}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Policy</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Expiration</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date Requested</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredExceptions.map((ex: any) => (
                                    <TableRow key={ex.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{ex.firstName} {ex.lastName}</span>
                                                <span className="text-xs text-muted-foreground">{ex.jobTitle}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium text-blue-600 hover:underline cursor-pointer">
                                                <a href={`/clients/${clientId}/policies/${ex.policyId}`} target="_blank" rel="noreferrer">
                                                    {ex.policyName}
                                                </a>
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={ex.reason}>
                                            {ex.reason}
                                        </TableCell>
                                        <TableCell>
                                            {ex.expirationDate ? format(new Date(ex.expirationDate), "MMM d, yyyy") : "Permanent"}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={ex.status} />
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(ex.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {ex.status === 'pending' && (
                                                <Button size="sm" variant="outline" onClick={() => handleReviewClick(ex)}>
                                                    Review
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ExceptionReviewDialog
                open={isReviewOpen}
                onOpenChange={setIsReviewOpen}
                exception={selectedException}
                onSuccess={() => {
                    setIsReviewOpen(false);
                    refetch();
                }}
            />
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'approved':
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
        case 'rejected':
            return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
        case 'pending':
            return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

function ExceptionReviewDialog({ open, onOpenChange, exception, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, exception: any, onSuccess: () => void }) {
    const [rejectionReason, setRejectionReason] = useState("");
    const utils = trpc.useUtils();

    const reviewMutation = trpc.policyManagement.reviewException.useMutation({
        onSuccess: (_data, variables) => {
            toast.success(variables.status === "approved" ? "Exception Approved." : "Exception Rejected.");
            utils.policyManagement.getExceptions.invalidate();
            onSuccess();
        },
        onError: (error) => {
            toast.error(`Error: ${error.message}`);
        }
    });

    const handleApprove = () => {
        if (!exception) return;
        reviewMutation.mutate({
            exceptionId: exception.id,
            status: "approved"
        });
    }

    const handleReject = () => {
        if (!exception) return;
        if (!rejectionReason) {
            toast.error("Please provide a reason for rejection");
            return;
        }
        reviewMutation.mutate({
            exceptionId: exception.id,
            status: "rejected",
            rejectionReason
        });
    }

    if (!exception) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Review Exception Request</DialogTitle>
                    <DialogDescription>
                        Review the details of this policy exception request.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-semibold text-muted-foreground">Employee:</span>
                            <div className="mt-1">{exception.firstName} {exception.lastName}</div>
                        </div>
                        <div>
                            <span className="font-semibold text-muted-foreground">Policy:</span>
                            <div className="mt-1">{exception.policyName}</div>
                        </div>
                        <div>
                            <span className="font-semibold text-muted-foreground">Requested Date:</span>
                            <div className="mt-1">{format(new Date(exception.createdAt), "PPP")}</div>
                        </div>
                        <div>
                            <span className="font-semibold text-muted-foreground">Expiration:</span>
                            <div className="mt-1">{exception.expirationDate ? format(new Date(exception.expirationDate), "PPP") : "Permanent"}</div>
                        </div>
                    </div>

                    <div className="bg-muted p-3 rounded-md">
                        <span className="font-semibold text-xs text-muted-foreground uppercase">Reason for Exception</span>
                        <p className="mt-1 text-sm">{exception.reason}</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reject-reason">Rejection Reason (Required if rejecting)</Label>
                        <Textarea
                            id="reject-reason"
                            placeholder="Explain why this request is being rejected..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="destructive" onClick={handleReject} disabled={reviewMutation.isPending}>
                        {reviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                        Reject
                    </Button>
                    <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={reviewMutation.isPending}>
                        {reviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Approve
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
