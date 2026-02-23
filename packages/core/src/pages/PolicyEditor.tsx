import React, { useState, useEffect, useMemo, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Badge } from "@complianceos/ui/ui/badge";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ArrowLeft, Check, Copy, Eye, History, Loader2, Save, Sparkles, Trash2, Shield, AlertTriangle, Clock, Target, CheckCircle2, FileText, Users, Wand2, ShieldAlert, Link as LinkIcon, Unlink, TrendingDown, TrendingUp, ExternalLink, BarChart3, X, Send, RotateCcw, Activity, MessageSquare, Plus } from "lucide-react";
import { marked } from "marked";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@complianceos/ui/ui/dialog";
import RichTextEditor, { RichTextEditorRef } from "@/components/RichTextEditor";
import TurndownService from "turndown";

import { asBlob } from "html-docx-js-typescript";
import { saveAs } from "file-saver";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@complianceos/ui/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@complianceos/ui/ui/popover";
import { cn } from "@/lib/utils";
import ControlDetailsDialog from "@/components/ControlDetailsDialog";
import { RiskDetailsDialog } from "@/components/risk/RiskDetailsDialog";
import { CommentsSection } from "@/components/CommentsSection";
import { Slot } from "@/registry";
import { SlotNames } from "@/registry/slotNames";
import { DistributionDialog } from "@/components/policy/DistributionDialog";
import { PageGuide } from "@/components/PageGuide";

import PolicyLinter from "@/components/policy/PolicyLinter";
import { AiRewriteDialog } from "@/components/policy/AiRewriteDialog";

// Helper logic for Policy Analysis



function decodeEntities(str: string) {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
}

