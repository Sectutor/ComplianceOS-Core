import { useAuth } from "@/contexts/AuthContext";
import { useClientContext } from "@/contexts/ClientContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Skeleton } from "@complianceos/ui/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Plus, FileText, Search, Trash2, Edit, Filter, Eye, LayoutGrid, List, HelpCircle, ChevronDown, ChevronUp, ArrowRight, CheckCircle2, Sparkles, Loader2, Wand2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@complianceos/ui/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@complianceos/ui/ui/toggle-group";
import { Badge } from "@complianceos/ui/ui/badge";
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
import RichTextEditor from "@/components/RichTextEditor";
import { marked } from "marked";
import TurndownService from "turndown";

const DEFAULT_SECTIONS = [
  "Purpose",
  "Scope",
  "Roles & Responsibilities",
  "Policy Statement",
  "Procedures",
  "Review & Approval"
];

const defaultSectionTitles = [
  "Purpose", "Scope", "Roles and Responsibilities", "Policy Statements",
  "Procedures", "Exceptions", "Enforcement", "Definitions", "References", "Revision History"
];

const sanitizeHtml = (html: string, title: string) => {
  let s = html || "";
  s = s.replace(/```html([\s\S]*?)```/gi, "$1").replace(/```([\s\S]*?)```/gi, "$1");
  s = s.replace(/<pre[\s\S]*?>[\s\S]*?<code[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/gi, "$1");
  s = s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  s = s.replace(/\[object Object\]/g, "");
  const bodyMatch = s.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) s = bodyMatch[1];
  s = s.replace(/<\/?(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  s = s.replace(/<section([^>]*)>/gi, "<div$1>").replace(/<\/section>/gi, "</div>");
  if (!/\<h1[\s\S]*?\>/.test(s)) {
    s = `<h1>${title || "Information Security Policy"}</h1>\n${s}`;
  }
  return s.trim();
};

const baselineText = (title: string) => {
  const t = (title || "").toLowerCase();
  if (t.includes("purpose")) return "This policy establishes objectives and guiding principles to protect information assets and support regulatory compliance across the organization.";
  if (t.includes("scope")) return "This policy applies to all employees, contractors, systems, facilities, and data owned or managed by the organization, regardless of location.";
  if (t.includes("roles")) return "The organization assigns clear responsibilities for policy ownership, approval, implementation, monitoring, and exception handling.";
  if (t.includes("statement")) return "The organization commits to maintaining confidentiality, integrity, and availability of information through documented controls and continuous improvement.";
  if (t.includes("procedures")) return "Procedures define required actions for access control, change management, incident response, backup, and other operational controls.";
  if (t.includes("exceptions")) return "Exceptions must be documented, risk-assessed, time-bound, and approved by an authorized owner with compensating controls.";
  if (t.includes("enforcement")) return "Violations may lead to corrective actions up to and including disciplinary measures, subject to HR and legal review.";
  if (t.includes("definitions")) return "Key terms are defined to ensure consistent understanding across stakeholders and auditors.";
  if (t.includes("references")) return "This policy references applicable standards, regulations, and internal procedures to support implementation and audits.";
  if (t.includes("revision")) return "Version history records authorship, approval dates, and change summaries to maintain traceability.";
  return "This section provides the structured content necessary to implement and audit this policy.";
};

const buildSkeleton = (title: string, sectionTitles?: string[], enhanceBaseline: boolean = true) => {
  const t = (title || "Information Security Policy").trim();
  const secs = (sectionTitles && sectionTitles.length > 0 ? sectionTitles : defaultSectionTitles);
  const parts = secs.map(st => `<h2>${st}</h2>\n<p>${enhanceBaseline ? baselineText(st) : "[Content]"}</p>`);
  return [`<h1>${t}</h1>`, ...parts].join("\n\n");
};

const improveContentFallback = (content: string, template?: any, enhanceBaseline: boolean = true) => {
  const title = template?.name || "Information Security Policy";
  let s = content || "";
  const isHtml = /<[a-z][\s\S]*>/i.test(s);
  if (!isHtml) {
    try {
      s = marked.parse(s, { async: false }) as string;
    } catch { }
  }
  s = s
    .replace(/\bTBD\b/gi, "")
    .replace(/\bLOREM IPSUM\b/gi, "")
    .replace(/\[insert.*?\]/gi, "")
    .replace(/\{\{\s*company(_name)?\s*\}\}/gi, "")
    .replace(/\[\s*Company\s+Name\s*\]/gi, "");
  s = sanitizeHtml(s, title);
  const plain = s.replace(/<[^>]+>/g, " ").trim();
  const sectionTitles = Array.isArray(template?.sections)
    ? (template.sections as any[]).map((x: any) => (typeof x === "object" ? (x.title || "Section") : String(x))).filter(Boolean)
    : undefined;
  if (!plain || plain.length < 300) {
    s = buildSkeleton(title, sectionTitles, enhanceBaseline);
  } else {
    defaultSectionTitles.forEach((st) => {
      const has = new RegExp(`<h2[^>]*>${st}</h2>`, "i").test(s);
      if (!has) {
        s += `\n\n<h2>${st}</h2>\n<p>${baselineText(st)}</p>`;
      }
    });
    s = sanitizeHtml(s, title);
  }
  return s;
};

export default function PolicyTemplates() {
  const { user, session } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [frameworkFilter, setFrameworkFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<number | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<number | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showGuide, setShowGuide] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [templateToGenerate, setTemplateToGenerate] = useState<any>(null);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgradeReport, setUpgradeReport] = useState<any>(null);
  const [enhanceBaseline, setEnhanceBaseline] = useState(true);
  const [useServerUpgrade, setUseServerUpgrade] = useState(false);
  const [isImproveOpen, setIsImproveOpen] = useState(false);
  const [improveTarget, setImproveTarget] = useState<any>(null);
  const [improveInstruction, setImproveInstruction] = useState("");
  const [improvedContent, setImprovedContent] = useState("");
  const [isImproving, setIsImproving] = useState(false);

  // State for RTE content in Create Dialog
  const [createContent, setCreateContent] = useState("");

  const { selectedClientId } = useClientContext();

  const { data: templates, isLoading, refetch } = trpc.policyTemplates.list.useQuery({
    framework: frameworkFilter,
    clientId: selectedClientId || undefined
  });

  const turndownService = useMemo(() => new TurndownService(), []);

  const createMutation = trpc.policyTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Template created successfully");
      setIsCreateOpen(false);
      setCreateContent(""); // Reset content
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.policyTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Template updated successfully");
      setEditingTemplate(null);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.policyTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted");
      setTemplateToDelete(null);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const upgradeMutation = trpc.policyTemplates.upgradeAll.useMutation({
    onSuccess: (data: any) => setUpgradeReport(data),
    onError: (error) => {
      const msg = error?.message || "";
      if (msg.includes("No procedure found") || msg.includes("NOT_FOUND")) {
        // Fallback to policyManagement router if policyTemplates.upgradeAll isn't available
        fallbackUpgradeMutation.mutate({ dryRun: true });
      } else {
        toast.error(msg);
      }
    },
  });
  const fallbackUpgradeMutation = (trpc.policyManagement as any).upgradeTemplates?.useMutation({
    onSuccess: (data: any) => setUpgradeReport(data),
    onError: async (error: any) => {
      const msg = error?.message || "";
      await clientSideUpgrade(true);
    },
  });

  // Utility functions moved to top level
  // (globalThis as any).PolicyTemplates_improveContentFallback = improveContentFallback;

  const clientSideUpgrade = async (dryRun: boolean) => {
    const list = templates || [];
    const results: Array<{ id: number; updated: boolean; changes: string[] }> = [];
    for (const tpl of list) {
      const changes: string[] = [];
      let content = tpl.content || "";
      const before = content;
      const title = tpl.name || "Information Security Policy";
      if (!content || content.trim().length === 0) {
        const sectionTitles = Array.isArray(tpl.sections)
          ? (tpl.sections as any[]).map((s: any) => (typeof s === 'object' ? (s.title || 'Section') : String(s))).filter(Boolean)
          : undefined;
        content = buildSkeleton(title, sectionTitles, enhanceBaseline);
        changes.push("skeleton_built_for_empty_template");
      }
      const after = sanitizeHtml(content, title);
      if (after !== before) {
        changes.push("sanitized_html_and_title");
      }
      let updatedSections = tpl.sections;
      if (Array.isArray(updatedSections)) {
        const newSections = updatedSections.map((s: any) => {
          if (s && typeof s === 'object') {
            const body = s.content || s.text || "";
            let nextBody = body;
            if (enhanceBaseline) {
              const isEmpty = !nextBody || nextBody.trim().length < 60 || /\[Content\]/i.test(nextBody);
              if (isEmpty) nextBody = baselineText(s.title || "Section");
            }
            const cleanBody = sanitizeHtml(nextBody, title);
            if (cleanBody !== body) changes.push(`section_${s.id || s.title}_sanitized`);
            return { ...s, content: cleanBody };
          }
          return s;
        });
        updatedSections = newSections as any;
      }
      const updated = changes.length > 0;
      results.push({ id: tpl.id, updated, changes });
      if (updated && !dryRun) {
        await updateMutation.mutateAsync({
          id: tpl.id,
          content: after,
          sections: updatedSections
        } as any);
      }
    }
    const report = {
      templatesProcessed: list.length,
      templatesChanged: results.filter(r => r.updated).length,
      dryRun,
      results
    };
    setUpgradeReport(report);
    if (!dryRun) toast.success("Templates upgraded");
  };

  const filteredTemplates = templates?.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.templateId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getNextTemplateId = () => {
    if (!templates || templates.length === 0) return "POL-001";
    const maxNum = Math.max(...templates.map(t => {
      const match = t.templateId.match(/(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    }));
    return `POL-${String(maxNum + 1).padStart(3, '0')}`;
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFramework) {
      toast.error("Please select a framework");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const sectionsStr = formData.get("sections") as string;
    const sections = sectionsStr.split('\n').filter(s => s.trim());

    // TRANSITION: Save HTML directly to preserve rich formatting.
    const contentToSave = createContent;

    createMutation.mutate({
      templateId: formData.get("templateId") as string,
      name: formData.get("name") as string,
      framework: selectedFramework,
      sections: sections,
      content: contentToSave,
      clientId: selectedClientId || undefined
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>, id: number, content: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const sectionsStr = formData.get("sections") as string;
    const sections = sectionsStr.split('\n').filter(s => s.trim());

    // TRANSITION: Save HTML directly to preserve rich formatting.
    const contentToSave = content;

    updateMutation.mutate({
      id,
      templateId: formData.get("templateId") as string,
      name: formData.get("name") as string,
      framework: formData.get("framework") as string,
      sections: sections,
      content: contentToSave,
    });
  };

  const viewedTemplate = templates?.find(t => t.id === viewingTemplate);

  // Helper to render Content (detecting HTML or Markdown)
  const renderContent = (content: string) => {
    if (!content) return "";

    // Detect if it's already HTML
    const isHtml = /<[a-z][\s\S]*>/i.test(content);

    if (isHtml) return content;

    try {
      return marked.parse(content, { async: false }) as string;
    } catch {
      return content;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: "Policy Templates" },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Policy Templates</h1>
            <p className="text-muted-foreground mt-1">
              Manage reusable policy templates for ISO 27001 and SOC 2
            </p>
          </div>
          <EnhancedDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            title="Create Policy Template"
            description="Create a reusable policy template with placeholders for client-specific details."
            size="xl" // Larger for RTE
            footer={
              <div className="flex justify-end gap-2 w-full">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const form = document.getElementById('create-template-form') as HTMLFormElement;
                    if (form) form.requestSubmit();
                  }}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create Template"}
                </Button>
              </div>
            }
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            }
          >
            <form id="create-template-form" onSubmit={handleCreate} onReset={() => {
              setSelectedFramework("");
              setCreateContent("");
            }}>
              <div className="grid gap-4 py-4 max-h-[75vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="templateId">Template ID *</Label>
                    <Input id="templateId" name="templateId" required defaultValue={getNextTemplateId()} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="framework">Framework *</Label>
                    <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                      <SelectTrigger className={!selectedFramework ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ISO 27001">ISO 27001</SelectItem>
                        <SelectItem value="SOC 2">SOC 2</SelectItem>
                        <SelectItem value="ISO 27001 / SOC 2">ISO 27001 / SOC 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input id="name" name="name" required placeholder="Access Control Policy" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sections">Sections (one per line)</Label>
                  <Textarea
                    name="sections"
                    rows={4}
                    defaultValue={DEFAULT_SECTIONS.join('\n')}
                    placeholder="Purpose&#10;Scope&#10;Policy Statement..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Template Content</Label>
                  <RichTextEditor
                    value={createContent}
                    onChange={setCreateContent}
                    className="min-h-[300px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Available placeholders: {"{{company_name}}"}, {"{{system_scope}}"}, {"{{policy_name}}"}, {"{{effective_date}}"}, {"{{review_date}}"}
                  </p>
                </div>
              </div>
            </form>
          </EnhancedDialog>
          <Button variant="outline" onClick={() => { setIsUpgradeOpen(true); setUpgradeReport(null); }}>
            Upgrade Templates
          </Button>
        </div>

        {/* Quick Guide Card */}
        <Card className="border-blue-100 bg-blue-50/30 overflow-hidden transition-all duration-300">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer hover:bg-blue-50/50" onClick={() => setShowGuide(!showGuide)}>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                <HelpCircle className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold text-blue-900">How to use Policy Templates</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100/50">
              {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <div className={showGuide ? "block" : "hidden"}>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">1</span>
                    Strategic Taxonomy
                  </div>
                  <p className="text-xs text-blue-700/80 leading-relaxed">
                    Link templates to frameworks like ISO 27001 or SOC 2. This creates a <strong>cross-mappable library</strong>, allowing one policy to satisfy multiple control requirements simultaneously.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">2</span>
                    Contextual Automation
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-blue-700/80">Use placeholders to convert generic text into <strong>client-specific legal records</strong>:</p>
                    <div className="flex flex-wrap gap-1">
                      <code className="text-[10px] bg-blue-100/50 px-1 rounded text-blue-700 font-mono">{"{{company_name}}"}</code>
                      <code className="text-[10px] bg-blue-100/50 px-1 rounded text-blue-700 font-mono">{"{{system_scope}}"}</code>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">3</span>
                    Drafting Standards
                  </div>
                  <p className="text-xs text-blue-700/80 leading-relaxed">
                    Maintain <strong>formatting consistency</strong> across your entire library. Standardized headers and tables ensure that every client export looks professional and follows regulatory layout norms.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">4</span>
                    Validation Cycles
                  </div>
                  <p className="text-xs text-blue-700/80 leading-relaxed">
                    Before deploying a template, use <strong>"Preview"</strong> to verify that your logic holds. Ensure all placeholders are correctly formatted so they resolve perfectly during policy generation.
                  </p>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        <EnhancedDialog
          open={isUpgradeOpen}
          onOpenChange={setIsUpgradeOpen}
          title="Upgrade Policy Templates"
          description="Sanitize HTML, enforce titles, fill empty templates, and optionally enhance content."
          size="md"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setIsUpgradeOpen(false)}>Close</Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (upgradeMutation.isPending || fallbackUpgradeMutation?.isPending) return;
                  if (useServerUpgrade) {
                    upgradeMutation.mutate({ dryRun: true });
                  } else {
                    clientSideUpgrade(true);
                  }
                }}
                disabled={upgradeMutation.isPending || fallbackUpgradeMutation?.isPending}
              >
                {(upgradeMutation.isPending || fallbackUpgradeMutation?.isPending) ? "Running..." : "Dry‑run"}
              </Button>
              <Button
                onClick={() => {
                  if (upgradeMutation.isPending || fallbackUpgradeMutation?.isPending) return;
                  if (useServerUpgrade) {
                    upgradeMutation.mutate({ dryRun: false });
                    setTimeout(async () => {
                      if (!upgradeReport) {
                        await clientSideUpgrade(false);
                      }
                    }, 800);
                  } else {
                    clientSideUpgrade(false);
                  }
                }}
                disabled={upgradeMutation.isPending || fallbackUpgradeMutation?.isPending}
              >
                {(upgradeMutation.isPending || fallbackUpgradeMutation?.isPending) ? "Applying..." : "Apply Upgrades"}
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enhanceBaseline"
                checked={enhanceBaseline}
                onChange={(e) => setEnhanceBaseline(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="enhanceBaseline" className="text-sm font-normal">
                Enhance content with baseline boilerplate
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useServerUpgrade"
                checked={useServerUpgrade}
                onChange={(e) => setUseServerUpgrade(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="useServerUpgrade" className="text-sm font-normal">
                Use server route (if available)
              </Label>
            </div>
            {!upgradeReport ? (
              <p className="text-sm text-muted-foreground">Run a dry‑run or apply upgrades.</p>
            ) : (
              <div className="space-y-2">
                <div className="text-sm">
                  Processed: {upgradeReport.templatesProcessed} • Changed: {upgradeReport.templatesChanged} • Dry‑run: {String(upgradeReport.dryRun)}
                </div>
                <div className="border rounded-md max-h-[50vh] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead>Changes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(upgradeReport.results || []).map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.id}</TableCell>
                          <TableCell>{r.updated ? "Yes" : "No"}</TableCell>
                          <TableCell className="text-xs">{(r.changes || []).join(", ") || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </EnhancedDialog>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frameworks</SelectItem>
              <SelectItem value="ISO 27001">ISO 27001</SelectItem>
              <SelectItem value="SOC 2">SOC 2</SelectItem>
              <SelectItem value="ISO 27001 / SOC 2">ISO 27001 / SOC 2</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 border rounded-md p-1 bg-muted/50">
            <ToggleGroup type="single" value={viewMode} onValueChange={(val) => val && setViewMode(val as any)}>
              <ToggleGroupItem value="grid" aria-label="Grid view" className="h-8 w-8 p-0">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Table view" className="h-8 w-8 p-0">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTemplates && filteredTemplates.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => {
                const sections = Array.isArray(template.sections) ? template.sections : [];
                return (
                  <Card key={template.id} className="card-interactive card-accent-left group cursor-pointer" onClick={() => setViewingTemplate(template.id)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-tight">{template.templateId}</span>
                        </div>
                        <CardTitle className="text-xl font-bold">{template.name}</CardTitle>
                        <CardDescription className="text-xs font-medium text-muted-foreground">{template.frameworks?.join(' / ')}</CardDescription>
                      </div>
                      <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">Sections Included</p>
                          <div className="flex flex-wrap gap-1.5">
                            {sections.slice(0, 4).map((section, i) => (
                              <div key={i} className="bg-secondary px-2 py-1 rounded text-[10px] font-medium border border-transparent group-hover:border-secondary-foreground/20 transition-colors">
                                {typeof section === 'object' && section !== null ? (section as { title?: string }).title || 'Section' : String(section)}
                              </div>
                            ))}
                            {sections.length > 4 && (
                              <div className="bg-secondary px-2 py-1 rounded text-[10px] font-medium border border-transparent group-hover:border-secondary-foreground/20 transition-colors">
                                +{sections.length - 4} more
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                          <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-tighter">
                            <CheckCircle2 className="h-3 w-3 text-primary" />
                            Template Ready
                          </span>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 group/trash"
                              onClick={() => setTemplateToDelete(template)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground group-hover/trash:text-destructive transition-colors" />
                            </Button>

                            <EditTemplateDialog
                              template={template}
                              editingTemplate={editingTemplate}
                              setEditingTemplate={setEditingTemplate}
                              updateMutation={updateMutation}
                              handleUpdate={handleUpdate}
                              onGenerate={(t: any) => {
                                setTemplateToGenerate(t);
                                setIsGenerateOpen(true);
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Improve with AI"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImproveTarget(template);
                                setImprovedContent(template.content || "");
                                setImproveInstruction("");
                                setIsImproveOpen(true);
                              }}
                            >
                              <Sparkles className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1.5 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all font-semibold text-xs px-3"
                              onClick={() => {
                                setTemplateToGenerate(template);
                                setIsGenerateOpen(true);
                              }}
                            >
                              Generate
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden shadow-xl bg-white">
              <Table className="table-fancy">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">ID</TableHead>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Frameworks</TableHead>
                    <TableHead>Sections</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => {
                    const sections = Array.isArray(template.sections) ? template.sections : [];
                    return (
                      <TableRow key={template.id}>
                        <TableCell className="font-mono text-sm">{template.templateId}</TableCell>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {template.frameworks?.map((fw, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] uppercase">
                                {fw}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {sections.length} sections
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setViewingTemplate(template.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <EditTemplateDialog
                              template={template}
                              editingTemplate={editingTemplate}
                              setEditingTemplate={setEditingTemplate}
                              updateMutation={updateMutation}
                              handleUpdate={handleUpdate}
                              onGenerate={(t: any) => {
                                setTemplateToGenerate(t);
                                setIsGenerateOpen(true);
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Improve with AI"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImproveTarget(template);
                                setImprovedContent(template.content || "");
                                setImproveInstruction("");
                                setIsImproveOpen(true);
                              }}
                            >
                              <Sparkles className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setTemplateToDelete(template)}
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
          )
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search" : "Get started by creating your first template"}
              </p>
              {(user?.role === 'admin' || user?.role === 'owner' || user?.role === 'super_admin') && !searchQuery && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Template
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* View Template Dialog */}
        <EnhancedDialog
          open={!!viewingTemplate}
          onOpenChange={() => setViewingTemplate(null)}
          title={viewedTemplate?.name}
          description={`${viewedTemplate?.templateId} • ${viewedTemplate?.frameworks?.join(' / ')}`}
          size="xl"
        >
          <div className="max-h-[80vh] overflow-y-auto space-y-4 py-4 pr-2">
            {(() => {
              const sectionsList = viewedTemplate?.sections;
              if (!sectionsList || !Array.isArray(sectionsList) || sectionsList.length === 0) return null;
              return (
                <div>
                  <h4 className="font-medium mb-2">Sections</h4>
                  <div className="flex flex-wrap gap-2">
                    {sectionsList.map((section, i) => (
                      <span key={i} className="px-3 py-1 bg-muted rounded-full text-sm">
                        {String(section)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
            {viewedTemplate?.content && (
              <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                <h4 className="font-medium mb-4 text-sm text-slate-500 uppercase tracking-wider">Preview</h4>
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: renderContent(viewedTemplate.content) }} />
              </div>
            )}
          </div>
        </EnhancedDialog>

        <EnhancedDialog
          open={isImproveOpen}
          onOpenChange={setIsImproveOpen}
          title={`Improve Template${improveTarget ? `: ${improveTarget.name}` : ""}`}
          description="Use AI to enhance clarity, structure, and completeness. Review before saving."
          size="xl"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setIsImproveOpen(false)}>Close</Button>
              <Button
                variant="outline"
                onClick={() => {
                  const form = document.getElementById('ai-improve-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }}
                disabled={isImproving}
              >
                {isImproving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Improvements"
                )}
              </Button>
              <Button
                onClick={() => {
                  if (!improveTarget) return;
                  updateMutation.mutate({
                    id: improveTarget.id,
                    content: improvedContent
                  });
                }}
                disabled={!improvedContent || updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Template"}
              </Button>
            </div>
          }
        >
          <form id="ai-improve-form" onSubmit={(e) => {
            e.preventDefault();
            if (isImproving) return;
            const systemPrompt = "You are an expert compliance policy editor. Improve the provided policy template content: enhance clarity, structure, and completeness; keep headings; avoid placeholders; output clean HTML only.";
            const userPrompt = improvedContent || improveTarget?.content || "";
            const run = async () => {
              setIsImproving(true);
              try {
                const { streamAIContent } = await import("../hooks/useStreamingAI");
                const text = await streamAIContent(
                  {
                    systemPrompt,
                    userPrompt,
                    instruction: improveInstruction,
                    temperature: 0.3
                  },
                  (t: string) => {
                    try {
                      const html = marked.parse(t, { async: false }) as string;
                      setImprovedContent(html);
                    } catch {
                      setImprovedContent(t);
                    }
                  },
                  session?.access_token
                );

                try {
                  const html = marked.parse(text, { async: false }) as string;
                  setImprovedContent(html);
                } catch {
                  setImprovedContent(text);
                }
              } catch (err: any) {
                console.error("Improvement failed:", err);
                toast.error((err && err.message) ? `Improvement failed: ${err.message}. Applied baseline fallback.` : "Improvement failed. Applied baseline fallback.");
                const fn = improveContentFallback;
                const fallback = fn(userPrompt, improveTarget, enhanceBaseline);
                setImprovedContent(fallback);
              } finally {
                setIsImproving(false);
              }
            };
            run();
          }}>
            <div className="grid gap-4 py-4 max-h-[75vh] overflow-y-auto pr-2">
              <div className="grid gap-2">
                <Label htmlFor="instruction">Custom Instructions (optional)</Label>
                <Textarea
                  id="instruction"
                  placeholder="e.g., strengthen access control statements and add exceptions guidance"
                  value={improveInstruction}
                  onChange={(e) => setImproveInstruction(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const fn = improveContentFallback;
                    const fallback = fn(improveTarget?.content || "", improveTarget, enhanceBaseline);
                    setImprovedContent(fallback);
                    toast.success("Applied baseline enhancement without AI");
                  }}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Enhance without AI
                </Button>
              </div>
              <div className="grid gap-2">
                <Label>Improved Content Preview</Label>
                <RichTextEditor
                  value={improvedContent}
                  onChange={setImprovedContent}
                  minHeight="400px"
                />
              </div>
            </div>
          </form>
        </EnhancedDialog>

        <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the policy template
                <span className="font-semibold text-foreground"> "{templateToDelete?.name}"</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={() => {
                  if (templateToDelete) {
                    deleteMutation.mutate({ id: templateToDelete.id });
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Template"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Generate Policy From Template Dialog */}
        <GeneratePolicyDialog
          open={isGenerateOpen}
          onOpenChange={setIsGenerateOpen}
          template={templateToGenerate}
        />
      </div>
    </DashboardLayout>
  );
}

function GeneratePolicyDialog({ open, onOpenChange, template }: { open: boolean, onOpenChange: (open: boolean) => void, template: any }) {
  const { selectedClientId: contextClientId } = useClientContext();
  const { user, session } = useAuth();
  const [_, setLocation] = useLocation();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [customInstruction, setCustomInstruction] = useState("");
  const [tailorToIndustry, setTailorToIndustry] = useState(true);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const { data: clients, isLoading: isLoadingClients } = trpc.clients.list.useQuery({}, {
    enabled: open
  });

  // Effect to default the client ID when dialog opens or context changes
  useEffect(() => {
    if (open) {
      if (contextClientId) {
        setSelectedClientId(contextClientId);
      } else if (clients && clients.length === 1) {
        setSelectedClientId(clients[0].id);
      }
    }
  }, [open, contextClientId, clients]);

  const isAdmin = user?.role === 'admin' || user?.role === 'owner' || user?.role === 'super_admin';

  const generateMutation = trpc.clientPolicies.create.useMutation({
    onSuccess: (data: any) => {
      toast.success("Policy generated successfully");
      onOpenChange(false);
      // Navigate to the new policy
      if (data?.id && data?.clientId) {
        setLocation(`/clients/${data.clientId}/policies/${data.id}`);
      }
    },
    onError: (error) => toast.error(error.message),
  });

  const previewMutation = trpc.policyTemplates.preview.useMutation({
    onSuccess: (data: any) => {
      const title = template?.name || "Information Security Policy";
      const content = data?.content || "";
      const isHtml = /<[a-z][\s\S]*>/i.test(content);
      const html = isHtml ? content : (marked.parse(content, { async: false }) as string);
      const sanitized = sanitizeHtml(html, title);
      setPreviewContent(sanitized);
      setIsGeneratingPreview(false);
    },
    onError: () => {
      const fallback = improveContentFallback(template?.content || "", template);
      setPreviewContent(fallback);
      setIsGeneratingPreview(false);
      toast.warning("Preview unavailable; applied baseline formatting");
    }
  });

  const handleGenerate = () => {
    if (!selectedClientId) {
      toast.error("Please select a client");
      return;
    }

    const title = template?.name || "Information Security Policy";
    const fallbackHtml = improveContentFallback(template?.content || "", template);
    const contentToUse = previewContent || fallbackHtml;

    generateMutation.mutate({
      clientId: selectedClientId,
      templateId: template.id,
      name: template.name,
      content: sanitizeHtml(contentToUse, title),
      tailor: tailorToIndustry,
      instruction: customInstruction || undefined,
      status: 'draft',
      module: 'general'
    });
  };

  return (
    <EnhancedDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Generate Client Policy"
      description={`Create a new policy for a client based on "${template?.name}"`}
      size="lg"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !selectedClientId}
          >
            {generateMutation.isPending ? "Generating..." : "Generate Policy"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-4">
        <div className="grid gap-2">
          <Label>Select Client *</Label>
          <Select
            value={selectedClientId?.toString()}
            onValueChange={(val) => setSelectedClientId(parseInt(val))}
            disabled={!isAdmin && !!selectedClientId} // Lock for non-admins if client is already selected
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoadingClients ? "Loading clients..." : "Select a client"} />
            </SelectTrigger>
            <SelectContent>
              {clients?.map((client: any) => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isAdmin && selectedClientId && (
            <p className="text-xs text-muted-foreground italic">
              Policy will be generated for your active organization.
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="instruction">Custom Instructions (Optional)</Label>
          <Textarea
            id="instruction"
            placeholder="e.g. Include specific requirements for our cloud infrastructure..."
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex">
          <Button
            type="button"
            onClick={() => {
              if (!selectedClientId) {
                toast.error("Please select a client");
                return;
              }
              setIsGeneratingPreview(true);
              previewMutation.mutate({
                clientId: selectedClientId,
                templateId: template?.id,
                tailor: tailorToIndustry,
                instruction: customInstruction || undefined
              });
            }}
            disabled={isGeneratingPreview}
            className="w-full"
          >
            {isGeneratingPreview ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Preview...
              </>
            ) : (
              "Generate Preview"
            )}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="tailor"
            checked={tailorToIndustry}
            onChange={(e) => setTailorToIndustry(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="tailor" className="text-sm font-normal">
            Tailor content to client's industry and context
          </Label>
        </div>

        <div className="grid gap-2">
          <Label>Policy Content Preview</Label>
          <RichTextEditor
            value={previewContent || (template?.content || "")}
            onChange={setPreviewContent}
            minHeight="400px"
          />
        </div>
      </div>
    </EnhancedDialog>
  );
}

function EditTemplateDialog({ template, editingTemplate, setEditingTemplate, updateMutation, handleUpdate, onGenerate }: any) {
  const sections = Array.isArray(template.sections) ? template.sections : [];

  // Convert existing markdown to HTML for RTE
  // We use useMemo to avoid re-parsing on every render, but we need to handle when template changes
  const [content, setContent] = useState(() => {
    const rawContent = template.content || "";
    const isHtml = /<[a-z][\s\S]*>/i.test(rawContent);
    if (isHtml) return rawContent;

    try {
      return marked.parse(rawContent, { async: false }) as string;
    } catch {
      return rawContent;
    }
  });

  return (
    <EnhancedDialog
      open={editingTemplate === template.id}
      onOpenChange={(open) => setEditingTemplate(open ? template.id : null)}
      title="Edit Template"
      size="xl"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button
            type="button"
            variant="secondary"
            className="mr-auto bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            onClick={() => onGenerate(template)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Generate Policy From Template
          </Button>
          <Button type="button" variant="outline" onClick={() => setEditingTemplate(null)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const form = document.getElementById(`edit-template-form-${template.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      }
      trigger={
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Edit className="h-4 w-4" />
        </Button>
      }
    >
      <form
        id={`edit-template-form-${template.id}`}
        onSubmit={(e) => handleUpdate(e, template.id, content)} // Pass RTE content manually
      >
        <div className="grid gap-4 py-4 max-h-[75vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="templateId">Template ID</Label>
              <Input name="templateId" defaultValue={template.templateId} className="border-2 border-slate-300 bg-slate-50 focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="framework">Framework</Label>
              <Select name="framework" defaultValue={template.frameworks?.[0] || ""}>
                <SelectTrigger className="border-2 border-slate-300 bg-slate-50 focus:ring-2 focus:ring-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ISO 27001">ISO 27001</SelectItem>
                  <SelectItem value="SOC 2">SOC 2</SelectItem>
                  <SelectItem value="ISO 27001 / SOC 2">ISO 27001 / SOC 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Template Name</Label>
            <Input name="name" defaultValue={template.name} className="border-2 border-slate-300 bg-slate-50 focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sections">Sections (one per line)</Label>
            <Textarea
              name="sections"
              rows={4}
              className="font-mono text-sm border-2 border-slate-300 bg-slate-50 focus:ring-2 focus:ring-primary/20"
              defaultValue={sections.join('\n')}
            />
          </div>
          <div className="grid gap-2">
            <Label>Template Content</Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              className="min-h-[400px]"
            />
          </div>
        </div>
      </form>
    </EnhancedDialog>
  );
}
