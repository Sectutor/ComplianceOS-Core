import { useState, useEffect } from "react";
import { Label } from "@complianceos/ui/ui/label";

import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";
import { EvidenceLibraryDialog } from "@/components/EvidenceLibraryDialog";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@complianceos/ui/ui/avatar";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Separator } from "@complianceos/ui/ui/separator";
import { Textarea } from "@complianceos/ui/ui/textarea";
import {
    CheckCircle2,
    Circle,
    Clock,
    FileText,
    MessageSquare,
    AlertCircle,
    Search,
    Filter,
    Download,
    MoreHorizontal,
    ArrowLeft,
    Briefcase,
    Mail,
    Shield,
    LayoutDashboard,
    AlertTriangle,
    Check,
    X,
    ArrowRight,
    RotateCw,
    Trash2,
    Plus,
    Loader2,
    Upload
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Input } from "@complianceos/ui/ui/input";
import { toast } from "sonner";
import AuditorLayout from "@/components/AuditorLayout";
import { useAuth } from "@/contexts/AuthContext";
import { CircularProgress } from "@complianceos/ui/ui/circular-progress";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@complianceos/ui/ui/dialog";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@complianceos/ui/ui/alert-dialog";
import { Suspense, lazy } from 'react';
import { Slot, SlotNames } from "@/registry";

const EvidenceFileUpload = lazy(() => import('@/components/EvidenceFileUpload'));

