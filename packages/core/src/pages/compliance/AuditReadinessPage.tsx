
import React, { useState, useEffect } from "react";
import { useParams } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Progress } from "@complianceos/ui/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@complianceos/ui/ui/accordion";
import { Badge } from "@complianceos/ui/ui/badge";
import { Loader2, Save, FileDown, CheckCircle, AlertCircle, HelpCircle, XCircle } from "lucide-react";
import { Textarea } from "@complianceos/ui/ui/textarea";

import { Label } from "@complianceos/ui/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@complianceos/ui/ui/dialog";
import { Send, UserPlus, Mail, BookOpen, ArrowRight } from "lucide-react";
import { EmailQuestionsDialog } from "@/components/gap-analysis/EmailQuestionsDialog";
import { ChecklistProgressWidget } from "@/components/readiness/ChecklistProgressWidget";

// --- Types ---
type Assessment = {
    id: number;
    name: string;
    framework: string;
    status: string;
    createdAt: string;
};

type GapResponse = {
    id: number;
    controlId: string;
    currentStatus?: string; // implemented, not_implemented, partial, not_applicable
    notes?: string;
    evidenceLinks?: string;
};

type Control = {
    id: number;
    controlId: string;
    name: string;
    description: string;
    category: string;
};

// --- Helper Components ---
const StatusBadge = ({ status }: { status?: string }) => {
    switch (status) {
        case 'implemented':
            return <Badge variant="success" className="uppercase text-[10px] font-bold px-2.5"><CheckCircle className="w-3 h-3 mr-1" /> Implemented</Badge>;
        case 'partial':
            return <Badge variant="warning" className="uppercase text-[10px] font-bold px-2.5"><AlertCircle className="w-3 h-3 mr-1" /> Partial</Badge>;
        case 'not_implemented':
            return <Badge variant="error" className="uppercase text-[10px] font-bold px-2.5"><XCircle className="w-3 h-3 mr-1" /> Missing</Badge>;
        case 'not_applicable':
            return <Badge variant="info" className="uppercase text-[10px] font-bold px-2.5"><HelpCircle className="w-3 h-3 mr-1" /> N/A</Badge>;
        default:
            return <Badge variant="outline" className="text-gray-500 uppercase text-[10px] px-2.5">Unanswered</Badge>;
    }
};