function cleanGeneratedHtml(input: string) {
    let s = input || "";
    // Strip fenced code blocks
    s = s.replace(/```html([\s\S]*?)```/gi, "$1").replace(/```([\s\S]*?)```/gi, "$1");
    // Extract <pre><code>...</code></pre>
    s = s.replace(/<pre[\s\S]*?>[\s\S]*?<code[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/gi, "$1");
    // Decode entities if HTML was serialized as text
    if (s.includes("&lt;") || s.includes("&gt;")) s = decodeEntities(s);
    // Remove outer html/head/body wrappers
    const bodyMatch = s.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) s = bodyMatch[1];
    // Drop style/script tags
    s = s.replace(/<\/?(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
    // Convert <section> to <div>
    s = s.replace(/<section([^>]*)>/gi, "<div$1>").replace(/<\/section>/gi, "</div>");
    return s.trim();
}

function ensureTitleHeading(html: string, title: string) {
    try {
        const container = document.createElement("div");
        container.innerHTML = html || "";
        let h1 = container.querySelector("h1");
        const t = (title || "Information Security Policy").trim();
        if (!h1) {
            h1 = document.createElement("h1");
            h1.textContent = t;
            container.insertBefore(h1, container.firstChild);
        } else if (t && (h1.textContent || "").trim() !== t) {
            h1.textContent = t;
        }
        return container.innerHTML;
    } catch {
        return html;
    }
}

export default function PolicyEditor(props: { id?: string; policyId?: string }) {
    console.log("[PolicyEditor] Rendering...");
    const params = useParams();
    // Prioritize props passed from Route
    const rawClientId = props.id || params.id;
    const rawPolicyId = props.policyId || params.policyId;

    const clientId = Number(rawClientId);
    const policyId = Number(rawPolicyId);

    console.log("[PolicyEditor] Resolved IDs:", {
        props,
        params,
        rawClientId,
        rawPolicyId,
        clientId,
        policyId
    });
    const [location, setLocation] = useLocation();
    const { user } = useAuth();

    const { data: policyData, isLoading: loadingPolicy, refetch: refetchPolicy } = trpc.clientPolicies.get.useQuery(
        { id: policyId, clientId },
        { enabled: !!clientId && !!policyId }
    );

    const updatePolicyMutation = trpc.clientPolicies.update.useMutation();
    const deletePolicyMutation = trpc.clientPolicies.delete.useMutation();
    const publishVersionMutation = trpc.clientPolicies.publish.useMutation();
    const restoreVersionMutation = trpc.clientPolicies.restore.useMutation();
    const refineMutation = trpc.clientPolicies.refine.useMutation();
    const { data: versionHistory, refetch: refetchHistory } = trpc.clientPolicies.history.useQuery(
        { policyId, clientId },
        { enabled: !!policyId && !!clientId }
    );

    // Integations Data
    const { data: linkedRisks, refetch: refetchLinkedRisks } = trpc.clientPolicies.getLinkedRisks.useQuery({ policyId, clientId }, { enabled: !!policyId && !!clientId });
    const { data: linkedControls, refetch: refetchLinkedControls } = trpc.clientPolicies.getLinkedControls.useQuery({ policyId, clientId }, { enabled: !!policyId && !!clientId });
    const { data: availableRisks } = trpc.risks.getAll.useQuery({ clientId }, { enabled: !!clientId });
    const { data: availableControls } = trpc.clientControls.list.useQuery({ clientId }, { enabled: !!clientId });
    const { data: clientData } = trpc.clients.get.useQuery({ id: clientId }, { enabled: !!clientId });
    const { data: employeesList } = trpc.employees.list.useQuery({ clientId }, { enabled: !!clientId });

    const { data: assignments, isLoading: loadingAssignments } = trpc.policyManagement.getAssignments.useQuery(
        { policyId },
        { enabled: !!policyId }
    );

    const linkRiskMutation = trpc.clientPolicies.linkRisk.useMutation();
    const unlinkRiskMutation = trpc.clientPolicies.unlinkRisk.useMutation();
    const linkControlMutation = trpc.clientPolicies.linkControl.useMutation();
    const unlinkControlMutation = trpc.clientPolicies.unlinkControl.useMutation();



    const requestReviewMutation = trpc.clientPolicies.requestReview.useMutation();
    const submitApprovalMutation = trpc.clientPolicies.submitApproval.useMutation();

    const { data: activityLogs, refetch: refetchActivity } = trpc.clientPolicies.activity.useQuery(
        { policyId, clientId },
        { enabled: !!policyId && !!clientId }
    );

    const policy = useMemo(() => policyData?.clientPolicy || policyData, [policyData]);

    const handleRequestReview = async () => {
        if (!selectedReviewers.length) {
            toast.error("Please select at least one reviewer");
            return;
        }

        try {
            await requestReviewMutation.mutateAsync({
                id: policyId,
                clientId,
                reviewers: selectedReviewers,
                dueDate: reviewDueDate,
                message: reviewMessage
            });
            toast.success("Review requested successfully");
            setShowReviewDialog(false);
            setReviewMessage("");
            setSelectedReviewers([]);
            refetchPolicy();
            refetchActivity();
        } catch (error: any) {
            toast.error(error.message || "Failed to request review");
        }
    };

    const handleReviewDecision = async (decision: 'approve' | 'reject') => {
        const feedback = decision === 'reject' ? prompt("Please provide feedback or required changes:") : undefined;
        if (decision === 'reject' && !feedback) return;

        try {
            await submitApprovalMutation.mutateAsync({
                id: policyId,
                clientId,
                decision: decision === 'approve' ? 'approved' : 'changes_requested',
                notes: feedback || `Decision submitted via ${decision === 'approve' ? 'Approval' : 'Rejection'} banner`
            });
            toast.success(decision === 'approve' ? "Policy approved" : "Changes requested");
            refetchPolicy();
            refetchActivity();
        } catch (error: any) {
            toast.error(error.message || "Failed to submit decision");
        }
    };

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
    const [viewMode, setViewMode] = useState<"edit" | "preview" | "links" | "employees" | "history">("edit");
    const [isContentReady, setIsContentReady] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishNotes, setPublishNotes] = useState("");
    const [publishVersion, setPublishVersion] = useState("");
    const [showPublishDialog, setShowPublishDialog] = useState(false);

    // Review Process States
    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
    const [reviewDueDate, setReviewDueDate] = useState<string>("");
    const [reviewMessage, setReviewMessage] = useState("");

    const [draftComment, setDraftComment] = useState<{ quote: string; index: number; length: number } | null>(null);

    const handleInlineComment = (selection: { quote: string; index: number; length: number }) => {
        setDraftComment(selection);
        toast.info("Comment context captured. Type your feedback below.");
        const commentsEl = document.getElementById('collaboration-hub');
        if (commentsEl) {
            commentsEl.scrollIntoView({ behavior: 'smooth' });
        }
    };

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
    const [showRewriteDialog, setShowRewriteDialog] = useState(false);

    const editorRef = useRef<RichTextEditorRef>(null); // Initialized editorRef

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
            totalResidualScore, highRiskCount, criticalRiskCount,
            averageInherentScore, riskReduction, riskLevelCounts,
            hasHighRisks: highRiskCount > 0,
            hasCriticalRisks: criticalRiskCount > 0,
        };
    }, [linkedRisks]);

    const suggestedRisks = useMemo(() => {
        if (!content || !availableRisks || (availableRisks as any[]).length === 0) return [];
        const cleanContent = content.replace(/<[^>]*>/g, ' ').toLowerCase();
        const keywords = cleanContent.split(/\s+/).filter((word: string) => word.length > 4);
        const linkedIds = new Set(linkedRisks?.map((r: any) => r.risk?.id));

        return (availableRisks as any[])
            .filter(r => r && r.id && !linkedIds.has(r.id))
            .map(risk => {
                const text = `${risk.title || ''} ${risk.description || ''}`.toLowerCase();
                const score = keywords.reduce((t: number, k: string) => t + (text.includes(k) ? 1 : 0), 0);
                return { ...risk, score };
            })
            .filter(r => r.score > 0)
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 3);
    }, [content, availableRisks, linkedRisks]);

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

        // Check for gaps
        const hasUnmitigatedHighRisks = riskMetrics?.highRiskCount && implementedCount < riskMetrics.highRiskCount;

        return {
            totalControls: controls.length,
            implementedCount, inProgressCount, notImplementedCount, notApplicableCount,
            implementationRate, hasUnmitigatedHighRisks,
            allImplemented: implementedCount === controls.length,
        };
    }, [linkedControls, linkedRisks, riskMetrics]);

    const suggestedControls = useMemo(() => {
        if (!content || !availableControls || (availableControls as any[]).length === 0) return [];
        const cleanContent = content.replace(/<[^>]*>/g, ' ').toLowerCase();
        const keywords = cleanContent.split(/\s+/).filter((word: string) => word.length > 4);
        const linkedIds = new Set(linkedControls?.map((r: any) => r.clientControl?.id));

        return (availableControls as any[])
            .filter(item => item && item.clientControl && !linkedIds.has(item.clientControl.id))
            .map(item => {
                const text = `${item.clientControl.clientControlId || ''} ${item.control?.name || ''} ${item.control?.description || ''}`.toLowerCase();
                const score = keywords.reduce((t: number, k: string) => t + (text.includes(k) ? 1 : 0), 0);
                return { ...item, score };
            })
            .filter(r => r.score > 0)
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 3);
    }, [content, availableControls, linkedControls]);

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
            if (policy.reviewDueDate) {
                setReviewDueDate(new Date(policy.reviewDueDate).toISOString().split('T')[0]);
            } else {
                setReviewDueDate("");
            }

            // Always parse content as Markdown and convert to HTML for the RichTextEditor
            // This ensures consistent behavior regardless of stored format
            if (policy.content) {
                try {
                    // Start loading phase
                    setIsContentReady(false);

                    // NEW: Smart Loading Logic
                    // 1. Strip wrappers
                    let cleanContent = policy.content.trim();
                    if (cleanContent.startsWith("```")) {
                        cleanContent = cleanContent.replace(/^```(?:markdown)?\s*/i, '').replace(/\s*```$/, '');
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

    useEffect(() => {
        if (!isContentReady) return;
        const updated = ensureTitleHeading(content, name || "Information Security Policy");
        if (updated !== content) {
            setContent(updated);
        }
    }, [isContentReady, name]);

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
                owner,
                reviewDueDate: reviewDueDate || null
            });

            toast.success("Policy updated successfully");
            refetchPolicy();
            refetchActivity();
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
                clientId,
                version: publishVersion || undefined,
                notes: publishNotes
            });
            toast.success("Version published successfully");
            setPublishNotes("");
            setPublishVersion("");
            setShowPublishDialog(false);
            refetchPolicy();
            refetchHistory();
            refetchActivity();
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
                versionId,
                clientId
            });
            toast.success("Version restored to draft");
            refetchPolicy();
            refetchActivity();
            // Need to reload content - useEffect will handle it when policyData changes
        } catch (error: any) {
            console.error("Error restoring version:", error);
            toast.error(error.message || "Failed to restore version");
        }
    };

    const handleAiRewrite = () => {
        setShowRewriteDialog(true);
    };

    const executeAiRewrite = async (instruction: string) => {
        if (!content || !clientId) return;

        toast.promise(
            async () => {
                const res = await refineMutation.mutateAsync({
                    clientId,
                    content,
                    instruction: instruction || "Improve clarity, tone, and formatting.",
                    mode: 'refine',
                    context: {
                        clientName: policyData?.clientName || clientData?.name || "the Organization",
                    }
                });

                const text = res.content || "";
                const cleaned = cleanGeneratedHtml(text);
                const html = /<[a-z][\s\S]*>/i.test(cleaned) ? cleaned : (marked.parse(cleaned, { async: false }) as string);

                setContent(html);
                setShowRewriteDialog(false);
                return "Policy rewritten successfully";
            },
            {
                loading: 'Rewriting policy with AI... This process may take a minute.',
                success: (msg) => msg,
                error: (err) => {
                    console.error("AI Rewrite failed:", err);
                    return "Failed to rewrite policy";
                }
            }
        );
    };

    const handleCheckCompliance = () => {
        const element = document.getElementById("policy-linter-section");
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
            toast.info("Review compliance checks below");
        }
    };

    const handleAiFixPlaceholders = async () => {
        if (!content || !clientId) return;

        let clientName = clientData?.name || policyData?.clientName || "the Organization";
        let industry = clientData?.industry || (policyData as any)?.industry || "General";

        // Context from policyData (now enriched by backend)
        if (policyData) {
            if ((policyData as any).clientName) {
                clientName = (policyData as any).clientName;
            }
            if ((policyData as any).industry) {
                industry = (policyData as any).industry;
            }
        }

        toast.promise(
            async () => {
                const res = await refineMutation.mutateAsync({
                    clientId,
                    content,
                    instruction: "Identify and fix placeholders.",
                    mode: 'fix_placeholders',
                    context: {
                        clientName: clientName,
                        industry: industry
                    }
                });

                const text = res.content || "";
                const cleaned = cleanGeneratedHtml(text);
                const html = /<[a-z][\s\S]*>/i.test(cleaned) ? cleaned : (marked.parse(cleaned, { async: false }) as string);

                setContent(html);
                return "Placeholders fixed successfully";
            },
            {
                loading: `Fixing placeholders for ${clientName}...`,
                success: (msg) => msg,
                error: (err) => {
                    console.error("AI Fix failed:", err);
                    return "Failed to fix placeholders";
                }
            }
        );
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
            saveAs(blob as Blob, `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`);
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
                    <AiRewriteDialog
                        open={showRewriteDialog}
                        onOpenChange={setShowRewriteDialog}
                        onRewrite={executeAiRewrite}
                        isPending={refineMutation.isPending}
                    />
                </div>
            </DashboardLayout>
        );
    }
    return (
        <DashboardLayout>
            <div className="w-full max-w-full space-y-6 pl-4 pr-4 py-8 md:pl-20 md:pr-8">
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

                {/* Review Banner */}
                {((policy as any).approvalStatus === 'requested' || (policy.status === 'review' && (policy as any).approvalStatus !== 'changes_requested')) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 p-2 rounded-full">
                                <Users className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-medium text-amber-900">Review Requested</h3>
                                <p className="text-sm text-amber-700">
                                    This policy is currently under review. Please review the content and provide your approval or request changes.
                                </p>
                                {(policy as any).reviewDueDate && (
                                    <p className="text-xs text-amber-600 mt-1 flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Due by: {new Date((policy as any).reviewDueDate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Button
                                variant="outline"
                                className="border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800 w-full md:w-auto"
                                onClick={() => handleReviewDecision('reject')}
                                disabled={submitApprovalMutation.isPending}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Request Changes
                            </Button>
                            <Button
                                className="bg-amber-600 hover:bg-amber-700 text-white w-full md:w-auto"
                                onClick={() => handleReviewDecision('approve')}
                                disabled={submitApprovalMutation.isPending}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve Policy
                            </Button>
                        </div>
                    </div>
                )}

                {(policy as any).approvalStatus === 'changes_requested' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div>
                            <h3 className="font-medium text-red-900">Changes Requested</h3>
                            <p className="text-sm text-red-700">
                                A reviewer has requested changes. Please address the feedback and request review again.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <PageGuide
                            title="Policy Management Guide"
                            description="Build, manage, and distribute your organizational policies."
                            rationale="Policies are the foundation of compliance. This editor ensures they are not just text files, but integrated living documents connected to your risks and controls."
                            howToUse={[
                                { step: "Structure Policy", description: "Use the Rich Text Editor to build well-formatted, readable policies." },
                                { step: "Link Integrations", description: "Connect your policy to the Risks it mitigates and Controls it enforces." },
                                { step: "Publish Version", description: "Create a locked, timestamped record of the policy for auditors." },
                                { step: "Track Attestation", description: "Monitor employee acknowledgment in the Employees tab." }
                            ]}
                            integrations={[
                                { name: "Risk Register", description: "Link to source risks." },
                                { name: "Audit Hub", description: "Export results as evidence." }
                            ]}
                        />

                        <Card>
                            <CardHeader className="pb-0 border-b mb-4">
                                <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-4">
                                    <div className="pb-4">
                                        <CardTitle>Policy Content</CardTitle>
                                        <CardDescription>
                                            {viewMode === "edit"
                                                ? "Edit your policy content using the rich text editor below"
                                                : "Preview how your policy will appear"}
                                        </CardDescription>
                                    </div>
                                    <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="w-full xl:w-auto max-w-full">
                                        <div className="w-full overflow-x-auto no-scrollbar">
                                            <TabsList className="bg-transparent p-0 gap-1 h-auto flex w-max min-w-full">
                                                <TabsTrigger
                                                    value="edit"
                                                    className="data-[state=active]:bg-[#3ABEF9] data-[state=active]:text-white bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] transition-all font-bold px-6 py-2.5 rounded-t-lg data-[state=active]:shadow-none"
                                                >
                                                    Edit
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="preview"
                                                    className="data-[state=active]:bg-[#3ABEF9] data-[state=active]:text-white bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] transition-all font-bold px-6 py-2.5 rounded-t-lg data-[state=active]:shadow-none"
                                                >
                                                    Preview
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="links"
                                                    className="data-[state=active]:bg-[#3ABEF9] data-[state=active]:text-white bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] transition-all font-bold px-6 py-2.5 rounded-t-lg data-[state=active]:shadow-none"
                                                >
                                                    Links
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="employees"
                                                    className="data-[state=active]:bg-[#3ABEF9] data-[state=active]:text-white bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] transition-all font-bold px-6 py-2.5 rounded-t-lg data-[state=active]:shadow-none"
                                                >
                                                    Employees
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="history"
                                                    className="data-[state=active]:bg-[#3ABEF9] data-[state=active]:text-white bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] transition-all font-bold px-6 py-2.5 rounded-t-lg data-[state=active]:shadow-none"
                                                >
                                                    History
                                                </TabsTrigger>
                                            </TabsList>
                                        </div>
                                    </Tabs>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Tabs value={viewMode}>
                                    <TabsContent value="edit" className="m-0 space-y-4">
                                        {/* Approval Status Banners */}
                                        {(policy as any)?.approvalStatus === 'requested' && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                        <Users className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-blue-900">Review Requested</h4>
                                                        <p className="text-sm text-blue-700">
                                                            This policy is currently under review by assigned team members.
                                                            {(policy as any).reviewDueDate && ` Due by ${new Date((policy as any).reviewDueDate).toLocaleDateString()}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                {user && (policy as any).reviewers?.includes(String(user.id)) && (
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                                            onClick={() => handleReviewDecision('reject')}
                                                        >
                                                            Request Changes
                                                        </Button>
                                                        <Button
                                                            className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                                            onClick={() => handleReviewDecision('approve')}
                                                        >
                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                            Approve Policy
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {(policy as any)?.approvalStatus === 'changes_requested' && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-amber-900">Changes Requested</h4>
                                                        <p className="text-sm text-amber-700">
                                                            Reviewers have requested changes. Please check the Collaboration Hub for feedback and resolve issues before resubmitting.
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="border-amber-300 text-amber-800 hover:bg-amber-100"
                                                    onClick={() => setShowReviewDialog(true)}
                                                >
                                                    <RotateCcw className="mr-2 h-4 w-4" />
                                                    Resubmit for Review
                                                </Button>
                                            </div>
                                        )}

                                        {(policy as any)?.approvalStatus === 'approved' && (policy as any)?.status !== 'approved' && (
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-emerald-900">Policy Approved</h4>
                                                        <p className="text-sm text-emerald-700">
                                                            This policy has passed review and is ready to be published as a formal version.
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                                    onClick={() => setShowPublishDialog(true)}
                                                >
                                                    <History className="mr-2 h-4 w-4" />
                                                    Publish Version
                                                </Button>
                                            </div>
                                        )}
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
                                                    onAiRewrite={handleAiRewrite}
                                                    onAiFix={handleAiFixPlaceholders}
                                                    onComment={handleInlineComment}
                                                    onCheckCompliance={handleCheckCompliance}
                                                    ref={editorRef}
                                                />
                                            ) : (
                                                <div className="min-h-[400px] flex items-center justify-center bg-slate-50 rounded-lg border">
                                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div id="policy-linter-section">
                                            <PolicyLinter
                                                content={content}
                                                onInsertSection={(html) => {
                                                    setContent((prev) => `${prev || ""}\n${html}`);
                                                }}
                                                onReplaceContent={(html) => {
                                                    setContent(html);
                                                }}
                                                clientId={clientId}
                                                policyId={policyId}
                                                orgName={clientData?.name}
                                                onPublish={() => setShowPublishDialog(true)}
                                                onExportWord={handleExportWord}
                                                publishDisabled={policy?.approvalStatus !== 'approved'}
                                                publishTooltip={policy?.approvalStatus === 'requested' ? "Awaiting Review" : "Requires Approval"}
                                            />
                                        </div>
                                        <div className="mt-8 border-t pt-6" id="collaboration-hub">
                                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                                <MessageSquare className="h-5 w-5 text-blue-600" />
                                                Collaboration Hub
                                            </h3>
                                            <CommentsSection
                                                clientId={clientId}
                                                entityType="policy"
                                                entityId={policyId}
                                                initialContext={draftComment || undefined}
                                                onClearContext={() => setDraftComment(null)}
                                                onCommentSelect={(ctx) => {
                                                    editorRef.current?.scrollToHighlight(ctx.index, ctx.length, ctx.quote);
                                                }}
                                            />
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="preview" className="m-0">
                                        <div className="prose prose-sm max-w-none">
                                            <h1>{name}</h1>
                                            <div dangerouslySetInnerHTML={renderPreview()} />

                                            <div className="mt-8 border-t pt-6" id="collaboration-hub-preview">
                                                <h3 className="text-lg font-medium mb-4">Auditor Comments & Feedback</h3>
                                                <CommentsSection
                                                    clientId={clientId}
                                                    entityType="policy"
                                                    entityId={policyId}
                                                    initialContext={draftComment || undefined}
                                                    onClearContext={() => setDraftComment(null)}
                                                    onCommentSelect={(ctx) => {
                                                        setViewMode("edit"); // Switch to edit mode to see the editor
                                                        // Wait for tab switch
                                                        setTimeout(() => {
                                                            editorRef.current?.scrollToHighlight(ctx.index, ctx.length, ctx.quote);
                                                        }, 100);
                                                    }}
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
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            {/* Version History Column */}
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b">
                                                    <History className="h-5 w-5 text-purple-600" />
                                                    Version History
                                                </h3>
                                                <div className="space-y-3">
                                                    {versionHistory && versionHistory.length > 0 ? (
                                                        versionHistory.map((v: any) => (
                                                            <div key={v.version.id} className="relative group">
                                                                <div className="flex items-start justify-between p-4 border rounded-xl bg-white hover:border-purple-200 hover:shadow-sm transition-all">
                                                                    <div className="space-y-1.5 flex-1 pr-4">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-sm">{v.version.version}</span>
                                                                            <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold border-purple-200 text-purple-700 bg-purple-50">
                                                                                {v.version.status}
                                                                            </Badge>
                                                                            <span className="text-xs text-muted-foreground ml-auto sm:ml-0">
                                                                                {new Date(v.version.createdAt).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-sm text-slate-600 leading-relaxed">
                                                                            {v.version.description || <span className="italic text-slate-400">No description provided</span>}
                                                                        </p>
                                                                        <div className="flex items-center gap-2 pt-1">
                                                                            <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                                                {(v.publisher?.name || "?").charAt(0)}
                                                                            </div>
                                                                            <span className="text-xs text-slate-500 font-medium">
                                                                                Published by {v.publisher?.name || "Unknown"}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 text-slate-600"
                                                                        onClick={() => handleRestoreVersion(v.version.id)}
                                                                    >
                                                                        <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                                                        Restore
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-slate-50/50">
                                                            <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                                            <p className="font-medium">No published versions yet</p>
                                                            <p className="text-xs text-slate-400 mt-1">Publish a version to see history here</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Activity Log Column */}
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b">
                                                    <Activity className="h-5 w-5 text-blue-600" />
                                                    Activity Log
                                                </h3>
                                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {activityLogs && activityLogs.length > 0 ? (
                                                        activityLogs.map((item: any) => {
                                                            const details = typeof item.log.details === 'string'
                                                                ? JSON.parse(item.log.details || '{}')
                                                                : (item.log.details || {});

                                                            let Icon = Activity;
                                                            let bgClass = "bg-blue-50 text-blue-600 border-blue-100";

                                                            switch (item.log.action) {
                                                                case 'approve_policy': Icon = CheckCircle2; bgClass = "bg-green-50 text-green-600 border-green-100"; break;
                                                                case 'reject_policy': Icon = X; bgClass = "bg-red-50 text-red-600 border-red-100"; break;
                                                                case 'request_review': Icon = Users; bgClass = "bg-indigo-50 text-indigo-600 border-indigo-100"; break;
                                                                case 'publish': Icon = Save; bgClass = "bg-purple-50 text-purple-600 border-purple-100"; break;
                                                                case 'update': Icon = FileText; bgClass = "bg-slate-50 text-slate-600 border-slate-200"; break;
                                                                case 'restore': Icon = RotateCcw; bgClass = "bg-amber-50 text-amber-600 border-amber-100"; break;
                                                                case 'create': Icon = Plus; bgClass = "bg-emerald-50 text-emerald-600 border-emerald-100"; break;
                                                                case 'comment': Icon = MessageSquare; bgClass = "bg-blue-50 text-blue-600 border-blue-100"; break;
                                                            }

                                                            return (
                                                                <div key={item.log.id} className="group relative pl-4 pb-4 last:pb-0">
                                                                    {/* Timeline connector */}
                                                                    <div className="absolute left-[27px] top-8 bottom-0 w-px bg-slate-200 group-last:hidden"></div>

                                                                    <div className="flex gap-4">
                                                                        <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm z-10 ${bgClass}`}>
                                                                            <Icon className="h-4 w-4" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0 bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                                                                            <div className="flex items-start justify-between gap-3 mb-1">
                                                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                                                    {item.log.action.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                                                </p>
                                                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-slate-50 px-1.5 py-0.5 rounded border">
                                                                                    {new Date(item.log.createdAt).toLocaleDateString()}
                                                                                </span>
                                                                            </div>

                                                                            <p className="text-xs text-slate-600 mb-2 flex items-center gap-1.5">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                                                Performed by <span className="font-semibold text-slate-800">{item.user?.name || item.user?.email || 'System'}</span>
                                                                            </p>

                                                                            {(Object.keys(details).length > 0) && (
                                                                                <div className="text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded border border-slate-100/50 space-y-1">
                                                                                    {details.name && <div className="flex gap-2"><span className="font-medium text-slate-500 w-16 shrink-0">Name:</span> <span>{details.name}</span></div>}
                                                                                    {details.changes && <div className="flex gap-2"><span className="font-medium text-slate-500 w-16 shrink-0">Changes:</span> <span>{Array.isArray(details.changes) ? details.changes.join(', ') : details.changes}</span></div>}
                                                                                    {details.content && <div className="flex gap-2"><span className="font-medium text-slate-500 w-16 shrink-0">Content:</span> <span className="truncate">{details.content}</span></div>}
                                                                                    {details.message && <div className="flex gap-2"><span className="font-medium text-slate-500 w-16 shrink-0">Message:</span> <span>{details.message}</span></div>}
                                                                                    {details.notes && <div className="flex gap-2"><span className="font-medium text-slate-500 w-16 shrink-0">Notes:</span> <span>{details.notes}</span></div>}
                                                                                    {details.feedback && <div className="flex gap-2"><span className="font-medium text-slate-500 w-16 shrink-0">Feedback:</span> <span className="text-orange-700 italic">"{details.feedback}"</span></div>}
                                                                                    {details.version && <div className="flex gap-2"><span className="font-medium text-slate-500 w-16 shrink-0">Version:</span> <span className="font-mono bg-white px-1 rounded border">{details.version}</span></div>}
                                                                                    {details.reviewers && <div className="flex gap-2"><span className="font-medium text-slate-500 w-16 shrink-0">Reviewers:</span> <span>{Array.isArray(details.reviewers) ? `${details.reviewers.length} assigned` : details.reviewers}</span></div>}
                                                                                    {details.restoredFromVersion && <div className="flex gap-2"><span className="font-medium text-slate-500 w-16 shrink-0">Source:</span> <span>{details.restoredFromVersion}</span></div>}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-slate-50/50">
                                                            <Activity className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                                            <p className="font-medium">No activity recorded yet</p>
                                                            <p className="text-xs text-slate-400 mt-1">Actions performed on this policy will appear here</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="links" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Compliance Dashboard</h2>
                                                <p className="text-sm text-slate-500">Mapping policy enforcement to risk mitigation and controls.</p>
                                            </div>
                                        </div>

                                        {/* Executive summary header */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100 shadow-sm overflow-hidden relative group">
                                                <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 group-hover:scale-125 transition-transform duration-500">
                                                    <ShieldAlert size={80} className="text-orange-900" />
                                                </div>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-bold text-orange-900/60 uppercase tracking-wider flex items-center gap-2">
                                                        <ShieldAlert className="h-4 w-4 text-orange-600" />
                                                        Risk Exposure
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-3xl font-black text-orange-950 flex items-baseline gap-2">
                                                        {riskMetrics?.totalRisks || 0}
                                                        <span className="text-sm font-medium text-orange-800/60 font-sans tracking-normal">Mitigated Risks</span>
                                                    </div>
                                                    <div className="mt-4 flex items-center gap-2">
                                                        {riskMetrics && riskMetrics.riskLevelCounts && (riskMetrics.riskLevelCounts.critical > 0 || riskMetrics.riskLevelCounts.high > 0) ? (
                                                            <>
                                                                {riskMetrics.riskLevelCounts.critical > 0 && (
                                                                    <Badge className="bg-red-500 hover:bg-red-600 border-none shadow-sm">{riskMetrics.riskLevelCounts.critical} Critical</Badge>
                                                                )}
                                                                {riskMetrics.riskLevelCounts.high > 0 && (
                                                                    <Badge className="bg-orange-500 hover:bg-orange-600 border-none shadow-sm">{riskMetrics.riskLevelCounts.high} High</Badge>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-xs text-orange-700/50 italic font-medium">No high risks linked</span>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm overflow-hidden relative group">
                                                <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 group-hover:scale-125 transition-transform duration-500">
                                                    <Shield size={80} className="text-emerald-900" />
                                                </div>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-bold text-emerald-900/60 uppercase tracking-wider flex items-center gap-2">
                                                        <Shield className="h-4 w-4 text-emerald-600" />
                                                        Control Presence
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-3xl font-black text-emerald-950 flex items-baseline gap-2">
                                                        {controlMetrics?.totalControls || 0}
                                                        <span className="text-sm font-medium text-emerald-800/60 font-sans tracking-normal">Linked Controls</span>
                                                    </div>
                                                    <div className="mt-4 w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-600 transition-all duration-1000 ease-out"
                                                            style={{ width: `${controlMetrics?.implementationRate || 0}%` }}
                                                        />
                                                    </div>
                                                    <p className="mt-2 text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                                                        {controlMetrics?.implementationRate || 0}% Implementation Rate
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm overflow-hidden relative group">
                                                <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 group-hover:scale-125 transition-transform duration-500">
                                                    <Target size={80} className="text-blue-900" />
                                                </div>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-bold text-blue-900/60 uppercase tracking-wider flex items-center gap-2">
                                                        <Target className="h-4 w-4 text-blue-600" />
                                                        Policy Maturity
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-3xl font-black text-blue-950 flex items-baseline gap-2">
                                                        {controlMetrics && riskMetrics ? (
                                                            <>
                                                                {Math.round((controlMetrics.implementationRate + (riskMetrics.totalRisks > 0 ? 100 : 0)) / 2)}
                                                                <span className="text-sm font-medium text-blue-800/60 font-sans tracking-normal">Coverage Score</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm font-medium">Evaluation Required</span>
                                                        )}
                                                    </div>
                                                    <div className="mt-4">
                                                        <Badge variant="outline" className="border-blue-200 text-blue-700 font-bold bg-white/50 backdrop-blur-sm shadow-sm ring-1 ring-blue-100/50">
                                                            {policy?.approvalStatus === 'approved' ? 'Audit-Ready' : 'In-Development'}
                                                        </Badge>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
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
                                                                <div key={`linked-risk-${item.risk.id}`} className="group flex items-center justify-between p-4 border rounded-xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-300">
                                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                                        {/* Risk Score Badge */}
                                                                        <div className={`${scoreColor} text-white font-bold text-sm w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                                                                            {score}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <a
                                                                                href="#"
                                                                                onClick={(e) => { e.preventDefault(); setSelectedRisk(item.risk); }}
                                                                                className="font-semibold text-sm text-slate-900 hover:text-orange-700 hover:underline flex items-center gap-1.5 truncate cursor-pointer transition-colors"
                                                                            >
                                                                                {item.risk.title}
                                                                                <ExternalLink className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
                                                                            </a>
                                                                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                                                <span className="flex items-center gap-1">Inherent: <strong className="text-slate-700 font-bold">{item.risk.inherentRisk || score}</strong></span>
                                                                                {residualScore < score && (
                                                                                    <>
                                                                                        <span className="text-slate-300">|</span>
                                                                                        <span className="text-green-600 font-semibold flex items-center gap-1">
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
                                                                        className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full shrink-0 transition-all opacity-0 group-hover:opacity-100"
                                                                        title="Unlink Risk"
                                                                        onClick={() => handleUnlinkRisk(item.risk.id)}
                                                                    >
                                                                        <Unlink className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="relative overflow-hidden group p-6 rounded-xl border border-dashed border-orange-200 bg-orange-50/20 text-center transition-all hover:bg-orange-50/40">
                                                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-orange-100/30 rounded-full blur-2xl group-hover:bg-orange-200/40 transition-colors" />
                                                            <ShieldAlert className="h-10 w-10 mx-auto mb-4 text-orange-400 opacity-60 group-hover:scale-110 transition-transform" />
                                                            <h4 className="font-semibold text-orange-950 mb-1">Inherent Risk Coverage Gap</h4>
                                                            <p className="text-sm text-orange-700/70 max-w-xs mx-auto mb-4">
                                                                This policy does not yet mitigate any identified risks. Mapping risks allows for residual risk calculations.
                                                            </p>

                                                            {suggestedRisks.length > 0 && (
                                                                <div className="mb-6 bg-white/60 rounded-xl p-3 border border-orange-100 text-left max-w-sm mx-auto">
                                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 mb-2 flex items-center gap-1">
                                                                        <Sparkles className="h-3 w-3" /> Suggested Risks
                                                                    </p>
                                                                    <div className="space-y-2">
                                                                        {suggestedRisks.map((risk: any) => (
                                                                            <div key={`sug-risk-${risk.id}`} className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-orange-50 text-xs shadow-sm">
                                                                                <span className="truncate font-medium text-orange-950">{risk.title}</span>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="h-6 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                                                    onClick={() => {
                                                                                        setSelectedRiskIds([risk.id]);
                                                                                        setSuggestedRiskIds([risk.id]);
                                                                                        setOpenLinkRisk(true);
                                                                                    }}
                                                                                >
                                                                                    Link
                                                                                </Button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <Button
                                                                variant="outline"
                                                                className="bg-white hover:bg-orange-100/50 border-orange-200 text-orange-700 shadow-sm hover:shadow-md transition-all font-medium"
                                                                onClick={() => setOpenLinkRisk(true)}
                                                            >
                                                                <LinkIcon className="h-4 w-4 mr-2" />
                                                                Browse & Link Risks
                                                            </Button>
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
                                                                <div key={`linked-control-${item.clientControl.id}`} className="group flex items-center justify-between p-4 border rounded-xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300">
                                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                                        {/* Status Badge */}
                                                                        <div className={`${config.color} text-white w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 group-hover:-rotate-3`}>
                                                                            {config.icon}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <a
                                                                                href="#"
                                                                                onClick={(e) => { e.preventDefault(); setSelectedControl(item); }}
                                                                                className="font-semibold text-sm text-slate-900 hover:text-emerald-700 hover:underline flex items-center gap-1.5 cursor-pointer transition-colors"
                                                                            >
                                                                                {item.clientControl.clientControlId && (
                                                                                    <span className="font-mono font-bold text-emerald-700">{item.clientControl.clientControlId}</span>
                                                                                )}
                                                                                <span className="truncate">{item.control?.name || 'Unnamed Control'}</span>
                                                                                <ExternalLink className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
                                                                            </a>
                                                                            <div className="flex items-center gap-3 mt-1">
                                                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold uppercase tracking-wider h-5 bg-emerald-50 text-emerald-700 border-emerald-100">
                                                                                    {config.label}
                                                                                </Badge>
                                                                                {item.clientControl.owner && (
                                                                                    <span className="text-xs text-slate-500">Owner: <span className="text-slate-700 font-medium">{item.clientControl.owner}</span></span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full shrink-0 transition-all opacity-0 group-hover:opacity-100"
                                                                        title="Unlink Control"
                                                                        onClick={() => handleUnlinkControl(item.clientControl.id)}
                                                                    >
                                                                        <Unlink className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="relative overflow-hidden group p-6 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/20 text-center transition-all hover:bg-emerald-50/40">
                                                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-emerald-100/30 rounded-full blur-2xl group-hover:bg-emerald-200/40 transition-colors" />
                                                            <Shield className="h-10 w-10 mx-auto mb-4 text-emerald-400 opacity-60 group-hover:scale-110 transition-transform" />
                                                            <h4 className="font-semibold text-emerald-950 mb-1">Execution Gap Detected</h4>
                                                            <p className="text-sm text-emerald-700/70 max-w-xs mx-auto mb-4">
                                                                No controls are linked to this policy. Effective policies require active enforcement through linked controls.
                                                            </p>

                                                            {suggestedControls.length > 0 && (
                                                                <div className="mb-6 bg-white/60 rounded-xl p-3 border border-emerald-100 text-left max-w-sm mx-auto">
                                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1">
                                                                        <Sparkles className="h-3 w-3" /> Suggested Controls
                                                                    </p>
                                                                    <div className="space-y-2">
                                                                        {suggestedControls.map((item: any) => (
                                                                            <div key={`sug-ctrl-${item.clientControl.id}`} className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-emerald-50 text-xs shadow-sm">
                                                                                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                                                                    <span className="font-mono font-bold text-emerald-700 shrink-0">{item.clientControl.clientControlId}</span>
                                                                                    <span className="truncate text-emerald-900">{item.control?.name}</span>
                                                                                </div>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="h-6 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0"
                                                                                    onClick={() => {
                                                                                        setSelectedControlIds([item.clientControl.id]);
                                                                                        setSuggestedControlIds([item.clientControl.id]);
                                                                                        setOpenLinkControl(true);
                                                                                    }}
                                                                                >
                                                                                    Link
                                                                                </Button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <Button
                                                                variant="outline"
                                                                className="bg-white hover:bg-emerald-100/50 border-emerald-200 text-emerald-700 shadow-sm hover:shadow-md transition-all font-medium"
                                                                onClick={() => setOpenLinkControl(true)}
                                                            >
                                                                <LinkIcon className="h-4 w-4 mr-2" />
                                                                Browse & Link Controls
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 border-t pt-6" id="collaboration-hub">
                                            <h3 className="text-lg font-medium mb-4">Collaboration Hub</h3>
                                            <CommentsSection
                                                clientId={clientId}
                                                entityType="policy"
                                                entityId={policyId}
                                                initialContext={draftComment || undefined}
                                                onClearContext={() => setDraftComment(null)}
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
                                    <Select
                                        value={owner}
                                        onValueChange={setOwner}
                                    >
                                        <SelectTrigger id="policy-owner">
                                            <SelectValue placeholder="Select policy owner" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {employeesList?.map((employee: any) => {
                                                const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email;
                                                return (
                                                    <SelectItem key={employee.id} value={fullName}>
                                                        {fullName}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
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
                                <div>
                                    <Label htmlFor="policy-review-date">Review Date</Label>
                                    <Input
                                        id="policy-review-date"
                                        type="date"
                                        value={reviewDueDate}
                                        onChange={(e) => setReviewDueDate(e.target.value)}
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Next scheduled review for this policy
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Request Policy Review</DialogTitle>
                                            <DialogDescription>
                                                Assign team members to review this policy before publishing.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label>Reviewers</Label>
                                                {/* Simple multi-select placeholder */}
                                                <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                                                    {employeesList?.map((emp: any) => {
                                                        const id = String(emp.id); // Ensure string ID
                                                        const isSelected = selectedReviewers.includes(id);
                                                        return (
                                                            <div key={emp.id} className="flex items-center space-x-2 py-1">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`reviewer-${emp.id}`}
                                                                    checked={isSelected}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedReviewers([...selectedReviewers, id]);
                                                                        } else {
                                                                            setSelectedReviewers(selectedReviewers.filter(r => r !== id));
                                                                        }
                                                                    }}
                                                                    className="rounded border-gray-300"
                                                                />
                                                                <label htmlFor={`reviewer-${emp.id}`} className="text-sm cursor-pointer select-none">
                                                                    {emp.firstName} {emp.lastName} ({emp.email})
                                                                </label>
                                                            </div>
                                                        );
                                                    })}
                                                    {(!employeesList || employeesList.length === 0) && (
                                                        <div className="text-sm text-muted-foreground p-2">No employees found.</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="review-due-date">Due Date</Label>
                                                <Input
                                                    id="review-due-date"
                                                    type="date"
                                                    value={reviewDueDate}
                                                    onChange={(e) => setReviewDueDate(e.target.value)}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="review-message">Message (Optional)</Label>
                                                <Textarea
                                                    id="review-message"
                                                    placeholder="Please review section 4 regarding access control..."
                                                    value={reviewMessage}
                                                    onChange={(e) => setReviewMessage(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Cancel</Button>
                                            <Button onClick={handleRequestReview} disabled={requestReviewMutation.isPending}>
                                                {requestReviewMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                                Send Request
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                <Button
                                    className="w-full justify-start bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] hover:text-white transition-all font-bold mb-2"
                                    onClick={() => setShowReviewDialog(true)}
                                    disabled={(policy as any).approvalStatus === 'requested' || (policy as any).approvalStatus === 'approved'}
                                >
                                    <Users className="mr-2 h-4 w-4" />
                                    {(policy as any).approvalStatus === 'requested' ? "Review Pending" : "Request Review"}
                                </Button>

                                <Button
                                    className="w-full justify-start bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] hover:text-white transition-all font-bold"
                                    onClick={() => setShowDistributionDialog(true)}
                                >
                                    <Users className="mr-2 h-4 w-4" />
                                    Assign to Employees
                                </Button>

                                <Button
                                    className="w-full justify-start bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] hover:text-white transition-all font-bold"
                                    onClick={handleAiFixPlaceholders}
                                >
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Fix Placeholders
                                </Button>

                                <Button
                                    className="w-full justify-start bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] hover:text-white transition-all font-bold"
                                    onClick={handleExportWord}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Export as Word
                                </Button>
                                <Slot
                                    name={SlotNames.POLICY_REWRITE_BUTTON}
                                    props={{
                                        content,
                                        name,
                                        clientId,
                                        policyId,
                                        onRewrite: (html: string) => setContent(html),
                                        className: "w-full justify-start bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] hover:text-white transition-all font-bold",
                                        variant: "ghost"
                                    }}
                                />
                                {import.meta.env.VITE_ENABLE_PREMIUM !== 'true' && (
                                    <div className="text-xs text-muted-foreground px-2 py-1">
                                        Enable Premium (VITE_ENABLE_PREMIUM=true) to use AI rewrite
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <Button
                                        className="w-full justify-start bg-[#1C4D8D] text-white hover:bg-[#3ABEF9] hover:text-white transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => setShowPublishDialog(true)}
                                        disabled={policy.status !== 'approved' && (policy as any).approvalStatus !== 'approved'}
                                    >
                                        <History className="mr-2 h-4 w-4" />
                                        Publish Version
                                    </Button>
                                    {(policy.status !== 'approved' && (policy as any).approvalStatus !== 'approved') && (
                                        <p className="text-xs text-muted-foreground text-center">
                                            Policy must be approved before publishing.
                                        </p>
                                    )}
                                </div>

                                <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Publish New Version</DialogTitle>
                                            <DialogDescription>
                                                Create a new version snapshot. This will mark the policy as "Approved" and save the current content to history.
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

            {
                selectedControl && (
                    <ControlDetailsDialog
                        open={!!selectedControl}
                        onOpenChange={(open) => !open && setSelectedControl(null)}
                        clientControl={selectedControl.clientControl}
                        control={selectedControl.control}
                        clientId={clientId}
                        onUpdate={() => refetchLinkedControls()}
                    />
                )
            }

            <DistributionDialog
                policyId={policyId}
                clientId={clientId}
                open={showDistributionDialog}
                onOpenChange={setShowDistributionDialog}
            />
            <AiRewriteDialog
                open={showRewriteDialog}
                onOpenChange={setShowRewriteDialog}
                onRewrite={executeAiRewrite}
                isPending={refineMutation.isPending}
            />
        </DashboardLayout >
    );
}
