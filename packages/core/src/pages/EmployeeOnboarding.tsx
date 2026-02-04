import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useClientContext } from "@/contexts/ClientContext";
import {
    CheckCircle2,
    Circle,
    FileText,
    GraduationCap,
    Shield,
    ChevronRight,
    Sparkles,
    Laptop,
    ArrowRight,
    Lock,
    CreditCard,
    CheckSquare,
    PlayCircle,
    Video
} from "lucide-react";
import { TrainingModuleViewer } from "@/components/training/TrainingModuleViewer";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@complianceos/ui/ui/collapsible";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@complianceos/ui/ui/dialog";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Eye } from "lucide-react";
import { marked } from "marked";
import { toast } from "sonner";
import { ExceptionRequestDialog } from "@/components/policy/ExceptionRequestDialog";

// Mock Policy Content (In a real app, this would come from the API)
const POLICY_CONTENT = {
    code_of_conduct: {
        title: "Code of Conduct",
        content: `
            <h3>1. Professional Integrity</h3>
            <p>All employees are expected to maintain the highest standards of professional integrity...</p>
            <h3>2. Workplace Respect</h3>
            <p>We are committed to providing a workplace free from discrimination and harassment...</p>
            <h3>3. Conflict of Interest</h3>
            <p>Employees must avoid situations where personal interests conflict with company duties...</p>
        `
    },
    aup: {
        title: "Acceptable Use Policy",
        content: `
            <h3>1. System Usage</h3>
            <p>Company systems are for business use. Incidental personal use is permitted if it does not interfere with work...</p>
            <h3>2. Security</h3>
            <p>Users must not disable or circumvent security controls...</p>
        `
    },
    data_protection: {
        title: "Data Protection Agreement",
        content: `
            <h3>1. Data Handling</h3>
            <p>You agree to handle all personal and sensitive data in accordance with GDPR and company policy...</p>
            <h3>2. Confidentiality</h3>
            <p>Data must not be shared with unauthorized parties...</p>
        `
    },
    confidentiality: {
        title: "Confidentiality Agreement",
        content: `
            <h3>1. Confidential Information</h3>
            <p>Includes trade secrets, customer lists, and proprietary technology...</p>
            <h3>2. Obligations</h3>
            <p>You agree to keep all such information strictly confidential during and after employment...</p>
        `
    }
};

function getYouTubeThumbnail(url: string | null) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        return `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`;
    }
    return null;
}