export default function AuditHub() {
    const [match, params] = useRoute("/clients/:clientId/audit-hub");
    const clientId = params?.clientId ? parseInt(params.clientId) : 0;
    const [activeSection, setActiveSection] = useState('pbc'); // 'overview', 'pbc', 'findings'
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [activeFramework, setActiveFramework] = useState("ISO 27001");

    const { user } = useAuth();
    // Determine if we should show the Auditor View (Restricted Clean Room)
    // Check for 'auditor' role or explicit 'view=auditor' query param for testing/admin preview
    const isAuditorView = user?.user_metadata?.role === 'auditor' || window.location.search.includes('view=auditor');
    const Layout = isAuditorView ? AuditorLayout : DashboardLayout;

    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const inviteMutation = trpc.audit.inviteAuditor.useMutation({
        onSuccess: () => {
            toast.success("Invitation sent successfully");
            setInviteOpen(false);
            setInviteEmail("");
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    const handleInvite = () => {
        if (!inviteEmail) return;
        inviteMutation.mutate({
            clientId: clientId,
            email: inviteEmail
        });
    };

    const isAdmin = user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'owner';

    // Live Data Fetching
    const { data: frameworksData } = trpc.evidence.getFrameworks.useQuery();
    console.log('[AuditHub] Frameworks Data:', frameworksData);

    const { data: evidenceData, isLoading: isEvidenceLoading, refetch: refetchList } = trpc.evidence.list.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    // Fetch files for selected request
    const { data: evidenceFiles, isLoading: isFilesLoading, refetch: refetchFiles } = trpc.evidence.getFiles.useQuery(
        { evidenceId: (selectedRequest as any)?.original?.id || 0 },
        { enabled: !!(selectedRequest as any)?.original?.id }
    );

    // Fetch counts for sidebar
    const { data: findings } = trpc.findings.list.useQuery({ clientId }, { enabled: !!clientId });
    const { data: comments } = trpc.evidence.getAllComments.useQuery({ clientId }, { enabled: !!clientId });

    const utils = trpc.useContext();
    const initializeMutation = trpc.evidence.seed.useMutation({
        onSuccess: () => {
            toast.success("Audit workspace initialized with request list.");
            utils.evidence.list.invalidate();
        }
    });

    const handleInitialize = () => {
        initializeMutation.mutate({
            clientId,
            framework: activeFramework
        });
    };

    const [createRequestOpen, setCreateRequestOpen] = useState(false);
    const [newRequestData, setNewRequestData] = useState({
        evidenceId: '',
        description: '',
        clientControlId: '',
        owner: '',
        dueDate: ''
    });

    const [fileToDelete, setFileToDelete] = useState<any>(null);

    // Link Integration State
    const [libraryOpen, setLibraryOpen] = useState(false);

    const [linkOpen, setLinkOpen] = useState(false);
    const [linkData, setLinkData] = useState({ provider: 'github', resourceId: '' });
    const linkMutation = trpc.evidence.linkIntegration.useMutation({
        onSuccess: () => {
            toast.success("Integration Linked Successfully");
            setLinkOpen(false);
            setLinkData({ provider: 'github', resourceId: '' });
            utils.evidence.list.invalidate(); // Refresh list to show status change
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    const fileDeleteMutation = trpc.evidenceFiles.delete.useMutation({
        onSuccess: () => {
            toast.success("File removed successfully");
            refetchFiles();
            utils.evidence.list.invalidate();
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    const createFileMutation = trpc.evidenceFiles.create.useMutation({
        onSuccess: () => {
            refetchFiles();
            utils.evidence.list.invalidate();
        },
        onError: (error) => toast.error(error.message),
    });

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const evidenceId = (selectedRequest as any)?.original?.id;
        if (!evidenceId) return;

        for (const file of files) {
            try {
                const reader = new FileReader();
                const uploadPromise = new Promise<void>((resolve, reject) => {
                    reader.onload = async () => {
                        try {
                            const base64 = (reader.result as string).split(',')[1];
                            const timestamp = Date.now();
                            const randomSuffix = Math.random().toString(36).substring(2, 8);
                            const extension = file.name.split('.').pop() || '';
                            const filename = `evidence-${evidenceId}-${timestamp}-${randomSuffix}.${extension}`;

                            const response = await fetch('/api/upload', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    filename,
                                    data: base64,
                                    contentType: file.type,
                                    folder: 'evidence'
                                }),
                            });

                            if (!response.ok) throw new Error('Upload failed');
                            const { key, url } = await response.json();

                            await createFileMutation.mutateAsync({
                                evidenceId,
                                filename,
                                originalFilename: file.name,
                                mimeType: file.type,
                                size: file.size,
                                fileKey: key,
                                url,
                            });
                            resolve();
                        } catch (err) { reject(err); }
                    };
                    reader.readAsDataURL(file);
                });
                toast.promise(uploadPromise, {
                    loading: `Uploading ${file.name}...`,
                    success: `${file.name} uploaded successfully`,
                    error: `Failed to upload ${file.name}`
                });
                await uploadPromise;
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleLink = () => {
        if (!selectedRequest || !linkData.resourceId) return;
        linkMutation.mutate({
            evidenceId: selectedRequest.original.id,
            provider: linkData.provider,
            resourceId: linkData.resourceId
        });
    };

    // Fetch latest audit for auditor details
    const { data: audits } = trpc.audit.list.useQuery({ clientId }, { enabled: !!clientId });
    const activeAudit = audits?.[0]; // Get the latest one

    const getInitials = (name: string) => {
        return name
            ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            : '??';
    };

    const createEvidenceMutation = trpc.evidence.create.useMutation({
        onSuccess: () => {
            toast.success("Evidence request created successfully");
            setCreateRequestOpen(false);
            setNewRequestData({
                evidenceId: '',
                description: '',
                clientControlId: '',
                owner: '',
                dueDate: ''
            });
            refetchList();
        },
        onError: (err) => {
            toast.error("Failed to create request: " + err.message);
        }
    });

    const { data: clientControlsList } = trpc.clientControls.list.useQuery({ clientId }, { enabled: createRequestOpen });

    const handleCreateRequest = () => {
        if (!newRequestData.description || !newRequestData.clientControlId) {
            toast.error("Description and Control are required");
            return;
        }

        createEvidenceMutation.mutate({
            clientId,
            clientControlId: parseInt(newRequestData.clientControlId),
            evidenceId: newRequestData.evidenceId || `MANUAL-${Date.now().toString().slice(-4)}`,
            description: newRequestData.description,
            owner: newRequestData.owner,
            // dueDate: newRequestData.dueDate // Not supported by backend yet, but UI is there
        });
    };

    const updateStatusMutation = trpc.evidence.updateStatus.useMutation({
        onSuccess: () => {
            toast.success("Audit status updated");
            refetchList();
            if (selectedRequest) {
                // Update local state if needed
            }
        },
        onError: (err) => {
            toast.error("Failed to update status: " + err.message);
        }
    });

    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState<any>(null);

    const deleteMutation = trpc.evidence.delete.useMutation({
        onSuccess: () => {
            toast.success("Evidence request deleted");
            refetchList();
            setSelectedRequest(null);
            setDeleteConfirmationOpen(false);
            setRequestToDelete(null);
        },
        onError: (err) => {
            toast.error("Failed to delete request: " + err.message);
        }
    });

    const confirmDelete = (e: React.MouseEvent, req: any) => {
        e.stopPropagation();
        setRequestToDelete(req);
        setDeleteConfirmationOpen(true);
    };

    const executeDelete = () => {
        if (requestToDelete) {
            deleteMutation.mutate({ id: requestToDelete.original.id });
        }
    };

    const handleStatusUpdate = (status: 'verified' | 'rejected') => {
        if (!selectedRequest?.original?.id) return;
        updateStatusMutation.mutate({
            evidenceId: selectedRequest.original.id,
            status
        });

        // Optimistically update
        setSelectedRequest({
            ...selectedRequest,
            status: status === 'verified' ? 'Accepted' : 'Returned'
        });
    };

    const auditRequests = evidenceData?.map((e: any) => ({
        id: e.evidenceId || `EV-${e.id}`, // Use reliable DB ID reference if possible
        title: e.title || 'Untitled Request',
        control: e.control?.controlCode || 'General',
        status: e.status === 'verified' ? 'Accepted' : e.status === 'collected' ? 'In Review' : 'Open',
        comments: 0,
        evidence: e.fileCount || 0,
        dueDate: e.dueDate || null,
        description: e.description,
        original: e
    })) || [];

    // Derived State
    const displayRequests = auditRequests.filter(req => {
        const matchesStatus = filterStatus === 'all' || req.status.toLowerCase() === filterStatus.toLowerCase();

        // Robust framework matching
        const itemFramework = req.original.framework?.toString().trim().toLowerCase();
        const targetFramework = activeFramework.trim().toLowerCase();

        const matchesFramework = (!itemFramework && targetFramework === 'iso 27001') ||
            (itemFramework === targetFramework) ||
            targetFramework === 'all' ||
            (itemFramework === 'custom') ||
            (!itemFramework);

        return matchesStatus && matchesFramework;
    });

    // Auto-select first item if list is populated and nothing is selected
    // THIS FIXES THE "I DON'T SEE THE LIST" CONFUSION
    useEffect(() => {
        if (displayRequests.length > 0 && !selectedRequest) {
            setSelectedRequest(displayRequests[0]);
            // Force view to list if we are auto-selecting
            setActiveSection('pbc');
        }
    }, [displayRequests, selectedRequest]); // Runs when list updates or selection is cleared

    const stats = {
        total: auditRequests.length,
        accepted: auditRequests.filter(r => r.status === 'Accepted').length,
        review: auditRequests.filter(r => r.status === 'In Review').length,
        open: auditRequests.filter(r => r.status === 'Open').length,
    };

    const progress = stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Accepted': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'In Review': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Returned': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Open': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <Layout>
            <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-slate-50/50 overflow-hidden">

                {/* 1. Universal Header (Audit Context) - Professionally Redesigned */}
                <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-40 relative shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#0f172a] h-9 w-9 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-slate-900/5">
                                <Shield className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="font-bold text-slate-900 leading-tight tracking-tight">AuditWorkspace™</h1>
                                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Secure Clean Room</div>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-slate-200" />

                        {/* Framework Selector Dropdown */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Compliance Standard</span>
                            <Select value={activeFramework} onValueChange={setActiveFramework}>
                                <SelectTrigger className="w-[180px] h-9 bg-slate-50 border-slate-200 text-xs font-semibold text-slate-700">
                                    <SelectValue placeholder="Select Framework" />
                                </SelectTrigger>
                                <SelectContent>
                                    {frameworksData?.map((fw: any) => (
                                        <SelectItem key={fw.id} value={fw.id} className="text-xs">
                                            {fw.name}
                                        </SelectItem>
                                    ))}
                                    {(!frameworksData || frameworksData.length === 0) && (
                                        <SelectItem value="ISO 27001" className="text-xs">ISO 27001</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-slate-800">{activeFramework} Sync</span>
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal bg-slate-50 text-slate-600 border-slate-200">FY2025</Badge>
                            </div>
                            <span className="text-xs text-slate-500">Client ID: #{clientId}</span>
                        </div>
                    </div>

                    {/* Readiness Header Progress */}
                    {(() => {
                        const total = displayRequests.length;
                        const accepted = displayRequests.filter(r => r.status === 'Accepted').length;
                        const score = total > 0 ? Math.round((accepted / total) * 100) : 0;
                        return (
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
                                    <div className="text-right">
                                        <div className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Audit Status</div>
                                        <div className="text-sm font-bold text-slate-700">{score}% Verified</div>
                                    </div>
                                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${score}%` }} />
                                    </div>
                                </div>

                                {isAdmin && (
                                    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-9 gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium">
                                                <Mail className="h-4 w-4 text-slate-400" />
                                                <span>Invite Auditor</span>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>Invite External Auditor</DialogTitle>
                                                <DialogDescription>
                                                    Send a secure link to an external auditor to review evidence for this client.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <label htmlFor="email" className="text-sm font-medium">Auditor Email</label>
                                                    <Input
                                                        id="email"
                                                        value={inviteEmail}
                                                        onChange={(e) => setInviteEmail(e.target.value)}
                                                        placeholder="auditor@firm.com"
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                                                <Button onClick={handleInvite} disabled={inviteMutation.isLoading}>
                                                    {inviteMutation.isLoading ? "Sending..." : "Send Invitation"}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                        );
                    })()}
                </header>

                {/* 2. Three-Pane Workspace */}
                <div className="flex-1 flex overflow-hidden">

                    {/* PANE 1: Navigation Sidebar (240px) */}
                    <nav className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 relative z-30">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4 pr-2">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workspace</div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 hover:bg-slate-200 rounded-full"
                                    onClick={() => setCreateRequestOpen(true)}
                                    title="Add Manual Request"
                                >
                                    <Plus className="h-3.5 w-3.5 text-slate-500" />
                                </Button>
                            </div>

                            {/* Sidebar Readiness Gauge */}
                            {(() => {
                                const total = displayRequests.length;
                                const accepted = displayRequests.filter(r => r.status === 'Accepted').length;
                                const score = total > 0 ? Math.round((accepted / total) * 100) : 0;

                                const getPhase = (s: number) => {
                                    if (s === 0) return "Not Started";
                                    if (s < 30) return "Planning";
                                    if (s < 70) return "Evidence Collection";
                                    if (s < 100) return "Final Review";
                                    return "Audit Ready";
                                };

                                return (
                                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm mb-6 flex flex-col items-center text-center">
                                        <CircularProgress
                                            value={score}
                                            size={72}
                                            strokeWidth={6}
                                            color="text-indigo-600"
                                            className="mb-3"
                                        />
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Audit Readiness</div>
                                        <div className="text-sm font-extrabold text-slate-900 mb-1">{getPhase(score)}</div>
                                        <div className="text-[10px] text-slate-500 font-medium">
                                            {accepted} / {total} Verified
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="space-y-1">
                                <NavButton
                                    active={activeSection === 'overview'}
                                    onClick={() => setActiveSection('overview')}
                                    icon={LayoutDashboard}
                                    label="Overview"
                                />
                                <NavButton
                                    active={activeSection === 'pbc'}
                                    onClick={() => setActiveSection('pbc')}
                                    icon={CheckCircle2}
                                    label="PBC Inbox"
                                    count={displayRequests.length}
                                />
                                <NavButton
                                    active={activeSection === 'findings'}
                                    onClick={() => setActiveSection('findings')}
                                    icon={AlertCircle}
                                    label="Findings"
                                    count={findings?.length ?? 0}
                                />
                                <NavButton
                                    active={activeSection === 'discussions'}
                                    onClick={() => setActiveSection('discussions')}
                                    icon={MessageSquare}
                                    label="Discussions"
                                    count={comments?.length || 0}
                                />
                            </div>
                        </div>

                        {/* Auditor Branding/Contact */}
                        <div className="mt-auto p-6 border-t border-slate-200">
                            {activeAudit ? (
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <Avatar className="h-9 w-9 border-2 border-slate-50 bg-slate-100">
                                        <AvatarFallback className="text-xs font-bold text-slate-600">
                                            {getInitials(activeAudit.auditorName || "Unknown")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-900 truncate">{activeAudit.auditorName || "Auditor Assigned"}</div>
                                        <div className="text-[10px] text-slate-500 truncate">{activeAudit.auditFirm || "External Audit"}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center">
                                    <p className="text-[10px] text-slate-400 font-medium mb-2">No active audit detected</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-7 text-[10px] bg-white"
                                        onClick={() => setInviteOpen(true)}
                                    >
                                        Invite Auditor
                                    </Button>
                                </div>
                            )}
                        </div>

                    </nav>

                    {activeSection === 'pbc' && (
                        <div className="w-96 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-sm h-full max-h-full overflow-hidden">

                            {/* Inbox Toolbar */}
                            <div className="p-4 border-b border-slate-100 space-y-3 bg-white/50 backdrop-blur-sm sticky top-0">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-bold text-slate-800 text-sm tracking-tight">Evidence Requests</h2>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 text-slate-400 hover:text-indigo-600"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleInitialize();
                                            }}
                                            disabled={initializeMutation.isLoading}
                                            title="Sync Standard Requests"
                                        >
                                            <RotateCw className={cn("h-3 w-3", initializeMutation.isLoading && "animate-spin")} />
                                        </Button>
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0 text-[10px] h-5">{displayRequests.length}</Badge>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                        <Input
                                            placeholder="Search by ID or title..."
                                            className="pl-8 bg-slate-50 border-slate-200 h-9 text-xs focus-visible:ring-indigo-500"
                                        />
                                    </div>
                                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                                        <SelectTrigger className="w-[110px] h-9 text-xs bg-white border-slate-200">
                                            <div className="flex items-center gap-2">
                                                <Filter className="h-3 w-3 text-slate-400" />
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="Open">Open</SelectItem>
                                            <SelectItem value="In Review">In Review</SelectItem>
                                            <SelectItem value="Accepted">Accepted</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-50/30 overflow-y-auto min-h-0">


                                {isEvidenceLoading ? (
                                    <div className="p-4 space-y-3">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="h-16 bg-white border border-slate-100 rounded-lg animate-pulse" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {displayRequests.length === 0 ? (
                                            <div className="p-8 text-center bg-slate-50/50 rounded-xl m-4 border border-slate-100">
                                                <div className="bg-white h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm ring-1 ring-slate-900/5">
                                                    <Shield className="h-6 w-6 text-indigo-500" />
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-900 mb-1">Standard Not Initialized</h3>
                                                <p className="text-xs text-slate-500 mb-6 max-w-[200px] mx-auto leading-relaxed">
                                                    No requests found for <span className="font-semibold text-slate-700">{activeFramework}</span>. Would you like to populate the standard request list?
                                                </p>
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm ring-1 ring-slate-900/10 gap-2 h-9"
                                                    onClick={handleInitialize}
                                                    disabled={initializeMutation.isLoading}
                                                >
                                                    {initializeMutation.isLoading ? (
                                                        <>
                                                            <RotateCw className="h-3.5 w-3.5 animate-spin" />
                                                            <span>Initializing...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            <span>Initialize {activeFramework}</span>
                                                        </>
                                                    )}
                                                </Button>
                                                <p className="text-[10px] text-slate-400 mt-4 italic">
                                                    This will import verified seed requests for this standard.
                                                </p>
                                            </div>
                                        ) : (
                                            displayRequests.map(req => (
                                                <div
                                                    key={req.id}
                                                    onClick={() => setSelectedRequest(req)}
                                                    className={cn(
                                                        "group px-4 py-3 cursor-pointer border-b border-slate-100 transition-colors relative",
                                                        selectedRequest?.id === req.id
                                                            ? "bg-white shadow-sm z-10"
                                                            : "bg-white/50 hover:bg-white"
                                                    )}
                                                >
                                                    {selectedRequest?.id === req.id && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-indigo-600" />
                                                    )}

                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <span className={cn(
                                                                "font-medium text-xs truncate max-w-[120px]",
                                                                selectedRequest?.id === req.id ? "text-indigo-700" : "text-slate-900"
                                                            )}>
                                                                {req.id}
                                                            </span>
                                                            {!req.status || req.status === 'pending' || req.status === 'Open' ? (
                                                                <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" title="Unread" />
                                                            ) : null}
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className={cn(
                                                                "text-[10px] whitespace-nowrap",
                                                                selectedRequest?.id === req.id ? "text-indigo-600/80" : "text-slate-400 group-hover:text-slate-500"
                                                            )}>
                                                                {req.dueDate ? new Date(req.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                                                            </span>
                                                            <button
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500"
                                                                onClick={(e) => confirmDelete(e, req)}
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className={cn(
                                                        "text-sm mb-1 leading-tight truncate pr-2",
                                                        selectedRequest?.id === req.id ? "font-bold text-slate-900" : "font-medium text-slate-700 group-hover:text-slate-900"
                                                    )}>
                                                        {req.title}
                                                    </div>

                                                    <div className="text-xs text-slate-500 line-clamp-1 mb-2.5 pr-4">
                                                        <span className="text-slate-400 mr-1">{req.framework || "General"}</span>
                                                        {req.description || "No description provided..."}
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <Badge variant="secondary" className={cn(
                                                            "text-[10px] h-4 px-1.5 font-normal bg-transparent border-0 p-0",
                                                            getStatusColor(req.status).replace("bg-", "text-").replace("/10", "")
                                                        )}>
                                                            {req.status}
                                                        </Badge>
                                                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                                            {req.evidence > 0 && (
                                                                <div className="flex items-center gap-1">
                                                                    <FileText className="h-3 w-3 text-slate-500" />
                                                                    <span>{req.evidence}</span>
                                                                </div>
                                                            )}
                                                            {req.comments > 0 && (
                                                                <div className="flex items-center gap-1">
                                                                    <MessageSquare className="h-3 w-3 text-slate-500" />
                                                                    <span>{req.comments}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Temporary Debug Info */}
                            <div className="p-2 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 font-mono">
                                Total: {evidenceData?.length || 0} | Shown: {displayRequests.length} | Client: {clientId}
                            </div>
                        </div>
                    )}

                    {/* PANE 3: Workspace / Detail / Overview */}
                    <div className="flex-1 bg-slate-50/30 flex flex-col h-full min-w-0 overflow-auto">
                        {activeSection === 'pbc' ? (
                            selectedRequest ? (
                                <>
                                    {/* Workspace Header - Redesigned */}
                                    <div className="bg-white border-b border-slate-200 px-8 py-6 flex items-start justify-between shrink-0 sticky top-0 z-30 shadow-sm">
                                        <div className="max-w-2xl">
                                            <div className="flex items-center gap-3 mb-3">
                                                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-mono tracking-tight text-[11px]">
                                                    {selectedRequest.control}
                                                </Badge>
                                                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Due {new Date(selectedRequest.dueDate).toLocaleDateString()}</span>
                                            </div>
                                            <h1 className="text-xl font-bold text-slate-900 mb-3 leading-tight">{selectedRequest.title}</h1>
                                            <p className="text-slate-600 text-sm leading-relaxed max-w-xl">
                                                {selectedRequest.description || "Please provide evidence demonstrating compliance with this control requirement. Ensure all documents are recent (within last 12 months) and approved by management."}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-3">
                                            {/* Status Badge - Big */}
                                            <Badge variant="outline" className={cn("px-3 py-1 text-xs font-semibold uppercase tracking-wider border", getStatusColor(selectedRequest.status))}>
                                                {selectedRequest.status}
                                            </Badge>

                                            {/* Primary Actions - Moved to Header */}
                                            {selectedRequest.status !== 'Accepted' && (
                                                <div className="flex gap-2 mt-2">
                                                    <Button variant="outline" size="sm" className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300 gap-2 font-medium" onClick={() => handleStatusUpdate('rejected')} disabled={updateStatusMutation.isLoading}>
                                                        <AlertCircle className="h-3.5 w-3.5" /> Return
                                                    </Button>
                                                    <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium shadow-sm" onClick={() => handleStatusUpdate('verified')} disabled={updateStatusMutation.isLoading}>
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Verify & Accept
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Workspace Content Tabs */}
                                    <Tabs defaultValue="evidence" className="flex-1 flex flex-col min-h-0">
                                        <div className="bg-white border-b px-8 sticky top-[calc(theme(spacing.24)+theme(spacing.10))] z-20">
                                            <TabsList className="bg-transparent h-12 w-full justify-start p-0 space-x-8">
                                                <TabsTrigger value="evidence" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 font-medium text-slate-500 hover:text-slate-700">Evidence Files</TabsTrigger>
                                                <TabsTrigger value="activity" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 font-medium text-slate-500 hover:text-slate-700">Activity & Discussion</TabsTrigger>
                                                <TabsTrigger value="audit-log" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 font-medium text-slate-500 hover:text-slate-700">Audit Log</TabsTrigger>
                                            </TabsList>
                                        </div>

                                        <div className="flex-1 overflow-auto bg-slate-50/50">
                                            <TabsContent value="evidence" className="m-0 p-8 max-w-5xl mx-auto w-full focus-visible:ring-0 outline-none">

                                                {/* Evidence Toolbar */}
                                                <div className="flex justify-between items-center mb-6">
                                                    <h3 className="text-lg font-semibold text-slate-900">Evidence Documentation</h3>
                                                    <div className="flex gap-2">
                                                        <Slot
                                                            name={SlotNames.EVIDENCE_TOOLBAR_ACTIONS}
                                                            props={{
                                                                evidenceId: selectedRequest.original.id,
                                                                controlName: selectedRequest.control,
                                                                controlDescription: selectedRequest.description || (selectedRequest as any).evidenceDescription || "No description provided"
                                                            }}
                                                        />

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2"
                                                            onClick={() => setLibraryOpen(true)}
                                                        >
                                                            <Search className="h-4 w-4" />
                                                            Select from Library
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2"
                                                            onClick={() => document.getElementById('audit-hub-upload-input')?.click()}
                                                        >
                                                            <Upload className="h-4 w-4" />
                                                            Upload New
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2"
                                                            onClick={() => setLinkOpen(true)}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            Link Integration
                                                        </Button>

                                                        <input
                                                            id="audit-hub-upload-input"
                                                            type="file"
                                                            className="hidden"
                                                            onChange={handleFileSelect}
                                                            multiple
                                                        />
                                                    </div>
                                                </div>

                                                {selectedRequest.evidence === 0 && !evidenceFiles?.length ? (
                                                    <div className="p-6">
                                                        <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading uploader...</div>}>
                                                            <EvidenceFileUpload
                                                                evidenceId={selectedRequest.original.id}
                                                                clientId={clientId}
                                                            />
                                                        </Suspense>
                                                    </div>
                                                ) : (
                                                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                                                        <Table>
                                                            <TableHeader className="bg-slate-50/50">
                                                                <TableRow className="hover:bg-transparent border-slate-100">
                                                                    <TableHead className="w-[40%] text-xs font-semibold text-slate-500 uppercase tracking-wider h-10">Filename / Resource</TableHead>
                                                                    <TableHead className="w-[20%] text-xs font-semibold text-slate-500 uppercase tracking-wider h-10">Date Uploaded</TableHead>
                                                                    <TableHead className="w-[15%] text-xs font-semibold text-slate-500 uppercase tracking-wider h-10">Type</TableHead>
                                                                    <TableHead className="w-[15%] text-xs font-semibold text-slate-500 uppercase tracking-wider h-10">Validation</TableHead>
                                                                    <TableHead className="w-[10%] text-right text-xs font-semibold text-slate-500 uppercase tracking-wider h-10">Action</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {isFilesLoading ? (
                                                                    <TableRow>
                                                                        <TableCell colSpan={5} className="h-24 text-center text-slate-400">Loading evidence...</TableCell>
                                                                    </TableRow>
                                                                ) : (
                                                                    evidenceFiles?.map((file: any) => (
                                                                        <TableRow key={file.id} className="hover:bg-slate-50/50 group border-slate-100 transition-colors">
                                                                            <TableCell className="font-medium text-slate-700 py-3">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="h-8 w-8 bg-indigo-50 rounded flex items-center justify-center shrink-0 border border-indigo-100 text-indigo-600">
                                                                                        {file.fileUrl ? <FileText className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
                                                                                    </div>
                                                                                    <button
                                                                                        className="truncate max-w-[240px] hover:text-indigo-600 hover:underline text-left transition-colors"
                                                                                        title={`Open ${file.filename}`}
                                                                                        onClick={() => file.fileUrl && window.open(file.fileUrl, '_blank')}
                                                                                    >
                                                                                        {file.filename}
                                                                                    </button>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="text-slate-500 text-xs">{new Date(file.createdAt).toLocaleDateString()} {new Date(file.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                                                            <TableCell className="text-slate-500 text-xs font-mono">{file.contentType || 'Integration'}</TableCell>
                                                                            <TableCell>
                                                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-100">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Safe
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="text-right">
                                                                                {file.fileUrl && (
                                                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => window.open(file.fileUrl, '_blank')}>
                                                                                        <Download className="h-4 w-4" />
                                                                                    </Button>
                                                                                )}
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                                                    onClick={() => setFileToDelete(file)}
                                                                                    disabled={fileDeleteMutation.isLoading}
                                                                                >
                                                                                    {fileDeleteMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                                                </Button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))
                                                                )}
                                                                {/* Also show linked integrations if stored differently or merged here */}
                                                                {selectedRequest.type === 'api' && (
                                                                    <TableRow className="hover:bg-slate-50/50 group border-slate-100 transition-colors">
                                                                        <TableCell className="font-medium text-slate-700 py-3">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="h-8 w-8 bg-blue-50 rounded flex items-center justify-center shrink-0 border border-blue-100 text-blue-600">
                                                                                    <RotateCw className="h-4 w-4" />
                                                                                </div>
                                                                                <span className="truncate max-w-[240px]">
                                                                                    Link Integration: {selectedRequest.location}
                                                                                </span>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="text-slate-500 text-xs">{new Date(selectedRequest.updatedAt).toLocaleDateString()}</TableCell>
                                                                        <TableCell className="text-slate-500 text-xs font-mono">API Link</TableCell>
                                                                        <TableCell>
                                                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Active
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="text-right">
                                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                    </Card>
                                                )}
                                            </TabsContent>

                                            {/* Activity Tab Content */}
                                            <TabsContent value="activity" className="m-0 p-8 max-w-4xl mx-auto w-full focus-visible:ring-0">
                                                <ChatSection request={selectedRequest} />
                                            </TabsContent>
                                        </div>
                                    </Tabs>
                                </>
                            ) : (
                                /* Empty State */
                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-slate-50/50">
                                    <div className="h-24 w-24 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 border border-slate-100">
                                        <Briefcase className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-700 mb-2">
                                        {displayRequests.length > 0 ? "Select a Request" : "Ready to Audit"}
                                    </h2>
                                    <p className="max-w-xs text-slate-500 text-sm mb-8 leading-relaxed">
                                        {displayRequests.length > 0
                                            ? "Select a request from the list on the left to view evidence, verify compliance, and leave findings."
                                            : "Initialize the workspace to generate the standard evidence request list for this framework."}
                                    </p>

                                    <div className="flex gap-3 mt-8">
                                        <Button variant="outline" className="gap-2 text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 h-9 text-sm">
                                            <Download className="h-4 w-4" /> Audit Methodology
                                        </Button>
                                        <Button
                                            className="gap-2 h-9 text-sm"
                                            onClick={handleInitialize}
                                            disabled={initializeMutation.isLoading}
                                        >
                                            {initializeMutation.isLoading ? "Updating..." : (displayRequests.length > 0 ? "Update Workspace" : "Initialize Workspace")}
                                        </Button>
                                    </div>
                                    {displayRequests.length > 0 && (
                                        <p className="text-[10px] text-slate-400 mt-4 max-w-sm">
                                            Tip: Click "Update Workspace" to add any missing standard requests for the selected framework without affecting existing work.
                                        </p>
                                    )}
                                </div>
                            )
                        ) : activeSection === 'overview' ? (
                            <AuditOverview
                                clientId={clientId}
                                onNavigate={(section, filter) => {
                                    setActiveSection(section);
                                    if (filter) setFilterStatus(filter);
                                }}
                            />
                        ) : activeSection === 'findings' ? (
                            <AuditFindings clientId={clientId} />
                        ) : activeSection === 'discussions' ? (
                            <AuditDiscussions clientId={clientId} />
                        ) : null}
                    </div>
                </div>
            </div>
            <Dialog open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="text-center text-lg font-bold text-slate-900">Delete Evidence Request?</DialogTitle>
                        <DialogDescription className="text-center text-sm text-slate-500 max-w-[300px] mx-auto leading-relaxed pt-2">
                            Are you sure you want to delete <span className="font-semibold text-slate-700">"{requestToDelete?.title}"</span>? This action cannot be undone and will remove all associated findings.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="grid grid-cols-2 gap-3 sm:space-x-0 pt-6">
                        <Button variant="outline" onClick={() => setDeleteConfirmationOpen(false)} className="h-10 font-medium border-slate-200 hover:bg-slate-50">Cancel</Button>
                        <Button variant="destructive" onClick={executeDelete} className="h-10 font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm ring-1 ring-red-700/10">
                            {deleteMutation.isLoading ? "Deleting..." : "Delete Request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Request Dialog */}
            <Dialog open={createRequestOpen} onOpenChange={setCreateRequestOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add Manual Evidence Request</DialogTitle>
                        <DialogDescription>
                            Create a new evidence request linked to a specific control.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Reference ID *</label>
                            <Input
                                value={newRequestData.evidenceId}
                                onChange={(e) => setNewRequestData({ ...newRequestData, evidenceId: e.target.value })}
                                placeholder="e.g. MANUAL-001"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Control *</label>
                            <Select
                                value={newRequestData.clientControlId}
                                onValueChange={(val) => setNewRequestData({ ...newRequestData, clientControlId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a control..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {clientControlsList?.map((item: any) => (
                                        <SelectItem key={item.clientControl.id} value={item.clientControl.id.toString()}>
                                            <span className="font-mono text-xs mr-2 text-slate-500">{item.control?.controlId || item.clientControl.clientControlId}</span>
                                            {item.control?.name || "Unknown Control"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Description *</label>
                            <Input
                                value={newRequestData.description}
                                onChange={(e) => setNewRequestData({ ...newRequestData, description: e.target.value })}
                                placeholder="Describe the evidence required..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Owner</label>
                                <Input
                                    value={newRequestData.owner}
                                    onChange={(e) => setNewRequestData({ ...newRequestData, owner: e.target.value })}
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Due Date</label>
                                <Input
                                    type="date"
                                    value={newRequestData.dueDate}
                                    onChange={(e) => setNewRequestData({ ...newRequestData, dueDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateRequestOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateRequest} disabled={createEvidenceMutation.isLoading}>
                            {createEvidenceMutation.isLoading ? "Creating..." : "Create Request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Auditor Invite Dialog */}
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite Auditor</DialogTitle>
                        <DialogDescription>
                            This will send an email invitation to the external auditor to access this specific clean room.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="col-span-3"
                                placeholder="auditor@firm.com"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                        <Button onClick={handleInvite} disabled={inviteMutation.isLoading || !inviteEmail}>
                            {inviteMutation.isLoading ? "Sending Invitation..." : "Send Invitation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Link Integration Dialog */}
            <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Link Automated Evidence</DialogTitle>
                        <DialogDescription>
                            Connect an external integration to automatically collect evidence for this control.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Integration Provider</label>
                            <Select
                                value={linkData.provider}
                                onValueChange={(val) => setLinkData({ ...linkData, provider: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="github">GitHub (Commits/PRs)</SelectItem>
                                    <SelectItem value="aws">AWS CloudTrail</SelectItem>
                                    <SelectItem value="jira">Jira Tickets</SelectItem>
                                    <SelectItem value="s3">S3 Bucket Policy</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Resource ID / URL</label>
                            <Input
                                value={linkData.resourceId}
                                onChange={(e) => setLinkData({ ...linkData, resourceId: e.target.value })}
                                placeholder={
                                    linkData.provider === 'github' ? "https://github.com/org/repo/pull/123" :
                                        linkData.provider === 'aws' ? "arn:aws:cloudtrail:us-east-1:123456789012:trail/management-events" :
                                            "Resource Identifier"
                                }
                            />
                            <p className="text-[10px] text-slate-500">
                                The system will monitor this resource for changes and compliance status.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLinkOpen(false)}>Cancel</Button>
                        <Button onClick={handleLink} disabled={linkMutation.isLoading || !linkData.resourceId}>
                            {linkMutation.isLoading ? "Linking..." : "Connect Integration"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <EvidenceLibraryDialog
                open={libraryOpen}
                onOpenChange={setLibraryOpen}
                clientId={clientId}
                evidenceId={selectedRequest?.original?.id || 0}
                onSuccess={() => {
                    refetchFiles();
                    utils.evidence.list.invalidate();
                }}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove the evidence file "{fileToDelete?.filename}".
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            onClick={() => {
                                if (fileToDelete) {
                                    fileDeleteMutation.mutate({ id: fileToDelete.id });
                                    setFileToDelete(null);
                                }
                            }}
                        >
                            {fileDeleteMutation.isLoading ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Link Integration Dialog */}
            <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Link Evidence Integration</DialogTitle>
                        <DialogDescription>
                            Connect this evidence requirement to an external system for automated collection.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Integration Provider</Label>
                            <Select
                                value={linkData.provider}
                                onValueChange={(val) => setLinkData({ ...linkData, provider: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="github">GitHub</SelectItem>
                                    <SelectItem value="aws">AWS</SelectItem>
                                    <SelectItem value="jira">Jira</SelectItem>
                                    <SelectItem value="s3">S3 Bucket</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Resource Identifier</Label>
                            <Input
                                placeholder={
                                    linkData.provider === 'github' ? "https://github.com/org/repo/pull/123" :
                                        linkData.provider === 'aws' ? "arn:aws:..." :
                                            linkData.provider === 's3' ? "s3://bucket-name/path" :
                                                "ID or URL"
                                }
                                value={linkData.resourceId}
                                onChange={(e) => setLinkData({ ...linkData, resourceId: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter the URL, ARN, or ID of the resource to link.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLinkOpen(false)}>Cancel</Button>
                        <Button onClick={handleLink} disabled={linkMutation.isLoading || !linkData.resourceId}>
                            {linkMutation.isLoading ? "Linking..." : "Link Resource"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}

function ChatSection({ request }: { request: any }) {
    const [commentText, setCommentText] = useState("");
    const { user } = useAuth();
    const utils = trpc.useContext();

    // We need the numeric ID from the backend, assuming request.original.id is it.
    const evidenceId = request.original.id;

    // Only fetch if we have a valid ID
    const { data: comments, isLoading } = trpc.evidence.getComments.useQuery(
        { evidenceId },
        { enabled: !!evidenceId, refetchInterval: 5000 }
    );

    const addCommentMutation = trpc.evidence.addComment.useMutation({
        onSuccess: () => {
            setCommentText("");
            utils.evidence.getComments.invalidate({ evidenceId });
            toast.success("Comment posted");
        },
        onError: (err) => {
            toast.error("Failed to post comment");
        }
    });

    const handlePostComment = () => {
        if (!commentText.trim()) return;
        addCommentMutation.mutate({
            evidenceId,
            content: commentText
        });
    };

    return (
        <div className="max-w-4xl p-0">
            <div className="flex flex-col gap-6">

                <div className="space-y-6 min-h-[200px]">
                    {isLoading ? (
                        <div className="text-center py-8 text-slate-400">Loading comments...</div>
                    ) : comments?.length === 0 ? (
                        <div className="p-8 bg-slate-50 rounded-lg border border-slate-100 text-center">
                            <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500 italic">No discussion yet. Start a thread below.</p>
                        </div>
                    ) : (
                        comments?.map((comment: any) => {
                            const isMe = comment.userId === user?.id;
                            return (
                                <div key={comment.id} className={cn("flex gap-3", isMe ? "flex-row-reverse" : "flex-row")}>
                                    <Avatar className="h-8 w-8 shrink-0 mt-1">
                                        <AvatarFallback className={cn("text-[10px]", isMe ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600")}>
                                            {(comment.userName || comment.userEmail || "U").substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={cn("flex flex-col max-w-[80%]", isMe ? "items-end" : "items-start")}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-slate-700">{comment.userName || comment.userEmail}</span>
                                            <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className={cn("p-3 rounded-lg text-sm", isMe ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border rounded-tl-none shadow-sm text-slate-700")}>
                                            {comment.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Chat Input */}
                <div className="flex gap-4 items-start pt-6 border-t mt-4">
                    <Avatar className="h-8 w-8 hidden sm:block">
                        <AvatarFallback className="bg-indigo-50 text-indigo-600">ME</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                        <Textarea
                            placeholder="Leave a comment, request clarification, or approve..."
                            className="min-h-[80px] bg-white"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <Button
                                size="sm"
                                className="bg-indigo-600 text-white"
                                onClick={handlePostComment}
                                disabled={addCommentMutation.isLoading || !commentText.trim()}
                            >
                                {addCommentMutation.isLoading ? "Posting..." : "Post Comment"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

}

function AuditOverview({ clientId, onNavigate }: { clientId: number, onNavigate: (section: string, filter?: string) => void }) {
    const { data: evidenceList } = trpc.evidence.list.useQuery({ clientId });
    const { data: findings } = trpc.findings.list.useQuery({ clientId });

    // Calculate stats
    const openRequests = evidenceList?.filter(e => e.status === 'open' || e.status === 'collected').length || 0;
    const verifiedRequests = evidenceList?.filter(e => e.status === 'verified').length || 0;
    const totalRequests = evidenceList?.length || 1;
    const completionPercentage = Math.round((verifiedRequests / totalRequests) * 100);

    const openFindings = findings?.filter(f => f.status === 'open').length || 0;
    const highFindings = findings?.filter(f => f.status === 'open' && (f.severity === 'high' || f.severity === 'critical')).length || 0;

    // Check for comments (hacky/approximate since we don't have a direct "unread" count yet)
    // We can show the action if there are ANY comments, or maybe just default to showing it if there are open requests.
    // For now, let's filter evidenceList for items with comments.
    const requestsWithComments = evidenceList?.filter(e => (e.commentCount || 0) > 0).length || 0;

    return (
        <div className="p-8 space-y-8 h-full flex flex-col">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="p-5 pb-1">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">Audit Progress</CardDescription>
                        <CardTitle className="text-3xl font-bold text-slate-900 tracking-tight">{completionPercentage}%</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 pt-3">
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${completionPercentage}%` }} />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2 font-medium">{verifiedRequests} of {totalRequests} controls verified</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="p-5 pb-1">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">Open Requests</CardDescription>
                        <CardTitle className="text-3xl font-bold text-slate-900 tracking-tight">{openRequests}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 pt-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 inline-flex px-2 py-0.5 rounded-full border border-amber-100">
                            <Clock className="h-3 w-3" />
                            <span>Action Required</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="p-5 pb-1">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">Open Findings</CardDescription>
                        <CardTitle className="text-3xl font-bold text-slate-900 tracking-tight">{openFindings}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 pt-3">
                        {highFindings > 0 ? (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 inline-flex px-2 py-0.5 rounded-full border border-red-100">
                                <AlertTriangle className="h-3 w-3" />
                                <span>{highFindings} High Severity</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 inline-flex px-2 py-0.5 rounded-full border border-emerald-100">
                                <Check className="h-3 w-3" />
                                <span>Risk Low</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="p-5 pb-1">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">Audit Phase</CardDescription>
                        <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">Fieldwork</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 pt-3">
                        <p className="text-[11px] text-slate-400 font-medium">Est. Completion: Feb 28, 2026</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 shadow-sm border-slate-200 h-full">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-semibold text-slate-900">Priority Action Items</CardTitle>
                                <CardDescription className="text-xs">Tasks requiring immediate attention to proceed.</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onNavigate('pbc', 'all')}>View All Tasks</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {/* Dynamic Action Items */}
                            {highFindings > 0 && (
                                <div
                                    className="p-4 hover:bg-slate-50 transition-colors flex gap-4 items-start group cursor-pointer"
                                    onClick={() => onNavigate('findings')}
                                >
                                    <div className="mt-1 p-2 bg-red-50 text-red-600 rounded-lg border border-red-100 shrink-0">
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">Resolve Critical Findings</h4>
                                            <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 text-[10px]">High Priority</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">There are {highFindings} high severity findings that impact compliance certification.</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 opacity-0 group-hover:opacity-100"><ArrowLeft className="h-4 w-4 rotate-180" /></Button>
                                </div>
                            )}

                            {openRequests > 0 && (
                                <div
                                    className="p-4 hover:bg-slate-50 transition-colors flex gap-4 items-start group cursor-pointer"
                                    onClick={() => onNavigate('pbc', 'open')}
                                >
                                    <div className="mt-1 p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 shrink-0">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">Submit Missing Evidence</h4>
                                            <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 text-[10px]">Action Required</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{openRequests} evidence requests are pending submission.</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 opacity-0 group-hover:opacity-100"><ArrowLeft className="h-4 w-4 rotate-180" /></Button>
                                </div>
                            )}

                            {requestsWithComments > 0 ? (
                                <div
                                    className="p-4 hover:bg-slate-50 transition-colors flex gap-4 items-start group cursor-pointer"
                                    onClick={() => onNavigate('pbc', 'all')} // Go to list, maybe we should filter by 'commented' if we had that filter
                                >
                                    <div className="mt-1 p-2 bg-slate-50 text-slate-500 rounded-lg border border-slate-100 shrink-0">
                                        <MessageSquare className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">Review Auditor Comments</h4>
                                            <Badge variant="outline" className="border-slate-200 text-slate-600 text-[10px]">Review</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">Check discussions on evidence requests.</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 opacity-0 group-hover:opacity-100"><ArrowLeft className="h-4 w-4 rotate-180" /></Button>
                                </div>
                            ) : null}

                            {highFindings === 0 && openRequests === 0 && requestsWithComments === 0 && (
                                <div className="p-8 text-center text-slate-400">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-slate-700">All caught up!</p>
                                    <p className="text-xs">No priority actions required at this time.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200 h-full">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4">
                        <CardTitle className="text-base font-semibold text-slate-900">Recent Findings</CardTitle>
                        <CardDescription className="text-xs">Latest observations</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {findings?.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-xs italic">
                                    No findings reported.
                                </div>
                            ) : (
                                findings?.slice(0, 5).map((f: any) => (
                                    <div key={f.id} className="p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors group">
                                        <div className={cn(
                                            "mt-0.5 h-2 w-2 rounded-full shrink-0",
                                            f.severity === 'critical' ? "bg-red-600" :
                                                f.severity === 'high' ? "bg-red-500" :
                                                    f.severity === 'medium' ? "bg-orange-500" :
                                                        "bg-yellow-500"
                                        )} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium text-slate-900 truncate group-hover:text-indigo-700">{f.title}</p>
                                            <p className="text-[10px] text-slate-400">{new Date(f.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function AuditFindings({ clientId }: { clientId: number }) {
    const [createOpen, setCreateOpen] = useState(false);
    const utils = trpc.useContext();
    const { data: findings, isLoading } = trpc.findings.list.useQuery({ clientId });

    // State for new finding
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");

    const createMutation = trpc.findings.create.useMutation({
        onSuccess: () => {
            toast.success("Finding created");
            setCreateOpen(false);
            setTitle("");
            setDescription("");
            utils.findings.list.invalidate();
        }
    });

    const handleCreate = () => {
        if (!title) return;
        createMutation.mutate({
            clientId,
            title,
            description,
            severity
        });
    }

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <div className="flex justify-between items-end border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Findings</h1>
                    <p className="text-sm text-slate-500 mt-1">Official record of non-conformities and audit observations.</p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-red-600 hover:bg-red-700 text-white gap-2 h-9 shadow-sm">
                            <AlertTriangle className="h-4 w-4" /> Report New Finding
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Issue Formal Finding</DialogTitle>
                            <DialogDescription>
                                Document a non-conformity found during the audit process.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-5 py-6">
                            <div className="grid gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Finding Title</label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Lack of Multi-Factor Authentication"
                                    className="h-10 border-slate-200 focus:ring-red-500/10 focus:border-red-500/50"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Severity Level</label>
                                <Select value={severity} onValueChange={(v: any) => setSeverity(v)}>
                                    <SelectTrigger className="h-10 border-slate-200">
                                        <SelectValue placeholder="Select severity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low - Minor Observation</SelectItem>
                                        <SelectItem value="medium">Medium - Process Issue</SelectItem>
                                        <SelectItem value="high">High - Security Risk</SelectItem>
                                        <SelectItem value="critical">Critical - Compliance Blocker</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Detailed Description</label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide context, evidence references, and impact analysis..."
                                    className="min-h-[120px] border-slate-200 focus:ring-red-500/10 focus:border-red-500/50"
                                />
                            </div>
                        </div>
                        <DialogFooter className="bg-slate-50/50 p-6 -m-6 mt-0 rounded-b-lg border-t border-slate-100">
                            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="h-10 font-medium">Cancel</Button>
                            <Button variant="destructive" onClick={handleCreate} className="h-10 px-8 bg-red-600 hover:bg-red-700 font-semibold uppercase tracking-wide text-xs">Confirm Finding</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>

            <Card className="rounded-xl border-slate-200 overflow-hidden shadow-sm shadow-slate-200/50">
                <Table>
                    <TableHeader className="bg-slate-50/80">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="w-[140px] text-[11px] font-bold uppercase tracking-wider text-slate-500">Severity</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Identification & Title</TableHead>
                            <TableHead className="w-[120px] text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
                            <TableHead className="w-[120px] text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Date Issued</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-20 text-slate-400">
                                    <div className="animate-pulse space-y-3">
                                        <div className="h-4 w-32 bg-slate-100 mx-auto rounded"></div>
                                        <div className="h-3 w-48 bg-slate-50 mx-auto rounded"></div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : findings?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-24 text-slate-400">
                                    <div className="flex flex-col items-center">
                                        <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
                                            <Check className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-slate-900 font-semibold mb-1">No Non-Conformities Found</h3>
                                        <p className="text-sm max-w-xs text-slate-500">The audit has not yielded any formal findings yet. Continue review to maintain this status.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            findings?.map((finding: any) => (
                                <TableRow key={finding.id} className="cursor-pointer hover:bg-slate-50/50 transition-colors border-slate-50 group">
                                    <TableCell>
                                        <Badge className={cn(
                                            "capitalize font-bold border-none px-2 py-0.5 text-[10px]",
                                            finding.severity === 'critical' ? "bg-red-600/10 text-red-700 hover:bg-red-600/20" :
                                                finding.severity === 'high' ? "bg-red-600/10 text-red-600 hover:bg-red-600/20" :
                                                    finding.severity === 'medium' ? "bg-orange-600/10 text-orange-700 hover:bg-orange-600/20" :
                                                        "bg-yellow-600/10 text-yellow-700 hover:bg-yellow-600/20"
                                        )}>
                                            {finding.severity}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="py-1">
                                            <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{finding.title}</div>
                                            <div className="text-xs text-slate-500 mt-1 line-clamp-1 font-medium">{finding.description}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="uppercase text-[9px] font-black border-slate-200 tracking-tight text-slate-500 bg-white">
                                            {finding.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-slate-400 font-medium text-[11px]">
                                        {new Date(finding.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div >
    );
}

function AuditDiscussions({ clientId }: { clientId: number }) {
    const { data: comments, isLoading } = trpc.evidence.getAllComments.useQuery({ clientId });

    return (
        <div className="p-8 h-full flex flex-col space-y-6 text-left">
            <div className="border-b border-slate-100 pb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Communications</h1>
                <p className="text-sm text-slate-500 mt-1">Centralized activity feed for all evidence requests and auditor feedback.</p>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 w-full bg-slate-50 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : comments?.length === 0 ? (
                    <div className="text-center py-24 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-slate-900 font-semibold mb-1">No Active Threads</h3>
                        <p className="text-sm text-slate-400">Activity across all workspaces will appear here.</p>
                    </div>
                ) : (
                    comments?.map((comment: any) => (
                        <Card key={comment.id} className="hover:shadow-md transition-all duration-300 border-slate-200 group overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex">
                                    {/* Accent strip based on role/status? Placeholder for now */}
                                    <div className="w-1 bg-indigo-500 group-hover:bg-indigo-600 transition-colors" />

                                    <div className="flex-1 p-5 flex gap-5">
                                        <Avatar className="h-10 w-10 border border-slate-100 shadow-sm shrink-0">
                                            <AvatarFallback className="bg-slate-50 text-slate-600 text-xs font-bold">
                                                {(comment.userName || "U").substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 text-sm">{comment.userName || comment.userEmail}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium tracking-tight">
                                                        {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 bg-slate-50 border border-slate-100"
                                                >
                                                    View Context <ArrowRight className="ml-1.5 h-3 w-3" />
                                                </Button>
                                            </div>

                                            <div className="flex items-center gap-1.5 mb-3">
                                                <div className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-tight">On Request</div>
                                                <span className="text-xs font-semibold text-slate-700 truncate hover:text-indigo-600 cursor-pointer transition-colors">
                                                    {comment.evidenceTitle || `Evidence Request #${comment.evidenceId}`}
                                                </span>
                                            </div>

                                            <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 group-hover:border-slate-200 font-medium">
                                                {comment.content}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

function NavButton({ active, onClick, icon: Icon, label, count }: { active: boolean; onClick: () => void; icon: any; label: string; count?: number }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group border-l-2",
                active
                    ? "bg-indigo-50 text-indigo-700 border-indigo-600 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent hover:border-slate-200"
            )}
        >
            <Icon className={cn("h-4.5 w-4.5 transition-colors", active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
            <span>{label}</span>
            {count !== undefined && (
                <span className={cn(
                    "ml-auto text-[10px] font-bold py-0.5 px-2 rounded-full",
                    active ? "bg-indigo-100/50 text-indigo-700" : "bg-slate-100 text-slate-500"
                )}>
                    {count}
                </span>
            )}
        </button>
    );
}
