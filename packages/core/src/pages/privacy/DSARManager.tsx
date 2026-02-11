
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { trpc } from "@/lib/trpc";
import { Users, Filter, Plus, Clock, Search, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useClientContext } from "@/contexts/ClientContext";
import { useState } from "react";
import { PageGuide } from "@/components/PageGuide";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@complianceos/ui/ui/dialog";
import { Label } from "@complianceos/ui/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Badge } from "@complianceos/ui/ui/badge";
import { format } from "date-fns";

export default function DSARManager() {
    const [, setLocation] = useLocation();
    const { selectedClientId } = useClientContext();
    const [createOpen, setCreateOpen] = useState(false);

    const { data: requests, isLoading, refetch } = trpc.privacy.getDsarRequests.useQuery(
        { clientId: selectedClientId },
        { enabled: !!selectedClientId }
    );

    const createMutation = trpc.privacy.createDsarRequest.useMutation({
        onSuccess: () => {
            toast.success("DSAR Request Logged");
            setCreateOpen(false);
            refetch();
        }
    });

    return (
        <div className="w-full max-w-full p-6 space-y-6 h-full flex flex-col">
            <Breadcrumb
                items={[
                    { label: "Dashboard", path: "/dashboard" },
                    { label: "Privacy", path: `/clients/${selectedClientId}/privacy` },
                    { label: "DSAR Manager" },
                ]}
            />

            <div className="flex items-center justify-between animate-slide-down">
                <PageGuide
                    title="DSAR Manager"
                    description="Handle Data Subject Access Requests within statutory timelines."
                    rationale="Fulfil individual rights (access, deletion) under GDPR/CCPA."
                    howToUse={[
                        { step: "Log", description: "Record new requests from emails or portals." },
                        { step: "Verify", description: "Confirm identity to prevent data leakage." },
                        { step: "Respond", description: "Gather data and generate response packages." }
                    ]}
                />
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Log New Request
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Log New DSAR</DialogTitle>
                            <DialogDescription>Enter details of the request received from a data subject.</DialogDescription>
                        </DialogHeader>
                        <NewDsarForm
                            onSubmit={(data: any) => createMutation.mutate({ ...data, clientId: selectedClientId })}
                            loading={createMutation.isPending}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">New Requests</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold">
                        {requests?.filter(r => r.status === 'New').length || 0}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold">
                        {requests?.filter(r => ['In Progress', 'Verifying Identity', 'Review'].includes(r.status || '')).length || 0}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-red-600">
                        {requests?.filter(r => r.dueDate && new Date(r.dueDate) < new Date() && !['Completed', 'Rejected'].includes(r.status || '')).length || 0}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">Completed (YTD)</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-green-600">
                        {requests?.filter(r => r.status === 'Completed').length || 0}
                    </CardContent>
                </Card>
            </div>

            <Card className="flex-1 flex flex-col">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Request Queue</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading requests...</div>
                    ) : !requests || requests.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No requests found.</div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map(req => (
                                <DsarRow key={req.id} request={req} onSuccess={() => refetch()} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function NewDsarForm({ onSubmit, loading }: any) {
    const [formData, setFormData] = useState({
        requestType: "Access",
        subjectEmail: "",
        subjectName: "",
        requestDate: format(new Date(), "yyyy-MM-dd"), // Default "today"
        dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"), // Default +30 days
        submissionMethod: "email",
        priority: "medium"
    });

    return (
        <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Request Type</Label>
                    <Select value={formData.requestType} onValueChange={v => setFormData({ ...formData, requestType: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Access">Right to Access</SelectItem>
                            <SelectItem value="Deletion">Right to Erasure (Deletion)</SelectItem>
                            <SelectItem value="Rectification">Rectification</SelectItem>
                            <SelectItem value="Portability">Data Portability</SelectItem>
                            <SelectItem value="Restriction">Restriction of Processing</SelectItem>
                            <SelectItem value="Objection">Objection</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Received Date</Label>
                    <Input type="date" value={formData.requestDate} onChange={e => setFormData({ ...formData, requestDate: e.target.value })} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Submission Method</Label>
                    <Select value={formData.submissionMethod} onValueChange={v => setFormData({ ...formData, submissionMethod: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="form">Web Form</SelectItem>
                            <SelectItem value="portal">Privacy Portal</SelectItem>
                            <SelectItem value="manual">Manual Entry</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={v => setFormData({ ...formData, priority: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Subject Email</Label>
                <Input value={formData.subjectEmail} onChange={e => setFormData({ ...formData, subjectEmail: e.target.value })} placeholder="requester@example.com" />
            </div>

            <div className="space-y-2">
                <Label>Subject Name (Optional)</Label>
                <Input value={formData.subjectName} onChange={e => setFormData({ ...formData, subjectName: e.target.value })} placeholder="John Doe" />
            </div>

            <Button
                className="w-full mt-2"
                onClick={() => {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!formData.subjectEmail || !emailRegex.test(formData.subjectEmail)) {
                        toast.error("Valid Subject Email is required");
                        return;
                    }
                    onSubmit(formData);
                }}
                disabled={loading}
            >
                {loading ? "Creating..." : "Create Request"}
            </Button>
        </div>
    );
}

function DsarRow({ request, onSuccess }: { request: any, onSuccess: () => void }) {
    const [, setLocation] = useLocation();
    const { selectedClientId } = useClientContext();

    const StatusBadge = ({ status }: { status: string }) => {
        let color = "bg-slate-100 text-slate-700";
        if (status === "New") color = "bg-blue-100 text-blue-700";
        if (status === "In Progress") color = "bg-purple-100 text-purple-700";
        if (status === "Completed") color = "bg-green-100 text-green-700";
        if (status === "Rejected") color = "bg-red-100 text-red-700";

        return <Badge className={`${color} border-none`}>{status}</Badge>;
    };

    return (
        <div
            onClick={() => setLocation(`/clients/${selectedClientId}/privacy/dsar/${request.id}`)}
            className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white"
        >
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{request.requestId}</span>
                        <Badge variant="outline">{request.requestType}</Badge>
                        {request.priority === 'critical' && <Badge variant="destructive" className="ml-1">Critical</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{request.subjectEmail} • {new Date(request.requestDate).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Due By</div>
                    <div className={`font-semibold ${request.dueDate && new Date(request.dueDate) < new Date() && request.status !== 'Completed' ? 'text-red-600' : ''}`}>
                        {request.dueDate ? new Date(request.dueDate).toLocaleDateString() : "-"}
                    </div>
                </div>
                <StatusBadge status={request.status} />
            </div>
        </div>
    );
}

