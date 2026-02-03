import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@complianceos/ui/ui/button";
import { marked } from "marked";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Switch } from "@complianceos/ui/ui/switch";
import { Badge } from "@complianceos/ui/ui/badge";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Skeleton } from "@complianceos/ui/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, FileText, Plus, Trash2, Edit, FileDown, Sparkles, FileSearch } from "lucide-react";
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

export default function ClientPoliciesPage() {
    const params = useParams(); // Get raw params to debug
    const idParam = params.clientId || params.id; // Try both parameter names
    const clientId = parseInt(idParam || "0");
    const { user } = useAuth();
    const [location, setLocation] = useLocation();

    console.log("ClientPoliciesPage Debug:", { params, idParam, clientId });

    if (!clientId && typeof window !== 'undefined') {
        const pathParts = window.location.pathname.split('/');
        // path is /clients/123/policies
        const possibleId = pathParts[2];
        console.warn("Retrieved ID from URL fallback:", possibleId);
    }

    const { data: client, isLoading: clientLoading } = trpc.clients.get.useQuery(
        { id: clientId },
        { enabled: clientId > 0 && !!user }
    );

    const { data: clientPolicies, isLoading: policiesLoading, refetch: refetchPolicies } = trpc.clientPolicies.list.useQuery(
        { clientId },
        { enabled: clientId > 0 && !!user }
    );
    const { data: policyTemplates } = trpc.policyTemplates.list.useQuery();

    const [isAddPolicyOpen, setIsAddPolicyOpen] = useState(false);
    const [isPolicyReviewOpen, setIsPolicyReviewOpen] = useState(false);
    const [creationStep, setCreationStep] = useState<'select' | 'config'>('select');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
    const [tailorToIndustry, setTailorToIndustry] = useState(true);
    const [customInstruction, setCustomInstruction] = useState("");
    const [deletePolicyId, setDeletePolicyId] = useState<number | null>(null);

    const { text: streamedContent, isLoading: isStreaming, generate: generateStream, reset: resetStream } = useStreamingAI();

    // Handle auto-opening dialog from query params
    useEffect(() => {
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        if (params?.get('create') === 'true') {
            setIsAddPolicyOpen(true);
            // Clean up the URL parameter
            const newParams = new URLSearchParams(window.location.search);
            newParams.delete('create');
            const newSearch = newParams.toString();
            setLocation(`/clients/${clientId}/policies${newSearch ? '?' + newSearch : ''}`, { replace: true });
        }
    }, [clientId, setLocation]);

    const addPolicyMutation = trpc.clientPolicies.create.useMutation({
        onSuccess: () => {
            toast.success("Policy created");
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
            toast.success("Policy deleted");
            refetchPolicies();
            setDeletePolicyId(null);
        },
        onError: (error) => toast.error(error.message),
    });

    const bulkGeneratePoliciesMutation = trpc.clientPolicies.generateBulk.useMutation({
        onSuccess: () => {
            toast.success("All policies generated!");
            refetchPolicies();
        },
        onError: (error) => toast.error(error.message),
    });

    const handleBulkGeneratePolicies = () => {
        if (!client?.name) {
            toast.error("Client name is required");
            return;
        }
        bulkGeneratePoliciesMutation.mutate({ clientId, companyName: client.name });
    };

    const handleAddPolicy = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const templateId = selectedTemplateId ? parseInt(selectedTemplateId) : undefined;

        const input = {
            clientId,
            name,
            templateId,
            content: streamedContent || undefined, // Keep streamedContent for policy content
            tailor: tailorToIndustry,
            instruction: customInstruction || undefined,
            status: 'draft' as const, // Added status
            module: 'general' as const // Added module
        };
        console.log("[PolicyCreate] Mutation input:", input);
        addPolicyMutation.mutate(input);
    };

    if (clientLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </DashboardLayout>
        );
    }

    if (!client) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold mb-2">Client not found</h2>
                    <Button variant="outline" onClick={() => setLocation('/clients')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Clients
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <Breadcrumb
                    items={[
                        { label: "Clients", href: "/clients" },
                        { label: client.name, href: `/clients/${clientId}/governance` },
                        { label: "Policies" },
                    ]}
                />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-lg font-semibold">Client Policies</h2>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsPolicyReviewOpen(true)}
                        >
                            <FileSearch className="mr-2 h-4 w-4" />
                            Load Policy for Review
                        </Button>
                        {user?.role === 'admin' && (
                            <Button
                                variant="outline"
                                onClick={handleBulkGeneratePolicies}
                                disabled={bulkGeneratePoliciesMutation.isPending}
                            >
                                {bulkGeneratePoliciesMutation.isPending ? 'Generating...' : 'Generate All Policies'}
                            </Button>
                        )}
                        <Button onClick={() => setIsAddPolicyOpen(true)} className="bg-sky-600 hover:bg-sky-700 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Policy
                        </Button>
                    </div>
                </div>

                {/* Policy Creation Dialog */}
                <EnhancedDialog
                    open={isAddPolicyOpen}
                    onOpenChange={setIsAddPolicyOpen}
                    title={creationStep === 'select' ? 'Select Framework Template' : 'Configure Policy'}
                    description={creationStep === 'select'
                        ? 'Choose a template to start with, or continue without one.'
                        : 'Customize your policy settings and AI instructions.'}
                    size="xl"
                    footer={
                        <div className="flex justify-end gap-2 w-full">
                            <Button type="button" variant="outline" onClick={() => setIsAddPolicyOpen(false)}>
                                Cancel
                            </Button>
                            {creationStep === 'config' && (
                                <Button
                                    onClick={() => {
                                        const form = document.getElementById('add-policy-form') as HTMLFormElement;
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
                                        'Create Policy'
                                    )}
                                </Button>
                            )}
                        </div>
                    }
                >
                    {creationStep === 'select' && (
                        <div className="space-y-4">
                            <div className="grid gap-3 max-h-[350px] overflow-y-auto pr-2">
                                <div
                                    className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedTemplateId === undefined ? 'border-primary ring-2 ring-primary/30' : 'hover:border-muted-foreground/50'
                                        }`}
                                    onClick={() => setSelectedTemplateId(undefined)}
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-6 w-6 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">Blank Policy</p>
                                            <p className="text-sm text-muted-foreground">Start from scratch with AI assistance</p>
                                        </div>
                                    </div>
                                </div>
                                {policyTemplates?.map((template) => (
                                    <div
                                        key={template.id}
                                        className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedTemplateId === template.id.toString() ? 'border-primary ring-2 ring-primary/30' : 'hover:border-muted-foreground/50'
                                            }`}
                                        onClick={() => setSelectedTemplateId(template.id.toString())}
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-6 w-6 text-primary" />
                                            <div>
                                                <p className="font-medium">{template.name}</p>
                                                <p className="text-sm text-muted-foreground">{template.framework}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button className="w-full" onClick={() => setCreationStep('config')}>
                                Continue
                            </Button>
                        </div>
                    )}

                    {creationStep === 'config' && (
                        <form id="add-policy-form" onSubmit={handleAddPolicy} className="space-y-4">
                            <div>
                                <Label>Policy Name</Label>
                                <Input
                                    name="name"
                                    placeholder="e.g. Access Control Policy"
                                    defaultValue={
                                        selectedTemplateId
                                            ? policyTemplates?.find((t) => t.id.toString() === selectedTemplateId)?.name
                                            : ''
                                    }
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/30">
                                <div>
                                    <Label className="text-sm font-medium">Tailor to Industry</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Customize content for {client?.industry || 'your industry'}
                                    </p>
                                </div>
                                <Switch checked={tailorToIndustry} onCheckedChange={setTailorToIndustry} />
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                                        Custom Instructions (Optional)
                                    </Label>
                                    <div className="flex gap-2">
                                        <Textarea
                                            placeholder="e.g., 'Make it strict regarding password complexity'"
                                            value={customInstruction}
                                            onChange={(e) => setCustomInstruction(e.target.value)}
                                            className="h-20 text-sm resize-none bg-background flex-1"
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
                                                toast.error("Please enter a policy name first");
                                                return;
                                            }

                                            const selectedTemplate = policyTemplates?.find(t => t.id.toString() === selectedTemplateId);
                                            const templateContent = selectedTemplate?.content || "";
                                            const industry = client?.industry || 'tech';

                                            let systemPrompt = `You are an expert compliance officer for a ${industry} company.`;
                                            let userPrompt = "";

                                            if (templateContent) {
                                                userPrompt = `Please REWRITE and IMPROVE the following policy template to be more sophisticated, comprehensive, and tailored for a ${industry} company.\n\n`;
                                                if (customInstruction) {
                                                    userPrompt += `Additional Instructions: ${customInstruction}\n\n`;
                                                }
                                                userPrompt += `BASE TEMPLATE:\n${templateContent}\n\n`;
                                                userPrompt += `Output the full refined policy in Markdown. Do NOT wrap the output in code blocks (no \`\`\`). Return raw markdown text only. Do NOT include the Policy Title/Name as a header at the start. Start directly with the first section using Markdown headers (e.g. ## 1. Purpose).`;
                                            } else {
                                                systemPrompt = `You are an expert compliance officer writing a ${nameInput.value} for a company in the ${industry} industry. Write in Markdown format. Do NOT wrap output in code blocks. Do NOT include the Policy Title as a header. Start directly with the first section using Markdown headers (e.g. ## 1. Purpose).`;
                                                userPrompt = customInstruction
                                                    ? `Write a comprehensive policy incorporating these instructions: ${customInstruction}`
                                                    : `Write a standard, comprehensive ${nameInput.value}. Use ## for main sections 1. Purpose, etc.`;
                                            }

                                            generateStream({
                                                clientId,
                                                templateId: selectedTemplateId ? parseInt(selectedTemplateId) : undefined,
                                                tailor: tailorToIndustry,
                                                instruction: customInstruction,
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
                                    <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto bg-background">
                                        {streamedContent ? (
                                            <div className="prose prose-sm max-w-none">
                                                <div dangerouslySetInnerHTML={{ __html: marked.parse(streamedContent, { async: false }) as string }} />
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center text-muted-foreground h-16">
                                                <span className="animate-pulse">Waiting for AI...</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <p className="text-[10px] text-muted-foreground">
                                    The AI will tailor the content for <strong>{client?.industry || 'your industry'}</strong>.
                                </p>
                            </div>
                        </form>
                    )}
                </EnhancedDialog>

                {/* Policy Review Dialog */}
                <PolicyReviewDialog
                    open={isPolicyReviewOpen}
                    onOpenChange={setIsPolicyReviewOpen}
                    clientId={clientId}
                />

                {/* Delete Policy Confirmation */}
                <AlertDialog open={!!deletePolicyId} onOpenChange={() => setDeletePolicyId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Policy?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the policy.
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

                {/* Policy List */}
                {policiesLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : clientPolicies && clientPolicies.length > 0 ? (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden bg-white dark:bg-slate-900">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-[#1C4D8D] hover:bg-[#1C4D8D] border-none">
                                    <TableHead className="w-[300px] text-white font-semibold py-4">Policy Name</TableHead>
                                    <TableHead className="w-[150px] text-white font-semibold py-4">Framework</TableHead>
                                    <TableHead className="w-[100px] text-white font-semibold py-4">Status</TableHead>
                                    <TableHead className="w-[80px] text-white font-semibold py-4 text-center">Version</TableHead>
                                    <TableHead className="w-[120px] text-white font-semibold py-4 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clientPolicies?.map((item, index) => {
                                    if (!item?.clientPolicy) return null;
                                    return (
                                        <TableRow
                                            key={item.clientPolicy.id}
                                            className="cursor-pointer bg-white dark:bg-white border-b border-slate-200 transition-all duration-200 ease-in-out hover:bg-slate-50 hover:shadow-sm group"
                                            onClick={() => setLocation(`/clients/${clientId}/policies/${item.clientPolicy.id}`)}
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <TableCell className="font-medium text-black py-4">
                                                <div className="flex items-center gap-3 group-hover:translate-x-1 transition-transform duration-200">
                                                    <div className="p-2 rounded-lg bg-[#1C4D8D]/10 group-hover:bg-[#1C4D8D]/20 transition-colors duration-200">
                                                        <FileText className="h-4 w-4 text-[#1C4D8D]" />
                                                    </div>
                                                    <span>{item.clientPolicy.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600 py-4">
                                                {item.template?.framework || 'Custom'}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge
                                                    variant={
                                                        item.clientPolicy.status === 'review' ? 'secondary' : 'outline'
                                                    }
                                                    className={
                                                        item.clientPolicy.status === 'approved'
                                                            ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                                                            : item.clientPolicy.status === 'draft'
                                                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                                                : ''
                                                    }
                                                >
                                                    {item.clientPolicy.status || 'draft'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-600 text-center py-4">
                                                <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-md bg-white border border-gray-300 text-gray-700 text-xs font-medium">
                                                    v{item.clientPolicy.version || 1}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right py-4">
                                                <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 hover:bg-[#1C4D8D]/10 hover:text-[#1C4D8D] transition-colors duration-200"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setLocation(`/clients/${clientId}/policies/${item.clientPolicy.id}`);
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#1C4D8D]/10 hover:text-[#1C4D8D] transition-colors duration-200" onClick={e => e.stopPropagation()}>
                                                                <FileDown className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="shadow-lg border-slate-200">
                                                            <DropdownMenuLabel>Professional Export</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.location.assign(`/api/export/policy/${item.clientPolicy.id}/professional-docx`);
                                                            }}>
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                Word Document (.docx)
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(`/api/export/policy/${item.clientPolicy.id}/professional-html`, '_blank');
                                                            }}>
                                                                <FileDown className="mr-2 h-4 w-4" />
                                                                PDF (Print from Browser)
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuLabel className="text-xs text-muted-foreground">Simple Export</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.location.assign(`/api/export/policy/${item.clientPolicy.id}/docx`);
                                                            }}>
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                Legacy Word (.docx)
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeletePolicyId(item.clientPolicy.id);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <Card className="py-8">
                        <CardContent className="text-center">
                            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground mb-4">No policies created yet</p>
                            <Button onClick={() => setIsAddPolicyOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create First Policy
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