export default function AuditReadinessPage() {
    const { id } = useParams();
    const clientId = parseInt(id || "0", 10);

    // Suggested frameworks (could be dynamic in future)
    const SUPPORTED_FRAMEWORKS = ["ISO 27001", "SOC 2", "NIST CSF", "GDPR", "HIPAA"];

    const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
    const [selectedFramework, setSelectedFramework] = useState<string>(SUPPORTED_FRAMEWORKS[0]);
    const [activeCategory, setActiveCategory] = useState<string>("All Categories");
    const [searchQuery, setSearchQuery] = useState("");

    // --- TRPC Queries ---
    const { data: assessments, refetch: refetchAssessments, isLoading: isLoadingAssessments } = trpc.gapAnalysis.list.useQuery(
        { clientId },
        { enabled: !!clientId }
    );



    const { data: assessmentDetails, refetch: refetchDetails, isFetching: isLoadingDetails } = trpc.gapAnalysis.get.useQuery(
        { id: parseInt(selectedAssessmentId || "0") },
        { enabled: !!selectedAssessmentId }
    );

    // --- Mock Users for Assignment ---
    const MOCK_USERS = [
        { id: 1, name: "Admin User", email: "admin@example.com", role: "Admin" },
        { id: 2, name: "John Doe", email: "john@example.com", role: "Auditor" },
        { id: 3, name: "Jane Smith", email: "jane@example.com", role: "Viewer" },
        { id: 4, name: "Sarah Connor", email: "sarah@example.com", role: "Security Lead" },
    ];

    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);

    // --- Question Assignment State ---
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedQuestionIds([]); // Reset on toggle
    };

    const toggleQuestionSelection = (id: number) => {
        setSelectedQuestionIds(prev =>
            prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
        );
    };

    const assignMutation = trpc.gapAnalysis.assign.useMutation({
        onSuccess: () => {
            toast.success("Audit assigned and notifications sent.");
            setIsAssignDialogOpen(false);
            refetchDetails();
        },
        onError: (err) => toast.error("Failed to assign: " + err.message)
    });

    const handleAssign = () => {
        if (!selectedAssessmentId) return;
        assignMutation.mutate({
            assessmentId: parseInt(selectedAssessmentId),
            assigneeIds: selectedAssignees
        });
    };

    const toggleAssignee = (userId: number) => {
        setSelectedAssignees(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    // We fetch controls to serve as the "Question Bank"
    // Ideally, we filter this by framework, but if the backend doesn't support it, we filter client-side.
    const { data: allControls } = trpc.controls.list.useQuery();

    const createAssessmentMutation = trpc.gapAnalysis.create.useMutation({
        onSuccess: (data) => {
            toast.success("New audit assessment started!");
            refetchAssessments();
            setSelectedAssessmentId(data.id.toString());
        },
        onError: (err) => toast.error("Failed to start assessment: " + err.message)
    });

    const updateResponseMutation = trpc.gapAnalysis.updateResponse.useMutation({
        onSuccess: () => {
            // toast.success("Saved"); // Too chatty for auto-save
            refetchDetails();
        }
    });

    const generateReportMutation = trpc.gapAnalysis.generateReport.useMutation({
        onSuccess: (data) => {
            // Decode Base64 and download
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${data.pdfBase64}`;
            link.download = data.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Report downloaded successfully");
        },
        onError: (err) => toast.error("Failed to generate report: " + err.message)
    });

    // --- Derived State ---
    // Filter controls to the selected framework.
    // Note: This relies on 'allControls' having a 'framework' field that strictly matches our dropdown strings.
    // If not, we might need fuzzy matching or normalization.
    // Filter controls to the selected framework.
    // Handles version mismatches (e.g., Assessment "ISO 27001:2022" vs Control "ISO 27001")
    const frameworkControls = allControls?.filter(c => {
        if (!c.framework) return false;

        const currentRef = assessmentDetails?.assessment.framework || selectedFramework;
        if (!currentRef) return false;

        // Exact match
        if (c.framework === currentRef) return true;

        // Looping match: "ISO 27001" is contained in "ISO 27001:2022"
        if (currentRef.includes(c.framework)) return true;

        return false;
    }) || [];

    // Group controls by category/domain
    const categories = Array.from(new Set(frameworkControls.map(c => c.category || "Uncategorized"))).sort();

    // Calculate Progress
    const calculateProgress = () => {
        if (!assessmentDetails?.responses) return { score: 0, total: 0, answered: 0 };

        // Total should be based on the Framework's controls, not just what has been answered.
        const totalControls = frameworkControls.length;
        if (totalControls === 0) return { score: 0, total: 0, answered: 0 };

        const responses = assessmentDetails.responses;
        const answered = responses.length;

        // Simple scoring: Implemented = 1, Partial = 0.5, Others = 0
        let points = 0;
        responses.forEach(r => {
            if (r.currentStatus === 'implemented') points += 1;
            else if (r.currentStatus === 'partial') points += 0.5;
            // N/A could either be excluded from total or counted as full points.
            // Let's count N/A as full points for "readiness" (you are ready if it doesn't apply)
            else if (r.currentStatus === 'not_applicable') points += 1;
        });

        const score = Math.round((points / totalControls) * 100);
        return { score, total: totalControls, answered };
    };

    const stats = calculateProgress();

    // Handle Create
    const handleStartAssessment = () => {
        if (!clientId) return;
        createAssessmentMutation.mutate({
            clientId,
            name: `Audit Readiness: ${selectedFramework}`,
            framework: selectedFramework,
            scope: "Full Organization" // Default scope
        });
    };

    // Handle Select Assessment
    useEffect(() => {
        if (assessments && assessments.length > 0 && !selectedAssessmentId) {
            // Auto-select the most recent one
            setSelectedAssessmentId(assessments[0].id.toString());
        }
    }, [assessments, selectedAssessmentId]);

    if (isLoadingAssessments) {
        return (
            <DashboardLayout>
                <div className="flex h-[80vh] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto p-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Audit Readiness Assessment</h1>
                        <p className="text-slate-500 mt-1">Evaluate and prove your organization's compliance readiness.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedAssessmentId && (
                            <>
                                <Button variant="outline" onClick={() => generateReportMutation.mutate({ id: parseInt(selectedAssessmentId) })} disabled={generateReportMutation.isLoading}>
                                    {generateReportMutation.isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                                    Download Report
                                </Button>
                                {/* Auto-save is on, manual save visual only */}
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <Save className="w-4 h-4 mr-2" /> Save Progress
                                </Button>
                                <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => setIsAssignDialogOpen(true)}>
                                    <UserPlus className="w-4 h-4 mr-2" /> Assign / Send
                                </Button>
                                <Button
                                    variant={isSelectionMode ? "secondary" : "outline"}
                                    onClick={toggleSelectionMode}
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    {isSelectionMode ? "Cancel Selection" : "Email Questions"}
                                </Button>
                                {isSelectionMode && selectedQuestionIds.length > 0 && (
                                    <Button onClick={() => setIsEmailDialogOpen(true)}>
                                        Send ({selectedQuestionIds.length})
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Alignment Guide Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 mb-6">
                    <div className="p-4 rounded-xl border border-teal-200 bg-white shadow-sm flex flex-col justify-between cursor-pointer hover:border-teal-400 hover:shadow-md transition-all group md:col-span-1" onClick={() => window.location.href = `/clients/${clientId}/audit-readiness/alignment-guide`}>
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold text-slate-900">ISO 27001</span>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-teal-100 text-teal-700 pointer-events-none">GUIDE</Badge>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-2 font-medium group-hover:text-teal-600 transition-colors">
                                    <span>View alignment</span>
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition-colors">
                                <BookOpen className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assignment Dialog */}
                <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Assign Assessment</DialogTitle>
                            <DialogDescription>
                                Select users to assign this audit to. They will receive an email notification.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-2">
                            {MOCK_USERS.map(user => (
                                <div key={user.id}
                                    className={cn("flex items-center justify-between p-3 rounded-md border cursor-pointer hover:bg-slate-50", selectedAssignees.includes(user.id) ? "border-blue-500 bg-blue-50" : "border-slate-200")}
                                    onClick={() => toggleAssignee(user.id)}
                                >
                                    <div>
                                        <div className="font-medium text-sm">{user.name}</div>
                                        <div className="text-xs text-slate-500">{user.email} • {user.role}</div>
                                    </div>
                                    <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center", selectedAssignees.includes(user.id) ? "bg-blue-600 border-blue-600" : "border-slate-300")}>
                                        {selectedAssignees.includes(user.id) && <CheckCircle className="w-3 h-3 text-white" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAssign} disabled={assignMutation.isLoading || selectedAssignees.length === 0}>
                                {assignMutation.isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <Send className="w-4 h-4 mr-2" /> Send Assignment
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {assessments && assessments.length === 0 && !selectedAssessmentId ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <Card className="py-12 flex flex-col items-center justify-center text-center h-full">
                                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <h2 className="text-xl font-semibold text-slate-900">Start Your First Assessment</h2>
                                <p className="text-slate-500 max-w-md mt-2 mb-6">Select a framework to begin evaluating your compliance posture and identifying gaps before the auditor does.</p>

                                <div className="flex gap-2">
                                    <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                                        <SelectTrigger className="w-[250px]">
                                            <SelectValue placeholder="Select Framework" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SUPPORTED_FRAMEWORKS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handleStartAssessment} disabled={createAssessmentMutation.isLoading}>
                                        {createAssessmentMutation.isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Start Assessment
                                    </Button>
                                </div>
                            </Card>
                        </div>
                        <div>
                            <ChecklistProgressWidget clientId={clientId} />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Assessment Selector Context */}
                        <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="grid gap-1">
                                    <Label className="text-xs text-muted-foreground">Current Assessment</Label>
                                    <Select value={selectedAssessmentId || ""} onValueChange={setSelectedAssessmentId}>
                                        <SelectTrigger className="w-[300px] h-9 border-none bg-slate-100 font-medium">
                                            <SelectValue placeholder="Select Assessment" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {assessments?.map(a => (
                                                <SelectItem key={a.id} value={a.id.toString()}>
                                                    {a.name} ({new Date(a.createdAt).toLocaleDateString()})
                                                </SelectItem>
                                            ))}
                                            <div className="p-2 border-t">
                                                <Button variant="ghost" size="sm" className="w-full text-xs justify-start px-2" onClick={() => {
                                                    setSelectedAssessmentId(null); // Reset to show start screen
                                                }}>
                                                    + Start New Assessment
                                                </Button>
                                            </div>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {assessmentDetails && (
                                    <div className="grid gap-1">
                                        <Label className="text-xs text-muted-foreground">Framework</Label>
                                        <div className="font-semibold text-sm">{assessmentDetails.assessment.framework}</div>
                                    </div>
                                )}
                            </div>

                            {assessmentDetails && (
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-slate-900">{stats.score}%</div>
                                        <div className="text-xs text-muted-foreground">Readiness Score</div>
                                    </div>
                                    <div className="h-10 w-px bg-slate-200"></div>
                                    <div className="text-right">
                                        <div className="text-lg font-semibold text-slate-700">{stats.answered} / {stats.total}</div>
                                        <div className="text-xs text-muted-foreground">Controls Audited</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Main Content Area */}
                        {selectedAssessmentId && assessmentDetails && (
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                {/* Sidebar Filters */}
                                <div className="lg:col-span-1 space-y-4">
                                    <ChecklistProgressWidget clientId={clientId} />
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">Categories</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="flex flex-col">
                                                <button
                                                    className={cn("text-left px-4 py-3 text-sm font-medium border-l-2 transition-colors", activeCategory === "All Categories" ? "bg-slate-50 border-blue-600 text-blue-700" : "border-transparent text-slate-600 hover:bg-slate-50")}
                                                    onClick={() => setActiveCategory("All Categories")}
                                                >
                                                    All Categories
                                                    <Badge variant="secondary" className="ml-2 text-[10px]">{frameworkControls.length}</Badge>
                                                </button>
                                                {categories.map(cat => (
                                                    <button
                                                        key={cat}
                                                        className={cn("text-left px-4 py-3 text-sm font-medium border-l-2 transition-colors", activeCategory === cat ? "bg-slate-50 border-blue-600 text-blue-700" : "border-transparent text-slate-600 hover:bg-slate-50")}
                                                        onClick={() => setActiveCategory(cat)}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Question List */}
                                <div className="lg:col-span-3 space-y-4">
                                    {/* Search Bar */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search questions or controls..."
                                            className="w-full pl-4 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        {frameworkControls
                                            .filter(c => activeCategory === "All Categories" || c.category === activeCategory)
                                            .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase()) || c.controlId.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((control) => {
                                                const response = assessmentDetails.responses.find(r => r.controlId === control.controlId || r.controlId === control.id?.toString());
                                                const status = response?.currentStatus;

                                                return (
                                                    <Card key={control.controlId} className={cn("transition-all border-l-4", status === 'implemented' ? "border-l-green-500" : status === 'not_implemented' ? "border-l-red-500" : "border-l-slate-200")}>
                                                        <div className="flex">
                                                            {isSelectionMode && (
                                                                <div className="flex items-center justify-center px-4 border-r bg-slate-50">
                                                                    <Checkbox
                                                                        checked={control.id ? selectedQuestionIds.includes(control.id) : false}
                                                                        onCheckedChange={() => control.id && toggleQuestionSelection(control.id)}
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="flex-1">
                                                                <Accordion type="single" collapsible>
                                                                    <AccordionItem value="item-1" className="border-none">
                                                                        <div className="p-4 flex items-start justify-between gap-4">
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600">{control.controlId}</Badge>
                                                                                    <span className="text-xs text-muted-foreground uppercase tracking-wide">{control.category || 'General'}</span>
                                                                                </div>
                                                                                <h3 className="font-semibold text-slate-900 mb-1">
                                                                                    {control.name.endsWith('?') ? control.name : `Is the ${control.name} implemented and effective?`}
                                                                                </h3>
                                                                                <p className="text-sm text-slate-500 line-clamp-2 md:line-clamp-none">
                                                                                    {control.description}
                                                                                </p>
                                                                            </div>
                                                                            <div className="shrink-0 flex flex-col items-end gap-2">
                                                                                <StatusBadge status={status} />
                                                                                <AccordionTrigger className="text-xs text-blue-600 hover:no-underline py-0">
                                                                                    {response ? 'Edit Response' : 'Answer'}
                                                                                </AccordionTrigger>
                                                                            </div>
                                                                        </div>

                                                                        <AccordionContent className="p-4 pt-0 bg-slate-50/50 border-t">
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                                                                <div className="space-y-4">
                                                                                    <div className="grid gap-2">
                                                                                        <Label>Implementation Status</Label>
                                                                                        <Select
                                                                                            value={status || ""}
                                                                                            onValueChange={(val) => updateResponseMutation.mutate({
                                                                                                assessmentId: parseInt(selectedAssessmentId),
                                                                                                controlId: control.controlId, // or control.id.toString() depending on how it was saved
                                                                                                currentStatus: val,
                                                                                                // Logic to auto-set target based on selection if new
                                                                                                targetStatus: assessmentDetails.responses.find(r => r.controlId === control.controlId)?.targetStatus || 'required'
                                                                                            })}
                                                                                        >
                                                                                            <SelectTrigger>
                                                                                                <SelectValue placeholder="Select Status" />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                <SelectItem value="implemented">Implemented</SelectItem>
                                                                                                <SelectItem value="partial">Partial</SelectItem>
                                                                                                <SelectItem value="not_implemented">Not Implemented</SelectItem>
                                                                                                <SelectItem value="not_applicable">Not Applicable</SelectItem>
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    </div>

                                                                                    <div className="grid gap-2">
                                                                                        <Label>Evidence / Links</Label>
                                                                                        <Textarea
                                                                                            placeholder="Paste links to evidence or documents..."
                                                                                            className="h-20 resize-none"
                                                                                            defaultValue={response?.evidenceLinks || ""}
                                                                                            onBlur={(e) => updateResponseMutation.mutate({
                                                                                                assessmentId: parseInt(selectedAssessmentId),
                                                                                                controlId: control.controlId,
                                                                                                evidenceLinks: e.target.value
                                                                                            })}
                                                                                        />
                                                                                    </div>
                                                                                </div>

                                                                                <div className="space-y-4">
                                                                                    <div className="grid gap-2">
                                                                                        <Label>Audit Notes</Label>
                                                                                        <Textarea
                                                                                            placeholder="Internal notes, observation details, or remediation plans..."
                                                                                            className="h-32"
                                                                                            defaultValue={response?.notes || ""}
                                                                                            onBlur={(e) => updateResponseMutation.mutate({
                                                                                                assessmentId: parseInt(selectedAssessmentId),
                                                                                                controlId: control.controlId,
                                                                                                notes: e.target.value
                                                                                            })}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </AccordionContent>
                                                                    </AccordionItem>
                                                                </Accordion>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                );
                                            })}

                                        {frameworkControls.length === 0 && (
                                            <div className="text-center py-12 text-slate-500">
                                                <p>No controls found for this framework.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                        }
                    </>
                )}
            </div>
            {/* Email Questions Dialog */}
            {selectedAssessmentId && (
                <EmailQuestionsDialog
                    open={isEmailDialogOpen}
                    onOpenChange={setIsEmailDialogOpen}
                    assessmentId={parseInt(selectedAssessmentId)}
                    selectedControlIds={selectedQuestionIds}
                    controls={frameworkControls.filter(c => c.id).map(c => ({
                        id: c.id!,
                        controlId: c.controlId,
                        name: c.name
                    }))}
                />
            )}
        </DashboardLayout>
    );
}
