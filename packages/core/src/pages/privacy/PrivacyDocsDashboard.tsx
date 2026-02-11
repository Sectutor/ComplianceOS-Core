
import { useAuth } from "@/contexts/AuthContext";
import { PrivacyLayout } from "./PrivacyLayout"; // Use PrivacyLayout
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Switch } from "@complianceos/ui/ui/switch";
import { Badge } from "@complianceos/ui/ui/badge";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Skeleton } from "@complianceos/ui/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { trpc } from "@/lib/trpc";
import { FileText, Plus, Trash2, Edit, FileDown, Sparkles, FileSearch, Shield } from "lucide-react";
import PolicyReviewDialog from "@/components/PolicyReviewDialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@complianceos/ui/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useStreamingAI } from "@/hooks/useStreamingAI";
import { PageGuide } from "@/components/PageGuide";
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

export default function PrivacyDocsDashboard() {
    const params = useParams();
    const idParam = params.clientId || params.id;
    const clientId = parseInt(idParam || "0");
    const { user } = useAuth();
    const [location, setLocation] = useLocation();

    const { data: client, isLoading: clientLoading } = trpc.clients.get.useQuery(
        { id: clientId },
        { enabled: clientId > 0 }
    );

    // Fetch PRIVACY module policies
    const { data: privacyPolicies, isLoading: policiesLoading, refetch: refetchPolicies } = trpc.clientPolicies.list.useQuery(
        { clientId, module: 'privacy' },
        { enabled: clientId > 0 }
    );

    // We can still use templates, maybe later filter them by category 'privacy' if supported
    const { data: policyTemplates } = trpc.policyTemplates.list.useQuery();

    const [isAddPolicyOpen, setIsAddPolicyOpen] = useState(false);
    const [isPolicyReviewOpen, setIsPolicyReviewOpen] = useState(false);
    const [creationStep, setCreationStep] = useState<'select' | 'config'>('select');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
    const [tailorToIndustry, setTailorToIndustry] = useState(false); // Default to false for faster creation
    const [customInstruction, setCustomInstruction] = useState("");
    const [deletePolicyId, setDeletePolicyId] = useState<number | null>(null);

    const { text: streamedContent, isLoading: isStreaming, generate: generateStream, reset: resetStream } = useStreamingAI();

    const addPolicyMutation = trpc.clientPolicies.create.useMutation({
        onSuccess: () => {
            toast.success("Document created");
            setIsAddPolicyOpen(false);
            refetchPolicies();
            resetStream();
            setCreationStep('select');
            setSelectedTemplateId(undefined);
            setCustomInstruction("");
        },
        onError: (error) => toast.error(error.message),
    });

    const deletePolicyMutation = trpc.clientPolicies.delete.useMutation({
        onSuccess: () => {
            toast.success("Document deleted");
            refetchPolicies();
            setDeletePolicyId(null);
        },
        onError: (error) => toast.error(error.message),
    });

    const handleAddPolicy = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const templateId = selectedTemplateId ? parseInt(selectedTemplateId) : undefined;

        addPolicyMutation.mutate({
            clientId,
            templateId: templateId || undefined, // undefined is fine for optional fields in TRPC if defined as optional()
            name,
            content: streamedContent || "",
            tailor: tailorToIndustry,
            instruction: customInstruction || "", // Use empty string instead of undefined
            module: 'privacy'
        });
    };

    if (clientLoading) {
        return (
            <PrivacyLayout clientId={clientId}>
                <div className="space-y-6">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </PrivacyLayout>
        );
    }

    if (!client) return null;

    // Privacy-focused template names to filter
    const privacyKeywords = [
        'privacy', 'gdpr', 'data protection', 'data retention', 'data breach',
        'dsar', 'dpa', 'lia', 'legitimate interests', 'data processing',
        'subject rights', 'consent', 'data subject'
    ];

    // Hardcoded recommended privacy documents (fallback)
    const privacyDocTypes = [
        { name: "Privacy Policy / Notice", description: "External-facing transparency document for data subjects." },
        { name: "Legitimate Interests Assessment (LIA)", description: "Assessment for processing based on legitimate interests." },
        { name: "Data Retention Schedule", description: "Policy defining how long data types are kept." },
        { name: "Data Subject Rights Procedure", description: "Internal procedure for handling SARs/DSARs." },
    ];

    // Filter templates to only show privacy-relevant ones
    const filteredTemplates = policyTemplates?.filter(t =>
        privacyKeywords.some(keyword => t.name.toLowerCase().includes(keyword))
    ) || [];

    const availableTemplates = filteredTemplates.length > 0
        ? filteredTemplates.map(t => ({ id: t.id, name: t.name, description: "GDPR/Privacy Template" }))
        : privacyDocTypes;

    return (
        <PrivacyLayout clientId={clientId}>
            <div className="space-y-6">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Privacy", href: `/clients/${clientId}/privacy` },
                        { label: "Documentation" },
                    ]}
                />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-down">
                    <PageGuide
                        title="Privacy Documentation"
                        description="Manage and autogenerate privacy policies and notices."
                        rationale="Demonstrate accountability with documented procedures (GDPR Art. 24)."
                        howToUse={[
                            { step: "Create", description: "Use AI templates for Notices, LIAs, and Procedures." },
                            { step: "Review", description: "Tailor content to your specific processing activities." },
                            { step: "Publish", description: "Approve versioned documents for compliance evidence." }
                        ]}
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => setIsAddPolicyOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Document
                        </Button>
                    </div>
                </div>

                {/* Creation Dialog */}
                <EnhancedDialog
                    open={isAddPolicyOpen}
                    onOpenChange={setIsAddPolicyOpen}
                    title={creationStep === 'select' ? 'Select Document Type' : 'Configure Document'}
                    description={creationStep === 'select'
                        ? 'Choose a common privacy document type or start blank.'
                        : 'Customize your document.'}
                    size="xl"
                    footer={
                        <div className="flex justify-end gap-2 w-full">
                            <Button type="button" variant="outline" onClick={() => setIsAddPolicyOpen(false)}>
                                Cancel
                            </Button>
                            {creationStep === 'config' && (
                                <Button
                                    onClick={() => {
                                        const form = document.getElementById('add-privacy-doc-form') as HTMLFormElement;
                                        if (form) form.requestSubmit();
                                    }}
                                    disabled={addPolicyMutation.isPending}
                                >
                                    {addPolicyMutation.isPending ? (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                                            Generating...
                                        </>
                                    ) : (
                                        'Create Document'
                                    )}
                                </Button>
                            )}
                        </div>
                    }
                >
                    {creationStep === 'select' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div
                                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50/50 ${selectedTemplateId === undefined ? 'border-primary ring-2 ring-primary/30' : ''}`}
                                    onClick={() => {
                                        setSelectedTemplateId(undefined);
                                        setCustomInstruction("");
                                        setCreationStep('config');
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 rounded-md">
                                            <FileText className="h-6 w-6 text-slate-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Blank Document</p>
                                            <p className="text-xs text-muted-foreground">Start from scratch</p>
                                        </div>
                                    </div>
                                </div>
                                {availableTemplates.map((doc: any, i: number) => (
                                    <div
                                        key={i}
                                        className="border rounded-lg p-4 cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50/50"
                                        onClick={() => {
                                            // Set template ID if available (from DB)
                                            if (doc.id) {
                                                setSelectedTemplateId(doc.id.toString());
                                            } else {
                                                setSelectedTemplateId(undefined);
                                            }

                                            setCustomInstruction(`Create a comprehensive ${doc.name}.`);
                                            setCreationStep('config');

                                            setTimeout(() => {
                                                const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
                                                if (nameInput) nameInput.value = doc.name;
                                            }, 100);
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 rounded-md">
                                                <Shield className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{doc.name}</p>
                                                <p className="text-xs text-muted-foreground">{doc.description || "compliance template"}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {creationStep === 'config' && (
                        <form id="add-privacy-doc-form" onSubmit={handleAddPolicy} className="space-y-4">
                            <div>
                                <Label>Document Name</Label>
                                <Input
                                    name="name"
                                    placeholder="e.g. Data Retention Policy"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/30">
                                <div>
                                    <Label className="text-sm font-medium">Tailor to Industry</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Customize for {client?.industry || 'industry standards'}
                                    </p>
                                </div>
                                <Switch checked={tailorToIndustry} onCheckedChange={setTailorToIndustry} />
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                                        AI Instructions (Optional)
                                    </Label>
                                    <div className="flex gap-2">
                                        <Textarea
                                            placeholder="e.g., 'Ensure it covers California residents specifically'"
                                            value={customInstruction}
                                            onChange={(e) => setCustomInstruction(e.target.value)}
                                            className="h-20 text-sm resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => {
                                            const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
                                            if (!nameInput?.value) {
                                                toast.error("Please enter a name first");
                                                return;
                                            }

                                            const industry = client?.industry || 'technology';
                                            const systemPrompt = `You are an expert Privacy Officer writing a ${nameInput.value} for a company in the ${industry} industry. Write in Markdown. Do NOT wrap in code blocks.`;
                                            const userPrompt = customInstruction
                                                ? `Instructions: ${customInstruction}`
                                                : `Write a standard, comprehensive ${nameInput.value}.`;

                                            generateStream({
                                                systemPrompt,
                                                userPrompt,
                                                temperature: 0.7
                                            });
                                        }}
                                        disabled={isStreaming}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        <Sparkles className="h-3 w-3 mr-2" />
                                        {isStreaming ? "Generating..." : "Generate Preview"}
                                    </Button>
                                </div>

                                {(isStreaming || streamedContent) && (
                                    <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto bg-background text-xs font-mono">
                                        {streamedContent ? (
                                            <div className="whitespace-pre-wrap">{streamedContent}</div>
                                        ) : (
                                            <div className="flex items-center justify-center text-muted-foreground h-16">
                                                <span className="animate-pulse">Waiting for AI...</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </form>
                    )}
                </EnhancedDialog>

                {/* Delete Confirmation */}
                <AlertDialog open={!!deletePolicyId} onOpenChange={() => setDeletePolicyId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Accidental deletion cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deletePolicyId && deletePolicyMutation.mutate({ id: deletePolicyId })}
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>


                {/* List */}
                {policiesLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : privacyPolicies && privacyPolicies.length > 0 ? (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="w-[400px]">Document Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Version</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(privacyPolicies || []).map((item) => (
                                    <TableRow
                                        key={item.id}
                                        className="cursor-pointer hover:bg-slate-50"
                                        onClick={() => setLocation(`/clients/${clientId}/privacy/documents/${item.id}`)}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-blue-100/50">
                                                    <FileText className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <span>{item.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={item.status === "approved" ? "default" : "outline"}>
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">v{item.version}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button size="icon" variant="ghost" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setLocation(`/clients/${clientId}/privacy/documents/${item.id}`);
                                                }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeletePolicyId(item.id);
                                                }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <Card className="py-12 border-dashed">
                        <CardContent className="text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-8 w-8 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">No Privacy Documents</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mb-6">Create your Privacy Policy, Retention Schedule, and other key documents here.</p>
                            <Button onClick={() => setIsAddPolicyOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Document
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PrivacyLayout >
    );
}
