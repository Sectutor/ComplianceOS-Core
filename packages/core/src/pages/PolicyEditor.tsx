import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Badge } from "@complianceos/ui/ui/badge";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ArrowLeft, Save, Eye, FileText, Loader2, History, RotateCcw, HelpCircle, ChevronDown, ChevronUp, Sparkles, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@complianceos/ui/ui/dialog";
import RichTextEditor from "@/components/RichTextEditor";
import { marked } from "marked";
import TurndownService from "turndown";

// @ts-ignore
import { asBlob } from "html-docx-js-typescript";
import { saveAs } from "file-saver";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@complianceos/ui/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@complianceos/ui/ui/popover";
import { Check, X, ShieldAlert, Link as LinkIcon, Unlink, Shield, TrendingDown, TrendingUp, AlertTriangle, ExternalLink, CheckCircle2, Clock, Target, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import ControlDetailsDialog from "@/components/ControlDetailsDialog";
import { RiskDetailsDialog } from "@/components/risk/RiskDetailsDialog";
import { CommentsSection } from "@/components/CommentsSection";
import { Slot } from "@/registry";
import { SlotNames } from "@/registry/slotNames";
import { DistributionDialog } from "@/components/policy/DistributionDialog";

export default function PolicyEditor() {
    const params = useParams();
    const clientId = Number(params.id);
    const policyId = Number(params.policyId);
    const [location, setLocation] = useLocation();

    const { data: policyData, isLoading: loadingPolicy, refetch: refetchPolicy } = trpc.clientPolicies.get.useQuery(
        { id: policyId, clientId },
        { enabled: !!clientId && !!policyId }
    );

    const updatePolicyMutation = trpc.clientPolicies.update.useMutation();
    const deletePolicyMutation = trpc.clientPolicies.delete.useMutation();
    const publishVersionMutation = trpc.clientPolicies.publish.useMutation();
    const restoreVersionMutation = trpc.clientPolicies.restore.useMutation();
    const { data: versionHistory, refetch: refetchHistory } = trpc.clientPolicies.history.useQuery(
        { policyId },
        { enabled: !!policyId }
    );

    // Integations Data
    const { data: linkedRisks, refetch: refetchLinkedRisks } = trpc.clientPolicies.getLinkedRisks.useQuery({ policyId }, { enabled: !!policyId });
    const { data: linkedControls, refetch: refetchLinkedControls } = trpc.clientPolicies.getLinkedControls.useQuery({ policyId }, { enabled: !!policyId });
    const { data: availableRisks } = trpc.risks.getAll.useQuery({ clientId }, { enabled: !!clientId });
    const { data: availableControls } = trpc.clientControls.list.useQuery({ clientId }, { enabled: !!clientId });

    const { data: assignments, isLoading: loadingAssignments } = trpc.policyManagement.getAssignments.useQuery(
        { policyId },
        { enabled: !!policyId }
    );

    const linkRiskMutation = trpc.clientPolicies.linkRisk.useMutation();
    const unlinkRiskMutation = trpc.clientPolicies.unlinkRisk.useMutation();
    const linkControlMutation = trpc.clientPolicies.linkControl.useMutation();
    const unlinkControlMutation = trpc.clientPolicies.unlinkControl.useMutation();

    const sendToIntakeMutation = trpc.intake.createFromPolicy.useMutation({
        onSuccess: () => {
            toast.success("Policy sent to evidence intake!");
        },
        onError: (err) => {
            console.error('[PolicyEditor] intake.createFromPolicy mutation failed:', err);
            toast.error(err.message || "Failed to send to intake");
        }
    });

    const [name, setName] = useState("");
    const [content, setContent] = useState("");
    const [status, setStatus] = useState("draft");
    const [owner, setOwner] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
    const [isContentReady, setIsContentReady] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishNotes, setPublishNotes] = useState("");
    const [publishVersion, setPublishVersion] = useState("");
    const [showPublishDialog, setShowPublishDialog] = useState(false);

    const [showGuide, setShowGuide] = useState(false);

    // Integration States
    const [openLinkRisk, setOpenLinkRisk] = useState(false);
    const [openLinkControl, setOpenLinkControl] = useState(false);
    const [selectedRiskIds, setSelectedRiskIds] = useState<number[]>([]);
    const [selectedControlIds, setSelectedControlIds] = useState<number[]>([]);
    const [suggestedRiskIds, setSuggestedRiskIds] = useState<number[]>([]);
    const [suggestedControlIds, setSuggestedControlIds] = useState<number[]>([]);

    // Detail Dialog States
    const [selectedRisk, setSelectedRisk] = useState<any>(null);
    const [selectedControl, setSelectedControl] = useState<any>(null);
    const [showDistributionDialog, setShowDistributionDialog] = useState(false);

    // Initialize turndown service for HTML to markdown conversion (matching PolicyTemplates.tsx pattern)
    // Initialize turndown service for HTML to markdown conversion (matching PolicyTemplates.tsx pattern)
    // Use 'atx' heading style (## Header) instead of setext (Header\n------)
    const turndownService = useMemo(() => {
        const service = new TurndownService({ headingStyle: 'atx' });
        return service;
    }, []);

    // ==================== COMPUTED METRICS FOR INTEGRATIONS ====================
    // Risk Exposure Metrics
    const riskMetrics = useMemo(() => {
        const risks = (linkedRisks || []).filter((item: any) => item?.risk);
        if (risks.length === 0) return null;

        const totalInherentScore = risks.reduce((sum: number, item: any) => sum + (item.risk?.inherentScore || 0), 0);
        const totalResidualScore = risks.reduce((sum: number, item: any) => sum + (item.risk?.residualScore || item.risk?.inherentScore || 0), 0);
        const highRiskCount = risks.filter((item: any) => (item.risk?.inherentScore || 0) >= 15).length;
        const criticalRiskCount = risks.filter((item: any) => (item.risk?.inherentScore || 0) >= 20).length;
        const averageInherentScore = Math.round(totalInherentScore / risks.length);
        const riskReduction = totalInherentScore > 0 ? Math.round(((totalInherentScore - totalResidualScore) / totalInherentScore) * 100) : 0;

        // Risk level distribution
        const riskLevelCounts = {
            critical: risks.filter((item: any) => (item.risk?.inherentScore || 0) >= 20).length,
            high: risks.filter((item: any) => (item.risk?.inherentScore || 0) >= 15 && (item.risk?.inherentScore || 0) < 20).length,
            medium: risks.filter((item: any) => (item.risk?.inherentScore || 0) >= 9 && (item.risk?.inherentScore || 0) < 15).length,
            low: risks.filter((item: any) => (item.risk?.inherentScore || 0) < 9).length,
        };

        return {
            totalRisks: risks.length,
            totalInherentScore,
            totalResidualScore,
            highRiskCount,
            criticalRiskCount,
            averageInherentScore,
            riskReduction,
            riskLevelCounts,
            hasHighRisks: highRiskCount > 0,
            hasCriticalRisks: criticalRiskCount > 0,
        };
    }, [linkedRisks]);

    // Control Coverage Metrics
    const controlMetrics = useMemo(() => {
        const controls = (linkedControls || []).filter((item: any) => item?.clientControl);
        if (controls.length === 0) return null;

        const implementedCount = controls.filter((item: any) =>
            item.clientControl?.status === 'implemented'
        ).length;
        const inProgressCount = controls.filter((item: any) =>
            item.clientControl?.status === 'in_progress'
        ).length;
        const notImplementedCount = controls.filter((item: any) =>
            item.clientControl?.status === 'not_implemented' || !item.clientControl?.status
        ).length;
        const notApplicableCount = controls.filter((item: any) =>
            item.clientControl?.status === 'not_applicable'
        ).length;

        const implementationRate = Math.round((implementedCount / controls.length) * 100);

        // Check for gaps: high-risk linked risks without adequate control coverage
        const linkedRiskIds = new Set((linkedRisks || []).filter((item: any) => item?.risk).map((item: any) => item.risk.id));
        const hasUnmitigatedHighRisks = riskMetrics?.highRiskCount && implementedCount < riskMetrics.highRiskCount;

        return {
            totalControls: controls.length,
            implementedCount,
            inProgressCount,
            notImplementedCount,
            notApplicableCount,
            implementationRate,
            hasUnmitigatedHighRisks,
            allImplemented: implementedCount === controls.length,
        };
    }, [linkedControls, linkedRisks, riskMetrics]);

    // Gap Analysis Alerts
    const gapAlerts = useMemo(() => {
        const alerts: { type: 'critical' | 'warning' | 'info'; message: string; action?: string; actionType?: 'link_risk' | 'link_control' | 'review_controls' }[] = [];

        // No risks linked
        if (!linkedRisks || linkedRisks.length === 0) {
            alerts.push({
                type: 'info',
                message: 'No risks linked to this policy',
                action: 'Consider linking relevant risks to assess policy coverage',
                actionType: 'link_risk'
            });
        }

        // No controls linked
        if (!linkedControls || linkedControls.length === 0) {
            alerts.push({
                type: 'info',
                message: 'No controls linked to this policy',
                action: 'Link controls to demonstrate how this policy is enforced',
                actionType: 'link_control'
            });
        }

        // High risks without controls
        if (riskMetrics?.highRiskCount && (!controlMetrics || controlMetrics.totalControls === 0)) {
            alerts.push({
                type: 'critical',
                message: `${riskMetrics.highRiskCount} high/critical risk(s) with no linked controls`,
                action: 'Urgent: Link mitigating controls to address high-risk exposures',
                actionType: 'link_control'
            });
        }

        // Controls not implemented
        if (controlMetrics && controlMetrics.notImplementedCount > 0) {
            alerts.push({
                type: 'warning',
                message: `${controlMetrics.notImplementedCount} of ${controlMetrics.totalControls} controls not yet implemented`,
                action: 'Review control implementation status',
                actionType: 'review_controls'
            });
        }

        // Critical risks present
        if (riskMetrics?.criticalRiskCount && riskMetrics.criticalRiskCount > 0) {
            alerts.push({
                type: 'critical',
                message: `${riskMetrics.criticalRiskCount} critical risk(s) affecting this policy`,
                action: 'Immediate attention required for critical risks',
                actionType: 'link_control'
            });
        }

        return alerts;
    }, [linkedRisks, linkedControls, riskMetrics, controlMetrics]);


    // Initialize form with policy data - always parse as Markdown (matching PolicyTemplates.tsx pattern)
    useEffect(() => {
        if (policyData) {
            const policy = policyData.clientPolicy || policyData;
            setName(policy.name || "");
            setStatus(policy.status || "draft");
            setOwner(policy.owner || "");

            // Always parse content as Markdown and convert to HTML for the RichTextEditor
            // This ensures consistent behavior regardless of stored format
            if (policy.content) {
                try {
                    // Start loading phase
                    setIsContentReady(false);

                    // NEW: Smart Loading Logic
                    // 1. Strip wrappers
                    let cleanContent = policy.content;
                    if (cleanContent.trim().startsWith("```markdown")) {
                        cleanContent = cleanContent.replace(/^```markdown\s*/, '').replace(/\s*```$/, '');
                    } else if (cleanContent.trim().startsWith("```")) {
                        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
                    }

                    // 2. Detect if it's already HTML
                    const isHtml = /<[a-z][\s\S]*>/i.test(cleanContent);

                    if (isHtml) {
                        console.log("Detected HTML storage, loading directly");
                        setContent(cleanContent);
                    } else {
                        console.log("Detected Markdown storage, parsing to HTML");
                        const htmlContent = marked.parse(cleanContent, { async: false }) as string;
                        setContent(htmlContent);
                    }
                } catch (error) {
                    console.error("Error parsing markdown:", error);
                    setContent(policy.content);
                } finally {
                    // Mark as ready to render editor
                    setTimeout(() => setIsContentReady(true), 100);
                }
            } else {
                setContent("");
                setIsContentReady(true);
            }
        }
    }, [policyData]);

    const handleSave = async () => {
        if (!clientId || !policyId) {
            toast.error("Missing client or policy ID");
            return;
        }

        setIsSaving(true);
        try {
            // TRANSITION: Save HTML directly to preserve rich formatting.
            // Bypassing turndownService.turndown(content) to prevent data loss.
            const contentToSave = content;

            await updatePolicyMutation.mutateAsync({
                id: policyId,
                clientId,
                name,
                content: contentToSave,
                status,
                owner
            });

            toast.success("Policy updated successfully");
            refetchPolicy();
        } catch (error: any) {
            console.error("Error saving policy:", error);
            toast.error(error.message || "Failed to save policy");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this policy? This action cannot be undone.")) {
            return;
        }

        try {
            await deletePolicyMutation.mutateAsync({ id: policyId, clientId });
            toast.success("Policy deleted successfully");
            setLocation(`/clients/${clientId}/policies`);
        } catch (error: any) {
            console.error("Error deleting policy:", error);
            toast.error(error.message || "Failed to delete policy");
        }
    };

    const handlePublishVersion = async () => {
        if (!policyId) return;
        setIsPublishing(true);
        try {
            await publishVersionMutation.mutateAsync({
                id: policyId,
                version: publishVersion || undefined,
                notes: publishNotes
            });
            toast.success("Version published successfully");
            setPublishNotes("");
            setPublishVersion("");
            setShowPublishDialog(false);
            refetchPolicy();
            refetchHistory();
        } catch (error: any) {
            console.error("Error publishing version:", error);
            toast.error(error.message || "Failed to publish version");
        } finally {
            setIsPublishing(false);
        }
    };

    const handleRestoreVersion = async (versionId: number) => {
        if (!policyId) return;
        if (!confirm("Are you sure you want to restore this version? This will overwrite the current draft.")) return;

        try {
            await restoreVersionMutation.mutateAsync({
                policyId,
                versionId
            });
            toast.success("Version restored to draft");
            refetchPolicy();
            // Need to reload content - useEffect will handle it when policyData changes
        } catch (error: any) {
            console.error("Error restoring version:", error);
            toast.error(error.message || "Failed to restore version");
        }
    };

    const handleLinkRisk = async () => {
        if (selectedRiskIds.length === 0 || !policyId) return;
        try {
            // Link all selected risks
            await Promise.all(
                selectedRiskIds.map(riskId =>
                    linkRiskMutation.mutateAsync({ policyId, riskId })
                )
            );
            toast.success(`${selectedRiskIds.length} risk(s) linked successfully`);
            setOpenLinkRisk(false);
            setSelectedRiskIds([]);
            setSuggestedRiskIds([]);
            refetchLinkedRisks();
        } catch (error: any) {
            toast.error("Failed to link risks");
        }
    };


    const handleUnlinkRisk = async (riskId: number) => {
        if (!policyId) return;
        try {
            await unlinkRiskMutation.mutateAsync({ policyId, riskId });
            toast.success("Risk unlinked successfully");
            refetchLinkedRisks();
        } catch (error: any) {
            toast.error("Failed to unlink risk");
        }
    };

    const handleLinkControl = async () => {
        if (selectedControlIds.length === 0 || !policyId) return;
        try {
            // Link all selected controls
            await Promise.all(
                selectedControlIds.map(controlId =>
                    linkControlMutation.mutateAsync({ policyId, controlId })
                )
            );
            toast.success(`${selectedControlIds.length} control(s) linked successfully`);
            setOpenLinkControl(false);
            setSelectedControlIds([]);
            setSuggestedControlIds([]);
            refetchLinkedControls();
        } catch (error: any) {
            toast.error("Failed to link controls");
        }
    };


    const handleUnlinkControl = async (controlId: number) => {
        if (!policyId) return;
        try {
            await unlinkControlMutation.mutateAsync({ policyId, controlId });
            toast.success("Control unlinked successfully");
            refetchLinkedControls();
        } catch (error: any) {
            toast.error("Failed to unlink control");
        }
    };

    const handleSendToIntake = async () => {
        if (!policyId || !clientId) {
            console.error('[PolicyEditor] Missing required parameters for intake creation:', {
                policyId: !!policyId,
                clientId: !!clientId
            });
            toast.error('Cannot send to intake: missing policy or client ID');
            return;
        }

        try {
            const mutationData = { clientId, policyId };
            console.log('[PolicyEditor] Calling intake.createFromPolicy with:', mutationData);
            await sendToIntakeMutation.mutateAsync(mutationData);
        } catch (e) {
            // Handled by onError
        }
    };



    const handleExportWord = async () => {
        try {
            const htmlString = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${name}</title>
                    <style>
                        body { font-family: 'Calibri', 'Arial', sans-serif; }
                        h1 { color: #2E74B5; border-bottom: 1px solid #2E74B5; padding-bottom: 10px; }
                        h2 { color: #2E74B5; margin-top: 20px; }
                        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                        th { background-color: #F2F2F2; border: 1px solid #DDD; padding: 8px; text-align: left; }
                        td { border: 1px solid #DDD; padding: 8px; }
                    </style>
                </head>
                <body>
                    <h1 style="text-align: center;">${name}</h1>
                    <p style="text-align: center; color: #666; margin-bottom: 30px;">Generated by ComplianceOS</p>
                    ${content}
                    <br/><br/>
                    <hr/>
                    <p style="font-size: 10pt; color: #999; text-align: center;">Confidential - ${new Date().toLocaleDateString()}</p>
                </body>
                </html>
            `;

            const blob = await asBlob(htmlString);
            saveAs(blob, `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`);
            toast.success("Word export downloaded");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export Word document");
        }
    };

    const renderPreview = () => {
        try {
            // Content should already be HTML from RichTextEditor
            // But if it's markdown (e.g., from old data), convert it
            if (content && content.trim() !== "") {
                // Check if content looks like HTML
                if (content.includes('<') && content.includes('>')) {
                    return { __html: content };
                } else {
                    // Convert markdown to HTML
                    return { __html: marked.parse(content, { async: false }) as string };
                }
            }
            return { __html: "" };
        } catch (error) {
            console.error("Error rendering preview:", error);
            return { __html: content || "" };
        }
    };

    if (loadingPolicy) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading policy...</span>
                </div>
            </DashboardLayout>
        );
    }

    if (!policyData) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">Policy not found</h2>
                    <p className="text-muted-foreground mt-2">The policy you're looking for doesn't exist or you don't have access.</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setLocation(`/clients/${clientId}/policies`)}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Policies
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const policy = policyData.clientPolicy || policyData;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <Breadcrumb
                    items={[
                        { label: "Clients", href: "/clients" },
                        { label: `Client ${clientId}`, href: `/clients/${clientId}` },
                        { label: "Policies", href: `/clients/${clientId}/policies` },
                        { label: policy.name || "Policy Editor", href: "#" },
                    ]}
                />

                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">Policy Editor</h1>
                            {(policy as any).isAiGenerated && (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                                    <Sparkles className="mr-1 h-3 w-3" />
                                    AI Generated Draft
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground">Edit and manage your compliance policy</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setLocation(`/clients/${clientId}/policies`)}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setViewMode(viewMode === "edit" ? "preview" : "edit")}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            {viewMode === "edit" ? "Preview" : "Edit"}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isSaving || deletePolicyMutation.isPending}
                        >
                            Delete
                        </Button>
                        {policy.status === 'approved' && (
                            <Button
                                variant="outline"
                                className="text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
                                onClick={handleSendToIntake}
                                disabled={sendToIntakeMutation.isPending}
                            >
                                <Send className="mr-2 h-4 w-4" />
                                {sendToIntakeMutation.isPending ? "Sending..." : "Send to Auditor"}
                            </Button>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || updatePolicyMutation.isPending || !isContentReady}
                        >
                            {isSaving || updatePolicyMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Quick Guide Card */}
                        <Card className="border-blue-100 bg-blue-50/30 overflow-hidden transition-all duration-300">
                            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer hover:bg-blue-50/50" onClick={() => setShowGuide(!showGuide)}>
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                                        <HelpCircle className="h-4 w-4" />
                                    </div>
                                    <CardTitle className="text-base font-semibold text-blue-900">How to use Policy Editor</CardTitle>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100/50">
                                    {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                            </CardHeader>
                            <div className={showGuide ? "block" : "hidden"}>
                                <CardContent className="px-4 pb-4 pt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">1</span>
                                                Structured Formatting
                                            </div>
                                            <p className="text-xs text-blue-700/80 leading-relaxed">
                                                Use the editor to build <strong>well-structured policies</strong>. Proper headings, bullet points, and tables are not just for layout—they ensure your policy is readable and legally sound for auditors.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">2</span>
                                                Audit-Ready History
                                            </div>
                                            <p className="text-xs text-blue-700/80 leading-relaxed">
                                                Compliance requires a <strong>clear trail of changes</strong>. Use the <strong>"History"</strong> tab to demonstrate evolution over time. Restoring a version allows you to safely experiment with new drafts.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">3</span>
                                                Targeted Exporting
                                            </div>
                                            <p className="text-xs text-blue-700/80 leading-relaxed">
                                                Export as <strong>PDF</strong> for final, tamper-proof submissions to auditors. Use the <strong>Word</strong> export if you need to perform external legal reviews or share with third parties.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">4</span>
                                                Official Publication
                                            </div>
                                            <p className="text-xs text-blue-700/80 leading-relaxed">
                                                Publishing creates a <strong>locked timestamped record</strong> of your policy. This is the "Gold Version" that stakeholders should follow and that auditors will evaluate during your assessment.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </div>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Policy Content</CardTitle>
                                        <CardDescription>
                                            {viewMode === "edit"
                                                ? "Edit your policy content using the rich text editor below"
                                                : "Preview how your policy will appear"}
                                        </CardDescription>
                                    </div>
                                    <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                                        <TabsList>
                                            <TabsTrigger value="edit">Edit</TabsTrigger>
                                            <TabsTrigger value="preview">Preview</TabsTrigger>
                                            <TabsTrigger value="integrations">Integrations</TabsTrigger>
                                            <TabsTrigger value="employees">Employees</TabsTrigger>
                                            <TabsTrigger value="history">History</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Tabs value={viewMode}>
                                    <TabsContent value="edit" className="m-0 space-y-4">
                                        <div>
                                            <Label htmlFor="policy-name">Policy Name</Label>
                                            <Input
                                                id="policy-name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Enter policy name"
                                            />
                                        </div>
                                        <div>
                                            <Label>Policy Content</Label>
                                            {isContentReady ? (
                                                <RichTextEditor
                                                    value={content}
                                                    onChange={setContent}
                                                    className="min-h-[400px]"
                                                />
                                            ) : (
                                                <div className="min-h-[400px] flex items-center justify-center bg-slate-50 rounded-lg border">
                                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="preview" className="m-0">
                                        <div className="prose prose-sm max-w-none">
                                            <h1>{name}</h1>
                                            <div dangerouslySetInnerHTML={renderPreview()} />

                                            <div className="mt-8 border-t pt-6">
                                                <h3 className="text-lg font-medium mb-4">Auditor Comments & Feedback</h3>
                                                <CommentsSection
                                                    clientId={clientId}
                                                    entityType="policy"
                                                    entityId={policyId}
                                                />
                                            </div>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="employees" className="m-0">
                                        <div className="space-y-4">
                                            {loadingAssignments ? (
                                                <div className="flex items-center justify-center py-12">
                                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                                </div>
                                            ) : assignments && assignments.length > 0 ? (
                                                <div className="border rounded-md">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Employee</TableHead>
                                                                <TableHead>Job Title</TableHead>
                                                                <TableHead>Status</TableHead>
                                                                <TableHead>Attested Date</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {assignments.map((assignment: any) => (
                                                                <TableRow key={assignment.id}>
                                                                    <TableCell>
                                                                        <div className="font-medium">{assignment.firstName} {assignment.lastName}</div>
                                                                        <div className="text-xs text-muted-foreground">{assignment.email}</div>
                                                                    </TableCell>
                                                                    <TableCell>{assignment.jobTitle || "-"}</TableCell>
                                                                    <TableCell>
                                                                        <Badge variant={
                                                                            assignment.status === 'attested' ? 'default' :
                                                                                assignment.status === 'viewed' ? 'secondary' : 'outline'
                                                                        } className={
                                                                            assignment.status === 'attested' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' :
                                                                                assignment.status === 'viewed' ? 'bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200' : ''
                                                                        }>
                                                                            {assignment.status === 'attested' ? 'Attested' :
                                                                                assignment.status === 'viewed' ? 'Viewed' : 'Pending'}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {assignment.attestedAt ? (
                                                                            <div className="flex items-center text-sm text-muted-foreground">
                                                                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                                                                {new Date(assignment.attestedAt).toLocaleDateString()}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-muted-foreground text-xs">-</span>
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                                    <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                    <p>No employees assigned to this policy yet.</p>
                                                    <Button variant="link" onClick={() => setShowDistributionDialog(true)}>
                                                        Assign Employees
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="history" className="m-0">
                                        <div className="space-y-4">
                                            {versionHistory && versionHistory.length > 0 ? (
                                                versionHistory.map((v: any) => (
                                                    <div key={v.version.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold">{v.version.version}</span>
                                                                <Badge variant="outline">{v.version.status}</Badge>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {new Date(v.version.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm">{v.version.description || "No description provided."}</p>
                                                            <p className="text-xs text-muted-foreground">Published by: {v.publisher?.name || "Unknown"}</p>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleRestoreVersion(v.version.id)}
                                                        >
                                                            <RotateCcw className="mr-2 h-4 w-4" />
                                                            Restore
                                                        </Button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-12 text-muted-foreground">
                                                    <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                                    <p>No version history available for this policy.</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="integrations" className="m-0 space-y-6">
                                        {/* ==================== POLICY RISK & CONTROL DASHBOARD ==================== */}

                                        {/* Gap Alerts Section */}
                                        {gapAlerts.length > 0 && (
                                            <div className="space-y-2">
                                                {gapAlerts.map((alert, idx) => {
                                                    let style = { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', subtext: 'text-blue-700', iconColor: 'text-blue-600' };
                                                    let Icon = Shield;

                                                    if (alert.type === 'critical') {
                                                        style = { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', subtext: 'text-red-700', iconColor: 'text-red-600' };
                                                        Icon = AlertTriangle;
                                                    } else if (alert.type === 'warning') {
                                                        style = { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', subtext: 'text-amber-700', iconColor: 'text-amber-600' };
                                                        Icon = Clock;
                                                    }

                                                    return (
                                                        <div key={`alert-${idx}`} className={`flex items-start gap-3 p-3 border rounded-lg ${style.bg} ${style.border}`}>
                                                            <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${style.iconColor}`} />
                                                            <div className="flex-1">
                                                                <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                                                                    <div>
                                                                        <p className={`font-medium ${style.text}`}>{alert.message}</p>
                                                                        {alert.action && <p className={`text-sm mt-0.5 ${style.subtext}`}>{alert.action}</p>}
                                                                    </div>
                                                                    {alert.actionType && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant={alert.type === 'critical' ? 'destructive' : 'outline'}
                                                                            className={`shrink-0 ${alert.type !== 'critical' ? 'bg-white/50 hover:bg-white' : ''}`}
                                                                            onClick={() => {
                                                                                if (alert.actionType === 'link_risk') setOpenLinkRisk(true);
                                                                                if (alert.actionType === 'link_control') setOpenLinkControl(true);
                                                                                if (alert.actionType === 'review_controls') {
                                                                                    const el = document.getElementById('linked-controls-section');
                                                                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                                                                }
                                                                            }}
                                                                        >
                                                                            {alert.actionType === 'link_risk' ? 'Link Risks' : alert.actionType === 'review_controls' ? 'Review Controls' : 'Link Controls'}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Metrics Summary Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {/* Risk Exposure Score */}
                                            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-orange-800">Risk Exposure</span>
                                                    <ShieldAlert className="h-4 w-4 text-orange-600" />
                                                </div>
                                                <div className="text-2xl font-bold text-orange-900">
                                                    {riskMetrics?.totalInherentScore || 0}
                                                </div>
                                                <p className="text-xs text-orange-700 mt-1">
                                                    {riskMetrics ? `${riskMetrics.totalRisks} linked risk(s)` : 'No risks linked'}
                                                </p>
                                                {riskMetrics?.hasCriticalRisks && (
                                                    <Badge variant="destructive" className="mt-2 text-xs">
                                                        {riskMetrics.criticalRiskCount} Critical
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Risk Reduction */}
                                            <div className="bg-gradient-to-br from-green-50 to-emerald-100/50 border border-emerald-200 rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-emerald-800">Risk Reduction</span>
                                                    <TrendingDown className="h-4 w-4 text-emerald-600" />
                                                </div>
                                                <div className="text-2xl font-bold text-emerald-900">
                                                    {riskMetrics?.riskReduction || 0}%
                                                </div>
                                                <p className="text-xs text-emerald-700 mt-1">
                                                    {riskMetrics ? `Residual: ${riskMetrics.totalResidualScore}` : 'No reduction data'}
                                                </p>
                                            </div>

                                            {/* Control Coverage */}
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-blue-800">Control Coverage</span>
                                                    <Shield className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div className="text-2xl font-bold text-blue-900">
                                                    {controlMetrics?.totalControls || 0}
                                                </div>
                                                <p className="text-xs text-blue-700 mt-1">
                                                    {controlMetrics ? `${controlMetrics.implementedCount} implemented` : 'No controls linked'}
                                                </p>
                                            </div>

                                            {/* Implementation Rate */}
                                            <div className="bg-gradient-to-br from-purple-50 to-violet-100/50 border border-purple-200 rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-purple-800">Implementation</span>
                                                    <Target className="h-4 w-4 text-purple-600" />
                                                </div>
                                                <div className="text-2xl font-bold text-purple-900">
                                                    {controlMetrics?.implementationRate || 0}%
                                                </div>
                                                <div className="mt-2 h-2 bg-purple-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-purple-600 transition-all duration-500"
                                                        style={{ width: `${controlMetrics?.implementationRate || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Risk Level Distribution */}
                                        {riskMetrics && (
                                            <div className="bg-muted/30 rounded-xl p-4 border">
                                                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                                    <BarChart3 className="h-4 w-4" />
                                                    Risk Distribution
                                                </h4>
                                                <div className="flex items-center gap-2 h-8">
                                                    {riskMetrics.riskLevelCounts.critical > 0 && (
                                                        <div
                                                            className="h-full bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold"
                                                            style={{ flex: riskMetrics.riskLevelCounts.critical }}
                                                            title={`${riskMetrics.riskLevelCounts.critical} Critical`}
                                                        >
                                                            {riskMetrics.riskLevelCounts.critical}
                                                        </div>
                                                    )}
                                                    {riskMetrics.riskLevelCounts.high > 0 && (
                                                        <div
                                                            className="h-full bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold"
                                                            style={{ flex: riskMetrics.riskLevelCounts.high }}
                                                            title={`${riskMetrics.riskLevelCounts.high} High`}
                                                        >
                                                            {riskMetrics.riskLevelCounts.high}
                                                        </div>
                                                    )}
                                                    {riskMetrics.riskLevelCounts.medium > 0 && (
                                                        <div
                                                            className="h-full bg-yellow-500 rounded flex items-center justify-center text-white text-xs font-bold"
                                                            style={{ flex: riskMetrics.riskLevelCounts.medium }}
                                                            title={`${riskMetrics.riskLevelCounts.medium} Medium`}
                                                        >
                                                            {riskMetrics.riskLevelCounts.medium}
                                                        </div>
                                                    )}
                                                    {riskMetrics.riskLevelCounts.low > 0 && (
                                                        <div
                                                            className="h-full bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold"
                                                            style={{ flex: riskMetrics.riskLevelCounts.low }}
                                                            title={`${riskMetrics.riskLevelCounts.low} Low`}
                                                        >
                                                            {riskMetrics.riskLevelCounts.low}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500"></span> Critical</span>
                                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500"></span> High</span>
                                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-500"></span> Medium</span>
                                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500"></span> Low</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Visual Relationship Diagram */}
                                        {(riskMetrics || controlMetrics) && (
                                            <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 rounded-xl p-6 border">
                                                <h4 className="text-sm font-medium mb-4 text-center">Policy Relationship Map</h4>
                                                <div className="flex items-center justify-center gap-4">
                                                    {/* Risks Side */}
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="bg-orange-100 border-2 border-orange-300 rounded-lg p-3 flex flex-col items-center min-w-[120px]">
                                                            <ShieldAlert className="h-6 w-6 text-orange-600 mb-1" />
                                                            <span className="text-sm font-medium text-orange-900">Risks</span>
                                                            <span className="text-2xl font-bold text-orange-700">{riskMetrics?.totalRisks || 0}</span>
                                                        </div>
                                                        {riskMetrics?.hasHighRisks && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                {riskMetrics.highRiskCount} High/Critical
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Connection Lines to Policy */}
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-0.5 bg-orange-300"></div>
                                                        <div className="w-0 h-0 border-t-4 border-b-4 border-l-8 border-transparent border-l-orange-400"></div>
                                                    </div>

                                                    {/* Policy (Center) */}
                                                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-blue-400 rounded-xl p-4 flex flex-col items-center min-w-[140px] shadow-md">
                                                        <FileText className="h-8 w-8 text-blue-600 mb-2" />
                                                        <span className="text-sm font-bold text-blue-900">This Policy</span>
                                                        <span className="text-xs text-blue-700 mt-1 text-center truncate max-w-[120px]">{name?.substring(0, 20) || 'Untitled'}</span>
                                                    </div>

                                                    {/* Connection Lines to Controls */}
                                                    <div className="flex items-center">
                                                        <div className="w-0 h-0 border-t-4 border-b-4 border-r-8 border-transparent border-r-emerald-400"></div>
                                                        <div className="w-8 h-0.5 bg-emerald-300"></div>
                                                    </div>

                                                    {/* Controls Side */}
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="bg-emerald-100 border-2 border-emerald-300 rounded-lg p-3 flex flex-col items-center min-w-[120px]">
                                                            <Shield className="h-6 w-6 text-emerald-600 mb-1" />
                                                            <span className="text-sm font-medium text-emerald-900">Controls</span>
                                                            <span className="text-2xl font-bold text-emerald-700">{controlMetrics?.totalControls || 0}</span>
                                                        </div>
                                                        {controlMetrics && (
                                                            <div className="flex items-center gap-1 text-xs">
                                                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                                                                <span className="text-green-700">{controlMetrics.implementedCount} Implemented</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Quick Stats Summary */}
                                                <div className="mt-4 pt-4 border-t flex items-center justify-center gap-6 text-xs text-muted-foreground">
                                                    {riskMetrics && (
                                                        <span>Total Risk Exposure: <strong className="text-orange-700">{riskMetrics.totalInherentScore}</strong></span>
                                                    )}
                                                    {riskMetrics && riskMetrics.riskReduction > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <TrendingDown className="h-3 w-3 text-green-600" />
                                                            Risk Reduced by <strong className="text-green-700">{riskMetrics.riskReduction}%</strong>
                                                        </span>
                                                    )}
                                                    {controlMetrics && (
                                                        <span>Control Coverage: <strong className={controlMetrics.implementationRate === 100 ? 'text-green-700' : 'text-amber-700'}>{controlMetrics.implementationRate}%</strong></span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Linked Risks & Controls Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between" id="linked-risks-section">
                                                    <div>
                                                        <h3 className="text-lg font-medium flex items-center gap-2">
                                                            <ShieldAlert className="h-4 w-4 text-orange-600" />
                                                            Linked Risks
                                                            {riskMetrics && (
                                                                <Badge variant="secondary" className="ml-1 text-xs">{riskMetrics.totalRisks}</Badge>
                                                            )}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">Risks mitigated by this policy</p>
                                                    </div>
                                                    <Dialog open={openLinkRisk} onOpenChange={setOpenLinkRisk}>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" variant="outline">
                                                                <LinkIcon className="h-3 w-3 mr-2" /> Link Risk
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                                                            <DialogHeader>
                                                                <DialogTitle>Link Risks to Policy</DialogTitle>
                                                                <DialogDescription>
                                                                    Select one or more risks to link, or use AI to suggest relevant risks based on policy content.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="py-4 space-y-4 flex-1 overflow-hidden flex flex-col">
                                                                {/* AI Suggestion Button */}
                                                                <div className="flex items-center gap-2">
                                                                    <Slot
                                                                        name={SlotNames.POLICY_RISK_SUGGESTION}
                                                                        props={{
                                                                            content: content,
                                                                            availableRisks: availableRisks,
                                                                            linkedRisks: linkedRisks,
                                                                            onSuggest: (ids: number[]) => {
                                                                                setSuggestedRiskIds(ids);
                                                                                setSelectedRiskIds(ids);
                                                                            }
                                                                        }}
                                                                    />
                                                                    {selectedRiskIds.length > 0 && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setSelectedRiskIds([]);
                                                                                setSuggestedRiskIds([]);
                                                                            }}
                                                                        >
                                                                            Clear All
                                                                        </Button>
                                                                    )}
                                                                </div>

                                                                {/* Selected Risks Display */}
                                                                {selectedRiskIds.length > 0 && (
                                                                    <div className="bg-muted/30 rounded-lg p-3 border">
                                                                        <p className="text-xs font-medium text-muted-foreground mb-2">
                                                                            {selectedRiskIds.length} risk(s) selected
                                                                            {suggestedRiskIds.length > 0 && " (AI suggested)"}
                                                                        </p>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {selectedRiskIds.map(riskId => {
                                                                                const risk = availableRisks?.find((r: any) => r.id === riskId);
                                                                                return (
                                                                                    <span
                                                                                        key={`selected-${riskId}`}
                                                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-100 text-orange-800 text-xs"
                                                                                    >
                                                                                        {risk?.title?.substring(0, 30) || `Risk ${riskId}`}
                                                                                        {risk?.title?.length > 30 && "..."}
                                                                                        <button
                                                                                            onClick={() => setSelectedRiskIds(prev => prev.filter(id => id !== riskId))}
                                                                                            className="ml-1 hover:text-red-600"
                                                                                        >
                                                                                            ×
                                                                                        </button>
                                                                                    </span>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Risk List with Checkboxes */}
                                                                <div className="border rounded-lg flex-1 min-h-0 overflow-y-auto">
                                                                    <Command shouldFilter={Array.isArray(availableRisks) && availableRisks.length > 0}>
                                                                        <CommandInput placeholder="Search risks..." />
                                                                        <CommandList>
                                                                            <CommandEmpty>No risk found.</CommandEmpty>
                                                                            <CommandGroup>
                                                                                {(availableRisks ?? [])
                                                                                    .filter((risk: any) => risk && risk.id != null)
                                                                                    .filter((risk: any) => !linkedRisks?.some((lr: any) => lr.risk?.id === risk.id))
                                                                                    .map((risk: any) => {
                                                                                        const isSelected = selectedRiskIds.includes(risk.id);
                                                                                        const isSuggested = suggestedRiskIds.includes(risk.id);
                                                                                        return (
                                                                                            <CommandItem
                                                                                                key={`risk-${risk.id}`}
                                                                                                value={risk.title || String(risk.id)}
                                                                                                onSelect={() => {
                                                                                                    setSelectedRiskIds(prev =>
                                                                                                        isSelected
                                                                                                            ? prev.filter(id => id !== risk.id)
                                                                                                            : [...prev, risk.id]
                                                                                                    );
                                                                                                }}
                                                                                                className={cn(
                                                                                                    isSuggested && !isSelected && "bg-amber-50"
                                                                                                )}
                                                                                            >
                                                                                                <div className={cn(
                                                                                                    "mr-2 h-4 w-4 border rounded flex items-center justify-center",
                                                                                                    isSelected ? "bg-orange-500 border-orange-500" : "border-muted-foreground"
                                                                                                )}>
                                                                                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                                                                                </div>
                                                                                                <div className="flex-1 truncate">
                                                                                                    <span>{risk.title}</span>
                                                                                                    {isSuggested && !isSelected && (
                                                                                                        <span className="ml-2 text-xs text-amber-600">(suggested)</span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </CommandItem>
                                                                                        );
                                                                                    })}
                                                                            </CommandGroup>
                                                                        </CommandList>
                                                                    </Command>
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setOpenLinkRisk(false);
                                                                        setSelectedRiskIds([]);
                                                                        setSuggestedRiskIds([]);
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    onClick={handleLinkRisk}
                                                                    disabled={selectedRiskIds.length === 0}
                                                                >
                                                                    Link {selectedRiskIds.length > 0 ? `${selectedRiskIds.length} Risk(s)` : "Risks"}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                                    {linkedRisks && linkedRisks.length > 0 ? (
                                                        linkedRisks.filter((item: any) => item && item.risk).map((item: any) => {
                                                            const score = item.risk.inherentScore || 0;
                                                            const scoreColor = score >= 20 ? 'bg-red-500' : score >= 15 ? 'bg-orange-500' : score >= 9 ? 'bg-yellow-500' : 'bg-green-500';
                                                            const residualScore = item.risk.residualScore || item.risk.inherentScore || 0;
                                                            return (
                                                                <div key={`linked-risk-${item.risk.id}`} className="group flex items-center justify-between p-3 border rounded-lg bg-gradient-to-r from-orange-50/50 to-transparent border-orange-100 hover:border-orange-300 transition-colors">
                                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                        {/* Risk Score Badge */}
                                                                        <div className={`${scoreColor} text-white font-bold text-xs w-8 h-8 rounded-lg flex items-center justify-center shrink-0`}>
                                                                            {score}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <a
                                                                                href="#"
                                                                                onClick={(e) => { e.preventDefault(); setSelectedRisk(item.risk); }}
                                                                                className="font-medium text-sm text-orange-950 hover:text-orange-700 hover:underline flex items-center gap-1 truncate cursor-pointer"
                                                                            >
                                                                                {item.risk.title}
                                                                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                                            </a>
                                                                            <div className="flex items-center gap-2 text-xs text-orange-700/70 mt-0.5">
                                                                                <span>Inherent: {item.risk.inherentRisk || score}</span>
                                                                                {residualScore < score && (
                                                                                    <>
                                                                                        <span>→</span>
                                                                                        <span className="text-green-700 flex items-center gap-0.5">
                                                                                            <TrendingDown className="h-3 w-3" />
                                                                                            Residual: {residualScore}
                                                                                        </span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 shrink-0 transition-colors"
                                                                        title="Unlink Risk"
                                                                        onClick={() => handleUnlinkRisk(item.risk.id)}
                                                                    >
                                                                        <Unlink className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                                            <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                            <p className="text-sm">No linked risks</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Controls Section */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between" id="linked-controls-section">
                                                    <div>
                                                        <h3 className="text-lg font-medium flex items-center gap-2">
                                                            <Shield className="h-4 w-4 text-emerald-600" />
                                                            Linked Controls
                                                            {controlMetrics && (
                                                                <Badge variant="secondary" className="ml-1 text-xs">{controlMetrics.totalControls}</Badge>
                                                            )}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">Controls enforcing this policy</p>
                                                    </div>
                                                    <Dialog open={openLinkControl} onOpenChange={setOpenLinkControl}>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" variant="outline">
                                                                <LinkIcon className="h-3 w-3 mr-2" /> Link Control
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                                                            <DialogHeader>
                                                                <DialogTitle>Link Controls to Policy</DialogTitle>
                                                                <DialogDescription>
                                                                    Select one or more controls to link, or use AI to suggest relevant controls based on policy content.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="py-4 space-y-4 flex-1 overflow-hidden flex flex-col">
                                                                {/* AI Suggestion Button */}
                                                                <div className="flex items-center gap-2">
                                                                    <Slot
                                                                        name={SlotNames.POLICY_CONTROL_SUGGESTION}
                                                                        props={{
                                                                            content: content,
                                                                            availableControls: availableControls,
                                                                            linkedControls: linkedControls,
                                                                            onSuggest: (ids: number[]) => {
                                                                                setSuggestedControlIds(ids);
                                                                                setSelectedControlIds(ids);
                                                                            }
                                                                        }}
                                                                    />
                                                                    {selectedControlIds.length > 0 && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setSelectedControlIds([]);
                                                                                setSuggestedControlIds([]);
                                                                            }}
                                                                        >
                                                                            Clear All
                                                                        </Button>
                                                                    )}
                                                                </div>

                                                                {/* Selected Controls Display */}
                                                                {selectedControlIds.length > 0 && (
                                                                    <div className="bg-muted/30 rounded-lg p-3 border">
                                                                        <p className="text-xs font-medium text-muted-foreground mb-2">
                                                                            {selectedControlIds.length} control(s) selected
                                                                            {suggestedControlIds.length > 0 && " (AI suggested)"}
                                                                        </p>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {selectedControlIds.map(controlId => {
                                                                                // Search the FULL unfiltered availableControls list
                                                                                const controlItem = ((availableControls as any[]) ?? []).find(
                                                                                    (c: any) => c?.clientControl?.id === controlId
                                                                                );
                                                                                const displayText = controlItem?.clientControl?.clientControlId || controlItem?.control?.name?.substring(0, 20) || `ID: ${controlId}`;
                                                                                return (
                                                                                    <span
                                                                                        key={`selected-control-${controlId}`}
                                                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs"
                                                                                    >
                                                                                        <span className="font-mono font-semibold">{displayText}</span>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                setSelectedControlIds(prev => prev.filter(id => id !== controlId));
                                                                                            }}
                                                                                            className="ml-0.5 text-emerald-600 hover:text-red-600 font-bold"
                                                                                        >
                                                                                            ×
                                                                                        </button>
                                                                                    </span>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Control List with Checkboxes */}
                                                                <div className="border rounded-lg flex-1 min-h-0 overflow-y-auto">
                                                                    <Command shouldFilter={Array.isArray(availableControls) && availableControls.length > 0}>
                                                                        <CommandInput placeholder="Search controls..." />
                                                                        <CommandList>
                                                                            <CommandEmpty>No control found.</CommandEmpty>
                                                                            <CommandGroup>
                                                                                {((availableControls as any[]) ?? [])
                                                                                    .filter((item: any) => item && item.clientControl && item.clientControl.id != null)
                                                                                    .filter((item: any) => !linkedControls?.some((lc: any) => lc.clientControl?.id === item.clientControl.id))
                                                                                    .map((item: any) => {
                                                                                        const isSelected = selectedControlIds.includes(item.clientControl.id);
                                                                                        const isSuggested = suggestedControlIds.includes(item.clientControl.id);
                                                                                        return (
                                                                                            <CommandItem
                                                                                                key={`control-${item.clientControl.id}`}
                                                                                                value={(item.clientControl.clientControlId || "") + " " + (item.control?.name || "")}
                                                                                                onSelect={() => {
                                                                                                    setSelectedControlIds(prev =>
                                                                                                        isSelected
                                                                                                            ? prev.filter(id => id !== item.clientControl.id)
                                                                                                            : [...prev, item.clientControl.id]
                                                                                                    );
                                                                                                }}
                                                                                                className={cn(
                                                                                                    isSuggested && !isSelected && "bg-amber-50"
                                                                                                )}
                                                                                            >
                                                                                                <div className={cn(
                                                                                                    "mr-2 h-4 w-4 border rounded flex items-center justify-center shrink-0",
                                                                                                    isSelected ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground"
                                                                                                )}>
                                                                                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                                                                                </div>
                                                                                                <div className="flex-1 min-w-0">
                                                                                                    <span className="truncate block">
                                                                                                        {item.clientControl.clientControlId && (
                                                                                                            <span className="font-mono font-bold text-emerald-700 mr-1.5">{item.clientControl.clientControlId}</span>
                                                                                                        )}
                                                                                                        <span className="text-foreground">{item.control?.name || 'Unnamed Control'}</span>
                                                                                                    </span>
                                                                                                    {isSuggested && !isSelected && (
                                                                                                        <span className="text-xs text-amber-600 ml-1">(suggested)</span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </CommandItem>
                                                                                        );
                                                                                    })}
                                                                            </CommandGroup>
                                                                        </CommandList>
                                                                    </Command>
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setOpenLinkControl(false);
                                                                        setSelectedControlIds([]);
                                                                        setSuggestedControlIds([]);
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    onClick={handleLinkControl}
                                                                    disabled={selectedControlIds.length === 0}
                                                                >
                                                                    Link {selectedControlIds.length > 0 ? `${selectedControlIds.length} Control(s)` : "Controls"}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                                    {linkedControls && linkedControls.length > 0 ? (
                                                        linkedControls.filter((item: any) => item && item.clientControl).map((item: any) => {
                                                            const status = item.clientControl?.status || 'not_implemented';
                                                            const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
                                                                'implemented': { color: 'bg-green-500', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Implemented' },
                                                                'in_progress': { color: 'bg-blue-500', icon: <Clock className="h-3 w-3" />, label: 'In Progress' },
                                                                'not_implemented': { color: 'bg-gray-400', icon: <Target className="h-3 w-3" />, label: 'Not Implemented' },
                                                                'not_applicable': { color: 'bg-slate-500', icon: <AlertTriangle className="h-3 w-3" />, label: 'N/A' },
                                                            };
                                                            const config = statusConfig[status] || statusConfig['not_implemented'];
                                                            return (
                                                                <div key={`linked-control-${item.clientControl.id}`} className="group flex items-center justify-between p-3 border rounded-lg bg-gradient-to-r from-emerald-50/50 to-transparent border-emerald-100 hover:border-emerald-300 transition-colors">
                                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                        {/* Status Badge */}
                                                                        <div className={`${config.color} text-white w-8 h-8 rounded-lg flex items-center justify-center shrink-0`}>
                                                                            {config.icon}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <a
                                                                                href="#"
                                                                                onClick={(e) => { e.preventDefault(); setSelectedControl(item); }}
                                                                                className="font-medium text-sm text-emerald-950 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                                                                            >
                                                                                {item.clientControl.clientControlId && (
                                                                                    <span className="font-mono font-bold text-emerald-700">{item.clientControl.clientControlId}</span>
                                                                                )}
                                                                                <span className="truncate">{item.control?.name || 'Unnamed Control'}</span>
                                                                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                                            </a>
                                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                                <Badge variant="outline" className="text-xs px-1.5 py-0">
                                                                                    {config.label}
                                                                                </Badge>
                                                                                {item.clientControl.owner && (
                                                                                    <span className="text-xs text-emerald-700/70">Owner: {item.clientControl.owner}</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 shrink-0 transition-colors"
                                                                        title="Unlink Control"
                                                                        onClick={() => handleUnlinkControl(item.clientControl.id)}
                                                                    >
                                                                        <Unlink className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                                            <Shield className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                            <p className="text-sm">No linked controls</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 border-t pt-6">
                                            <h3 className="text-lg font-medium mb-4">Auditor Comments</h3>
                                            <CommentsSection
                                                clientId={clientId}
                                                entityType="policy"
                                                entityId={policyId}
                                            />
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Policy Details</CardTitle>
                                <CardDescription>Manage policy metadata and status</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {(policy as any).isAiGenerated && (
                                    <div className="mb-2 p-3 bg-purple-50 border border-purple-200 rounded-md text-sm text-purple-900 flex flex-col gap-2">
                                        <div className="flex items-center font-medium">
                                            <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                                            Review Required
                                        </div>
                                        <p className="text-purple-800/80 text-xs">
                                            This policy was drafted by AI. Please review carefully before publishing.
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <Label htmlFor="policy-status">Status</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="review">In Review</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="policy-owner">Owner</Label>
                                    <Input
                                        id="policy-owner"
                                        value={owner}
                                        onChange={(e) => setOwner(e.target.value)}
                                        placeholder="Policy owner or department"
                                    />
                                </div>

                                <div>
                                    <Label>Policy ID</Label>
                                    <div className="text-sm text-muted-foreground font-mono p-2 bg-muted rounded">
                                        {policyId}
                                    </div>
                                </div>

                                <div>
                                    <Label>Client ID</Label>
                                    <div className="text-sm text-muted-foreground font-mono p-2 bg-muted rounded">
                                        {clientId}
                                    </div>
                                </div>

                                <div>
                                    <Label>Last Updated</Label>
                                    <div className="text-sm text-muted-foreground">
                                        {policy.updatedAt
                                            ? new Date(policy.updatedAt).toLocaleString()
                                            : "Never"}
                                    </div>
                                </div>

                                <div>
                                    <Label>Created</Label>
                                    <div className="text-sm text-muted-foreground">
                                        {policy.createdAt
                                            ? new Date(policy.createdAt).toLocaleString()
                                            : "Unknown"}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => setShowDistributionDialog(true)}
                                >
                                    <Users className="mr-2 h-4 w-4" />
                                    Assign to Employees
                                </Button>

                                <Button variant="outline" className="w-full justify-start" onClick={handleExportWord}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Export as Word
                                </Button>
                                <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start">
                                            <History className="mr-2 h-4 w-4" />
                                            Publish Version
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Publish New Version</DialogTitle>
                                            <DialogDescription>
                                                Create a permanent snapshot of the current draft. This version will be listed in the history and can be restored later.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="version-name">Version (optional)</Label>
                                                <Input
                                                    id="version-name"
                                                    placeholder="e.g. v1.1, 2024-Q1 Update"
                                                    value={publishVersion}
                                                    onChange={(e) => setPublishVersion(e.target.value)}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="version-notes">Change Summary</Label>
                                                <Textarea
                                                    id="version-notes"
                                                    placeholder="What changed in this version?"
                                                    value={publishNotes}
                                                    onChange={(e) => setPublishNotes(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>Cancel</Button>
                                            <Button onClick={handlePublishVersion} disabled={isPublishing}>
                                                {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Publish Version
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                <Button variant="outline" className="w-full justify-start">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Create Version
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <RiskDetailsDialog
                open={!!selectedRisk}
                onOpenChange={(open) => !open && setSelectedRisk(null)}
                risk={selectedRisk}
                clientId={clientId}
            />

            {selectedControl && (
                <ControlDetailsDialog
                    open={!!selectedControl}
                    onOpenChange={(open) => !open && setSelectedControl(null)}
                    clientControl={selectedControl.clientControl}
                    control={selectedControl.control}
                    clientId={clientId}
                    onUpdate={() => refetchLinkedControls()}
                />
            )}

            <DistributionDialog
                policyId={policyId}
                clientId={clientId}
                open={showDistributionDialog}
                onOpenChange={setShowDistributionDialog}
            />
        </DashboardLayout>
    );
}