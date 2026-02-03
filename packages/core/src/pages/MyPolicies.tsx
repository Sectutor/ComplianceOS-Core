
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Loader2, CheckCircle, FileText, AlertCircle, Eye, Clock } from "lucide-react";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { ExceptionRequestDialog } from "@/components/policy/ExceptionRequestDialog";
import ReactMarkdown from 'react-markdown';
import { useAuth } from "@/contexts/AuthContext";

export default function MyPolicies() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const { session } = useAuth();
    // In a real app, we'd get the employee ID from the session or context reliably.
    // For now, let's assume the session has user.id, but we need the *Employee* ID.
    // We might need to fetch the employee record for the current user.
    // For this prototype, I'll fetch the first employee record matching the user email or just list them.
    // Since I don't have easy "User -> Employee" mapping in context yet, I'll use a mocked employeeId or fetch it?
    // Let's assume the user IS an employee and we can find them by email.

    const { data: me } = (trpc.users as any).me.useQuery();
    const { data: employee } = (trpc.employees as any).getByEmail.useQuery(
        { email: me?.email || "", clientId },
        { enabled: !!me?.email && !!clientId }
    );

    const employeeId = employee?.id || 0;

    const { data, isLoading, refetch } = (trpc.policyManagement as any).getMyPolicies.useQuery(
        { clientId, employeeId },
        { enabled: clientId > 0 && employeeId > 0 }
    );

    const [viewPolicy, setViewPolicy] = useState<any | null>(null);
    const [isExceptionDialogOpen, setIsExceptionDialogOpen] = useState(false);
    const [exceptionPolicyId, setExceptionPolicyId] = useState<number | null>(null);

    const attestMutation = (trpc.policyManagement as any).attestPolicy.useMutation({
        onSuccess: () => {
            toast.success("Policy attested successfully");
            setViewPolicy(null);
            refetch();
        },
        onError: (e: any) => toast.error(e.message)
    });

    const viewMutation = (trpc.policyManagement as any).viewPolicy.useMutation({
        onSuccess: () => {
            refetch();
        }
    });

    const handleOpenPolicy = (assignment: any) => {
        // Fetch full content if needed, or just use what we have (we might need to fetch content separately if it's large)
        // For now, let's assume we need to fetch the policy content.
        setViewPolicy({ ...assignment, isLoadingContent: true });

        // Trigger view status
        if (assignment.status === 'pending') {
            viewMutation.mutate({ assignmentId: assignment.assignmentId });
        }
    };

    // We need a separate component or effect to fetch content when viewPolicy is set
    // Or simpler: just fetch it in the dialog using a query.

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <Breadcrumb
                    items={[
                        { label: "Clients", href: "/clients" },
                        { label: "Client Workspace", href: `/clients/${clientId}` },
                        { label: "My Policies" },
                    ]}
                />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">My Policy Center</h1>
                        <p className="text-muted-foreground">Review and attest to company policies.</p>
                    </div>
                    {/* Stats */}
                    <div className="flex gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{data?.assignments.filter((a: any) => a.status === 'pending').length || 0}</div>
                            <div className="text-xs text-muted-foreground">To Do</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{data?.assignments.filter((a: any) => a.status === 'attested').length || 0}</div>
                            <div className="text-xs text-muted-foreground">Completed</div>
                        </div>
                    </div>
                </div>

                {employeeId === 0 && !isLoading && (
                    <Card className="bg-destructive/10 border-destructive/20">
                        <CardContent className="pt-6">
                            <p className="text-destructive">Could not find your employee record for this client. Please ensure your email matches an employee record.</p>
                        </CardContent>
                    </Card>
                )}

                {(isLoading || !data) && employeeId > 0 ? (
                    <div className="space-y-4">
                        <div className="h-12 w-full bg-muted animate-pulse rounded" />
                        <div className="h-64 w-full bg-muted animate-pulse rounded" />
                    </div>
                ) : (
                    <Tabs defaultValue="todo" className="w-full">
                        <TabsList>
                            <TabsTrigger value="todo" className="relative">
                                To Do
                                {data?.assignments.filter((a: any) => a.status === 'pending' || a.status === 'viewed').length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="attested">Attested</TabsTrigger>
                            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
                        </TabsList>

                        <TabsContent value="todo" className="mt-4">
                            <div className="grid gap-4">
                                {data?.assignments.filter((a: any) => a.status === 'pending' || a.status === 'viewed').length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                                        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                                        <h3 className="text-lg font-semibold text-foreground">All caught up!</h3>
                                        <p>You have no pending policy attestations.</p>
                                    </div>
                                )}
                                {data?.assignments.filter((a: any) => a.status === 'pending' || a.status === 'viewed').map((assignment: any) => (
                                    <Card key={assignment.assignmentId}>
                                        <CardContent className="flex items-center justify-between p-6">
                                            <div className="flex items-start gap-4">
                                                <div className="bg-primary/10 p-2 rounded">
                                                    <FileText className="h-6 w-6 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg">{assignment.policyName}</h3>
                                                    <p className="text-sm text-muted-foreground mb-2">Version {assignment.version}</p>
                                                    <div className="flex gap-2">
                                                        <Badge variant={assignment.status === 'viewed' ? 'secondary' : 'default'} className={assignment.status === 'pending' ? 'bg-orange-500 hover:bg-orange-600' : ''}>
                                                            {assignment.status === 'viewed' ? 'In Progress' : 'Action Required'}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground flex items-center">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" onClick={() => {
                                                    setExceptionPolicyId(assignment.policyId);
                                                    setIsExceptionDialogOpen(true);
                                                }}>
                                                    Request Exception
                                                </Button>
                                                <Button onClick={() => handleOpenPolicy(assignment)}>
                                                    Review & Attest
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="attested" className="mt-4">
                            <div className="grid gap-4">
                                {data?.assignments.filter((a: any) => a.status === 'attested').map((assignment: any) => (
                                    <Card key={assignment.assignmentId}>
                                        <CardContent className="flex items-center justify-between p-6">
                                            <div className="flex items-start gap-4">
                                                <div className="bg-green-100 p-2 rounded">
                                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg">{assignment.policyName}</h3>
                                                    <p className="text-sm text-muted-foreground">Version {assignment.version}</p>
                                                    <p className="text-xs text-green-600 mt-1 font-medium">
                                                        Attested on {new Date(assignment.attestedAt!).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => handleOpenPolicy(assignment)}>
                                                View Policy
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                                {data?.assignments.filter((a: any) => a.status === 'attested').length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">No attested policies yet.</div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="exceptions" className="mt-4">
                            <div className="grid gap-4">
                                {data?.exceptions.map((ex: any) => (
                                    <Card key={ex.id}>
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant={ex.status === 'approved' ? 'default' : ex.status === 'rejected' ? 'destructive' : 'outline'}>
                                                            {ex.status.toUpperCase()}
                                                        </Badge>
                                                        <span className="text-sm text-muted-foreground">Requested on {new Date(ex.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="font-medium">Reason:</p>
                                                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded mt-1">{ex.reason}</p>
                                                    {ex.expirationDate && (
                                                        <p className="text-xs text-red-500 mt-2 font-semibold">Expires: {new Date(ex.expirationDate).toLocaleDateString()}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {data?.exceptions.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">No active exception requests.</div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}

                <PolicyViewDialog
                    assignment={viewPolicy}
                    open={!!viewPolicy}
                    onOpenChange={(open) => !open && setViewPolicy(null)}
                    onAttest={() => attestMutation.mutate({ assignmentId: viewPolicy.assignmentId })}
                    isAttesting={attestMutation.isPending}
                />

                {exceptionPolicyId && (
                    <ExceptionRequestDialog
                        open={isExceptionDialogOpen}
                        onOpenChange={setIsExceptionDialogOpen}
                        policyId={exceptionPolicyId}
                        employeeId={employeeId}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}

function PolicyViewDialog({ assignment, open, onOpenChange, onAttest, isAttesting }: { assignment: any, open: boolean, onOpenChange: (o: boolean) => void, onAttest: () => void, isAttesting: boolean }) {
    // Fetch content
    const { data: policy } = (trpc.clientPolicies as any).get.useQuery(
        { id: assignment?.policyId || 0 },
        { enabled: !!assignment?.policyId }
    );

    return (
        <EnhancedDialog
            open={open}
            onOpenChange={onOpenChange}
            title={assignment?.policyName}
            description="Please read carefully."
            className="max-w-4xl max-h-[90vh] overflow-y-auto"
            trigger={null}
            footer={
                <div className="flex justify-between w-full items-center bg-background py-2">
                    <p className="text-xs text-muted-foreground">By clicking attest, you certify that you have read and understood this policy.</p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                        {assignment?.status !== 'attested' && (
                            <Button onClick={onAttest} disabled={isAttesting}>
                                {isAttesting ? "Attesting..." : "I Attest"}
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            <div className="py-4 space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none border p-4 rounded-md h-[60vh] overflow-y-auto bg-card">
                    {policy?.clientPolicy.content ? (
                        <ReactMarkdown>{policy.clientPolicy.content}</ReactMarkdown>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    )}
                </div>
            </div>
        </EnhancedDialog>
    );
}