export default function EmployeeOnboarding() {
    const { user } = useAuth();
    // Track viewed policies in this session
    const [viewedPolicies, setViewedPolicies] = useState<Set<string>>(new Set());
    const [viewingPolicy, setViewingPolicy] = useState<string | null>(null);
    const [isTrainingCenterOpen, setIsTrainingCenterOpen] = useState(false);
    const [activeTrainingModuleId, setActiveTrainingModuleId] = useState<number | null>(null);
    const [isExceptionDialogOpen, setIsExceptionDialogOpen] = useState(false);
    const [exceptionPolicyKey, setExceptionPolicyKey] = useState<string | null>(null);
    const [exceptionPolicyId, setExceptionPolicyId] = useState<number | null>(null);

    const markAsViewed = (policyId: string) => {
        setViewedPolicies(prev => new Set(prev).add(policyId));
        setViewingPolicy(null);
    };
    const { selectedClientId } = useClientContext();
    const utils = trpc.useUtils();
    const [, setLocation] = useLocation();

    // Fetch user's clients to handle cases where selectedClientId is not in URL context (e.g. /onboarding)
    const { data: myClients } = trpc.clients.list.useQuery();

    // Determine effective client ID
    const effectiveClientId = selectedClientId || (myClients && myClients.length > 0 ? myClients[0].id : 0);

    // Fetch current user's employee record
    const { data: me } = trpc.users.me.useQuery();
    const { data: employee } = (trpc.employees as any).getByEmail?.useQuery(
        { email: me?.email || "", clientId: effectiveClientId || 0 },
        { enabled: !!me?.email && !!effectiveClientId }
    );

    // Auto-ensure employee record exists for the current user
    const ensureSelfMutation = (trpc.employees as any).ensureSelf?.useMutation({
        onSuccess: () => {
            utils.employees.getByEmail.invalidate();
        }
    });

    useEffect(() => {
        if (effectiveClientId && me?.email && employee === null && !ensureSelfMutation.isLoading && !ensureSelfMutation.isSuccess) {
            ensureSelfMutation.mutate({ clientId: effectiveClientId });
        }
    }, [effectiveClientId, me, employee, ensureSelfMutation]);

    // Fetch onboarding status from database
    const { data: onboardingStatus, refetch: refetchOnboarding } = (trpc.onboarding as any).getOnboardingStatus?.useQuery(
        { clientId: effectiveClientId || 0, employeeId: employee?.id || 0 },
        { enabled: !!effectiveClientId && !!employee?.id }
    );

    // Fetch training progress from database
    const { data: trainingData } = (trpc.onboarding as any).getTrainingProgress?.useQuery(
        { clientId: effectiveClientId || 0, employeeId: employee?.id || 0 },
        { enabled: !!effectiveClientId && !!employee?.id }
    );

    // Fetch custom training modules
    const { data: customModules } = trpc.training.list.useQuery(
        { clientId: effectiveClientId || 0, employeeId: employee?.id || 0 },
        { enabled: !!effectiveClientId && !!employee?.id }
    );

    // Fetch pending policies
    const { data: policyData } = (trpc.policyManagement as any).getMyPolicies?.useQuery(
        { clientId: effectiveClientId || 0, employeeId: employee?.id || 0 },
        { enabled: !!effectiveClientId && !!employee?.id }
    );

    // Attest training mutation
    const attestTrainingMutation = (trpc.onboarding as any).attestTraining?.useMutation({
        onSuccess: () => {
            utils.onboarding.getOnboardingStatus.invalidate();
            refetchOnboarding();
        }
    });

    // Acknowledgment mutation
    const submitAcknowledgmentMutation = (trpc.onboarding as any).submitAcknowledgment?.useMutation({
        onSuccess: () => {
            utils.onboarding.getOnboardingStatus.invalidate();
            refetchOnboarding();
        }
    });

    // Security setup mutation
    const updateSecuritySetupMutation = (trpc.onboarding as any).updateSecuritySetup?.useMutation({
        onSuccess: () => {
            utils.onboarding.getOnboardingStatus.invalidate();
            refetchOnboarding();
        }
    });

    // Asset receipt mutation
    const confirmAssetReceiptMutation = (trpc.onboarding as any).confirmAssetReceipt?.useMutation({
        onSuccess: () => {
            utils.onboarding.getOnboardingStatus.invalidate();
            refetchOnboarding();
        }
    });

    // Calculate progress from database
    const progress = useMemo(() => {
        if (!onboardingStatus) {
            return { tasks: { training: false, acknowledgments: false, security: false, assets: false }, completed: 0, total: 4, percentage: 0 };
        }

        const tasks = {
            training: onboardingStatus.tasks.training.complete,
            acknowledgments: onboardingStatus.tasks.acknowledgments.complete,
            security: onboardingStatus.tasks.security.complete,
            assets: onboardingStatus.tasks.assets.complete
        };

        const completed = Object.values(tasks).filter(Boolean).length;
        const total = 4;
        const percentage = Math.round((completed / total) * 100);

        return { tasks, completed, total, percentage };
    }, [onboardingStatus]);

    const toggleTrainingSection = async (frameworkId: string, sectionId: string) => {
        if (!effectiveClientId || !employee?.id) return;

        const isComplete = isSectionComplete(frameworkId, sectionId);
        if (!isComplete) {
            // Mark as complete in database
            await attestTrainingMutation.mutateAsync({
                clientId: effectiveClientId,
                employeeId: employee.id,
                frameworkId,
                sectionId,
                timeSpentSeconds: 0
            });
        }
    };

    const isSectionComplete = (frameworkId: string, sectionId: string) => {
        if (!trainingData?.byFramework) return false;
        const frameworkRecords = trainingData.byFramework[frameworkId] || [];
        return frameworkRecords.some((r: any) => r.sectionId === sectionId);
    };

    const pendingPoliciesCount = policyData?.assignments?.filter(
        (a: any) => a.status === 'pending' || a.status === 'viewed'
    ).length || 0;

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-12">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Employee Onboarding" },
                    ]}
                />

                {/* Hero Section with Progress */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002a40] via-[#004d70] to-[#0284c7] p-8 text-white shadow-2xl">
                    <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                                <Sparkles className="h-8 w-8 text-sky-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Welcome to GRCompliance</h1>
                                <p className="text-sky-100/80 text-lg font-medium">Complete your onboarding to get started</p>
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Overall Progress</span>
                                <span className="text-2xl font-bold">{progress.percentage}%</span>
                            </div>
                            <Progress value={progress.percentage} className="h-3 bg-white/10" />
                            <p className="text-sm text-sky-100/70">
                                {progress.completed} of {progress.total} tasks completed
                            </p>
                        </div>
                    </div>
                </div>

                {/* Onboarding Tasks */}
                <div className="grid gap-6">

                    {/* Task 2: Security Awareness Training */}
                    <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${progress.tasks.training ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                                        <GraduationCap className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-xl">Task 1: Security Awareness Training</CardTitle>
                                            {progress.tasks.training ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <Circle className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <CardDescription className="mt-1">
                                            {progress.tasks.training
                                                ? "Training modules completed"
                                                : (
                                                    <span>
                                                        {trainingData?.totalCompleted || 0} sections completed
                                                        {customModules && customModules.length > 0 && <span> • {customModules.length} custom modules</span>}
                                                    </span>
                                                )
                                            }
                                        </CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Learn about key compliance frameworks and security best practices.
                            </p>

                            {customModules && customModules.length > 0 && (
                                <div className="mb-6">
                                    <Button
                                        onClick={() => setIsTrainingCenterOpen(true)}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
                                    >
                                        <PlayCircle className="mr-2 h-5 w-5" />
                                        Launch Training Center
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            <div className="space-y-3">
                                {customModules && customModules.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {customModules.map((module: any) => {
                                            return (
                                                <div
                                                    key={module.id}
                                                    className="group relative flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm hover:shadow-md transition-all cursor-pointer h-full"
                                                    onClick={() => {
                                                        setActiveTrainingModuleId(module.id);
                                                        setIsTrainingCenterOpen(true);
                                                    }}
                                                >
                                                    {/* Thumbnail / Header */}
                                                    <div className="aspect-video bg-slate-100 relative flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                                                        {(module.thumbnailUrl || getYouTubeThumbnail(module.videoUrl)) && (
                                                            <img
                                                                src={module.thumbnailUrl || getYouTubeThumbnail(module.videoUrl) || ""}
                                                                alt={module.title}
                                                                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                            />
                                                        )}

                                                        {module.type === 'video' ? (
                                                            <div className="z-10 w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                                <PlayCircle className="h-6 w-6 text-indigo-600 ml-0.5" />
                                                            </div>
                                                        ) : (
                                                            <FileText className="h-10 w-10 text-slate-400 z-10" />
                                                        )}
                                                        <div className="absolute top-2 right-2 z-10">
                                                            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-xs font-normal">
                                                                {module.durationMinutes} min
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="p-4 flex flex-col flex-1">
                                                        <h4 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
                                                            {module.title}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
                                                            {module.description || "No description provided."}
                                                        </p>
                                                        <Button
                                                            size="sm"
                                                            className="w-full mt-auto"
                                                            variant="outline"
                                                        >
                                                            Start Learning
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                        <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No training modules assigned.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>


                    {/* Task 4: Compliance Acknowledgments */}
                    <Card id="compliance-acknowledgments" className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${onboardingStatus?.tasks.acknowledgments?.complete ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                        <Shield className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-xl">Task 2: Compliance Acknowledgments</CardTitle>
                                            {onboardingStatus?.tasks.acknowledgments?.complete ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <Circle className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <CardDescription className="mt-1">
                                            {onboardingStatus?.tasks.acknowledgments?.complete
                                                ? "All agreements acknowledged"
                                                : "Review and acknowledge required agreements"}
                                        </CardDescription>
                                    </div>
                                </div>
                                {!onboardingStatus?.tasks.acknowledgments?.complete && (
                                    <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                                        Action Required
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {onboardingStatus?.tasks.acknowledgments?.requirements ? (
                                    // Dynamic rendering
                                    (onboardingStatus.tasks.acknowledgments.requirements as any[]).map((req: any) => (
                                        <AcknowledgmentCheckbox
                                            key={req.key}
                                            label={req.title}
                                            checked={onboardingStatus.tasks.acknowledgments.items[req.key] || false}
                                            onCheck={() => {
                                                if (!onboardingStatus.tasks.acknowledgments.items[req.key]) {
                                                    setViewingPolicy(req.key);
                                                }
                                            }}
                                            onView={() => {
                                                setViewingPolicy(req.key);
                                            }}
                                            onException={() => {
                                                setExceptionPolicyId(req.id);
                                                setExceptionPolicyKey(req.key);
                                                setIsExceptionDialogOpen(true);
                                            }}
                                            viewed={viewedPolicies.has(req.key)}
                                        />
                                    ))
                                ) : (
                                    // Fallback / Loading state
                                    <div className="text-center py-4 text-gray-500">
                                        Loading requirements...
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Policy Viewer Modal */}
                    <Dialog open={!!viewingPolicy} onOpenChange={(open) => !open && setViewingPolicy(null)}>
                        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>
                                    {viewingPolicy && (
                                        onboardingStatus?.tasks.acknowledgments?.requirements?.find((r: any) => r.key === viewingPolicy)?.title
                                        || POLICY_CONTENT[viewingPolicy as keyof typeof POLICY_CONTENT]?.title
                                    )}
                                </DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="flex-1 p-6 bg-slate-50/50">
                                <div
                                    className="mx-auto max-w-2xl bg-white p-8 md:p-12 shadow-sm border rounded-sm min-h-full prose prose-slate dark:prose-invert [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-8 [&_h1]:text-slate-900 [&_h1]:border-b [&_h1]:pb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-slate-800 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:mb-6 [&_p]:leading-relaxed [&_p]:text-slate-700 [&_p]:text-justify [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_li]:mb-3 [&_li]:text-slate-700 whitespace-normal"
                                    dangerouslySetInnerHTML={{
                                        __html: viewingPolicy ? (() => {
                                            const requirement = onboardingStatus?.tasks.acknowledgments?.requirements?.find((r: any) => r.key === viewingPolicy);
                                            const rawContent = requirement?.description
                                                || POLICY_CONTENT[viewingPolicy as keyof typeof POLICY_CONTENT]?.content
                                                || '<p>No content available.</p>';

                                            // 1. Decodes entities like &#39; but preserves tags
                                            const decodeEntities = (html: string): string => {
                                                if (typeof document === 'undefined') return html;
                                                const txt = document.createElement("textarea");
                                                txt.innerHTML = html;
                                                return txt.value;
                                            };

                                            const unescaped = decodeEntities(rawContent).trim();

                                            // 2. Default to rich HTML rendering. 
                                            // Only parse as markdown if it lacks HTML structure but contains markdown indicators.
                                            const appearsToBeMarkdown = !unescaped.includes('<') && unescaped.includes('#');

                                            if (appearsToBeMarkdown) {
                                                return marked.parse(unescaped, { async: false }) as string;
                                            }

                                            return unescaped;
                                        })() : ''
                                    }}
                                />
                            </ScrollArea>
                            <DialogFooter className="flex justify-between items-center sm:justify-between border-t pt-4 mt-auto">
                                <div className="text-sm text-gray-500">
                                    Please read the document carefully.
                                </div>
                                <Button
                                    onClick={() => {
                                        if (viewingPolicy) {
                                            handleAcknowledgment(viewingPolicy);
                                            markAsViewed(viewingPolicy);
                                        }
                                    }}
                                    disabled={!!(viewingPolicy && onboardingStatus?.tasks.acknowledgments?.items?.[viewingPolicy as keyof typeof onboardingStatus.tasks.acknowledgments.items])}
                                >
                                    {viewingPolicy && onboardingStatus?.tasks.acknowledgments?.items?.[viewingPolicy as keyof typeof onboardingStatus.tasks.acknowledgments.items]
                                        ? "Accepted"
                                        : "I have read and understood"
                                    }
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Training Center Modal */}
                    <Dialog open={isTrainingCenterOpen} onOpenChange={setIsTrainingCenterOpen}>
                        <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col p-0 gap-0">
                            <DialogHeader className="px-6 py-4 border-b">
                                <DialogTitle>Security Training Center</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-hidden bg-slate-50 p-4">
                                {effectiveClientId && employee?.id && (
                                    <TrainingModuleViewer
                                        clientId={effectiveClientId}
                                        employeeId={employee.id}
                                        initialModuleId={activeTrainingModuleId}
                                    />
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Task 5: Account Security Setup */}
                    <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${onboardingStatus?.tasks.security?.complete ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        <Lock className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-xl">Task 3: Account Security Setup</CardTitle>
                                            {onboardingStatus?.tasks.security?.complete ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <Circle className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <CardDescription className="mt-1">
                                            {onboardingStatus?.tasks.security?.complete
                                                ? "Security configuration complete"
                                                : "Complete your account security setup"}
                                        </CardDescription>
                                    </div>
                                </div>
                                {!onboardingStatus?.tasks.security?.complete && (
                                    <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                                        Action Required
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <SecurityCheckbox
                                    label="Multi-Factor Authentication (MFA) Enrolled"
                                    checked={onboardingStatus?.tasks.security?.mfaEnrolled || false}
                                    onCheck={(value) => handleSecuritySetup('mfaEnrolled', value)}
                                />
                                <SecurityCheckbox
                                    label="Password Manager Setup Complete"
                                    checked={onboardingStatus?.tasks.security?.passwordManagerSetup || false}
                                    onCheck={(value) => handleSecuritySetup('passwordManagerSetup', value)}
                                />
                                <SecurityCheckbox
                                    label="Security Questions Configured"
                                    checked={onboardingStatus?.tasks.security?.securityQuestionsSet || false}
                                    onCheck={(value) => handleSecuritySetup('securityQuestionsSet', value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Task 6: Asset Receipt Confirmation */}
                    <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${onboardingStatus?.tasks.assets?.complete ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-xl">Task 4: Asset Receipt Confirmation</CardTitle>
                                            {onboardingStatus?.tasks.assets?.complete ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <Circle className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <CardDescription className="mt-1">
                                            {onboardingStatus?.tasks.assets?.complete
                                                ? "All assets confirmed"
                                                : "Confirm receipt of assigned equipment"}
                                        </CardDescription>
                                    </div>
                                </div>
                                {!onboardingStatus?.tasks.assets?.complete && (
                                    <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                                        Action Required
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {onboardingStatus?.tasks.assets?.items && onboardingStatus.tasks.assets.items.length > 0 ? (
                                    onboardingStatus.tasks.assets.items.map((asset: any) => (
                                        <AssetCheckbox
                                            key={asset.type}
                                            label={`${asset.type.charAt(0).toUpperCase() + asset.type.slice(1).replace('_', ' ')} Received`}
                                            checked={asset.status === 'confirmed'}
                                            onCheck={() => handleAssetReceipt(asset.type)}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
                                        <p>No assets assigned to you yet.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Task 5: Device Security (Placeholder) */}
                    <Card className="border-2 border-dashed opacity-75">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-gray-100 text-gray-600">
                                        <Laptop className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-xl">Task 5: Install Security Agent</CardTitle>
                                            <Circle className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <CardDescription className="mt-1">
                                            Coming soon
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge variant="secondary">
                                    Coming Soon
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Install our device security agent to ensure your workstation meets our security standards.
                            </p>
                            <Button variant="outline" disabled className="w-full sm:w-auto">
                                <Shield className="mr-2 h-4 w-4" />
                                Install Agent
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Completion Message */}
                {progress.percentage === 100 && (
                    <Card className="border-2 border-green-500 bg-green-50/50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-green-900">Onboarding Complete!</h3>
                                    <p className="text-sm text-green-700">
                                        You're all set. Welcome to the team!
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {exceptionPolicyId && (
                    <ExceptionRequestDialog
                        open={isExceptionDialogOpen}
                        onOpenChange={setIsExceptionDialogOpen}
                        policyId={exceptionPolicyId}
                        employeeId={employee?.id || 0}
                    />
                )}
            </div>
        </DashboardLayout>
    );

    // Handler functions
    function handleAcknowledgment(policyId: string) {
        if (!employee || !effectiveClientId) return;

        // If already accepted, do nothing
        if (onboardingStatus?.tasks.acknowledgments?.items?.[policyId as keyof typeof onboardingStatus.tasks.acknowledgments.items]) {
            return;
        }

        // Logic moved to "I have read and understood" button inside the modal
        // This function is now only called when the user clicks the button in the modal
        submitAcknowledgmentMutation?.mutate({
            clientId: effectiveClientId,
            employeeId: employee.id,
            acknowledgmentType: policyId,
            version: "1.0"
        });
    }

    function handleSecuritySetup(field: 'mfaEnrolled' | 'passwordManagerSetup' | 'securityQuestionsSet', value: boolean) {
        if (!employee || !effectiveClientId) return;

        updateSecuritySetupMutation?.mutate({
            clientId: effectiveClientId,
            employeeId: employee.id,
            field,
            value
        });
    }

    function handleAssetReceipt(assetType: string) {
        if (!employee || !effectiveClientId) return;

        confirmAssetReceiptMutation?.mutate({
            clientId: effectiveClientId,
            employeeId: employee.id,
            assetType
        });
    }

    function handleViewPolicy(policyId: string) {
        setViewingPolicy(policyId);
    }
}

// Checkbox Components
function AcknowledgmentCheckbox({
    label,
    checked,
    onCheck,
    onView,
    onException,
    viewed
}: {
    label: string;
    checked: boolean;
    onCheck: () => void;
    onView: () => void;
    onException: () => void;
    viewed: boolean;
}) {
    const canCheck = checked || viewed;

    return (
        <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
                <button
                    onClick={onCheck}
                    disabled={!canCheck && !checked}
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${checked
                        ? 'bg-green-500 border-green-500'
                        : canCheck
                            ? 'border-gray-500 hover:border-green-500 cursor-pointer'
                            : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                        }`}
                >
                    {checked && <CheckCircle2 className="h-4 w-4 text-white" />}
                </button>
                <div className="flex flex-col">
                    <span className={`text-sm ${checked ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {label}
                    </span>
                    {checked ? (
                        <span className="text-xs text-green-600 font-medium">
                            Read & Accepted
                        </span>
                    ) : !canCheck ? (
                        <span className="text-xs text-orange-600">
                            Must view document first
                        </span>
                    ) : null}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {!checked && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onException();
                        }}
                        className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
                    >
                        Request Exception
                    </Button>
                )}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onView();
                    }}
                    className="gap-2 h-8"
                >
                    <Eye className="h-3 w-3" />
                    View
                </Button>
            </div>
        </div>
    );
}

function SecurityCheckbox({ label, checked, onCheck }: { label: string; checked: boolean; onCheck: (value: boolean) => void }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
            <button
                onClick={() => onCheck(!checked)}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${checked
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300 hover:border-blue-500'
                    }`}
            >
                {checked && <CheckCircle2 className="h-4 w-4 text-white" />}
            </button>
            <span className={`text-sm ${checked ? 'text-gray-500' : 'text-gray-900'}`}>
                {label}
            </span>
        </div>
    );
}

function AssetCheckbox({ label, checked, onCheck }: { label: string; checked: boolean; onCheck: () => void }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
            <button
                onClick={onCheck}
                disabled={checked}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${checked
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'border-gray-300 hover:border-indigo-500'
                    }`}
            >
                {checked && <CheckCircle2 className="h-4 w-4 text-white" />}
            </button>
            <span className={`text-sm ${checked ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                {label}
            </span>
        </div>
    );
}
